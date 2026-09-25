'use client'

import type { NodoClase } from '@/lib/catalogo'
import type { Filtros, Nivel } from '@/lib/tipos'
import { IconoChevron } from './Iconos'
import { colorDe, nombreLegible } from '@/lib/puc'

const NIVELES: { valor: Nivel | ''; etiqueta: string }[] = [
  { valor: '', etiqueta: 'Todos' },
  { valor: 'clase', etiqueta: 'Clase' },
  { valor: 'grupo', etiqueta: 'Grupo' },
  { valor: 'cuenta', etiqueta: 'Cuenta' },
  { valor: 'subcuenta', etiqueta: 'Subcuenta' },
]

/**
 * Navegación por clases y filtros.
 * Se usa igual en la hoja inferior del móvil y en la columna lateral del escritorio,
 * por eso todas las filas mantienen altura táctil.
 */
export default function PanelClases({
  clases,
  filtros,
  onFiltros,
  onIr,
  expandida,
  onExpandir,
  propias,
}: {
  clases: NodoClase[]
  filtros: Filtros
  onFiltros: (cambios: Partial<Filtros>) => void
  onIr: (codigo: string) => void
  expandida: string | null
  onExpandir: (codigo: string | null) => void
  propias: number
}) {
  return (
    <div className="pb-2">
      <ul>
        {clases.map((clase) => {
          const activa = filtros.clase === clase.codigo
          const abierta = expandida === clase.codigo
          return (
            <li key={clase.codigo} className="border-b border-borde">
              <div
                className="flex items-stretch"
                style={{ boxShadow: `inset 4px 0 0 ${colorDe(clase.codigo).borde}`, background: activa ? colorDe(clase.codigo).fondo : undefined }}
              >
                <button
                  type="button"
                  onClick={() => {
                    onFiltros({ clase: activa ? '' : clase.codigo })
                    onExpandir(abierta ? null : clase.codigo)
                  }}
                  className="tactil flex min-w-0 flex-1 items-center gap-3 px-5 text-left pulsable"
                >
                  <span className="tabular text-[15px] font-medium" style={{ color: colorDe(clase.codigo).tinta }}>
                    {clase.codigo}
                  </span>
                  <span className={`truncate text-[15px] ${activa ? 'font-medium text-tinta' : 'text-tinta'}`}>
                    {nombreLegible(clase.nombre)}
                  </span>
                </button>
                <button
                  type="button"
                  aria-label={abierta ? `Contraer clase ${clase.codigo}` : `Ver grupos de la clase ${clase.codigo}`}
                  aria-expanded={abierta}
                  onClick={() => onExpandir(abierta ? null : clase.codigo)}
                  className="tactil grid w-12 shrink-0 place-items-center text-tinta-tenue pulsable"
                >
                  <IconoChevron className={`size-4 transition-transform ${abierta ? 'rotate-90' : ''}`} />
                </button>
              </div>

              {abierta && (
                <ul className="surgir-lista" style={{ background: colorDe(clase.codigo).fondo }}>
                  {clase.grupos.map((grupo, i) => (
                    <li key={grupo.codigo} style={{ '--i': i } as React.CSSProperties}>
                      <button
                        type="button"
                        onClick={() => onIr(grupo.codigo)}
                        className="tactil flex w-full items-center gap-3 py-2 pl-9 pr-4 text-left pulsable"
                      >
                        <span className="tabular text-[13px]" style={{ color: colorDe(grupo.codigo).tinta }}>{grupo.codigo}</span>
                        <span className="min-w-0 flex-1 truncate text-[14px] text-tinta-suave">
                          {nombreLegible(grupo.nombre)}
                        </span>
                        <span className="tabular text-[12px] text-tinta-tenue">{grupo.cuentas}</span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </li>
          )
        })}
      </ul>

      <div className="space-y-6 px-5 py-6">
        <div>
          <p className="rotulo mb-2.5">Nivel</p>
          <div className="flex flex-wrap gap-2">
            {NIVELES.map((n) => (
              <Chip
                key={n.valor || 'todos'}
                activo={filtros.nivel === n.valor}
                onClick={() => onFiltros({ nivel: n.valor })}
              >
                {n.etiqueta}
              </Chip>
            ))}
          </div>
        </div>

        <div>
          <p className="rotulo mb-2.5">Naturaleza</p>
          <div className="flex flex-wrap gap-2">
            <Chip activo={filtros.naturaleza === ''} onClick={() => onFiltros({ naturaleza: '' })}>
              Ambas
            </Chip>
            <Chip activo={filtros.naturaleza === 'debito'} onClick={() => onFiltros({ naturaleza: 'debito' })}>
              Débito
            </Chip>
            <Chip activo={filtros.naturaleza === 'credito'} onClick={() => onFiltros({ naturaleza: 'credito' })}>
              Crédito
            </Chip>
          </div>
        </div>

        {propias > 0 && (
          <div>
            <p className="rotulo mb-2.5">Origen</p>
            <div className="flex flex-wrap gap-2">
              <Chip activo={filtros.origen === ''} onClick={() => onFiltros({ origen: '' })}>
                Todo
              </Chip>
              <Chip activo={filtros.origen === 'oficial'} onClick={() => onFiltros({ origen: 'oficial' })}>
                Oficial
              </Chip>
              <Chip activo={filtros.origen === 'personalizada'} onClick={() => onFiltros({ origen: 'personalizada' })}>
                Mías · {propias}
              </Chip>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function Chip({
  activo,
  onClick,
  children,
}: {
  activo: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={activo}
      className={[
        'min-h-10 rounded-lg border px-3.5 text-[14px] transition-colors active:scale-[0.98] lg:min-h-8 lg:px-2.5 lg:text-[12px]',
        activo
          ? 'border-tinta bg-tinta text-white'
          : 'border-borde bg-superficie text-tinta-suave active:bg-hueso lg:hover:border-borde-fuerte lg:hover:text-tinta',
      ].join(' ')}
    >
      {children}
    </button>
  )
}
