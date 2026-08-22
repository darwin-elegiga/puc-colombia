'use client'

import { useMemo, useState } from 'react'
import type { Catalogo } from '@/lib/catalogo'
import { EJERCICIOS, ejercicioPorId, porNivel, posicionDe, siguienteDe } from '@/lib/ejercicios'
import { useProgreso } from '@/lib/progreso'
import Ejercicio from './Ejercicio'
import Dialogo, { botonPrimario, botonSecundario } from './Dialogo'
import { IconoChevron, IconoReiniciar, IconoVisto } from './Iconos'

/**
 * Modo entrenamiento: el listado de ejercicios y el ejercicio abierto.
 *
 * Ocupa la pantalla completa —también en escritorio— porque no es una consulta
 * del catálogo sino una tarea con principio y final, y las tres columnas del
 * explorador solo distraerían.
 */
export default function Entrenador({
  catalogo,
  ejercicioId,
  onAbrir,
  onVolverALista,
  onSalir,
}: {
  catalogo: Catalogo
  /** null cuando se está en el listado. */
  ejercicioId: string | null
  onAbrir: (id: string) => void
  onVolverALista: () => void
  onSalir: () => void
}) {
  const { progreso, anotar, reiniciar } = useProgreso()
  const [confirmarBorrado, setConfirmarBorrado] = useState(false)

  const niveles = useMemo(() => porNivel(), [])
  const resueltos = EJERCICIOS.filter((e) => progreso[e.id]?.resuelto).length
  const pendiente = EJERCICIOS.find((e) => !progreso[e.id]?.resuelto)

  const abierto = ejercicioId ? ejercicioPorId(ejercicioId) : undefined

  if (abierto) {
    const siguiente = siguienteDe(abierto.id)
    return (
      <Ejercicio
        key={abierto.id}
        ejercicio={abierto}
        posicion={posicionDe(abierto.id) + 1}
        total={EJERCICIOS.length}
        catalogo={catalogo}
        resuelto={Boolean(progreso[abierto.id]?.resuelto)}
        onVolver={onVolverALista}
        onSiguiente={siguiente ? () => onAbrir(siguiente.id) : null}
        onAnotar={(perfecto) => anotar(abierto.id, perfecto)}
      />
    )
  }

  return (
    <div className="flex h-dvh flex-col overflow-hidden bg-lienzo">
      <header
        className="z-20 flex shrink-0 items-center gap-1 border-b border-borde bg-lienzo px-2 py-2"
        style={{ paddingTop: 'calc(0.5rem + var(--seguro-arriba))' }}
      >
        <button
          type="button"
          onClick={onSalir}
          className="tactil flex items-center gap-1 rounded-lg pl-2 pr-3 text-[15px] text-tinta pulsable"
        >
          <IconoChevron className="size-5 rotate-180" />
          Catálogo
        </button>
        <span className="ml-auto shrink-0 pr-2 text-[13px] text-tinta-tenue">Entrenamiento</span>
      </header>

      <div className="panel-scroll min-h-0 flex-1">
        <div className="mx-auto max-w-2xl px-5 py-6 lg:px-8 lg:py-10">
          <p className="rotulo">Ejercicios</p>
          <h1 className="editorial mt-2 text-[30px] text-tinta lg:text-5xl">El debe y el haber</h1>
          <p className="mt-3 text-[15px] leading-relaxed text-pretty text-tinta-suave">
            Cada ejercicio plantea una operación y te entrega sus renglones sueltos. Tú decides en qué
            columna va cada uno. A partir del tercer nivel eliges también con qué cuenta del PUC se registra.
          </p>

          {/* ─────────── Progreso ─────────── */}
          <section className="mt-6 rounded-xl border border-borde bg-superficie px-4 py-4">
            <div className="flex items-baseline justify-between gap-3">
              <p className="text-[14px] text-tinta">
                <span className="tabular">{resueltos}</span> de{' '}
                <span className="tabular">{EJERCICIOS.length}</span> resueltos
              </p>
              <p className="tabular shrink-0 text-[13px] text-tinta-tenue">
                {Math.round((resueltos / EJERCICIOS.length) * 100)}%
              </p>
            </div>
            <div className="mt-2.5 h-1 overflow-hidden rounded-full bg-borde">
              <div
                className="h-full rounded-full bg-tinta transition-[width] duration-500"
                style={{ width: `${(resueltos / EJERCICIOS.length) * 100}%` }}
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

          {/* ─────────── Niveles ─────────── */}
          {niveles.map((nivel) => (
            <section key={nivel.numero} className="mt-8">
              <div className="flex items-baseline justify-between gap-3">
                <p className="rotulo">Nivel {nivel.numero}</p>
                <p className="tabular shrink-0 text-[12px] text-tinta-tenue">
                  {nivel.ejercicios.filter((e) => progreso[e.id]?.resuelto).length}/
                  {nivel.ejercicios.length}
                </p>
              </div>
              <h2 className="mt-1 text-[17px] font-medium text-tinta">{nivel.titulo}</h2>
              <p className="mt-1 text-[13.5px] leading-relaxed text-pretty text-tinta-suave">
                {nivel.resumen}
              </p>

              <ul className="mt-3 overflow-hidden rounded-xl border border-borde bg-superficie">
                {nivel.ejercicios.map((ejercicio) => {
                  const marca = progreso[ejercicio.id]
                  return (
                    <li key={ejercicio.id} className="border-b border-borde last:border-b-0">
                      <button
                        type="button"
                        onClick={() => onAbrir(ejercicio.id)}
                        className="tactil flex w-full items-center gap-3 px-4 py-3 text-left pulsable"
                      >
                        <span className="tabular w-6 shrink-0 text-[13px] text-tinta-tenue">
                          {posicionDe(ejercicio.id) + 1}
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-[15px] text-tinta">{ejercicio.titulo}</span>
                          <span className="block truncate text-[12.5px] text-tinta-tenue">
                            {ejercicio.renglones.length} renglones
                            {ejercicio.pide === 'cuenta'
                              ? ejercicio.banco
                                ? ' · con cuenta'
                                : ' · cuenta libre'
                              : ''}
                          </span>
                        </span>
                        {marca?.resuelto ? (
                          <span
                            aria-label="Resuelto"
                            className="grid size-6 shrink-0 place-items-center rounded-full"
                            style={{ background: 'var(--color-propia)', color: 'var(--color-propia-tinta)' }}
                          >
                            <IconoVisto className="size-3.5" />
                          </span>
                        ) : marca ? (
                          <span
                            aria-label="Intentado"
                            className="size-1.5 shrink-0 rounded-full bg-borde-fuerte"
                          />
                        ) : null}
                        <IconoChevron className="size-4 shrink-0 text-tinta-tenue" />
                      </button>
                    </li>
                  )
                })}
              </ul>
            </section>
          ))}

          {resueltos > 0 && (
            <button
              type="button"
              onClick={() => setConfirmarBorrado(true)}
              className="tactil mt-8 flex w-full items-center justify-center gap-2 rounded-xl border border-borde bg-superficie text-[14px] text-tinta-suave pulsable"
            >
              <IconoReiniciar className="size-4" />
              Empezar de cero
            </button>
          )}

          <div className="h-6" style={{ paddingBottom: 'var(--seguro-abajo)' }} />
        </div>
      </div>

      <Dialogo
        abierto={confirmarBorrado}
        titulo="Empezar de cero"
        onCerrar={() => setConfirmarBorrado(false)}
        pie={
          <>
            <button
              type="button"
              className={botonSecundario}
              onClick={() => setConfirmarBorrado(false)}
            >
              Cancelar
            </button>
            <button
              type="button"
              className={botonPrimario}
              onClick={() => {
                reiniciar()
                setConfirmarBorrado(false)
              }}
            >
              Borrar el progreso
            </button>
          </>
        }
      >
        <p className="text-[15px] leading-relaxed text-tinta">
          Se borrará la marca de los {resueltos} ejercicios resueltos. Los ejercicios siguen ahí: solo
          se pierde el registro de cuáles ya hiciste.
        </p>
      </Dialogo>
    </div>
  )
}
