/**
 * GET  /api/aulas            aulas públicas abiertas (la CDN la guarda unos segundos)
 * POST /api/aulas            { nombre, docente, publica } → { codigo, clave, aula }
 */
import { ipDe, leerCuerpo, obtenerServicio, responderError, sinConfigurar } from '@/lib/aulasApi'

export async function GET() {
  const servicio = obtenerServicio()
  if (!servicio) return sinConfigurar()
  try {
    // Todos los que tienen la app abierta consultan esta lista: la CDN la reparte y el
    // almacén solo se consulta cada pocos segundos.
    return Response.json(
      { aulas: await servicio.publicas() },
      { headers: { 'Cache-Control': 'public, s-maxage=10, stale-while-revalidate=20' } },
    )
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
