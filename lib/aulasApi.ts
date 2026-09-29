/**
 * Piezas comunes de las rutas /api/aulas: el servicio sobre el almacén y la forma de
 * responder los errores.
 */
import { crearAlmacen } from './almacenRedis'
import { ErrorAula, servicioAulas, type ServicioAulas } from './aulasServidor'

let servicio: ServicioAulas | null | undefined

/** El servicio de aulas, o null si el almacén no está configurado. */
export function obtenerServicio(): ServicioAulas | null {
  if (servicio === undefined) {
    const almacen = crearAlmacen()
    servicio = almacen ? servicioAulas(almacen) : null
  }
  return servicio
}

export const sinConfigurar = () =>
  Response.json({ error: 'Las aulas todavía no están disponibles en este servidor.' }, { status: 503 })

/** Convierte los errores del servicio en respuestas; los demás se registran y dan 500. */
export function responderError(error: unknown) {
  if (error instanceof ErrorAula) return Response.json({ error: error.message }, { status: error.estado })
  console.error('[aulas]', error)
  return Response.json({ error: 'Algo falló en el servidor. Vuelve a intentarlo.' }, { status: 500 })
}

export async function leerCuerpo(peticion: Request): Promise<Record<string, unknown>> {
  const cuerpo = await peticion.json().catch(() => null)
  return cuerpo && typeof cuerpo === 'object' && !Array.isArray(cuerpo) ? (cuerpo as Record<string, unknown>) : {}
}

/** La IP de quien llama (Vercel la pone la primera en x-forwarded-for), para los límites de uso. */
export function ipDe(peticion: Request): string {
  const reenviada = peticion.headers.get('x-forwarded-for')?.split(',')[0]
  const ip = (reenviada ?? peticion.headers.get('x-real-ip') ?? '').trim().toLowerCase()
  return /^[0-9a-f.:]{3,45}$/.test(ip) ? ip : 'desconocida'
}
