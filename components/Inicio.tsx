'use client'

import type { Catalogo } from '@/lib/catalogo'
import { Mosaico } from './MapaClases'
import { IconoBalanza, IconoChevron, IconoIntercambio, IconoLupa, IconoSinConexion } from './Iconos'

const EJEMPLOS = ['pagué el arriendo', 'me pagaron una factura', 'nómina', '1105']

/**
 * Portada: el buscador y las nueve clases, nada más.
 *
 * Todo lo demás —resultados, fichas, asiento, entrenamiento— está a un toque, pero
 * no se muestra hasta que se pide. Al buscar, el Explorador cambia a la vista de
 * resultados; al tocar una clase, se abre su página.
 */
export default function Inicio({
  catalogo,
  borrador,
  onEscribir,
  onBuscar,
  onClase,
  onAsiento,
  onEntrenar,
  menu,
  sinConexion,
  campo,
}: {
  catalogo: Catalogo
  borrador: string
  onEscribir: (texto: string) => void
  onBuscar: (texto: string) => void
  onClase: (codigo: string) => void
  onAsiento: () => void
  onEntrenar: () => void
  /** El menú de opciones, que en escritorio va arriba a la derecha. */
  menu: React.ReactNode
  sinConexion: boolean
  /** El campo de búsqueda, para el atajo «/» del teclado. */
  campo: React.RefObject<HTMLInputElement | null>
}) {
  return (
    <div className="panel-scroll min-h-0 flex-1">
      <div
        className="mx-auto max-w-5xl px-4 lg:px-8"
        style={{ paddingTop: 'calc(var(--seguro-arriba) + 1rem)', paddingBottom: '2rem' }}
      >
        <header className="flex items-center justify-between gap-3">
          <p className="flex items-baseline gap-2">
            <span className="editorial text-[22px] text-tinta">PUC</span>
            <span className="text-[12px] text-tinta-tenue">Colombia</span>
          </p>
          <div className="hidden items-center gap-1 lg:flex">
            <Acceso onClick={onAsiento} icono={<IconoIntercambio className="size-3.5" />}>
              Hazme el asiento <Beta />
            </Acceso>
            <Acceso onClick={onEntrenar} icono={<IconoBalanza className="size-3.5" />}>
              Entrenar
            </Acceso>
            {menu}
          </div>
        </header>

        {sinConexion && (
          <p className="mt-3 flex items-center gap-1.5 text-[12px] text-tinta-suave">
            <IconoSinConexion className="size-3.5" />
            Sin conexión: el catálogo sigue disponible
          </p>
        )}

        {/* ─────────── Buscador ─────────── */}
        <section className="mx-auto mt-8 max-w-2xl lg:mt-14">
          <h1 className="editorial text-center text-[28px] leading-tight text-tinta lg:text-[40px]">
            ¿Qué necesitas registrar?
          </h1>
          <form
            role="search"
            className="relative mt-5"
            onSubmit={(e) => {
              e.preventDefault()
              onBuscar(borrador)
            }}
          >
            <IconoLupa className="pointer-events-none absolute left-4 top-1/2 size-5 -translate-y-1/2 text-tinta-tenue" />
            <input
              ref={campo}
              type="search"
              enterKeyHint="search"
              value={borrador}
              onChange={(e) => onEscribir(e.target.value)}
              autoComplete="off"
              autoCorrect="off"
              autoCapitalize="none"
              spellCheck={false}
              placeholder="Una operación, una cuenta o un código"
              aria-label="Buscar en el catálogo"
              className="min-h-14 w-full rounded-2xl border border-borde bg-superficie pl-12 pr-4 text-tinta shadow-[0_1px_2px_rgba(0,0,0,0.03)] outline-none placeholder:text-tinta-tenue focus:border-borde-fuerte lg:text-[16px]"
            />
          </form>
          <div className="mt-3 flex flex-wrap justify-center gap-1.5">
            {EJEMPLOS.map((e) => (
              <button
                key={e}
                type="button"
                onClick={() => onBuscar(e)}
                className="min-h-9 rounded-full px-3 text-[13px] text-tinta-tenue transition-colors hover:text-tinta active:bg-hueso"
              >
                {e}
              </button>
            ))}
          </div>
        </section>

        {/* ─────────── Las nueve clases ─────────── */}
        <section className="mt-10 lg:mt-14">
          <Mosaico catalogo={catalogo} onAbrir={onClase} completo={false} />
        </section>

        {/* En el móvil estos accesos van en la barra inferior. */}
        <nav className="mt-8 hidden justify-center gap-6 text-[13px] text-tinta-suave lg:flex">
          <button type="button" onClick={onAsiento} className="inline-flex items-center gap-1 hover:text-tinta">
            Cuéntame qué pasó y te propongo el asiento <IconoChevron className="size-3.5" />
          </button>
          <button type="button" onClick={onEntrenar} className="inline-flex items-center gap-1 hover:text-tinta">
            Entrena el debe y el haber <IconoChevron className="size-3.5" />
          </button>
        </nav>
      </div>
    </div>
  )
}

function Acceso({ onClick, icono, children }: { onClick: () => void; icono: React.ReactNode; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-[13px] text-tinta-suave transition-colors hover:bg-hueso hover:text-tinta"
    >
      {icono}
      {children}
    </button>
  )
}

function Beta() {
  return (
    <span
      className="rounded-full px-1.5 py-0.5 text-[9.5px] font-semibold uppercase tracking-[0.08em]"
      style={{ background: 'var(--color-nota)', color: 'var(--color-nota-tinta)' }}
    >
      Beta
    </span>
  )
}
