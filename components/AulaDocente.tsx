'use client'

import { useMemo, useRef, useState } from 'react'
import type { Catalogo } from '@/lib/catalogo'
import {
  MAX_EJERCICIOS, estadoQuiz, formatoNota, formatoTiempo, notaDelQuiz,
  type EjercicioDeAula, type EjercicioPropio, type EntregaQuiz, type VistaDocente,
} from '@/lib/aulas'
import { corregir, gruposDeAsiento, type EjercicioAsiento, type Fila } from '@/lib/practica'
import { apiAulas, borrarMiEjercicio, guardarMiEjercicio, useMisEjercicios, type MiAula } from '@/lib/misAulas'
import type { NotaIA } from '@/lib/calificacionIA'
import Dialogo, { botonPrimario, botonSecundario } from './Dialogo'
import HojaAsiento from './HojaAsiento'
import Enunciado from './Enunciado'
import EditorEjercicio from './EditorEjercicio'
import { IconoChevron, IconoLupa } from './Iconos'
import Cargando from './Cargando'

/** Tiempos que se ofrecen al empezar el quiz, en minutos (null: sin límite). */
const TIEMPOS: (number | null)[] = [null, 10, 15, 20, 30, 45, 60, 90]

/**
 * El tablero de quien creó el aula: compartir el código, preparar el quiz (sus
 * ejercicios y el tiempo), empezarlo, seguir los envíos (ordenados por tiempo, con la
 * nota que sale de la corrección automática), emitir cada nota, publicar las soluciones
 * y cerrar.
 */
