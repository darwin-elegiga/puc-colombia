/**
 * Aulas: lógica pura compartida por el navegador y el servidor.
 *
 * Un aula se crea sin cuentas: quien la crea es el docente (su dispositivo guarda una
 * clave secreta). Cada aula es un quiz: el docente prepara un conjunto fijo de
 * ejercicios y lo empieza (con tiempo o sin él); desde entonces no se añaden más. Cada
 * estudiante entra con el código y su nombre, resuelve todos los ejercicios y envía el
 * quiz una sola vez. El docente ve la nota de cada ejercicio según la corrección
 * automática, el promedio como nota sugerida, y la ajusta o no antes de emitirla.
 * Todo caduca a las 24 horas.
 */
import { corregir, type Correccion, type Dato, type EjercicioAsiento, type Fila, type LineaSolucion } from './practica'

export const DURACION_MS = 24 * 60 * 60 * 1000
export const LARGO_CODIGO = 6
export const MAX_NOMBRE = 40
export const MAX_NOMBRE_AULA = 60
export const MAX_COMENTARIO = 500
export const MAX_ENUNCIADO = 1500
export const MAX_FILAS = 40
export const MAX_IMPORTE = 10_000_000_000_000
/** Ejercicios de un quiz. */
export const MAX_EJERCICIOS = 20
/** Tiempo límite máximo de un quiz, en minutos. */
export const MAX_LIMITE_MIN = 240
/** Margen tras el tiempo límite para que llegue el envío automático. */
export const MARGEN_ENVIO_MS = 2 * 60 * 1000

/** Sin 0/O ni 1/I/L: el código se dicta en voz alta y se copia de la pizarra. */
const ALFABETO = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789'

/** Aleatorio criptográfico: el código es la única llave de un aula privada. */
const aleatorioSeguro = () => crypto.getRandomValues(new Uint32Array(1))[0] / 2 ** 32

export function generarCodigo(aleatorio: () => number = aleatorioSeguro): string {
  let codigo = ''
  for (let i = 0; i < LARGO_CODIGO; i++) codigo += ALFABETO[Math.floor(aleatorio() * ALFABETO.length)]
  return codigo
}

/** Normaliza lo que se escribe o se pega: mayúsculas y sin espacios ni guiones. */
export const normalizarCodigo = (texto: string) => texto.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, LARGO_CODIGO)

export const codigoValido = (codigo: string) =>
  codigo.length === LARGO_CODIGO && [...codigo].every((c) => ALFABETO.includes(c))

/* ─────────────────────────── Nombres ─────────────────────────── */

/** Filtro básico: el aula pública la ve cualquiera que abra la app. */
const OFENSIVAS = ['hijueputa', 'malparid', 'gonorrea', 'mierda', 'marica', 'pendej', 'verga', 'puta', 'puto', 'culo', 'polla', 'coño']

const plano = (t: string) => t.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-zñ]/g, '')

/** Limpia un nombre visible; devuelve null si queda vacío u ofensivo. */
export function limpiarNombre(texto: unknown, maximo = MAX_NOMBRE): string | null {
  if (typeof texto !== 'string') return null
  const limpio = texto
    .replace(/[\u0000-\u001f\u007f<>]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, maximo)
  if (!limpio) return null
  const sinSignos = plano(limpio)
  if (OFENSIVAS.some((p) => sinSignos.includes(p))) return null
  return limpio
}

/** Dos «Ana» en la misma aula: la segunda pasa a «Ana (2)». */
export function nombreUnico(nombre: string, existentes: string[]): string {
  const usados = new Set(existentes.map((n) => n.toLowerCase()))
  if (!usados.has(nombre.toLowerCase())) return nombre
  for (let n = 2; ; n++) {
    const candidato = `${nombre} (${n})`
    if (!usados.has(candidato.toLowerCase())) return candidato
  }
}

/* ─────────────────────────── Entregas y notas ─────────────────────────── */

/** Valida los renglones que llegan del navegador; null si no son aceptables. */
export function validarFilas(entrada: unknown): Fila[] | null {
  if (!Array.isArray(entrada) || entrada.length > MAX_FILAS) return null
  const filas: Fila[] = []
  for (const f of entrada) {
    if (!f || typeof f !== 'object') return null
    const { codigo, debe, haber } = f as Record<string, unknown>
    // Un importe 0 es un renglón sin importe, no un error.
    const importe = (v: unknown) => (v === null || v === undefined || v === 0 ? null : Number.isInteger(v) && (v as number) > 0 && (v as number) <= MAX_IMPORTE ? (v as number) : NaN)
    const d = importe(debe)
    const h = importe(haber)
    if (typeof codigo !== 'string' || !/^\d{0,10}$/.test(codigo) || Number.isNaN(d) || Number.isNaN(h)) return null
    if (!codigo && !d && !h) continue
    filas.push({ codigo, debe: d, haber: d ? null : h })
  }
  return filas
}

/** Nota de 0 a 5 con un decimal. */
export function validarNota(nota: unknown): number | null {
  if (typeof nota !== 'number' || !Number.isFinite(nota) || nota < 0 || nota > 5) return null
  return Math.round(nota * 10) / 10
}

