import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
  DURACION_MS, codigoValido, formatoTiempo, generarCodigo, limpiarNombre, nombreUnico, notaSugerida, normalizarCodigo,
  validarFilas, validarNota, type VistaDocente, type VistaEstudiante,
} from '../lib/aulas'
import {
  MAX_IA_POR_AULA, MAX_MIEMBROS, almacenEnMemoria, ErrorAula, leerCredencial, servicioAulas, type Credencial,
} from '../lib/aulasServidor'
import { EJERCICIOS_ASIENTO } from '../lib/practica'

/** Un aula de prueba con reloj controlado: el docente y dos estudiantes. */
async function montar() {
  let ahora = 1_800_000_000_000
  const reloj = () => ahora
  const s = servicioAulas(almacenEnMemoria(reloj), reloj)
  const creada = await s.crear({ nombre: 'Contabilidad I', docente: 'Profe Ana', publica: true })
  const docente = leerCredencial(creada.clave)!
  const a = await s.unirse(creada.codigo, { nombre: 'Luis' })
  const b = await s.unirse(creada.codigo, { nombre: 'luis' })
  return {
    s, codigo: creada.codigo, docente,
    luis: leerCredencial(a.clave)!, luis2: leerCredencial(b.clave)!, nombres: [a.nombre, b.nombre],
    avanzar: (ms: number) => { ahora += ms },
  }
}

const rechaza = async (promesa: Promise<unknown>, estado: number) => {
  await assert.rejects(promesa, (e: unknown) => e instanceof ErrorAula && e.estado === estado)
}

const ejercicio = EJERCICIOS_ASIENTO.find((e) => e.id === 'e-venta-contado')!
const respuesta = ejercicio.solucion.map((l) => ({
  codigo: l.codigo, debe: l.columna === 'debe' ? l.importe : null, haber: l.columna === 'haber' ? l.importe : null,
}))

test('los códigos se generan legibles y se normalizan al escribirlos', () => {
  const codigo = generarCodigo()
  assert.ok(codigoValido(codigo))
  assert.ok(!/[01OIL]/.test(codigo))
  assert.equal(normalizarCodigo(' k7q-2mx '), 'K7Q2MX')
})

test('los nombres se limpian, se rechazan los ofensivos y no se repiten', () => {
  assert.equal(limpiarNombre('  Ana   María \n'), 'Ana María')
  assert.equal(limpiarNombre('   '), null)
  assert.equal(limpiarNombre('Hijue.puta'), null)
  assert.equal(nombreUnico('Ana', ['ana', 'Ana (2)']), 'Ana (3)')
})

test('se validan renglones, notas y tiempos', () => {
  assert.deepEqual(validarFilas([{ codigo: '1105', debe: 100, haber: 50 }, { codigo: '', debe: null, haber: null }]), [
    { codigo: '1105', debe: 100, haber: null },
  ])
  assert.equal(validarFilas([{ codigo: '11a5', debe: 1, haber: null }]), null)
  assert.equal(validarFilas([{ codigo: '1105', debe: -3, haber: null }]), null)
  assert.equal(validarNota(4.25), 4.3)
  assert.equal(validarNota(6), null)
  assert.equal(formatoTiempo(252), '4 min 12 s')
  assert.equal(notaSugerida({ aciertos: 3, total: 4, estados: ['ok', 'ok', 'ok', 'importe', 'sobra'] }), 3)
})

test('crear y unirse: nombres únicos y el aula pública aparece en la lista', async () => {
  const { s, nombres } = await montar()
  assert.deepEqual(nombres, ['Luis', 'luis (2)'])
  const publicas = await s.publicas()
  assert.equal(publicas.length, 1)
  assert.equal(publicas[0].miembros, 2)
})