export default function AulaDocente({
  aula,
  vista,
  catalogo,
  soloCopia,
  onCambio,
}: {
  aula: MiAula
  vista: VistaDocente
  catalogo: Catalogo
  /** El aula ya no existe en el servidor: se muestra la copia del dispositivo, sin acciones. */
  soloCopia: boolean
  /**
   * Pide el estado al servidor. Con la versión de antes de la acción, insiste hasta ver una
   * más nueva; se espera para que el cargador siga hasta ver el cambio.
   */
  onCambio: (desde?: number) => void | Promise<void>
}) {
  const [eligiendo, setEligiendo] = useState(false)
  /** A quién se está calificando: se guarda el id, no la copia, para ver siempre lo último. */
  const [calificando, setCalificando] = useState<string | null>(null)
  const [confirmar, setConfirmarEstado] = useState<string | null>(null)
  /** Cuándo apareció la confirmación: el segundo toque de un doble toque no confirma. */
  const confirmarDesde = useRef(0)
  const setConfirmar = (que: string | null) => {
    confirmarDesde.current = Date.now()
    setConfirmarEstado(que)
  }
  const confirmado = (accion: () => unknown) => () => {
    if (Date.now() - confirmarDesde.current > 400) void accion()
  }
  const [aviso, setAviso] = useState<string | null>(null)
  /** Tras sacar a alguien con la entrada abierta: se ofrece cerrarla. */
  const [ofrecerCerrarEntrada, setOfrecerCerrarEntrada] = useState(false)
  const [ocupado, setOcupado] = useState(false)
  /** La acción en marcha: su botón muestra un cargador hasta que llega el estado nuevo. */
  const [enCurso, setEnCurso] = useState<string | null>(null)
  const empezando = enCurso === 'empezar'
  const [limite, setLimite] = useState<number | null>(null)
  /** Ejercicio propio que se está escribiendo (vacío para uno nuevo). */
  const [escribiendo, setEscribiendo] = useState<EjercicioPropio | null>(null)

  const estado = estadoQuiz(vista.aula)
  const abierta = vista.aula.estado === 'abierta' && !soloCopia
  const preparando = estado === 'preparando' && abierta
  const activos = vista.miembros.filter((m) => !m.expulsado)
  const enviaron = vista.entregas.filter((e) => activos.some((m) => m.id === e.estudianteId))
  const resolviendo = Math.max(0, vista.empezados - vista.entregas.length)
  const enlace = typeof window === 'undefined' ? '' : `${window.location.origin}/#aula/${aula.codigo}`
  const entregaEnCalificacion = vista.entregas.find((e) => e.estudianteId === calificando)

  /** `marca` distingue el botón que la lanzó cuando hay varios de la misma acción (quitar o añadir uno). */
  const hacer = async (accion: string, datos: Record<string, unknown> = {}, marca = accion) => {
    setOcupado(true)
    setEnCurso(marca)
    setAviso(null)
    setOfrecerCerrarEntrada(false)
    const antes = vista.version
    try {
      await apiAulas.accion(aula.codigo, aula.clave, accion, datos)
      // El cargador sigue hasta tener el estado nuevo: sin ese hueco no parece que «no hace nada».
      await onCambio(antes)
      return true
    } catch (e) {
      setAviso((e as Error).message)
      return false
    } finally {
      setOcupado(false)
      setEnCurso(null)
      setConfirmar(null)
    }
  }

  const elegir = () => {
    setConfirmar(null)
    setAviso(null)
    setEligiendo(true)
  }

  const compartir = async () => {
    try {
      if (navigator.share) await navigator.share({ title: vista.aula.nombre, text: `Entra al aula con el código ${aula.codigo}`, url: enlace })
      else {
        await navigator.clipboard.writeText(enlace)
        setAviso('Enlace copiado')
      }
    } catch {
      // Compartir cancelado.
    }
  }

  if (escribiendo) {
    return (
      <EditorEjercicio
        catalogo={catalogo}
        inicial={escribiendo}
        ocupado={ocupado}
        error={aviso}
        onCancelar={() => {
          setAviso(null)
          setEscribiendo(null)
        }}
        onAgregar={async (propio) => {
          if (await hacer('agregar', { propio })) {
            guardarMiEjercicio(propio)
            setEscribiendo(null)
          }
        }}
      />
    )
  }

  return (
    <>
      {/* ─────────── Código ─────────── */}
      <section className="rounded-xl border border-borde bg-superficie px-4 py-4 text-center">
        <p className="rotulo">Código del aula</p>
        <p className="tabular mt-1 text-[36px] tracking-[0.18em] text-tinta">{aula.codigo}</p>
        <p className="mt-1 text-[12.5px] text-tinta-tenue">
          {vista.aula.publica ? 'Pública: la ven todos los que abren la app' : 'Privada: solo entra quien tenga el código'}
        </p>
        {abierta && (
          <button type="button" onClick={compartir} className={`${botonSecundario} mt-3 w-full`}>
            Compartir el enlace
          </button>
        )}
      </section>

      {soloCopia && (
        <p className="mt-4 rounded-xl px-4 py-3 text-[13.5px]" style={{ background: 'var(--color-nota)', color: 'var(--color-nota-tinta)' }}>
          El aula ya caducó en el servidor. Esto es la copia guardada en tu dispositivo, con los envíos y las notas.
        </p>
      )}
      {!soloCopia && vista.aula.estado === 'cerrada' && (
        <p className="mt-4 rounded-xl px-4 py-3 text-[13.5px]" style={{ background: 'var(--color-hueso)', color: 'var(--color-tinta-suave)' }}>
          Cerraste el aula: ya no se aceptan envíos. Puedes seguir calificando y publicar las soluciones.
        </p>
      )}
      {aviso && !eligiendo && !calificando && <p aria-live="polite" className="mt-3 px-1 text-[13px] text-tinta-suave">{aviso}</p>}
      {ofrecerCerrarEntrada && abierta && !vista.aula.entradaCerrada && (
        <button
          type="button"
          onClick={() => hacer('entrada', { cerrada: true })}
          disabled={ocupado}
          className="mt-1 min-h-9 px-1 text-[13px] font-medium text-tinta underline"
        >
          {enCurso === 'entrada' ? <Cargando texto="Cerrando la entrada…" /> : 'Cerrar la entrada ahora'}
        </button>
      )}

      {/* ─────────── El quiz ─────────── */}
      <section className="mt-6">
        <div className="mb-2 flex items-baseline justify-between gap-3 px-1">
          <p className="rotulo">
            {estado === 'preparando' ? 'Prepara el quiz' : estado === 'en-curso' ? 'Quiz en curso' : 'Quiz terminado'}
          </p>
          <p className="tabular text-[12.5px] text-tinta-tenue">
            {vista.ejercicios.length} {vista.ejercicios.length === 1 ? 'ejercicio' : 'ejercicios'}
            {vista.aula.iniciado !== null && ` · ${vista.aula.limiteMin ? `${vista.aula.limiteMin} min` : 'sin límite'}`}
          </p>
        </div>

        {vista.ejercicios.length === 0 ? (
          <p className="rounded-xl border border-dashed border-borde px-4 py-5 text-center text-[13.5px] text-tinta-tenue">
            Añade los ejercicios del quiz. Cuando lo empieces, ya no se podrán cambiar.
          </p>
        ) : (
          <ol className="overflow-hidden rounded-xl border border-borde bg-superficie">
            {vista.ejercicios.map((ej, i) => (
              <li key={ej.id} className="border-b border-borde last:border-b-0">
                <details className="group">
                  <summary className="tactil flex cursor-pointer list-none items-center gap-3 px-4 py-3 [&::-webkit-details-marker]:hidden">
                    <span className="tabular w-5 shrink-0 text-[13px] text-tinta-tenue">{i + 1}</span>
                    <span className="min-w-0 flex-1 truncate text-[14.5px] text-tinta">{ej.titulo}</span>
                    <span className="shrink-0 text-[12px] text-tinta-tenue">
                      {ej.solucion?.length ? `${ej.solucion.length} renglones` : 'Solo enunciado'}
                    </span>
                    <IconoChevron className="size-4 shrink-0 text-tinta-tenue transition-transform group-open:rotate-90" />
                  </summary>
                  <div className="border-t border-borde">
                    <Enunciado grupo={ej.grupo} titulo={ej.titulo} enunciado={ej.enunciado} datos={ej.datos} enTarjeta />
                    {preparando && (
                      <div className="px-4 pb-4">
                        <button
                          type="button"
                          onClick={() => hacer('quitar', { ejercicio: ej.id }, `quitar:${ej.id}`)}
                          disabled={ocupado}
                          className="min-h-9 text-[13px] font-medium disabled:opacity-40"
                          style={{ color: 'var(--color-baja-tinta)' }}
                        >
                          {enCurso === `quitar:${ej.id}` ? <Cargando texto="Quitando…" /> : 'Quitar del quiz'}
                        </button>
                      </div>
                    )}
                  </div>
                </details>
              </li>
            ))}
          </ol>
        )}

        {preparando && (
          <>
            <button
              type="button"
              onClick={elegir}
              disabled={vista.ejercicios.length >= MAX_EJERCICIOS}
              className={`${botonSecundario} mt-2 w-full`}
            >
              Añadir un ejercicio
            </button>

            <label className="mt-5 flex min-h-11 items-center justify-between gap-3 px-1 text-[14px] text-tinta">
              Tiempo para cada estudiante
              <select
                value={limite ?? ''}
                onChange={(e) => setLimite(e.target.value ? Number(e.target.value) : null)}
                className="min-h-11 rounded-xl border border-borde bg-superficie px-3 text-tinta outline-none focus:border-borde-fuerte"
              >
                {TIEMPOS.map((t) => (
                  <option key={t ?? 'sin'} value={t ?? ''}>{t ? `${t} minutos` : 'Sin límite'}</option>
                ))}
              </select>
            </label>

            {empezando ? (
              <p
                role="status"
                className="mt-3 flex min-h-12 items-center justify-center gap-2.5 rounded-xl text-[15px] font-medium"
                style={{ background: 'var(--color-sube)', color: 'var(--color-sube-tinta)' }}
              >
                <span className="size-4 animate-spin rounded-full border-2 border-current border-t-transparent motion-reduce:animate-none" aria-hidden />
                Empezando el quiz…
              </p>
            ) : confirmar === 'empezar' ? (
              <button
                type="button"
                autoFocus
                onClick={confirmado(() => hacer('empezar', { limiteMin: limite }))}
                onBlur={() => { if (!enCurso) setConfirmar(null) }}
                disabled={ocupado}
                className="tactil mt-3 w-full rounded-xl bg-tinta text-[15px] text-white"
              >
                Sí, empezar: ya no se podrán cambiar los ejercicios
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setConfirmar('empezar')}
                disabled={vista.ejercicios.length === 0}
                className={`${botonPrimario} mt-3 w-full`}
              >
                Empezar el quiz
              </button>
            )}
          </>
        )}
      </section>

      {/* ─────────── Envíos ─────────── */}
      {estado !== 'preparando' && (
        <section className="mt-6">
          {/* Deja claro el cambio de etapa: ya no se prepara, se recibe. */}
          <div
            className="mb-4 flex items-center gap-3 rounded-xl px-4 py-3"
            style={
              estado === 'en-curso'
                ? { background: 'var(--color-sube)', color: 'var(--color-sube-tinta)' }
                : { background: 'var(--color-hueso)', color: 'var(--color-tinta-suave)' }
            }
          >
            <span className="relative flex size-2.5 shrink-0" aria-hidden>
              {estado === 'en-curso' && (
                <span className="absolute inline-flex size-full rounded-full opacity-60 motion-safe:animate-ping" style={{ background: 'currentColor' }} />
              )}
              <span className="relative inline-flex size-2.5 rounded-full" style={{ background: 'currentColor' }} />
            </span>
            <span className="min-w-0 flex-1 text-[14px] font-medium">
              {estado === 'en-curso' ? 'Quiz en curso' : 'Quiz cerrado'}
              <span className="block text-[12.5px] font-normal opacity-80">
                {estado === 'en-curso'
                  ? `${vista.ejercicios.length} ${vista.ejercicios.length === 1 ? 'ejercicio' : 'ejercicios'} · ${
                      vista.aula.limiteMin ? `${vista.aula.limiteMin} min por estudiante` : 'sin límite de tiempo'
                    }`
                  : 'Ya no se aceptan envíos'}
              </span>
            </span>
          </div>
          <div className="mb-2 flex items-baseline justify-between gap-3 px-1">
            <p className="rotulo">Envíos</p>
            {activos.length > 0 && (
              <p className="text-[12.5px] text-tinta-tenue">
                <span className="tabular">{enviaron.length}</span> de <span className="tabular">{activos.length}</span> enviaron
              </p>
            )}
          </div>
          {vista.entregas.length === 0 ? (
            <p className="px-1 text-[13.5px] text-tinta-tenue">
              Todavía no ha llegado ningún quiz.
              {resolviendo > 0 && ` ${resolviendo} ${resolviendo === 1 ? 'persona lo está resolviendo' : 'personas lo están resolviendo'}.`}
            </p>
          ) : (
            <>
              <ul className="overflow-hidden rounded-xl border border-borde bg-superficie">
                {vista.entregas.map((e) => {
                  const sugerida = notaDelQuiz(vista.ejercicios, e.respuestas).promedio
                  const aMano = vista.ejercicios.filter((ej) => !ej.solucion?.length).length
                  return (
                    <li key={e.estudianteId} className="border-b border-borde last:border-b-0">
                      <button
                        type="button"
                        onClick={() => {
                          setAviso(null)
                          setCalificando(e.estudianteId)
                        }}
                        className="flex min-h-14 w-full items-center gap-3 px-4 py-2.5 text-left pulsable"
                      >
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-[14.5px] text-tinta">{e.nombre}</span>
                          <span className="tabular block text-[12.5px] text-tinta-tenue">
                            {formatoTiempo(e.segundos)} · {sugerida === null ? 'califícalo tú' : `sugerida ${formatoNota(sugerida)}${aMano ? ` · ${aMano} a mano` : ''}`}
                          </span>
                        </span>
                        {e.calificacion ? (
                          <span className="tabular shrink-0 rounded-md px-2 py-1 text-[14px] font-medium" style={{ background: 'var(--color-hueso)' }}>
                            {formatoNota(e.calificacion.nota)}
                          </span>
                        ) : (
                          <span className="shrink-0 text-[12.5px] font-medium text-tinta-suave">Calificar</span>
                        )}
                      </button>
                    </li>
                  )
                })}
              </ul>
              {resolviendo > 0 && (
                <p className="mt-2 px-1 text-[12.5px] text-tinta-tenue">
                  {resolviendo} {resolviendo === 1 ? 'persona lo sigue resolviendo' : 'personas lo siguen resolviendo'}.
                </p>
              )}
            </>
          )}

          {!soloCopia &&
            (vista.aula.solucionPublicada ? (
              <p className="mt-4 px-1 text-[13px] font-medium" style={{ color: 'var(--color-sube-tinta)' }}>
                ✓ Soluciones publicadas: las tienen todos en su dispositivo
              </p>
            ) : (
              <div className="mt-5 rounded-xl border border-dashed border-borde-fuerte bg-superficie p-4">
                <p className="text-[14px] font-medium text-tinta">Al terminar</p>
                <p className="mt-1 text-[13px] leading-relaxed text-tinta-suave">
                  Cuando hayas calificado, publica las soluciones: cada estudiante las guarda en su dispositivo con su nota.
                </p>
            {confirmar === 'publicar' ? (
              <button
                type="button"
                autoFocus
                onClick={confirmado(() => hacer('publicar'))}
                onBlur={() => { if (!enCurso) setConfirmar(null) }}
                disabled={ocupado}
                className="tactil mt-3 w-full rounded-xl bg-tinta text-[15px] text-white"
              >
                {enCurso === 'publicar' ? (
                  <Cargando texto="Publicando las soluciones…" />
                ) : estado === 'en-curso' && resolviendo > 0 ? (
                  'Sí, publicar: quien no ha enviado ya no podrá enviar'
                ) : (
                  'Sí, enviar las soluciones a todos'
                )}
              </button>
            ) : (
              <button type="button" onClick={() => setConfirmar('publicar')} className={`${botonSecundario} mt-3 w-full`}>
                Publicar las soluciones
              </button>
            )}
              </div>
            ))}
        </section>
      )}

      {/* ─────────── Personas ─────────── */}
      <section className="mt-6">
        <div className="mb-2 flex items-baseline justify-between gap-3 px-1">
          <p className="rotulo">En el aula</p>
          <p className="tabular text-[12.5px] text-tinta-tenue">{activos.length}</p>
        </div>
        {activos.length === 0 ? (
          <p className="rounded-xl border border-dashed border-borde px-4 py-5 text-center text-[13.5px] text-tinta-tenue">
            Aún no ha entrado nadie. Comparte el código {aula.codigo}.
          </p>
        ) : (
          <ul className="overflow-hidden rounded-xl border border-borde bg-superficie">
            {activos.map((m) => (
              <li key={m.id} className="flex min-h-12 items-center gap-3 border-b border-borde px-4 last:border-b-0">
                <span className="min-w-0 flex-1 truncate text-[14.5px] text-tinta">{m.nombre}</span>
                {abierta &&
                  (confirmar === `expulsar:${m.id}` ? (
                    <button
                      type="button"
                      autoFocus
                      onClick={confirmado(async () => {
                        if ((await hacer('expulsar', { estudiante: m.id })) && !vista.aula.entradaCerrada) {
                          setAviso(`${m.nombre} salió del aula. Puede volver a entrar con el código, como alguien nuevo, mientras no cierres la entrada.`)
                          setOfrecerCerrarEntrada(true)
                        }
                      })}
                      onBlur={() => { if (!enCurso) setConfirmar(null) }}
                      disabled={ocupado}
                      className="min-h-9 rounded-lg px-3 text-[13px] font-medium"
                      style={{ background: 'var(--color-baja)', color: 'var(--color-baja-tinta)' }}
                    >
                      {enCurso === 'expulsar' ? <Cargando texto="Sacando…" /> : 'Sacar del aula'}
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setConfirmar(`expulsar:${m.id}`)}
                      aria-label={`Sacar a ${m.nombre} del aula`}
                      className="min-h-9 px-1 text-[13px] text-tinta-tenue hover:text-tinta"
                    >
                      Sacar
                    </button>
                  ))}
              </li>
            ))}
          </ul>
        )}
        {abierta && (
          <label className="mt-3 flex min-h-11 items-center justify-between gap-3 px-1 text-[14px] text-tinta">
            {enCurso === 'entrada' ? <Cargando texto="Guardando…" /> : 'Cerrar la entrada a nuevas personas'}
            <input
              type="checkbox"
              checked={vista.aula.entradaCerrada}
              onChange={(e) => hacer('entrada', { cerrada: e.target.checked })}
              disabled={ocupado}
              className="size-5 accent-[var(--color-tinta)]"
            />
          </label>
        )}
      </section>

      {abierta && (
        <section className="mt-8">
          {confirmar === 'cerrar' ? (
            <button
              type="button"
              autoFocus
              onClick={confirmado(() => hacer('cerrar'))}
              onBlur={() => { if (!enCurso) setConfirmar(null) }}
              disabled={ocupado}
              className="tactil w-full rounded-xl text-[15px] font-medium"
              style={{ background: 'var(--color-baja)', color: 'var(--color-baja-tinta)' }}
            >
              {enCurso === 'cerrar' ? <Cargando texto="Cerrando el aula…" /> : 'Sí, cerrar el aula: no se aceptan más envíos'}
            </button>
          ) : (
            <button type="button" onClick={() => setConfirmar('cerrar')} className={`${botonSecundario} w-full`}>
              Cerrar el aula
            </button>
          )}
        </section>
      )}

      <SelectorEjercicio
        abierto={eligiendo}
        ocupado={ocupado}
        agregando={enCurso?.startsWith('agregar:') ? enCurso.slice('agregar:'.length) : null}
        error={eligiendo ? aviso : null}
        yaEnElQuiz={vista.ejercicios.map((e) => e.origenId)}
        lleno={vista.ejercicios.length >= MAX_EJERCICIOS}
        onCerrar={() => setEligiendo(false)}
        onPropio={(e) => {
          setEligiendo(false)
          setEscribiendo(e ?? { titulo: '', enunciado: '', filas: [], explicacion: '' })
        }}
        onElegir={(e) => {
          // Un doble toque no lo añade dos veces; el selector sigue abierto para añadir más.
          if (!ocupado) void hacer('agregar', { ejercicio: e.id }, `agregar:${e.id}`)
        }}
      />

      {calificando && entregaEnCalificacion && (
        <CalificarQuiz
          key={calificando}
          ejercicios={vista.ejercicios}
          entrega={entregaEnCalificacion}
          error={aviso}
          ocupado={ocupado}
          catalogo={catalogo}
          soloLectura={soloCopia}
          onSugerirIA={(ejercicio) =>
            apiAulas.accion<NotaIA>(aula.codigo, aula.clave, 'sugerir', { ejercicio, estudiante: calificando })
          }
          onCerrar={() => setCalificando(null)}
          onEmitir={async (nota, comentario, porEjercicio) => {
            if (await hacer('calificar', { estudiante: calificando, nota, comentario, porEjercicio })) setCalificando(null)
          }}
        />
      )}
    </>
  )
}

