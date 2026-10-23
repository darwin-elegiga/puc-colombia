/**
 * Las métricas sobre el almacén de las aulas: un hash de contadores por día que caduca solo,
 * la lista de entradas (cuándo, desde qué dispositivo y qué vez es) y cuántas veces ha
 * entrado cada navegador.
 */
import { timingSafeEqual } from 'node:crypto'
import type { Almacen } from './aulasServidor'
import {
  diaColombia, horaColombia, incrementos, resumir, ultimosDias, type Entrada, type Evento, type ResumenMetricas,
} from './metricas'

/** Cuánto se guarda cada día y cada entrada: lo que puede pedir el panel. */
export const DIAS_GUARDADOS = 90
const DIA_MS = 86_400_000
/** Un navegador que no vuelve en un año se olvida: si vuelve después, cuenta como nuevo. */
const VISITANTE_MS = 365 * DIA_MS
/** Entradas que devuelve el panel como mucho. */
export const MAX_ENTRADAS = 500

/** Eventos por IP y minuto: de sobra para alguien navegando, poco para inflar las cifras. */
const MAX_EVENTOS_MINUTO = 120
/** Intentos de PIN fallidos por IP cada cuarto de hora: un PIN de 4 dígitos no aguanta más. */
const MAX_FALLOS_PIN = 5
const VENTANA_PIN_MS = 15 * 60_000

const claveDia = (dia: string) => `metricas:${dia}`
const CLAVE_ENTRADAS = 'metricas:entradas'

export function servicioMetricas(almacen: Almacen, reloj: () => number = Date.now) {
  /** Cuenta un uso en la ventana actual y devuelve cuántos lleva. */
  const contar = async (clave: string, ventanaMs: number) => {
    const ventana = Math.floor(reloj() / ventanaMs)
    return almacen.incr(`limite:${clave}:${ventana}`, (ventana + 1) * ventanaMs + 1000)
  }
  const leerUsos = async (clave: string, ventanaMs: number) =>
    Number((await almacen.get(`limite:${clave}:${Math.floor(reloj() / ventanaMs)}`)) ?? 0)

  /** Anota la entrada en la lista y devuelve los contadores que suma además de los del evento. */
  const anotarEntrada = async (evento: Extract<Evento, { tipo: 'inicio' }>, ahora: number) => {
    const visita = evento.visitante ? await almacen.incr(`metricas:visitante:${evento.visitante}`, ahora + VISITANTE_MS) : null
    const entrada: Entrada = {
      t: ahora,
      pantalla: evento.pantalla,
      dispositivo: evento.dispositivo,
      visitante: evento.visitante?.slice(0, 6) ?? null,
      visita,
    }
    await almacen.zadd(CLAVE_ENTRADAS, ahora, JSON.stringify(entrada))
    await almacen.zremPorPuntaje(CLAVE_ENTRADAS, 0, ahora - DIAS_GUARDADOS * DIA_MS)
    const extra: Record<string, number> = { [`hora:${horaColombia(ahora)}`]: 1 }
    if (visita !== null) extra[visita === 1 ? 'nuevos' : 'recurrentes'] = 1
    return extra
  }

  return {
    /** Suma el evento al contador de hoy; devuelve false si la IP pasó su límite. */
    async registrar(evento: Evento, ip: string): Promise<boolean> {
      if ((await contar(`metricas:${ip}`, 60_000)) > MAX_EVENTOS_MINUTO) return false
      const ahora = reloj()
      const extra = evento.tipo === 'inicio' ? await anotarEntrada(evento, ahora) : {}
      await almacen.hincrby(claveDia(diaColombia(ahora)), { ...incrementos(evento), ...extra }, ahora + (DIAS_GUARDADOS + 1) * DIA_MS)
      return true
    },

    /** ¿Puede esta IP intentar otro PIN? */
    async bloqueado(ip: string): Promise<boolean> {
      return (await leerUsos(`pin:${ip}`, VENTANA_PIN_MS)) >= MAX_FALLOS_PIN
    },

    async fallo(ip: string): Promise<void> {
      await contar(`pin:${ip}`, VENTANA_PIN_MS)
    },

    async resumen(dias: number): Promise<ResumenMetricas> {
      const lista = ultimosDias(reloj(), Math.min(DIAS_GUARDADOS, Math.max(1, Math.round(dias))))
      // Colombia no cambia de hora: el día empieza siempre a las 00:00 -05:00.
      const desde = Date.parse(`${lista[0]}T00:00:00-05:00`)
      const [campos, crudas] = await Promise.all([
        Promise.all(lista.map((dia) => almacen.hgetall(claveDia(dia)))),
        almacen.zrangePorPuntaje(CLAVE_ENTRADAS, desde, reloj() + DIA_MS),
      ])
      const entradas = crudas
        .slice(-MAX_ENTRADAS)
        .reverse()
        .flatMap((texto) => {
          try {
            return [JSON.parse(texto) as Entrada]
          } catch {
            return []
          }
        })
      return resumir(lista.map((dia, i) => ({ dia, campos: campos[i] })), entradas)
    },
  }
}

/** El PIN del panel: METRICAS_PIN en el entorno o, si no está, 0000. */
export function pinCorrecto(pin: string | null): boolean {
  const esperado = Buffer.from(process.env.METRICAS_PIN || '0000')
  const recibido = Buffer.from(pin ?? '')
  return recibido.length === esperado.length && timingSafeEqual(recibido, esperado)
}
