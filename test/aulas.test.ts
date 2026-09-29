import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
  DURACION_MS, codigoValido, formatoTiempo, generarCodigo, limpiarNombre, nombreUnico, notaSugerida, normalizarCodigo,
  notaDelQuiz, validarFilas, validarNota, validarRespuestas, type VistaDocente, type VistaEstudiante,
} from '../lib/aulas'
import { MAX_EJERCICIOS } from '../lib/aulas'
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
const otro = EJERCICIOS_ASIENTO.find((e) => e.id !== ejercicio.id)!
const bien = (e: typeof ejercicio) =>
  e.solucion.map((l) => ({ codigo: l.codigo, debe: l.columna === 'debe' ? l.importe : null, haber: l.columna === 'haber' ? l.importe : null }))
const respuesta = bien(ejercicio)

/** Un quiz con dos ejercicios del catálogo, ya empezado. */
async function quizEmpezado(limiteMin: number | null = null) {
  const m = await montar()
  const { id: ej1 } = await m.s.agregar(m.codigo, m.docente, { ejercicio: ejercicio.id })
  const { id: ej2 } = await m.s.agregar(m.codigo, m.docente, { ejercicio: otro.id })
  await m.s.empezar(m.codigo, m.docente, { limiteMin })
  return { ...m, ej1, ej2 }
}

const propio = {
  titulo: 'Compra de papelería',
  enunciado: 'Compras papelería por $100.000 y pagas desde el banco.',
  filas: [{ codigo: '5195', debe: 100000, haber: null }, { codigo: '1110', debe: null, haber: 100000 }],
  explicacion: 'Gasto de oficina contra bancos.',
}

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
  assert.deepEqual(validarFilas([{ codigo: '1105', debe: 0, haber: 50 }]), [{ codigo: '1105', debe: null, haber: 50 }])
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

test('nota del quiz: la de cada ejercicio y su promedio; respuestas solo de ejercicios del quiz', () => {
  const ejs = [
    { id: 'ej1', solucion: ejercicio.solucion },
    { id: 'ej2', solucion: otro.solucion },
  ] as Parameters<typeof notaDelQuiz>[0]
  const r = notaDelQuiz(ejs, { ej1: respuesta })
  assert.equal(r.porEjercicio.ej1, 5)
  assert.equal(r.porEjercicio.ej2, 0)
  assert.equal(r.promedio, 2.5)
  assert.deepEqual(validarRespuestas({ ej1: respuesta, ej2: [] }, ['ej1', 'ej2']), { ej1: respuesta })
  assert.equal(validarRespuestas({ ej9: respuesta }, ['ej1']), null)
  assert.equal(validarRespuestas([respuesta], ['ej1']), null)
})

test('solo el docente prepara, empieza, califica, publica y cierra', async () => {
  const { s, codigo, luis, docente } = await montar()
  const impostor: Credencial = { id: 'docente', secreto: 'x'.repeat(32) }
  await rechaza(s.agregar(codigo, luis, { ejercicio: ejercicio.id }), 403)
  await rechaza(s.agregar(codigo, impostor, { ejercicio: ejercicio.id }), 403)
  await rechaza(s.empezar(codigo, luis, { limiteMin: null }), 403)
  await rechaza(s.cerrar(codigo, luis), 403)
  await rechaza(s.publicarSolucion(codigo, luis), 403)
  await s.agregar(codigo, docente, { ejercicio: ejercicio.id })
})

test('antes de empezar el estudiante no ve ejercicios; al empezar ve todos, sin solución ni origen', async () => {
  const { s, codigo, luis, docente } = await montar()
  const { id } = await s.agregar(codigo, docente, { ejercicio: ejercicio.id })
  await s.agregar(codigo, docente, { propio })
  let vista = (await s.estado(codigo, luis)) as VistaEstudiante
  assert.deepEqual(vista.quiz, { estado: 'preparando', enviado: false })
  assert.equal(vista.ejercicios.length, 0)
  await rechaza(s.entregar(codigo, luis, { respuestas: { [id]: respuesta } }), 409)

  await s.empezar(codigo, docente, { limiteMin: null })
  vista = (await s.estado(codigo, luis)) as VistaEstudiante
  assert.deepEqual(vista.quiz, { estado: 'en-curso', enviado: false })
  assert.equal(vista.ejercicios.length, 2)
  assert.ok(vista.ejercicios.every((e) => e.solucion === undefined && e.origenId === ''))
  const texto = JSON.stringify(vista)
  assert.ok(!texto.includes('explicacion') && !texto.includes(ejercicio.id))
  const delDocente = (await s.estado(codigo, docente)) as VistaDocente
  assert.equal(delDocente.modo, 'quiz')
  assert.ok(delDocente.ejercicios.every((e) => e.solucion?.length))
})

