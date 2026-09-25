'use client'

import type { Explicacion, EfectoBloque, PasoExplicado } from '@/lib/explicacion'
import { colorDe } from '@/lib/puc'
import { Codigo } from './Insignias'

/**
 * «Por qué se hace así»: la ecuación contable, las cuentas T y el porqué de cada
 * renglón. Todo sale de explicarAsiento (local, sin IA).
 *
 * El color es siempre el de la clase de la cuenta, como en el resto de la
 * aplicación; el debe y el haber se distinguen por posición y luminosidad.
 */
export default function ExplicacionAsiento({
  explicacion,
  onIr,
}: {
  explicacion: Explicacion
  onIr: (codigo: string) => void
}) {
  const { pasos, ecuacion, resumen, totales } = explicacion
  if (pasos.length === 0) return null

  // Una T por cuenta: si una cuenta aparece en varios renglones, se agrupan en su T.
  const cuentas = [...new Map(pasos.map((p) => [p.codigo, p])).values()].map((p) => ({
    paso: p,
    renglones: pasos.filter((r) => r.codigo === p.codigo),
  }))

  return (
    <section className="mt-9">
      <p className="rotulo">Por qué se hace así</p>
      <h3 className="editorial mt-1 text-[24px] leading-tight text-tinta lg:text-[28px]">Lo que pasa en las cuentas</h3>

      <Ecuacion ecuacion={ecuacion} />

      <div className="mt-6 grid gap-3 sm:grid-cols-2">
        {cuentas.map(({ paso, renglones }) => (
          <CuentaT key={paso.codigo} paso={paso} renglones={renglones} onIr={onIr} />
        ))}
      </div>

      {totales && totales.debito > 0 && <Balanza pasos={pasos} totales={totales} />}

      <ol className="mt-7 space-y-5">
        {pasos.map((p, i) => (
          <li key={`${p.codigo}-${i}`} className="grid grid-cols-[1.75rem_1fr] gap-x-3">
            <span
              className="tabular flex size-7 items-center justify-center rounded-full text-[12px] font-medium"
              style={{ background: colorDe(p.codigo).fondo, color: colorDe(p.codigo).tinta, boxShadow: `inset 0 0 0 1px ${colorDe(p.codigo).borde}33` }}
            >
              {i + 1}
            </span>
            <div className="min-w-0">
              <p className="text-[14.5px] leading-relaxed text-tinta">{p.porQue}</p>
              {p.oficial && (
                <blockquote className="mt-2 border-l-2 pl-3 text-[13px] leading-relaxed text-tinta-suave" style={{ borderColor: colorDe(p.codigo).borde }}>
                  <span className="rotulo mb-0.5 block text-[10px]">
                    Decreto 2650 · {p.efecto === 'debito' ? 'se debita' : 'se acredita'}
                    {p.oficial.heredadaDe ? ` · dinámica de la ${p.oficial.heredadaDe}` : ''}
                  </span>
                  «{p.oficial.texto}»
                </blockquote>
              )}
            </div>
          </li>
        ))}
      </ol>

      <p className="mt-6 rounded-xl bg-hueso px-4 py-3.5 text-[14px] leading-relaxed text-tinta">{resumen}</p>
    </section>
  )
}

/* ─────────────────────── Ecuación contable ─────────────────────── */

const FLECHA: Record<Exclude<EfectoBloque, null>, { signo: string; texto: string }> = {
  sube: { signo: '▲', texto: 'sube' },
  baja: { signo: '▼', texto: 'baja' },
  cambia: { signo: '⇄', texto: 'cambia' },
}

/**
 * Activo = Pasivo + Patrimonio, y debajo el resultado que alimenta el patrimonio.
 * Los bloques que el asiento toca se encienden en el color de su clase.
 */