/* ─────────────────────────── Calificar un quiz ─────────────────────────── */

const aNumero = (t: string) => Number(t.replace(',', '.'))
const notaValida = (t: string) => t.trim() !== '' && Number.isFinite(aNumero(t)) && aNumero(t) >= 0 && aNumero(t) <= 5

/**
 * Cada ejercicio con la hoja del estudiante corregida y su nota (la automática o la que
 * ponga el docente); la del quiz es el promedio, que el docente puede cambiar antes de
 * emitirla.
 */
function CalificarQuiz({
  ejercicios,
  entrega,
  error,
  ocupado,
  catalogo,
  soloLectura,
  onSugerirIA,
  onCerrar,
  onEmitir,
}: {
  ejercicios: EjercicioDeAula[]
  entrega: EntregaQuiz
  /** El error de la última acción: dentro del diálogo, que deja inerte el resto. */
  error: string | null
  ocupado: boolean
  catalogo: Catalogo
  soloLectura: boolean
  /** Beta: nota y comentario propuestos por la IA para un ejercicio. */
  onSugerirIA: (ejercicio: string) => Promise<NotaIA>
  onCerrar: () => void
  onEmitir: (nota: number, comentario: string, porEjercicio: Record<string, number>) => void
}) {
  const automaticas = useMemo(() => notaDelQuiz(ejercicios, entrega.respuestas).porEjercicio, [ejercicios, entrega])
  // Sin nota guardada ni automática (ejercicio sin solución), el campo empieza vacío: la pone el docente.
  const [notas, setNotas] = useState<Record<string, string>>(() =>
    Object.fromEntries(
      ejercicios.map((e) => {
        const n = entrega.calificacion?.porEjercicio?.[e.id] ?? automaticas[e.id]
        return [e.id, n === null || n === undefined ? '' : formatoNota(n)]
      }),
    ),
  )
  /** La nota del quiz escrita a mano; null mientras sigue siendo el promedio. */
  const [manual, setManual] = useState<string | null>(() => {
    const c = entrega.calificacion
    if (!c) return null
    // Si la emitida era el promedio de las de cada ejercicio, sigue recalculándose.
    const guardadas = ejercicios.map((e) => c.porEjercicio?.[e.id] ?? automaticas[e.id] ?? 0)
    const promedio = guardadas.length ? Math.round((guardadas.reduce((s, n) => s + n, 0) / guardadas.length) * 10) / 10 : 0
    return c.nota === promedio ? null : formatoNota(c.nota)
  })
  const [comentario, setComentario] = useState(entrega.calificacion?.comentario ?? '')

  const todasValidas = ejercicios.every((e) => notaValida(notas[e.id] ?? ''))
  /** Null mientras falte la nota de algún ejercicio. */
  const promedio =
    todasValidas && ejercicios.length
      ? Math.round((ejercicios.reduce((s, e) => s + aNumero(notas[e.id]), 0) / ejercicios.length) * 10) / 10
      : null
  const nota = manual ?? (promedio === null ? '' : formatoNota(promedio))
  const valida = todasValidas && notaValida(nota)

  return (
    <Dialogo
      abierto
      titulo={entrega.nombre}
      onCerrar={onCerrar}
      pie={
        soloLectura ? undefined : (
          <>
            <button type="button" className={botonSecundario} onClick={onCerrar}>Cancelar</button>
            <button
              type="button"
              className={botonPrimario}
              disabled={!valida || ocupado}
              onClick={() => onEmitir(aNumero(nota), comentario, Object.fromEntries(ejercicios.map((e) => [e.id, aNumero(notas[e.id])])))}
            >
              {ocupado ? <Cargando texto="Guardando la nota…" /> : entrega.calificacion ? 'Corregir la nota' : 'Emitir la nota'}
            </button>
          </>
        )
      }
    >
      {error && (
        <p aria-live="polite" className="mb-3 rounded-lg px-3 py-2 text-[13px]" style={{ background: 'var(--color-error)', color: 'var(--color-error-tinta)' }}>
          {error}
        </p>
      )}
      <p className="tabular text-[13px] text-tinta-suave">Envió en {formatoTiempo(entrega.segundos)}</p>

      <ol className="mt-3 space-y-3">
        {ejercicios.map((ej, i) => (
          <NotaDeEjercicio
            key={ej.id}
            numero={i + 1}
            ejercicio={ej}
            filas={entrega.respuestas[ej.id] ?? []}
            automatica={automaticas[ej.id]}
            nota={notas[ej.id] ?? ''}
            soloLectura={soloLectura}
            catalogo={catalogo}
            onNota={(t) => setNotas((n) => ({ ...n, [ej.id]: t }))}
            onSugerirIA={() => onSugerirIA(ej.id)}
          />
        ))}
      </ol>

      {soloLectura ? (
        entrega.calificacion && (
          <p className="mt-4 text-[15px] text-tinta">
            Nota: <span className="tabular font-medium">{formatoNota(entrega.calificacion.nota)}</span>
            {entrega.calificacion.comentario && ` · ${entrega.calificacion.comentario}`}
          </p>
        )
      ) : (
        <>
          <label className="mt-5 block">
            <span className="rotulo">Nota del quiz, de 0 a 5</span>
            <span className="mt-2 flex items-center gap-2">
              <input
                value={nota}
                onChange={(e) => setManual(e.target.value.replace(/[^\d.,]/g, '').slice(0, 3))}
                inputMode="decimal"
                className="tabular min-h-12 w-24 rounded-xl border border-borde bg-superficie px-3 text-center text-[20px] text-tinta outline-none focus:border-borde-fuerte"
              />
              <span className="text-[13px] text-tinta-tenue">
                {promedio === null
                  ? 'Pon la nota de cada ejercicio (los que no tienen solución van a mano).'
                  : `Promedio de los ejercicios: ${formatoNota(promedio)}`}
              </span>
            </span>
          </label>
          {manual !== null && (
            <button type="button" onClick={() => setManual(null)} className="mt-1 min-h-9 text-[13px] font-medium text-tinta-suave underline">
              Usar el promedio
            </button>
          )}
          <label className="mt-4 block">
            <span className="rotulo">Comentario (opcional)</span>
            <textarea
              value={comentario}
              onChange={(e) => setComentario(e.target.value.slice(0, 500))}
              rows={2}
              className="mt-2 w-full resize-y rounded-xl border border-borde bg-superficie px-3.5 py-2.5 text-[15px] text-tinta outline-none focus:border-borde-fuerte"
            />
          </label>
        </>
      )}
    </Dialogo>
  )
}

