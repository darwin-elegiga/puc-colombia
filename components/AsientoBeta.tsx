'use client'

import { useState } from 'react'
import type { Catalogo } from '@/lib/catalogo'
import type { Movimiento } from '@/data/movimientos'
import { asientoLocal } from '@/lib/movimientos'
import { ErrorIA, pedirAsiento, type AsientoIA } from '@/lib/ia'
import { nombreLegible } from '@/lib/puc'
import { explicarAsiento, type RenglonAExplicar } from '@/lib/explicacion'
import ExplicacionAsiento from './ExplicacionAsiento'
import AmpliarConIA from './AmpliarConIA'
import { Codigo, InsigniaLado, franjaClase } from './Insignias'
import { IconoChevron, IconoIntercambio } from './Iconos'

/**
 * Asiento a partir de una situación descrita con palabras (beta).
 *
 * Primero se resuelve en local: se busca, entre las operaciones que la aplicación
 * conoce, la más parecida a lo descrito y se muestra su asiento. Solo si no hay
 * ninguna parecida, o si la propuesta no convence, se ofrece pedirle el asiento
 * a la IA (Gemini), que además pone los importes.
 */

// Se conservan mientras dure la sesión, para no perderlos al abrir una cuenta y volver.
let borradorGuardado = ''
let situacionAnalizada = ''
let respuestaGuardada: AsientoIA | null = null

const EJEMPLOS = [
  'Pagué el arriendo del local por 2.000.000',
  'Vendí mercancía a crédito por 1.190.000 con IVA incluido',
  'Compré acciones de una empresa por 5.000.000',
  'Un socio aportó un carro a la empresa',
]

const pesos = (n: number) => `$ ${n.toLocaleString('es-CO')}`