test('solo el docente lanza, califica, publica y cierra', async () => {
  const { s, codigo, luis, docente } = await montar()
  const impostor: Credencial = { id: 'docente', secreto: 'x'.repeat(32) }
  await rechaza(s.lanzar(codigo, luis, { ejercicio: ejercicio.id }), 403)
  await rechaza(s.lanzar(codigo, impostor, { ejercicio: ejercicio.id }), 403)
  await rechaza(s.cerrar(codigo, luis), 403)
  await s.lanzar(codigo, docente, { ejercicio: ejercicio.id })
})

test('el estudiante no recibe la solución hasta que se publica', async () => {
  const { s, codigo, luis, docente } = await montar()
  const { id } = await s.lanzar(codigo, docente, { ejercicio: ejercicio.id })
  let vista = (await s.estado(codigo, luis)) as VistaEstudiante
  assert.equal(vista.actual?.id, id)
  assert.equal(vista.actual?.solucion, undefined)
  assert.equal(JSON.stringify(vista).includes('explicacion'), false)
  const delDocente = (await s.estado(codigo, docente)) as VistaDocente
  assert.ok(delDocente.ejercicios[0].solucion?.length)

  await s.publicarSolucion(codigo, docente, { ejercicio: id })
  vista = (await s.estado(codigo, luis)) as VistaEstudiante
  assert.ok(vista.actual?.solucion?.length)
  assert.equal(vista.publicados.length, 1)
})

test('el tiempo cuenta desde que le llega el ejercicio; reenviar sustituye hasta la nota', async () => {
  const { s, codigo, luis, luis2, docente, avanzar } = await montar()
  const { id } = await s.lanzar(codigo, docente, { ejercicio: ejercicio.id })
  avanzar(60_000)
  await s.estado(codigo, luis) // aquí le llega: empieza su tiempo
  avanzar(252_000)
  assert.equal((await s.entregar(codigo, luis, { ejercicio: id, filas: respuesta })).segundos, 252)
  avanzar(10_000)
  assert.equal((await s.entregar(codigo, luis, { ejercicio: id, filas: respuesta })).segundos, 262)

  // Quien envía sin haber abierto el estado empieza a contar al enviar.
  assert.equal((await s.entregar(codigo, luis2, { ejercicio: id, filas: respuesta })).segundos, 0)

  await s.calificar(codigo, docente, { ejercicio: id, estudiante: luis.id, nota: 4.5, comentario: 'Bien' })
  await rechaza(s.entregar(codigo, luis, { ejercicio: id, filas: respuesta }), 409)
  const vista = (await s.estado(codigo, docente)) as VistaDocente
  assert.deepEqual(vista.ejercicios[0].entregas.map((e) => e.estudianteId), [luis2.id, luis.id], 'ordenadas por tiempo')
  assert.equal(vista.ejercicios[0].entregas[1].calificacion?.nota, 4.5)
})

test('cerrar el aula rechaza envíos y la saca de la lista pública', async () => {
  const { s, codigo, luis, docente } = await montar()
  const { id } = await s.lanzar(codigo, docente, { ejercicio: ejercicio.id })
  await s.cerrar(codigo, docente)
  await rechaza(s.entregar(codigo, luis, { ejercicio: id, filas: respuesta }), 409)
  await rechaza(s.unirse(codigo, { nombre: 'Tarde' }), 409)
  assert.equal((await s.publicas()).length, 0)
})

test('cerrar la entrada y expulsar', async () => {
  const { s, codigo, luis, docente } = await montar()
  await s.cerrarEntrada(codigo, docente, { cerrada: true })
  await rechaza(s.unirse(codigo, { nombre: 'Tarde' }), 409)
  await s.expulsar(codigo, docente, { estudiante: luis.id })
  await rechaza(s.estado(codigo, luis), 403)
})

test('a las 24 horas el aula deja de existir', async () => {
  const { s, codigo, docente, avanzar } = await montar()
  avanzar(DURACION_MS + 1)
  await rechaza(s.estado(codigo, docente), 404)
  assert.equal((await s.publicas()).length, 0)
})

