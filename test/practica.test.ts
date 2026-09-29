import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import {
  EJERCICIOS_ASIENTO, asientosACSV, asientosDesdeCSV, conRenglonLibre, corregir, cuentaValida, filaVacia, sumas,
  type Asiento, type Fila, type LineaSolucion,
} from '../lib/practica'
import { MOVIMIENTOS } from '../data/movimientos'

const codigos = new Set<string>(
  JSON.parse(readFileSync(new URL('../data/puc.json', import.meta.url), 'utf8')).cuentas.map((c: { codigo: string }) => c.codigo),
)
const aFilas = (s: LineaSolucion[]): Fila[] =>
  s.map((l) => ({ codigo: l.codigo, debe: l.columna === 'debe' ? l.importe : null, haber: l.columna === 'haber' ? l.importe : null }))

test('hay ejercicios del entrenamiento y la gran mayoría de las operaciones', () => {
  const operaciones = EJERCICIOS_ASIENTO.filter((e) => e.origen === 'operacion').length
  assert.equal(EJERCICIOS_ASIENTO.filter((e) => e.origen === 'entrenamiento').length, 37)
  assert.ok(operaciones >= MOVIMIENTOS.length * 0.95, `solo ${operaciones} de ${MOVIMIENTOS.length} operaciones`)
})

test('cada ejercicio cuadra, con importes enteros positivos y cuentas del catálogo', () => {
  const malos: string[] = []
  for (const e of EJERCICIOS_ASIENTO) {
    const debe = e.solucion.filter((l) => l.columna === 'debe').reduce((s, l) => s + l.importe, 0)
    const haber = e.solucion.filter((l) => l.columna === 'haber').reduce((s, l) => s + l.importe, 0)
    if (debe !== haber) malos.push(`${e.id}: ${debe} ≠ ${haber}`)
    for (const l of e.solucion) {
      if (!Number.isInteger(l.importe) || l.importe <= 0) malos.push(`${e.id}: importe ${l.importe}`)
      if (!codigos.has(l.codigo)) malos.push(`${e.id}: ${l.codigo} no existe`)
    }
  }
  assert.deepEqual(malos, [])
})

test('los ids no se repiten', () => {
  const ids = EJERCICIOS_ASIENTO.map((e) => e.id)
  assert.equal(new Set(ids).size, ids.length)
})

test('la solución escrita tal cual es perfecta, en cualquier orden', () => {
  for (const e of EJERCICIOS_ASIENTO) {
    const c = corregir(e.solucion, aFilas(e.solucion).reverse())
    assert.ok(c.perfecto, e.id)
  }
})

test('vale la subcuenta de la cuenta pedida, pero no otra cuenta', () => {
  assert.ok(cuentaValida('111005', '1110'))
  assert.ok(!cuentaValida('1110', '111005'))
  assert.ok(!cuentaValida('1105', '1110'))
})

test('la corrección distingue importe, columna, cuenta, sobrantes y faltantes', () => {
  const solucion: LineaSolucion[] = [
    { codigo: '5120', columna: 'debe', importe: 1000, concepto: 'Arriendo' },
    { codigo: '2408', columna: 'debe', importe: 190, concepto: 'IVA' },
    { codigo: '1110', columna: 'haber', importe: 1190, concepto: 'Banco' },
  ]
  const c = corregir(solucion, [
    { codigo: '5120', debe: 900, haber: null },
    { codigo: '2408', debe: null, haber: 190 },
    { codigo: '1105', debe: null, haber: 1190 },
    { codigo: '4135', debe: 50, haber: null },
    filaVacia(),
  ])
  assert.deepEqual(c.estados, ['importe', 'columna', 'cuenta', 'sobra', null])
  assert.equal(c.aciertos, 0)
  assert.ok(!c.perfecto)

  const partida = corregir(solucion, [
    { codigo: '512005', debe: 600, haber: null },
    { codigo: '512005', debe: 400, haber: null },
    { codigo: '2408', debe: 190, haber: null },
  ])
  assert.deepEqual(partida.estados, ['ok', 'ok', 'ok'])
  assert.equal(partida.faltan.length, 1)
  assert.equal(partida.faltan[0].codigo, '1110')
})

test('la hoja deja siempre un renglón libre al final y suma cada columna', () => {
  const filas = conRenglonLibre([{ codigo: '1105', debe: 100, haber: null }])
  assert.equal(filas.length, 2)
  assert.ok(!filas[1].codigo)
  assert.deepEqual(sumas([{ codigo: '1105', debe: 100, haber: null }, { codigo: '4135', debe: null, haber: 100 }]), {
    debe: 100, haber: 100, diferencia: 0, cuadra: true,
  })
})

test('varios asientos van y vuelven por CSV sin perder datos', () => {
  const asientos: Asiento[] = [
    {
      nota: 'Vendí de contado; con IVA del "19 %"',
      filas: [
        { codigo: '1105', debe: 1190000, haber: null },
        { codigo: '4135', debe: null, haber: 1000000 },
        { codigo: '2408', debe: null, haber: 190000 },
      ],
    },
    { nota: 'Pago el arriendo', filas: [{ codigo: '5120', debe: 1200000, haber: null }, { codigo: '1110', debe: null, haber: 1200000 }] },
    { nota: '', filas: [] },
  ]
  const csv = asientosACSV(asientos.map((a) => ({ ...a, filas: [...a.filas, filaVacia()] })), (c) => `Cuenta ${c}`)
  assert.match(csv, /^Asiento;Descripción;Código;Cuenta;Debe;Haber/)
  assert.match(csv, /1;"Vendí de contado; con IVA del ""19 %""";1105;Cuenta 1105;1190000;/)
  assert.match(csv, /2;;;Sumas;1200000;1200000/)
  const leidos = asientosDesdeCSV('\uFEFF' + csv)
  assert.equal(leidos.length, 2, 'el asiento vacío no se exporta')
  leidos.forEach((a, i) => {
    assert.equal(a.nota, asientos[i].nota)
    assert.deepEqual(a.filas.filter((f) => f.codigo), asientos[i].filas)
  })
})

test('se importa el formato de un solo asiento y un CSV ajeno como un asiento', () => {
  const uno = asientosDesdeCSV('Operación;Vendo\r\n\r\nCódigo;Cuenta;Debe;Haber\r\n1105;Caja;1000;\r\n4135;Comercio;;1000\r\nSumas;;1000;1000\r\n')
  assert.equal(uno.length, 1)
  assert.equal(uno[0].nota, 'Vendo')
  assert.equal(uno[0].filas.filter((f) => f.codigo).length, 2)

  const csv = 'Fecha,Código,Descripción,Debe,Haber\n2026-09-01,5120,Arriendo,"$ 1.200.000",\n2026-09-01,1110,Banco,,"1200000,00"\n'
  const ajeno = asientosDesdeCSV(csv)
  assert.equal(ajeno.length, 1)
  assert.deepEqual(ajeno[0].filas.filter((f) => f.codigo), [
    { codigo: '5120', debe: 1200000, haber: null },
    { codigo: '1110', debe: null, haber: 1200000 },
  ])
})
