'use client'

import { useEffect } from 'react'
import { useDestino } from '@/lib/navegacion'
import { leerDispositivo, VISITANTE_VALIDO, type Evento, type Pantalla } from '@/lib/metricas'

/** Marca de la pestaña: si ya existe, recargar no cuenta como sesión nueva. */
const CLAVE_SESION = 'puc-metricas-sesion'
/** Identificador aleatorio de este navegador, para saber si vuelve a entrar. No dice quién es. */
const CLAVE_VISITANTE = 'puc-metricas-visitante'

function visitante(): string | null {
  try {
    let id = localStorage.getItem(CLAVE_VISITANTE)
    if (!id || !VISITANTE_VALIDO.test(id)) {
      id = Array.from(crypto.getRandomValues(new Uint8Array(12)), (b) => b.toString(36).padStart(2, '0')).join('').slice(0, 24)
      localStorage.setItem(CLAVE_VISITANTE, id)
    }
    return id
  } catch {
    // Sin localStorage no se puede reconocer la vuelta: la entrada cuenta igual, sin visitante.
    return null
  }
}

/** Pantalla actual y desde cuándo está visible (null mientras la app está en segundo plano). */
let actual: Pantalla | null = null
let visibleDesde: number | null = null

function enviar(evento: Evento) {
  const cuerpo = JSON.stringify(evento)
  try {
    // sendBeacon sobrevive al cierre de la pestaña; si no está, fetch con keepalive.
    if (navigator.sendBeacon?.('/api/metricas', cuerpo)) return
    void fetch('/api/metricas', { method: 'POST', body: cuerpo, keepalive: true }).catch(() => undefined)
  } catch {
    // Las métricas nunca deben romper la app.
  }
}

/** Respeta «no rastrear» del navegador (Global Privacy Control o Do Not Track). */
function rechazaSeguimiento() {
  const n = navigator as Navigator & { globalPrivacyControl?: boolean }
  return n.globalPrivacyControl === true || n.doNotTrack === '1'
}

function tomarTiempo(ahora: number) {
  // Lo visto antes de pasar a segundo plano ya se mandó al ocultarse.
  const ms = visibleDesde === null ? 0 : ahora - visibleDesde
  visibleDesde = document.visibilityState === 'visible' ? ahora : null
  return ms
}

/**
 * Cuenta, sin identificar a nadie, por qué pantallas se mueve la gente, desde qué
 * dispositivo y cuánto tiempo. El panel está en /metricas.
 */
export default function RegistroMetricas() {
  const { destino } = useDestino()
  const pantalla: Pantalla = destino?.tipo ?? 'inicio'

  useEffect(() => {
    if (rechazaSeguimiento()) return
    const ahora = Date.now()
    if (actual === null) {
      // Primera pantalla de esta carga.
      actual = pantalla
      visibleDesde = document.visibilityState === 'visible' ? ahora : null
      let nueva = true
      try {
        nueva = sessionStorage.getItem(CLAVE_SESION) === null
        sessionStorage.setItem(CLAVE_SESION, '1')
      } catch {
        // Sin sessionStorage cada carga cuenta como sesión.
      }
      if (nueva) {
        const instalada = window.matchMedia('(display-mode: standalone)').matches || (navigator as Navigator & { standalone?: boolean }).standalone === true
        enviar({
          tipo: 'inicio',
          pantalla,
          dispositivo: leerDispositivo(navigator.userAgent, navigator.maxTouchPoints > 1, instalada),
          visitante: visitante(),
        })
      }
      return
    }
    if (actual === pantalla) return
    enviar({ tipo: 'paso', de: actual, a: pantalla, ms: tomarTiempo(ahora) })
    actual = pantalla
  }, [pantalla])

  useEffect(() => {
    if (rechazaSeguimiento()) return
    const alCambiarVisibilidad = () => {
      const ahora = Date.now()
      if (document.visibilityState === 'visible') {
        visibleDesde ??= ahora
        return
      }
      // A segundo plano: se manda lo visto hasta ahora, que quizá no vuelva.
      if (actual === null || visibleDesde === null) return
      const ms = ahora - visibleDesde
      visibleDesde = null
      if (ms > 0) enviar({ tipo: 'tiempo', pantalla: actual, ms })
    }
    document.addEventListener('visibilitychange', alCambiarVisibilidad)
    return () => document.removeEventListener('visibilitychange', alCambiarVisibilidad)
  }, [])

  return null
}
