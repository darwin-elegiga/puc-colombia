'use client'

import { useMemo } from 'react'
import { EJERCICIOS_ASIENTO, claveProgreso, gruposDeAsiento } from '@/lib/practica'
import type { Progreso } from '@/lib/progreso'
import { IconoChevron, IconoMas, IconoVisto } from './Iconos'

/**
 * Listado de «Hacer el asiento»: la hoja en blanco arriba, el progreso, y los ejercicios
 * agrupados —primero los niveles del entrenamiento, luego cada categoría de operaciones—
 * en secciones plegables para que casi seiscientos ejercicios no abrumen.
 */
export default function ListaAsientos({
  progreso,
  onAbrir,
}: {
  progreso: Progreso
  /** Un id de ejercicio, o «blanco» para la hoja en blanco. */
  onAbrir: (id: string) => void
}) {
  const grupos = useMemo(() => gruposDeAsiento(), [])
  const hecho = (id: string) => Boolean(progreso[claveProgreso(id)]?.resuelto)
  const resueltos = EJERCICIOS_ASIENTO.filter((e) => hecho(e.id)).length
  const pendiente = EJERCICIOS_ASIENTO.find((e) => !hecho(e.id))

  return (
    <>
      <p className="mt-3 text-[15px] leading-relaxed text-pretty text-tinta-suave">
        Lee la operación y escribe el asiento completo en la hoja: código, cuenta, debe y haber, como en
        Excel. Al comprobar se marca cada renglón.
      </p>

      {/* ─────────── Hoja en blanco ─────────── */}
      <button
        type="button"
        onClick={() => onAbrir('blanco')}
        className="mt-6 flex w-full items-center gap-3.5 rounded-xl border border-dashed border-borde-fuerte bg-superficie px-4 py-4 text-left pulsable lg:hover:border-tinta-tenue"
      >
        <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-hueso text-tinta">
          <IconoMas className="size-5" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-[15px] font-medium text-tinta">Hoja en blanco</span>
          <span className="block text-[13px] leading-snug text-tinta-suave">
            Registra cualquier operación, con el nombre de la cuenta y el cuadre en vivo
          </span>
        </span>
        <IconoChevron className="size-4 shrink-0 text-tinta-tenue" />
      </button>

      {/* ─────────── Progreso ─────────── */}
      <section className="mt-4 rounded-xl border border-borde bg-superficie px-4 py-4">
        <div className="flex items-baseline justify-between gap-3">
          <p className="text-[14px] text-tinta">
            <span className="tabular">{resueltos}</span> de <span className="tabular">{EJERCICIOS_ASIENTO.length}</span> asientos
            resueltos
          </p>
          <p className="tabular shrink-0 text-[13px] text-tinta-tenue">
            {Math.round((resueltos / EJERCICIOS_ASIENTO.length) * 100)}%
          </p>
        </div>
        <div className="mt-2.5 h-1 overflow-hidden rounded-full bg-borde">
          <div
            className="h-full rounded-full bg-tinta transition-[width] duration-500"
            style={{ width: `${(resueltos / EJERCICIOS_ASIENTO.length) * 100}%` }}
          />
        </div>
        {pendiente && (
          <button
            type="button"
            onClick={() => onAbrir(pendiente.id)}
            className="tactil mt-3.5 w-full rounded-xl bg-tinta text-[15px] text-white active:bg-[#3d4347] lg:hover:bg-[#3d4347]"
          >
            {resueltos === 0 ? 'Empezar' : 'Continuar'}
          </button>
        )}
      </section>

      {/* ─────────── Grupos ─────────── */}
      {(['entrenamiento', 'operacion'] as const).map((origen) => (
        <section key={origen} className="mt-8">
          <p className="rotulo mb-1">{origen === 'entrenamiento' ? 'Paso a paso' : 'Operaciones del día a día'}</p>
          <p className="mb-3 text-[13.5px] leading-relaxed text-tinta-suave">
            {origen === 'entrenamiento'
              ? 'Los ejercicios del entrenamiento, ahora escribiendo tú el asiento completo.'
              : 'Cada operación del buscador con importes: tú calculas los impuestos y el valor que cuadra.'}
          </p>
          <div className="overflow-hidden rounded-xl border border-borde bg-superficie">
            {grupos
              .filter((g) => g.origen === origen)
              .map((g) => {
                const hechos = g.ejercicios.filter((e) => hecho(e.id)).length
                return (
                  <details key={g.grupo} className="group border-b border-borde last:border-b-0">
                    <summary className="tactil flex cursor-pointer list-none items-center gap-3 px-4 py-3 pulsable [&::-webkit-details-marker]:hidden">
                      <span className="min-w-0 flex-1 truncate text-[15px] text-tinta">{g.grupo}</span>
                      <span className="tabular shrink-0 text-[12.5px] text-tinta-tenue">
                        {hechos}/{g.ejercicios.length}
                      </span>
                      <IconoChevron className="size-4 shrink-0 text-tinta-tenue transition-transform group-open:rotate-90" />
                    </summary>
                    <ul className="border-t border-borde bg-lienzo">
                      {g.ejercicios.map((e) => (
                        <li key={e.id} className="border-b border-borde last:border-b-0">
                          <button
                            type="button"
                            onClick={() => onAbrir(e.id)}
                            className="flex min-h-12 w-full items-center gap-3 px-4 py-2.5 text-left pulsable"
                          >
                            <span className="min-w-0 flex-1">
                              <span className="block text-[14px] leading-snug text-tinta">{e.titulo}</span>
                              <span className="block text-[12px] text-tinta-tenue">{e.solucion.length} renglones</span>
                            </span>
                            {hecho(e.id) ? (
                              <span
                                aria-label="Resuelto"
                                className="grid size-6 shrink-0 place-items-center rounded-full"
                                style={{ background: 'var(--color-propia)', color: 'var(--color-propia-tinta)' }}
                              >
                                <IconoVisto className="size-3.5" />
                              </span>
                            ) : progreso[claveProgreso(e.id)] ? (
                              <span aria-label="Intentado" className="size-1.5 shrink-0 rounded-full bg-borde-fuerte" />
                            ) : null}
                            <IconoChevron className="size-4 shrink-0 text-tinta-tenue" />
                          </button>
                        </li>
                      ))}
                    </ul>
                  </details>
                )
              })}
          </div>
        </section>
      ))}
    </>
  )
}
