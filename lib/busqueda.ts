/**
 * Motor de búsqueda en lenguaje natural para cuentas y movimientos.
 *
 * Una consulta como «qué cuenta uso cuando le pagué el arriendo al dueño del local»
 * tiene que encontrar lo mismo que «arriendo». Para eso cada texto se parte en
 * palabras, se reduce a su raíz y se compara con la consulta en varios grados:
 *
 *   1. misma raíz              pagué · pago · pagar · pagamos  → «pag»
 *   2. sinónimo o coloquial    plata · efectivo · dinero        (data/sinonimos.ts)
 *   3. prefijo                 «depre» → depreciación, mientras se escribe
 *   4. parecida                «arrienod», «nómnia» (distancia de edición con transposiciones)
 *
 * Las frases hechas («cuatro por mil», «caja chica», «me pagaron») se reconocen
 * enteras y se traducen a las palabras que usa el catálogo. Además de cuántas
 * palabras de la consulta aparecen, se puntúa la cercanía: si están juntas en el
 * mismo campo —«caja menor», «pago nómina»— el resultado sube, y más aún si aparece
 * la frase completa. Las palabras de relleno («qué cuenta uso para…») se descartan
 * y las muy generales no obligan a coincidir.
 *
 * Funciones puras: no dependen de React ni del almacenamiento.
 */
import { CONCEPTOS, FRASES, FRASES_LADO, GRUPOS_SINONIMOS } from '@/data/sinonimos'

/* ─────────────────────────── Texto ─────────────────────────── */

export const normalizarTexto = (texto: unknown): string =>
  String(texto ?? '')
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()

/** Palabras que no aportan nada a la búsqueda. */
const VACIAS = new Set(
  (
    'a al ante con contra de del desde el en entre hacia hasta la las lo los para por segun sin sobre tras ' +
    'un una unos unas y e o u ni que qu q se me mi mis te tu tus le les nos su sus yo ella ellos ' +
    'es son fue era ser estar esta este esto estos estas eso esa ese esos esas aquel ha han he hay ' +
    'como cual cuales cuando donde quien muy mas pero ya tambien solo si no algo alguna alguno ' +
    'porque pues entonces asi aqui alli ' +
    // Importes y fechas: describen la operación pero no ayudan a identificarla.
    'peso pesos cop mil millon millones valor total precio suma cantidad hoy ayer ' +
    'enero febrero marzo abril mayo junio julio agosto septiembre octubre noviembre diciembre'
  ).split(' '),
)

/**
 * Palabras de la pregunta contable, no de la operación: «qué cuenta uso para…».
 * Si coinciden suman un poco, pero si faltan no penalizan la coincidencia.
 */
const SUAVES = new Set(
  (
    'cuenta cuentas uso usar usa utilizo utilizar registro registrar registra contabilizo contabilizar ' +
    'contabiliza asiento asientos puc codigo codigos deberia pongo poner meto va van hago hacer ' +
    'tengo tener necesito quiero caso vez dia mes empresa negocio'
  ).split(' '),
)

/** Palabras cuya raíz automática chocaría con otra de significado distinto. */
const RAICES_FIJAS = new Map<string, string>(Object.entries({
  prestacion: 'prestacion', prestaciones: 'prestacion',
  contador: 'contador', contadora: 'contador', contadores: 'contador',
  renta: 'renta', rentas: 'renta',
  prima: 'prima', primas: 'prima',
  caja: 'caja', cajas: 'caja',
  iva: 'iva', ica: 'ica', gmf: 'gmf', eps: 'eps', arl: 'arl', pila: 'pila',
  utilidad: 'utilidad', utilidades: 'utilidad', util: 'utiles', utiles: 'utiles',
}))

const SUFIJOS = [
  'amientos', 'imientos', 'aciones', 'iciones', 'amiento', 'imiento', 'idades',
  'ieron', 'iendo', 'ando', 'aron', 'ados', 'adas', 'idos', 'idas', 'acion', 'icion', 'idad',
  'mente', 'ables', 'ibles', 'able', 'ible', 'antes', 'ante', 'entes', 'ente',
  'amos', 'emos', 'imos', 'aban', 'aba', 'ado', 'ada', 'ido', 'ida', 'io', 'ar', 'er', 'ir',
  'es', 'os', 'as', 'a', 'e', 'i', 'o', 's',
]

