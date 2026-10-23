/**
 * POST /api/metricas          un evento de uso anónimo (lib/metricas.ts) → 204
 * GET  /api/metricas          el resumen para el panel /metricas; pide el PIN en x-pin.
 *      ?desde=AAAA-MM-DD&hasta=AAAA-MM-DD   el periodo (o ?dias=N, los últimos N días)
 *      &tipo=&so=&navegador=&modo=          solo ese dispositivo
 *      &visitante=abc123                    solo las entradas de ese navegador
 */
import { crearAlmacen } from '@/lib/almacenRedis'
import { ipDe } from '@/lib/aulasApi'
import { DIA_VALIDO, diaColombia, leerFiltro, validarEvento } from '@/lib/metricas'
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
    const parametros = new URL(peticion.url).searchParams
    const hoy = Date.now()
    const dias = Math.max(1, Number(parametros.get('dias')) || 7)
    const desde = parametros.get('desde') ?? ''
    const hasta = parametros.get('hasta') ?? ''
    const visitante = parametros.get('visitante') ?? ''
    const resumen = await s.resumen({
      desde: DIA_VALIDO.test(desde) ? desde : diaColombia(hoy - (dias - 1) * 86_400_000),
      hasta: DIA_VALIDO.test(hasta) ? hasta : diaColombia(hoy),
      filtro: leerFiltro(parametros),
      visitante: /^[a-z0-9]{6}$/.test(visitante) ? visitante : null,
    })
    return Response.json(resumen, { headers: sinCache })
  } catch (error) {
    console.error('[metricas]', error)
    return Response.json({ error: 'Algo falló en el servidor. Vuelve a intentarlo.' }, { status: 500, headers: sinCache })
  }
}
