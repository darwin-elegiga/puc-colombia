'use client'

import PanelAulas from './PanelAulas'
import { IconoChevron } from './Iconos'

/**
 * La vista de las aulas, desde el menú «…»: las aulas en curso, crear una, unirse con
 * código, las públicas abiertas y el historial de este dispositivo.
 */
export default function PantallaAulas({ onAbrir, onSalir }: { onAbrir: (codigo: string) => void; onSalir: () => void }) {
  return (
    <div className="flex h-dvh flex-col overflow-hidden bg-lienzo">
      <header
        className="z-20 flex shrink-0 items-center gap-1 border-b border-borde bg-lienzo px-2 py-2"
        style={{ paddingTop: 'calc(0.5rem + var(--seguro-arriba))' }}
      >
        <button type="button" onClick={onSalir} className="tactil flex items-center gap-1 rounded-lg pl-2 pr-3 text-[15px] text-tinta pulsable">
          <IconoChevron className="size-5 rotate-180" />
          Catálogo
        </button>
        <span className="ml-auto shrink-0 pr-2 text-[13px] text-tinta-tenue">Aulas</span>
      </header>
      <div className="panel-scroll min-h-0 flex-1">
        <div className="mx-auto max-w-2xl px-5 py-6 lg:px-8 lg:py-10" style={{ paddingBottom: 'calc(var(--seguro-abajo) + 2rem)' }}>
          <p className="rotulo">En grupo</p>
          <h1 className="editorial mt-2 text-[30px] text-tinta lg:text-5xl">Aulas</h1>
          <PanelAulas onAbrir={onAbrir} />
        </div>
      </div>
    </div>
  )
}
