import type { Naturaleza, Nivel, Origen } from '@/lib/tipos'
import { ETIQUETA_NIVEL } from '@/lib/puc'
import { REGLA_LADO, type Lado } from '@/data/guia'

const pildora =
  'inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-medium uppercase tracking-[0.06em] whitespace-nowrap lg:px-2 lg:py-0.5 lg:text-[10px]'

export function InsigniaNaturaleza({ naturaleza, forzada = false }: { naturaleza: Naturaleza; forzada?: boolean }) {
  const esDebito = naturaleza === 'debito'
  return (
    <span
      className={pildora}
      style={{
        background: esDebito ? 'var(--color-debito)' : 'var(--color-credito)',
        color: esDebito ? 'var(--color-debito-tinta)' : 'var(--color-credito-tinta)',
      }}
      title={
        forzada
          ? 'Naturaleza contraria a la de su clase: es una cuenta de contrapartida.'
          : `Saldo de naturaleza ${esDebito ? 'débito' : 'crédito'}`
      }
    >
      {esDebito ? 'Débito' : 'Crédito'}
      {forzada ? ' ·' : ''}
    </span>
  )
}

export function InsigniaNivel({ nivel }: { nivel: Nivel }) {
  return (
    <span className={`${pildora} bg-hueso text-tinta-suave`}>{ETIQUETA_NIVEL[nivel]}</span>
  )
}

export function InsigniaOrigen({ origen }: { origen: Origen }) {
  if (origen !== 'personalizada') return null
  return (
    <span
      className={pildora}
      style={{ background: 'var(--color-propia)', color: 'var(--color-propia-tinta)' }}
      title="Cuenta creada por ti, guardada en este dispositivo"
    >
      Mía
    </span>
  )
}

/** Código de cuenta en monoespaciada, con los dígitos alineados. */
export function Codigo({ valor, className = '' }: { valor: string; className?: string }) {
  return <span className={`tabular ${className}`}>{valor}</span>
}

/** Quién paga en un movimiento: sale dinero, entra dinero o no se mueve. */
export const TONO_LADO: Record<Lado, { fondo: string; tinta: string }> = {
  pago: { fondo: 'var(--color-credito)', tinta: 'var(--color-credito-tinta)' },
  cobro: { fondo: 'var(--color-propia)', tinta: 'var(--color-propia-tinta)' },
  interno: { fondo: 'var(--color-hueso)', tinta: 'var(--color-tinta-suave)' },
}

export function InsigniaLado({ lado }: { lado: Lado }) {
  return (
    <span
      className={pildora}
      style={{ background: TONO_LADO[lado].fondo, color: TONO_LADO[lado].tinta }}
      title={REGLA_LADO[lado].corto}
    >
      {REGLA_LADO[lado].titulo}
    </span>
  )
}
