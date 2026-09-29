'use client'

import { IconoCerrar } from './Iconos'

/**
 * La burbuja del aula activa: un botón redondo fijo abajo a la derecha (sobre la barra
 * inferior en el móvil) que recuerda que hay un aula en curso mientras se navega por el
 * catálogo. Un arco gira alrededor como un cargador y, cada pocos segundos, el punto
 * central parpadea. Con «reducir movimiento» queda quieta: solo el anillo completo.
 */
export default function BurbujaAula({
  etiqueta,
  rol,
  pendiente = false,
  onAbrir,
  onDescartar,
}: {
  /** Nombre del aula, para el lector de pantalla y la etiqueta al pasar el ratón. */
  etiqueta: string
  rol: 'docente' | 'estudiante'
  /** Hay algo nuevo que mirar (una entrega, un ejercicio o una nota). */
  pendiente?: boolean
  onAbrir: () => void
  /** Si se pasa, aparece una «×» pequeña para ocultarla. */
  onDescartar?: () => void
}) {
  const accion = rol === 'docente' ? 'Volver a tu aula' : 'Volver al aula'

  return (
    <>
      <style href="burbuja-aula" precedence="default">{`
        @keyframes burbuja-girar { to { transform: rotate(360deg); } }
        @keyframes burbuja-parpadeo {
          0%, 86%, 100% { opacity: 1; transform: scale(1); }
          90% { opacity: 0.15; transform: scale(0.7); }
          94% { opacity: 1; transform: scale(1.12); }
        }
        .burbuja-arco { animation: burbuja-girar 1.6s linear infinite; transform-origin: 50% 50%; }
        .burbuja-punto { animation: burbuja-parpadeo 5s ease-in-out infinite; }
        .burbuja-rotulo { opacity: 0; transform: translateX(4px); transition: opacity 160ms ease, transform 160ms ease; }
        .burbuja:hover .burbuja-rotulo, .burbuja:focus-visible .burbuja-rotulo { opacity: 1; transform: none; }
        @media (hover: hover) {
          .burbuja-caja .burbuja-cerrar { opacity: 0; transition: opacity 160ms ease; }
          .burbuja-caja:hover .burbuja-cerrar, .burbuja-cerrar:focus-visible { opacity: 1; }
        }
        @media (prefers-reduced-motion: reduce) {
          .burbuja-arco { animation: none; stroke-dasharray: none; }
          .burbuja-punto { animation: none; }
        }
      `}</style>
      <div className="burbuja-caja surgir fixed z-20 right-[calc(var(--seguro-der)+1rem)] bottom-[calc(var(--seguro-abajo)+5rem)] lg:right-6 lg:bottom-6">
        <button
          type="button"
          onClick={onAbrir}
          aria-label={`${accion}: ${etiqueta}${pendiente ? ' (hay novedades)' : ''}`}
          className="burbuja relative grid size-14 place-items-center rounded-full border border-borde bg-superficie shadow-[0_6px_24px_rgba(0,0,0,0.10)] transition-transform active:scale-95"
        >
          {/* El anillo: pista tenue y un arco que gira alrededor. */}
          <svg className="absolute inset-0 size-full" viewBox="0 0 56 56" aria-hidden>
            <circle cx="28" cy="28" r="26" fill="none" stroke="var(--color-borde)" strokeWidth="2" />
            <circle
              className="burbuja-arco"
              cx="28"
              cy="28"
              r="26"
              fill="none"
              stroke="var(--color-sube-tinta)"
              strokeWidth="2"
              strokeLinecap="round"
              strokeDasharray="40 124"
            />
          </svg>
  
          <span className="burbuja-punto block size-3 rounded-full" style={{ background: 'var(--color-sube-tinta)' }} aria-hidden />
  
          {pendiente && (
            <span
              className="absolute right-0.5 top-0.5 size-3 rounded-full border-2 border-superficie"
              style={{ background: 'var(--color-baja-tinta)' }}
              aria-hidden
            />
          )}

          {/* En escritorio, al pasar el ratón o con el foco del teclado. */}
          <span
            className="burbuja-rotulo pointer-events-none absolute right-full mr-3 hidden max-w-60 truncate whitespace-nowrap rounded-lg bg-tinta px-2.5 py-1.5 text-[12.5px] font-medium text-white lg:block"
            aria-hidden
          >
            {accion} · {etiqueta}
          </span>
        </button>
        {onDescartar && (
          <button
            type="button"
            onClick={onDescartar}
            aria-label="Ocultar el aviso del aula"
            // Se ve de 24 px, pero el área que se toca es de 44 px.
            className="burbuja-cerrar absolute -left-4 -top-4 grid size-11 place-items-center text-tinta-tenue transition-colors hover:text-tinta"
          >
            <span className="grid size-6 place-items-center rounded-full border border-borde bg-superficie">
              <IconoCerrar className="size-3" />
            </span>
          </button>
        )}
      </div>
    </>
  )
}
