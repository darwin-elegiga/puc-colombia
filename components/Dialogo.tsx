'use client'

import { useEffect, useRef } from 'react'
import { IconoCerrar } from './Iconos'

/**
 * Envoltura del elemento <dialog> nativo.
 * En el móvil sube desde el borde inferior, donde llega el pulgar; en pantallas
 * grandes se convierte en una tarjeta centrada.
 */
export default function Dialogo({
  abierto,
  titulo,
  onCerrar,
  children,
  pie,
}: {
  abierto: boolean
  titulo: string
  onCerrar: () => void
  children: React.ReactNode
  pie?: React.ReactNode
}) {
  const ref = useRef<HTMLDialogElement>(null)

  useEffect(() => {
    const dialogo = ref.current
    if (!dialogo) return
    if (abierto && !dialogo.open) dialogo.showModal()
    if (!abierto && dialogo.open) dialogo.close()
  }, [abierto])

  return (
    <dialog
      ref={ref}
      onCancel={(e) => {
        e.preventDefault()
        onCerrar()
      }}
      onClick={(e) => {
        // Solo cierra al tocar el fondo, nunca el contenido.
        if (e.target === ref.current) onCerrar()
      }}
      className="
        m-auto mb-0 max-h-[88dvh] w-full max-w-none rounded-t-2xl border border-borde bg-superficie p-0 text-tinta
        lg:mb-auto lg:w-[min(34rem,calc(100vw-2rem))] lg:rounded-xl
      "
    >
      <div className="subir flex max-h-[88dvh] flex-col lg:animate-none">
        {/* Asa visual: indica que la hoja se puede cerrar. */}
        <div className="flex justify-center pt-2.5 lg:hidden">
          <span className="h-1 w-9 rounded-full bg-borde-fuerte" aria-hidden />
        </div>

        <div className="flex shrink-0 items-center justify-between gap-3 border-b border-borde px-5 py-3.5">
          <h2 className="text-[16px] font-medium text-tinta">{titulo}</h2>
          <button
            type="button"
            onClick={onCerrar}
            aria-label="Cerrar"
            className="tactil -mr-2 grid w-12 place-items-center rounded-lg text-tinta-suave pulsable"
          >
            <IconoCerrar className="size-5" />
          </button>
        </div>

        <div
          className="panel-scroll min-h-0 flex-1 px-5 py-5"
          style={pie ? undefined : { paddingBottom: 'calc(1.25rem + var(--seguro-abajo))' }}
        >
          {children}
        </div>

        {pie && (
          <div
            className="flex shrink-0 justify-end gap-2 border-t border-borde px-5 py-3.5"
            style={{ paddingBottom: 'calc(0.875rem + var(--seguro-abajo))' }}
          >
            {pie}
          </div>
        )}
      </div>
    </dialog>
  )
}

/* Botones: alto táctil en móvil, más compactos cuando hay ratón. */
export const botonBase =
  'inline-flex items-center justify-center gap-1.5 rounded-lg px-4 text-[15px] min-h-12 transition-colors active:scale-[0.99] disabled:opacity-40 disabled:active:scale-100 lg:min-h-9 lg:px-3 lg:text-[13px]'
export const botonSecundario = `${botonBase} border border-borde bg-superficie text-tinta-suave active:bg-hueso lg:hover:border-borde-fuerte lg:hover:text-tinta`
export const botonPrimario = `${botonBase} bg-tinta text-white active:bg-[#3d4347] lg:hover:bg-[#3d4347]`
