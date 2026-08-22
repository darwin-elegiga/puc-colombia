import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import {
  aCSV, codigoPadre, codigosAncestros, decodificar, desdeCSV, nivelDe, normalizar, validarBorrador,
} from '../lib/puc'
import { buscar, construirCatalogo, fichaDe, leerCodigo } from '../lib/catalogo'
import { MOVIMIENTOS } from '../data/movimientos'
import type { Cuenta } from '../lib/tipos'

const OFICIALES = JSON.parse(readFileSync(new URL('../data/puc.json', import.meta.url), 'utf8'))
  .cuentas as Cuenta[]
const catalogo = construirCatalogo(OFICIALES, [])
const existe = (c: string) => catalogo.indice.has(c)

test('el nivel se deduce de la longitud del código', () => {
  assert.equal(nivelDe('1'), 'clase')
  assert.equal(nivelDe('11'), 'grupo')
  assert.equal(nivelDe('1105'), 'cuenta')
  assert.equal(nivelDe('110505'), 'subcuenta')
  assert.equal(nivelDe('11050501'), 'auxiliar')
  assert.equal(nivelDe('123'), null, 'tres dígitos no corresponden a ningún nivel')
})

test('la jerarquía se resuelve por prefijos', () => {
  assert.equal(codigoPadre('110505'), '1105')
  assert.equal(codigoPadre('1'), null)
  assert.deepEqual(codigosAncestros('110505'), ['1', '11', '1105'])
})

test('decodificar describe cada tramo del código', () => {
  const lectura = leerCodigo(catalogo, '110505')
  assert.equal(lectura.longitudValida, true)
  assert.deepEqual(
    lectura.segmentos.map((s) => [s.codigo, s.nombre]),
    [['1', 'ACTIVO'], ['11', 'DISPONIBLE'], ['1105', 'CAJA'], ['110505', 'CAJA GENERAL']],
  )
})

test('decodificar marca los dígitos sobrantes de una longitud inválida', () => {
  const lectura = leerCodigo(catalogo, '12345')
  assert.equal(lectura.longitudValida, false)
  const ultimo = lectura.segmentos.at(-1)!
  assert.equal(ultimo.incompleto, true)
  assert.equal(ultimo.digitos, '5')
})

test('un auxiliar no registrado se lee igual, marcando el tramo libre', () => {
  const lectura = decodificar('11050501', (c) => catalogo.indice.get(c))
  assert.equal(lectura.registrada, false)
  assert.equal(lectura.segmentos.at(-1)!.libre, true)
  assert.equal(lectura.segmentos[0].nombre, 'ACTIVO')
})

test('la naturaleza sale de la clase, salvo en cuentas de contrapartida', () => {
  assert.equal(catalogo.indice.get('1105')!.naturaleza, 'debito')
  assert.equal(catalogo.indice.get('2205')!.naturaleza, 'credito')
  const depreciacion = catalogo.indice.get('1592')!
  assert.equal(depreciacion.naturaleza, 'credito', 'la depreciación acumulada resta del activo')
  assert.equal(depreciacion.naturalezaForzada, true)
})

test('toda cuenta del catálogo tiene su nivel superior', () => {
  const huerfanas = catalogo.lista.filter((c) => {
    const padre = codigoPadre(c.codigo)
    return padre !== null && !catalogo.indice.has(padre)
  })
  assert.deepEqual(huerfanas.map((c) => c.codigo), [])
})

test('la búsqueda prioriza el código exacto y encuentra sin tildes', () => {
  assert.equal(buscar(catalogo, { q: '1105' }).resultados[0].codigo, '1105')
  const sinTilde = buscar(catalogo, { q: 'depreciacion' })
  assert.ok(sinTilde.total > 0)
  assert.ok(sinTilde.resultados.some((r) => r.nombre.includes('DEPRECIACION')))
  assert.equal(normalizar('ENSEÑANZA'), 'ensenanza')
})

test('los filtros por clase y nivel se combinan', () => {
  const { resultados } = buscar(catalogo, { clase: '2', nivel: 'grupo' }, 100)
  assert.ok(resultados.length > 0)
  assert.ok(resultados.every((r) => r.codigo[0] === '2' && r.nivel === 'grupo'))
})

test('la ficha trae ruta, hijos y dinámica heredada', () => {
  const ficha = fichaDe(catalogo, '110505')!
  assert.deepEqual(ficha.ancestros.map((a) => a.codigo), ['1', '11', '1105'])
  assert.equal(ficha.dinamica?.heredadaDe, '1105', 'la subcuenta hereda la dinámica de su cuenta')
  assert.ok(fichaDe(catalogo, '1105')!.hijos.length >= 3)
})

