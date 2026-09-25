/**
 * POST /api/asiento  { situacion: "Pagué el arriendo del local por 2.000.000" }
 *
 * Asiento propuesto por Gemini (beta). La aplicación solo lo llama cuando el
 * usuario lo pide, después de que la propuesta local no encontró una operación
 * parecida o no le convenció. Ver lib/asientoIA.ts.
 */
import { asientoIA } from '@/lib/asientoIA'

const LARGO_MAXIMO = 600

export async function POST(peticion: Request) {
  const clave = process.env.GEMINI_API_KEY
  if (!clave) return Response.json({ error: 'La IA no está configurada' }, { status: 503 })

  const cuerpo = (await peticion.json().catch(() => null)) as { situacion?: unknown } | null
  const situacion = typeof cuerpo?.situacion === 'string' ? cuerpo.situacion.trim().replace(/\s+/g, ' ') : ''
  if (situacion.length < 8 || situacion.length > LARGO_MAXIMO) {
    return Response.json({ error: `Describe la situación en 8 a ${LARGO_MAXIMO} caracteres` }, { status: 400 })
  }

  try {
    return Response.json(await asientoIA(clave, situacion))
  } catch (error) {
    const estado = (error as { estado?: number }).estado
    return Response.json(
      { error: estado === 429 ? 'Se agotó la cuota gratuita por ahora' : 'No se pudo obtener el asiento' },
      { status: estado === 429 ? 429 : 502 },
    )
  }
}
