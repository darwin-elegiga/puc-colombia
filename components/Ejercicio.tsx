'use client'

import { useState } from 'react'
import { NIVELES, type Columna, type Ejercicio as DatosEjercicio } from '@/data/ejercicios'
import type { Catalogo } from '@/lib/catalogo'
import { calificar, estaCompleto, pesos, respuestasVacias, sumas, type Respuesta } from '@/lib/ejercicios'
import SelectorCuenta from './SelectorCuenta'
import { Codigo } from './Insignias'
import { IconoCerrar, IconoChevron, IconoVisto } from './Iconos'
import { nombreLegible } from '@/lib/puc'

const TONO: Record<Columna, { fondo: string; tinta: string; titulo: string }> = {
  debe: { fondo: 'var(--color-debito)', tinta: 'var(--color-debito-tinta)', titulo: 'Debe' },
  haber: { fondo: 'var(--color-credito)', tinta: 'var(--color-credito-tinta)', titulo: 'Haber' },
}

/**
 * Un ejercicio en curso: se ubica cada renglón en su columna y, a partir del
 * tercer nivel, se le asigna además la cuenta del PUC.
 *
 * El componente se monta con key={id}, así que el estado arranca limpio en cada
 * ejercicio sin necesidad de sincronizarlo con las propiedades.
 */
