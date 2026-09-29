/**
 * Práctica del asiento completo: dado un enunciado, se escribe el asiento en una hoja
 * con las columnas Código, Cuenta o concepto, Debe y Haber, como en Excel.
 * Funciones puras: no tocan React ni el almacenamiento.
 *
 * Los ejercicios salen de dos fuentes:
 *  - los del entrenamiento (data/ejercicios.ts), con su enunciado y su solución;
 *  - las operaciones del buscador (data/movimientos.ts), que no traen importes: aquí
 *    se les inventan importes redondos y se calculan los impuestos con su tarifa, de
 *    forma determinista para que cada ejercicio sea siempre el mismo.
 */
import { EJERCICIOS, NIVELES } from '@/data/ejercicios'
import { MOVIMIENTOS, type Movimiento } from '@/data/movimientos'

export type Columna = 'debe' | 'haber'

export interface LineaSolucion {
  codigo: string
  columna: Columna
  importe: number
  concepto: string
}

/** Un dato del enunciado: un importe dado o una tarifa con la que calcularlo. */
export interface Dato {
  texto: string
  importe?: number
  /** En tanto por uno: 0.19 es el 19 %. */
  tasa?: number
  /** Sobre qué se aplica la tarifa. */
  sobre?: 'base' | 'iva'
  /** La tarifa dicha con palabras: «19 % sobre la base». */
  etiqueta?: string
}

export interface EjercicioAsiento {
  /** «e-…» los del entrenamiento; «o-…» los generados desde una operación. */
  id: string
  origen: 'entrenamiento' | 'operacion'
  /** Nivel del entrenamiento o categoría de la operación, para agruparlos. */
  grupo: string
  titulo: string
  enunciado: string
  datos: Dato[]
  solucion: LineaSolucion[]
  explicacion: string
}

/* ─────────────────────────── Hoja ─────────────────────────── */

export interface Fila {
  codigo: string
  debe: number | null
  haber: number | null
}

export const filaVacia = (): Fila => ({ codigo: '', debe: null, haber: null })

export const estaVacia = (f: Fila) => !f.codigo && !f.debe && !f.haber

/** Siempre queda un renglón vacío al final para seguir escribiendo, como en una hoja de cálculo. */
export function conRenglonLibre(filas: Fila[], minimo = 2): Fila[] {
  const salida = [...filas]
  while (salida.length > minimo && estaVacia(salida.at(-1)!) && estaVacia(salida.at(-2)!)) salida.pop()
  if (!salida.length || !estaVacia(salida.at(-1)!)) salida.push(filaVacia())
  while (salida.length < minimo) salida.push(filaVacia())
  return salida
}

export function sumas(filas: Fila[]) {
  const debe = filas.reduce((s, f) => s + (f.debe ?? 0), 0)
  const haber = filas.reduce((s, f) => s + (f.haber ?? 0), 0)
  return { debe, haber, diferencia: debe - haber, cuadra: debe === haber && debe > 0 }
}

/* ─────────────────────────── Corrección ─────────────────────────── */

/**
 * Qué le pasa a cada renglón escrito:
 *  - ok: cuenta, columna e importe coinciden con la solución;
 *  - importe: la cuenta y la columna están bien, el valor no;
 *  - columna: la cuenta es la correcta pero va en la otra columna;
 *  - cuenta: la columna y el valor corresponden a un renglón, pero la cuenta no;
 *  - sobra: no corresponde a ningún renglón de la solución.
 */
export type Estado = 'ok' | 'importe' | 'columna' | 'cuenta' | 'sobra'

export interface Correccion {
  /** Uno por fila; null en las filas vacías. */
  estados: (Estado | null)[]
  /** Renglones de la solución que nadie escribió. */
  faltan: LineaSolucion[]
  aciertos: number
  total: number
  perfecto: boolean
}

/**
 * Vale la cuenta exacta; y si la solución es una cuenta de 4 dígitos, también cualquiera
 * de sus subcuentas. Si la solución es una subcuenta, se exige esa subcuenta.
 */
export const cuentaValida = (escrita: string, esperada: string) =>
  escrita === esperada || (esperada.length === 4 && escrita.length === 6 && escrita.startsWith(esperada))

const columnaDe = (f: Fila): Columna | null => (f.debe ? 'debe' : f.haber ? 'haber' : null)
const importeDe = (f: Fila) => f.debe ?? f.haber ?? 0