export default function AsientoBeta({
  catalogo,
  onIr,
  onVerMovimiento,
  onSalir,
}: {
  catalogo: Catalogo
  onIr: (codigo: string) => void
  onVerMovimiento: (id: string) => void
  onSalir: () => void
}) {
  const [borrador, setBorrador] = useState(borradorGuardado)
  const [situacion, setSituacion] = useState(situacionAnalizada)
  const [elegida, setElegida] = useState<string | null>(null)
  const [ia, setIa] = useState<AsientoIA | null>(respuestaGuardada)
  const [estadoIA, setEstadoIA] = useState<'inicio' | 'cargando' | 'error'>('inicio')
  const [errorIA, setErrorIA] = useState('')
  /** El usuario dice que ninguna operación local es la suya: entonces se ofrece la IA. */
  const [ningunaSirve, setNingunaSirve] = useState(false)

  const local = situacion ? asientoLocal(situacion) : null
  const opciones = local ? [local.propuesta, ...local.alternativas].filter(Boolean) as Movimiento[] : []
  const mostrada = opciones.find((m) => m.id === elegida) ?? local?.propuesta ?? null

  // Se explica el asiento que está a la vista: el de la IA si lo hay, con sus importes,
  // o el de la operación conocida. La explicación es local; ampliarla, opcional.
  const aExplicar: { clave?: string; operacion: string; renglones: RenglonAExplicar[] } | null = ia
    ? {
        operacion: situacion,
        renglones: ia.renglones
          .filter((r) => r.nombre)
          .map((r) => ({
            codigo: r.codigo,
            efecto: r.debito > 0 ? 'debito' : 'credito',
            concepto: r.concepto,
            importe: r.debito || r.credito,
          })),
      }
    : mostrada
      ? { clave: mostrada.id, operacion: `${mostrada.nombre}. ${mostrada.descripcion}`, renglones: mostrada.asiento }
      : null

  const analizar = (texto: string) => {
    const limpio = texto.trim()
    if (!limpio) return
    borradorGuardado = texto
    situacionAnalizada = limpio
    respuestaGuardada = null
    setBorrador(texto)
    setSituacion(limpio)
    setElegida(null)
    setIa(null)
    setEstadoIA('inicio')
    setNingunaSirve(false)
  }

  const consultarIA = async () => {
    setEstadoIA('cargando')
    try {
      const respuesta = await pedirAsiento(situacion)
      respuestaGuardada = respuesta
      setIa(respuesta)
      setEstadoIA('inicio')
    } catch (e) {
      setErrorIA(e instanceof ErrorIA ? e.message : 'La IA no respondió.')
      setEstadoIA('error')
    }
  }

  return (
    <div className="flex h-dvh flex-col overflow-hidden bg-lienzo">
      <header
        className="z-20 flex shrink-0 items-center gap-1 border-b border-borde bg-lienzo px-2 py-2"
        style={{ paddingTop: 'calc(0.5rem + var(--seguro-arriba))' }}
      >
        <button type="button" onClick={onSalir} className="tactil flex items-center gap-1 rounded-lg pl-2 pr-3 text-[15px] text-tinta pulsable">
          <IconoChevron className="size-5 rotate-180" />
          Catálogo
        </button>
        <span className="ml-auto shrink-0 pr-2 text-[13px] text-tinta-tenue">Asiento · beta</span>
      </header>

      <div className="panel-scroll min-h-0 flex-1">
        <div className="mx-auto max-w-2xl px-5 py-6 lg:px-8 lg:py-10" style={{ paddingBottom: 'calc(var(--seguro-abajo) + 2rem)' }}>
          <div className="flex items-center gap-2">
            <p className="rotulo">Hazme el asiento</p>
            <Beta />
          </div>
          <h1 className="editorial mt-2 text-[30px] leading-tight text-tinta lg:text-5xl">Cuéntame qué pasó</h1>
          <p className="mt-3 text-[15px] leading-relaxed text-tinta-suave">
            Escribe la situación como se la contarías a tu contador. La busco entre las operaciones que conozco,
            aquí mismo en el teléfono; solo si no encuentro ninguna que encaje te ofrezco pedírsela a la IA.
          </p>

          <form
            className="mt-5"
            onSubmit={(e) => {
              e.preventDefault()
              analizar(borrador)
            }}
          >
            <textarea
              value={borrador}
              onChange={(e) => setBorrador(e.target.value)}
              rows={3}
              maxLength={600}
              placeholder="Ej.: pagué la factura de internet de la oficina por 180.000"
              aria-label="Situación"
              className="w-full resize-y rounded-xl border border-borde bg-superficie px-3.5 py-3 leading-relaxed text-tinta outline-none placeholder:text-tinta-tenue focus:border-borde-fuerte"
            />
            <button
              type="submit"
              disabled={!borrador.trim()}
              className="tactil mt-2 w-full rounded-xl bg-tinta text-[15px] text-white active:bg-[#3d4347] disabled:opacity-40"
            >
              Proponer asiento
            </button>
          </form>

          {!situacion && (
            <div className="mt-5 flex flex-wrap gap-2">
              {EJEMPLOS.map((e) => (
                <button
                  key={e}
                  type="button"
                  onClick={() => analizar(e)}
                  className="min-h-10 rounded-lg border border-borde bg-superficie px-3 text-left text-[13px] text-tinta-suave pulsable"
                >
                  {e}
                </button>
              ))}
            </div>
          )}

          {/* ─────────── Propuesta local ─────────── */}
          {situacion && local && (
            <section className="surgir mt-8">
              {mostrada ? (
                <>
                  <p className="rotulo mb-2">{local.propuesta ? 'Operación parecida · sin IA' : 'Elegida por ti · sin IA'}</p>
                  <div className="rounded-xl border border-borde bg-superficie">
                    <div className="border-b border-borde px-4 py-3">
                      <InsigniaLado lado={mostrada.lado} />
                      <p className="mt-1.5 text-[16px] font-medium leading-snug text-tinta">{mostrada.nombre}</p>
                      <p className="mt-1 text-[13.5px] leading-relaxed text-tinta-suave">{mostrada.descripcion}</p>
                    </div>
                    <AsientoSinImportes movimiento={mostrada} catalogo={catalogo} onIr={onIr} />
                    <button
                      type="button"
                      onClick={() => onVerMovimiento(mostrada.id)}
                      className="flex w-full items-center justify-between border-t border-borde px-4 py-3 text-[13.5px] text-tinta-suave pulsable"
                    >
                      Ver la explicación completa
                      <IconoChevron className="size-4" />
                    </button>
                  </div>
                  <p className="mt-2 text-[12px] leading-relaxed text-tinta-tenue">
                    Las cuentas y columnas salen de la operación conocida; los importes los pones tú, o pídeselos a la IA.
                  </p>
                </>
              ) : (
                <div className="rounded-xl border border-borde bg-superficie px-4 py-5 text-center">
                  <p className="text-[15px] text-tinta">No encontré una operación parecida entre las que conozco.</p>
                  <p className="mt-1 text-[13px] text-tinta-tenue">La IA puede proponerte el asiento completo.</p>
                </div>
              )}

              {opciones.filter((m) => m.id !== mostrada?.id).length > 0 && (
                <div className="mt-5">
                  <p className="rotulo mb-2">{mostrada ? '¿O es alguna de estas?' : 'Lo más cercano que conozco'}</p>
                  <ul className="overflow-hidden rounded-xl border border-borde bg-superficie">
                    {opciones
                      .filter((m) => m.id !== mostrada?.id)
                      .map((m) => (
                        <li key={m.id} className="border-b border-borde last:border-b-0">
                          <button
                            type="button"
                            onClick={() => setElegida(m.id)}
                            className="tactil flex w-full items-center gap-3 px-4 py-2.5 text-left pulsable"
                          >
                            <IconoIntercambio className="size-[18px] shrink-0 text-tinta-tenue" />
                            <span className="min-w-0 flex-1 text-[14.5px] leading-snug text-tinta">{m.nombre}</span>
                            <InsigniaLado lado={m.lado} />
                          </button>
                        </li>
                      ))}
                  </ul>
                </div>
              )}

              {/* Si lo local encontró algo, la IA solo aparece si el usuario dice que no le sirve. */}
              {!ia && mostrada && !ningunaSirve && (
                <button
                  type="button"
                  onClick={() => setNingunaSirve(true)}
                  className="mt-5 w-full text-center text-[13px] text-tinta-tenue underline underline-offset-2"
                >
                  Ninguna de estas es mi operación
                </button>
              )}

              {/* ─────────── Paso a la IA: solo cuando lo local no resuelve ─────────── */}
              {!ia && (!mostrada || ningunaSirve) && (
                <div className="mt-6">
                  <button
                    type="button"
                    onClick={consultarIA}
                    disabled={estadoIA === 'cargando'}
                    className={[
                      'tactil flex w-full items-center justify-center gap-2 rounded-xl px-4 text-[14.5px] transition-colors disabled:opacity-60',
                      'bg-tinta text-white active:bg-[#3d4347]',
                    ].join(' ')}
                  >
                    {estadoIA === 'cargando' ? 'La IA está preparando el asiento…' : 'Pedir el asiento a la IA'}
                    <Beta invertido />
                  </button>
                  <p className="mt-1.5 text-center text-[11.5px] leading-relaxed text-tinta-tenue">
                    {estadoIA === 'error'
                      ? errorIA
                      : 'Tu texto se envía a Gemini (Google). Necesita conexión. Revisa siempre lo que proponga.'}
                  </p>
                </div>
              )}
            </section>
          )}

          {/* ─────────── Respuesta de la IA ─────────── */}
          {ia && <RespuestaIA asiento={ia} onIr={onIr} onReintentar={consultarIA} cargando={estadoIA === 'cargando'} />}

          {/* ─────────── Por qué se hace así: local, y la IA solo al final ─────────── */}
          {aExplicar && aExplicar.renglones.length > 0 && (
            <>
              <ExplicacionAsiento
                explicacion={explicarAsiento(aExplicar.renglones, (c) => catalogo.indice.get(c), aExplicar.operacion)}
                onIr={onIr}
              />
              <AmpliarConIA
                key={`${aExplicar.clave ?? aExplicar.operacion}-${aExplicar.renglones.length}`}
                clave={aExplicar.clave}
                operacion={aExplicar.operacion}
                renglones={aExplicar.renglones}
              />
            </>
          )}
        </div>
      </div>
    </div>
  )
}