/** Nota sugerida a partir de la corrección automática: la proporción de renglones bien, sobre 5. */
export const notaSugerida = (c: Pick<Correccion, 'aciertos' | 'total' | 'estados'>) => {
  const sobran = c.estados.filter((e) => e === 'sobra').length
  const total = c.total + sobran
  return total ? Math.round((c.aciertos / total) * 50) / 10 : 0
}

/** La nota de un ejercicio: la de su corrección automática. */
export const notaDeEjercicio = (solucion: LineaSolucion[], filas: Fila[]) => notaSugerida(corregir(solucion, filas))

/** Nota de cada ejercicio y su promedio: la nota sugerida del quiz. */
export function notaDelQuiz(ejercicios: EjercicioDeAula[], respuestas: Respuestas) {
  const porEjercicio: Record<string, number> = {}
  for (const e of ejercicios) porEjercicio[e.id] = notaDeEjercicio(e.solucion ?? [], respuestas[e.id] ?? [])
  const notas = Object.values(porEjercicio)
  const promedio = notas.length ? Math.round((notas.reduce((s, n) => s + n, 0) / notas.length) * 10) / 10 : 0
  return { porEjercicio, promedio }
}

/**
 * Valida las respuestas de un quiz: solo de ejercicios del quiz. Un renglón que no vale
 * (un código con letras, un importe con decimales, sin importe) se descarta en vez de
 * rechazar el quiz entero: el envío automático al acabarse el tiempo no puede perderse por uno.
 */
export function validarRespuestas(entrada: unknown, ids: string[]): Respuestas | null {
  if (!entrada || typeof entrada !== 'object' || Array.isArray(entrada)) return null
  const respuestas: Respuestas = {}
  for (const [id, filas] of Object.entries(entrada as Record<string, unknown>)) {
    if (!ids.includes(id) || !Array.isArray(filas)) return null
    // Sin importe no hay asiento: un código suelto contaría como renglón de más.
    const validas = filas.slice(0, MAX_FILAS).flatMap((f) => validarFilas([f]) ?? []).filter((f) => f.debe ?? f.haber)
    if (validas.length) respuestas[id] = validas
  }
  return respuestas
}

/** Las notas por ejercicio que emite el docente: de 0 a 5 y solo de ejercicios del quiz. */
export function validarNotasPorEjercicio(entrada: unknown, ids: string[]): Record<string, number> | null {
  if (entrada === undefined) return {}
  if (!entrada || typeof entrada !== 'object' || Array.isArray(entrada)) return null
  const notas: Record<string, number> = {}
  for (const [id, n] of Object.entries(entrada as Record<string, unknown>)) {
    const nota = validarNota(n)
    if (!ids.includes(id) || nota === null) return null
    notas[id] = nota
  }
  return notas
}

export const formatoNota = (nota: number) => nota.toLocaleString('es-CO', { minimumFractionDigits: 1, maximumFractionDigits: 1 })

/** 252 → «4 min 12 s». */
export function formatoTiempo(segundos: number): string {
  const s = Math.max(0, Math.round(segundos))
  if (s < 60) return `${s} s`
  const m = Math.floor(s / 60)
  if (m < 60) return `${m} min ${s % 60} s`
  return `${Math.floor(m / 60)} h ${m % 60} min`
}

/* ─────────────────────────── Lo que ve cada uno ─────────────────────────── */

export type EstadoAula = 'abierta' | 'cerrada'

export interface AulaResumen {
  codigo: string
  nombre: string
  docente: string
  publica: boolean
  estado: EstadoAula
  /** Si el docente ya no admite más estudiantes. */
  entradaCerrada: boolean
  creada: number
  expira: number
  /** Cuándo empezó el quiz; null mientras el docente lo prepara. */
  iniciado: number | null
  /** Minutos que tiene cada estudiante desde que abre el quiz; null sin límite. */
  limiteMin: number | null
  /** Las soluciones de todos los ejercicios ya se publicaron. */
  solucionPublicada: boolean
}

/** En qué punto está el quiz. */
export type EstadoQuiz = 'preparando' | 'en-curso' | 'cerrado'

export const estadoQuiz = (a: Pick<AulaResumen, 'estado' | 'iniciado'>): EstadoQuiz =>
  a.estado === 'cerrada' ? 'cerrado' : a.iniciado === null ? 'preparando' : 'en-curso'

/** Lo que el estudiante escribió en cada ejercicio, por id. */
export type Respuestas = Record<string, Fila[]>

export interface MiembroVisible {
  id: string
  nombre: string
  unido: number
  expulsado: boolean
}

/** Un ejercicio lanzado en el aula, con copia propia del enunciado y la solución. */
export interface EjercicioDeAula {
  id: string
  /** El ejercicio de la aplicación del que salió. */
  origenId: string
  titulo: string
  grupo: string
  enunciado: string
  datos: Dato[]
  lanzado: number
  solucionPublicada: boolean
  /** Solo la reciben el docente y, una vez publicada, los estudiantes. */
  solucion?: LineaSolucion[]
  explicacion?: string
}

