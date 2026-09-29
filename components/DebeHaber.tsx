'use client'

import { useState } from 'react'
import { colorDe } from '@/lib/puc'
import { IconoChevron } from './Iconos'
import type { Naturaleza } from '@/lib/tipos'

export type Efecto = 'sube' | 'baja'

/** La columna por la que aumenta el saldo es la de su naturaleza; la otra lo disminuye. */
export const efectoEn = (naturaleza: Naturaleza, columna: Naturaleza): Efecto =>
  naturaleza === columna ? 'sube' : 'baja'

const TONO: Record<Efecto, { fondo: string; tinta: string; signo: string; texto: string }> = {
  sube: { fondo: 'var(--color-sube)', tinta: 'var(--color-sube-tinta)', signo: '+', texto: 'Aumenta' },
  baja: { fondo: 'var(--color-baja)', tinta: 'var(--color-baja-tinta)', signo: '−', texto: 'Disminuye' },
}

/** «+ Aumenta» en verde o «− Disminuye» en rojo. */
export function InsigniaEfecto({ efecto }: { efecto: Efecto }) {
  const t = TONO[efecto]
  return (
    <span
      className="inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[12px] font-medium"
      style={{ background: t.fondo, color: t.tinta }}
    >
      <span className="tabular" aria-hidden>{t.signo}</span>
      {t.texto}
    </span>
  )
}

const COLUMNAS = [
  { columna: 'debito' as const, titulo: 'Debe', subtitulo: 'débito · izquierda', verbo: 'Se debita' },
  { columna: 'credito' as const, titulo: 'Haber', subtitulo: 'crédito · derecha', verbo: 'Se acredita' },
]

/** Flecha de los botones que despliegan: abajo cerrado, arriba abierto. */
const Chevron = ({ abierto }: { abierto: boolean }) => (
  <IconoChevron
    className={['size-3.5 transition-transform duration-300 motion-reduce:transition-none', abierto ? '-rotate-90' : 'rotate-90'].join(' ')}
  />
)

/** Los casos sin los rótulos «§ …», que solo parten la dinámica oficial en tramos. */
const soloCasos = (casos: string[]) => casos.filter((c) => !c.startsWith('§ '))

/**
 * La «T» breve, como la de los movimientos: debe y haber lado a lado también en el
 * móvil, el travesaño en el color de la clase, el lado por el que sube con su tinte,
 * y cada caso en una tarjeta de dos líneas. Se lee de un vistazo.
 */
