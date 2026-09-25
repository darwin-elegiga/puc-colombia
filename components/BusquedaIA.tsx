'use client'

import { useState } from 'react'
import type { Cuenta } from '@/lib/tipos'
import type { Destino } from '@/lib/navegacion'
import { movimientoPorId } from '@/lib/movimientos'
import { ErrorIA, pedirSugerencias, type Sugerencia } from '@/lib/ia'
import { nombreLegible } from '@/lib/puc'
import { Codigo, InsigniaLado, franjaClase } from './Insignias'
import { IconoChevron, IconoIntercambio } from './Iconos'

/**
 * Búsqueda por significado con IA: el último recurso.
 *
 * Solo aparece cuando la búsqueda local no resuelve: destacada si no encontró
 * nada, y al pie de los resultados si solo hubo coincidencias parciales o si el
 * usuario dice que nada de lo encontrado le sirve. Nunca se lanza sola. Al pulsarlo, el servidor
 * convierte la consulta en un vector con Gemini y devuelve las 5 cuentas u
 * operaciones más parecidas de la base vectorial.
 */
export default function BusquedaIA({
  consulta,
  destacado,
  cuentaDe,
  onSeleccionar,
}: {
  consulta: string
  /** true cuando la búsqueda local no encontró nada. */
  destacado: boolean
  cuentaDe: (codigo: string) => Cuenta | undefined
  onSeleccionar: (destino: NonNullable<Destino>) => void
}) {
  const [estado, setEstado] = useState<'inicio' | 'cargando' | 'listo' | 'error'>('inicio')
  const [sugerencias, setSugerencias] = useState<Sugerencia[]>([])
  const [error, setError] = useState('')

  const consultar = async () => {
    setEstado('cargando')
    try {
      setSugerencias(await pedirSugerencias(consulta))
      setEstado('listo')
    } catch (e) {
      setError(e instanceof ErrorIA ? e.message : 'La IA no respondió.')
      setEstado('error')
    }
  }

  if (estado === 'listo') {
    return (
      <section className="border-t border-borde">
        <header className="flex items-baseline justify-between gap-2 border-b border-borde bg-lienzo px-5 py-2.5">
          <p className="rotulo">Por significado · IA</p>
          <p className="text-[12px] text-tinta-tenue">Top {sugerencias.length}</p>
        </header>
        <ul>
          {sugerencias.map((s) => {
            const cuenta = s.tipo === 'cuenta' ? cuentaDe(s.id) : undefined
            const movimiento = s.tipo === 'movimiento' ? movimientoPorId(s.id) : undefined
            if (!cuenta && !movimiento) return null
            return (
              <li key={`${s.tipo}-${s.id}`}>
                <button
                  type="button"
                  onClick={() => onSeleccionar(cuenta ? { tipo: 'cuenta', codigo: cuenta.codigo } : { tipo: 'movimiento', id: movimiento!.id })}
                  className="flex w-full items-center gap-3 border-b border-borde px-5 py-3 text-left pulsable"
                  style={cuenta ? franjaClase(cuenta.codigo) : undefined}
                >
                  {movimiento && <IconoIntercambio className="size-5 shrink-0 text-tinta-tenue" />}
                  <span className="min-w-0 flex-1">
                    <span className="flex items-baseline gap-2.5">
                      {cuenta && <Codigo valor={cuenta.codigo} className="text-[15px] font-medium" />}
                      <span className="min-w-0 flex-1 truncate text-[15px] text-tinta">
                        {cuenta ? nombreLegible(cuenta.nombre) : movimiento!.nombre}
                      </span>
                    </span>
                    <span className="mt-1 flex items-center gap-2">
                      {movimiento && <InsigniaLado lado={movimiento.lado} />}
                      <Parecido valor={s.puntaje} />
                    </span>
                  </span>
                  <IconoChevron className="size-4 shrink-0 text-tinta-tenue" />
                </button>
              </li>
            )
          })}
        </ul>
      </section>
    )
  }

  return (
    <div className={destacado ? 'px-5 pb-6' : 'border-t border-borde px-5 py-4'}>
      {!destacado && (
        <p className="mb-2 text-[13px] leading-relaxed text-tinta-suave">
          Aquí no está lo que buscas: pregúntale a la IA.
        </p>
      )}
      <button
        type="button"
        onClick={consultar}
        disabled={estado === 'cargando'}
        className={[
          'tactil flex w-full items-center justify-center gap-2 rounded-xl px-4 text-[14px] transition-colors disabled:opacity-60',
          destacado ? 'bg-tinta text-white active:bg-[#3d4347]' : 'border border-borde bg-superficie text-tinta-suave pulsable',
        ].join(' ')}
      >
        {estado === 'cargando' ? 'Buscando por significado…' : 'Buscar por significado con IA'}
      </button>
      <p className="mt-1.5 text-center text-[11.5px] text-tinta-tenue">
        {estado === 'error' ? error : 'Consulta a Gemini con tu texto. Necesita conexión.'}
      </p>
    </div>
  )
}

/** Barra corta con el parecido: la similitud coseno llevada a una escala legible. */
function Parecido({ valor }: { valor: number }) {
  const porcentaje = Math.round(Math.max(0, Math.min(1, (valor - 0.3) / 0.5)) * 100)
  return (
    <span className="flex items-center gap-1.5 text-[11px] text-tinta-tenue" title={`Similitud ${valor}`}>
      <span className="h-1 w-12 overflow-hidden rounded-full bg-hueso">
        <span className="block h-full rounded-full bg-tinta-suave" style={{ width: `${porcentaje}%` }} />
      </span>
      {porcentaje}% parecido
    </span>
  )
}
