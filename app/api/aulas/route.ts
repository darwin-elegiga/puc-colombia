/**
 * GET  /api/aulas?v=N        aulas públicas abiertas (la CDN la guarda unos segundos).
 *                            Si la versión de la lista sigue siendo N: { sinCambios, version }.
 *                            Sale de la caché de datos: sin cambios, no llega a Upstash.
 * POST /api/aulas            { nombre, docente, publica } → { codigo, clave, aula }
 */
import { ipDe, leerCuerpo, obtenerServicio, responderError, sinConfigurar } from '@/lib/aulasApi'
import { avisarCambioPublicas, publicasEnCache } from '@/lib/aulasPublicas'

export async function GET(peticion: Request) {
  const servicio = obtenerServicio()
  if (!servicio) return sinConfigurar()
  try {
    // Todos los que tienen la app abierta consultan esta ruta: la CDN reparte cada URL unos
    // segundos y, detrás, la caché de datos responde hasta que un aula pública cambie.
    const cache = { 'Cache-Control': 'public, s-maxage=5, stale-while-revalidate=5' }
    const { version, aulas } = await publicasEnCache(servicio)
    if (new URL(peticion.url).searchParams.get('v') === String(version)) {
      return Response.json({ sinCambios: true, version }, { headers: cache })
    }
    return Response.json({ aulas, version }, { headers: cache })
  } catch (error) {
    return responderError(error)
  }
}

export async function POST(peticion: Request) {
  const servicio = obtenerServicio()
  if (!servicio) return sinConfigurar()
  try {
    await servicio.limitar(`crear:${ipDe(peticion)}`, 10, 60 * 60_000)
    const cuerpo = await leerCuerpo(peticion)
    const creada = await servicio.crear({ nombre: cuerpo.nombre, docente: cuerpo.docente, publica: cuerpo.publica })
    if (creada.aula.publica) avisarCambioPublicas()
    return Response.json(creada)
  } catch (error) {
    return responderError(error)
  }
}
