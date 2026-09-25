/** Búsqueda sobre las operaciones típicas y su relación con las cuentas. */
import { MOVIMIENTOS, type Movimiento } from '@/data/movimientos'
import { REGLA_LADO, type Lado } from '@/data/guia'
import { Buscador, ladoDeConsulta } from './busqueda'
import { aliasDe } from './vocabulario'
import datosPuc from '@/data/puc.json'

const NOMBRE_CUENTA = new Map(
  (datosPuc.cuentas as { codigo: string; nombre: string }[]).map((c) => [c.codigo, c.nombre]),
)

/**
 * Cómo se nombran las cuentas del asiento: su nombre y sus alias, y los de la cuenta
 * de 4 dígitos si el renglón usa una subcuenta. Así «compro ordenador» llega a la
 * compra del computador aunque la operación no diga «ordenador»: lo dice 1528.
 */
function vocabularioDelAsiento(m: Movimiento): string {
  const codigos = new Set(m.asiento.flatMap((r) => [r.codigo, r.codigo.slice(0, 4)]))
  return [...codigos].flatMap((c) => [NOMBRE_CUENTA.get(c) ?? '', ...aliasDe(c)]).join(' · ')
}

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
  { texto: vocabularioDelAsiento(m), peso: 0.7 },
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
 * conocida más parecida, si lo es lo bastante. Umbral: que aparezcan al menos el 70 %
 * de las palabras importantes y que el nombre o las formas coloquiales de la operación
 * coincidan de verdad (puntaje ≥ 4), no solo su descripción.
 */
export function asientoLocal(situacion: string): { propuesta: Movimiento | null; alternativas: Movimiento[] } {
  // Para proponer un asiento pesa más cubrir toda la frase que el puntaje: primero las
  // operaciones que contienen todas las palabras importantes, y entre ellas la de más puntaje.
  const resultados = buscarMovimientosPuntuados(situacion, 6)
    .sort((a, b) => Number(b.cobertura >= 1) - Number(a.cobertura >= 1) || b.puntaje - a.puntaje)
    .slice(0, 4)
  const [primero] = resultados
  // Si la frase dice quién paga y la mejor operación es del lado contrario, algo no encaja.
  const lado = ladoDeConsulta(situacion)
  const ladoContrario = Boolean(lado && primero && primero.valor.lado !== 'interno' && primero.valor.lado !== lado)
  const fiable = primero && primero.cobertura >= 0.7 && primero.puntaje >= 4 && !ladoContrario
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