test('la versión solo cambia cuando cambia algo', async () => {
  const { s, codigo, docente } = await montar()
  const antes = await s.version(codigo)
  await s.estado(codigo, docente)
  assert.equal(await s.version(codigo), antes)
  await s.lanzar(codigo, docente, { ejercicio: ejercicio.id })
  assert.equal(await s.version(codigo), (antes ?? 0) + 1)
})

test('cada uno ve subir su versión solo con lo que le afecta', async () => {
  const { s, codigo, docente, luis, luis2 } = await montar()
  const v = async () => ({ d: await s.version(codigo, docente), a: await s.version(codigo, luis), b: await s.version(codigo, luis2) })
  const sube = (antes: number | null, despues: number | null) => (despues ?? 0) > (antes ?? 0)

  let antes = await v()
  const { id } = await s.lanzar(codigo, docente, { ejercicio: ejercicio.id })
  let ahora = await v()
  assert.ok(sube(antes.d, ahora.d) && sube(antes.a, ahora.a) && sube(antes.b, ahora.b), 'lanzar le llega a todos')

  antes = ahora
  await s.estado(codigo, luis) // le llega el ejercicio: el docente ve subir «lo están resolviendo»
  ahora = await v()
  assert.ok(sube(antes.d, ahora.d))
  assert.equal(ahora.a, antes.a)

  antes = ahora
  await s.entregar(codigo, luis, { ejercicio: id, filas: respuesta })
  ahora = await v()
  assert.ok(sube(antes.d, ahora.d) && sube(antes.a, ahora.a))
  assert.equal(ahora.b, antes.b, 'la entrega de otro no le hace pedir el estado')

  antes = ahora
  await s.calificar(codigo, docente, { ejercicio: id, estudiante: luis.id, nota: 4, comentario: '' })
  ahora = await v()
  assert.ok(sube(antes.d, ahora.d) && sube(antes.a, ahora.a))
  assert.equal(ahora.b, antes.b)

  for (const accion of [
    () => s.publicarSolucion(codigo, docente, { ejercicio: id }),
    () => s.cerrar(codigo, docente),
  ]) {
    antes = await v()
    await accion()
    ahora = await v()
    assert.ok(sube(antes.a, ahora.a) && sube(antes.b, ahora.b))
  }
})

test('unirse, cerrar la entrada y expulsar suben la versión del docente; la expulsión, la del expulsado', async () => {
  const { s, codigo, docente, luis, luis2 } = await montar()
  let antes = await s.version(codigo, docente)
  await s.unirse(codigo, { nombre: 'Marta' })
  assert.ok((await s.version(codigo, docente))! > antes!)
  antes = await s.version(codigo, docente)
  await s.cerrarEntrada(codigo, docente, { cerrada: true })
  assert.ok((await s.version(codigo, docente))! > antes!)
  const deLuis = await s.version(codigo, luis)
  const deLuis2 = await s.version(codigo, luis2)
  await s.expulsar(codigo, docente, { estudiante: luis.id })
  assert.ok((await s.version(codigo, luis))! > deLuis!)
  assert.equal(await s.version(codigo, luis2), deLuis2)
})

test('un aula inexistente o caducada no tiene versión para nadie', async () => {
  const { s, codigo, docente, luis, avanzar } = await montar()
  assert.equal(await s.version('ZZZZZZ', luis), null)
  avanzar(DURACION_MS + 1)
  assert.equal(await s.version(codigo, docente), null)
  assert.equal(await s.version(codigo, luis), null)
})

test('un ejercicio anterior sin publicar no le llega al estudiante, ni su origen', async () => {
  const { s, codigo, luis, docente } = await montar()
  const { id: ej1 } = await s.lanzar(codigo, docente, { ejercicio: ejercicio.id })
  const otro = EJERCICIOS_ASIENTO.find((e) => e.id !== ejercicio.id)!
  const { id: ej2 } = await s.lanzar(codigo, docente, { ejercicio: otro.id })
  const vista = (await s.estado(codigo, luis)) as VistaEstudiante
  assert.equal(vista.actual?.id, ej2)
  assert.equal(vista.publicados.length, 0)
  const texto = JSON.stringify(vista)
  assert.ok(!texto.includes(ejercicio.id) && !texto.includes(otro.id), 'sin origenId')
  assert.equal(vista.actual?.solucion, undefined)
  // Entregar al anterior ya no vale.
  await rechaza(s.entregar(codigo, luis, { ejercicio: ej1, filas: respuesta }), 409)
})

