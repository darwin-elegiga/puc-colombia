'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import type { VistaAula } from './aulas'
import { apiAulas, ErrorRed, guardarCopiaDocente, guardarDeMisClases, leerCopiaDocente, marcarAulaTerminada, type MiAula } from './misAulas'

/** Cada 3 s mientras hay movimiento; tras un minuto sin cambios, cada 10 s (ahorra comandos de Upstash). */
const INTERVALO_MS = 3000
const INTERVALO_QUIETO_MS = 10_000
const QUIETO_TRAS = 20

/**
 * Mantiene al día la vista de un aula: pregunta cada pocos segundos, solo con la
 * pantalla visible, y manda la versión que ya tiene para que el servidor conteste
 * «sin cambios» con un solo comando. Cada vista nueva se guarda en el dispositivo:
 * el docente conserva entregas y notas, y el estudiante sus ejercicios publicados.
 */
export function useAula(aula: MiAula | undefined) {
  const [vista, setVista] = useState<VistaAula | null>(() => {
    const copia = aula?.rol === 'docente' ? leerCopiaDocente(aula.codigo) : null
    // Las copias de antes del quiz tienen otra forma: no se muestran.
    return copia?.modo === 'quiz' ? copia : null
  })
  const [error, setError] = useState<ErrorRed | null>(null)
  /** Reloj del servidor menos el del dispositivo: el tiempo en pantalla no depende del móvil. */
  const [desfase, setDesfase] = useState(0)
  const version = useRef<number | undefined>(undefined)
  /** La consulta en vuelo (con sus repeticiones), para no lanzar otra a la vez. */
  const enCurso = useRef<Promise<void> | null>(null)
  /** Consultas seguidas sin cambios: con muchas, se espacian. */
  const sinCambios = useRef(0)
  /** Se pidió el estado completo mientras había una consulta en vuelo: se repite al terminar. */
  const repetir = useRef(false)
  /** El aula ya no existe o ya no nos deja entrar (404/403/401): no se vuelve a preguntar. */
  const detenido = useRef(false)
  /** Cerrada: ya solo pueden llegar notas o soluciones, se pregunta con menos frecuencia. */
  const cerrada = useRef(false)
  const codigoPrevio = useRef<string | undefined>(undefined)

  /** Una consulta: el estado completo, o «sin cambios» si la versión sigue igual. */
  const consultar = useCallback(async () => {
    if (!aula) return
    try {
      const respuesta = await apiAulas.estado(aula.codigo, aula.clave, version.current)
      setError(null)
      if ('sinCambios' in respuesta) {
        sinCambios.current += 1
        return
      }
      sinCambios.current = 0
      version.current = respuesta.version
      setDesfase(respuesta.ahora - Date.now())
      setVista(respuesta)
      // Cerrada por el docente: el modo aula del estudiante se levanta.
      cerrada.current = respuesta.aula.estado === 'cerrada'
      if (cerrada.current) marcarAulaTerminada(aula.codigo)
      if (respuesta.rol === 'docente') guardarCopiaDocente(respuesta)
      else guardarDeMisClases(respuesta.aula, respuesta.publicados)
    } catch (e) {
      const fallo = e instanceof ErrorRed ? e : new ErrorRed(0, 'Algo falló.')
      setError(fallo)
      // Caducada o expulsado: tampoco condiciona ya la app, y no tiene sentido seguir preguntando.
      if (fallo.estado === 404 || fallo.estado === 403 || fallo.estado === 401) {
        detenido.current = true
        marcarAulaTerminada(aula.codigo)
      } else {
        // Sin red o error del servidor: se espacian las consultas en vez de insistir cada 3 s.
        sinCambios.current = QUIETO_TRAS
      }
    }
  }, [aula])

  const refrescar = useCallback(async () => {
    if (!aula || detenido.current) return
    if (enCurso.current) {
      // Quien espera (el cargador de una acción) espera también a la repetición.
      repetir.current = true
      return enCurso.current
    }
    const bucle = (async () => {
      try {
        await consultar()
        // Lo pedido durante la consulta: estado completo, que la anterior pudo leer antes del cambio.
        while (repetir.current && !detenido.current) {
          repetir.current = false
          version.current = undefined
          await consultar()
        }
      } finally {
        enCurso.current = null
      }
    })()
    enCurso.current = bucle
    return bucle
  }, [aula, consultar])

  /**
   * Tras una acción propia: se pide el estado completo sin esperar al siguiente turno. Si
   * hay una consulta en vuelo (que pudo leer antes del cambio), se repite al terminar.
   */
  const actualizarYa = useCallback(async () => {
    version.current = undefined
    sinCambios.current = 0
    await refrescar()
  }, [refrescar])

  useEffect(() => {
    if (!aula) return
    // marcarAulaTerminada crea otro objeto de la misma aula: solo se empieza de cero si cambia el código.
    if (codigoPrevio.current !== aula.codigo) {
      codigoPrevio.current = aula.codigo
      version.current = undefined
      detenido.current = false
      cerrada.current = false
    }
    const turno = () => {
      if (document.visibilityState === 'visible') void refrescar()
    }
    // La primera consulta siempre (en el siguiente turno); las siguientes, solo con la pantalla visible.
    const primera = setTimeout(() => void refrescar(), 0)
    // Un temporizador que se reprograma: el intervalo depende de si hay cambios.
    let reloj: ReturnType<typeof setTimeout>
    const programar = () => {
      reloj = setTimeout(() => {
        turno()
        programar()
      }, cerrada.current || sinCambios.current >= QUIETO_TRAS ? INTERVALO_QUIETO_MS : INTERVALO_MS)
    }
    programar()
    const alVolver = () => {
      sinCambios.current = 0
      turno()
    }
    document.addEventListener('visibilitychange', alVolver)
    return () => {
      clearTimeout(primera)
      clearTimeout(reloj)
      document.removeEventListener('visibilitychange', alVolver)
    }
  }, [aula, refrescar])

  return { vista, error, actualizarYa, desfase }
}
