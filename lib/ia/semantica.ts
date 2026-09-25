/**
 * Búsqueda por significado: segunda capa, cuando las palabras no coinciden.
 *
 * Cada cuenta y cada movimiento se convierte una sola vez en un vector (embedding)
 * al generar los datos (`npm run embeddings`). En tiempo de consulta solo se
 * vectoriza la pregunta y se compara con el índice por producto escalar: los
 * vectores de Gemini vienen normalizados, así que el producto es la similitud coseno.
 *
 * Para que el índice pese poco, cada vector se guarda en int8 con su escala:
 * 569 documentos × 768 dimensiones ≈ 440 KB, frente a 1,7 MB en float32.
 *
 * Funciones puras: las usan el script de generación, la ruta de la API y las pruebas.
 */
import type { Cuenta } from '../tipos'
import type { Movimiento } from '../../data/movimientos'

export type TipoDocumento = 'cuenta' | 'movimiento'

export interface EntradaIndice {
  tipo: TipoDocumento
  /** Código de la cuenta o id del movimiento. */
  id: string
  /** Vector cuantizado a int8, en base64. */
  v: string
  /** Escala para volver del int8 al valor real. */
  e: number
}

export interface IndiceSemantico {
  modelo: string
  dimensiones: number
  generado: string | null
  entradas: EntradaIndice[]
}

export interface Parecido {
  tipo: TipoDocumento
  id: string
  similitud: number
}

/* ───────────────────── Textos que se vectorizan ───────────────────── */

const recortar = (texto: string, largo: number) =>
  texto.length > largo ? `${texto.slice(0, largo).trimEnd()}…` : texto

/**
 * La cuenta con su ruta completa («Activo › Disponible › Caja»): el nombre solo,
 * sin la clase y el grupo, deja ambiguas cuentas como «Diversos» o «Otros».
 */
export function textoDeCuenta(cuenta: Cuenta, ruta: string[]): string {
  const titulo = `${cuenta.codigo} ${cuenta.nombre}`
  const partes = [
    ruta.length ? `Ruta: ${ruta.join(' › ')}` : '',
    cuenta.descripcion,
    cuenta.dinamica?.debita.length ? `Se debita: ${cuenta.dinamica.debita.join(' ')}` : '',
    cuenta.dinamica?.acredita.length ? `Se acredita: ${cuenta.dinamica.acredita.join(' ')}` : '',
  ].filter(Boolean)
  return `title: ${titulo} | text: ${recortar(partes.join('\n'), 1800)}`
}

export function textoDeMovimiento(m: Movimiento): string {
  const partes = [
    m.descripcion,
    `También se dice: ${m.palabras.join(', ')}`,
    `Asiento: ${m.asiento.map((r) => `${r.efecto === 'debito' ? 'débito' : 'crédito'} ${r.codigo} ${r.concepto}`).join('; ')}`,
    m.nota ?? '',
  ].filter(Boolean)
  return `title: ${m.nombre} | text: ${recortar(partes.join('\n'), 1800)}`
}

/** Gemini Embedding 2 no recibe el tipo de tarea como parámetro: va escrito en el texto. */
export const textoDeConsulta = (consulta: string) => `task: search result | query: ${consulta.trim()}`

/* ─────────────────────────── Vectores ─────────────────────────── */

export function cuantizar(vector: number[]): { v: string; e: number } {
  const maximo = vector.reduce((m, x) => Math.max(m, Math.abs(x)), 0) || 1
  const e = maximo / 127
  const enteros = Int8Array.from(vector, (x) => Math.round(x / e))
  return { v: Buffer.from(enteros.buffer).toString('base64'), e }
}

export function decuantizar(entrada: Pick<EntradaIndice, 'v' | 'e'>): Float32Array {
  const bytes = Buffer.from(entrada.v, 'base64')
  const enteros = new Int8Array(bytes.buffer, bytes.byteOffset, bytes.byteLength)
  return Float32Array.from(enteros, (x) => x * entrada.e)
}

export function normalizarVector(vector: ArrayLike<number>): Float32Array {
  let suma = 0
  for (let i = 0; i < vector.length; i++) suma += vector[i] * vector[i]
  const norma = Math.sqrt(suma) || 1
  return Float32Array.from(vector, (x) => x / norma)
}

function producto(a: Float32Array, b: Float32Array): number {
  let s = 0
  for (let i = 0; i < a.length; i++) s += a[i] * b[i]
  return s
}

/**
 * Índice listo para consultar: los vectores se decodifican y normalizan una vez
 * (la cuantización altera levemente la norma).
 */
export class BuscadorSemantico {
  private readonly vectores: { tipo: TipoDocumento; id: string; vector: Float32Array }[]

  constructor(readonly indice: IndiceSemantico) {
    this.vectores = indice.entradas.map((en) => ({
      tipo: en.tipo,
      id: en.id,
      vector: normalizarVector(decuantizar(en)),
    }))
  }

  get vacio() {
    return this.vectores.length === 0
  }

  /**
   * Los documentos más parecidos a la consulta, por encima de `minimo`.
   * Con `limite` por tipo, para que los movimientos no desplacen a las cuentas.
   */
  cercanos(
    consulta: ArrayLike<number>,
    { minimo = 0.5, limite = 8 }: { minimo?: number; limite?: number } = {},
  ): Parecido[] {
    const q = normalizarVector(consulta)
    if (this.vectores.length && q.length !== this.vectores[0].vector.length) {
      throw new Error(`La consulta tiene ${q.length} dimensiones y el índice ${this.vectores[0].vector.length}`)
    }
    const todos = this.vectores
      .map((d) => ({ tipo: d.tipo, id: d.id, similitud: producto(q, d.vector) }))
      .filter((p) => p.similitud >= minimo)
      .sort((a, b) => b.similitud - a.similitud)
    const cuentas = todos.filter((p) => p.tipo === 'cuenta').slice(0, limite)
    const movimientos = todos.filter((p) => p.tipo === 'movimiento').slice(0, limite)
    return [...movimientos, ...cuentas]
  }
}