test('la explicación de un ejercicio propio solo llega al publicarlo', async () => {
  const { s, codigo, luis, docente } = await montar()
  const propio = {
    titulo: 'Papelería', enunciado: 'Compras papelería por $100.000 y pagas desde el banco.', explicacion: 'Secreto del docente.',
    filas: [{ codigo: '5195', debe: 100000, haber: null }, { codigo: '1110', debe: null, haber: 100000 }],
  }
  const { id } = await s.lanzar(codigo, docente, { propio })
  assert.ok(!JSON.stringify(await s.estado(codigo, luis)).includes('Secreto'))
  await s.publicarSolucion(codigo, docente, { ejercicio: id })
  assert.ok(JSON.stringify(await s.estado(codigo, luis)).includes('Secreto'))
})

test('un ejercicio propio no admite renglones sin código o sin importe', async () => {
  const { s, codigo, docente } = await montar()
  const base = { titulo: '', enunciado: 'Compras papelería por $100.000 y pagas desde el banco.', explicacion: '' }
  await rechaza(s.lanzar(codigo, docente, { propio: { ...base, filas: [
    { codigo: '5195', debe: 100000, haber: null }, { codigo: '1110', debe: null, haber: 100000 }, { codigo: '1105', debe: null, haber: null },
  ] } }), 400)
  await rechaza(s.lanzar(codigo, docente, { propio: { ...base, filas: [
    { codigo: '5195', debe: 100000, haber: null }, { codigo: '', debe: null, haber: 100000 },
  ] } }), 400)
})

test('el expulsado no puede entregar y las claves de un aula no sirven en otra', async () => {
  const { s, codigo, luis, docente } = await montar()
  const { id } = await s.lanzar(codigo, docente, { ejercicio: ejercicio.id })
  const otra = await s.crear({ nombre: 'Otra', docente: 'Profe B', publica: false })
  await rechaza(s.estado(otra.codigo, luis), 403)
  await rechaza(s.estado(otra.codigo, docente), 403)
  await rechaza(s.lanzar(otra.codigo, docente, { ejercicio: ejercicio.id }), 403)
  await rechaza(s.estado(otra.codigo, null), 401)
  await s.expulsar(codigo, docente, { estudiante: luis.id })
  await rechaza(s.entregar(codigo, luis, { ejercicio: id, filas: respuesta }), 403)
  assert.equal(leerCredencial('Bearer docente'), null)
  assert.equal(leerCredencial('docente.corto'), null)
  assert.equal(leerCredencial('DOCENTE.' + 'x'.repeat(32)), null)
})

test('calificar y publicar: permisos y límites', async () => {
  const { s, codigo, luis, luis2, docente } = await montar()
  const { id } = await s.lanzar(codigo, docente, { ejercicio: ejercicio.id })
  await rechaza(s.calificar(codigo, docente, { ejercicio: id, estudiante: luis.id, nota: 4, comentario: '' }), 404)
  await s.entregar(codigo, luis, { ejercicio: id, filas: respuesta })
  await rechaza(s.calificar(codigo, docente, { ejercicio: id, estudiante: luis.id, nota: 5.5, comentario: '' }), 400)
  await rechaza(s.calificar(codigo, luis2, { ejercicio: id, estudiante: luis.id, nota: 5, comentario: '' }), 403)
  await rechaza(s.publicarSolucion(codigo, luis, { ejercicio: id }), 403)
  await rechaza(s.publicarSolucion(codigo, docente, { ejercicio: 'ej99' }), 404)
})

