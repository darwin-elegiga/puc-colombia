'use client'

import type { ResultadoBusqueda } from '@/lib/tipos'
import type { Movimiento } from '@/lib/movimientos'
import type { Destino } from '@/lib/navegacion'
import type { Lado } from '@/data/guia'
import { InsigniaLado, InsigniaNaturaleza, InsigniaNivel, InsigniaOrigen } from './Insignias'
import { IconoIntercambio, IconoChevron } from './Iconos'
import { nombreLegible } from '@/lib/puc'

export default function ListaResultados({
  cuentas,
  movimientos,
  hayMovimientos,
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
                >
                  <span className="min-w-0 flex-1">
                    <span className="flex items-baseline gap-2.5">
                      <span className={`tabular text-[15px] ${activo ? 'text-tinta' : 'text-tinta-suave'}`}>
                        {c.codigo}
                      </span>
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
          <div className="px-6 py-16 text-center">
            <p className="text-[15px] text-tinta-suave">Ningún resultado.</p>
            <p className="mt-1.5 text-[13px] leading-relaxed text-tinta-tenue">
              Prueba con un código, un nombre de cuenta o una operación como
              <br />
              &laquo;pagué el arriendo&raquo;.
            </p>
          </div>
        )}
      </section>
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