test('validar rechaza duplicados, longitudes raras y huérfanas', () => {
  assert.equal(validarBorrador({ codigo: '1105', nombre: 'Caja' }, existe).ok, false)
  assert.equal(validarBorrador({ codigo: '110', nombre: 'X' }, existe).ok, false)
  assert.equal(validarBorrador({ codigo: '119999', nombre: 'X' }, existe).ok, false)
  assert.equal(validarBorrador({ codigo: '110599', nombre: '' }, existe).ok, false)
  assert.equal(validarBorrador({ codigo: '0105', nombre: 'X' }, existe).ok, false)

  const valida = validarBorrador({ codigo: '110599', nombre: 'Caja sede norte' }, existe)
  assert.equal(valida.ok, true)
  assert.equal(valida.cuenta!.nivel, 'subcuenta')
  assert.equal(valida.cuenta!.naturaleza, 'debito')
  assert.equal(valida.cuenta!.origen, 'personalizada')
})

test('la naturaleza forzada se marca cuando contradice a la clase', () => {
  const contra = validarBorrador({ codigo: '159999', nombre: 'Depreciación sede norte', naturaleza: 'credito' }, existe)
  assert.equal(contra.cuenta!.naturalezaForzada, true)
})

test('las cuentas propias se integran a la jerarquía sin pisar las oficiales', () => {
  const propia: Cuenta = {
    codigo: '110599', nombre: 'CAJA SEDE NORTE', nivel: 'subcuenta',
    naturaleza: 'debito', descripcion: '', origen: 'personalizada',
  }
  const mezclado = construirCatalogo(OFICIALES, [propia, { ...propia, codigo: '1105', nombre: 'INTENTO DE PISAR' }])
  assert.equal(mezclado.indice.get('1105')!.nombre, 'CAJA', 'una cuenta propia no reemplaza a la oficial')
  assert.ok(fichaDe(mezclado, '1105')!.hijos.some((h) => h.codigo === '110599'))
})

test('el CSV va y vuelve sin perder datos', () => {
  const csv = aCSV(catalogo.lista.slice(0, 5))
  const filas = desdeCSV(csv)
  assert.equal(filas.length, 5)
  assert.equal(filas[0].codigo, catalogo.lista[0].codigo)
  assert.equal(filas[0].nombre, catalogo.lista[0].nombre)
})

test('el CSV acepta punto y coma, comillas y falta de encabezado', () => {
  const filas = desdeCSV('110598;"CAJA, SEDE SUR";Efectivo de la sede sur')
  assert.equal(filas.length, 1)
  assert.equal(filas[0].codigo, '110598')
  assert.equal(filas[0].nombre, 'CAJA, SEDE SUR')
})

/* ─────────── Integridad del catálogo y de los asientos ─────────── */

test('no hay códigos duplicados y toda cuenta tiene descripción', () => {
  const vistos = new Set<string>()
  const duplicados: string[] = []
  const sinDescripcion: string[] = []
  for (const c of OFICIALES) {
    if (vistos.has(c.codigo)) duplicados.push(c.codigo)
    vistos.add(c.codigo)
    if (!c.descripcion) sinDescripcion.push(c.codigo)
  }
  assert.deepEqual(duplicados, [])
  assert.deepEqual(sinDescripcion, [])
})

test('la naturaleza solo se aparta de su clase en cuentas de contrapartida', () => {
  const esperada: Record<string, string> = {
    '1': 'debito', '2': 'credito', '3': 'credito', '4': 'credito', '5': 'debito',
    '6': 'debito', '7': 'debito', '8': 'debito', '9': 'credito',
  }
  const incoherentes = OFICIALES.filter(
    (c) => c.naturaleza !== esperada[c.codigo[0]] && !c.naturalezaForzada,
  )
  assert.deepEqual(incoherentes.map((c) => c.codigo), [])
})

test('los nombres conservan las tildes del catálogo oficial', () => {
  const SIN_TILDE =
    /\b(DEPRECIACION|AMORTIZACION|PROVISION|RETENCION|SUPERAVIT|CREDITO|PUBLICO|MERCANCIAS|CESANTIAS|PERDIDA|NOMINA|TRANSITO|TITULOS|CAPACITACION|MEDICO|AEREO|FERREO|MARITIMO|ENERGIA|TELEFONO|VEHICULOS|ORDENES|GRAVAMENES|REGALIAS|RAIZ|VIAS|DIFICIL|INTERES)\b/
  const fallan = OFICIALES.filter((c) => SIN_TILDE.test(c.nombre) || c.nombre.includes('Y-O'))
  assert.deepEqual(fallan.map((c) => `${c.codigo} ${c.nombre}`), [])
})

test('todo código usado en los asientos existe en el catálogo', () => {
  const rotos = MOVIMIENTOS.flatMap((m) =>
    m.asiento.filter((r) => !catalogo.indice.has(r.codigo)).map((r) => `${m.id}: ${r.codigo}`),
  )
  assert.deepEqual(rotos, [])
})

test('cada asiento tiene al menos un débito y un crédito', () => {
  const descuadrados = MOVIMIENTOS.filter(
    (m) => !m.asiento.some((r) => r.efecto === 'debito') || !m.asiento.some((r) => r.efecto === 'credito'),
  )
  assert.deepEqual(descuadrados.map((m) => m.id), [])
})
