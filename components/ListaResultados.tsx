'use client'

import { useState } from 'react'
import type { ResultadoBusqueda } from '@/lib/tipos'
import type { Movimiento } from '@/lib/movimientos'
import type { Destino } from '@/lib/navegacion'
import type { Lado } from '@/data/guia'
import { Codigo, InsigniaClase, InsigniaLado, InsigniaNaturaleza, InsigniaNivel, InsigniaOrigen, franjaClase } from './Insignias'
import { IconoIntercambio, IconoChevron } from './Iconos'
import BusquedaIA from './BusquedaIA'
import type { Cuenta } from '@/lib/tipos'
import { nombreLegible } from '@/lib/puc'

export default function ListaResultados({
  cuentas,
  movimientos,
  hayMovimientos,
  consulta,
  localResuelve,
  cuentaDe,
  lado,
  onLado,
  seleccion,
  onSeleccionar,
  mostradas,
  onVerMas,
  encabezado,
}: {
  cuentas: ResultadoBusqueda
  movimientos: Movimiento[]
  /** Lo que se buscó: si es texto, se ofrece la búsqueda por significado con IA. */
  consulta: string
  /** true si lo local encontró coincidencias completas: entonces no se ofrece la IA. */
  localResuelve: boolean
  cuentaDe: (codigo: string) => Cuenta | undefined
  /** Hay operaciones para la búsqueda aunque el filtro de lado las esconda todas. */
  hayMovimientos: boolean
  lado: Lado | ''
  onLado: (lado: Lado | '') => void
  seleccion: Destino
  onSeleccionar: (destino: NonNullable<Destino>) => void
  mostradas: number
  onVerMas: () => void
  /** Contenido que se desplaza junto a la lista, como la lectura del código. */
  encabezado?: React.ReactNode
}) {
  const vacio = cuentas.total === 0 && !hayMovimientos
  // La IA se ofrece para texto libre, no para códigos: un código ya se lee dígito a dígito.
  const conIA = consulta.trim().length >= 3 && !/^\d+$/.test(consulta.trim())

  return (
    <div
      className="panel-scroll h-full"
      style={{ paddingBottom: 'calc(var(--seguro-abajo) + 1rem)' }}
    >
      {encabezado}

      {hayMovimientos && (
        <section>
          <Encabezado titulo="Movimientos" cuenta={`${movimientos.length}`} />
          {/* Una misma palabra —«pago», «arriendo»— sirve a los dos lados: aquí se elige cuál. */}
          <div className="flex gap-2 overflow-x-auto border-b border-borde px-5 py-2.5" role="group" aria-label="Quién paga">
            {LADOS.map((l) => (
              <button
                key={l.valor || 'todos'}
                type="button"
                aria-pressed={lado === l.valor}
                onClick={() => onLado(l.valor)}
                className={[
                  'min-h-9 shrink-0 rounded-lg border px-3 text-[13px] transition-colors',
                  lado === l.valor
                    ? 'border-tinta bg-tinta text-white'
                    : 'border-borde bg-superficie text-tinta-suave active:bg-hueso lg:hover:border-borde-fuerte',
                ].join(' ')}
              >
                {l.etiqueta}
              </button>
            ))}
          </div>
          {movimientos.length === 0 && (
            <p className="border-b border-borde px-5 py-4 text-[13px] text-tinta-tenue">Ninguna operación de este lado.</p>
          )}
          <ul className="surgir-lista">
            {movimientos.map((m, i) => {
              const activo = seleccion?.tipo === 'movimiento' && seleccion.id === m.id
              return (
                <li key={m.id} style={{ '--i': i } as React.CSSProperties}>
                  <button
                    type="button"
                    onClick={() => onSeleccionar({ tipo: 'movimiento', id: m.id })}
                    className={[
                      'flex w-full items-center gap-3 border-b border-borde px-5 py-3.5 text-left pulsable',
                      activo ? 'bg-superficie' : '',
                    ].join(' ')}
                  >
                    <IconoIntercambio className="size-5 shrink-0 text-tinta-tenue" />
                    <span className="min-w-0 flex-1">
                      <span className="block text-[15px] leading-snug text-tinta">{m.nombre}</span>
                      <span className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-[12.5px] text-tinta-tenue">
                        <InsigniaLado lado={m.lado} />
                        {m.categoria} · {m.asiento.length} renglones
                      </span>
                    </span>
                    <IconoChevron className="size-4 shrink-0 text-tinta-tenue lg:hidden" />
                  </button>
                </li>
              )
            })}
          </ul>
        </section>
      )}

      <section>
        <Encabezado
          titulo="Cuentas"
          cuenta={
            cuentas.total > cuentas.resultados.length
              ? `${cuentas.resultados.length} de ${cuentas.total.toLocaleString('es-CO')}`
              : cuentas.total.toLocaleString('es-CO')
          }
        />

        <ul className="surgir-lista">
          {cuentas.resultados.map((c, i) => {
            const activo = seleccion?.tipo === 'cuenta' && seleccion.codigo === c.codigo
            return (
              <li key={c.codigo} style={{ '--i': i } as React.CSSProperties}>
                <button
                  type="button"
                  onClick={() => onSeleccionar({ tipo: 'cuenta', codigo: c.codigo })}
                  className={[
                    'flex w-full items-start gap-3 border-b border-borde px-5 py-3.5 text-left pulsable',
                    activo ? 'bg-superficie' : '',
                  ].join(' ')}
                  style={franjaClase(c.codigo)}
                >
                  <span className="min-w-0 flex-1">
                    <span className="flex items-baseline gap-2.5">
                      <Codigo valor={c.codigo} className="text-[15px] font-medium" />
                      <span className="min-w-0 flex-1 truncate text-[15px] text-tinta">
                        {nombreLegible(c.nombre)}
                      </span>
                    </span>

                    {/* Sin `block`: pisaba el display:-webkit-box de line-clamp y el resumen no se recortaba a dos líneas. */}
                    {c.resumen && (
                      <span className="mt-1 line-clamp-2 text-[13px] leading-relaxed text-tinta-suave">
                        {c.resumen}
                      </span>
                    )}

                    <span className="mt-2 flex flex-wrap items-center gap-1.5">
                      <InsigniaClase codigo={c.codigo} />
                      <InsigniaNivel nivel={c.nivel} />
                      <InsigniaNaturaleza naturaleza={c.naturaleza} />
                      <InsigniaOrigen origen={c.origen} />
                      {c.hijos > 0 && (
                        <span className="text-[11px] uppercase tracking-[0.06em] text-tinta-tenue">
                          {c.hijos} {c.hijos === 1 ? 'subnivel' : 'subniveles'}
                        </span>
                      )}
                    </span>
                  </span>

                  <IconoChevron className="mt-1 size-4 shrink-0 text-tinta-tenue lg:hidden" />
                </button>
              </li>
            )
          })}
        </ul>

        {cuentas.total > mostradas && (
          <div className="px-5 py-4">
            <button
              type="button"
              onClick={onVerMas}
              className="min-h-12 w-full rounded-lg border border-borde bg-superficie text-[14px] text-tinta-suave pulsable"
            >
              Ver más — quedan {(cuentas.total - mostradas).toLocaleString('es-CO')}
            </button>
          </div>
        )}

        {vacio && (
          <div className="px-6 pb-6 pt-14 text-center">
            <p className="text-[15px] text-tinta-suave">Ningún resultado en el catálogo.</p>
            <p className="mt-1.5 text-[13px] leading-relaxed text-tinta-tenue">
              Prueba con un código, un nombre de cuenta o una operación como
              <br />
              &laquo;pagué el arriendo&raquo;.
            </p>
          </div>
        )}
        {vacio && conIA && (
          <BusquedaIA key={consulta} consulta={consulta} destacado cuentaDe={cuentaDe} onSeleccionar={onSeleccionar} />
        )}
        {!vacio && conIA && (
          <IAConfirmada
            key={consulta}
            // Si lo local resolvió, la IA espera a que el usuario diga que nada le sirve.
            pedirConfirmacion={localResuelve}
          >
            <BusquedaIA consulta={consulta} destacado={false} cuentaDe={cuentaDe} onSeleccionar={onSeleccionar} />
          </IAConfirmada>
        )}
      </section>
    </div>
  )
}

