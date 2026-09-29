'use client'

/**
 * Lo que cada dispositivo guarda de sus aulas, para que cerrar el navegador no haga
 * perder nada:
 *  - mis aulas: código, rol, clave y nombre, para volver a entrar sin escribir nada;
 *  - el borrador del estudiante, renglón a renglón;
 *  - la última vista del docente, con entregas y notas, que sigue ahí aunque el aula caduque;
 *  - «De mis clases»: los ejercicios con la solución publicada, para practicarlos otra vez.
 *
 * Y las llamadas a /api/aulas.
 */
import { useCallback, useEffect, useState, useSyncExternalStore } from 'react'
import type { AulaPublica, AulaResumen, EjercicioDeAula, EntregaVisible, VistaAula, VistaDocente } from './aulas'
import type { Fila } from './practica'

const CLAVE_AULAS = 'puc-colombia:mis-aulas:v1'
const CLAVE_CLASES = 'puc-colombia:de-mis-clases:v1'
const CLAVE_NOMBRE = 'puc-colombia:mi-nombre'
const claveCopia = (codigo: string) => `puc-colombia:aula-copia:${codigo}`
const claveBorrador = (codigo: string, ejercicio: string) => `puc-colombia:aula-borrador:${codigo}:${ejercicio}`

export interface MiAula {
  codigo: string
  rol: 'docente' | 'estudiante'
  /** «docente.secreto» o «{id}.secreto»: se envía en cada petición. */
  clave: string
  nombre: string
  nombreAula: string
  docente: string
  publica: boolean
  expira: number
  unido: number
  /** El docente la cerró, caducó o sacaron a este estudiante: ya no condiciona la app. */
  terminada?: boolean
}

export interface EjercicioDeClase {
  /** «{código}-{ejercicio}». */
  id: string
  codigo: string
  nombreAula: string
  docente: string
  fecha: number
  ejercicio: EjercicioDeAula
  entrega: EntregaVisible | null
}

/* ─────────────────────────── Almacén local ─────────────────────────── */

function leer<T>(clave: string, vacio: T): T {
  if (typeof window === 'undefined') return vacio
  try {
    const crudo = window.localStorage.getItem(clave)
    return crudo ? (JSON.parse(crudo) as T) : vacio
  } catch {
    return vacio
  }
}

function escribir(clave: string, valor: unknown) {
  try {
    window.localStorage.setItem(clave, JSON.stringify(valor))
  } catch {
    // Sin espacio o en modo privado: la sesión sigue, pero no se conservará.
  }
}

const SIN_AULAS: MiAula[] = []
const SIN_CLASES: EjercicioDeClase[] = []
let cacheAulas: MiAula[] | null = null
let cacheClases: EjercicioDeClase[] | null = null
const escuchadores = new Set<() => void>()
const avisar = () => escuchadores.forEach((e) => e())

/** Otra pestaña cambió lo guardado: una sola función para todos los suscriptores. */
function alCambiarOtraPestana(e: StorageEvent) {
  if (e.key === null || e.key === CLAVE_AULAS || e.key === CLAVE_CLASES || e.key === CLAVE_PROPIOS) {
    cacheAulas = null
    cacheClases = null
    cachePropios = null
    avisar()
  }
}

function suscribir(escuchador: () => void) {
  if (escuchadores.size === 0) window.addEventListener('storage', alCambiarOtraPestana)
  escuchadores.add(escuchador)
  return () => {
    escuchadores.delete(escuchador)
    if (escuchadores.size === 0) window.removeEventListener('storage', alCambiarOtraPestana)
  }
}

const aulasGuardadas = () => (cacheAulas ??= leer(CLAVE_AULAS, SIN_AULAS))
const clasesGuardadas = () => (cacheClases ??= leer(CLAVE_CLASES, SIN_CLASES))

function guardarAulas(lista: MiAula[]) {
  cacheAulas = lista
  escribir(CLAVE_AULAS, lista)
  avisar()
}

export function useMisAulas() {
  const aulas = useSyncExternalStore(suscribir, aulasGuardadas, () => SIN_AULAS)
  const recordar = useCallback((aula: MiAula) => {
    guardarAulas([aula, ...aulasGuardadas().filter((a) => a.codigo !== aula.codigo)])
  }, [])
  const olvidar = useCallback((codigo: string) => {
    guardarAulas(aulasGuardadas().filter((a) => a.codigo !== codigo))
    try {
      window.localStorage.removeItem(claveCopia(codigo))
    } catch {
      // Nada que borrar.
    }
    limpiarBorradores(codigo)
  }, [])
  return { aulas, recordar, olvidar }
}

