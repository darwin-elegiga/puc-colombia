/**
 * POST /api/sugerir  { q: "descripción de la operación" }
 *
 * Convierte la descripción en un vector con Gemini y devuelve las 5 cuentas o
 * movimientos más parecidos de la base vectorial (data/vectores.json).
 *
 * La clave GEMINI_API_KEY vive solo en el servidor (variables de entorno de
 * Vercel); el navegador nunca la ve. Sin clave o sin base, responde 503 y la
 * aplicación sigue con la búsqueda por palabras.
 */
import base from '@/data/vectores.json'
import { descuantizar, similitud, vectoresGemini, type BaseVectorial } from '@/lib/vectores'

const BASE = base as BaseVectorial
const VECTORES = BASE.items.map((item) => ({ ...item, bytes: descuantizar(item.v) }))
const TOP = 5
/** Varios intentos con modelos de respaldo pueden sumar tiempo: margen para la función de Vercel. */
export const maxDuration = 60

const LARGO_MAXIMO = 300

/** Las mismas consultas se repiten: se guardan las últimas para no gastar cuota. */
const recientes = new Map<string, unknown>()
const RECIENTES_MAXIMO = 200

export async function POST(peticion: Request) {
  const clave = process.env.GEMINI_API_KEY
  if (!clave || VECTORES.length === 0) {
    return Response.json({ error: 'La búsqueda semántica no está configurada' }, { status: 503 })
  }

  const cuerpo = (await peticion.json().catch(() => null)) as { q?: unknown } | null
  const q = typeof cuerpo?.q === 'string' ? cuerpo.q.trim().replace(/\s+/g, ' ') : ''
  if (!q || q.length > LARGO_MAXIMO) {
    return Response.json({ error: `Escribe entre 1 y ${LARGO_MAXIMO} caracteres` }, { status: 400 })
  }

  const llave = q.toLowerCase()
  if (recientes.has(llave)) return Response.json(recientes.get(llave))

  let consulta: number[]
  try {
    ;[consulta] = await vectoresGemini(clave, [{ texto: q }], 'consulta')
  } catch (error) {
    const estado = (error as { estado?: number }).estado
    // 429: se agotó la cuota gratuita del minuto o del día. El cliente sigue con la búsqueda por palabras.
    return Response.json({ error: 'No se pudo consultar el modelo' }, { status: estado === 429 ? 429 : 502 })
  }

  const sugerencias = VECTORES.map((item) => ({
    tipo: item.tipo,
    id: item.id,
    puntaje: Math.round(similitud(consulta, item.bytes, item.escala) * 1000) / 1000,
  }))
    .sort((a, b) => b.puntaje - a.puntaje)
    .slice(0, TOP)

  const resultado = { modelo: BASE.modelo, sugerencias }
  recientes.set(llave, resultado)
  if (recientes.size > RECIENTES_MAXIMO) recientes.delete(recientes.keys().next().value!)
  return Response.json(resultado)
}