test('entregas no válidas', async () => {
  const { s, codigo, luis, docente } = await montar()
  const { id } = await s.lanzar(codigo, docente, { ejercicio: ejercicio.id })
  await rechaza(s.entregar(codigo, luis, { ejercicio: id, filas: [] }), 400)
  await rechaza(s.entregar(codigo, luis, { ejercicio: id, filas: [{ codigo: '', debe: null, haber: null }] }), 400)
  await rechaza(s.entregar(codigo, luis, { ejercicio: id, filas: [{ codigo: '1105', debe: 10.5, haber: null }] }), 400)
  const muchas = Array.from({ length: 41 }, () => ({ codigo: '1105', debe: 1, haber: null }))
  await rechaza(s.entregar(codigo, luis, { ejercicio: id, filas: muchas }), 400)
  await rechaza(s.entregar(codigo, docente, { ejercicio: id, filas: respuesta }), 403)
})

test('no se califica a ciegas una entrega que cambió', async () => {
  const { s, codigo, luis, docente, avanzar } = await montar()
  const { id } = await s.lanzar(codigo, docente, { ejercicio: ejercicio.id })
  const primera = await s.entregar(codigo, luis, { ejercicio: id, filas: respuesta })
  avanzar(5_000)
  await s.entregar(codigo, luis, { ejercicio: id, filas: respuesta.slice(0, 1) })
  await rechaza(s.calificar(codigo, docente, { ejercicio: id, estudiante: luis.id, nota: 5, comentario: '', enviada: primera.enviada }), 409)
  const vista = (await s.estado(codigo, docente)) as VistaDocente
  const enviada = vista.ejercicios[0].entregas[0].enviada
  await s.calificar(codigo, docente, { ejercicio: id, estudiante: luis.id, nota: 2, comentario: '', enviada })
})

test('con el aula cerrada se sigue viendo, calificando y publicando', async () => {
  const { s, codigo, luis, docente } = await montar()
  const { id } = await s.lanzar(codigo, docente, { ejercicio: ejercicio.id })
  await s.entregar(codigo, luis, { ejercicio: id, filas: respuesta })
  await s.cerrar(codigo, docente)
  assert.equal(((await s.estado(codigo, luis)) as VistaEstudiante).aula.estado, 'cerrada')
  await s.calificar(codigo, docente, { ejercicio: id, estudiante: luis.id, nota: 5, comentario: '' })
  await s.publicarSolucion(codigo, docente, { ejercicio: id })
  await rechaza(s.lanzar(codigo, docente, { ejercicio: ejercicio.id }), 409)
})

test('el tiempo del estudiante no cambia entre consultas y empieza de cero con cada ejercicio', async () => {
  const { s, codigo, luis, docente, avanzar } = await montar()
  await s.lanzar(codigo, docente, { ejercicio: ejercicio.id })
  const r1 = ((await s.estado(codigo, luis)) as VistaEstudiante).actual!.recibido
  avanzar(30_000)
  assert.equal(((await s.estado(codigo, luis)) as VistaEstudiante).actual!.recibido, r1)
  await s.lanzar(codigo, docente, { ejercicio: EJERCICIOS_ASIENTO[1].id })
  assert.equal(((await s.estado(codigo, luis)) as VistaEstudiante).actual!.recibido, r1! + 30_000)
})

test('un aula no admite más de MAX_MIEMBROS estudiantes', async () => {
  const { s, codigo } = await montar()
  for (let i = 2; i < MAX_MIEMBROS; i++) await s.unirse(codigo, { nombre: `Alumno ${i}` })
  await rechaza(s.unirse(codigo, { nombre: 'Uno más' }), 409)
})

test('los límites de uso cortan con 429 y se reinician con la ventana', async () => {
  const { s, avanzar } = await montar()
  for (let i = 0; i < 3; i++) await s.limitar('prueba:1.2.3.4', 3, 60_000)
  await rechaza(s.limitar('prueba:1.2.3.4', 3, 60_000), 429)
  await s.limitar('prueba:5.6.7.8', 3, 60_000)
  avanzar(60_000)
  await s.limitar('prueba:1.2.3.4', 3, 60_000)
})