export interface Calificacion {
  /** La nota del quiz que emite el docente. */
  nota: number
  comentario: string
  fecha: number
  /** La nota de cada ejercicio (la automática o la que ajustó el docente). */
  porEjercicio?: Record<string, number>
}

export interface EntregaVisible {
  estudianteId: string
  nombre: string
  filas: Fila[]
  enviada: number
  segundos: number
  calificacion: Calificacion | null
}

/** El quiz que envió un estudiante. */
export interface EntregaQuiz {
  estudianteId: string
  nombre: string
  respuestas: Respuestas
  enviada: number
  segundos: number
  calificacion: Calificacion | null
}

export interface VistaDocente {
  rol: 'docente'
  modo: 'quiz'
  version: number
  ahora: number
  aula: AulaResumen
  miembros: MiembroVisible[]
  /** Los ejercicios del quiz, con su solución. */
  ejercicios: EjercicioDeAula[]
  entregas: EntregaQuiz[]
  /** Cuántos estudiantes abrieron ya el quiz. */
  empezados: number
}

export interface VistaEstudiante {
  rol: 'estudiante'
  version: number
  ahora: number
  aula: AulaResumen
  yo: MiembroVisible
  miembros: number
  /** Resumen barato para avisos: en qué punto está el quiz y si ya lo envió. */
  quiz: { estado: EstadoQuiz; enviado: boolean }
  /** Los ejercicios del quiz (vacío hasta que empieza), sin solución hasta que se publique. */
  ejercicios: EjercicioDeAula[]
  /** Cuándo abrió el quiz y cuándo se le acaba el tiempo (null sin límite). */
  recibido: number | null
  fin: number | null
  /** Su quiz enviado, con la nota cuando el docente la emita. */
  entrega: EntregaQuiz | null
  /** Ejercicios con la solución publicada, para guardarlos en «De mis clases». */
  publicados: (EjercicioDeAula & { entrega: EntregaVisible | null })[]
}

export type VistaAula = VistaDocente | VistaEstudiante

export interface AulaPublica {
  codigo: string
  nombre: string
  docente: string
  miembros: number
  creada: number
}

/** Copia de un ejercicio de la aplicación para lanzarlo en un aula. */
export function aEjercicioDeAula(e: EjercicioAsiento, id: string, lanzado: number): EjercicioDeAula {
  return {
    id,
    origenId: e.id,
    titulo: e.titulo,
    grupo: e.grupo,
    enunciado: e.enunciado,
    datos: e.datos,
    lanzado,
    solucionPublicada: false,
    solucion: e.solucion,
    explicacion: e.explicacion,
  }
}

/** Un ejercicio escrito por el docente: su enunciado y su solución en renglones. */
export interface EjercicioPropio {
  titulo: string
  enunciado: string
  filas: Fila[]
  explicacion: string
}

/** El título de un ejercicio propio: el escrito o, si falta, el comienzo del enunciado. */
export const tituloDe = (titulo: unknown, enunciado: string) =>
  limpiarNombre(titulo, 80) ?? (enunciado.length > 60 ? `${enunciado.slice(0, 57).trimEnd()}…` : enunciado)

/** Valida un ejercicio propio: enunciado con sentido y una solución que cuadra. */
export function validarPropio(entrada: unknown): EjercicioPropio | string {
  if (!entrada || typeof entrada !== 'object') return 'Falta el ejercicio.'
  const e = entrada as Record<string, unknown>
  const texto = (v: unknown, max: number) => (typeof v === 'string' ? v.replace(/\s+\n/g, '\n').trim().slice(0, max) : '')
  const enunciado = texto(e.enunciado, MAX_ENUNCIADO)
  if (enunciado.length < 8) return 'Escribe el enunciado del ejercicio.'
  const filas = validarFilas(e.filas)
  if (!filas || filas.length < 2) return 'La solución necesita al menos dos renglones.'
  if (filas.some((f) => !f.codigo || !(f.debe ?? f.haber))) return 'Cada renglón de la solución necesita código e importe.'
  const debe = filas.reduce((s, f) => s + (f.debe ?? 0), 0)
  const haber = filas.reduce((s, f) => s + (f.haber ?? 0), 0)
  if (debe !== haber) return 'La solución no cuadra: el debe y el haber deben sumar lo mismo.'
  const titulo = tituloDe(e.titulo, enunciado)
  return { titulo, enunciado, filas, explicacion: texto(e.explicacion, MAX_ENUNCIADO) }
}

/** Lo que un estudiante puede ver de un ejercicio: sin solución mientras no se publique. */
export function paraEstudiante(e: EjercicioDeAula): EjercicioDeAula {
  if (e.solucionPublicada) return e
  // Tampoco el ejercicio de origen: con él se podría buscar la solución en el catálogo de la app.
  const { solucion: _s, explicacion: _e, origenId: _o, ...resto } = e
  void _s
  void _e
  void _o
  return { ...resto, origenId: '' }
}
