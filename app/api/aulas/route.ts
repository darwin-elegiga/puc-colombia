/**
 * GET  /api/aulas?v=N        aulas públicas abiertas (la CDN la guarda unos segundos).
 *                            Si la versión de la lista sigue siendo N: { sinCambios, version }
 *                            con un solo comando; así los dispositivos pueden consultar a menudo.
 * POST /api/aulas            { nombre, docente, publica } → { codigo, clave, aula }
 */
import { ipDe, leerCuerpo, obtenerServicio, responderError, sinConfigurar } from '@/lib/aulasApi'

export async function GET(peticion: Request) {
  const servicio = obtenerServicio()
  if (!servicio) return sinConfigurar()
  try {
    // Todos los que tienen la app abierta consultan esta ruta: la CDN reparte cada URL unos
    // segundos y, sin cambios, el almacén responde con un solo comando.
    const cache = { 'Cache-Control': 'public, s-maxage=5, stale-while-revalidate=5' }
    const version = await servicio.versionPublicas()
    if (new URL(peticion.url).searchParams.get('v') === String(version)) {
      return Response.json({ sinCambios: true, version }, { headers: cache })
    }
    return Response.json({ aulas: await servicio.publicas(), version }, { headers: cache })
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
    return Response.json(await servicio.crear({ nombre: cuerpo.nombre, docente: cuerpo.docente, publica: cuerpo.publica }))
  } catch (error) {
    return responderError(error)
  }
}
