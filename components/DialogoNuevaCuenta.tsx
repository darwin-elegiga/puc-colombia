'use client'

import { useMemo, useState } from 'react'
import type { BorradorCuenta, Naturaleza, Segmento } from '@/lib/tipos'
import { ETIQUETA_NIVEL, NATURALEZA_POR_CLASE, codigoPadre, nivelDe, validarBorrador } from '@/lib/puc'
import Dialogo, { botonPrimario, botonSecundario } from './Dialogo'
import LecturaCodigo from './LecturaCodigo'
import { Codigo } from './Insignias'

export default function DialogoNuevaCuenta({
  abierto,
  codigoInicial,
  existe,
  segmentosDe,
  onCerrar,
  onGuardar,
}: {
  abierto: boolean
  codigoInicial: string
  existe: (codigo: string) => boolean
  segmentosDe: (codigo: string) => Segmento[]
  onCerrar: () => void
  onGuardar: (borrador: BorradorCuenta) => void
}) {
  // El formulario se reinicia porque Explorador remonta el diálogo al abrirlo (prop key).
  const [codigo, setCodigo] = useState(codigoInicial)
  const [nombre, setNombre] = useState('')
  const [descripcion, setDescripcion] = useState('')
  const [naturaleza, setNaturaleza] = useState<Naturaleza | ''>('')
  const [tocado, setTocado] = useState(false)

  const validacion = useMemo(
    () => validarBorrador({ codigo, nombre, descripcion, naturaleza }, existe),
    [codigo, nombre, descripcion, naturaleza, existe],
  )

  const nivel = nivelDe(codigo)
  const padre = codigo ? codigoPadre(codigo) : null
  const naturalezaSugerida = codigo ? NATURALEZA_POR_CLASE[codigo[0]] : undefined
  const mostrarError = tocado && !validacion.ok

  return (
    <Dialogo
      abierto={abierto}
      titulo="Nueva cuenta"
      onCerrar={onCerrar}
      pie={
        <>
          <button type="button" className={botonSecundario} onClick={onCerrar}>
            Cancelar
          </button>
          <button
            type="button"
            className={botonPrimario}
            onClick={() => {
              setTocado(true)
              if (validacion.ok) onGuardar({ codigo, nombre, descripcion, naturaleza })
            }}
          >
            Crear cuenta
          </button>
        </>
      }
    >
      <div className="space-y-5">
        <Campo etiqueta="Código">
          <input
            value={codigo}
            onChange={(e) => setCodigo(e.target.value.replace(/\D/g, '').slice(0, 10))}
            onBlur={() => setTocado(true)}
            inputMode="numeric"
            autoFocus
            placeholder="110525"
            className="tabular min-h-12 w-full rounded-xl border border-borde bg-lienzo px-3.5 outline-none focus:border-borde-fuerte lg:min-h-10 lg:rounded-lg"
          />
          <p className="mt-2 text-[13px] leading-relaxed text-tinta-tenue">
            1 dígito clase · 2 grupo · 4 cuenta · 6 subcuenta · 7 o más auxiliar
            {nivel && (
              <>
                {' '}— será una <span className="text-tinta">{ETIQUETA_NIVEL[nivel].toLowerCase()}</span>
                {padre && (
                  <>
                    {' '}dentro de <Codigo valor={padre} />
                  </>
                )}
              </>
            )}
          </p>
        </Campo>

        {codigo.length > 0 && (
          <div className="rounded-xl border border-borde bg-lienzo px-4">
            <LecturaCodigo codigo={codigo} segmentos={segmentosDe(codigo)} compacta />
          </div>
        )}

        <Campo etiqueta="Nombre">
          <input
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            onBlur={() => setTocado(true)}
            maxLength={200}
            placeholder="CAJA SEDE NORTE"
            className="min-h-12 w-full rounded-xl border border-borde bg-lienzo px-3.5 outline-none focus:border-borde-fuerte lg:min-h-10 lg:rounded-lg"
          />
        </Campo>

        <Campo etiqueta="Qué registra" opcional>
          <textarea
            value={descripcion}
            onChange={(e) => setDescripcion(e.target.value)}
            rows={3}
            placeholder="Efectivo recaudado en la sede norte antes de su consignación."
            className="w-full resize-y rounded-xl border border-borde bg-lienzo px-3.5 py-2.5 leading-relaxed outline-none focus:border-borde-fuerte lg:rounded-lg"
          />
        </Campo>

        <Campo etiqueta="Naturaleza">
          <select
            value={naturaleza}
            onChange={(e) => setNaturaleza(e.target.value as Naturaleza | '')}
            className="min-h-12 w-full rounded-xl border border-borde bg-lienzo px-3.5 outline-none focus:border-borde-fuerte lg:min-h-10 lg:rounded-lg"
          >
            <option value="">
              Automática{naturalezaSugerida ? ` — ${naturalezaSugerida === 'debito' ? 'débito' : 'crédito'} por su clase` : ''}
            </option>
            <option value="debito">Débito</option>
            <option value="credito">Crédito</option>
          </select>
          <p className="mt-2 text-[13px] leading-relaxed text-tinta-tenue">
            Cámbiala solo en cuentas de contrapartida, como depreciación acumulada o provisiones.
          </p>
        </Campo>

        {mostrarError && (
          <p
            className="rounded-lg px-3.5 py-2.5 text-[14px] leading-relaxed"
            style={{ background: 'var(--color-error)', color: 'var(--color-error-tinta)' }}
          >
            {validacion.mensaje}
          </p>
        )}
      </div>
    </Dialogo>
  )
}

function Campo({
  etiqueta,
  opcional = false,
  children,
}: {
  etiqueta: string
  opcional?: boolean
  children: React.ReactNode
}) {
  return (
    <label className="block">
      <span className="rotulo mb-1.5 block">
        {etiqueta}
        {opcional && <span className="normal-case tracking-normal"> (opcional)</span>}
      </span>
      {children}
    </label>
  )
}
