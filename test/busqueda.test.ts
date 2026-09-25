import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { analizar, fonetica, raiz, sonidoDe } from '../lib/busqueda'
import { asientoLocal, buscarMovimientos, ladoDeConsulta } from '../lib/movimientos'
import { buscar, construirCatalogo } from '../lib/catalogo'
import { PRUEBAS_VOCABULARIO, codigosConAlias } from '../lib/vocabulario'
import { MOVIMIENTOS } from '../data/movimientos'

const catalogo = construirCatalogo(JSON.parse(readFileSync(new URL('../data/puc.json', import.meta.url), 'utf8')).cuentas, [])
const primerMovimiento = (q: string) => buscarMovimientos(q, 3)[0]?.id
const primerasCuentas = (q: string, n = 3) => buscar(catalogo, { q }, n).resultados.map((r) => r.codigo)

test('las formas de un verbo comparten raíz', () => {
  const r = raiz('pago')
  for (const forma of ['pagos', 'pagar', 'pague', 'pagamos', 'pagado']) assert.equal(raiz(forma), r, forma)
  assert.equal(raiz('vendi'), raiz('vender'))
  // Choques que la raíz automática provocaba.
  assert.notEqual(raiz('prestaciones'), raiz('prestar'))
  assert.notEqual(raiz('contador'), raiz('control'))
  assert.notEqual(raiz('utiles'), raiz('utilidad'))
})

test('lo que suena igual se escribe igual para la búsqueda', () => {
  assert.equal(fonetica('horarios'), fonetica('orarios'))
  assert.equal(fonetica('vanco'), fonetica('banco'))
  assert.equal(sonidoDe('vacasiones'), sonidoDe('vacaciones'))
  assert.equal(sonidoDe('sesantias'), sonidoDe('cesantias'))
  assert.equal(sonidoDe('nomyna'), sonidoDe('nomina'))
})

test('las palabras de relleno no cuentan y las frases hechas se traducen', () => {
  const q = analizar('qué cuenta uso cuando pago el cuatro por mil')
  const obligatorias = q.terminos.filter((t) => !t.suave).map((t) => t.palabra)
  assert.ok(obligatorias.includes('gmf'))
  assert.ok(!obligatorias.includes('cuenta'))
})

test('el lado se deduce de cómo está escrita la consulta', () => {
  assert.equal(ladoDeConsulta('me pagaron el arriendo'), 'cobro')
  assert.equal(ladoDeConsulta('pagué el arriendo'), 'pago')
  assert.equal(ladoDeConsulta('depreciación'), null)
})

test('las consultas en lenguaje natural encuentran la operación', () => {
  const casos: Record<string, string> = {
    'pague el arriendo': 'pago-arriendo',
    'me pagaron el arriendo': 'cobro-arriendo',
    'qué cuenta uso cuando le pago al contador': 'pago-honorarios',
    'me pagaron con tarjeta': 'cobro-tarjeta',
    'vendi fiado': 'venta-credito',
    'el cliente no me paga': 'provision-cartera|castigo-cartera',
    'le presté plata a un empleado': 'prestamo-empleado',
    'cuatro por mil': 'comision-bancaria|gmf-como-impuesto',
    'pago de la pila': 'aportes-parafiscales',
    'prima de junio': 'pago-prima',
    'HORAS EXTRAS': 'causacion-horas-extras',
    'gasolina': 'pago-transporte',
    'caja chica': 'caja-menor-constitucion',
    'ingresos por servisios': 'cobro-servicio|venta-servicio-salud|venta-servicio-transporte',
  }
  // Varias respuestas válidas se separan con «|».
  const fallan = Object.entries(casos)
    .filter(([q, ids]) => !ids.split('|').includes(primerMovimiento(q) ?? ''))
    .map(([q]) => `${q} → ${primerMovimiento(q)}`)
  assert.deepEqual(fallan, [])
})

test('las consultas en lenguaje natural y mal escritas encuentran la cuenta', () => {
  const casos: Record<string, string> = {
    'pague el arriendo': '5120',
    'me pagaron el arriendo': '4220',
    'luz': '5135',
    'plata': '1105',
    'consigno': '1110',
    'vanco': '1110',
    'aorros': '1120',
    'onorarios': '5110',
    'vacasiones': '2525',
    'probedor': '2205',
    'depresiacion': '1592',
    'compré un carro': '1540',
    'iva': '2408',
  }
  const fallan = Object.entries(casos)
    .filter(([q, codigo]) => !primerasCuentas(q).includes(codigo))
    .map(([q, codigo]) => `${q}: esperaba ${codigo} entre ${primerasCuentas(q).join(', ')}`)
  assert.deepEqual(fallan, [])
})