test('una vez empezado no se añaden ni quitan ejercicios; sin ejercicios no se empieza', async () => {
  const { s, codigo, docente } = await montar()
  await rechaza(s.empezar(codigo, docente, { limiteMin: null }), 400)
  const { id } = await s.agregar(codigo, docente, { ejercicio: ejercicio.id })
  const { id: sobra } = await s.agregar(codigo, docente, { ejercicio: otro.id })
  await s.quitar(codigo, docente, { ejercicio: sobra })
  await rechaza(s.empezar(codigo, docente, { limiteMin: 0 }), 400)
  await rechaza(s.empezar(codigo, docente, { limiteMin: 1.5 }), 400)
  await s.empezar(codigo, docente, { limiteMin: 30 })
  await rechaza(s.agregar(codigo, docente, { ejercicio: otro.id }), 409)
  await rechaza(s.quitar(codigo, docente, { ejercicio: id }), 409)
  await rechaza(s.empezar(codigo, docente, { limiteMin: null }), 409)
  const vista = (await s.estado(codigo, docente)) as VistaDocente
  assert.deepEqual(vista.ejercicios.map((e) => e.id), [id])
  assert.equal(vista.aula.limiteMin, 30)
})

test('un quiz tiene como mucho MAX_EJERCICIOS ejercicios', async () => {
  const { s, codigo, docente } = await montar()
  for (let i = 0; i < MAX_EJERCICIOS; i++) await s.agregar(codigo, docente, { ejercicio: EJERCICIOS_ASIENTO[i].id })
  await rechaza(s.agregar(codigo, docente, { ejercicio: ejercicio.id }), 409)
})

test('el quiz se envía una sola vez y el tiempo cuenta desde que el estudiante lo abre', async () => {
  const { s, codigo, luis, luis2, docente, ej1, ej2, avanzar } = await quizEmpezado()
  avanzar(60_000)
  await s.estado(codigo, luis) // aquí lo abre: empieza su tiempo
  avanzar(252_000)
  assert.equal((await s.entregar(codigo, luis, { respuestas: { [ej1]: respuesta } })).segundos, 252)
  await rechaza(s.entregar(codigo, luis, { respuestas: { [ej1]: respuesta, [ej2]: bien(otro) } }), 409)
  // Quien envía sin haber abierto el estado empieza a contar al enviar.
  assert.equal((await s.entregar(codigo, luis2, { respuestas: {} })).segundos, 0)

  const vista = (await s.estado(codigo, docente)) as VistaDocente
  assert.deepEqual(vista.entregas.map((e) => e.estudianteId), [luis2.id, luis.id], 'ordenadas por tiempo')
  assert.deepEqual(vista.entregas[1].respuestas, { [ej1]: respuesta })
  assert.equal(vista.empezados, 2)
  const suya = (await s.estado(codigo, luis)) as VistaEstudiante
  assert.deepEqual(suya.quiz, { estado: 'en-curso', enviado: true })
})

test('con tiempo límite: fin por estudiante y envíos fuera de plazo rechazados', async () => {
  const { s, codigo, luis, luis2, ej1, avanzar } = await quizEmpezado(10)
  const vista = (await s.estado(codigo, luis)) as VistaEstudiante
  assert.equal(vista.fin, vista.recibido! + 10 * 60_000)
  await s.estado(codigo, luis2)
  avanzar(10 * 60_000 + 30_000) // dentro del margen: el envío automático llega tarde
  assert.equal((await s.entregar(codigo, luis, { respuestas: { [ej1]: respuesta } })).segundos, 600, 'el tiempo no pasa del límite')
  avanzar(5 * 60_000)
  await rechaza(s.entregar(codigo, luis2, { respuestas: {} }), 409)
})

