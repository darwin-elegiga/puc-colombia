/**
 * POST /api/explicar  { clave?: "pago-arriendo", operacion: "...", renglones: [...] }
 *
 * Amplía con Gemini la explicación local de un asiento (beta). La aplicación solo
 * lo llama cuando el usuario pulsa el botón, al final de la explicación local.
 * La misma operación se sirve de la caché: cada una se paga una sola vez por
 * instancia del servidor. Ver lib/explicacionIA.ts.
 */
import { depurarRenglones, explicacionIA } from '@/lib/explicacionIA'

const LARGO_MAXIMO = 600
const recientes = new Map<string, unknown>()
const RECIENTES_MAXIMO = 300

export async function POST(peticion: Request) {
  if (!process.env.GEMINI_API_KEY) return Response.json({ error: 'La IA no está configurada' }, { status: 503 })

  const cuerpo = (await peticion.json().catch(() => null)) as { clave?: unknown; operacion?: unknown; renglones?: unknown } | null
  const operacion = typeof cuerpo?.operacion === 'string' ? cuerpo.operacion.trim().replace(/\s+/g, ' ').slice(0, LARGO_MAXIMO) : ''
  const renglones = depurarRenglones(cuerpo?.renglones)
  if (!operacion || !renglones.some((r) => r.efecto === 'debito') || !renglones.some((r) => r.efecto === 'credito')) {
    return Response.json({ error: 'Falta la operación o un asiento con débito y crédito' }, { status: 400 })
  }

  // Las operaciones conocidas se identifican por su id; las demás, por su texto. El
  // asiento va siempre en la clave, para que un id no pueda servir otra respuesta.
  const firma = renglones.map((r) => `${r.efecto[0]}${r.codigo}`).join(',')
  const clave =
    typeof cuerpo?.clave === 'string' && /^[a-z0-9-]{1,80}$/.test(cuerpo.clave)
      ? `${cuerpo.clave}|${firma}`
      : `${operacion.toLowerCase()}|${firma}`
  const guardada = recientes.get(clave)
  if (guardada) return Response.json(guardada)

  try {
    const respuesta = await explicacionIA(operacion, renglones)
    if (recientes.size >= RECIENTES_MAXIMO) recientes.delete(recientes.keys().next().value!)
    recientes.set(clave, respuesta)
    return Response.json(respuesta)
  } catch (error) {
    const estado = (error as { estado?: number }).estado
    return Response.json(
      { error: estado === 429 ? 'Se agotó la cuota gratuita por ahora' : 'No se pudo ampliar la explicación' },
      { status: estado === 429 ? 429 : estado === 503 ? 503 : 502 },
    )
  }
}