function Ecuacion({ ecuacion }: { ecuacion: Record<string, EfectoBloque> }) {
  const resultado = ['4', '5', '6', '7'].filter((c) => c === '4' || c === '5' || ecuacion[c])
  return (
    <div className="mt-4 rounded-xl border border-borde bg-superficie px-3 py-4 sm:px-4">
      <div className="grid grid-cols-[1fr_auto_1fr_auto_1fr] items-center gap-1.5">
        <Bloque clase="1" nombre="Activo" efecto={ecuacion['1']} />
        <Operador>=</Operador>
        <Bloque clase="2" nombre="Pasivo" efecto={ecuacion['2']} />
        <Operador>+</Operador>
        <Bloque clase="3" nombre="Patrimonio" efecto={ecuacion['3']} />
      </div>
      <div className="mt-3 flex items-center gap-2">
        <span className="h-px flex-1 bg-borde" />
        <span className="text-[10.5px] uppercase tracking-[0.06em] text-tinta-tenue">el resultado va al patrimonio</span>
        <span className="h-px flex-1 bg-borde" />
      </div>
      <div
        className="mt-3 grid items-center gap-1.5"
        style={{ gridTemplateColumns: resultado.map(() => '1fr').join(' auto ') }}
      >
        {resultado.map((clase, i) => (
          <Fragmento key={clase} primero={i === 0}>
            <Bloque clase={clase} nombre={NOMBRE_BLOQUE[clase]} efecto={ecuacion[clase]} pequeno />
          </Fragmento>
        ))}
      </div>
    </div>
  )
}

const NOMBRE_BLOQUE: Record<string, string> = { '4': 'Ingresos', '5': 'Gastos', '6': 'Costos', '7': 'Producción' }

function Fragmento({ primero, children }: { primero: boolean; children: React.ReactNode }) {
  return (
    <>
      {!primero && <Operador>−</Operador>}
      {children}
    </>
  )
}

function Operador({ children }: { children: React.ReactNode }) {
  return <span className="text-center text-[15px] text-tinta-tenue" aria-hidden>{children}</span>
}

function Bloque({ clase, nombre, efecto, pequeno = false }: { clase: string; nombre: string; efecto: EfectoBloque; pequeno?: boolean }) {
  const color = colorDe(clase)
  const activo = Boolean(efecto)
  return (
    <div
      className="min-w-0 rounded-lg px-2 text-center transition-colors"
      style={{
        paddingBlock: pequeno ? '0.45rem' : '0.7rem',
        background: activo ? color.fondo : 'var(--color-hueso)',
        boxShadow: activo ? `inset 0 0 0 1.5px ${color.borde}` : 'inset 0 0 0 1px var(--color-borde)',
      }}
    >
      <span
        className="block truncate font-medium"
        style={{ fontSize: pequeno ? 11.5 : 12.5, color: activo ? color.tinta : 'var(--color-tinta-tenue)' }}
      >
        {nombre}
      </span>
      <span
        className="mt-0.5 block text-[11px] leading-none"
        style={{ color: activo ? color.tinta : 'var(--color-borde-fuerte)' }}
        aria-label={efecto ? `${nombre} ${FLECHA[efecto].texto}` : `${nombre} no cambia`}
      >
        {efecto ? `${FLECHA[efecto].signo} ${FLECHA[efecto].texto}` : '—'}
      </span>
    </div>
  )
}

/* ─────────────────────── Cuenta T ─────────────────────── */

const pesos = (n: number) => `$ ${n.toLocaleString('es-CO')}`

/**
 * La T clásica: el debe a la izquierda y el haber a la derecha. El lado por el
 * que sube el saldo lleva un tinte suave de la clase y el signo «+», así se ve de
 * un vistazo si el renglón hace crecer la cuenta o la hace bajar.
 */
