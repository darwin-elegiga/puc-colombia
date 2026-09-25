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
])

/** Con lado, se queda solo con las operaciones de ese lado: «yo pago», «me pagan» o «sin pago». */
export function buscarMovimientos(consulta: string, limite = 12, lado: Lado | '' = ''): Movimiento[] {
  if (!consulta.trim()) return []
  const preferido = ladoDeConsulta(consulta)
  return MOTOR.buscar(consulta)
    .filter((r) => !lado || r.valor.lado === lado)
    .map((r) => ({ ...r, puntaje: r.puntaje * (preferido && r.valor.lado === preferido ? 1.35 : 1) }))
    .sort((a, b) => b.puntaje - a.puntaje)
    .slice(0, limite)
    .map((r) => r.valor)
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