/**
 * Raíz aproximada de una palabra en español: quita plurales, género, sufijos de
 * derivación y terminaciones verbales frecuentes. No es un lematizador completo,
 * pero agrupa lo que importa aquí: pago · pagos · pagar · pagué · pagamos · pagado,
 * o vendo · vendí · vendió · vender.
 */
export function raiz(palabra: string): string {
  // Un Map y no un objeto: «constructor» o «toString» no deben leerse como propiedades heredadas.
  const fija = RAICES_FIJAS.get(palabra)
  if (fija) return fija
  if (palabra.length <= 3 || /\d/.test(palabra)) return palabra

  // Pretérito de primera persona: pagué → pag, saqué → sac.
  if (palabra.endsWith('gue') && palabra.length > 4) return palabra.slice(0, -2)
  if (palabra.endsWith('que') && palabra.length > 4) return palabra.slice(0, -3) + 'c'

  for (const sufijo of SUFIJOS) {
    if (palabra.endsWith(sufijo) && palabra.length - sufijo.length >= 3) return palabra.slice(0, -sufijo.length)
  }
  return palabra
}

/**
 * Clave fonética: dos escrituras que suenan igual en español dan la misma clave.
 * Cubre la h muda (orarios = horarios), b/v, s/c/z, ll/y, g/j, qu/k, x/cs y las
 * letras dobles, que son los errores más frecuentes al escribir de oído.
 */
export function fonetica(palabra: string): string {
  return palabra
    .replace(/ch/g, '§')
    .replace(/h/g, '')
    .replace(/§/g, 'ch')
    .replace(/qu([ei])/g, 'k$1')
    .replace(/c([ei])/g, 's$1')
    .replace(/g([ei])/g, 'j$1')
    .replace(/gu([ei])/g, 'g$1')
    .replace(/c/g, 'k')
    .replace(/q/g, 'k')
    .replace(/z/g, 's')
    .replace(/x/g, 'ks')
    .replace(/v/g, 'b')
    .replace(/w/g, 'u')
    .replace(/ll/g, 'y')
    .replace(/y(?=[^aeiou]|$)/g, 'i')
    .replace(/ñ/g, 'n')
    .replace(/(.)\1+/g, '$1')
}

/** Raíz de cómo suena la palabra: «vacasiones» y «vacaciones» dan lo mismo. */
export const sonidoDe = (palabra: string) => raiz(fonetica(palabra))

/** Parte un texto en palabras normalizadas, conservando números como 4x1000 o 110505. */
export function palabras(texto: string): string[] {
  return normalizarTexto(texto).match(/[a-z0-9ñ]+/g) ?? []
}

const tokensDe = (texto: string) =>
  palabras(texto)
    .filter((p) => !VACIAS.has(p))
    .map((p) => ({ raiz: raiz(p), sonido: sonidoDe(p) }))

/* ─────────────────────────── Sinónimos y frases ─────────────────────────── */

/**
 * Los sinónimos de una sola palabra se enlazan por raíz. Los de varias palabras
 * («impuesto a las ventas») se tratan como frases: si aparecen en la consulta, se
 * añade la palabra principal del grupo. Así «ventas» sola no arrastra al IVA.
 */
const SINONIMOS = new Map<string, Set<string>>()
const FRASES_DE_GRUPOS: [string, string][] = []

for (const grupo of GRUPOS_SINONIMOS) {
  const sueltas = grupo.filter((t) => palabras(t).length === 1)
  const raices = new Set(sueltas.map((t) => raiz(palabras(t)[0])))
  for (const r of raices) {
    const actuales = SINONIMOS.get(r) ?? new Set<string>()
    for (const otra of raices) if (otra !== r) actuales.add(otra)
    SINONIMOS.set(r, actuales)
  }
  const principal = sueltas[0]
  if (principal) {
    for (const frase of grupo) if (palabras(frase).length > 1) FRASES_DE_GRUPOS.push([frase, principal])
  }
}

