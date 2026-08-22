'use client'

import { useEffect, useId, useRef, useState } from 'react'

export interface OpcionMenu {
  etiqueta: string
  descripcion?: string
  icono?: React.ReactNode
  onSeleccionar: () => void
  desactivada?: boolean
}

/**
 * Menú desplegable anclado a su botón. Se cierra al tocar fuera, con Escape o al
 * elegir una opción. En móvil se ancla al borde del botón y crece hacia arriba
 * cuando está al pie de la pantalla.
 */
export default function Menu({
  etiqueta,
  opciones,
  children,
  alineacion = 'derecha',
  direccion = 'abajo',
  className = '',
  claseBoton = '',
}: {
  etiqueta: string
  opciones: OpcionMenu[]
  children: React.ReactNode
  alineacion?: 'izquierda' | 'derecha'
  direccion?: 'arriba' | 'abajo'
  className?: string
  claseBoton?: string
}) {
  const [abierto, setAbierto] = useState(false)
  const contenedor = useRef<HTMLDivElement>(null)
  const id = useId()

  useEffect(() => {
    if (!abierto) return

    const alTocarFuera = (evento: MouseEvent | TouchEvent) => {
      if (!contenedor.current?.contains(evento.target as Node)) setAbierto(false)
    }
    const alPulsarTecla = (evento: KeyboardEvent) => {
      if (evento.key === 'Escape') setAbierto(false)
    }

    document.addEventListener('pointerdown', alTocarFuera)
    document.addEventListener('keydown', alPulsarTecla)
    return () => {
      document.removeEventListener('pointerdown', alTocarFuera)
      document.removeEventListener('keydown', alPulsarTecla)
    }
  }, [abierto])

  return (
    <div ref={contenedor} className={`relative ${className}`}>
      <button
        type="button"
        aria-haspopup="menu"
        aria-expanded={abierto}
        aria-controls={abierto ? id : undefined}
        aria-label={etiqueta}
        onClick={() => setAbierto((v) => !v)}
        className={claseBoton}
      >
        {children}
      </button>

      {abierto && (
        <div
          id={id}
          role="menu"
          className={[
            'surgir absolute z-50 min-w-56 overflow-hidden rounded-xl border border-borde bg-superficie py-1',
            alineacion === 'derecha' ? 'right-0' : 'left-0',
            direccion === 'arriba' ? 'bottom-full mb-2' : 'top-full mt-2',
          ].join(' ')}
        >
          {opciones.map((opcion) => (
            <button
              key={opcion.etiqueta}
              type="button"
              role="menuitem"
              disabled={opcion.desactivada}
              onClick={() => {
                setAbierto(false)
                opcion.onSeleccionar()
              }}
              className="tactil flex w-full items-center gap-3 px-4 text-left text-[15px] text-tinta pulsable disabled:opacity-40 lg:min-h-10 lg:text-[13.5px]"
            >
              {opcion.icono && <span className="shrink-0 text-tinta-tenue">{opcion.icono}</span>}
              <span className="min-w-0 flex-1">
                <span className="block truncate">{opcion.etiqueta}</span>
                {opcion.descripcion && (
                  <span className="block truncate text-[12px] text-tinta-tenue">{opcion.descripcion}</span>
                )}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
