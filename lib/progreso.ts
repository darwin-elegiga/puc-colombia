'use client'

/**
 * Progreso del entrenamiento, guardado en el navegador.
 *
 * Mismo planteamiento que las cuentas propias: almacén externo sobre
 * localStorage para que React lo lea sin efectos de sincronización y para que
 * dos pestañas abiertas se mantengan al día.
 */
import { useCallback, useSyncExternalStore } from 'react'

const CLAVE = 'puc-colombia:entrenamiento:v1'

export interface Marca {
  /** true cuando se resolvió sin ningún error. */
  resuelto: boolean
  intentos: number
  fecha: string
}

export type Progreso = Record<string, Marca>

const VACIO: Progreso = {}
let cache: Progreso | null = null
const escuchadores = new Set<() => void>()

function leerDelNavegador(): Progreso {
  if (typeof window === 'undefined') return VACIO
  try {
    const crudo = window.localStorage.getItem(CLAVE)
    if (!crudo) return VACIO
    const datos = JSON.parse(crudo)
    return datos && typeof datos === 'object' && !Array.isArray(datos) ? (datos as Progreso) : VACIO
  } catch {
    return VACIO
  }
}

function instantanea(): Progreso {
  if (cache === null) cache = leerDelNavegador()
  return cache
}

/** En el servidor y durante la hidratación todavía no hay progreso. */
const instantaneaServidor = (): Progreso => VACIO

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

function guardar(progreso: Progreso) {
  cache = progreso
  try {
    window.localStorage.setItem(CLAVE, JSON.stringify(progreso))
  } catch {
    // Sin espacio o en modo privado: la sesión sigue, pero no se conservará al recargar.
  }
  avisar()
}

export function useProgreso() {
  const progreso = useSyncExternalStore(suscribir, instantanea, instantaneaServidor)

  /** Anota un intento. Una vez resuelto, no vuelve a marcarse como pendiente. */
  const anotar = useCallback((id: string, perfecto: boolean) => {
    const previo = instantanea()[id]
    guardar({
      ...instantanea(),
      [id]: {
        resuelto: perfecto || Boolean(previo?.resuelto),
        intentos: (previo?.intentos ?? 0) + 1,
        fecha: new Date().toISOString(),
      },
    })
  }, [])

  const reiniciar = useCallback(() => guardar(VACIO), [])

  return { progreso, anotar, reiniciar }
}
