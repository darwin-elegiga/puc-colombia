'use client'

import { useState } from 'react'
import type { RenglonAExplicar } from '@/lib/explicacion'
import { ErrorIA, pedirExplicacion, type ExplicacionIA } from '@/lib/ia'

/**
 * Ampliar con la IA: el último elemento de la ficha, después de la explicación
 * local. Nunca se lanza solo; es un enlace discreto para no invitar a gastar
 * tokens cuando lo local ya lo explica.
 */
export default function AmpliarConIA({
  clave,
  operacion,
  renglones,
}: {
  /** El id de la operación conocida, para servirla de la caché. */
  clave?: string
  operacion: string
  renglones: RenglonAExplicar[]
}) {
  const [estado, setEstado] = useState<'inicio' | 'cargando' | 'error'>('inicio')
  const [error, setError] = useState('')
  const [respuesta, setRespuesta] = useState<ExplicacionIA | null>(null)

  const pedir = async () => {
    setEstado('cargando')
    try {
      setRespuesta(await pedirExplicacion(clave, operacion, renglones))
      setEstado('inicio')
    } catch (e) {
      setError(e instanceof ErrorIA ? e.message : 'La IA no respondió.')
      setEstado('error')
    }
  }

  if (respuesta) {
    return (
      <section className="surgir mt-8 rounded-xl border border-borde bg-superficie px-4 py-4">
        <div className="flex items-center gap-2">
          <p className="rotulo">Ampliado con IA</p>
          <span
            className="rounded-full px-1.5 py-0.5 text-[9.5px] font-semibold uppercase tracking-[0.08em]"
            style={{ background: 'var(--color-nota)', color: 'var(--color-nota-tinta)' }}
          >
            Beta
          </span>
        </div>
        <div className="mt-3 space-y-3 text-[14.5px] leading-relaxed text-tinta">
          {respuesta.parrafos.map((p) => <p key={p}>{p}</p>)}
        </div>
        {respuesta.ejemplo && (
          <div className="mt-4 rounded-lg bg-hueso px-3.5 py-3">
            <p className="rotulo mb-1 text-[10px]">Con cifras</p>
            <p className="text-[13.5px] leading-relaxed text-tinta">{respuesta.ejemplo}</p>
          </div>
        )}
        {respuesta.errores.length > 0 && (
          <div className="mt-4">
            <p className="rotulo mb-1.5 text-[10px]">Errores comunes</p>
            <ul className="space-y-1 text-[13.5px] leading-relaxed text-tinta-suave">
              {respuesta.errores.map((e) => <li key={e}>· {e}</li>)}
            </ul>
          </div>
        )}
        <p className="mt-4 text-[11.5px] text-tinta-tenue">Generado por {respuesta.modelo}. Contrástalo con la explicación de arriba.</p>
      </section>
    )
  }

  return (
    <div className="mt-8 text-center">
      <button
        type="button"
        onClick={pedir}
        disabled={estado === 'cargando'}
        className="min-h-10 text-[13px] text-tinta-suave underline underline-offset-2 disabled:opacity-60"
      >
        {estado === 'cargando' ? 'La IA está ampliando la explicación…' : '¿Quieres más detalle? Ampliar con la IA'}
      </button>
      <p className="mt-1 text-[11.5px] leading-relaxed text-tinta-tenue">
        {estado === 'error' ? error : 'Solo si lo de arriba no te basta. Se envía el asiento a Gemini (Google).'}
      </p>
    </div>
  )
}