test('el docente emite la nota, con la de cada ejercicio, y la puede corregir', async () => {
  const { s, codigo, luis, luis2, docente, ej1, ej2 } = await quizEmpezado()
  await rechaza(s.calificar(codigo, docente, { estudiante: luis.id, nota: 4, comentario: '' }), 404)
  await s.entregar(codigo, luis, { respuestas: { [ej1]: respuesta } })
  await rechaza(s.calificar(codigo, docente, { estudiante: luis.id, nota: 5.5, comentario: '' }), 400)
  await rechaza(s.calificar(codigo, docente, { estudiante: luis.id, nota: 3, comentario: '', porEjercicio: { ej99: 3 } }), 400)
  await rechaza(s.calificar(codigo, docente, { estudiante: luis.id, nota: 3, comentario: '', porEjercicio: { [ej1]: 7 } }), 400)
  await rechaza(s.calificar(codigo, luis2, { estudiante: luis.id, nota: 5, comentario: '' }), 403)
  await s.calificar(codigo, docente, { estudiante: luis.id, nota: 2.5, comentario: 'Falta el segundo', porEjercicio: { [ej1]: 5, [ej2]: 0 } })
  await s.calificar(codigo, docente, { estudiante: luis.id, nota: 3, comentario: 'Revisada', porEjercicio: { [ej1]: 5, [ej2]: 1 } })
  const vista = (await s.estado(codigo, luis)) as VistaEstudiante
  assert.equal(vista.entrega?.calificacion?.nota, 3)
  assert.deepEqual(vista.entrega?.calificacion?.porEjercicio, { [ej1]: 5, [ej2]: 1 })
})

test('publicar las soluciones: le llegan todas al estudiante, con su respuesta y su nota', async () => {
  const { s, codigo, luis, luis2, docente, ej1, ej2 } = await quizEmpezado()
  await s.entregar(codigo, luis, { respuestas: { [ej1]: respuesta } })
  await s.calificar(codigo, docente, { estudiante: luis.id, nota: 2.5, comentario: '' })
  let vista = (await s.estado(codigo, luis)) as VistaEstudiante
  assert.equal(vista.publicados.length, 0)
  await s.publicarSolucion(codigo, docente)
  vista = (await s.estado(codigo, luis)) as VistaEstudiante
  assert.deepEqual(vista.publicados.map((e) => e.id), [ej1, ej2])
  assert.ok(vista.ejercicios.every((e) => e.solucion?.length))
  assert.deepEqual(vista.publicados[0].entrega?.filas, respuesta)
  assert.deepEqual(vista.publicados[1].entrega?.filas, [])
  assert.equal(vista.publicados[0].entrega?.calificacion?.nota, 2.5)
  const sinEnvio = (await s.estado(codigo, luis2)) as VistaEstudiante
  assert.equal(sinEnvio.publicados[0].entrega, null)
})

test('la explicación de un ejercicio propio solo llega al publicar', async () => {
  const { s, codigo, luis, docente } = await montar()
  await s.agregar(codigo, docente, { propio: { ...propio, explicacion: 'Secreto del docente.' } })
  await s.empezar(codigo, docente, { limiteMin: null })
  assert.ok(!JSON.stringify(await s.estado(codigo, luis)).includes('Secreto'))
  await s.publicarSolucion(codigo, docente)
  assert.ok(JSON.stringify(await s.estado(codigo, luis)).includes('Secreto'))
})

test('un ejercicio propio se valida: cuadra, tiene enunciado y cada renglón código e importe', async () => {
  const { s, codigo, docente } = await montar()
  await rechaza(s.agregar(codigo, docente, { propio: { ...propio, filas: [propio.filas[0]] } }), 400)
  await rechaza(s.agregar(codigo, docente, { propio: { ...propio, filas: [propio.filas[0], { codigo: '1110', debe: null, haber: 90000 }] } }), 400)
  await rechaza(s.agregar(codigo, docente, { propio: { ...propio, enunciado: 'x' } }), 400)
  await rechaza(s.agregar(codigo, docente, { propio: { ...propio, filas: [...propio.filas, { codigo: '1105', debe: null, haber: null }] } }), 400)
  await rechaza(s.agregar(codigo, docente, { propio: { ...propio, filas: [propio.filas[0], { codigo: '', debe: null, haber: 100000 }] } }), 400)
  await s.agregar(codigo, docente, { propio })
})

