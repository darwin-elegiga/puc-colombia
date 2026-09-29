'use client'

import type { MiAula } from '@/lib/misAulas'
import { IconoAula, IconoChevron } from './Iconos'

/**
 * Lo que se ve al intentar abrir la IA, los movimientos o el entrenamiento mientras el
 * dispositivo resuelve un aula como estudiante: el catálogo sigue disponible.
 */
export default function NoDisponibleEnAula({
  aula,
  onVolverAlAula,
  onCatalogo,
}: {
  aula: MiAula
  onVolverAlAula: () => void
  onCatalogo: () => void
}) {
  return (
    <div className="flex h-dvh flex-col overflow-hidden bg-lienzo">
      <header
        className="z-20 flex shrink-0 items-center gap-1 border-b border-borde bg-lienzo px-2 py-2"
        style={{ paddingTop: 'calc(0.5rem + var(--seguro-arriba))' }}
      >
        <button type="button" onClick={onCatalogo} className="tactil flex items-center gap-1 rounded-lg pl-2 pr-3 text-[15px] text-tinta pulsable">
          <IconoChevron className="size-5 rotate-180" />
          Catálogo
        </button>
      </header>
      <div className="grid flex-1 place-items-center px-6">
        <div className="max-w-sm text-center">
          <span className="mx-auto grid size-12 place-items-center rounded-full bg-hueso text-tinta-suave">
            <IconoAula className="size-6" />
          </span>
          <p className="mt-4 text-[18px] text-tinta">No disponible durante el aula</p>
          <p className="mt-2 text-[14px] leading-relaxed text-tinta-suave">
            Mientras estás en el quiz «{aula.nombreAula}», la IA, los movimientos y el entrenamiento se apagan para que resuelvas
            por tu cuenta. El catálogo de cuentas sigue abierto para consultar códigos.
          </p>
          <div className="mt-6 grid gap-2">
            <button type="button" onClick={onVolverAlAula} className="tactil rounded-xl bg-tinta text-[15px] text-white active:bg-[#3d4347]">
              Volver al aula
            </button>
            <button type="button" onClick={onCatalogo} className="tactil rounded-xl border border-borde bg-superficie text-[15px] text-tinta-suave pulsable">
              Seguir en el catálogo
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