/**
 * Conceptos relacionados sin ser sinónimos: «nómina» se acerca a salario,
 * prestaciones y parafiscales. Coinciden con menos fuerza que un sinónimo.
 */
const RELACIONADOS = new Map<string, Set<string>>()
for (const concepto of CONCEPTOS) {
  const raices = new Set(concepto.filter((t) => palabras(t).length === 1).map((t) => raiz(palabras(t)[0])))
  for (const r of raices) {
    const actuales = RELACIONADOS.get(r) ?? new Set<string>()
    for (const otra of raices) if (otra !== r) actuales.add(otra)
    RELACIONADOS.set(r, actuales)
  }
}

const prepararFrases = (entradas: [string, string][]) =>
  entradas
    .map(([frase, equivale]) => [` ${palabras(frase).join(' ')} `, palabras(equivale)] as const)
    .sort((a, b) => b[0].length - a[0].length)

const FRASES_CONTENIDO = prepararFrases([...Object.entries(FRASES), ...FRASES_DE_GRUPOS])
const FRASES_QUIEN_PAGA = prepararFrases(Object.entries(FRASES_LADO))

/**
 * Quién paga según cómo está escrita la consulta: «me pagaron el arriendo» es
 * cobrar; «pagué el arriendo», pagar. Se usa para ordenar primero ese lado.
 */
export function ladoDeConsulta(consulta: string): 'pago' | 'cobro' | 'interno' | null {
  const t = ` ${palabras(consulta).join(' ')} `
  // «El cliente no me paga»: no entra ni sale dinero; es un problema de cartera.
  if (/ no (me |nos |le |les )?(pag|consign|transfir|abon|cancel)/.test(t)) return 'interno'
  if (/ (me|nos) (pag|consign|transfir|abon|gir|devolv|dan |dieron|prest)|cobr|recib|recaud|me deben|entra (plata|dinero)|vend| factur(e|o|amos|aron) | ingres/.test(t)) return 'cobro'
  if (/ (pag|cancel|compr|le (pag|debo|di|doy|prest|devuelv))|sale (plata|dinero)|gast| egres/.test(t)) return 'pago'
  return null
}

/* ─────────────────────────── Consulta ─────────────────────────── */

export interface Termino {
  palabra: string
  raiz: string
  /** Clave fonética de la raíz, para encontrar lo mal escrito que suena igual. */
  sonido: string
  /** true si es de las palabras generales que no obligan a coincidir. */
  suave: boolean
  /** true en la última palabra escrita, que puede estar a medias: admite prefijos. */
  ultimo: boolean
}

export interface Consulta {
  texto: string
  terminos: Termino[]
}

export function analizar(consulta: string, extraSuaves: Set<string> = new Set()): Consulta {
  const escritas = palabras(consulta)
  const texto = ` ${escritas.join(' ')} `
  const cubiertas = new Set<string>()
  const añadidas: { palabra: string; suave: boolean }[] = []

  // Frases de contenido: «cuatro por mil» → gmf. Las palabras de la frase dejan de ser obligatorias.
  for (const [frase, equivale] of FRASES_CONTENIDO) {
    if (!texto.includes(frase)) continue
    frase.trim().split(' ').forEach((p) => cubiertas.add(p))
    equivale.forEach((p) => añadidas.push({ palabra: p, suave: false }))
  }
  // Frases de quién paga: «me pagaron» → cobro. Solo orientan, no obligan.
  for (const [frase, equivale] of FRASES_QUIEN_PAGA) {
    if (!texto.includes(frase)) continue
    frase.trim().split(' ').forEach((p) => cubiertas.add(p))
    equivale.forEach((p) => añadidas.push({ palabra: p, suave: true }))
  }

  const ultima = escritas.at(-1)
  const vistas = new Map<string, Termino>()
  const agregar = (palabra: string, suave: boolean) => {
    if (!palabra || VACIAS.has(palabra)) return
    const r = raiz(palabra)
    const previo = vistas.get(r)
    if (previo) {
      if (!suave) previo.suave = false
      return
    }
    vistas.set(r, { palabra, raiz: r, sonido: sonidoDe(palabra), suave, ultimo: palabra === ultima })
  }
  for (const palabra of escritas) {
    // Los números sueltos son importes; los códigos se buscan por la vía numérica.
    if (/^\d+$/.test(palabra)) continue
    agregar(palabra, SUAVES.has(palabra) || cubiertas.has(palabra) || extraSuaves.has(raiz(palabra)))
  }
  for (const { palabra, suave } of añadidas) agregar(palabra, suave)

  const terminos = [...vistas.values()]
  // Si todo quedó como suave («cuenta»), esas palabras son la búsqueda.
  if (terminos.length && terminos.every((t) => t.suave)) terminos.forEach((t) => (t.suave = false))
  return { texto: texto.trim(), terminos }
}

