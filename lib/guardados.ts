'use client'

/**
 * Hojas guardadas desde la hoja en blanco, en el navegador: cada una con uno o varios asientos.
 *
 * Mismo planteamiento que el progreso: almacén externo sobre localStorage para que
 * React lo lea sin efectos de sincronización y dos pestañas se mantengan al día.
 */
import { useCallback, useSyncExternalStore } from 'react'
import { estaVacia, type Asiento } from './practica'

const CLAVE = 'puc-colombia:asientos-guardados:v1'

export interface HojaGuardada {
  id: string
  asientos: Asiento[]
  /** ISO de la última vez que se guardó. */
  fecha: string
}

const VACIO: HojaGuardada[] = []
let cache: HojaGuardada[] | null = null
const escuchadores = new Set<() => void>()

function leerDelNavegador(): HojaGuardada[] {
  if (typeof window === 'undefined') return VACIO
  try {
    const datos = JSON.parse(window.localStorage.getItem(CLAVE) ?? '[]')
    if (!Array.isArray(datos)) return VACIO
    // Las primeras hojas guardaban un solo asiento, con «nota» y «filas» sueltas.
    return datos.map((h) => (Array.isArray(h.asientos) ? h : { id: h.id, fecha: h.fecha, asientos: [{ nota: h.nota ?? '', filas: h.filas ?? [] }] }))
  } catch {
    return VACIO
  }
}

function instantanea(): HojaGuardada[] {
  if (cache === null) cache = leerDelNavegador()
  return cache
}

const instantaneaServidor = (): HojaGuardada[] => VACIO

function avisar() {
  for (const escuchador of escuchadores) escuchador()
}

function alCambiarOtraPestana(evento: StorageEvent) {
  if (evento.key !== null && evento.key !== CLAVE) return
  cache = null
  avisar()
}

function suscribir(escuchador: () => void) {
  if (escuchadores.size === 0) window.addEventListener('storage', alCambiarOtraPestana)
  escuchadores.add(escuchador)
  return () => {
    escuchadores.delete(escuchador)
    if (escuchadores.size === 0) window.removeEventListener('storage', alCambiarOtraPestana)
  }
}

/** Devuelve false si el navegador no dejó guardar (modo privado o sin espacio). */
function escribir(lista: HojaGuardada[]): boolean {
  cache = lista
  avisar()
  try {
    window.localStorage.setItem(CLAVE, JSON.stringify(lista))
    return true
  } catch {
    return false
  }
}

/** Sin renglones vacíos ni asientos en blanco: lo que de verdad se escribió. */
export const soloEscrito = (asientos: Asiento[]): Asiento[] =>
  asientos
    .map((a) => ({ nota: a.nota, filas: a.filas.filter((f) => !estaVacia(f)) }))
    .filter((a) => a.filas.length || a.nota.trim())

export function useHojasGuardadas() {
  const guardados = useSyncExternalStore(suscribir, instantanea, instantaneaServidor)

  /** Guarda la hoja: con id la actualiza; sin id crea una nueva. Devuelve su id, o null si no se pudo. */
  const guardar = useCallback((asientos: Asiento[], id?: string | null): string | null => {
    const hoja: HojaGuardada = {
      id: id ?? `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`,
      asientos: soloEscrito(asientos),
      fecha: new Date().toISOString(),
    }
    // La más reciente arriba.
    const lista = [hoja, ...instantanea().filter((h) => h.id !== hoja.id)]
    return escribir(lista) ? hoja.id : null
  }, [])

  const eliminar = useCallback((id: string) => {
    escribir(instantanea().filter((a) => a.id !== id))
  }, [])

  return { guardados, guardar, eliminar }
}
