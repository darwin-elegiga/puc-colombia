'use client'

/**
 * Qué se está viendo, guardado en el hash de la URL.
 *
 * En el móvil la ficha ocupa toda la pantalla, así que el botón atrás del sistema
 * debe cerrarla en lugar de sacar al usuario de la aplicación. Apoyarse en el
 * historial del navegador lo resuelve y, de paso, hace que la dirección se pueda
 * compartir y que recargar mantenga la cuenta abierta.
 */
import { useCallback, useSyncExternalStore } from 'react'

export type Destino =
  | { tipo: 'cuenta'; codigo: string }
  | { tipo: 'movimiento'; id: string }
  /** Mapa de clases: sin código el mosaico de las nueve; con código, una clase o un grupo. */
  | { tipo: 'clases'; codigo?: string }
  /** Listado del entrenamiento. */
  | { tipo: 'entrenar' }
  | { tipo: 'ejercicio'; id: string }
  | null

const escuchadores = new Set<() => void>()
/** Cuántas entradas ha añadido la aplicación: sirve para saber si puede volver atrás. */
let profundidad = 0
let cache: Destino | undefined

export function aHash(destino: Destino): string {
  if (destino === null) return ''
  switch (destino.tipo) {
    case 'cuenta':
      return `#c/${destino.codigo}`
    case 'movimiento':
      return `#m/${destino.id}`
    case 'clases':
      return destino.codigo ? `#clases/${destino.codigo}` : '#clases'
    case 'entrenar':
      return '#entrenar'
    case 'ejercicio':
      return `#e/${destino.id}`
  }
}

const ID_VALIDO = /^[a-z0-9-]{1,64}$/

function desdeHash(hash: string): Destino {
  const valor = decodeURIComponent(hash.replace(/^#/, ''))
  if (valor === 'entrenar') return { tipo: 'entrenar' }
  if (valor === 'clases') return { tipo: 'clases' }
  if (valor.startsWith('clases/')) {
    const codigo = valor.slice(7)
    return /^\d{1,2}$/.test(codigo) ? { tipo: 'clases', codigo } : { tipo: 'clases' }
  }
  if (valor.startsWith('c/')) {
    const codigo = valor.slice(2)
    return /^\d{1,10}$/.test(codigo) ? { tipo: 'cuenta', codigo } : null
  }
  if (valor.startsWith('m/')) {
    const id = valor.slice(2)
    return ID_VALIDO.test(id) ? { tipo: 'movimiento', id } : null
  }
  if (valor.startsWith('e/')) {
    const id = valor.slice(2)
    return ID_VALIDO.test(id) ? { tipo: 'ejercicio', id } : null
  }
  return null
}

/** Instantánea estable: solo cambia de referencia cuando cambia el destino. */
function instantanea(): Destino {
  if (cache === undefined) cache = desdeHash(window.location.hash)
  return cache
}

/** Durante el renderizado en el servidor no hay hash disponible. */
const instantaneaServidor = (): Destino => null

function avisar() {
  for (const escuchador of escuchadores) escuchador()
}

function alCambiarHistorial() {
  const siguiente = desdeHash(window.location.hash)
  const anterior = cache ?? null
  const igual =
    siguiente === anterior ||
    (siguiente !== null &&
      anterior !== null &&
      siguiente.tipo === anterior.tipo &&
      aHash(siguiente) === aHash(anterior))
  if (igual) return
  cache = siguiente
  if (profundidad > 0) profundidad -= 1
  avisar()
}

function suscribir(escuchador: () => void) {
  if (escuchadores.size === 0) {
    window.addEventListener('popstate', alCambiarHistorial)
    window.addEventListener('hashchange', alCambiarHistorial)
  }
  escuchadores.add(escuchador)
  return () => {
    escuchadores.delete(escuchador)
    if (escuchadores.size === 0) {
      window.removeEventListener('popstate', alCambiarHistorial)
      window.removeEventListener('hashchange', alCambiarHistorial)
    }
  }
}

export function useDestino() {
  const destino = useSyncExternalStore(suscribir, instantanea, instantaneaServidor)

  const abrir = useCallback((siguiente: Destino) => {
    const hash = aHash(siguiente)
    if (hash === window.location.hash) return
    // pushState no dispara popstate: hay que avisar a mano.
    window.history.pushState(null, '', hash || window.location.pathname + window.location.search)
    profundidad += 1
    cache = siguiente
    avisar()
  }, [])

  const cerrar = useCallback(() => {
    if (profundidad > 0) {
      // Deja que el historial retroceda: alCambiarHistorial actualizará el estado.
      window.history.back()
      return
    }
    // Se llegó directamente por enlace: no hay a dónde volver, se limpia el hash.
    window.history.replaceState(null, '', window.location.pathname + window.location.search)
    cache = null
    avisar()
  }, [])

  return { destino, abrir, cerrar }
}
