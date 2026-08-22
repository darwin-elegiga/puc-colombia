/**
 * Lógica del entrenamiento del debe y el haber.
 * Funciones puras: no tocan React ni el almacenamiento.
 *
 * Las respuestas se guardan en un arreglo paralelo al de renglones, así que la
 * posición hace de identificador y los datos no necesitan llevar uno propio.
 */
import { EJERCICIOS, NIVELES, type Columna, type Ejercicio } from '@/data/ejercicios'

export interface Respuesta {
  columna: Columna | null
  codigo: string | null
}

export interface Veredicto {
  columna: boolean
  /** true cuando el ejercicio no pide cuenta: ese acierto se da por cumplido. */
  cuenta: boolean
  ok: boolean
}

export interface Calificacion {
  veredictos: Veredicto[]
  aciertos: number
  total: number
  perfecto: boolean
}

export const respuestasVacias = (ejercicio: Ejercicio): Respuesta[] =>
  ejercicio.renglones.map(() => ({ columna: null, codigo: null }))

/** Un renglón está resuelto cuando tiene columna y, si se pide, también cuenta. */
export const renglonListo = (ejercicio: Ejercicio, respuesta: Respuesta): boolean =>
  respuesta.columna !== null && (ejercicio.pide === 'columna' || respuesta.codigo !== null)

export const estaCompleto = (ejercicio: Ejercicio, respuestas: Respuesta[]): boolean =>
  respuestas.length === ejercicio.renglones.length &&
  respuestas.every((r) => renglonListo(ejercicio, r))

/** Suma de lo ubicado en cada columna, para el control de cuadre en vivo. */
export function sumas(ejercicio: Ejercicio, respuestas: Respuesta[]) {
  let debe = 0
  let haber = 0
  ejercicio.renglones.forEach((renglon, i) => {
    const columna = respuestas[i]?.columna
    if (columna === 'debe') debe += renglon.importe
    if (columna === 'haber') haber += renglon.importe
  })
  return { debe, haber, diferencia: debe - haber, cuadra: debe === haber && debe > 0 }
}

export function calificar(ejercicio: Ejercicio, respuestas: Respuesta[]): Calificacion {
  const veredictos = ejercicio.renglones.map((renglon, i) => {
    const respuesta = respuestas[i] ?? { columna: null, codigo: null }
    const columna = respuesta.columna === renglon.columna
    const cuenta = ejercicio.pide === 'columna' ? true : respuesta.codigo === renglon.codigo
    return { columna, cuenta, ok: columna && cuenta }
  })
  const aciertos = veredictos.filter((v) => v.ok).length
  return {
    veredictos,
    aciertos,
    total: veredictos.length,
    perfecto: aciertos === veredictos.length,
  }
}

/** Cuentas que ofrece el ejercicio, en el orden del banco o el del código. */
export const bancoDe = (ejercicio: Ejercicio): string[] =>
  ejercicio.banco ?? [...new Set(ejercicio.renglones.map((r) => r.codigo))].sort()

export const ejercicioPorId = (id: string): Ejercicio | undefined =>
  EJERCICIOS.find((e) => e.id === id)

export const posicionDe = (id: string): number => EJERCICIOS.findIndex((e) => e.id === id)

export const siguienteDe = (id: string): Ejercicio | undefined =>
  EJERCICIOS[posicionDe(id) + 1]

export interface GrupoNivel {
  numero: number
  titulo: string
  resumen: string
  ejercicios: Ejercicio[]
}

export const porNivel = (): GrupoNivel[] =>
  NIVELES.map((nivel) => ({
    numero: nivel.numero,
    titulo: nivel.titulo,
    resumen: nivel.resumen,
    ejercicios: EJERCICIOS.filter((e) => e.nivel === nivel.numero),
  }))

/**
 * Importe en pesos con separador de miles.
 * Se formatea a mano y no con Intl para que el servidor y el navegador escriban
 * exactamente lo mismo: una diferencia de local rompería la hidratación.
 */
export function pesos(valor: number): string {
  const signo = valor < 0 ? '−' : ''
  const digitos = Math.round(Math.abs(valor)).toString()
  return `${signo}$${digitos.replace(/\B(?=(\d{3})+(?!\d))/g, '.')}`
}

export { EJERCICIOS, NIVELES }
export type { Columna, Ejercicio }