function CuentaT({ paso, renglones, onIr }: { paso: PasoExplicado; renglones: PasoExplicado[]; onIr: (codigo: string) => void }) {
  const color = colorDe(paso.codigo)
  const lados = (['debito', 'credito'] as const).map((efecto) => ({
    efecto,
    aumenta: paso.naturaleza === efecto,
    renglones: renglones.filter((r) => r.efecto === efecto),
  }))

  return (
    <div className="overflow-hidden rounded-xl border border-borde bg-superficie">
      <button type="button" onClick={() => onIr(paso.codigo)} className="flex w-full items-baseline gap-2 px-4 pb-2.5 pt-3 text-left pulsable">
        <Codigo valor={paso.codigo} className="text-[14px] font-medium" />
        <span className="min-w-0 flex-1 truncate text-[14px] text-tinta">{paso.nombre}</span>
        <span className="shrink-0 text-[10.5px] uppercase tracking-[0.06em]" style={{ color: color.tinta }}>
          {paso.nombreClase}
        </span>
      </button>

      {/* El travesaño de la T, en el color de la clase. */}
      <div className="mx-4 h-[2px] rounded-full" style={{ background: color.borde }} />

      <div className="grid grid-cols-2">
        {lados.map((lado, i) => (
          <div
            key={lado.efecto}
            className="min-h-[5.5rem] px-3 pb-3 pt-2"
            style={{
              background: lado.aumenta ? `${color.fondo}` : undefined,
              borderLeft: i === 1 ? `2px solid ${color.borde}` : undefined,
            }}
          >
            <div className="flex items-center justify-between text-[10.5px] uppercase tracking-[0.06em]">
              <span className="text-tinta-tenue">{lado.efecto === 'debito' ? 'Debe' : 'Haber'}</span>
              <span className="tabular font-medium" style={{ color: lado.aumenta ? color.tinta : 'var(--color-tinta-tenue)' }} title={lado.aumenta ? 'Por este lado sube el saldo' : 'Por este lado baja el saldo'}>
                {lado.aumenta ? '+' : '−'}
              </span>
            </div>
            <div className="mt-2 space-y-1.5">
              {lado.renglones.map((r, j) => (
                <div
                  key={j}
                  className="rounded-md bg-superficie px-2 py-1.5 text-[12px] leading-snug text-tinta"
                  style={{ boxShadow: `inset 0 0 0 1px ${color.borde}55, inset 3px 0 0 ${color.borde}` }}
                >
                  {typeof r.importe === 'number' && <span className="tabular block font-medium">{pesos(r.importe)}</span>}
                  <span className="line-clamp-2 text-tinta-suave">{r.concepto}</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      <p className="flex items-center gap-1.5 border-t border-borde px-4 py-2 text-[12px]" style={{ color: color.tinta }}>
        <span aria-hidden>{paso.saldo === 'sube' ? '▲' : '▼'}</span>
        El saldo {paso.saldo}
        {paso.correctora && <span className="text-tinta-tenue">· cuenta correctora</span>}
      </p>
    </div>
  )
}

/* ─────────────────────── Balanza ─────────────────────── */

/** Dos barras del mismo largo cuando el asiento cuadra: el debe y el haber, por clase. */
function Balanza({ pasos, totales }: { pasos: PasoExplicado[]; totales: { debito: number; credito: number } }) {
  const maximo = Math.max(totales.debito, totales.credito)
  const cuadra = totales.debito === totales.credito
  return (
    <div className="mt-5 rounded-xl border border-borde bg-superficie px-4 py-4">
      <div className="flex items-baseline justify-between">
        <p className="rotulo">La balanza</p>
        <span className="text-[12px] font-medium" style={{ color: cuadra ? 'var(--color-propia-tinta)' : 'var(--color-error-tinta)' }}>
          {cuadra ? '✓ Cuadra' : 'No cuadra'}
        </span>
      </div>
      {(['debito', 'credito'] as const).map((efecto) => {
        const lado = pasos.filter((p) => p.efecto === efecto)
        const total = efecto === 'debito' ? totales.debito : totales.credito
        return (
          <div key={efecto} className="mt-3">
            <div className="mb-1 flex justify-between text-[11.5px]">
              <span className="uppercase tracking-[0.06em] text-tinta-tenue">{efecto === 'debito' ? 'Debe' : 'Haber'}</span>
              <span className="tabular font-medium text-tinta">{pesos(total)}</span>
            </div>
            <div className="flex h-3 overflow-hidden rounded-full bg-hueso" style={{ width: `${(total / maximo) * 100}%` }}>
              {lado.map((p, i) => (
                <span
                  key={i}
                  title={`${p.codigo} ${p.nombre}: ${pesos(p.importe ?? 0)}`}
                  style={{
                    width: `${((p.importe ?? 0) / (total || 1)) * 100}%`,
                    background: colorDe(p.codigo).borde,
                    boxShadow: i > 0 ? 'inset 1.5px 0 0 var(--color-superficie)' : undefined,
                  }}
                />
              ))}
            </div>
          </div>
        )
      })}
    </div>
  )
}
