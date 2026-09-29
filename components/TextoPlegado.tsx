'use client'

import { useLayoutEffect, useRef, useState } from 'react'
import { IconoChevron } from './Iconos'

/**
 * Un texto largo plegado por defecto. Se ven las primeras líneas, que se desvanecen
 * hacia abajo para sugerir que sigue; al tocar el texto o «Leer más», se despliega con
 * una transición de altura. Si el texto cabe en esas líneas, se muestra sin botón.
 */
export default function TextoPlegado({
  texto,
  abrir = 'Leer más',
  lineas = 3,
}: {
  texto: string
  /** Rótulo del botón que despliega el texto. */
  abrir?: string
  /** Líneas visibles mientras está plegado. */
  lineas?: number
}) {
  const [abierto, setAbierto] = useState(false)
  const [alto, setAlto] = useState<number | null>(null)
  const [hayMas, setHayMas] = useState(true)
  const contenido = useRef<HTMLDivElement>(null)
  // `leading-relaxed` es 1.625: la altura plegada se da en em para seguir al tamaño de letra.
  const plegado = `${lineas * 1.625}em`

  // Se mide el texto completo para animar hasta su altura real y saber si hace falta plegar.
  useLayoutEffect(() => {
    const el = contenido.current
    if (!el) return
    const medir = () => {
      setAlto(el.scrollHeight)
      const lineaPx = parseFloat(getComputedStyle(el).lineHeight) || 24
      setHayMas(el.scrollHeight > lineaPx * lineas + 2)
    }
    medir()
    const observador = new ResizeObserver(medir)
    observador.observe(el)
    return () => observador.disconnect()
  }, [texto, lineas])

  const cerrado = hayMas && !abierto

  return (
    <div>
      <div
        ref={contenido}
        onClick={cerrado ? () => setAbierto(true) : undefined}
        className={[
          'space-y-2.5 overflow-hidden transition-[max-height] duration-300 ease-out motion-reduce:transition-none',
          cerrado ? 'cursor-pointer' : '',
        ].join(' ')}
        style={{
          maxHeight: cerrado ? plegado : alto ?? undefined,
          // El final plegado se desvanece en lugar de cortarse con «…».
          maskImage: cerrado ? 'linear-gradient(to bottom, black 45%, transparent)' : undefined,
          WebkitMaskImage: cerrado ? 'linear-gradient(to bottom, black 45%, transparent)' : undefined,
        }}
      >
        {texto.split('\n\n').map((parrafo) => (
          <p key={parrafo}>{parrafo}</p>
        ))}
      </div>

      {hayMas && (
        <button
          type="button"
          aria-expanded={abierto}
          onClick={() => setAbierto((a) => !a)}
          className="group mt-1.5 inline-flex min-h-9 items-center gap-1.5 rounded-lg text-[13px] font-medium text-tinta-suave transition-colors hover:text-tinta"
        >
          {abierto ? 'Leer menos' : abrir}
          <IconoChevron
            className={[
              'size-3.5 transition-transform duration-300 motion-reduce:transition-none',
              abierto ? '-rotate-90' : 'rotate-90',
            ].join(' ')}
          />
        </button>
      )}
    </div>
  )
}
