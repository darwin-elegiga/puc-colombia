'use client'

import { useEffect, useRef, useState } from 'react'
import type { Catalogo } from '@/lib/catalogo'
import { asientoVacio, conRenglonLibre, estaVacia, sumas, type Asiento, type Fila } from '@/lib/practica'
import HojaAsiento from './HojaAsiento'
import AccionesHoja from './AccionesHoja'
import { IconoChevron, IconoMas } from './Iconos'

/**
 * La hoja en blanco: uno o varios asientos seguidos, como en un libro diario, cada uno
 * con qué pasó, sus renglones y su cuadre. Empieza vacía cada vez que se abre; se
 * guarda en el dispositivo o se exporta e importa en CSV (AccionesHoja).
 */
export default function HojaEnBlanco({ catalogo, onVolver }: { catalogo: Catalogo; onVolver: () => void }) {
  const [asientos, setAsientos] = useState<Asiento[]>(() => [asientoVacio()])
  /** Asiento que pide confirmación antes de quitarse. */
  const [quitando, setQuitando] = useState<number | null>(null)
  /** Asiento recién añadido, para llevarlo a la vista cuando aparezca. */
  const nuevo = useRef<number | null>(null)
  const secciones = useRef(new Map<number, HTMLElement>())

  useEffect(() => {
    if (nuevo.current === null) return
    const seccion = secciones.current.get(nuevo.current)
    seccion?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    seccion?.querySelector<HTMLInputElement>('input[inputmode="numeric"]')?.focus({ preventScroll: true })
    nuevo.current = null
  }, [asientos.length])

  const cambiar = (i: number, cambios: Partial<Asiento>) =>
    setAsientos((previos) => previos.map((a, k) => (k === i ? { ...a, ...cambios } : a)))

  const quitar = (i: number) => {
    setAsientos((previos) => (previos.length > 1 ? previos.filter((_, k) => k !== i) : [asientoVacio()]))
    setQuitando(null)
  }

  const conContenido = (a: Asiento) => a.nota.trim() !== '' || a.filas.some((f) => !estaVacia(f))
  const escritos = asientos.filter(conContenido)
  const sinCuadrar = escritos.filter((a) => !sumas(a.filas).cuadra).length

  return (
    <div className="flex h-dvh flex-col overflow-hidden bg-lienzo">
      <header
        className="z-20 flex shrink-0 items-center gap-1 border-b border-borde bg-lienzo px-2 py-2"
        style={{ paddingTop: 'calc(0.5rem + var(--seguro-arriba))' }}
      >
        <button
          type="button"
          onClick={onVolver}
          className="tactil flex items-center gap-1 rounded-lg pl-2 pr-3 text-[15px] text-tinta pulsable"
        >
          <IconoChevron className="size-5 rotate-180" />
          Ejercicios
        </button>
        <span className="ml-auto shrink-0 pr-2 text-[13px] text-tinta-tenue">
          {asientos.length} {asientos.length === 1 ? 'asiento' : 'asientos'}
        </span>
      </header>

      <div className="panel-scroll min-h-0 flex-1">
        <div className="mx-auto max-w-2xl px-3 py-6 sm:px-5 lg:px-8 lg:py-8">
          <div className="px-2 sm:px-0">
            <p className="rotulo">Práctica libre</p>
            <h1 className="editorial mt-2 text-[26px] leading-tight text-tinta lg:text-4xl">Hoja en blanco</h1>
            <p className="mt-3 text-[14.5px] leading-relaxed text-pretty text-tinta-suave">
              Escribe el código y el nombre de la cuenta aparece solo; o toca la celda de la cuenta para buscarla.
              Cada asiento cuadra cuando su debe y su haber suman lo mismo.
            </p>
          </div>

          {asientos.map((asiento, i) => (
            <section
              key={i}
              ref={(el) => {
                if (el) secciones.current.set(i, el)
                else secciones.current.delete(i)
              }}
              className="mt-7 scroll-mt-4"
            >
              <div className="mb-2 flex min-h-9 items-center justify-between gap-3 px-2 sm:px-0">
                <p className="rotulo">Asiento {i + 1}</p>
                {(asientos.length > 1 || conContenido(asiento)) &&
                  (quitando === i ? (
                    <button
                      type="button"
                      onClick={() => quitar(i)}
                      onBlur={() => setQuitando(null)}
                      className="min-h-9 rounded-lg px-3 text-[13px] font-medium"
                      style={{ background: 'var(--color-baja)', color: 'var(--color-baja-tinta)' }}
                    >
                      {asientos.length > 1 ? 'Quitar este asiento' : 'Vaciar'}
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => (conContenido(asiento) ? setQuitando(i) : quitar(i))}
                      className="min-h-9 px-1 text-[13px] text-tinta-tenue transition-colors hover:text-tinta"
                    >
                      {asientos.length > 1 ? 'Quitar' : 'Vaciar'}
                    </button>
                  ))}
              </div>
              <textarea
                value={asiento.nota}
                onChange={(e) => cambiar(i, { nota: e.target.value })}
                rows={1}
                placeholder="¿Qué pasó? (opcional)"
                aria-label={`Qué pasó en el asiento ${i + 1}`}
                className="mb-2.5 block w-full resize-y rounded-xl border border-borde bg-superficie px-3.5 py-2.5 text-[15px] leading-relaxed text-tinta outline-none placeholder:text-tinta-tenue focus:border-borde-fuerte"
              />
              <HojaAsiento
                filas={asiento.filas}
                onCambiar={(filas: Fila[]) => cambiar(i, { filas })}
                catalogo={catalogo}
              />
            </section>
          ))}

          <button
            type="button"
            onClick={() => {
              nuevo.current = asientos.length
              setAsientos((previos) => [...previos, asientoVacio()])
            }}
            className="tactil mt-4 flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-borde-fuerte text-[14px] font-medium text-tinta-suave transition-colors pulsable lg:hover:border-tinta-tenue lg:hover:text-tinta"
          >
            <IconoMas className="size-4" />
            Añadir asiento
          </button>

          {escritos.length > 1 && (
            <p
              className="mt-3 px-2 text-[13px] font-medium"
              style={{ color: sinCuadrar ? 'var(--color-baja-tinta)' : 'var(--color-sube-tinta)' }}
            >
              {sinCuadrar
                ? `${sinCuadrar} de ${escritos.length} asientos no cuadran`
                : `✓ Los ${escritos.length} asientos cuadran`}
            </p>
          )}

          <AccionesHoja
            asientos={asientos}
            catalogo={catalogo}
            onCargar={(otros) =>
              setAsientos(otros.length ? otros.map((a) => ({ nota: a.nota, filas: conRenglonLibre(a.filas) })) : [asientoVacio()])
            }
          />

          <div className="h-6" style={{ paddingBottom: 'var(--seguro-abajo)' }} />
        </div>
      </div>
    </div>
  )
}
