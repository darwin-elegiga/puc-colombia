/**
 * Índice consultable del catálogo: fusiona el catálogo oficial con las cuentas
 * creadas por el usuario y resuelve búsqueda, jerarquía y fichas.
 */
import {
  ETIQUETA_NIVEL, ESTADO_FINANCIERO, NIVELES, codigosAncestros, decodificar,
  longitudPadre, normalizar,
} from './puc'
import type { Cuenta, Ficha, Filtros, Nivel, ResultadoBusqueda } from './tipos'
import { Buscador, analizar, ladoDeConsulta, raiz } from './busqueda'
import { ALIAS_CUENTAS } from '@/data/sinonimos'

export interface Catalogo {
  lista: Cuenta[]
  indice: Map<string, Cuenta>
  hijosPor: Map<string, string[]>
  /** Motor de búsqueda por texto; se construye la primera vez que se busca. */
  motor: () => Buscador<Cuenta>
}

/**
 * Qué se indexa de cada cuenta y con qué peso: el nombre y sus alias coloquiales
 * mandan; la descripción oficial y la dinámica amplían el alcance con menos peso.
 */
function camposDe(c: Cuenta) {
  return [
    { texto: c.nombre, peso: 3 },
    { texto: (ALIAS_CUENTAS[c.codigo] ?? []).join(' · '), peso: 3 },
    { texto: c.descripcion, peso: 1 },
    { texto: [...(c.dinamica?.debita ?? []), ...(c.dinamica?.acredita ?? [])].join(' · '), peso: 0.5 },
  ]
}

/** Las cuentas personalizadas nunca sobrescriben una oficial con el mismo código. */
export function construirCatalogo(oficiales: Cuenta[], personalizadas: Cuenta[]): Catalogo {
  const indice = new Map<string, Cuenta>()
  for (const c of oficiales) indice.set(c.codigo, c)
  for (const c of personalizadas) if (!indice.has(c.codigo)) indice.set(c.codigo, c)

  const hijosPor = new Map<string, string[]>()
  for (const codigo of indice.keys()) {
    const lp = longitudPadre(codigo)
    if (lp === null) continue
    const padre = codigo.slice(0, lp)
    const actuales = hijosPor.get(padre)
    if (actuales) actuales.push(codigo)
    else hijosPor.set(padre, [codigo])
  }
  for (const lista of hijosPor.values()) lista.sort()

  const lista = [...indice.values()].sort((a, b) => a.codigo.localeCompare(b.codigo))

  let motor: Buscador<Cuenta> | null = null
  return { lista, indice, hijosPor, motor: () => (motor ??= new Buscador(lista, camposDe)) }
}

export const obtener = (cat: Catalogo, codigo: string) => cat.indice.get(codigo.trim())

export const hijosDe = (cat: Catalogo, codigo: string): Cuenta[] =>
  (cat.hijosPor.get(codigo) ?? []).map((c) => cat.indice.get(c)!).filter(Boolean)

export const ancestrosDe = (cat: Catalogo, codigo: string): Cuenta[] =>
  codigosAncestros(codigo).map((c) => cat.indice.get(c)).filter(Boolean) as Cuenta[]

/** Si la cuenta no define dinámica propia, se hereda la del ancestro más cercano que la tenga. */
function dinamicaDe(cat: Catalogo, cuenta: Cuenta) {
  if (cuenta.dinamica) return cuenta.dinamica
  for (const c of [...codigosAncestros(cuenta.codigo)].reverse()) {
    const ancestro = cat.indice.get(c)
    if (ancestro?.dinamica) return { ...ancestro.dinamica, heredadaDe: c }
  }
  return undefined
}

export function fichaDe(cat: Catalogo, codigo: string): Ficha | null {
  const cuenta = obtener(cat, codigo)
  if (!cuenta) return null
  return {
    ...cuenta,
    etiquetaNivel: ETIQUETA_NIVEL[cuenta.nivel],
    estadoFinanciero: ESTADO_FINANCIERO[cuenta.codigo[0]] ?? null,
    ancestros: ancestrosDe(cat, codigo).map(({ codigo, nombre, nivel }) => ({ codigo, nombre, nivel })),
    hijos: hijosDe(cat, codigo).map(({ codigo, nombre, nivel, naturaleza, origen }) => ({
      codigo, nombre, nivel, naturaleza, origen,
    })),
    anatomia: decodificar(codigo, (c) => cat.indice.get(c)).segmentos,
    dinamica: dinamicaDe(cat, cuenta),
  }
}

export const leerCodigo = (cat: Catalogo, codigo: string) =>
  decodificar(codigo, (c) => cat.indice.get(c))

const VERBOS_DE_LADO = new Set(['pagar', 'pago', 'cobrar', 'cobro', 'recibir', 'recibo', 'comprar', 'compre'].map(raiz))

/**
 * Si la consulta dice quién paga, suben las clases de ese lado: al pagar, gastos y
 * costos (5, 6, 7); al cobrar, ingresos (4), el disponible (11) y los deudores (13).
 * Las cuentas de orden (8, 9) casi nunca son lo que se busca en lenguaje natural.
 */