/** Suma los renglones que repiten cuenta y columna: partir o juntar un renglón no es un error. */
function agrupar(lineas: { codigo: string; columna: Columna | null; importe: number; indice?: number }[]) {
  const grupos = new Map<string, { codigo: string; columna: Columna | null; importe: number; indices: number[] }>()
  lineas.forEach((l, k) => {
    const i = l.indice ?? k
    const clave = `${l.codigo}|${l.columna}`
    const g = grupos.get(clave)
    if (g) {
      g.importe += l.importe
      g.indices.push(i)
    } else grupos.set(clave, { codigo: l.codigo, columna: l.columna, importe: l.importe, indices: [i] })
  })
  return [...grupos.values()]
}

export function corregir(solucion: LineaSolucion[], filas: Fila[]): Correccion {
  const escritas = agrupar(
    filas
      .map((f, indice) => ({ codigo: f.codigo.trim(), columna: columnaDe(f), importe: importeDe(f), indice }))
      .filter((l) => !estaVacia(filas[l.indice])),
  )
  const esperadas = agrupar(solucion)

  const estadoDe = new Map<(typeof escritas)[number], Estado>()
  const cubiertas = new Set<(typeof esperadas)[number]>()

  // Pasadas de lo más exigente a lo más laxo: primero lo exacto, luego los errores parciales.
  const pasadas: [Estado, (e: (typeof escritas)[number], s: (typeof esperadas)[number]) => boolean][] = [
    ['ok', (e, s) => cuentaValida(e.codigo, s.codigo) && e.columna === s.columna && e.importe === s.importe],
    ['importe', (e, s) => cuentaValida(e.codigo, s.codigo) && e.columna === s.columna],
    ['columna', (e, s) => cuentaValida(e.codigo, s.codigo)],
    ['cuenta', (e, s) => e.columna === s.columna && e.importe === s.importe],
  ]
  for (const [estado, coincide] of pasadas) {
    for (const s of esperadas) {
      if (cubiertas.has(s)) continue
      const e = escritas.find((e) => !estadoDe.has(e) && coincide(e, s))
      if (e) {
        estadoDe.set(e, estado)
        cubiertas.add(s)
      }
    }
  }

  const estados: (Estado | null)[] = filas.map((f) => (estaVacia(f) ? null : 'sobra'))
  for (const e of escritas) {
    const estado = estadoDe.get(e) ?? 'sobra'
    for (const i of e.indices) estados[i] = estado
  }

  const faltan = esperadas
    .filter((s) => !cubiertas.has(s))
    .map((s) => solucion.find((l) => l.codigo === s.codigo && l.columna === s.columna)!)
    .map((l) => ({ ...l, importe: esperadas.find((s) => s.codigo === l.codigo && s.columna === l.columna)!.importe }))
  const aciertos = [...estadoDe.values()].filter((e) => e === 'ok').length
  const sobran = escritas.filter((e) => !estadoDe.has(e)).length
  return {
    estados,
    faltan,
    aciertos,
    total: esperadas.length,
    perfecto: aciertos === esperadas.length && sobran === 0,
  }
}

/* ─────────────────────────── Ejercicios del entrenamiento ─────────────────────────── */

const DEL_ENTRENAMIENTO: EjercicioAsiento[] = EJERCICIOS.map((e) => {
  const nivel = NIVELES.find((n) => n.numero === e.nivel)
  return {
    id: `e-${e.id}`,
    origen: 'entrenamiento' as const,
    grupo: `Nivel ${e.nivel} · ${nivel?.titulo ?? ''}`,
    titulo: e.titulo,
    enunciado: e.enunciado,
    datos: [],
    solucion: e.renglones.map((r) => ({ codigo: r.codigo, columna: r.columna, importe: r.importe, concepto: r.concepto })),
    explicacion: [e.explicacion, e.nota].filter(Boolean).join('\n\n'),
  }
})

/* ─────────────────────────── Ejercicios desde las operaciones ─────────────────────────── */

/** Generador pseudoaleatorio con semilla: el mismo id da siempre los mismos importes. */
function azar(semilla: string) {
  let h = 1779033703 ^ semilla.length
  for (let i = 0; i < semilla.length; i++) {
    h = Math.imul(h ^ semilla.charCodeAt(i), 3432918353)
    h = (h << 13) | (h >>> 19)
  }
  return () => {
    h = Math.imul(h ^ (h >>> 16), 2246822507)
    h = Math.imul(h ^ (h >>> 13), 3266489909)
    h ^= h >>> 16
    return (h >>> 0) / 4294967296
  }
}