test('la sugerencia de IA se guarda por entrega y no gasta cupo al repetirse', async () => {
  const { s, codigo, luis, docente, avanzar } = await montar()
  const { id } = await s.lanzar(codigo, docente, { ejercicio: ejercicio.id })
  await s.entregar(codigo, luis, { ejercicio: id, filas: respuesta })
  const primera = await s.entregaParaIA(codigo, docente, { ejercicio: id, estudiante: luis.id })
  assert.equal(primera.guardada, undefined)
  await s.guardarSugerenciaIA(codigo, { ejercicio: id, estudiante: luis.id, enviada: primera.enviada, sugerencia: { nota: 5 } })
  assert.deepEqual((await s.entregaParaIA(codigo, docente, { ejercicio: id, estudiante: luis.id })).guardada, { nota: 5 })
  avanzar(1000)
  await s.entregar(codigo, luis, { ejercicio: id, filas: respuesta })
  assert.equal((await s.entregaParaIA(codigo, docente, { ejercicio: id, estudiante: luis.id })).guardada, undefined, 'entrega nueva, sugerencia nueva')
  for (let i = 2; i < MAX_IA_POR_AULA; i++) await s.entregaParaIA(codigo, docente, { ejercicio: id, estudiante: luis.id })
  await rechaza(s.entregaParaIA(codigo, docente, { ejercicio: id, estudiante: luis.id }), 429)
})

test('dos acciones del docente a la vez no se pisan', async () => {
  const { s, codigo, docente } = await montar()
  await Promise.all([s.cerrarEntrada(codigo, docente, { cerrada: true }), s.cerrar(codigo, docente)])
  const vista = (await s.estado(codigo, docente)) as VistaDocente
  assert.equal(vista.aula.estado, 'cerrada')
  assert.equal(vista.aula.entradaCerrada, true)
})

test('dos lanzamientos seguidos crean dos ejercicios distintos', async () => {
  const { s, codigo, docente } = await montar()
  const [a, b] = await Promise.all([
    s.lanzar(codigo, docente, { ejercicio: ejercicio.id }),
    s.lanzar(codigo, docente, { ejercicio: EJERCICIOS_ASIENTO[1].id }),
  ])
  assert.notEqual(a.id, b.id)
  assert.equal(((await s.estado(codigo, docente)) as VistaDocente).ejercicios.length, 2)
})

test('el docente lanza su propio ejercicio; se valida que cuadre y no se filtra la solución', async () => {
  const { s, codigo, luis, docente } = await montar()
  const propio = {
    titulo: 'Compra de papelería',
    enunciado: 'Compras papelería por $100.000 y pagas desde el banco.',
    filas: [{ codigo: '5195', debe: 100000, haber: null }, { codigo: '1110', debe: null, haber: 100000 }],
    explicacion: 'Gasto de oficina contra bancos.',
  }
  await rechaza(s.lanzar(codigo, docente, { propio: { ...propio, filas: [propio.filas[0]] } }), 400)
  await rechaza(s.lanzar(codigo, docente, { propio: { ...propio, filas: [propio.filas[0], { codigo: '1110', debe: null, haber: 90000 }] } }), 400)
  await rechaza(s.lanzar(codigo, docente, { propio: { ...propio, enunciado: 'x' } }), 400)
  const { id } = await s.lanzar(codigo, docente, { propio })
  const vista = (await s.estado(codigo, luis)) as VistaEstudiante
  assert.equal(vista.actual?.titulo, 'Compra de papelería')
  assert.equal(vista.actual?.solucion, undefined)
  assert.equal((await s.entregar(codigo, luis, { ejercicio: id, filas: propio.filas })).segundos, 0)
  const paraIA = await s.entregaParaIA(codigo, docente, { ejercicio: id, estudiante: luis.id })
  assert.equal(paraIA.ejercicio.solucion?.length, 2)
  await rechaza(s.entregaParaIA(codigo, luis, { ejercicio: id, estudiante: luis.id }), 403)
})