/** Las aulas de este dispositivo que aún no han caducado ni terminado. */
export const vigentes = (aulas: MiAula[], ahora = Date.now()) => aulas.filter((a) => a.expira > ahora && !a.terminada)

/** Marca un aula como terminada (cerrada, caducada o expulsado): deja de condicionar la app. */
export function marcarAulaTerminada(codigo: string) {
  const lista = aulasGuardadas()
  if (!lista.some((a) => a.codigo === codigo && !a.terminada)) return
  guardarAulas(lista.map((a) => (a.codigo === codigo ? { ...a, terminada: true } : a)))
}

/**
 * Modo aula: el aula vigente en la que este dispositivo es estudiante, o null. Mientras
 * la haya, la app no ofrece IA ni movimientos (solo el catálogo) para que el ejercicio
 * se resuelva sin ayudas. Quien dirige el aula no queda limitado.
 */
export function useModoAula(): MiAula | null {
  const { aulas } = useMisAulas()
  const [ahora, setAhora] = useState(() => Date.now())
  useEffect(() => {
    const t = setInterval(() => setAhora(Date.now()), 60_000)
    return () => clearInterval(t)
  }, [])
  return vigentes(aulas, ahora).find((a) => a.rol === 'estudiante') ?? null
}

export function useDeMisClases() {
  const clases = useSyncExternalStore(suscribir, clasesGuardadas, () => SIN_CLASES)
  return clases
}

/** Guarda (o actualiza) los ejercicios con la solución publicada en «De mis clases». */
export function guardarDeMisClases(aula: AulaResumen, publicados: (EjercicioDeAula & { entrega: EntregaVisible | null })[]) {
  if (!publicados.length) return
  const actuales = clasesGuardadas()
  const nuevos = publicados.map<EjercicioDeClase>((e) => ({
    id: `${aula.codigo.toLowerCase()}-${e.id}`,
    codigo: aula.codigo,
    nombreAula: aula.nombre,
    docente: aula.docente,
    fecha: e.lanzado,
    ejercicio: e,
    entrega: e.entrega,
  }))
  const cambio = nuevos.some((n) => JSON.stringify(actuales.find((a) => a.id === n.id)) !== JSON.stringify(n))
  if (!cambio) return
  const lista = [...nuevos, ...actuales.filter((a) => !nuevos.some((n) => n.id === a.id))].sort((a, b) => b.fecha - a.fecha)
  cacheClases = lista
  escribir(CLAVE_CLASES, lista)
  avisar()
}

export const ejercicioDeClasePorId = (id: string) => clasesGuardadas().find((c) => c.id === id)

export const leerCopiaDocente = (codigo: string) => leer<VistaDocente | null>(claveCopia(codigo), null)
export const guardarCopiaDocente = (vista: VistaDocente) => escribir(claveCopia(vista.aula.codigo), vista)

/** Borra los borradores de un aula (o de todas las que ya no están vigentes). */
export function limpiarBorradores(codigo?: string) {
  try {
    const vivas = new Set(vigentes(aulasGuardadas()).map((a) => a.codigo))
    for (let i = window.localStorage.length - 1; i >= 0; i--) {
      const clave = window.localStorage.key(i)
      const m = clave?.match(/^puc-colombia:aula-borrador:([A-Z0-9]+):/)
      if (m && (codigo ? m[1] === codigo : !vivas.has(m[1]))) window.localStorage.removeItem(clave!)
    }
  } catch {
    // Sin almacenamiento: nada que limpiar.
  }
}

export const leerBorrador = (codigo: string, ejercicio: string) => leer<Fila[] | null>(claveBorrador(codigo, ejercicio), null)
export const guardarBorrador = (codigo: string, ejercicio: string, filas: Fila[]) => escribir(claveBorrador(codigo, ejercicio), filas)

/* ─────────────────────────── Ejercicios propios del docente ─────────────────────────── */

const CLAVE_PROPIOS = 'puc-colombia:mis-ejercicios:v1'

export interface EjercicioGuardado {
  id: string
  titulo: string
  enunciado: string
  filas: Fila[]
  explicacion: string
  fecha: number
}

const SIN_PROPIOS: EjercicioGuardado[] = []
let cachePropios: EjercicioGuardado[] | null = null
const propiosGuardados = () => (cachePropios ??= leer(CLAVE_PROPIOS, SIN_PROPIOS))

