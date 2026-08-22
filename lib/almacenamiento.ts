'use client'

/**
 * Persistencia de las cuentas creadas por el usuario.
 *
 * En Vercel el sistema de archivos del servidor es de solo lectura, así que las
 * cuentas propias viven en localStorage del navegador. El catálogo oficial va
 * empaquetado en el repositorio, por lo que la app funciona sin base de datos.
 *
 * Se expone como almacén externo (useSyncExternalStore) para que React lea el
 * navegador sin efectos de sincronización y para que dos pestañas abiertas se
 * mantengan al día entre sí.
 */
import { useCallback, useSyncExternalStore } from 'react'
import type { Cuenta } from './tipos'

const CLAVE = 'puc-colombia:cuentas-personalizadas:v1'

/** Instantánea estable: useSyncExternalStore exige la misma referencia mientras nada cambie. */
let cache: Cuenta[] | null = null
const VACIO: Cuenta[] = []
const escuchadores = new Set<() => void>()

function leerDelNavegador(): Cuenta[] {
  if (typeof window === 'undefined') return VACIO
  try {
    const crudo = window.localStorage.getItem(CLAVE)
    if (!crudo) return VACIO
    const datos = JSON.parse(crudo)
    return Array.isArray(datos) ? (datos as Cuenta[]) : VACIO
  } catch {
    return VACIO
  }
}

function instantanea(): Cuenta[] {
  if (cache === null) cache = leerDelNavegador()
  return cache
}

/** Durante el renderizado en el servidor y la hidratación todavía no hay cuentas propias. */
const instantaneaServidor = (): Cuenta[] => VACIO

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

function guardar(cuentas: Cuenta[]) {
  cache = cuentas
  try {
    window.localStorage.setItem(CLAVE, JSON.stringify(cuentas))
  } catch {
    // Sin espacio o en modo privado: la sesión sigue, pero no se conservará al recargar.
  }
  avisar()
}

const porCodigo = (cuentas: Cuenta[]) => [...cuentas].sort((a, b) => a.codigo.localeCompare(b.codigo))

/** Cuentas propias y operaciones para modificarlas. */
export function useCuentasPropias() {
  const cuentas = useSyncExternalStore(suscribir, instantanea, instantaneaServidor)

  const agregar = useCallback((cuenta: Cuenta) => {
    guardar(porCodigo([...instantanea().filter((c) => c.codigo !== cuenta.codigo), cuenta]))
  }, [])

  const agregarVarias = useCallback((nuevas: Cuenta[]) => {
    const mapa = new Map(instantanea().map((c) => [c.codigo, c]))
    for (const cuenta of nuevas) mapa.set(cuenta.codigo, cuenta)
    guardar(porCodigo([...mapa.values()]))
  }, [])

  const eliminar = useCallback((codigo: string) => {
    guardar(instantanea().filter((c) => c.codigo !== codigo))
  }, [])

  const vaciar = useCallback(() => guardar(VACIO), [])

  return { cuentas, agregar, agregarVarias, eliminar, vaciar }
}

/** Descarga un texto como archivo, sin pasar por el servidor. */
export function descargar(nombreArchivo: string, contenido: string, tipo = 'text/csv;charset=utf-8') {
  // El BOM hace que Excel abra el CSV con los acentos correctos.
  const blob = new Blob(['\ufeff', contenido], { type: tipo })
  const url = URL.createObjectURL(blob)
  const enlace = document.createElement('a')
  enlace.href = url
  enlace.download = nombreArchivo
  document.body.appendChild(enlace)
  enlace.click()
  document.body.removeChild(enlace)
  URL.revokeObjectURL(url)
}