function Beta({ invertido = false }: { invertido?: boolean }) {
  return (
    <span
      className={[
        'rounded-full px-1.5 py-0.5 text-[9.5px] font-semibold uppercase tracking-[0.08em]',
        invertido ? 'bg-white/20 text-white' : 'bg-nota text-nota-tinta',
      ].join(' ')}
      style={invertido ? undefined : { background: 'var(--color-nota)', color: 'var(--color-nota-tinta)' }}
    >
      Beta
    </span>
  )
}

/** El asiento de una operación conocida: cuentas y columnas, sin importes. */
function AsientoSinImportes({ movimiento, catalogo, onIr }: { movimiento: Movimiento; catalogo: Catalogo; onIr: (codigo: string) => void }) {
  return (
    <ul>
      {movimiento.asiento.map((r, i) => {
        const cuenta = catalogo.indice.get(r.codigo)
        return (
          <li key={`${r.codigo}-${i}`} className="border-b border-borde last:border-b-0" style={franjaClase(r.codigo)}>
            <button type="button" onClick={() => onIr(r.codigo)} className="flex w-full items-start gap-3 px-4 py-2.5 text-left pulsable">
              <span className="min-w-0 flex-1">
                <span className="flex items-baseline gap-2.5">
                  <Codigo valor={r.codigo} className="text-[14.5px] font-medium" />
                  <span className="min-w-0 flex-1 truncate text-[14.5px] text-tinta">{cuenta ? nombreLegible(cuenta.nombre) : ''}</span>
                </span>
                <span className="text-[12.5px] text-tinta-suave">{r.concepto}</span>
              </span>
              <Columna efecto={r.efecto} />
            </button>
          </li>
        )
      })}
    </ul>
  )
}

