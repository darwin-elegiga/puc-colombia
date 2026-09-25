import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { analizar, fonetica, raiz, sonidoDe } from '../lib/busqueda'
import { asientoLocal, buscarMovimientos, ladoDeConsulta } from '../lib/movimientos'
import { buscar, construirCatalogo } from '../lib/catalogo'
import { ALIAS_CUENTAS } from '../data/sinonimos'
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
    'el cliente no me paga': 'castigo-cartera',
    'le presté plata a un empleado': 'prestamo-empleado',
    'cuatro por mil': 'comision-bancaria',
    'pago de la pila': 'aportes-parafiscales',
    'prima de junio': 'pago-prima',
    'HORAS EXTRAS': 'causacion-nomina',
    'gasolina': 'pago-transporte',
    'caja chica': 'caja-menor-constitucion',
    'ingresos por servisios': 'cobro-servicio',
  }
  const fallan = Object.entries(casos).filter(([q, id]) => primerMovimiento(q) !== id).map(([q]) => `${q} → ${primerMovimiento(q)}`)
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
  assert.deepEqual(Object.keys(ALIAS_CUENTAS).filter((c) => !catalogo.indice.has(c)), [])
  assert.ok(MOVIMIENTOS.length >= 55)
})

test('el asiento se propone primero en local y solo si la operación se parece de verdad', () => {
  const casos: Record<string, string | null> = {
    'Pagué el arriendo del local de octubre por 2.000.000': 'pago-arriendo',
    'Vendí mercancía a crédito a un cliente por 1.190.000 con IVA': 'venta-credito',
    'hoy pagamos la nómina de septiembre': 'pago-nomina',
    'consigné 500 mil de la caja': 'consignacion-caja-banco',
    // Sin operación conocida parecida: se ofrece la IA.
    'Compré acciones de Ecopetrol': null,
    'importé mercancía de china y pagué aranceles': null,
    // La mejor coincidencia es de cobro pero la frase dice que pagué: no se da por buena.
    'Me llegó la factura de la luz y la pagué con la tarjeta de crédito de la empresa': null,
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
