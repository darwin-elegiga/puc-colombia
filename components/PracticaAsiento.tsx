'use client'

import { useMemo, useState } from 'react'
import type { Catalogo } from '@/lib/catalogo'
import {
  conRenglonLibre, corregir, estaVacia, type Correccion, type EjercicioAsiento, type Fila, type LineaSolucion,
} from '@/lib/practica'
import HojaAsiento, { pesos } from './HojaAsiento'
import TextoPlegado from './TextoPlegado'
import { IconoChevron, IconoVisto } from './Iconos'

const aFilas = (solucion: LineaSolucion[]): Fila[] =>
  solucion.map((l) => ({
    codigo: l.codigo,
    debe: l.columna === 'debe' ? l.importe : null,
    haber: l.columna === 'haber' ? l.importe : null,
  }))

/**
 * Practicar el asiento completo de un ejercicio: el enunciado, la hoja, la corrección y
 * la solución. La práctica libre, sin ejercicio, está en HojaEnBlanco.
 */
export default function PracticaAsiento({
  catalogo,
  ejercicio,
  resuelto = false,
  onVolver,
  onSiguiente,
  onAnotar,
}: {
  catalogo: Catalogo
  ejercicio: EjercicioAsiento
  resuelto?: boolean
  onVolver: () => void
  onSiguiente?: (() => void) | null
  onAnotar?: (perfecto: boolean) => void
}) {
  const [filas, setFilas] = useState<Fila[]>(() => conRenglonLibre([]))
  const [correccion, setCorreccion] = useState<Correccion | null>(null)
  const [verSolucion, setVerSolucion] = useState(false)

  const escritas = filas.filter((f) => !estaVacia(f)).length
  const solucion = useMemo(() => aFilas(ejercicio.solucion), [ejercicio])

  // Al tocar la hoja después de corregir, las marcas dejan de valer.
  const cambiar = (siguientes: Fila[]) => {
    setFilas(siguientes)
    setCorreccion(null)
  }

  const comprobar = () => {
    const c = corregir(ejercicio.solucion, filas)
    setCorreccion(c)
    onAnotar?.(c.perfecto)
  }

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
        <span className="ml-auto shrink-0 pr-2 text-[13px] text-tinta-tenue">Hacer el asiento</span>
      </header>

      <div className="panel-scroll min-h-0 flex-1">
        <div className="mx-auto max-w-2xl px-3 py-6 sm:px-5 lg:px-8 lg:py-8">
          {/* ─────────── Enunciado ─────────── */}
          <div className="px-2 sm:px-0">
            <p className="rotulo">{ejercicio.grupo}</p>
            <h1 className="editorial mt-2 text-[26px] leading-tight text-tinta lg:text-4xl">
              {ejercicio.titulo}
            </h1>

            {ejercicio.origen === 'entrenamiento' && (
              <p className="mt-3 text-[15px] leading-relaxed text-pretty text-tinta-suave">{ejercicio.enunciado}</p>
            )}

            {ejercicio.origen === 'operacion' && (
              <section className="mt-4">
                <p className="rotulo mb-2">Datos</p>
                <dl className="overflow-hidden rounded-xl border border-borde bg-superficie">
                  {ejercicio.datos.map((d) => (
                    <div key={d.texto} className="flex items-baseline justify-between gap-3 border-b border-borde px-3.5 py-2.5 last:border-b-0">
                      <dt className="min-w-0 text-[13.5px] leading-snug text-tinta-suave">{d.texto}</dt>
                      <dd className={`shrink-0 text-right text-[13.5px] font-medium text-tinta ${d.importe !== undefined ? 'tabular' : ''}`}>
                        {d.importe !== undefined ? pesos(d.importe) : d.etiqueta}
                      </dd>
                    </div>
                  ))}
                </dl>
                <p className="mt-2 text-[13px] leading-relaxed text-tinta-tenue">
                  Calcula los valores que faltan y registra el asiento completo.
                </p>
              </section>
            )}

          </div>

          {/* ─────────── Hoja ─────────── */}
          <section className="mt-5">
            <HojaAsiento filas={filas} onCambiar={cambiar} catalogo={catalogo} estados={correccion?.estados} />
          </section>

          {/* ─────────── Resultado ─────────── */}
          {correccion && (
            <section
              className="mt-4 rounded-xl px-4 py-3.5"
              style={{
                background: correccion.perfecto ? 'var(--color-sube)' : 'var(--color-baja)',
                color: correccion.perfecto ? 'var(--color-sube-tinta)' : 'var(--color-baja-tinta)',
              }}
            >
              <p className="text-[15px] font-medium">
                {correccion.perfecto
                  ? '¡Asiento correcto!'
                  : `${correccion.aciertos} de ${correccion.total} renglones bien`}
              </p>
              {!correccion.perfecto && (
                <p className="mt-1 text-[13.5px] leading-relaxed">
                  {correccion.faltan.length > 0 &&
                    `Te ${correccion.faltan.length === 1 ? 'falta un renglón' : `faltan ${correccion.faltan.length} renglones`}. `}
                  Corrige lo marcado en rojo y vuelve a comprobar, o mira la solución.
                </p>
              )}
            </section>
          )}

          {!correccion && resuelto && (
            <p className="mt-4 flex items-center gap-2 px-2 text-[13px] text-tinta-tenue">
              <IconoVisto className="size-4" />
              Ya lo resolviste antes
            </p>
          )}

          {/* ─────────── Solución ─────────── */}
          {(correccion || verSolucion) && (
            <section className="mt-6">
              {!verSolucion ? (
                <button
                  type="button"
                  onClick={() => setVerSolucion(true)}
                  className="flex min-h-10 items-center gap-1.5 px-2 text-[13px] font-medium text-tinta-suave transition-colors hover:text-tinta"
                >
                  Ver la solución
                  <IconoChevron className="size-3.5 rotate-90" />
                </button>
              ) : (
                <>
                  <p className="rotulo mb-2 px-2 sm:px-0">Solución</p>
                  <HojaAsiento filas={solucion} onCambiar={() => {}} catalogo={catalogo} bloqueada />
                  {ejercicio.explicacion && (
                    <div className="mt-4 px-2 text-[14.5px] leading-relaxed text-tinta-suave sm:px-0">
                      <TextoPlegado texto={ejercicio.explicacion} />
                    </div>
                  )}
                </>
              )}
            </section>
          )}


          <div className="h-6" />
        </div>
      </div>

      {/* ─────────── Acciones ─────────── */}
      <footer
        className="z-20 shrink-0 border-t border-borde bg-lienzo px-4 pt-3"
        style={{ paddingBottom: 'calc(0.75rem + var(--seguro-abajo))' }}
      >
        <div className="mx-auto flex max-w-2xl gap-2">
          {correccion?.perfecto ? (
            <button
              type="button"
              onClick={onSiguiente ?? onVolver}
              className="tactil w-full rounded-xl bg-tinta text-[15px] text-white active:bg-[#3d4347]"
            >
              {onSiguiente ? 'Siguiente ejercicio' : 'Terminar'}
            </button>
          ) : (
            <>
              {!verSolucion && !correccion && (
                <button
                  type="button"
                  onClick={() => setVerSolucion(true)}
                  className="tactil flex-1 rounded-xl border border-borde bg-superficie text-[15px] text-tinta-suave pulsable"
                >
                  Ver solución
                </button>
              )}
              <button
                type="button"
                onClick={comprobar}
                disabled={escritas === 0}
                className="tactil flex-[2] rounded-xl bg-tinta text-[15px] text-white transition-opacity active:bg-[#3d4347] disabled:opacity-30"
              >
                {escritas === 0 ? 'Escribe el asiento' : 'Comprobar'}
              </button>
            </>
          )}
        </div>
      </footer>
    </div>
  )
}
