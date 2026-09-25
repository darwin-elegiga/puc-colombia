import type { Naturaleza, Nivel, Origen } from '@/lib/tipos'
import { ETIQUETA_NIVEL, NOMBRE_CLASE, colorDe } from '@/lib/puc'
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

/** Código de cuenta en monoespaciada y en el color de su clase. */
export function Codigo({ valor, className = '' }: { valor: string; className?: string }) {
  return (
    <span className={`tabular ${className}`} style={{ color: colorDe(valor).tinta }}>
      {valor}
    </span>
  )
}

/** Pastilla con el nombre de la clase, en su color: «Activo», «Gastos»… */
export function InsigniaClase({ codigo }: { codigo: string }) {
  const color = colorDe(codigo)
  const nombre = NOMBRE_CLASE[codigo[0]]
  if (!nombre) return null
  return (
    <span className={pildora} style={{ background: color.fondo, color: color.tinta }} title={`Clase ${codigo[0]}`}>
      <span className="mr-1.5 size-1.5 rounded-full" style={{ background: color.borde }} aria-hidden />
      {nombre}
    </span>
  )
}

/** Franja izquierda del color de la clase, para filas y tarjetas. */
export const franjaClase = (codigo: string): React.CSSProperties => ({
  boxShadow: `inset 3px 0 0 ${colorDe(codigo).borde}`,
})

/** Quién paga en un movimiento: sale dinero, entra dinero o no se mueve. */
/*
  Sin tono, como el débito y el crédito: el color es de las clases. «Yo pago» va
  oscuro y «me pagan» claro, con una flecha que indica si el dinero sale o entra.
*/
export const TONO_LADO: Record<Lado, { fondo: string; tinta: string; flecha: string }> = {
  pago: { fondo: 'var(--color-credito)', tinta: 'var(--color-credito-tinta)', flecha: '↑' },
  cobro: { fondo: 'var(--color-debito)', tinta: 'var(--color-debito-tinta)', flecha: '↓' },
  interno: { fondo: 'transparent', tinta: 'var(--color-tinta-suave)', flecha: '·' },
}

export function InsigniaLado({ lado }: { lado: Lado }) {
  return (
    <span
      className={pildora}
      style={{ background: TONO_LADO[lado].fondo, color: TONO_LADO[lado].tinta }}
      title={REGLA_LADO[lado].corto}
    >
      <span className="mr-1" aria-hidden>{TONO_LADO[lado].flecha}</span>
      {REGLA_LADO[lado].titulo}
    </span>
  )
}