/** La tarifa con la que se calcula un renglón de impuesto, o null si su valor es libre. */
function tarifaDe(codigo: string, concepto: string): { tasa: number; sobre: 'base' | 'iva'; etiqueta: string } | null {
  const texto = concepto.toLowerCase()
  if (codigo.startsWith('2408') && /iva/.test(texto)) return { tasa: 0.19, sobre: 'base', etiqueta: '19 % sobre la base' }
  if (codigo.startsWith('2367') || codigo === '135517') return { tasa: 0.15, sobre: 'iva', etiqueta: '15 % del IVA' }
  if (codigo.startsWith('2368') || codigo === '135518') return { tasa: 0.00966, sobre: 'base', etiqueta: '9,66 por mil sobre la base' }
  const RETENCION: Record<string, [number, string]> = {
    '236515': [0.11, '11 %'], '236520': [0.11, '11 %'], '236525': [0.04, '4 %'], '236530': [0.035, '3,5 %'],
    '236535': [0.07, '7 %'], '236540': [0.025, '2,5 %'], '236570': [0.025, '2,5 %'],
  }
  if (RETENCION[codigo]) return { tasa: RETENCION[codigo][0], sobre: 'base', etiqueta: `${RETENCION[codigo][1]} sobre la base` }
  if (codigo === '135515') {
    // La retención que me practican depende de lo que vendí.
    const [tasa, etiqueta] = /honorario/.test(texto) ? [0.11, '11 %']
      : /servicio/.test(texto) ? [0.04, '4 %']
      : /arrend/.test(texto) ? [0.035, '3,5 %']
      : /rendimiento|inter[eé]s/.test(texto) ? [0.07, '7 %']
      : [0.025, '2,5 %']
    return { tasa: tasa as number, sobre: 'base', etiqueta: `${etiqueta} sobre la base` }
  }
  return null
}

/** Orden de preferencia para el renglón que cuadra el asiento: el dinero o la contrapartida. */
const PREFERENCIA_CUADRE = ['11', '13', '22', '23', '21', '25', '28', '24', '26']

function renglonDeCuadre(m: Movimiento, conTarifa: boolean[]): number {
  for (const prefijo of PREFERENCIA_CUADRE) {
    const i = m.asiento.findIndex((r, k) => !conTarifa[k] && r.codigo.startsWith(prefijo) && !r.codigo.startsWith('1355'))
    if (i >= 0) return i
  }
  for (let k = m.asiento.length - 1; k >= 0; k--) if (!conTarifa[k]) return k
  return -1
}

const pesos = (n: number) => `$${n.toLocaleString('es-CO')}`

/** Primera letra en minúscula, para encadenar el concepto en una frase; las siglas («IVA») se respetan. */
const enFrase = (t: string) => (/^[A-ZÁÉÍÓÚ]{2}/.test(t) ? t : t.charAt(0).toLowerCase() + t.slice(1))

