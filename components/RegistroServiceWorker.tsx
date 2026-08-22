'use client'

import { useEffect } from 'react'

/**
 * Registra el service worker que hace funcionar la aplicación sin conexión.
 * Solo en producción: en desarrollo interferiría con la recarga en caliente.
 */
export default function RegistroServiceWorker() {
  useEffect(() => {
    if (process.env.NODE_ENV !== 'production') return
    if (!('serviceWorker' in navigator)) return

    const registrar = () => {
      navigator.serviceWorker.register('/sw.js').catch(() => {
        // Sin service worker la aplicación sigue funcionando, solo pierde el modo offline.
      })
    }

    if (document.readyState === 'complete') registrar()
    else {
      window.addEventListener('load', registrar)
      return () => window.removeEventListener('load', registrar)
    }
  }, [])

  return null
}
