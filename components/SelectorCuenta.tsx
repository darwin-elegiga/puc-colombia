'use client'

import { useMemo, useState } from 'react'
import Dialogo from './Dialogo'
import { Codigo, InsigniaNaturaleza } from './Insignias'
import { buscar, type Catalogo } from '@/lib/catalogo'
import { IconoLupa } from './Iconos'
import { nombreLegible } from '@/lib/puc'

/**
 * Hoja para elegir la cuenta de un renglón.
 *
 * Con banco de opciones se listan solo esas cuentas; sin él se busca en el
 * catálogo completo, que es lo que pide el último nivel del entrenamiento.
 */
export default function SelectorCuenta({
  abierto,
  catalogo,
  banco,
  elegida,
  onElegir,
  onCerrar,
}: {
  abierto: boolean
  catalogo: Catalogo
  /** Si falta, se busca en todo el catálogo. */
  banco?: string[]
  elegida: string | null
  onElegir: (codigo: string) => void
  onCerrar: () => void
}) {
  const [consulta, setConsulta] = useState('')

  const opciones = useMemo(() => {
    if (banco) return banco
    const texto = consulta.trim()
    if (texto.length < 2) return []
    return buscar(catalogo, { q: texto }, 24).resultados.map((r) => r.codigo)
  }, [banco, consulta, catalogo])

  return (
    <Dialogo abierto={abierto} titulo="Elige la cuenta" onCerrar={onCerrar}>
      <div className="-mx-5 -my-5">
        {!banco && (
          <div className="border-b border-borde px-5 py-3">
            <div className="relative">
              <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-tinta-tenue">
                <IconoLupa className="size-[18px]" />
              </span>
              <input
                type="search"
                value={consulta}
                onChange={(e) => setConsulta(e.target.value)}
                autoComplete="off"
                autoCorrect="off"
                autoCapitalize="none"
                spellCheck={false}
                placeholder="Código o nombre de la cuenta"
                aria-label="Buscar la cuenta en el catálogo"
                className="min-h-12 w-full rounded-xl border border-borde bg-superficie pl-10 pr-3 text-tinta outline-none placeholder:text-tinta-tenue focus:border-borde-fuerte lg:min-h-10 lg:rounded-lg"
              />
            </div>
          </div>
        )}

        {opciones.length === 0 ? (
          <p className="px-5 py-8 text-center text-[14px] leading-relaxed text-tinta-tenue">
            {consulta.trim().length >= 2
              ? 'Ninguna cuenta coincide.'
              : 'Escribe un código o parte del nombre para buscar en el catálogo.'}
          </p>
        ) : (
          <ul>
            {opciones.map((codigo) => {
              const cuenta = catalogo.indice.get(codigo)
              if (!cuenta) return null
              const activa = codigo === elegida
              return (
                <li key={codigo} className="border-b border-borde last:border-b-0">
                  <button
                    type="button"
                    onClick={() => onElegir(codigo)}
                    aria-pressed={activa}
                    className={`tactil flex w-full items-center gap-3 px-5 py-3 text-left pulsable ${
                      activa ? 'bg-hueso' : ''
                    }`}
                  >
                    <span className="min-w-0 flex-1">
                      <span className="flex items-center gap-2">
                        <Codigo valor={codigo} className="text-[15px] font-medium" />
                        <InsigniaNaturaleza
                          naturaleza={cuenta.naturaleza}
                          forzada={cuenta.naturalezaForzada}
                        />
                      </span>
                      <span className="mt-0.5 block text-[13.5px] leading-snug text-tinta-suave">
                        {nombreLegible(cuenta.nombre)}
                      </span>
                    </span>
                  </button>
                </li>
              )
            })}
          </ul>
        )}
      </div>
    </Dialogo>
  )
}
