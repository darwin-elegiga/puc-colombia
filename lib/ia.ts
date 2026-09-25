/**
 * Llamadas del navegador a la IA. Nunca se hacen solas: solo cuando el usuario
 * pulsa el botón, después de que lo local no encontró una respuesta que le sirva.
 */
import type { AsientoIA } from './asientoIA'

export type { AsientoIA }

export interface Sugerencia {
  tipo: 'cuenta' | 'movimiento'
  id: string
  puntaje: number
}

export class ErrorIA extends Error {}

async function llamar<T>(ruta: string, cuerpo: unknown): Promise<T> {
  if (typeof navigator !== 'undefined' && !navigator.onLine) {
    throw new ErrorIA('Sin conexión: la consulta a la IA necesita internet.')
  }
  let respuesta: Response
  try {
    respuesta = await fetch(ruta, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(cuerpo),
    })
  } catch {
    throw new ErrorIA('No se pudo conectar con el servidor.')
  }
  if (respuesta.ok) return respuesta.json() as Promise<T>
  if (respuesta.status === 503) throw new ErrorIA('La IA todavía no está configurada en el servidor.')
  if (respuesta.status === 429) throw new ErrorIA('Se agotó la cuota gratuita de la IA por ahora. Prueba en un rato.')
  const { error } = (await respuesta.json().catch(() => ({}))) as { error?: string }
  throw new ErrorIA(error ?? 'La IA no respondió.')
}

export const pedirSugerencias = (q: string) =>
  llamar<{ sugerencias: Sugerencia[] }>('/api/sugerir', { q }).then((r) => r.sugerencias)

export const pedirAsiento = (situacion: string) => llamar<AsientoIA>('/api/asiento', { situacion })