/** Los ejercicios que el docente escribió, para volver a lanzarlos otro día. */
export function useMisEjercicios() {
  return useSyncExternalStore(suscribir, propiosGuardados, () => SIN_PROPIOS)
}

/** Guarda (o actualiza, si ya existe el mismo enunciado) un ejercicio propio. */
export function guardarMiEjercicio(e: Omit<EjercicioGuardado, 'id' | 'fecha'>) {
  const previo = propiosGuardados().find((p) => p.enunciado === e.enunciado)
  const nuevo: EjercicioGuardado = { ...e, id: previo?.id ?? `p${Date.now().toString(36)}`, fecha: Date.now() }
  cachePropios = [nuevo, ...propiosGuardados().filter((p) => p.id !== nuevo.id)]
  escribir(CLAVE_PROPIOS, cachePropios)
  avisar()
}

export function borrarMiEjercicio(id: string) {
  cachePropios = propiosGuardados().filter((p) => p.id !== id)
  escribir(CLAVE_PROPIOS, cachePropios)
  avisar()
}

/** La IA propone el asiento de un enunciado (beta): la misma ruta que «Asiento» de la portada. */
export async function proponerSolucionIA(enunciado: string) {
  const r = await pedir<{
    renglones: { codigo: string; debito: number; credito: number }[]
    supuestos: string[]
    advertencias: string[]
  }>('/api/asiento', { method: 'POST', body: JSON.stringify({ situacion: enunciado.slice(0, 600) }) })
  return {
    filas: r.renglones.map<Fila>((l) => ({ codigo: l.codigo, debe: l.debito || null, haber: l.debito ? null : l.credito || null })),
    notas: [...r.supuestos, ...r.advertencias],
  }
}

export const leerMiNombre = () => leer<string>(CLAVE_NOMBRE, '')
export const guardarMiNombre = (nombre: string) => escribir(CLAVE_NOMBRE, nombre)

/* ─────────────────────────── API ─────────────────────────── */

export class ErrorRed extends Error {
  constructor(public estado: number, mensaje: string) {
    super(mensaje)
  }
}

async function pedir<T>(ruta: string, opciones: RequestInit & { clave?: string } = {}): Promise<T> {
  const { clave, headers, ...resto } = opciones
  let respuesta: Response
  try {
    respuesta = await fetch(ruta, {
      ...resto,
      headers: { 'Content-Type': 'application/json', ...(clave ? { Authorization: `Bearer ${clave}` } : {}), ...headers },
      // Una red colgada no debe dejar la pantalla esperando: la IA tiene más margen.
      signal: resto.signal ?? AbortSignal.timeout(ruta.startsWith('/api/asiento') || resto.body?.toString().includes('"sugerir"') ? 60_000 : 10_000),
    })
  } catch {
    throw new ErrorRed(0, 'Sin conexión o sin respuesta: revisa internet y vuelve a intentarlo.')
  }
  const datos = await respuesta.json().catch(() => ({}))
  if (!respuesta.ok) throw new ErrorRed(respuesta.status, (datos as { error?: string }).error ?? 'Algo falló. Vuelve a intentarlo.')
  return datos as T
}

export const apiAulas = {
  publicas: () => pedir<{ aulas: AulaPublica[] }>('/api/aulas').then((r) => r.aulas),
  crear: (datos: { nombre: string; docente: string; publica: boolean }) =>
    pedir<{ codigo: string; clave: string; aula: AulaResumen }>('/api/aulas', { method: 'POST', body: JSON.stringify(datos) }),
  unirse: (codigo: string, nombre: string) =>
    pedir<{ clave: string; nombre: string; aula: AulaResumen }>(`/api/aulas/${codigo}`, {
      method: 'POST',
      body: JSON.stringify({ accion: 'unirse', nombre }),
    }),
  estado: (codigo: string, clave: string, version?: number) =>
    pedir<VistaAula | { sinCambios: true; version: number }>(
      `/api/aulas/${codigo}${version !== undefined ? `?v=${version}` : ''}`,
      { clave, cache: 'no-store' },
    ),
  accion: <T = { ok: true }>(codigo: string, clave: string, accion: string, datos: Record<string, unknown> = {}) =>
    pedir<T>(`/api/aulas/${codigo}`, { method: 'POST', clave, body: JSON.stringify({ accion, ...datos }) }),
}
