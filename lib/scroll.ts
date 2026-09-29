'use client'

import { useLayoutEffect, useRef } from 'react'

/**
 * Posición de desplazamiento de cada vista, en memoria mientras dura la sesión.
 *
 * Al abrir un detalle, la portada, los resultados o el mapa de clases se desmontan o
 * se esconden (en el móvil, la lista queda en display:none), y el navegador pierde su
 * desplazamiento. Al volver, se recupera para seguir leyendo por donde se iba.
 */
const posiciones = new Map<string, number>()

/**
 * Devuelve la ref del contenedor que se desplaza. `clave` identifica la vista: otra
 * búsqueda u otra clase es otra vista y empieza arriba.
 */
export function useScrollRecordado<T extends HTMLElement>(clave: string) {
  const ref = useRef<T>(null)

  useLayoutEffect(() => {
    const el = ref.current
    if (!el) return
    const recuperar = () => {
      el.scrollTop = posiciones.get(clave) ?? 0
    }
    recuperar()

    // Escondido con display:none mide 0 y no se desplaza: lo que se lee entonces no vale.
    let visible = el.clientHeight > 0
    const guardar = () => {
      if (visible) posiciones.set(clave, el.scrollTop)
    }
    // Al volver a mostrarse, recupera la posición que tenía antes de esconderse.
    const observador = new ResizeObserver(() => {
      const ahora = el.clientHeight > 0
      if (ahora && !visible) recuperar()
      visible = ahora
    })
    el.addEventListener('scroll', guardar, { passive: true })
    observador.observe(el)
    return () => {
      el.removeEventListener('scroll', guardar)
      observador.disconnect()
    }
  }, [clave])

  return ref
}
