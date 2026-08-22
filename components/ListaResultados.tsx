'use client'

import type { ResultadoBusqueda } from '@/lib/tipos'
import type { Movimiento } from '@/lib/movimientos'
import type { Destino } from '@/lib/navegacion'
import { InsigniaNaturaleza, InsigniaNivel, InsigniaOrigen } from './Insignias'
import { IconoIntercambio, IconoChevron } from './Iconos'

const capitalizar = (t: string) => t.charAt(0) + t.slice(1).toLowerCase()

export default function ListaResultados({
  cuentas,
  movimientos,
  seleccion,
  onSeleccionar,
  mostradas,
  onVerMas,
  encabezado,
}: {
  cuentas: ResultadoBusqueda
  movimientos: Movimiento[]
  seleccion: Destino
  onSeleccionar: (destino: NonNullable<Destino>) => void
  mostradas: number
  onVerMas: () => void
  /** Contenido que se desplaza junto a la lista, como la lectura del código. */
  encabezado?: React.ReactNode
}) {
  const vacio = cuentas.total === 0 && movimientos.length === 0

  return (
    <div
      className="panel-scroll h-full"
      style={{ paddingBottom: 'calc(var(--seguro-abajo) + 1rem)' }}
    >
      {encabezado}

      {movimientos.length > 0 && (
        <section>
          <Encabezado titulo="Movimientos" cuenta={`${movimientos.length}`} />
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
                      <span className="mt-0.5 block text-[12.5px] text-tinta-tenue">
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
                        {capitalizar(c.nombre)}
                      </span>
                    </span>

                    {c.resumen && (
                      <span className="mt-1 line-clamp-2 block text-[13px] leading-relaxed text-tinta-suave">
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

function Encabezado({ titulo, cuenta }: { titulo: string; cuenta: string }) {
  return (
    <header className="sticky top-0 z-10 flex items-baseline justify-between gap-2 border-b border-borde bg-lienzo/95 px-5 py-2.5 backdrop-blur">
      <p className="rotulo">{titulo}</p>
      <p className="text-[12px] text-tinta-tenue">{cuenta}</p>
    </header>
  )
}
