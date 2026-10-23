import { test } from 'node:test'
import assert from 'node:assert/strict'
import { diaColombia, diasEntre, leerDispositivo, MAX_MS_PANTALLA, ultimosDias, validarEvento } from '../lib/metricas'

/** La consulta de los últimos 7 días hasta `ahora`, sin filtros. */
const semana = (ahora: number) => ({ desde: diaColombia(ahora - 6 * 86_400_000), hasta: diaColombia(ahora), filtro: {}, visitante: null })
import { almacenEnMemoria } from '../lib/aulasServidor'
import { servicioMetricas } from '../lib/metricasServidor'

const UA = {
  iphone: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1',
  ipad: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Safari/605.1.15',
  android: 'Mozilla/5.0 (Linux; Android 14; SM-S918B) AppleWebKit/537.36 (KHTML, like Gecko) SamsungBrowser/25.0 Chrome/121.0.0.0 Mobile Safari/537.36',
  tabletaAndroid: 'Mozilla/5.0 (Linux; Android 13; SM-X200) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36',
  windowsEdge: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36 Edg/126.0.0.0',
  macFirefox: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 14.5; rv:127.0) Gecko/20100101 Firefox/127.0',
}

test('reconoce el dispositivo por el user agent', () => {
  assert.deepEqual(leerDispositivo(UA.iphone, true, true), { tipo: 'movil', so: 'iOS', navegador: 'Safari', modo: 'instalada' })
  assert.deepEqual(leerDispositivo(UA.ipad, true, false), { tipo: 'tableta', so: 'iOS', navegador: 'Safari', modo: 'navegador' })
  assert.deepEqual(leerDispositivo(UA.android, true, false), { tipo: 'movil', so: 'Android', navegador: 'Samsung', modo: 'navegador' })
  assert.equal(leerDispositivo(UA.tabletaAndroid, true, false).tipo, 'tableta')
  assert.deepEqual(leerDispositivo(UA.windowsEdge, false, false), { tipo: 'escritorio', so: 'Windows', navegador: 'Edge', modo: 'navegador' })
  assert.deepEqual(leerDispositivo(UA.macFirefox, false, false), { tipo: 'escritorio', so: 'macOS', navegador: 'Firefox', modo: 'navegador' })
})

test('solo acepta eventos con valores conocidos', () => {
  assert.equal(validarEvento({ tipo: 'paso', de: 'inicio', a: 'inventada', ms: 10 }), null)
  assert.equal(validarEvento({ tipo: 'inicio', pantalla: 'inicio', dispositivo: { tipo: 'nevera', so: 'iOS', navegador: 'Safari', modo: 'instalada' } }), null)
  assert.equal(validarEvento({ tipo: 'tiempo', pantalla: 'cuenta', ms: 0 }), null)
  assert.equal(validarEvento('basura'), null)
  assert.deepEqual(validarEvento({ tipo: 'paso', de: 'inicio', a: 'cuenta', ms: 1e12, extra: 1 }), { tipo: 'paso', de: 'inicio', a: 'cuenta', ms: MAX_MS_PANTALLA, dispositivo: null })
})

test('los días van en hora de Colombia', () => {
  // 2026-10-23 03:00 UTC son las 22:00 del 22 en Bogotá.
  assert.equal(diaColombia(Date.UTC(2026, 9, 23, 3)), '2026-10-22')
  assert.deepEqual(ultimosDias(Date.UTC(2026, 9, 23, 12), 3), ['2026-10-21', '2026-10-22', '2026-10-23'])
})

