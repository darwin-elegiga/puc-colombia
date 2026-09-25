/** Búsqueda sobre las operaciones típicas y su relación con las cuentas. */
import { MOVIMIENTOS, type Movimiento } from '@/data/movimientos'
import { REGLA_LADO, type Lado } from '@/data/guia'
import { normalizar } from './puc'

const TEXTO = new Map(
  MOVIMIENTOS.map((m) => [
    m.id,
    normalizar(
      [m.nombre, m.descripcion, m.categoria, REGLA_LADO[m.lado].titulo, m.palabras.join(' '), m.asiento.map((r) => `${r.codigo} ${r.concepto}`).join(' ')].join(' '),
    ),
  ]),
)

/** Con lado, se queda solo con las operaciones de ese lado: «yo pago», «me pagan» o «sin pago». */
export function buscarMovimientos(consulta: string, limite = 12, lado: Lado | '' = ''): Movimiento[] {
  const q = normalizar(consulta)
  if (!q) return []

  const puntaje = (m: Movimiento) => {
    const nombre = normalizar(m.nombre)
    if (nombre.startsWith(q)) return 0
    if (nombre.includes(q)) return 1
    if (m.palabras.some((p) => normalizar(p).includes(q))) return 2
    return 3
  }

  return MOVIMIENTOS.filter((m) => (!lado || m.lado === lado) && (TEXTO.get(m.id) ?? '').includes(q))
    .sort((a, b) => puntaje(a) - puntaje(b) || a.nombre.localeCompare(b.nombre))
    .slice(0, limite)
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

export { MOVIMIENTOS }
export type { Movimiento }
