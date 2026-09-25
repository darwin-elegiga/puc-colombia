/** Búsqueda sobre las operaciones típicas y su relación con las cuentas. */
import { MOVIMIENTOS, type Movimiento } from '@/data/movimientos'
import { REGLA_LADO, type Lado } from '@/data/guia'
import { Buscador, ladoDeConsulta } from './busqueda'

/**
 * El nombre y las formas coloquiales mandan; la descripción, los conceptos del
 * asiento y la nota amplían el alcance con menos peso.
 */
const MOTOR = new Buscador(MOVIMIENTOS, (m) => [
  { texto: m.nombre, peso: 3 },
  { texto: m.palabras.join(' · '), peso: 2.5 },
  { texto: m.descripcion, peso: 1.2 },
  { texto: `${m.categoria} · ${REGLA_LADO[m.lado].titulo} · ${REGLA_LADO[m.lado].corto}`, peso: 1 },
  { texto: m.asiento.map((r) => r.concepto).join(' · '), peso: 0.8 },
  { texto: m.nota ?? '', peso: 0.5 },
], 5)

/** Resultados con su puntaje y cobertura, para decidir si lo encontrado es fiable. */
export function buscarMovimientosPuntuados(consulta: string, limite = 12, lado: Lado | '' = '') {
  if (!consulta.trim()) return []
  const preferido = ladoDeConsulta(consulta)
  return MOTOR.buscar(consulta)
    .filter((r) => !lado || r.valor.lado === lado)
    .map((r) => ({ ...r, puntaje: r.puntaje * (preferido && r.valor.lado === preferido ? 1.35 : 1) }))
    .sort((a, b) => b.puntaje - a.puntaje)
    .slice(0, limite)
}

/** Con lado, se queda solo con las operaciones de ese lado: «yo pago», «me pagan» o «sin pago». */
export function buscarMovimientos(consulta: string, limite = 12, lado: Lado | '' = ''): Movimiento[] {
  return buscarMovimientosPuntuados(consulta, limite, lado).map((r) => r.valor)
}

/**
 * Propuesta local de asiento para una situación descrita con palabras: la operación
 * conocida más parecida, si lo es lo bastante. Umbral: que aparezcan al menos el 60 %
 * de las palabras importantes y que el nombre o las formas coloquiales de la operación
 * coincidan de verdad (puntaje ≥ 4), no solo su descripción.
 */
export function asientoLocal(situacion: string): { propuesta: Movimiento | null; alternativas: Movimiento[] } {
  const resultados = buscarMovimientosPuntuados(situacion, 4)
  const [primero] = resultados
  // Si la frase dice quién paga y la mejor operación es del lado contrario, algo no encaja.
  const lado = ladoDeConsulta(situacion)
  const ladoContrario = Boolean(lado && primero && primero.valor.lado !== 'interno' && primero.valor.lado !== lado)
  const fiable = primero && primero.cobertura >= 0.6 && primero.puntaje >= 4 && !ladoContrario
  return {
    propuesta: fiable ? primero.valor : null,
    alternativas: resultados.slice(fiable ? 1 : 0, 4).map((r) => r.valor),
  }
}

/**
 * Movimientos en los que interviene una cuenta. Incluye los que usan una subcuenta
 * suya, para que al consultar 1105 aparezcan también los asientos con 110505.
 */
export function movimientosDeCuenta(codigo: string): Movimiento[] {
  return MOVIMIENTOS.filter((m) =>
    m.asiento.some((r) => r.codigo === codigo || r.codigo.startsWith(codigo)),
  )
}

export function movimientoPorId(id: string): Movimiento | undefined {
  return MOVIMIENTOS.find((m) => m.id === id)
}

export { MOVIMIENTOS, ladoDeConsulta }
export type { Movimiento }
