import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { construirCatalogo } from '../lib/catalogo'
import { comoSeLlama, explicarAsiento, fraseOficial } from '../lib/explicacion'
import { normalizarTexto } from '../lib/busqueda'
import { MOVIMIENTOS } from '../data/movimientos'

const catalogo = construirCatalogo(JSON.parse(readFileSync(new URL('../data/puc.json', import.meta.url), 'utf8')).cuentas, [])
const cuentaDe = (codigo: string) => catalogo.indice.get(codigo)
const explicar = (id: string) => {
  const m = MOVIMIENTOS.find((x) => x.id === id)!
  return explicarAsiento(m.asiento, cuentaDe, `${m.nombre}. ${m.descripcion}`)
}

test('toda operación conocida se explica en local, renglón por renglón', () => {
  const incompletas = MOVIMIENTOS.flatMap((m) =>
    explicarAsiento(m.asiento, cuentaDe, m.nombre)
      .pasos.filter((p) => !p.porQue || p.nombre === 'Cuenta no encontrada')
      .map((p) => `${m.id}: ${p.codigo}`),
  )
  assert.deepEqual(incompletas, [])
})

test('el saldo sube o baja según la naturaleza de la cuenta', () => {
  const [gasto, , banco] = explicar('pago-arriendo').pasos
  assert.equal(gasto.codigo, '5120')
  assert.equal(gasto.saldo, 'sube')
  assert.equal(banco.saldo, 'baja')
  assert.match(gasto.oficial?.texto ?? '', /arrendamiento/i)
})

test('las cuentas correctoras se explican al revés que su clase', () => {
  const acumulada = explicar('depreciacion').pasos.find((p) => p.codigo.startsWith('1592'))!
  assert.equal(acumulada.correctora, true)
  assert.equal(acumulada.saldo, 'sube')
  assert.match(acumulada.porQue, /activo neto baja/)
  assert.equal(explicar('depreciacion').ecuacion['1'], 'baja')
})

test('la ecuación contable refleja lo que se mueve', () => {
  assert.equal(explicar('consignacion-caja-banco').ecuacion['1'], 'cambia')
  const venta = explicar('venta-credito').ecuacion
  assert.deepEqual([venta['1'], venta['2'], venta['4'], venta['5']], ['sube', 'sube', 'sube', null])
  assert.match(explicar('venta-credito').resumen, /los ingresos suben/)
})

test('la cita oficial no se elige por un caso excepcional', () => {
  const caja = explicar('consignacion-caja-banco').pasos.find((p) => p.codigo === '110505')!
  assert.match(caja.oficial?.texto ?? '', /consignaciones/i)
  assert.equal(fraseOficial(['Por los faltantes en caja al efectuar arqueos.', 'Por el valor de los pagos en efectivo.'], 'Pago en efectivo', ''), 'Por el valor de los pagos en efectivo.')
  assert.equal(fraseOficial(['Por A.', 'Por B.'], 'zzz', ''), undefined)
})

test('con importes, los totales dicen si cuadra', () => {
  const e = explicarAsiento(
    [
      { codigo: '5120', efecto: 'debito', concepto: 'Arriendo', importe: 2_000_000 },
      { codigo: '111005', efecto: 'credito', concepto: 'Pago', importe: 2_000_000 },
    ],
    cuentaDe,
  )
  assert.deepEqual(e.totales, { debito: 2_000_000, credito: 2_000_000 })
  assert.match(e.resumen, /el haber suma lo mismo/)
})

test('cada renglón dice cómo se le llama a la cuenta en el día a día', () => {
  const [gasto, , banco] = explicar('pago-arriendo').pasos
  assert.ok(gasto.seLlama.includes('arriendo'))
  // Una subcuenta hereda los nombres de su cuenta de 4 dígitos, sin repetirlos.
  assert.ok(banco.seLlama.includes('cuenta corriente'))
  assert.ok(banco.seLlama.length <= 4)
  assert.equal(new Set(banco.seLlama).size, banco.seLlama.length)
})

test('los nombres del día a día no repiten el oficial ni traen frases, jerga o marcas', () => {
  const malos = catalogo.lista.flatMap((c) =>
    comoSeLlama(c.codigo, [c.nombre], 8)
      .filter((a) => {
        const t = normalizarTexto(a)
        return (
          t === normalizarTexto(c.nombre) ||
          t.split(/\s+/).length > 3 ||
          /^(me|le|nos|se) /.test(t) ||
          /\p{L}{3,}[éó](\s|$)/u.test(a.toLowerCase()) ||
          /bancolombia|davivienda|guita|billullo/.test(t)
        )
      })
      .map((a) => `${c.codigo}: ${a}`),
  )
  assert.deepEqual(malos, [])
  // La madre sí aclara: una subcuenta del banco se dice «banco».
  assert.ok(comoSeLlama('111005', ['MONEDA NACIONAL'], 8).some((a) => /^bancos?$/.test(normalizarTexto(a))))
})