function pesoPorLado(codigo: string, lado: 'pago' | 'cobro' | null): number {
  if (codigo[0] === '8' || codigo[0] === '9') return 0.75
  // Ante un empate, la cuenta de 4 dígitos va antes que sus subcuentas y que el grupo.
  if (codigo.length === 4) return pesoPorLado(`x${codigo}`, lado) * 1.04
  const c = codigo.replace(/^x/, '')
  if (lado === 'pago' && '567'.includes(c[0])) return 1.3
  if (lado === 'cobro' && c[0] === '4') return 1.3
  if (lado === 'cobro' && (c.startsWith('11') || c.startsWith('13'))) return 1.1
  return 1
}

/**
 * Búsqueda por código o por texto, con filtros. Un número busca por código (exacto,
 * luego prefijo, luego contenido); un texto usa el motor en lenguaje natural.
 */
export function buscar(
  cat: Catalogo,
  filtros: Partial<Filtros>,
  limite = 60,
): ResultadoBusqueda {
  const consulta = normalizar(filtros.q ?? '')
  const esNumerica = /^\d+$/.test(consulta)
  const { clase = '', nivel = '', naturaleza = '', origen = '' } = filtros

  const coincideFiltros = (c: Cuenta) => {
    if (clase && c.codigo[0] !== clase) return false
    if (nivel && c.nivel !== nivel) return false
    if (naturaleza && c.naturaleza !== naturaleza) return false
    if (origen && c.origen !== origen) return false
    return true
  }
  const coincide = (c: Cuenta) => coincideFiltros(c) && (!consulta || c.codigo.includes(consulta))

  let encontradas: Cuenta[]

  if (!consulta || esNumerica) {
    encontradas = cat.lista.filter(coincide)
    if (consulta) {
      const puntaje = (c: Cuenta) => (c.codigo === consulta ? 0 : c.codigo.startsWith(consulta) ? 1 : 2)
      encontradas = [...encontradas].sort((a, b) => puntaje(a) - puntaje(b) || a.codigo.localeCompare(b.codigo))
    }
  } else {
    // Texto libre: raíces, sinónimos, errores de tecleo y cercanía (lib/busqueda.ts).
    // «Pagar» y «cobrar» no describen una cuenta sino el lado: orientan, pero no obligan.
    const q = filtros.q ?? ''
    const lado = ladoDeConsulta(q)
    encontradas = cat
      .motor()
      .buscar(analizar(q, VERBOS_DE_LADO))
      .map((r) => ({ ...r, puntaje: r.puntaje * pesoPorLado(r.valor.codigo, lado) }))
      .sort((a, b) => b.puntaje - a.puntaje)
      .map((r) => r.valor)
      .filter(coincideFiltros)
  }

  return {
    total: encontradas.length,
    resultados: encontradas.slice(0, limite).map((c) => ({
      codigo: c.codigo,
      nombre: c.nombre,
      nivel: c.nivel,
      naturaleza: c.naturaleza,
      origen: c.origen,
      resumen: resumir(c.descripcion),
      hijos: (cat.hijosPor.get(c.codigo) ?? []).length,
    })),
  }
}

/** Primer párrafo de la descripción, recortado para las listas. */
export function resumir(descripcion: string, largo = 150): string {
  const primero = descripcion.split('\n\n')[0]
  return primero.length > largo ? `${primero.slice(0, largo).trimEnd()}…` : primero
}

export interface NodoClase {
  codigo: string
  nombre: string
  naturaleza: Cuenta['naturaleza']
  grupos: { codigo: string; nombre: string; cuentas: number }[]
}

export function arbol(cat: Catalogo): NodoClase[] {
  return cat.lista
    .filter((c) => c.nivel === 'clase')
    .map((clase) => ({
      codigo: clase.codigo,
      nombre: clase.nombre,
      naturaleza: clase.naturaleza,
      grupos: hijosDe(cat, clase.codigo).map((g) => ({
        codigo: g.codigo,
        nombre: g.nombre,
        cuentas: (cat.hijosPor.get(g.codigo) ?? []).length,
      })),
    }))
}

export function estadisticas(cat: Catalogo) {
  const porNivel = {} as Record<Nivel, number>
  let personalizadas = 0
  for (const c of cat.lista) {
    porNivel[c.nivel] = (porNivel[c.nivel] ?? 0) + 1
    if (c.origen === 'personalizada') personalizadas += 1
  }
  return { total: cat.lista.length, porNivel, personalizadas }
}

/** Descripción de respaldo cuando una cuenta no trae texto propio. */
export function descripcionEfectiva(cat: Catalogo, ficha: Ficha): { texto: string; heredadaDe?: string } {
  if (ficha.descripcion) return { texto: ficha.descripcion }
  for (const c of [...ficha.ancestros].reverse()) {
    const ancestro = cat.indice.get(c.codigo)
    if (ancestro?.descripcion) return { texto: ancestro.descripcion, heredadaDe: ancestro.codigo }
  }
  return { texto: '' }
}

export { NIVELES }