function NotaDeEjercicio({
  numero,
  ejercicio,
  filas,
  automatica,
  nota,
  soloLectura,
  catalogo,
  onNota,
  onSugerirIA,
}: {
  numero: number
  ejercicio: EjercicioDeAula
  filas: Fila[]
  /** null si el ejercicio no tiene solución: no hay nota automática. */
  automatica: number | null
  nota: string
  soloLectura: boolean
  catalogo: Catalogo
  onNota: (nota: string) => void
  onSugerirIA: () => Promise<NotaIA>
}) {
  const conSolucion = Boolean(ejercicio.solucion?.length)
  const correccion = useMemo(() => corregir(ejercicio.solucion ?? [], filas), [ejercicio, filas])
  const [ia, setIa] = useState<{ pensando: boolean; comentario?: string; observacion?: string; error?: string }>({ pensando: false })

  const pedirIA = async () => {
    setIa({ pensando: true })
    try {
      const r = await onSugerirIA()
      onNota(formatoNota(r.nota))
      setIa({ pensando: false, comentario: r.comentario, observacion: r.observacion || undefined })
    } catch (e) {
      setIa({ pensando: false, error: (e as Error).message })
    }
  }

  return (
    <li className="rounded-xl border border-borde">
      <details className="group">
        <summary className="flex min-h-12 cursor-pointer list-none items-center gap-3 px-3 py-2 [&::-webkit-details-marker]:hidden">
          <span className="tabular w-5 shrink-0 text-[13px] text-tinta-tenue">{numero}</span>
          <span className="min-w-0 flex-1">
            <span className="block truncate text-[14px] text-tinta">{ejercicio.titulo}</span>
            <span className="tabular block text-[12px] text-tinta-tenue">
              {!filas.length
                ? 'Sin respuesta'
                : conSolucion
                  ? `${correccion.aciertos} de ${correccion.total} renglones bien · automática ${formatoNota(automatica ?? 0)}`
                  : 'Sin solución: califícalo tú'}
            </span>
          </span>
          <span className="tabular shrink-0 rounded-md px-2 py-1 text-[14px] font-medium" style={{ background: 'var(--color-hueso)' }}>
            {nota || '—'}
          </span>
          <IconoChevron className="size-4 shrink-0 text-tinta-tenue transition-transform group-open:rotate-90" />
        </summary>
        <div className="border-t border-borde px-1 pb-3 pt-2">
          {filas.length > 0 ? (
            <HojaAsiento filas={filas} onCambiar={() => {}} catalogo={catalogo} estados={conSolucion ? correccion.estados : undefined} bloqueada />
          ) : (
            <p className="px-2 py-2 text-[13px] text-tinta-tenue">No escribió nada en este ejercicio.</p>
          )}
          {!soloLectura && (
            <div className="mt-3 px-2">
              <label className="flex items-center gap-2 text-[13px] text-tinta-suave">
                Nota del ejercicio
                <input
                  value={nota}
                  onChange={(e) => onNota(e.target.value.replace(/[^\d.,]/g, '').slice(0, 3))}
                  inputMode="decimal"
                  aria-label={`Nota del ejercicio ${numero}`}
                  className="tabular min-h-10 w-16 rounded-lg border border-borde bg-superficie px-2 text-center text-[16px] text-tinta outline-none focus:border-borde-fuerte"
                />
              </label>
              {automatica !== null && nota !== formatoNota(automatica) && (
                <button type="button" onClick={() => onNota(formatoNota(automatica))} className="min-h-9 text-[13px] font-medium text-tinta-suave underline">
                  Volver a la automática
                </button>
              )}
              {filas.length > 0 && (
                <button
                  type="button"
                  onClick={pedirIA}
                  disabled={ia.pensando}
                  className="mt-1 flex min-h-10 items-center text-[13px] font-medium text-tinta-suave transition-colors hover:text-tinta disabled:opacity-50"
                >
                  {ia.pensando ? <Cargando texto="La IA está revisando…" /> : 'Sugerir nota con IA (beta)'}
                </button>
              )}
              {ia.error && <p className="text-[13px]" style={{ color: 'var(--color-baja-tinta)' }}>{ia.error}</p>}
              {ia.comentario && <p className="mt-1 text-[13px] leading-relaxed text-tinta-suave">IA: {ia.comentario}</p>}
              {ia.observacion && (
                <p className="mt-1 rounded-lg px-3 py-2 text-[13px] leading-relaxed" style={{ background: 'var(--color-nota)', color: 'var(--color-nota-tinta)' }}>
                  Para ti: {ia.observacion}
                </p>
              )}
            </div>
          )}
        </div>
      </details>
    </li>
  )
}

