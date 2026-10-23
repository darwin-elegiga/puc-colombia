/**
 * POST /api/metricas          un evento de uso anónimo (lib/metricas.ts) → 204
 * GET  /api/metricas?dias=N   el resumen para el panel /metricas; pide el PIN en x-pin.
 */
import { crearAlmacen } from '@/lib/almacenRedis'
import { ipDe } from '@/lib/aulasApi'
import { validarEvento } from '@/lib/metricas'
import { pinCorrecto, servicioMetricas } from '@/lib/metricasServidor'

let servicio: ReturnType<typeof servicioMetricas> | null | undefined

function obtenerServicio() {
  if (servicio === undefined) {
    const almacen = crearAlmacen()
    servicio = almacen ? servicioMetricas(almacen) : null
  }
  return servicio
}

const sinCache = { 'Cache-Control': 'no-store' }

export async function POST(peticion: Request) {
  const s = obtenerServicio()
  // Sin almacén las métricas se pierden en silencio: la app no debe notar nada.
  if (!s) return new Response(null, { status: 204 })
  // sendBeacon manda texto plano: se lee como texto y se interpreta aquí.
  const evento = validarEvento(await peticion.text().then((t) => JSON.parse(t)).catch(() => null))
  if (!evento) return new Response(null, { status: 400 })
  try {
    const aceptado = await s.registrar(evento, ipDe(peticion))
    return new Response(null, { status: aceptado ? 204 : 429 })
  } catch (error) {
    console.error('[metricas]', error)
    return new Response(null, { status: 500 })
  }
}

export async function GET(peticion: Request) {
  const s = obtenerServicio()
  if (!s) return Response.json({ error: 'Las métricas no están disponibles en este servidor.' }, { status: 503, headers: sinCache })
  const ip = ipDe(peticion)
  try {
    if (await s.bloqueado(ip)) {
      return Response.json({ error: 'Demasiados intentos. Espera un cuarto de hora.' }, { status: 429, headers: sinCache })
    }
    if (!pinCorrecto(peticion.headers.get('x-pin'))) {
      await s.fallo(ip)
      return Response.json({ error: 'PIN incorrecto.' }, { status: 401, headers: sinCache })
    }
    const dias = Number(new URL(peticion.url).searchParams.get('dias')) || 7
    return Response.json(await s.resumen(dias), { headers: sinCache })
  } catch (error) {
    console.error('[metricas]', error)
    return Response.json({ error: 'Algo falló en el servidor. Vuelve a intentarlo.' }, { status: 500, headers: sinCache })
  }
}
