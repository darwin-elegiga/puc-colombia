'use client'

import { useEffect, useRef, useState } from 'react'
import type { Catalogo } from '@/lib/catalogo'
import { nombreLegible } from '@/lib/puc'
import { asientoVacio, asientosACSV, asientosDesdeCSV, sumas, type Asiento } from '@/lib/practica'
import { soloEscrito, useHojasGuardadas } from '@/lib/guardados'
import { IconoDescarga, IconoPapelera, IconoSubida, IconoVisto } from './Iconos'

const plural = (n: number, uno: string, varios: string) => `${n} ${n === 1 ? uno : varios}`

/**
 * Guardar, exportar e importar la hoja en blanco —con todos sus asientos— y la lista de
 * lo guardado.
 *
 * Lo guardado vive en este navegador. Para llevárselo a otro sitio está el CSV, que
 * abre en Excel o Google Sheets como un libro diario y se puede volver a importar.
 */
export default function AccionesHoja({
  asientos,
  catalogo,
  onCargar,
}: {
  asientos: Asiento[]
  catalogo: Catalogo
  /** Reemplaza la hoja por otra: al abrir un guardado, importar o empezar de nuevo. */
  onCargar: (asientos: Asiento[]) => void
}) {
  const { guardados, guardar, eliminar } = useHojasGuardadas()
  /** La hoja guardada que se está editando: «Guardar» la actualiza en lugar de crear otra. */
  const [actual, setActual] = useState<string | null>(null)
  const [aviso, setAviso] = useState<string | null>(null)
  const [borrando, setBorrando] = useState<string | null>(null)
  const archivo = useRef<HTMLInputElement>(null)

  const escrito = soloEscrito(asientos)
  const renglones = escrito.reduce((n, a) => n + a.filas.length, 0)
  const enLista = guardados.find((g) => g.id === actual)
  const sinCambios = enLista !== undefined && JSON.stringify(enLista.asientos) === JSON.stringify(escrito)

  useEffect(() => {
    if (!aviso) return
    const t = setTimeout(() => setAviso(null), 2600)
    return () => clearTimeout(t)
  }, [aviso])

  const nombreDe = (codigo: string) => {
    const cuenta = catalogo.indice.get(codigo)
    return cuenta ? nombreLegible(cuenta.nombre) : ''
  }

  const alGuardar = () => {
    const id = guardar(asientos, actual)
    if (!id) return setAviso('Este navegador no deja guardar (modo privado o sin espacio). Exporta la hoja.')
    setActual(id)
    setAviso(actual ? 'Cambios guardados' : 'Guardado en este dispositivo')
  }

  const alExportar = () => {
    const csv = asientosACSV(asientos, nombreDe)
    // La marca BOM hace que Excel lea bien las tildes.
    const url = URL.createObjectURL(new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8' }))
    const enlace = document.createElement('a')
    enlace.href = url
    enlace.download = `asientos-${new Date().toISOString().slice(0, 10)}.csv`
    enlace.click()
    URL.revokeObjectURL(url)
  }

  const alImportar = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const elegido = e.target.files?.[0]
    e.target.value = ''
    if (!elegido) return
    try {
      const leidos = asientosDesdeCSV(await elegido.text())
      const filas = soloEscrito(leidos).reduce((n, a) => n + a.filas.length, 0)
      if (!filas) return setAviso('No encontré renglones con código en ese archivo.')
      onCargar(leidos)
      setActual(null)
      setAviso(`Importados ${plural(leidos.length, 'asiento', 'asientos')} con ${plural(filas, 'renglón', 'renglones')}`)
    } catch {
      setAviso('No se pudo leer el archivo.')
    }
  }

  const abrir = (id: string) => {
    const g = guardados.find((x) => x.id === id)
    if (!g) return
    onCargar(g.asientos.length ? g.asientos : [asientoVacio()])
    setActual(id)
  }

  const boton =
    'tactil flex items-center justify-center gap-1.5 rounded-xl border border-borde bg-superficie text-[14px] text-tinta-suave transition-colors pulsable disabled:opacity-40 lg:hover:border-borde-fuerte lg:hover:text-tinta'

  return (
    <section className="mt-6">
      <div className="grid grid-cols-3 gap-2">
        <button type="button" onClick={alGuardar} disabled={!escrito.length || sinCambios} className={boton}>
          <IconoVisto className="size-4" />
          {sinCambios ? 'Guardado' : 'Guardar'}
        </button>
        <button type="button" onClick={alExportar} disabled={!renglones} className={boton}>
          <IconoDescarga className="size-4" />
          Exportar
        </button>
        <button type="button" onClick={() => archivo.current?.click()} className={boton}>
          <IconoSubida className="size-4" />
          Importar
        </button>
        <input
          ref={archivo}
          type="file"
          accept=".csv,text/csv,text/plain"
          onChange={alImportar}
          className="hidden"
          aria-hidden
          tabIndex={-1}
        />
      </div>

      <p aria-live="polite" className="mt-2 min-h-5 px-2 text-[13px] text-tinta-suave">
        {aviso}
      </p>

      <div className="flex items-center justify-between gap-3 px-2">
        <p className="text-[12px] leading-relaxed text-tinta-tenue">
          Todos los asientos en un CSV, para abrirlo en Excel o Google Sheets.
        </p>
        {escrito.length > 0 && (
          <button
            type="button"
            onClick={() => {
              onCargar([asientoVacio()])
              setActual(null)
            }}
            className="flex min-h-10 shrink-0 items-center text-[13px] font-medium text-tinta-suave transition-colors hover:text-tinta"
          >
            Hoja nueva
          </button>
        )}
      </div>

      {/* ─────────── Guardados ─────────── */}
      {guardados.length > 0 && (
        <div className="mt-6">
          <div className="mb-2 flex items-baseline justify-between gap-3 px-2">
            <p className="rotulo">Guardados</p>
            <p className="text-[12px] text-tinta-tenue">En este dispositivo</p>
          </div>
          <ul className="overflow-hidden rounded-xl border border-borde bg-superficie">
            {guardados.map((g) => {
              const cuadran = g.asientos.every((a) => sumas(a.filas).cuadra)
              const titulo =
                g.asientos.find((a) => a.nota.trim())?.nota.trim().split('\n')[0] ?? plural(g.asientos.length, 'asiento', 'asientos')
              const esActual = g.id === actual
              return (
                <li key={g.id} className={`flex items-center border-b border-borde last:border-b-0 ${esActual ? 'bg-hueso' : ''}`}>
                  <button type="button" onClick={() => abrir(g.id)} className="min-h-14 min-w-0 flex-1 px-4 py-2.5 text-left pulsable">
                    <span className="block truncate text-[14.5px] text-tinta">{titulo}</span>
                    <span className="mt-0.5 block text-[12px] text-tinta-tenue">
                      {new Date(g.fecha).toLocaleDateString('es-CO', { day: 'numeric', month: 'short' })} ·{' '}
                      {plural(g.asientos.length, 'asiento', 'asientos')} ·{' '}
                      <span style={{ color: cuadran ? 'var(--color-sube-tinta)' : 'var(--color-baja-tinta)' }}>
                        {cuadran ? 'cuadra' : 'no cuadra'}
                      </span>
                      {esActual && ' · abierta'}
                    </span>
                  </button>
                  {borrando === g.id ? (
                    <button
                      type="button"
                      onClick={() => {
                        eliminar(g.id)
                        if (esActual) setActual(null)
                        setBorrando(null)
                      }}
                      onBlur={() => setBorrando(null)}
                      className="mr-2 min-h-10 shrink-0 rounded-lg px-3 text-[13px] font-medium"
                      style={{ background: 'var(--color-baja)', color: 'var(--color-baja-tinta)' }}
                    >
                      Eliminar
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setBorrando(g.id)}
                      aria-label={`Eliminar «${titulo}»`}
                      className="tactil grid w-12 shrink-0 place-items-center text-tinta-tenue transition-colors hover:text-tinta"
                    >
                      <IconoPapelera className="size-4" />
                    </button>
                  )}
                </li>
              )
            })}
          </ul>
        </div>
      )}
    </section>
  )
}