test('suma una sesión con su recorrido, su dispositivo y su tiempo', async () => {
  let ahora = Date.UTC(2026, 9, 23, 15)
  const s = servicioMetricas(almacenEnMemoria(() => ahora), () => ahora)
  const dispositivo = leerDispositivo(UA.iphone, true, false)
  await s.registrar({ tipo: 'inicio', pantalla: 'inicio', dispositivo, visitante: null }, '1.1.1.1')
  await s.registrar({ tipo: 'paso', de: 'inicio', a: 'cuenta', ms: 4000, dispositivo }, '1.1.1.1')
  await s.registrar({ tipo: 'paso', de: 'cuenta', a: 'inicio', ms: 6000, dispositivo }, '1.1.1.1')
  await s.registrar({ tipo: 'tiempo', pantalla: 'inicio', ms: 2000, dispositivo }, '1.1.1.1')
  ahora += 86_400_000
  await s.registrar({ tipo: 'inicio', pantalla: 'cuenta', dispositivo: leerDispositivo(UA.windowsEdge, false, false), visitante: null }, '2.2.2.2')

  const r = await s.resumen(semana(ahora))
  assert.equal(r.sesiones, 2)
  assert.equal(r.vistas, 4)
  assert.equal(r.ms, 12000)
  assert.deepEqual(r.porDia.slice(-2).map((d) => d.sesiones), [1, 1])
  assert.deepEqual(r.pantallas.find((p) => p.pantalla === 'inicio'), { pantalla: 'inicio', vistas: 2, ms: 6000 })
  assert.deepEqual(r.pasos.find((p) => p.de === 'entrada' && p.a === 'inicio'), { de: 'entrada', a: 'inicio', n: 1 })
  assert.deepEqual(r.pasos.find((p) => p.de === 'inicio' && p.a === 'cuenta'), { de: 'inicio', a: 'cuenta', n: 1 })
  assert.deepEqual(r.dispositivo.tipo, [{ clave: 'movil', n: 1 }, { clave: 'escritorio', n: 1 }])
  assert.deepEqual(r.dispositivo.so.map((c) => c.clave).sort(), ['Windows', 'iOS'])
})

test('limita los eventos por IP y los intentos de PIN', async () => {
  const s = servicioMetricas(almacenEnMemoria())
  const paso = { tipo: 'paso', de: 'inicio', a: 'cuenta', ms: 0, dispositivo: null } as const
  for (let i = 0; i < 120; i++) assert.equal(await s.registrar(paso, '3.3.3.3'), true)
  assert.equal(await s.registrar(paso, '3.3.3.3'), false)
  assert.equal(await s.registrar(paso, '4.4.4.4'), true)

  for (let i = 0; i < 5; i++) {
    assert.equal(await s.bloqueado('5.5.5.5'), false)
    await s.fallo('5.5.5.5')
  }
  assert.equal(await s.bloqueado('5.5.5.5'), true)
})

test('anota cada entrada con su hora, su dispositivo y si el navegador vuelve', async () => {
  // 2026-10-23 19:30 UTC son las 14:30 en Bogotá.
  let ahora = Date.UTC(2026, 9, 23, 19, 30)
  const s = servicioMetricas(almacenEnMemoria(() => ahora), () => ahora)
  const iphone = leerDispositivo(UA.iphone, true, true)
  const pc = leerDispositivo(UA.windowsEdge, false, false)
  const ana = 'a'.repeat(24)
  await s.registrar({ tipo: 'inicio', pantalla: 'inicio', dispositivo: iphone, visitante: ana }, '1.1.1.1')
  ahora += 3_600_000
  await s.registrar({ tipo: 'inicio', pantalla: 'cuenta', dispositivo: pc, visitante: 'b'.repeat(24) }, '2.2.2.2')
  ahora += 3_600_000
  await s.registrar({ tipo: 'inicio', pantalla: 'inicio', dispositivo: iphone, visitante: ana }, '1.1.1.1')
  await s.registrar({ tipo: 'inicio', pantalla: 'inicio', dispositivo: pc, visitante: null }, '3.3.3.3')

  const hoy = diaColombia(ahora)
  const r = await s.resumen({ desde: hoy, hasta: hoy, filtro: {}, visitante: null })
  assert.equal(r.nuevos, 2)
  assert.equal(r.recurrentes, 1)
  assert.equal(r.porHora[14], 1)
  assert.equal(r.porHora[15], 1)
  assert.equal(r.porHora[16], 2)
  assert.equal(r.entradas.length, 4)
  // De la más reciente a la más antigua; el identificador va recortado.
  assert.deepEqual(r.entradas.map((e) => e.visita), [null, 2, 1, 1])
  assert.equal(r.entradas[1].visitante, 'aaaaaa')
  assert.deepEqual(r.entradas[1].dispositivo, iphone)
  assert.equal(r.entradas[3].t, Date.UTC(2026, 9, 23, 19, 30))
})