/** Muestra la opción de IA directamente o tras el enlace «Nada de esto es lo que busco». */
function IAConfirmada({ pedirConfirmacion, children }: { pedirConfirmacion: boolean; children: React.ReactNode }) {
  const [confirmado, setConfirmado] = useState(!pedirConfirmacion)
  if (confirmado) return <>{children}</>
  return (
    <div className="border-t border-borde px-5 py-4 text-center">
      <button
        type="button"
        onClick={() => setConfirmado(true)}
        className="min-h-10 text-[13px] text-tinta-tenue underline underline-offset-2"
      >
        Nada de esto es lo que busco
      </button>
    </div>
  )
}

const LADOS: { valor: Lado | ''; etiqueta: string }[] = [
  { valor: '', etiqueta: 'Todos' },
  { valor: 'pago', etiqueta: 'Yo pago' },
  { valor: 'cobro', etiqueta: 'Me pagan' },
  { valor: 'interno', etiqueta: 'Sin pago' },
]

function Encabezado({ titulo, cuenta }: { titulo: string; cuenta: string }) {
  return (
    <header className="sticky top-0 z-10 flex items-baseline justify-between gap-2 border-b border-borde bg-lienzo/95 px-5 py-2.5 backdrop-blur">
      <p className="rotulo">{titulo}</p>
      <p className="text-[12px] text-tinta-tenue">{cuenta}</p>
    </header>
  )
}