export default function Ejercicio({
  ejercicio,
  posicion,
  total,
  catalogo,
  resuelto,
  onVolver,
  onSiguiente,
  onAnotar,
}: {
  ejercicio: DatosEjercicio
  posicion: number
  total: number
  catalogo: Catalogo
  resuelto: boolean
  onVolver: () => void
  onSiguiente: (() => void) | null
  onAnotar: (perfecto: boolean) => void
}) {
  const [respuestas, setRespuestas] = useState<Respuesta[]>(() => respuestasVacias(ejercicio))
  const [revisado, setRevisado] = useState(false)
  const [verExplicacion, setVerExplicacion] = useState(false)
  const [selector, setSelector] = useState<number | null>(null)

  const pideCuenta = ejercicio.pide === 'cuenta'
  const nivel = NIVELES.find((n) => n.numero === ejercicio.nivel)
  const completo = estaCompleto(ejercicio, respuestas)
  const cuadre = sumas(ejercicio, respuestas)
  const calificacion = calificar(ejercicio, respuestas)

  const cambiar = (indice: number, cambios: Partial<Respuesta>) => {
    setRespuestas((previas) =>
      previas.map((r, i) => (i === indice ? { ...r, ...cambios } : r)),
    )
  }

  const ubicar = (indice: number, columna: Columna) => cambiar(indice, { columna })
  const devolver = (indice: number) => cambiar(indice, { columna: null, codigo: null })

  const comprobar = () => {
    setRevisado(true)
    setVerExplicacion(calificacion.perfecto)
    onAnotar(calificacion.perfecto)
  }

  /** Deja en su sitio lo que estaba bien y devuelve a la bandeja lo que no. */
  const reintentar = () => {
    setRespuestas((previas) =>
      previas.map((r, i) =>
        calificacion.veredictos[i].ok ? r : { columna: null, codigo: null },
      ),
    )
    setRevisado(false)
    setVerExplicacion(false)
  }

  const pendientes = ejercicio.renglones
    .map((renglon, i) => ({ renglon, i }))
    .filter(({ i }) => respuestas[i].columna === null)

  return (
    <div className="flex h-dvh flex-col overflow-hidden bg-lienzo">
      {/* ═══════════ Barra superior ═══════════ */}
      <header
        className="z-20 flex shrink-0 items-center gap-1 border-b border-borde bg-lienzo px-2 py-2"
        style={{ paddingTop: 'calc(0.5rem + var(--seguro-arriba))' }}
      >
        <button
          type="button"
          onClick={onVolver}
          className="tactil flex items-center gap-1 rounded-lg pl-2 pr-3 text-[15px] text-tinta pulsable"
        >
          <IconoChevron className="size-5 rotate-180" />
          Ejercicios
        </button>
        <span className="tabular ml-auto shrink-0 pr-2 text-[13px] text-tinta-tenue">
          {posicion} / {total}
        </span>
      </header>

      {/* ═══════════ Cuerpo ═══════════ */}
      <div className="panel-scroll min-h-0 flex-1">
        <div className="mx-auto max-w-2xl px-5 py-6 lg:px-8 lg:py-8">
          <p className="rotulo">
            Nivel {ejercicio.nivel} · {nivel?.titulo}
          </p>
          <h1 className="editorial mt-2 text-[27px] text-tinta lg:text-4xl">{ejercicio.titulo}</h1>
          <p className="mt-3 text-[15px] leading-relaxed text-pretty text-tinta-suave">
            {ejercicio.enunciado}
          </p>

          {/* ─────────── Renglones por ubicar ─────────── */}
          {pendientes.length > 0 && (
            <section className="mt-7">
              <div className="mb-2 flex items-baseline justify-between gap-3">
                <p className="rotulo">Por ubicar</p>
                <p className="tabular shrink-0 text-[12px] text-tinta-tenue">
                  {pendientes.length} de {ejercicio.renglones.length}
                </p>
              </div>
              <ul className="surgir-lista space-y-2.5">
                {pendientes.map(({ renglon, i }, orden) => (
                  <li
                    key={i}
                    style={{ '--i': orden } as React.CSSProperties}
                    className="rounded-xl border border-borde bg-superficie p-4"
                  >
                    <p className="text-[15px] leading-snug text-pretty text-tinta">{renglon.concepto}</p>
                    <p className="tabular mt-1 text-[13px] text-tinta-suave">{pesos(renglon.importe)}</p>
                    <div className="mt-3 grid grid-cols-2 gap-2">
                      {(['debe', 'haber'] as const).map((columna) => (
                        <button
                          key={columna}
                          type="button"
                          onClick={() => ubicar(i, columna)}
                          className="tactil rounded-lg text-[15px] font-medium transition-opacity active:opacity-80"
                          style={{ background: TONO[columna].fondo, color: TONO[columna].tinta }}
                        >
                          {TONO[columna].titulo}
                        </button>
                      ))}
                    </div>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {/* ─────────── El asiento ─────────── */}
          <section className="mt-7">
            <p className="rotulo mb-2">El asiento</p>
            <div className="grid gap-3 lg:grid-cols-2">
              {(['debe', 'haber'] as const).map((columna) => (
                <ColumnaAsiento
                  key={columna}
                  columna={columna}
                  suma={columna === 'debe' ? cuadre.debe : cuadre.haber}
                  ejercicio={ejercicio}
                  respuestas={respuestas}
                  revisado={revisado}
                  veredictos={calificacion.veredictos}
                  catalogo={catalogo}
                  onQuitar={devolver}
                  onElegirCuenta={setSelector}
                />
              ))}
            </div>

            <div className="mt-3 flex items-center justify-between gap-3 rounded-xl border border-borde bg-hueso px-4 py-3">
              <span className="min-w-0 text-[13px] leading-snug text-tinta-suave">
                {cuadre.cuadra ? 'Las dos columnas suman igual' : 'Diferencia entre las columnas'}
              </span>
              <span className="tabular shrink-0 text-[14px] text-tinta">
                {pesos(Math.abs(cuadre.diferencia))}
              </span>
            </div>
          </section>

          {/* ─────────── Resultado ─────────── */}
          {revisado && (
            <section className="surgir mt-6">
              <div
                className="rounded-xl px-4 py-3.5"
                style={{
                  background: calificacion.perfecto ? 'var(--color-propia)' : 'var(--color-nota)',
                  color: calificacion.perfecto ? 'var(--color-propia-tinta)' : 'var(--color-nota-tinta)',
                }}
              >
                <p className="text-[15px] font-medium">
                  {calificacion.perfecto
                    ? 'Asiento correcto'
                    : `${calificacion.aciertos} de ${calificacion.total} renglones bien`}
                </p>
                <p className="mt-1 text-[13.5px] leading-relaxed">
                  {calificacion.perfecto
                    ? `Debe y haber cuadran en ${pesos(cuadre.debe)}.`
                    : 'Los renglones marcados llevan la corrección debajo. Puedes reintentar sin perder los que ya están bien.'}
                </p>
              </div>

              {verExplicacion ? (
                <div className="surgir mt-4">
                  <p className="rotulo mb-1.5">Por qué</p>
                  <p className="text-[15px] leading-relaxed text-pretty text-tinta">
                    {ejercicio.explicacion}
                  </p>
                  {ejercicio.nota && (
                    <p
                      className="mt-3 rounded-lg px-3.5 py-3 text-[14px] leading-relaxed text-pretty"
                      style={{ background: 'var(--color-nota)', color: 'var(--color-nota-tinta)' }}
                    >
                      {ejercicio.nota}
                    </p>
                  )}
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setVerExplicacion(true)}
                  className="tactil mt-3 w-full rounded-xl border border-borde bg-superficie px-4 text-[15px] text-tinta-suave pulsable"
                >
                  Ver la explicación
                </button>
              )}
            </section>
          )}

          {!revisado && resuelto && (
            <p className="mt-6 flex items-center gap-2 text-[13px] text-tinta-tenue">
              <IconoVisto className="size-4" />
              Ya lo resolviste antes
            </p>
          )}

          <div className="h-6" />
        </div>
      </div>

      {/* ═══════════ Acciones ═══════════ */}
      <footer
        className="z-20 shrink-0 border-t border-borde bg-lienzo px-4 pt-3"
        style={{ paddingBottom: 'calc(0.75rem + var(--seguro-abajo))' }}
      >
        <div className="mx-auto flex max-w-2xl gap-2">
          {!revisado ? (
            <button
              type="button"
              onClick={comprobar}
              disabled={!completo}
              className="tactil w-full rounded-xl bg-tinta text-[15px] text-white transition-opacity active:bg-[#3d4347] disabled:opacity-30"
            >
              {completo
                ? 'Comprobar'
                : pideCuenta
                  ? 'Ubica y asigna cuenta a cada renglón'
                  : 'Ubica todos los renglones'}
            </button>
          ) : (
            <>
              {!calificacion.perfecto && (
                <button
                  type="button"
                  onClick={reintentar}
                  className="tactil flex-1 rounded-xl border border-borde bg-superficie text-[15px] text-tinta-suave pulsable"
                >
                  Reintentar
                </button>
              )}
              <button
                type="button"
                onClick={onSiguiente ?? onVolver}
                className="tactil flex-1 rounded-xl bg-tinta text-[15px] text-white active:bg-[#3d4347]"
              >
                {onSiguiente ? 'Siguiente' : 'Terminar'}
              </button>
            </>
          )}
        </div>
      </footer>

      <SelectorCuenta
        abierto={selector !== null}
        catalogo={catalogo}
        banco={ejercicio.banco}
        elegida={selector === null ? null : respuestas[selector].codigo}
        onElegir={(codigo) => {
          if (selector !== null) cambiar(selector, { codigo })
          setSelector(null)
        }}
        onCerrar={() => setSelector(null)}
      />
    </div>
  )
}

/* ─────────────────────────────────────────────────────────── */

function ColumnaAsiento({
  columna,
  suma,
  ejercicio,
  respuestas,
  revisado,
  veredictos,
  catalogo,
  onQuitar,
  onElegirCuenta,
}: {
  columna: Columna
  suma: number
  ejercicio: DatosEjercicio
  respuestas: Respuesta[]
  revisado: boolean
  veredictos: { columna: boolean; cuenta: boolean; ok: boolean }[]
  catalogo: Catalogo
  onQuitar: (indice: number) => void
  onElegirCuenta: (indice: number) => void
}) {
  const tono = TONO[columna]
  const dentro = ejercicio.renglones
    .map((renglon, i) => ({ renglon, i }))
    .filter(({ i }) => respuestas[i].columna === columna)

  return (
    <section className="min-w-0 overflow-hidden rounded-xl border border-borde bg-superficie">
      <header className="flex items-center justify-between gap-3 border-b border-borde px-4 py-2">
        <span
          className="inline-flex shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium uppercase tracking-[0.06em]"
          style={{ background: tono.fondo, color: tono.tinta }}
        >
          {tono.titulo}
        </span>
        <span className="tabular min-w-0 truncate text-[13px] text-tinta-suave">{pesos(suma)}</span>
      </header>

      {dentro.length === 0 ? (
        <p className="px-4 py-6 text-center text-[13px] text-tinta-tenue">Sin renglones</p>
      ) : (
        <ul>
          {dentro.map(({ renglon, i }) => {
            const veredicto = veredictos[i]
            const codigo = respuestas[i].codigo
            const cuenta = codigo ? catalogo.indice.get(codigo) : undefined
            const correcta = catalogo.indice.get(renglon.codigo)
            const mal = revisado && !veredicto.ok

            return (
              <li key={i} className="border-b border-borde last:border-b-0">
                <div className="flex items-start gap-3 px-4 py-3">
                  <div className="min-w-0 flex-1">
                    <p className="text-[14px] leading-snug text-pretty text-tinta">{renglon.concepto}</p>

                    {ejercicio.pide === 'cuenta' && (
                      <button
                        type="button"
                        onClick={() => onElegirCuenta(i)}
                        disabled={revisado}
                        className="mt-2 flex max-w-full items-center gap-2 rounded-lg border border-borde bg-hueso px-2.5 py-1.5 text-left disabled:opacity-100"
                      >
                        {cuenta ? (
                          <>
                            <Codigo valor={cuenta.codigo} className="shrink-0 text-[13px] font-medium" />
                            <span className="min-w-0 truncate text-[13px] text-tinta-suave">
                              {nombreLegible(cuenta.nombre)}
                            </span>
                          </>
                        ) : (
                          <span className="text-[13px] text-tinta-tenue">Elegir cuenta</span>
                        )}
                      </button>
                    )}

                    {mal && (
                      <p
                        className="mt-2 rounded-lg px-2.5 py-1.5 text-[12.5px] leading-snug"
                        style={{ background: 'var(--color-nota)', color: 'var(--color-nota-tinta)' }}
                      >
                        {!veredicto.columna && `Va en el ${TONO[renglon.columna].titulo.toLowerCase()}. `}
                        {!veredicto.cuenta &&
                          `La cuenta es ${renglon.codigo}${correcta ? ` · ${nombreLegible(correcta.nombre)}` : ''}.`}
                      </p>
                    )}
                  </div>

                  <div className="flex shrink-0 flex-col items-end gap-1">
                    <span className="tabular whitespace-nowrap text-[14px] text-tinta">
                      {pesos(renglon.importe)}
                    </span>
                    {revisado ? (
                      <span
                        aria-label={veredicto.ok ? 'Correcto' : 'Incorrecto'}
                        className="grid size-6 place-items-center rounded-full"
                        style={{
                          background: veredicto.ok ? 'var(--color-propia)' : 'var(--color-error)',
                          color: veredicto.ok ? 'var(--color-propia-tinta)' : 'var(--color-error-tinta)',
                        }}
                      >
                        {veredicto.ok ? <IconoVisto className="size-3.5" /> : <IconoCerrar className="size-3" />}
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => onQuitar(i)}
                        aria-label="Sacar de esta columna"
                        className="grid size-8 place-items-center rounded-lg text-tinta-tenue pulsable"
                      >
                        <IconoCerrar className="size-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              </li>
            )
          })}
        </ul>
      )}
    </section>
  )
}
