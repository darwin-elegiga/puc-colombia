'use client'

import type { Segmento } from '@/lib/tipos'
import { IconoChevron } from './Iconos'

/**
 * Desglose de un código dígito a dígito: qué clase, grupo, cuenta y subcuenta
 * lo componen. Es la respuesta a "¿qué significa 110505?".
 */
export default function LecturaCodigo({
  codigo,
  segmentos,
  longitudValida = true,
  onIr,
  compacta = false,
}: {
  codigo: string
  segmentos: Segmento[]
  longitudValida?: boolean
  onIr?: (codigo: string) => void
  compacta?: boolean
}) {
  if (!codigo) return null

  return (
    <div className={compacta ? '' : 'rounded-xl border border-borde bg-superficie p-4'}>
      {!compacta && (
        <div className="mb-2 flex items-baseline justify-between gap-3">
          <p className="rotulo">Lectura del código</p>
          <p className="text-[12px] text-tinta-tenue">
            {longitudValida ? `${codigo.length} ${codigo.length === 1 ? 'dígito' : 'dígitos'}` : 'Longitud no válida'}
          </p>
        </div>
      )}

      <ol className="surgir-lista">
        {segmentos.map((segmento, i) => {
          const clicable = segmento.existe && Boolean(onIr)
          const prefijo = segmento.codigo.slice(0, segmento.codigo.length - segmento.digitos.length)

          const contenido = (
            <>
              {/* El tramo nuevo del código se resalta sobre lo que ya venía heredado. */}
              <span className="tabular w-[4.75rem] shrink-0 text-[15px] leading-none">
                <span className="text-tinta-tenue">{prefijo}</span>
                <span className="font-medium text-tinta">{segmento.digitos}</span>
              </span>

              <span className="min-w-0 flex-1">
                <span className="rotulo block leading-none">{segmento.etiqueta}</span>
                <span className="mt-1 block truncate text-[14.5px] leading-snug">
                  {segmento.nombre ? (
                    <span className="text-tinta">{segmento.nombre}</span>
                  ) : segmento.incompleto ? (
                    <span className="text-tinta-suave">Sobran dígitos: el PUC usa 1, 2, 4 o 6</span>
                  ) : segmento.libre ? (
                    <span className="text-tinta-suave">Lo define cada empresa</span>
                  ) : (
                    <span className="text-tinta-suave">Sin registrar</span>
                  )}
                </span>
              </span>

              {clicable && <IconoChevron className="size-4 shrink-0 text-tinta-tenue" />}
            </>
          )

          const clases = [
            'tactil flex w-full items-center gap-3.5 border-b border-borde py-2 text-left last:border-b-0',
            segmento.incompleto ? 'opacity-75' : '',
          ].join(' ')

          return (
            <li key={`${segmento.codigo}-${i}`} style={{ '--i': i } as React.CSSProperties}>
              {clicable ? (
                <button type="button" onClick={() => onIr!(segmento.codigo)} className={`${clases} pulsable`}>
                  {contenido}
                </button>
              ) : (
                <div className={clases}>{contenido}</div>
              )}
            </li>
          )
        })}
      </ol>
    </div>
  )
}