/* ─────────────────────────── Índice ─────────────────────────── */

export interface Campo {
  texto: string
  /** Importancia del campo: el nombre pesa más que la descripción. */
  peso: number
}

interface CampoIndexado {
  peso: number
  texto: string
  raices: string[]
}

export interface Resultado<T> {
  valor: T
  puntaje: number
  /** Parte de las palabras obligatorias de la consulta que se encontraron (0 a 1). */
  cobertura: number
}

/** Distancia de edición contando la transposición de dos letras como un solo error. */
function distancia(a: string, b: string, tope: number): number {
  if (Math.abs(a.length - b.length) > tope) return tope + 1
  const d: number[][] = Array.from({ length: a.length + 1 }, (_, i) => [i, ...Array(b.length).fill(0)])
  for (let j = 1; j <= b.length; j++) d[0][j] = j
  for (let i = 1; i <= a.length; i++) {
    let minimo = Infinity
    for (let j = 1; j <= b.length; j++) {
      const costo = a[i - 1] === b[j - 1] ? 0 : 1
      d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + costo)
      if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) d[i][j] = Math.min(d[i][j], d[i - 2][j - 2] + 1)
      minimo = Math.min(minimo, d[i][j])
    }
    if (minimo > tope) return tope + 1
  }
  return d[a.length][b.length]
}

/** Grado de coincidencia de un término de la consulta con una raíz del texto (y su sonido). */
function grado(t: Termino, d: string, sonidoD: string): number {
  const q = t.raiz
  if (q === d) return 1
  if (t.sonido.length >= 3 && t.sonido === sonidoD) return 0.9
  if (SINONIMOS.get(q)?.has(d)) return 0.85
  // Prefijo de lo que se está escribiendo: «depre» → depreciación. Se compara con la palabra tal
  // cual, no con su raíz, para que «contador» no se vuelva prefijo de «control».
  if (t.ultimo && t.palabra.length >= 3 && d.startsWith(t.palabra)) return 0.75
  if (q.length >= 5 && d.startsWith(q) && d.length - q.length <= 3) return 0.7
  if (q.length >= 5 && d.length >= 4) {
    const tope = q.length >= 8 ? 2 : 1
    if (distancia(q, d, tope) <= tope || distancia(t.sonido, sonidoD, tope) <= tope) return 0.6
  }
  if (RELACIONADOS.get(q)?.has(d)) return 0.5
  return 0
}

export class Buscador<T> {
  private documentos: { valor: T; campos: CampoIndexado[] }[]
  /** Pares raíz–sonido distintos del índice. */
  private vocabulario: [string, string][]

  /**
   * pesoPrecision: cuánto premia que la consulta cubra entero el primer campo. Útil
   * con nombres descriptivos largos (los movimientos); con nombres de una o dos
   * palabras (las cuentas) favorecería a cualquier sinónimo suelto.
   */
  constructor(
    valores: T[],
    campos: (valor: T) => Campo[],
    private pesoPrecision = 0,
  ) {
    const vocabulario = new Map<string, [string, string]>()
    this.documentos = valores.map((valor) => ({
      valor,
      campos: campos(valor)
        .filter((c) => c.texto)
        .map((c) => {
          const tokens = tokensDe(c.texto)
          tokens.forEach((t) => vocabulario.set(`${t.raiz}|${t.sonido}`, [t.raiz, t.sonido]))
          return { peso: c.peso, texto: ` ${palabras(c.texto).join(' ')} `, raices: tokens.map((t) => t.raiz) }
        }),
    }))
    this.vocabulario = [...vocabulario.values()]
  }