function desdeOperacion(m: Movimiento): EjercicioAsiento | null {
  const r = m.asiento
  if (r.length < 2) return null

  for (let intento = 0; intento < 40; intento++) {
    const aleatorio = azar(`${m.id}#${intento}`)
    const tarifas = r.map((l) => tarifaDe(l.codigo, l.concepto))
    // Sin base de la que calcularlos, los impuestos se tratan como un importe dado.
    const hayBase = r.some((l, k) => !tarifas[k])
    const conTarifa = tarifas.map((t) => Boolean(t) && hayBase)
    const cuadre = renglonDeCuadre(m, conTarifa)
    if (cuadre < 0) return null

    const importes: number[] = r.map(() => 0)
    // Los importes dados: el primero es el principal; los demás, menores.
    let primero = true
    r.forEach((_, k) => {
      if (k === cuadre || conTarifa[k]) return
      importes[k] = primero ? 50_000 * (4 + Math.floor(aleatorio() * 77)) : 10_000 * (3 + Math.floor(aleatorio() * 48))
      primero = false
    })
    // La base de los impuestos: lo dado en la columna contraria a la del impuesto… o todo lo dado.
    const base = importes.reduce((s, v, k) => (k !== cuadre && !conTarifa[k] ? s + v : s), 0)
    // La retención de IVA se calcula sobre el IVA de la factura, esté o no en el asiento.
    const iva = Math.round(base * 0.19)
    r.forEach((l, k) => {
      if (!conTarifa[k]) return
      const t = tarifas[k]!
      importes[k] = Math.round((t.sobre === 'iva' ? iva : base) * t.tasa)
    })
    // El renglón de cuadre es la diferencia entre las dos columnas.
    const sumaColumna = (efecto: 'debito' | 'credito') =>
      r.reduce((s, l, k) => (k !== cuadre && l.efecto === efecto ? s + importes[k] : s), 0)
    const otra = r[cuadre].efecto === 'debito' ? 'credito' : 'debito'
    importes[cuadre] = sumaColumna(otra) - sumaColumna(r[cuadre].efecto)
    if (importes.some((v) => v <= 0)) continue

    const datos: Dato[] = r.flatMap((l, k): Dato[] => {
      if (k === cuadre) return []
      if (conTarifa[k]) return [{ texto: l.concepto, tasa: tarifas[k]!.tasa, sobre: tarifas[k]!.sobre, etiqueta: tarifas[k]!.etiqueta }]
      return [{ texto: l.concepto, importe: importes[k] }]
    })
    const enunciadoDatos = datos
      .map((d) => `${enFrase(d.texto)}: ${d.importe !== undefined ? pesos(d.importe) : d.etiqueta}`)
      .join('; ')
    return {
      id: `o-${m.id}`,
      origen: 'operacion',
      grupo: m.categoria,
      titulo: m.nombre,
      enunciado: `${m.nombre}. Datos: ${enunciadoDatos}. Calcula el resto y registra el asiento.`,
      datos,
      solucion: r.map((l, k) => ({
        codigo: l.codigo,
        columna: l.efecto === 'debito' ? 'debe' : 'haber',
        importe: importes[k],
        concepto: l.concepto,
      })),
      explicacion: [m.descripcion, m.nota].filter(Boolean).join('\n\n'),
    }
  }
  return null
}

const DESDE_OPERACIONES: EjercicioAsiento[] = MOVIMIENTOS.map(desdeOperacion).filter(
  (e): e is EjercicioAsiento => e !== null,
)

export const EJERCICIOS_ASIENTO: EjercicioAsiento[] = [...DEL_ENTRENAMIENTO, ...DESDE_OPERACIONES]

export const ejercicioAsientoPorId = (id: string) => EJERCICIOS_ASIENTO.find((e) => e.id === id)

export const siguienteAsiento = (id: string) => {
  const i = EJERCICIOS_ASIENTO.findIndex((e) => e.id === id)
  return i >= 0 ? EJERCICIOS_ASIENTO[i + 1] : undefined
}

/** Los ejercicios agrupados: primero los niveles del entrenamiento y luego cada categoría. */
export function gruposDeAsiento(): { grupo: string; origen: EjercicioAsiento['origen']; ejercicios: EjercicioAsiento[] }[] {
  const grupos = new Map<string, { grupo: string; origen: EjercicioAsiento['origen']; ejercicios: EjercicioAsiento[] }>()
  for (const e of EJERCICIOS_ASIENTO) {
    const g = grupos.get(e.grupo) ?? { grupo: e.grupo, origen: e.origen, ejercicios: [] }
    g.ejercicios.push(e)
    grupos.set(e.grupo, g)
  }
  return [...grupos.values()]
}

/** Clave del progreso: separada de la del entrenamiento por columnas. */
export const claveProgreso = (id: string) => `asiento:${id}`

/* ─────────────────────────── Varios asientos: exportar e importar ─────────────────────────── */

/** Un asiento de la hoja en blanco: qué pasó y sus renglones. */
export interface Asiento {
  nota: string
  filas: Fila[]
}

export const asientoVacio = (): Asiento => ({ nota: '', filas: conRenglonLibre([]) })

/**
 * Los asientos en CSV para abrirlos en Excel o Google Sheets, como un libro diario: una
 * sola tabla con el número de asiento en la primera columna, la descripción en su primer
 * renglón y una fila de sumas al cerrar cada uno. Separado por «;», que es lo que Excel
 * espera con la configuración regional de Colombia (la coma es el decimal), y con los
 * importes sin separador de miles para que se lean como números.
 */