test('entregas no válidas: se rechaza la forma, pero un renglón malo no tumba el quiz', async () => {
  const { s, codigo, luis, luis2, docente, ej1, ej2 } = await quizEmpezado()
  await rechaza(s.entregar(codigo, luis, { respuestas: [] }), 400)
  await rechaza(s.entregar(codigo, luis, { respuestas: { ej99: respuesta } }), 400)
  await rechaza(s.entregar(codigo, luis, { respuestas: { [ej1]: 'nada' } }), 400)
  await rechaza(s.entregar(codigo, docente, { respuestas: {} }), 403)
  const muchas = Array.from({ length: 41 }, () => ({ codigo: '1105', debe: 1, haber: null }))
  await s.entregar(codigo, luis, {
    respuestas: {
      [ej1]: [...respuesta, { codigo: '1105', debe: 10.5, haber: null }, { codigo: '11a5', debe: 1, haber: null }, { codigo: '2408', debe: 0, haber: null }],
      [ej2]: muchas,
    },
  })
  await s.entregar(codigo, luis2, { respuestas: {} })
  const vista = (await s.estado(codigo, docente)) as VistaDocente
  const deLuis = vista.entregas.find((e) => e.estudianteId === luis.id)!
  assert.deepEqual(deLuis.respuestas[ej1], [...respuesta, { codigo: '2408', debe: null, haber: null }], 'el importe 0 es un renglón sin importe')
  assert.equal(deLuis.respuestas[ej2].length, 40)
})

test('con las soluciones publicadas ya no se puede enviar', async () => {
  const { s, codigo, luis, docente, ej1 } = await quizEmpezado()
  await s.publicarSolucion(codigo, docente)
  await rechaza(s.entregar(codigo, luis, { respuestas: { [ej1]: respuesta } }), 409)
})

test('cerrar el aula rechaza envíos y la saca de la lista pública; se sigue calificando y publicando', async () => {
  const { s, codigo, luis, luis2, docente, ej1 } = await quizEmpezado()
  await s.entregar(codigo, luis, { respuestas: { [ej1]: respuesta } })
  await s.cerrar(codigo, docente)
  await rechaza(s.entregar(codigo, luis2, { respuestas: {} }), 409)
  await rechaza(s.unirse(codigo, { nombre: 'Tarde' }), 409)
  assert.equal((await s.publicas()).length, 0)
  const vista = (await s.estado(codigo, luis)) as VistaEstudiante
  assert.equal(vista.quiz.estado, 'cerrado')
  await s.calificar(codigo, docente, { estudiante: luis.id, nota: 5, comentario: '' })
  await s.publicarSolucion(codigo, docente)
})

test('cerrar la entrada y expulsar', async () => {
  const { s, codigo, luis, docente, ej1 } = await quizEmpezado()
  await s.cerrarEntrada(codigo, docente, { cerrada: true })
  await rechaza(s.unirse(codigo, { nombre: 'Tarde' }), 409)
  await s.expulsar(codigo, docente, { estudiante: luis.id })
  await rechaza(s.estado(codigo, luis), 403)
  await rechaza(s.entregar(codigo, luis, { respuestas: { [ej1]: respuesta } }), 403)
})

test('a las 24 horas el aula deja de existir', async () => {
  const { s, codigo, docente, avanzar } = await montar()
  avanzar(DURACION_MS + 1)
  await rechaza(s.estado(codigo, docente), 404)
  assert.equal((await s.publicas()).length, 0)
})