/* ─────────────────────────── Elegir los ejercicios ─────────────────────────── */

function SelectorEjercicio({
  abierto,
  ocupado,
  agregando,
  error,
  yaEnElQuiz,
  lleno,
  onCerrar,
  onElegir,
  onPropio,
}: {
  abierto: boolean
  ocupado: boolean
  /** El ejercicio que se está añadiendo ahora, para su cargador. */
  agregando: string | null
  error: string | null
  /** Ids de origen de los ejercicios que ya están en el quiz. */
  yaEnElQuiz: string[]
  lleno: boolean
  onCerrar: () => void
  onElegir: (e: EjercicioAsiento) => void
  /** Escribir uno nuevo (sin argumento) o revisar y reutilizar uno guardado. */
  onPropio: (e?: EjercicioPropio) => void
}) {
  const grupos = useMemo(() => gruposDeAsiento(), [])
  const mios = useMisEjercicios()
  const [texto, setTexto] = useState('')
  const plano = (t: string) => t.trim().toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
  const filtro = plano(texto)
  const coincide = (titulo: string) => !filtro || plano(titulo).includes(filtro)
  const misFiltrados = mios.filter((m) => coincide(m.titulo))

  return (
    <Dialogo abierto={abierto} titulo="Añadir al quiz" onCerrar={onCerrar}>
      <div className="-mx-5 -my-5">
        <div className="sticky top-0 z-10 border-b border-borde bg-superficie px-5 py-3">
          <div className="relative">
            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-tinta-tenue">
              <IconoLupa className="size-[18px]" />
            </span>
            <input
              type="search"
              value={texto}
              onChange={(e) => setTexto(e.target.value)}
              placeholder="Buscar: arriendo, nómina, IVA…"
              aria-label="Buscar un ejercicio"
              className="min-h-12 w-full rounded-xl border border-borde bg-superficie pl-10 pr-3 text-tinta outline-none placeholder:text-tinta-tenue focus:border-borde-fuerte"
            />
          </div>
          {(error || lleno) && (
            <p aria-live="polite" className="mt-2 text-[13px]" style={{ color: 'var(--color-error-tinta)' }}>
              {error ?? `El quiz ya tiene ${MAX_EJERCICIOS} ejercicios.`}
            </p>
          )}
        </div>
        {!filtro && (
          <div className="border-b border-borde px-5 py-3">
            <button type="button" onClick={() => onPropio()} disabled={lleno} className={`${botonSecundario} w-full`}>
              Escribir mi propio ejercicio
            </button>
          </div>
        )}
        {misFiltrados.length > 0 && (
          <div>
            <p className="rotulo bg-hueso px-5 py-2">Tus ejercicios</p>
            <ul>
              {misFiltrados.map((m) => (
                <li key={m.id} className="flex items-center border-b border-borde last:border-b-0">
                  <button
                    type="button"
                    onClick={() => onPropio(m)}
                    disabled={lleno}
                    className="flex min-h-12 min-w-0 flex-1 items-center gap-3 px-5 py-2.5 text-left pulsable disabled:opacity-50"
                  >
                    <span className="min-w-0 flex-1 truncate text-[14px] text-tinta">{m.titulo}</span>
                    <span className="shrink-0 text-[12px] text-tinta-tenue">{m.filas.length ? `${m.filas.length} renglones` : 'Solo enunciado'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => borrarMiEjercicio(m.id)}
                    aria-label={`Borrar «${m.titulo}»`}
                    className="tactil grid w-11 shrink-0 place-items-center text-[13px] text-tinta-tenue hover:text-tinta"
                  >
                    ×
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}
        {grupos.map((g) => {
          const lista = g.ejercicios.filter((e) => coincide(e.titulo))
          if (!lista.length) return null
          return (
            <div key={g.grupo}>
              <p className="rotulo bg-hueso px-5 py-2">{g.grupo}</p>
              <ul>
                {lista.map((e) => {
                  const puesto = yaEnElQuiz.includes(e.id)
                  return (
                    <li key={e.id} className="border-b border-borde last:border-b-0">
                      <button
                        type="button"
                        onClick={() => onElegir(e)}
                        disabled={ocupado || puesto || lleno}
                        className="flex min-h-12 w-full items-center gap-3 px-5 py-2.5 text-left pulsable disabled:opacity-50"
                      >
                        <span className="min-w-0 flex-1 text-[14px] leading-snug text-tinta">{e.titulo}</span>
                        <span className="shrink-0 text-[12px] text-tinta-tenue">
                          {agregando === e.id ? <Cargando texto="Añadiendo…" /> : puesto ? '✓ En el quiz' : `${e.solucion.length} renglones`}
                        </span>
                      </button>
                    </li>
                  )
                })}
              </ul>
            </div>
          )
        })}
      </div>
    </Dialogo>
  )
}
