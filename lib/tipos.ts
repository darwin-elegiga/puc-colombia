/** Tipos del catálogo PUC. */

export type Nivel = 'clase' | 'grupo' | 'cuenta' | 'subcuenta' | 'auxiliar'
export type Naturaleza = 'debito' | 'credito'
export type Origen = 'oficial' | 'personalizada'

export interface Dinamica {
  debita: string[]
  acredita: string[]
  /** Código del ancestro del que se tomó la dinámica, cuando la cuenta no define una propia. */
  heredadaDe?: string
}

export interface Cuenta {
  codigo: string
  nombre: string
  nivel: Nivel
  naturaleza: Naturaleza
  /** true cuando la naturaleza contradice la de su clase, como en depreciación acumulada. */
  naturalezaForzada?: boolean
  descripcion: string
  dinamica?: Dinamica
  origen: Origen
  creada?: string
}

/** Datos que escribe el usuario al crear o editar una cuenta. */
export interface BorradorCuenta {
  codigo: string
  nombre: string
  descripcion?: string
  naturaleza?: Naturaleza | ''
}

export interface Segmento {
  codigo: string
  digitos: string
  nivel: Nivel
  etiqueta: string
  nombre: string | null
  existe: boolean
  /** true en el tramo auxiliar, que cada empresa define libremente. */
  libre?: boolean
  /** true cuando sobran dígitos porque la longitud no corresponde a ningún nivel. */
  incompleto?: boolean
}

export interface Lectura {
  codigo: string
  nivel: Nivel | null
  naturaleza: Naturaleza | null
  estadoFinanciero: string | null
  registrada: boolean
  /** Los códigos del PUC tienen 1, 2, 4 o 6 dígitos (7 o más para auxiliares). */
  longitudValida: boolean
  segmentos: Segmento[]
}

export interface Ficha extends Cuenta {
  etiquetaNivel: string
  estadoFinanciero: string | null
  ancestros: Pick<Cuenta, 'codigo' | 'nombre' | 'nivel'>[]
  hijos: Pick<Cuenta, 'codigo' | 'nombre' | 'nivel' | 'naturaleza' | 'origen'>[]
  anatomia: Segmento[]
  dinamica?: Dinamica
}

export interface Filtros {
  q: string
  clase: string
  nivel: Nivel | ''
  naturaleza: Naturaleza | ''
  origen: Origen | ''
}

export interface ResultadoBusqueda {
  total: number
  resultados: (Pick<Cuenta, 'codigo' | 'nombre' | 'nivel' | 'naturaleza' | 'origen'> & {
    resumen: string
    hijos: number
  })[]
}
