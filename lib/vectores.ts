/**
 * Búsqueda semántica: qué se convierte en vector y cómo se comparan los vectores.
 *
 *   cuentas + movimientos ──Gemini (una vez)──▶ data/vectores.json   (base vectorial)
 *   descripción escrita   ──Gemini (cada vez)──▶ vector ──similitud──▶ Top 5
 *
 * Lo usan el script que genera la base (scripts/generar-vectores.ts) y la ruta
 * /api/sugerir. Nada de esto llega al navegador: la base solo vive en el servidor.
 */
import type { Cuenta } from './tipos'
import type { Movimiento } from '@/data/movimientos'
import { aliasDe } from './vocabulario'
import { REGLA_LADO } from '@/data/guia'
import { NOMBRE_CLASE, nombreLegible } from './puc'

/** El modelo de embeddings que cubre la capa gratuita de Gemini. */
export const MODELO = 'gemini-embedding-2'
/** 768 es una de las dimensiones recomendadas: buena calidad con la cuarta parte de tamaño. */
export const DIMENSIONES = 768
export const API_GEMINI = 'https://generativelanguage.googleapis.com/v1beta'

export type TipoResultado = 'cuenta' | 'movimiento'

export interface Documento {
  tipo: TipoResultado
  id: string
  titulo: string
  texto: string
}

/** Texto con el que se describe una cuenta al modelo: nombre, clase, alias y qué registra. */
export function documentoDeCuenta(c: Cuenta): Documento {
  const alias = aliasDe(c.codigo)
  const primerParrafo = c.descripcion.split('\n\n')[0]
  return {
    tipo: 'cuenta',
    id: c.codigo,
    titulo: `${c.codigo} ${nombreLegible(c.nombre)}`,
    texto: [
      `Cuenta ${c.codigo} del PUC colombiano: ${nombreLegible(c.nombre)}.`,
      `Clase ${c.codigo[0]}, ${NOMBRE_CLASE[c.codigo[0]]}.`,
      alias.length ? `También se le dice: ${alias.slice(0, 20).join(', ')}.` : '',
      primerParrafo,
    ]
      .filter(Boolean)
      .join(' '),
  }
}

/** Texto con el que se describe una operación: qué pasa, quién paga y cómo se nombra. */
export function documentoDeMovimiento(m: Movimiento): Documento {
  return {
    tipo: 'movimiento',
    id: m.id,
    titulo: m.nombre,
    texto: [
      `${m.nombre}.`,
      m.descripcion,
      `${REGLA_LADO[m.lado].titulo}: ${REGLA_LADO[m.lado].corto.toLowerCase()}.`,
      `Se dice también: ${m.palabras.slice(0, 20).join(', ')}.`,
    ].join(' '),
  }
}

/* ─────────────────────────── Vectores ─────────────────────────── */

export function normalizar(v: number[]): number[] {
  const norma = Math.hypot(...v) || 1
  return v.map((x) => x / norma)
}

/**
 * Cada vector normalizado se guarda en 8 bits: 768 bytes en lugar de 3 KB, sin
 * cambiar el orden de los resultados. `escala` devuelve cada valor a su magnitud.
 */
export function cuantizar(v: number[]): { v: string; escala: number } {
  const maximo = Math.max(...v.map(Math.abs)) || 1
  const bytes = Int8Array.from(v, (x) => Math.round((x / maximo) * 127))
  return { v: Buffer.from(bytes.buffer).toString('base64'), escala: maximo / 127 }
}

export function descuantizar(base64: string): Int8Array {
  const buffer = Buffer.from(base64, 'base64')
  return new Int8Array(buffer.buffer, buffer.byteOffset, buffer.length)
}

/** Similitud coseno entre la consulta (normalizada) y un vector guardado (normalizado y cuantizado). */
export function similitud(consulta: number[], guardado: Int8Array, escala: number): number {
  let suma = 0
  for (let i = 0; i < consulta.length; i++) suma += consulta[i] * guardado[i]
  return suma * escala
}

export interface BaseVectorial {
  modelo: string
  dimensiones: number
  generado: string
  items: { tipo: TipoResultado; id: string; v: string; escala: number }[]
}

/* ─────────────────────────── Gemini ─────────────────────────── */

/**
 * Pide los vectores de varios textos en una sola llamada (hasta 100).
 * gemini-embedding-2 recibe la tarea dentro del texto: los documentos llevan
 * «title: … | text: …» y las consultas «task: search result | query: …», para que
 * una pregunta caiga cerca de su respuesta.
 */
export async function vectoresGemini(
  clave: string,
  entradas: { texto: string; titulo?: string }[],
  tarea: 'documento' | 'consulta',
): Promise<number[][]> {
  const conTarea = (e: { texto: string; titulo?: string }) =>
    tarea === 'consulta' ? `task: search result | query: ${e.texto}` : `title: ${e.titulo ?? 'none'} | text: ${e.texto}`
  const respuesta = await fetch(`${API_GEMINI}/models/${MODELO}:batchEmbedContents`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'x-goog-api-key': clave },
    body: JSON.stringify({
      requests: entradas.map((e) => ({
        model: `models/${MODELO}`,
        content: { parts: [{ text: conTarea(e) }] },
        outputDimensionality: DIMENSIONES,
      })),
    }),
  })
  if (!respuesta.ok) throw errorGemini(respuesta.status, await respuesta.text())
  const datos = (await respuesta.json()) as { embeddings: { values: number[] }[] }
  // Se normaliza igualmente: el coseno se calcula como producto punto.
  return datos.embeddings.map((e) => normalizar(e.values))
}

export function errorGemini(estado: number, detalle: string) {
  const error = new Error(`Gemini respondió ${estado}: ${detalle.slice(0, 300)}`) as Error & { estado?: number }
  error.estado = estado
  return error
}