test('cada uno ve subir su versión solo con lo que le afecta', async () => {
  const { s, codigo, docente, luis, luis2 } = await montar()
  const v = async () => ({ d: await s.version(codigo, docente), a: await s.version(codigo, luis), b: await s.version(codigo, luis2) })
  const sube = (antes: number | null, despues: number | null) => (despues ?? 0) > (antes ?? 0)

  let antes = await v()
  await s.estado(codigo, docente)
  assert.deepEqual(await v(), antes, 'consultar no cambia nada')

  const { id } = await s.agregar(codigo, docente, { ejercicio: ejercicio.id })
  let ahora = await v()
  assert.ok(sube(antes.d, ahora.d))
  assert.equal(ahora.a, antes.a, 'preparar el quiz no molesta a los estudiantes')

  antes = ahora
  await s.empezar(codigo, docente, { limiteMin: null })
  ahora = await v()
  assert.ok(sube(antes.d, ahora.d) && sube(antes.a, ahora.a) && sube(antes.b, ahora.b), 'empezar le llega a todos')

  antes = ahora
  await s.estado(codigo, luis) // lo abre: el docente ve subir «lo están resolviendo»
  ahora = await v()
  assert.ok(sube(antes.d, ahora.d))
  assert.equal(ahora.a, antes.a)

  antes = ahora
  await s.entregar(codigo, luis, { respuestas: { [id]: respuesta } })
  ahora = await v()
  assert.ok(sube(antes.d, ahora.d) && sube(antes.a, ahora.a))
  assert.equal(ahora.b, antes.b, 'el envío de otro no le hace pedir el estado')

  antes = ahora
  await s.calificar(codigo, docente, { estudiante: luis.id, nota: 4, comentario: '' })
  ahora = await v()
  assert.ok(sube(antes.d, ahora.d) && sube(antes.a, ahora.a))
  assert.equal(ahora.b, antes.b)

  for (const accion of [() => s.publicarSolucion(codigo, docente), () => s.cerrar(codigo, docente)]) {
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

test('las claves de un aula no sirven en otra', async () => {
  const { s, luis, docente } = await montar()
  const otra = await s.crear({ nombre: 'Otra', docente: 'Profe B', publica: false })
  await rechaza(s.estado(otra.codigo, luis), 403)
  await rechaza(s.estado(otra.codigo, docente), 403)
  await rechaza(s.agregar(otra.codigo, docente, { ejercicio: ejercicio.id }), 403)
  await rechaza(s.estado(otra.codigo, null), 401)
  assert.equal(leerCredencial('Bearer docente'), null)
  assert.equal(leerCredencial('docente.corto'), null)
  assert.equal(leerCredencial('DOCENTE.' + 'x'.repeat(32)), null)
})

test('el tiempo del estudiante no cambia entre consultas', async () => {
  const { s, codigo, luis, avanzar } = await quizEmpezado()
  const r1 = ((await s.estado(codigo, luis)) as VistaEstudiante).recibido
  avanzar(30_000)
  assert.equal(((await s.estado(codigo, luis)) as VistaEstudiante).recibido, r1)
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

test('la IA sugiere por ejercicio, solo para el docente, se guarda y tiene tope por aula', async () => {
  const { s, codigo, luis, docente, ej1, ej2 } = await quizEmpezado()
  await s.entregar(codigo, luis, { respuestas: { [ej1]: respuesta } })
  await rechaza(s.entregaParaIA(codigo, luis, { ejercicio: ej1, estudiante: luis.id }), 403)
  const primera = await s.entregaParaIA(codigo, docente, { ejercicio: ej1, estudiante: luis.id })
  assert.equal(primera.guardada, undefined)
  assert.deepEqual(primera.filas, respuesta)
  assert.ok(primera.ejercicio.solucion?.length)
  assert.deepEqual((await s.entregaParaIA(codigo, docente, { ejercicio: ej2, estudiante: luis.id })).filas, [])
  await s.guardarSugerenciaIA(codigo, { ejercicio: ej1, estudiante: luis.id, enviada: primera.enviada, sugerencia: { nota: 5 } })
  assert.deepEqual((await s.entregaParaIA(codigo, docente, { ejercicio: ej1, estudiante: luis.id })).guardada, { nota: 5 })
  for (let i = 2; i < MAX_IA_POR_AULA; i++) await s.entregaParaIA(codigo, docente, { ejercicio: ej2, estudiante: luis.id })
  await rechaza(s.entregaParaIA(codigo, docente, { ejercicio: ej2, estudiante: luis.id }), 429)
})

test('dos acciones del docente a la vez no se pisan', async () => {
  const { s, codigo, docente } = await quizEmpezado()
  await Promise.all([s.cerrarEntrada(codigo, docente, { cerrada: true }), s.cerrar(codigo, docente)])
  const vista = (await s.estado(codigo, docente)) as VistaDocente
  assert.equal(vista.aula.estado, 'cerrada')
  assert.equal(vista.aula.entradaCerrada, true)
})

test('dos ejercicios añadidos a la vez quedan los dos', async () => {
  const { s, codigo, docente } = await montar()
  const [a, b] = await Promise.all([
    s.agregar(codigo, docente, { ejercicio: ejercicio.id }),
    s.agregar(codigo, docente, { ejercicio: otro.id }),
  ])
  assert.notEqual(a.id, b.id)
  assert.equal(((await s.estado(codigo, docente)) as VistaDocente).ejercicios.length, 2)
})
