/**
 * Aulas: lógica pura compartida por el navegador y el servidor.
 *
 * Un aula se crea sin cuentas: quien la crea es el docente (su dispositivo guarda una
 * clave secreta) y es el único que lanza ejercicios, ve las entregas y califica. Los
 * estudiantes entran con el código y su nombre. Todo caduca a las 24 horas.
 */
import type { Correccion, Dato, EjercicioAsiento, Fila, LineaSolucion } from './practica'

export const DURACION_MS = 24 * 60 * 60 * 1000
export const LARGO_CODIGO = 6
export const MAX_NOMBRE = 40
export const MAX_NOMBRE_AULA = 60
export const MAX_COMENTARIO = 500
export const MAX_ENUNCIADO = 1500
export const MAX_FILAS = 40
export const MAX_IMPORTE = 10_000_000_000_000

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
    const importe = (v: unknown) => (v === null || v === undefined ? null : Number.isInteger(v) && (v as number) > 0 && (v as number) <= MAX_IMPORTE ? (v as number) : NaN)
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
}

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
  nota: number
  comentario: string
  fecha: number
}

export interface EntregaVisible {
  estudianteId: string
  nombre: string
  filas: Fila[]
  enviada: number
  segundos: number
  calificacion: Calificacion | null
}

export interface VistaDocente {
  rol: 'docente'
  version: number
  ahora: number
  aula: AulaResumen
  miembros: MiembroVisible[]
  ejercicios: (EjercicioDeAula & { entregas: EntregaVisible[]; recibidos: number })[]
}

export interface VistaEstudiante {
  rol: 'estudiante'
  version: number
  ahora: number
  aula: AulaResumen
  yo: MiembroVisible
  miembros: number
  /** El ejercicio en curso, sin solución hasta que se publique. */
  actual: (EjercicioDeAula & { recibido: number | null; entrega: EntregaVisible | null }) | null
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
