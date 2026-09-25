'use client'

import type { Movimiento, Renglon } from '@/data/movimientos'
import type { Cuenta } from '@/lib/tipos'
import { nombreLegible } from '@/lib/puc'
import { movimientoPorId } from '@/lib/movimientos'
import { REGLA_LADO } from '@/data/guia'
import { Codigo, InsigniaLado, franjaClase } from './Insignias'
import { IconoChevron, IconoIntercambio } from './Iconos'

/**
 * Detalle de una operación típica: qué cuentas se debitan y cuáles se acreditan.
 * Es la respuesta a "¿qué cuenta uso cuando…?".
 */
export default function FichaMovimiento({
  movimiento,
  nombreDe,
  onIr,
  onVerMovimiento,
}: {
  movimiento: Movimiento
  nombreDe: (codigo: string) => Cuenta | undefined
  onIr: (codigo: string) => void
  onVerMovimiento: (id: string) => void
}) {
  const regla = REGLA_LADO[movimiento.lado]
  const espejo = movimiento.espejo ? movimientoPorId(movimiento.espejo) : undefined
  const debitos = movimiento.asiento.filter((r) => r.efecto === 'debito')
  const creditos = movimiento.asiento.filter((r) => r.efecto === 'credito')

  return (
    <article className="surgir panel-scroll h-full overflow-y-auto">
      <div className="mx-auto max-w-2xl px-5 py-6 lg:px-8 lg:py-8">
        <div className="flex flex-wrap items-center gap-2">
          <InsigniaLado lado={movimiento.lado} />
          <p className="rotulo">{movimiento.categoria}</p>
        </div>
        <h2 className="editorial mt-2 text-[30px] text-tinta lg:text-4xl">{movimiento.nombre}</h2>
        <p className="mt-3 text-[15px] leading-relaxed text-tinta-suave">{movimiento.descripcion}</p>

        {/* La regla de este lado: qué clase va al débito y cuál al crédito. */}
        <section
          className="mt-6 rounded-xl border-l-4 bg-superficie px-4 py-3.5"
          style={{ borderColor: movimiento.lado === 'cobro' ? 'var(--color-borde-fuerte)' : 'var(--color-credito)' }}
        >
          <p className="text-[14px] font-medium text-tinta">
            {regla.titulo} · {regla.corto.toLowerCase()}
          </p>
          <p className="mt-1 text-[14px] leading-relaxed text-tinta-suave">{regla.regla}</p>
          <dl className="mt-3 grid gap-2 text-[13.5px] leading-relaxed sm:grid-cols-[5.5rem_1fr]">
            <dt className="font-medium" style={{ color: 'var(--color-tinta)' }}>Al débito</dt>
            <dd className="text-tinta">{regla.debito}</dd>
            <dt className="font-medium" style={{ color: 'var(--color-tinta)' }}>Al crédito</dt>
            <dd className="text-tinta">{regla.credito}</dd>
          </dl>
        </section>

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

        {espejo && (
          <section className="mt-7">
            <p className="rotulo mb-2">¿Y si es al revés?</p>
            <button
              type="button"
              onClick={() => onVerMovimiento(espejo.id)}
              className="tactil flex w-full items-center gap-3 rounded-xl border border-borde bg-superficie px-4 py-3 text-left pulsable lg:hover:border-borde-fuerte"
            >
              <IconoIntercambio className="size-5 shrink-0 text-tinta-tenue" />
              <span className="min-w-0 flex-1">
                <span className="block text-[15px] leading-snug text-tinta">{espejo.nombre}</span>
                <span className="mt-1 block">
                  <InsigniaLado lado={espejo.lado} />
                </span>
              </span>
              <IconoChevron className="size-4 shrink-0 text-tinta-tenue" />
            </button>
          </section>
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
            <li key={`${renglon.codigo}-${i}`} className="border-b border-borde last:border-b-0" style={franjaClase(renglon.codigo)}>
              <button
                type="button"
                onClick={() => onIr(renglon.codigo)}
                className="flex w-full flex-col gap-0.5 px-4 py-3 text-left pulsable"
              >
                <span className="flex items-baseline gap-3">
                  <Codigo valor={renglon.codigo} className="text-[15px] font-medium" />
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