  /** Para cada término, las raíces del índice que le corresponden y con qué grado. */
  private expandir(termino: Termino): Map<string, number> {
    const mapa = new Map<string, number>()
    for (const [d, sonido] of this.vocabulario) {
      const g = grado(termino, d, sonido)
      if (g > (mapa.get(d) ?? 0)) mapa.set(d, g)
    }
    return mapa
  }

  buscar(consulta: string | Consulta): Resultado<T>[] {
    const q = typeof consulta === 'string' ? analizar(consulta) : consulta
    if (!q.terminos.length) return []

    const expansiones = q.terminos.map((t) => this.expandir(t))
    const obligatorios = q.terminos.map((t, i) => ({ t, e: expansiones[i] })).filter(({ t }) => !t.suave)
    const frase = ` ${palabras(q.texto).filter((p) => !VACIAS.has(p) && !SUAVES.has(p)).join(' ')} `
    const resultados: Resultado<T>[] = []

    for (const doc of this.documentos) {
      let puntaje = 0
      let encontradas = 0

      q.terminos.forEach((termino, i) => {
        let mejor = 0
        for (const campo of doc.campos) {
          for (const r of campo.raices) {
            const g = expansiones[i].get(r)
            if (g && g * campo.peso > mejor) mejor = g * campo.peso
          }
        }
        if (mejor === 0) return
        puntaje += termino.suave ? mejor * 0.3 : mejor
        if (!termino.suave) encontradas += 1
      })
      if (encontradas === 0) continue
      const cobertura = encontradas / obligatorios.length

      // Cercanía: dos palabras seguidas de la consulta a 3 posiciones o menos dentro del mismo campo.
      let cercania = 0
      for (let i = 0; i < obligatorios.length - 1; i++) {
        const a = obligatorios[i].e
        const b = obligatorios[i + 1].e
        for (const campo of doc.campos) {
          const pa = campo.raices.flatMap((r, k) => (a.has(r) ? [k] : []))
          if (!pa.length) continue
          const pb = campo.raices.flatMap((r, k) => (b.has(r) ? [k] : []))
          if (pa.some((x) => pb.some((y) => x !== y && Math.abs(x - y) <= 3))) {
            cercania += campo.peso
            break
          }
        }
      }

      // Precisión en el campo principal (el nombre): qué parte de sus palabras pidió la consulta.
      // Entre «Vendo mercancía a crédito» y «Vendo a crédito y el cliente me practica retención»,
      // la consulta «vendí mercancía a crédito» cubre entero el primero.
      const principal = doc.campos[0]
      let precision = 0
      if (this.pesoPrecision && principal?.raices.length) {
        const pedidas = principal.raices.filter((r) => expansiones.some((e) => (e.get(r) ?? 0) >= 0.85))
        precision = pedidas.length / principal.raices.length
      }

      // La frase escrita tal cual en algún campo.
      const fraseExacta = frase.trim().includes(' ') && doc.campos.some((c) => c.texto.includes(frase))

      puntaje = puntaje * (0.35 + 0.65 * cobertura * cobertura) + cercania * 0.8 + precision * this.pesoPrecision + (fraseExacta ? 4 : 0)
      resultados.push({ valor: doc.valor, puntaje, cobertura })
    }

    // Con una o dos palabras se exige que estén todas; si nada las tiene todas, se aceptan parciales.
    const minimo = obligatorios.length <= 2 ? 1 : 0.6
    const completos = resultados.filter((r) => r.cobertura >= minimo)
    const lista = completos.length ? completos : resultados.filter((r) => r.cobertura >= 0.5)
    return lista.sort((a, b) => b.puntaje - a.puntaje)
  }
}