function TBreve({ codigo, naturaleza, debita, acredita }: { codigo: string; naturaleza: Naturaleza; debita: string[]; acredita: string[] }) {
  const color = colorDe(codigo)
  return (
    <div className="pt-3">
      <div className="mx-4 h-[2px] rounded-full" style={{ background: color.borde }} />
      <div className="grid grid-cols-2">
        {COLUMNAS.map(({ columna, titulo }, i) => {
          const efecto = efectoEn(naturaleza, columna)
          const t = TONO[efecto]
          const casos = soloCasos(columna === 'debito' ? debita : acredita)
          return (
            <div
              key={columna}
              className="min-w-0 px-3 pb-3 pt-2"
              style={{
                background: efecto === 'sube' ? color.fondo : undefined,
                borderLeft: i === 1 ? `2px solid ${color.borde}` : undefined,
              }}
            >
              <div className="flex items-center justify-between gap-1 text-[10.5px] uppercase tracking-[0.06em]">
                <span className="text-tinta-tenue">{titulo}</span>
                <span className="font-medium normal-case tracking-normal" style={{ color: t.tinta }}>
                  <span className="tabular" aria-hidden>{t.signo}</span> {t.texto}
                </span>
              </div>
              <div className="mt-2 space-y-1.5">
                {casos.map((caso, k) => (
                  <div
                    key={`${k}-${caso}`}
                    className="rounded-md bg-superficie px-2 py-1.5 text-[12px] leading-snug text-tinta-suave"
                    style={{ boxShadow: `inset 0 0 0 1px ${color.borde}55, inset 3px 0 0 ${t.tinta}` }}
                  >
                    <span className="line-clamp-2">{caso}</span>
                  </div>
                ))}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

/** La «T» mínima: solo el signo por el que sube (+) y por el que baja (−) el saldo. */
function TSimple({ codigo, naturaleza }: { codigo: string; naturaleza: Naturaleza }) {
  const color = colorDe(codigo)
  return (
    <div className="pt-3">
      <div className="mx-4 h-[2px] rounded-full" style={{ background: color.borde }} />
      <div className="grid grid-cols-2">
        {COLUMNAS.map(({ columna, titulo }, i) => {
          const efecto = efectoEn(naturaleza, columna)
          const t = TONO[efecto]
          return (
            <div
              key={columna}
              className="flex flex-col items-center px-3 pb-3 pt-2"
              style={{
                background: efecto === 'sube' ? color.fondo : undefined,
                borderLeft: i === 1 ? `2px solid ${color.borde}` : undefined,
              }}
            >
              <span className="text-[10.5px] uppercase tracking-[0.06em] text-tinta-tenue">{titulo}</span>
              <span className="tabular text-[34px] font-medium leading-none" style={{ color: t.tinta }} aria-hidden>
                {t.signo}
              </span>
              <span className="mt-1 text-[12px] font-medium" style={{ color: t.tinta }}>{t.texto}</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

/**
 * Debe y haber de una cuenta, de lo simple a lo detallado: primero la «T» mínima con su
 * + y su −; con «Ver más», la «T» breve con los casos y el porqué; y a petición, cada
 * caso completo con su signo en verde o en rojo.
 */
export function TablaDebeHaber({
  codigo,
  naturaleza,
  debita,
  acredita,
  pie,
}: {
  /** Para el color de la clase. */
  codigo: string
  naturaleza: Naturaleza
  /** Casos que se anotan en el debe. Los que empiezan por «§ » son rótulos de tramo. */
  debita: string[]
  acredita: string[]
  /** Nota bajo la tabla, como el porqué de la columna. */
  pie?: React.ReactNode
}) {
  const [abierta, setAbierta] = useState(false)
  const [completo, setCompleto] = useState(false)
  return (
    <div className="overflow-hidden rounded-xl border border-borde bg-superficie">
      <TSimple codigo={codigo} naturaleza={naturaleza} />
      <button
        type="button"
        aria-expanded={abierta}
        onClick={() => setAbierta((a) => !a)}
        className="flex min-h-10 w-full items-center justify-center gap-1.5 border-t border-borde text-[13px] font-medium text-tinta-suave transition-colors pulsable hover:text-tinta"
      >
        {abierta ? 'Ver menos' : 'Ver más'}
        <Chevron abierto={abierta} />
      </button>
      {abierta && (
        <div className="border-t border-borde">
          <TBreve codigo={codigo} naturaleza={naturaleza} debita={debita} acredita={acredita} />
          <button
            type="button"
            aria-expanded={completo}
            onClick={() => setCompleto((c) => !c)}
            className="flex min-h-10 w-full items-center justify-center gap-1.5 border-t border-borde text-[13px] font-medium text-tinta-suave transition-colors pulsable hover:text-tinta"
          >
            {completo ? 'Ocultar el detalle' : 'Ver cada caso completo'}
            <Chevron abierto={completo} />
          </button>
          {completo && (
            <div className="grid border-t border-borde sm:grid-cols-2">
              {COLUMNAS.map(({ columna, titulo, subtitulo, verbo }, i) => {
                const efecto = efectoEn(naturaleza, columna)
                const t = TONO[efecto]
                const casos = columna === 'debito' ? debita : acredita
                return (
                  <div key={columna} className={['p-4', i === 1 ? 'border-t border-borde sm:border-l sm:border-t-0' : ''].join(' ')}>
                    <div className="flex items-center justify-between gap-2 border-b-2 border-tinta pb-2">
                      <p>
                        <span className="text-[16px] font-medium text-tinta">{titulo}</span>
                        <span className="ml-2 text-[12px] text-tinta-tenue">{subtitulo}</span>
                      </p>
                      <InsigniaEfecto efecto={efecto} />
                    </div>
                    <p className="mt-3 text-[13px] text-tinta-suave">
                      {verbo} —{efecto === 'sube' ? 'sube' : 'baja'} el saldo— cuando:
                    </p>
                    <ul className="mt-1.5 space-y-1.5 text-[14px] leading-relaxed text-tinta">
                      {casos.map((caso, k) =>
                        // Los rótulos «§ …» separan tramos de la dinámica oficial, como «Registro de pagos».
                        caso.startsWith('§ ') ? (
                          <li key={`${k}-${caso}`} className="pt-2 text-[11px] font-medium uppercase tracking-[0.06em] text-tinta-tenue">
                            {caso.slice(2)}
                          </li>
                        ) : (
                          <li key={`${k}-${caso}`} className="flex gap-2">
                            <span className="tabular shrink-0 font-medium" style={{ color: t.tinta }} aria-hidden>{t.signo}</span>
                            <span>{caso}</span>
                          </li>
                        ),
                      )}
                    </ul>
                  </div>
                )
              })}
            </div>
          )}
          {pie && <div className="border-t border-borde bg-hueso px-4 py-3.5">{pie}</div>}
        </div>
      )}
    </div>
  )
}
