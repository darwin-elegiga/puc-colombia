import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { EJERCICIOS, NIVELES } from '../data/ejercicios'
import {
  bancoDe, calificar, estaCompleto, pesos, porNivel, posicionDe, respuestasVacias, siguienteDe,
  sumas,
} from '../lib/ejercicios'
import { construirCatalogo } from '../lib/catalogo'
import type { Cuenta } from '../lib/tipos'

const OFICIALES = JSON.parse(readFileSync(new URL('../data/puc.json', import.meta.url), 'utf8'))
  .cuentas as Cuenta[]
const catalogo = construirCatalogo(OFICIALES, [])

test('los identificadores no se repiten', () => {
  const ids = EJERCICIOS.map((e) => e.id)
  assert.equal(new Set(ids).size, ids.length)
  for (const id of ids) assert.match(id, /^[a-z0-9-]{1,64}$/, `${id} no sirve como hash`)
})

test('cada ejercicio cuadra: la suma del debe iguala la del haber', () => {
  for (const ejercicio of EJERCICIOS) {
    const debe = ejercicio.renglones.filter((r) => r.columna === 'debe')
    const haber = ejercicio.renglones.filter((r) => r.columna === 'haber')
    const total = (lista: typeof debe) => lista.reduce((suma, r) => suma + r.importe, 0)
    assert.ok(debe.length > 0 && haber.length > 0, `${ejercicio.id} deja una columna vacía`)
    assert.equal(total(debe), total(haber), `${ejercicio.id} no cuadra`)
  }
})

test('todas las cuentas citadas existen en el catálogo', () => {
  for (const ejercicio of EJERCICIOS) {
    for (const renglon of ejercicio.renglones) {
      assert.ok(
        catalogo.indice.has(renglon.codigo),
        `${ejercicio.id} usa la cuenta inexistente ${renglon.codigo}`,
      )
    }
    for (const codigo of ejercicio.banco ?? []) {
      assert.ok(catalogo.indice.has(codigo), `${ejercicio.id} ofrece la cuenta inexistente ${codigo}`)
    }
  }
})

test('los importes son enteros positivos', () => {
  for (const ejercicio of EJERCICIOS) {
    for (const renglon of ejercicio.renglones) {
      assert.ok(Number.isInteger(renglon.importe) && renglon.importe > 0, ejercicio.id)
    }
  }
})

test('el banco ofrece todas las respuestas y además distractores', () => {
  for (const ejercicio of EJERCICIOS) {
    if (!ejercicio.banco) continue
    assert.equal(new Set(ejercicio.banco).size, ejercicio.banco.length, `${ejercicio.id} repite opciones`)
    const correctas = new Set(ejercicio.renglones.map((r) => r.codigo))
    for (const codigo of correctas) {
      assert.ok(ejercicio.banco.includes(codigo), `${ejercicio.id} no ofrece ${codigo}`)
    }
    assert.ok(
      ejercicio.banco.length > correctas.size,
      `${ejercicio.id} no tiene ninguna opción incorrecta`,
    )
  }
})

test('la dificultad sube: los primeros niveles no piden cuenta y el último no da opciones', () => {
  for (const ejercicio of EJERCICIOS) {
    if (ejercicio.nivel <= 2) {
      assert.equal(ejercicio.pide, 'columna', `${ejercicio.id} pide cuenta demasiado pronto`)
    } else {
      assert.equal(ejercicio.pide, 'cuenta', `${ejercicio.id} debería pedir la cuenta`)
    }
    if (ejercicio.nivel === 3 || ejercicio.nivel === 4) {
      assert.ok(ejercicio.banco, `${ejercicio.id} debería traer banco de opciones`)
    }
    if (ejercicio.nivel === 5) {
      assert.equal(ejercicio.banco, undefined, `${ejercicio.id} no debería traer opciones`)
    }
  }
})

test('el nivel 4 usa subcuentas de seis dígitos', () => {
  for (const ejercicio of EJERCICIOS.filter((e) => e.nivel === 4)) {
    assert.ok(
      ejercicio.renglones.some((r) => r.codigo.length === 6),
      `${ejercicio.id} no llega a subcuenta`,
    )
  }
})

