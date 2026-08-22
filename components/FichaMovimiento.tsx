'use client'

import type { Movimiento, Renglon } from '@/data/movimientos'
import type { Cuenta } from '@/lib/tipos'
import { nombreLegible } from '@/lib/puc'

/**
 * Detalle de una operación típica: qué cuentas se debitan y cuáles se acreditan.
 * Es la respuesta a "¿qué cuenta uso cuando…?".
 */
export default function FichaMovimiento({
  movimiento,
  nombreDe,
  onIr,
}: {
  movimiento: Movimiento
  nombreDe: (codigo: string) => Cuenta | undefined
  onIr: (codigo: string) => void
}) {
  const debitos = movimiento.asiento.filter((r) => r.efecto === 'debito')
  const creditos = movimiento.asiento.filter((r) => r.efecto === 'credito')

  return (
    <article className="surgir panel-scroll h-full overflow-y-auto">
      <div className="mx-auto max-w-2xl px-5 py-6 lg:px-8 lg:py-8">
        <p className="rotulo">{movimiento.categoria}</p>
        <h2 className="editorial mt-2 text-[30px] text-tinta lg:text-4xl">{movimiento.nombre}</h2>
        <p className="mt-3 text-[15px] leading-relaxed text-tinta-suave">{movimiento.descripcion}</p>

        <section className="mt-7">
          <p className="rotulo mb-2">El asiento</p>
          <div className="space-y-3">
            <Columna titulo="Débito" renglones={debitos} nombreDe={nombreDe} onIr={onIr} tono="debito" />
            <Columna titulo="Crédito" renglones={creditos} nombreDe={nombreDe} onIr={onIr} tono="credito" />
          </div>
        </section>

        {movimiento.nota && (
          <p
            className="mt-5 rounded-lg px-3.5 py-3 text-[14px] leading-relaxed"
            style={{ background: 'var(--color-nota)', color: 'var(--color-nota-tinta)' }}
          >
            {movimiento.nota}
          </p>
        )}

        <section className="mt-7 border-t border-borde pt-4" style={{ paddingBottom: 'var(--seguro-abajo)' }}>
          <p className="rotulo mb-2">También se busca como</p>
          <div className="flex flex-wrap gap-1.5">
            {movimiento.palabras.map((palabra) => (
              <span key={palabra} className="min-h-9 rounded-lg border border-borde bg-superficie px-3 py-1.5 text-[13px] text-tinta-suave">
                {palabra}
              </span>
            ))}
          </div>
        </section>
      </div>
    </article>
  )
}

function Columna({
  titulo,
  renglones,
  nombreDe,
  onIr,
  tono,
}: {
  titulo: string
  renglones: Renglon[]
  nombreDe: (codigo: string) => Cuenta | undefined
  onIr: (codigo: string) => void
  tono: 'debito' | 'credito'
}) {
  if (renglones.length === 0) return null
  return (
    <div className="overflow-hidden rounded-xl border border-borde bg-superficie">
      <div className="flex items-center justify-between border-b border-borde px-4 py-2">
        <span
          className="inline-flex rounded-full px-2 py-0.5 text-[10px] font-medium uppercase tracking-[0.06em]"
          style={{
            background: tono === 'debito' ? 'var(--color-debito)' : 'var(--color-credito)',
            color: tono === 'debito' ? 'var(--color-debito-tinta)' : 'var(--color-credito-tinta)',
          }}
        >
          {titulo}
        </span>
        <span className="text-[10px] uppercase tracking-[0.06em] text-tinta-tenue">
          {renglones.length} {renglones.length === 1 ? 'renglón' : 'renglones'}
        </span>
      </div>
      <ul>
        {renglones.map((renglon, i) => {
          const cuenta = nombreDe(renglon.codigo)
          return (
            <li key={`${renglon.codigo}-${i}`} className="border-b border-borde last:border-b-0">
              <button
                type="button"
                onClick={() => onIr(renglon.codigo)}
                className="flex w-full flex-col gap-0.5 px-4 py-3 text-left pulsable"
              >
                <span className="flex items-baseline gap-3">
                  <span className="tabular text-[15px] text-tinta">{renglon.codigo}</span>
                  <span className="min-w-0 flex-1 truncate text-[15px] text-tinta">
                    {cuenta ? nombreLegible(cuenta.nombre) : 'Cuenta no encontrada'}
                  </span>
                </span>
                <span className="text-[13px] leading-relaxed text-tinta-suave">{renglon.concepto}</span>
              </button>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