function Columna({ efecto }: { efecto: 'debito' | 'credito' }) {
  return (
    <span
      className="mt-0.5 shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium uppercase tracking-[0.06em]"
      style={{
        background: efecto === 'debito' ? 'var(--color-debito)' : 'var(--color-credito)',
        color: efecto === 'debito' ? 'var(--color-debito-tinta)' : 'var(--color-credito-tinta)',
      }}
    >
      {efecto === 'debito' ? 'Débito' : 'Crédito'}
    </span>
  )
}

function RespuestaIA({
  asiento,
  onIr,
  onReintentar,
  cargando,
}: {
  asiento: AsientoIA
  onIr: (codigo: string) => void
  onReintentar: () => void
  cargando: boolean
}) {
  const { validacion } = asiento
  return (
    <section className="surgir mt-8">
      <div className="mb-2 flex items-center gap-2">
        <p className="rotulo">Asiento propuesto por la IA</p>
        <Beta />
      </div>
      <div className="rounded-xl border border-borde bg-superficie">
        <div className="border-b border-borde px-4 py-3">
          <InsigniaLado lado={asiento.lado} />
          <p className="mt-1.5 text-[15.5px] leading-snug text-tinta">{asiento.resumen}</p>
        </div>

        <div className="grid grid-cols-[1fr_auto_auto] gap-x-3 border-b border-borde px-4 py-2 text-[10.5px] uppercase tracking-[0.06em] text-tinta-tenue">
          <span>Cuenta</span>
          <span className="w-[5.5rem] text-right">Débito</span>
          <span className="w-[5.5rem] text-right">Crédito</span>
        </div>
        <ul>
          {asiento.renglones.map((r, i) => (
            <li key={`${r.codigo}-${i}`} className="border-b border-borde" style={franjaClase(r.codigo)}>
              <button
                type="button"
                onClick={() => r.nombre && onIr(r.codigo)}
                className="grid w-full grid-cols-[1fr_auto_auto] items-start gap-x-3 px-4 py-2.5 text-left pulsable"
              >
                <span className="min-w-0">
                  <span className="flex items-baseline gap-2">
                    <Codigo valor={r.codigo} className="text-[14px] font-medium" />
                    <span className="min-w-0 truncate text-[14px] text-tinta">
                      {r.nombre ? nombreLegible(r.nombre) : 'No está en el catálogo'}
                    </span>
                  </span>
                  <span className="block text-[12.5px] leading-snug text-tinta-suave">{r.concepto}</span>
                </span>
                <span className="tabular w-[5.5rem] text-right text-[13px] text-tinta">{r.debito ? pesos(r.debito) : ''}</span>
                <span className="tabular w-[5.5rem] text-right text-[13px] text-tinta">{r.credito ? pesos(r.credito) : ''}</span>
              </button>
            </li>
          ))}
        </ul>
        <div className="grid grid-cols-[1fr_auto_auto] gap-x-3 px-4 py-2.5 text-[13px]">
          <span className={validacion.cuadra ? 'text-tinta-suave' : 'font-medium'} style={validacion.cuadra ? undefined : { color: 'var(--color-error-tinta)' }}>
            {validacion.cuadra ? 'Cuadra' : 'No cuadra'}
          </span>
          <span className="tabular w-[5.5rem] text-right font-medium text-tinta">{pesos(validacion.totalDebito)}</span>
          <span className="tabular w-[5.5rem] text-right font-medium text-tinta">{pesos(validacion.totalCredito)}</span>
        </div>
      </div>

      {asiento.supuestos.length > 0 && (
        <div className="mt-4">
          <p className="rotulo mb-1.5">Supuestos</p>
          <ul className="space-y-1 text-[13.5px] leading-relaxed text-tinta-suave">
            {asiento.supuestos.map((s) => <li key={s}>· {s}</li>)}
          </ul>
        </div>
      )}
      {asiento.advertencias.length > 0 && (
        <div className="mt-4 rounded-lg px-3.5 py-3 text-[13.5px] leading-relaxed" style={{ background: 'var(--color-nota)', color: 'var(--color-nota-tinta)' }}>
          {asiento.advertencias.map((a) => <p key={a}>{a}</p>)}
        </div>
      )}

      <div className="mt-4 flex items-center justify-between gap-3 text-[11.5px] text-tinta-tenue">
        <span>Generado por {asiento.modelo}. Es una propuesta: revísala antes de registrarla.</span>
        <button type="button" onClick={onReintentar} disabled={cargando} className="shrink-0 underline underline-offset-2 disabled:opacity-50">
          {cargando ? 'Pidiendo…' : 'Pedir otra'}
        </button>
      </div>
    </section>
  )
}