test('mayúsculas, tildes y minúsculas dan el mismo resultado', () => {
  assert.deepEqual(primerasCuentas('HONORARIOS'), primerasCuentas('honorarios'))
  assert.deepEqual(primerasCuentas('Nómina'), primerasCuentas('NOMINA'))
})

test('los alias apuntan a cuentas del catálogo y los movimientos nuevos a códigos reales', () => {
  assert.deepEqual(codigosConAlias().filter((c) => !catalogo.indice.has(c)), [])
  assert.ok(MOVIMIENTOS.length >= 55)
})

test('el asiento se propone primero en local y solo si la operación se parece de verdad', () => {
  const casos: Record<string, string | null> = {
    'Pagué el arriendo del local de octubre por 2.000.000': 'pago-arriendo',
    'Vendí mercancía a crédito a un cliente por 1.190.000 con IVA': 'venta-credito',
    'hoy pagamos la nómina de septiembre': 'pago-nomina',
    'consigné 500 mil de la caja': 'consignacion-caja-banco',
    'Compré acciones de Ecopetrol': 'compra-acciones',
    'importé mercancía de china y pagué aranceles': 'importacion-factura-proveedor-exterior',
    'el socio aportó un carro a la empresa': 'aporte-especie-vehiculo',
    // Sin operación conocida que cubra la frase: se ofrece la IA.
    'Me llegó la factura de la luz y la pagué con la tarjeta de crédito de la empresa': null,
    'firmé un contrato de franquicia con regalías mensuales': null,
  }
  const fallan = Object.entries(casos)
    .filter(([q, id]) => (asientoLocal(q).propuesta?.id ?? null) !== id)
    .map(([q, id]) => `${q}: esperaba ${id}, salió ${asientoLocal(q).propuesta?.id ?? null}`)
  assert.deepEqual(fallan, [])
})

test('los importes y las fechas no cuentan como palabras de la búsqueda', () => {
  const palabras = analizar('pagué 2.000.000 de arriendo en octubre').terminos.map((t) => t.palabra)
  assert.ok(!palabras.some((p) => /\d/.test(p) || p === 'octubre'))
})

test('la búsqueda local dice cuándo no resuelve, que es cuando se ofrece la IA', () => {
  assert.equal(buscar(catalogo, { q: 'arriendo' }).completa, true)
  assert.equal(buscar(catalogo, { q: '1105' }).completa, true)
  // Nada contable: como mucho coincidencias parciales.
  assert.equal(buscar(catalogo, { q: 'quiero aprender a tocar guitarra eléctrica' }).completa, false)
  assert.equal(buscar(catalogo, { q: 'zzzz' }).completa, false)
})

test('palabras que coinciden con propiedades de los objetos no rompen la búsqueda', () => {
  for (const q of ['constructor', 'toString', 'hasOwnProperty', '__proto__']) {
    assert.doesNotThrow(() => buscar(catalogo, { q }))
    assert.doesNotThrow(() => buscarMovimientos(q))
  }
})

test('el vocabulario ampliado encuentra la cuenta entre las 3 primeras', () => {
  // Vale la cuenta esperada o su cuenta padre o hija: «el coche de la empresa» → 1540 o 154005.
  const emparentadas = (a: string, b: string) => a.startsWith(b) || b.startsWith(a)
  const fallan = Object.entries(PRUEBAS_VOCABULARIO)
    .filter(([q, codigo]) => !primerasCuentas(q).some((c) => emparentadas(c, codigo)))
    .map(([q, codigo]) => `${q}: esperaba ${codigo}, salió ${primerasCuentas(q).join(', ')}`)
  const total = Object.keys(PRUEBAS_VOCABULARIO).length
  // Se exige al menos el 95 %: algunas consultas son ambiguas por naturaleza.
  assert.ok(fallan.length <= total * 0.05, `${fallan.length} de ${total} fallan:\n${fallan.join('\n')}`)
})

test('las consultas con palabras de otros países encuentran la operación', () => {
  const casos: Record<string, string> = {
    'compro ordenador': 'compra-activo-fijo',
    'compré una mac para la oficina': 'compra-activo-fijo',
  }
  const fallan = Object.entries(casos).filter(([q, id]) => !buscarMovimientos(q, 3).some((m) => m.id === id))
  assert.deepEqual(fallan.map(([q]) => `${q} → ${buscarMovimientos(q, 3).map((m) => m.id).join(', ')}`), [])
})