export function asientosACSV(asientos: Asiento[], nombreDe: (codigo: string) => string): string {
  const campo = (valor: string) => (/[;"\n\r]/.test(valor) ? `"${valor.replace(/"/g, '""')}"` : valor)
  const lineas = ['Asiento;Descripción;Código;Cuenta;Debe;Haber']
  let numero = 0
  for (const asiento of asientos) {
    const escritas = asiento.filas.filter((f) => !estaVacia(f))
    if (!escritas.length && !asiento.nota.trim()) continue
    numero += 1
    escritas.forEach((f, i) => {
      lineas.push([numero, i === 0 ? campo(asiento.nota.trim()) : '', f.codigo, campo(nombreDe(f.codigo)), f.debe ?? '', f.haber ?? ''].join(';'))
    })
    if (!escritas.length) lineas.push([numero, campo(asiento.nota.trim()), '', '', '', ''].join(';'))
    const total = sumas(escritas)
    lineas.push([numero, '', '', 'Sumas', total.debe, total.haber].join(';'))
  }
  return lineas.join('\r\n') + '\r\n'
}

/** Parte una línea CSV respetando las comillas. */
function celdas(linea: string, separador: string): string[] {
  const salida: string[] = []
  let actual = ''
  let entreComillas = false
  for (let i = 0; i < linea.length; i++) {
    const c = linea[i]
    if (entreComillas) {
      if (c === '"' && linea[i + 1] === '"') { actual += '"'; i++ }
      else if (c === '"') entreComillas = false
      else actual += c
    } else if (c === '"') entreComillas = true
    else if (c === separador) { salida.push(actual); actual = '' }
    else actual += c
  }
  salida.push(actual)
  return salida.map((s) => s.trim())
}

/** «1.000.000», «1,000,000», «1000000,00» o «$ 1.000.000» → 1000000. */
function aImporte(texto: string): number | null {
  const limpio = texto.replace(/[^\d.,]/g, '').replace(/[.,]\d{1,2}$/, '')
  const digitos = limpio.replace(/\D/g, '')
  return digitos ? Number(digitos) : null
}

const sinTildes = (t: string) => t.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')

/**
 * Lee asientos desde CSV: el libro que exporta la aplicación (columna «Asiento»), el
 * formato de un solo asiento con la fila «Operación», u otro CSV con columnas de código,
 * debe y haber, que entra como un solo asiento. Se toman los renglones con código numérico.
 */
export function asientosDesdeCSV(texto: string): Asiento[] {
  const lineas = texto.replace(/^\uFEFF/, '').split(/\r?\n/).filter((l) => l.trim())
  const muestra = lineas.slice(0, 5).join('\n')
  const separador = [';', '\t', ','].find((s) => muestra.includes(s)) ?? ';'
  // Posición de cada columna: la del encabezado si lo hay, o la del formato de un asiento.
  let col = { asiento: -1, descripcion: -1, codigo: 0, debe: 2, haber: 3 }
  const porNumero = new Map<string, Asiento>()
  let notaSuelta = ''

  for (const linea of lineas) {
    const c = celdas(linea, separador)
    const cabecera = c.map(sinTildes)
    if (cabecera[0] === 'operacion') { notaSuelta = c[1] ?? ''; continue }
    if (cabecera.some((x) => x.startsWith('debe')) && cabecera.some((x) => x.startsWith('haber'))) {
      const busca = (prefijo: string) => cabecera.findIndex((x) => x.startsWith(prefijo))
      col = {
        asiento: busca('asiento'),
        descripcion: [busca('descripcion'), busca('operacion'), busca('detalle'), busca('concepto')].find((i) => i >= 0) ?? -1,
        codigo: Math.max(0, busca('codigo')),
        debe: busca('debe'),
        haber: busca('haber'),
      }
      continue
    }
    const numero = col.asiento >= 0 ? (c[col.asiento] ?? '').replace(/\D/g, '') || '1' : '1'
    const asiento = porNumero.get(numero) ?? { nota: '', filas: [] }
    porNumero.set(numero, asiento)
    const descripcion = col.descripcion >= 0 ? c[col.descripcion] ?? '' : ''
    if (descripcion && !asiento.nota && col.asiento >= 0) asiento.nota = descripcion

    const codigo = (c[col.codigo] ?? '').replace(/\D/g, '')
    if (!codigo || codigo.length > 10) continue
    const debe = aImporte(c[col.debe] ?? '')
    const haber = debe ? null : aImporte(c[col.haber] ?? '')
    asiento.filas.push({ codigo, debe, haber })
  }

  const asientos = [...porNumero.values()].filter((a) => a.filas.length || a.nota)
  if (notaSuelta && asientos[0] && !asientos[0].nota) asientos[0].nota = notaSuelta
  return asientos.map((a) => ({ nota: a.nota, filas: conRenglonLibre(a.filas) }))
}