test('rechaza identificadores de visitante con otra forma', () => {
  const d = { tipo: 'movil', so: 'iOS', navegador: 'Safari', modo: 'instalada' }
  const e = validarEvento({ tipo: 'inicio', pantalla: 'inicio', dispositivo: d, visitante: 'metricas:otra-clave' })
  assert.equal(e?.tipo === 'inicio' && e.visitante, null)
})

test('filtra todo el panel por dispositivo y las entradas por fechas y por visitante', async () => {
  let ahora = Date.UTC(2026, 9, 20, 15)
  const s = servicioMetricas(almacenEnMemoria(() => ahora), () => ahora)
  const iphone = leerDispositivo(UA.iphone, true, true)
  const pc = leerDispositivo(UA.windowsEdge, false, false)
  const ana = 'a'.repeat(24)
  await s.registrar({ tipo: 'inicio', pantalla: 'inicio', dispositivo: iphone, visitante: ana }, '1.1.1.1')
  await s.registrar({ tipo: 'paso', de: 'inicio', a: 'cuenta', ms: 3000, dispositivo: iphone }, '1.1.1.1')
  ahora += 2 * 86_400_000
  await s.registrar({ tipo: 'inicio', pantalla: 'inicio', dispositivo: pc, visitante: 'b'.repeat(24) }, '2.2.2.2')
  await s.registrar({ tipo: 'paso', de: 'inicio', a: 'clases', ms: 1000, dispositivo: pc }, '2.2.2.2')
  await s.registrar({ tipo: 'inicio', pantalla: 'inicio', dispositivo: iphone, visitante: ana }, '1.1.1.1')

  const todo = await s.resumen(semana(ahora))
  assert.equal(todo.sesiones, 3)
  assert.deepEqual(todo.dispositivo.tipo, [{ clave: 'movil', n: 2 }, { clave: 'escritorio', n: 1 }])

  const moviles = await s.resumen({ ...semana(ahora), filtro: { tipo: 'movil' } })
  assert.equal(moviles.sesiones, 2)
  assert.equal(moviles.recurrentes, 1)
  assert.deepEqual(moviles.pasos.map((p) => `${p.de}>${p.a}`).sort(), ['entrada>inicio', 'inicio>cuenta'])
  assert.equal(moviles.entradas.length, 2)
  assert.ok(moviles.entradas.every((e) => e.dispositivo.tipo === 'movil'))

  const edge = await s.resumen({ ...semana(ahora), filtro: { navegador: 'Edge', modo: 'navegador' } })
  assert.equal(edge.sesiones, 1)
  assert.deepEqual(edge.pantallas.map((p) => p.pantalla).sort(), ['clases', 'inicio'])

  // Solo el primer día: la entrada del 20 de octubre.
  const dia20 = await s.resumen({ desde: '2026-10-20', hasta: '2026-10-20', filtro: {}, visitante: null })
  assert.equal(dia20.sesiones, 1)
  assert.equal(dia20.entradas.length, 1)
  assert.deepEqual(dia20.porDia.map((d) => d.dia), ['2026-10-20'])

  const deAna = await s.resumen({ ...semana(ahora), visitante: 'aaaaaa' })
  assert.deepEqual(deAna.entradas.map((e) => e.visita), [2, 1])
})

test('cuenta los días de un rango, también al cruzar de mes', () => {
  assert.deepEqual(diasEntre('2026-09-29', '2026-10-02'), ['2026-09-29', '2026-09-30', '2026-10-01', '2026-10-02'])
  assert.deepEqual(diasEntre('2026-10-05', '2026-10-05'), ['2026-10-05'])
})
