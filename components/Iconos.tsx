/** Iconografía propia: trazo grueso y uniforme, sin librerías externas. */

type Props = { className?: string }

const base = 'shrink-0'

export function IconoLupa({ className = 'size-4' }: Props) {
  return (
    <svg viewBox="0 0 20 20" fill="none" aria-hidden className={`${base} ${className}`}>
      <circle cx="8.75" cy="8.75" r="5.25" stroke="currentColor" strokeWidth="1.8" />
      <path d="m12.75 12.75 3.75 3.75" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  )
}

export function IconoMas({ className = 'size-4' }: Props) {
  return (
    <svg viewBox="0 0 20 20" fill="none" aria-hidden className={`${base} ${className}`}>
      <path d="M10 4.5v11M4.5 10h11" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  )
}

export function IconoCerrar({ className = 'size-4' }: Props) {
  return (
    <svg viewBox="0 0 20 20" fill="none" aria-hidden className={`${base} ${className}`}>
      <path d="m5.5 5.5 9 9m0-9-9 9" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  )
}

export function IconoFlecha({ className = 'size-4' }: Props) {
  return (
    <svg viewBox="0 0 20 20" fill="none" aria-hidden className={`${base} ${className}`}>
      <path d="M4 10h12m-4.5-4.5L16 10l-4.5 4.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

export function IconoChevron({ className = 'size-4' }: Props) {
  return (
    <svg viewBox="0 0 20 20" fill="none" aria-hidden className={`${base} ${className}`}>
      <path d="m7.5 4.5 5.5 5.5-5.5 5.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

export function IconoCapas({ className = 'size-4' }: Props) {
  return (
    <svg viewBox="0 0 20 20" fill="none" aria-hidden className={`${base} ${className}`}>
      <path d="M10 2.5 17 6l-7 3.5L3 6l7-3.5Z" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" />
      <path d="m3 10 7 3.5L17 10M3 14l7 3.5L17 14" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

export function IconoIntercambio({ className = 'size-4' }: Props) {
  return (
    <svg viewBox="0 0 20 20" fill="none" aria-hidden className={`${base} ${className}`}>
      <path d="M3.5 7h10.5m-3-3 3 3-3 3" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M16.5 13H6m3 3-3-3 3-3" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

export function IconoDescarga({ className = 'size-4' }: Props) {
  return (
    <svg viewBox="0 0 20 20" fill="none" aria-hidden className={`${base} ${className}`}>
      <path d="M10 3v9m0 0 3.5-3.5M10 12 6.5 8.5" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M3.5 14.5v1a1.5 1.5 0 0 0 1.5 1.5h10a1.5 1.5 0 0 0 1.5-1.5v-1" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
    </svg>
  )
}

export function IconoPapelera({ className = 'size-4' }: Props) {
  return (
    <svg viewBox="0 0 20 20" fill="none" aria-hidden className={`${base} ${className}`}>
      <path d="M3.5 5.5h13M8 5.5V4a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v1.5" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
      <path d="M5.5 5.5 6 16a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1l.5-10.5" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

export function IconoSinConexion({ className = 'size-4' }: Props) {
  return (
    <svg viewBox="0 0 20 20" fill="none" aria-hidden className={`${base} ${className}`}>
      <path d="M3 7.5a11 11 0 0 1 14 0M5.5 10.5a7 7 0 0 1 9 0M8 13.5a3 3 0 0 1 4 0" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      <path d="m3.5 3.5 13 13" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  )
}

export function IconoPuntos({ className = 'size-4' }: Props) {
  return (
    <svg viewBox="0 0 20 20" fill="currentColor" aria-hidden className={`${base} ${className}`}>
      <circle cx="4.5" cy="10" r="1.6" />
      <circle cx="10" cy="10" r="1.6" />
      <circle cx="15.5" cy="10" r="1.6" />
    </svg>
  )
}

export function IconoSubida({ className = 'size-4' }: Props) {
  return (
    <svg viewBox="0 0 20 20" fill="none" aria-hidden className={`${base} ${className}`}>
      <path d="M10 17V8m0 0 3.5 3.5M10 8 6.5 11.5" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M3.5 5.5v-1A1.5 1.5 0 0 1 5 3h10a1.5 1.5 0 0 1 1.5 1.5v1" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
    </svg>
  )
}

export function IconoInstalar({ className = 'size-4' }: Props) {
  return (
    <svg viewBox="0 0 20 20" fill="none" aria-hidden className={`${base} ${className}`}>
      <rect x="5.5" y="2.5" width="9" height="15" rx="2" stroke="currentColor" strokeWidth="1.7" />
      <path d="M8.75 15h2.5" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
    </svg>
  )
}

export function IconoInfo({ className = 'size-4' }: Props) {
  return (
    <svg viewBox="0 0 20 20" fill="none" aria-hidden className={`${base} ${className}`}>
      <circle cx="10" cy="10" r="7.25" stroke="currentColor" strokeWidth="1.7" />
      <path d="M10 9v4.5" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
      <circle cx="10" cy="6.4" r="1" fill="currentColor" />
    </svg>
  )
}

export function IconoFiltro({ className = 'size-4' }: Props) {
  return (
    <svg viewBox="0 0 20 20" fill="none" aria-hidden className={`${base} ${className}`}>
      <path d="M3 5.5h14M5.5 10h9M8.5 14.5h3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  )
}

export function IconoVisto({ className = 'size-4' }: Props) {
  return (
    <svg viewBox="0 0 20 20" fill="none" aria-hidden className={`${base} ${className}`}>
      <path d="m4.5 10.5 3.5 3.5 7.5-8" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

export function IconoBalanza({ className = 'size-4' }: Props) {
  return (
    <svg viewBox="0 0 20 20" fill="none" aria-hidden className={`${base} ${className}`}>
      <path d="M10 3v14M5.5 17h9" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
      <path d="M3 5.5h14" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
      <path d="M6 5.5 3.5 11h5L6 5.5ZM14 5.5 11.5 11h5L14 5.5Z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
    </svg>
  )
}

export function IconoReiniciar({ className = 'size-4' }: Props) {
  return (
    <svg viewBox="0 0 20 20" fill="none" aria-hidden className={`${base} ${className}`}>
      <path d="M16.5 10a6.5 6.5 0 1 1-1.9-4.6" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
      <path d="M16.5 3v3.5H13" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}
