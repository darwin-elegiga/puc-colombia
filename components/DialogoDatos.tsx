'use client'

import { useState } from 'react'
import Dialogo, { botonPrimario, botonSecundario } from './Dialogo'
import { IconoDescarga } from './Iconos'

export interface ResultadoImportacion {
  creadas: number
  errores: { codigo: string; mensaje: string }[]
}

export default function DialogoDatos({
  abierto,
  propias,
  onCerrar,
  onImportar,
  onExportar,
  onVaciar,
}: {
  abierto: boolean
  propias: number
  onCerrar: () => void
  onImportar: (csv: string) => ResultadoImportacion
  onExportar: (soloMias: boolean) => void
  onVaciar: () => void
}) {
  const [csv, setCsv] = useState('')
  const [resultado, setResultado] = useState<ResultadoImportacion | null>(null)
  const [confirmandoVaciado, setConfirmandoVaciado] = useState(false)

  const cerrar = () => {
    setResultado(null)
    setConfirmandoVaciado(false)
    onCerrar()
  }

  return (
    <Dialogo
      abierto={abierto}
      titulo="Importar y exportar"
      onCerrar={cerrar}
      pie={
        <button type="button" className={botonSecundario} onClick={cerrar}>
          Cerrar
        </button>
      }
    >
      <div className="space-y-7">
        <section>
          <p className="rotulo mb-1.5">Importar cuentas</p>
          <p className="mb-3 text-[14px] leading-relaxed text-tinta-suave">
            Una cuenta por línea: <span className="tabular">codigo,nombre,descripcion,naturaleza</span>. Las dos últimas
            columnas son opcionales y el encabezado se detecta solo. Úsalo para cargar tu catálogo completo de
            subcuentas y auxiliares.
          </p>
          <textarea
            value={csv}
            onChange={(e) => setCsv(e.target.value)}
            rows={6}
            spellCheck={false}
            placeholder={'110525,CAJA SEDE SUR,Efectivo recaudado en la sede sur\n110530,CAJA SEDE ORIENTE'}
            className="tabular w-full resize-y rounded-xl border border-borde bg-lienzo px-3.5 py-2.5 leading-relaxed outline-none focus:border-borde-fuerte lg:rounded-lg lg:text-[12.5px]"
          />
          <div className="mt-2.5 flex flex-wrap gap-2">
            <button
              type="button"
              className={botonPrimario}
              disabled={!csv.trim()}
              onClick={() => setResultado(onImportar(csv))}
            >
              Importar
            </button>
            {csv && (
              <button type="button" className={botonSecundario} onClick={() => { setCsv(''); setResultado(null) }}>
                Limpiar
              </button>
            )}
          </div>

          {resultado && (
            <div className="mt-3 space-y-2">
              <p
                className="rounded-lg px-3.5 py-2.5 text-[14px]"
                style={{ background: 'var(--color-propia)', color: 'var(--color-propia-tinta)' }}
              >
                {resultado.creadas} {resultado.creadas === 1 ? 'cuenta creada' : 'cuentas creadas'}.
              </p>
              {resultado.errores.length > 0 && (
                <div
                  className="rounded-lg px-3.5 py-2.5 text-[13px] leading-relaxed"
                  style={{ background: 'var(--color-credito)', color: 'var(--color-credito-tinta)' }}
                >
                  <p className="mb-1 font-medium">{resultado.errores.length} sin importar:</p>
                  <ul className="space-y-0.5">
                    {resultado.errores.slice(0, 8).map((e, i) => (
                      <li key={`${e.codigo}-${i}`}>
                        <span className="tabular">{e.codigo || '—'}</span> · {e.mensaje}
                      </li>
                    ))}
                    {resultado.errores.length > 8 && <li>y {resultado.errores.length - 8} más…</li>}
                  </ul>
                </div>
              )}
            </div>
          )}
        </section>

        <section className="border-t border-borde pt-5">
          <p className="rotulo mb-2.5">Exportar</p>
          <div className="flex flex-wrap gap-2">
            <button type="button" className={`${botonSecundario} inline-flex items-center gap-1.5`} onClick={() => onExportar(false)}>
              <IconoDescarga className="size-3.5" />
              Catálogo completo
            </button>
            <button
              type="button"
              className={`${botonSecundario} inline-flex items-center gap-1.5`}
              disabled={propias === 0}
              onClick={() => onExportar(true)}
            >
              <IconoDescarga className="size-3.5" />
              Solo mis cuentas ({propias})
            </button>
          </div>
        </section>

        <section className="border-t border-borde pt-5">
          <p className="rotulo mb-1.5">Tus cuentas</p>
          <p className="mb-3 text-[14px] leading-relaxed text-tinta-suave">
            Las cuentas que creas se guardan en este navegador, no en un servidor. Si borras los datos del sitio o
            entras desde otro dispositivo, no estarán: exporta el CSV para conservarlas.
          </p>
          {confirmandoVaciado ? (
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[14px] text-tinta">¿Eliminar las {propias} cuentas creadas?</span>
              <button
                type="button"
                className={botonPrimario}
                onClick={() => {
                  onVaciar()
                  setConfirmandoVaciado(false)
                }}
              >
                Sí, eliminar
              </button>
              <button type="button" className={botonSecundario} onClick={() => setConfirmandoVaciado(false)}>
                Cancelar
              </button>
            </div>
          ) : (
            <button
              type="button"
              className={botonSecundario}
              disabled={propias === 0}
              onClick={() => setConfirmandoVaciado(true)}
            >
              Eliminar mis cuentas
            </button>
          )}
        </section>
      </div>
    </Dialogo>
  )
}