test('los ejercicios están ordenados por nivel y ningún nivel queda vacío', () => {
  const niveles = EJERCICIOS.map((e) => e.nivel)
  assert.deepEqual(niveles, [...niveles].sort((a, b) => a - b))
  for (const grupo of porNivel()) {
    assert.ok(grupo.ejercicios.length > 0, `el nivel ${grupo.numero} está vacío`)
  }
  assert.equal(porNivel().length, NIVELES.length)
})

test('cada ejercicio explica la respuesta', () => {
  for (const ejercicio of EJERCICIOS) {
    assert.ok(ejercicio.explicacion.length > 60, `${ejercicio.id} explica poco`)
    assert.ok(ejercicio.enunciado.length > 30, `${ejercicio.id} plantea poco`)
  }
})

test('calificar distingue la columna de la cuenta', () => {
  const ejercicio = EJERCICIOS.find((e) => e.pide === 'cuenta' && e.banco)!
  const perfectas = ejercicio.renglones.map((r) => ({ columna: r.columna, codigo: r.codigo }))
  assert.equal(calificar(ejercicio, perfectas).perfecto, true)

  const otraColumna = perfectas.map((r, i) =>
    i === 0 ? { ...r, columna: r.columna === 'debe' ? ('haber' as const) : ('debe' as const) } : r,
  )
  const conFalloDeColumna = calificar(ejercicio, otraColumna)
  assert.equal(conFalloDeColumna.perfecto, false)
  assert.equal(conFalloDeColumna.veredictos[0].columna, false)
  assert.equal(conFalloDeColumna.veredictos[0].cuenta, true)

  const otraCuenta = perfectas.map((r, i) => (i === 0 ? { ...r, codigo: '9999' } : r))
  const conFalloDeCuenta = calificar(ejercicio, otraCuenta)
  assert.equal(conFalloDeCuenta.veredictos[0].columna, true)
  assert.equal(conFalloDeCuenta.veredictos[0].cuenta, false)
  assert.equal(conFalloDeCuenta.aciertos, ejercicio.renglones.length - 1)
})

test('en los niveles sin cuenta basta con acertar la columna', () => {
  const ejercicio = EJERCICIOS.find((e) => e.pide === 'columna')!
  const respuestas = ejercicio.renglones.map((r) => ({ columna: r.columna, codigo: null }))
  assert.equal(calificar(ejercicio, respuestas).perfecto, true)
  assert.equal(estaCompleto(ejercicio, respuestas), true)
})

test('un ejercicio que pide cuenta no está completo sin ella', () => {
  const ejercicio = EJERCICIOS.find((e) => e.pide === 'cuenta')!
  const respuestas = ejercicio.renglones.map((r) => ({ columna: r.columna, codigo: null }))
  assert.equal(estaCompleto(ejercicio, respuestas), false)
})

test('las sumas siguen lo que se ha ubicado, no la respuesta correcta', () => {
  const ejercicio = EJERCICIOS[0]
  assert.deepEqual(sumas(ejercicio, respuestasVacias(ejercicio)), {
    debe: 0,
    haber: 0,
    diferencia: 0,
    cuadra: false,
  })
  const todoAlDebe = ejercicio.renglones.map(() => ({ columna: 'debe' as const, codigo: null }))
  const parcial = sumas(ejercicio, todoAlDebe)
  assert.equal(parcial.haber, 0)
  assert.equal(parcial.cuadra, false)

  const correctas = ejercicio.renglones.map((r) => ({ columna: r.columna, codigo: null }))
  assert.equal(sumas(ejercicio, correctas).cuadra, true)
})

test('el recorrido enlaza un ejercicio con el siguiente y termina', () => {
  assert.equal(posicionDe(EJERCICIOS[0].id), 0)
  assert.equal(siguienteDe(EJERCICIOS[0].id)?.id, EJERCICIOS[1].id)
  assert.equal(siguienteDe(EJERCICIOS[EJERCICIOS.length - 1].id), undefined)
})

test('sin banco declarado se ofrecen las cuentas de la respuesta', () => {
  const libre = EJERCICIOS.find((e) => !e.banco)!
  assert.deepEqual(
    bancoDe(libre),
    [...new Set(libre.renglones.map((r) => r.codigo))].sort(),
  )
})

test('los importes se escriben con punto de miles', () => {
  assert.equal(pesos(0), '$0')
  assert.equal(pesos(1000), '$1.000')
  assert.equal(pesos(1190000), '$1.190.000')
  assert.equal(pesos(60000000), '$60.000.000')
  assert.equal(pesos(-1500), '−$1.500')
})
