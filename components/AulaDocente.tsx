'use client'

import { useMemo, useState } from 'react'
import type { Catalogo } from '@/lib/catalogo'
import { formatoNota, formatoTiempo, notaSugerida, type EjercicioPropio, type EntregaVisible, type VistaDocente } from '@/lib/aulas'
import { corregir, gruposDeAsiento, type EjercicioAsiento } from '@/lib/practica'
import { apiAulas, borrarMiEjercicio, guardarMiEjercicio, useMisEjercicios, type MiAula } from '@/lib/misAulas'
import type { NotaIA } from '@/lib/calificacionIA'
import Dialogo, { botonPrimario, botonSecundario } from './Dialogo'
import HojaAsiento from './HojaAsiento'
import Enunciado from './Enunciado'
import EditorEjercicio from './EditorEjercicio'
import { IconoChevron, IconoLupa } from './Iconos'

type EjercicioVisto = VistaDocente['ejercicios'][number]

/**
 * El tablero de quien creó el aula: compartir el código, ver quién está, lanzar un
 * ejercicio, seguir las entregas que llegan (ordenadas por tiempo, con la corrección
 * automática como sugerencia), calificar, publicar la solución y cerrar.
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
  onCambio: () => void
}) {
  const [eligiendo, setEligiendo] = useState(false)
  /** Qué entrega se abrió: se guarda la referencia, no la copia, para ver siempre la última. */
  const [calificando, setCalificando] = useState<{ ejercicio: string; estudiante: string; enviada: number } | null>(null)
  const [confirmar, setConfirmar] = useState<string | null>(null)
  const [aviso, setAviso] = useState<string | null>(null)
  const [ocupado, setOcupado] = useState(false)
  /** Ejercicio propio que se está escribiendo (vacío para uno nuevo). */
  const [escribiendo, setEscribiendo] = useState<EjercicioPropio | null>(null)

  const abierta = vista.aula.estado === 'abierta' && !soloCopia
  const actual = vista.ejercicios.at(-1) ?? null
  const anteriores = vista.ejercicios.slice(0, -1).reverse()
  const activos = vista.miembros.filter((m) => !m.expulsado)
  const enviaron = actual ? actual.entregas.filter((e) => activos.some((m) => m.id === e.estudianteId)).length : 0
  const abrirEntrega = (ejercicio: EjercicioVisto, e: EntregaVisible) => {
    setAviso(null)
    setCalificando({ ejercicio: ejercicio.id, estudiante: e.estudianteId, enviada: e.enviada })
  }
  const enCalificacion = calificando && vista.ejercicios.find((e) => e.id === calificando.ejercicio)
  const entregaEnCalificacion = enCalificacion?.entregas.find((e) => e.estudianteId === calificando?.estudiante)
  const elegir = () => {
    setConfirmar(null)
    setAviso(null)
    setEligiendo(true)
  }
  const enlace = typeof window === 'undefined' ? '' : `${window.location.origin}/#aula/${aula.codigo}`

  const hacer = async (accion: string, datos: Record<string, unknown> = {}) => {
    setOcupado(true)
    setAviso(null)
    try {
      await apiAulas.accion(aula.codigo, aula.clave, accion, datos)
      onCambio()
      return true
    } catch (e) {
      setAviso((e as Error).message)
      return false
    } finally {
      setOcupado(false)
      setConfirmar(null)
    }
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
        onCancelar={() => setEscribiendo(null)}
        onLanzar={async (propio) => {
          if (await hacer('lanzar', { propio })) {
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
          El aula ya caducó en el servidor. Esto es la copia guardada en tu dispositivo, con las entregas y las notas.
        </p>
      )}
      {!soloCopia && vista.aula.estado === 'cerrada' && (
        <p className="mt-4 rounded-xl px-4 py-3 text-[13.5px]" style={{ background: 'var(--color-hueso)', color: 'var(--color-tinta-suave)' }}>
          Cerraste el aula: ya no se aceptan envíos. Puedes seguir calificando y publicar la solución.
        </p>
      )}
      {aviso && <p aria-live="polite" className="mt-3 px-1 text-[13px] text-tinta-suave">{aviso}</p>}

      {/* ─────────── Ejercicio en curso ─────────── */}
      <section className="mt-6">
        <div className="mb-2 flex items-baseline justify-between gap-3 px-1">
          <p className="rotulo">{actual ? 'Ejercicio en curso' : 'Ejercicio'}</p>
          {actual && activos.length > 0 && (
            <p className="text-[12.5px] text-tinta-tenue">
              <span className="tabular">{enviaron}</span> de <span className="tabular">{activos.length}</span> enviaron
            </p>
          )}
        </div>

        {!actual ? (
          <button type="button" onClick={elegir} disabled={!abierta} className={`${botonPrimario} w-full`}>
            Lanzar un ejercicio
          </button>
        ) : (
          <Ejercicio
            // Uno nuevo empieza sin la confirmación de publicar a medias del anterior.
            key={actual.id}
            ejercicio={actual}
            abierta={!soloCopia}
            onCalificar={(entrega) => abrirEntrega(actual, entrega)}
            onPublicar={() => hacer('publicar', { ejercicio: actual.id })}
            ocupado={ocupado}
          />
        )}
        {actual && abierta && (
          <button type="button" onClick={elegir} className={`${botonSecundario} mt-2 w-full`}>
            Lanzar otro ejercicio
          </button>
        )}
      </section>

      {anteriores.length > 0 && (
        <section className="mt-6">
          <p className="rotulo mb-2 px-1">Ejercicios anteriores</p>
          {anteriores.map((ej) => (
            <details key={ej.id} className="group mb-2 overflow-hidden rounded-xl border border-borde bg-superficie">
              <summary className="tactil flex cursor-pointer list-none items-center gap-3 px-4 py-3 [&::-webkit-details-marker]:hidden">
                <span className="min-w-0 flex-1 truncate text-[14.5px] text-tinta">{ej.titulo}</span>
                <span className="tabular text-[12px] text-tinta-tenue">{ej.entregas.length} entregas</span>
                <IconoChevron className="size-4 text-tinta-tenue transition-transform group-open:rotate-90" />
              </summary>
              <div className="border-t border-borde p-3">
                <Ejercicio
                  ejercicio={ej}
                  abierta={!soloCopia}
                  onCalificar={(entrega) => abrirEntrega(ej, entrega)}
                  onPublicar={() => hacer('publicar', { ejercicio: ej.id })}
                  ocupado={ocupado}
                  compacto
                />
              </div>
            </details>
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
                      onClick={async () => {
                        if ((await hacer('expulsar', { estudiante: m.id })) && !vista.aula.entradaCerrada) {
                          setAviso(`${m.nombre} salió del aula. Puede volver a entrar con el código mientras no cierres la entrada.`)
                        }
                      }}
                      onBlur={() => setConfirmar(null)}
                      className="min-h-9 rounded-lg px-3 text-[13px] font-medium"
                      style={{ background: 'var(--color-baja)', color: 'var(--color-baja-tinta)' }}
                    >
                      Sacar del aula
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
            Cerrar la entrada a nuevas personas
            <input
              type="checkbox"
              checked={vista.aula.entradaCerrada}
              onChange={(e) => hacer('entrada', { cerrada: e.target.checked })}
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
              onClick={() => hacer('cerrar')}
              onBlur={() => setConfirmar(null)}
              className="tactil w-full rounded-xl text-[15px] font-medium"
              style={{ background: 'var(--color-baja)', color: 'var(--color-baja-tinta)' }}
            >
              Sí, cerrar el aula: no se aceptan más envíos
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
        error={eligiendo ? aviso : null}
        onCerrar={() => setEligiendo(false)}
        onPropio={(e) => {
          setEligiendo(false)
          setEscribiendo(e ?? { titulo: '', enunciado: '', filas: [], explicacion: '' })
        }}
        onElegir={async (e) => {
          // Un doble toque no lanza dos veces.
          if (ocupado) return
          if (await hacer('lanzar', { ejercicio: e.id })) setEligiendo(false)
        }}
      />

      {calificando && enCalificacion && entregaEnCalificacion && (
        <CalificarEntrega
          // Si el estudiante reenvía con el diálogo abierto, se rehace con la entrega nueva.
          key={`${calificando.ejercicio}:${calificando.estudiante}:${entregaEnCalificacion.enviada}`}
          ejercicio={enCalificacion}
          entrega={entregaEnCalificacion}
          reenviada={entregaEnCalificacion.enviada !== calificando.enviada}
          error={aviso}
          ocupado={ocupado}
          catalogo={catalogo}
          soloLectura={soloCopia}
          onSugerirIA={() =>
            apiAulas.accion<NotaIA>(aula.codigo, aula.clave, 'sugerir', {
              ejercicio: calificando.ejercicio, estudiante: calificando.estudiante,
            })
          }
          onCerrar={() => setCalificando(null)}
          onGuardar={async (nota, comentario) => {
            if (
              await hacer('calificar', {
                ejercicio: calificando.ejercicio, estudiante: calificando.estudiante, nota, comentario,
                // La entrega que se está viendo: si llegó otra, el servidor no la califica a ciegas.
                enviada: entregaEnCalificacion.enviada,
              })
            ) setCalificando(null)
          }}
        />
      )}
    </>
  )
}

/* ─────────────────────────── Un ejercicio y sus entregas ─────────────────────────── */

function Ejercicio({
  ejercicio,
  abierta,
  onCalificar,
  onPublicar,
  ocupado,
  compacto = false,
}: {
  ejercicio: EjercicioVisto
  abierta: boolean
  onCalificar: (e: EntregaVisible) => void
  onPublicar: () => void
  ocupado: boolean
  compacto?: boolean
}) {
  const [confirmar, setConfirmar] = useState(false)
  return (
    <div>
      {!compacto && (
        <div className="overflow-hidden rounded-xl border border-borde bg-superficie">
          <Enunciado grupo={ejercicio.grupo} titulo={ejercicio.titulo} enunciado={ejercicio.enunciado} datos={ejercicio.datos} enTarjeta />
        </div>
      )}

      {ejercicio.entregas.length === 0 ? (
        <p className="mt-3 px-1 text-[13.5px] text-tinta-tenue">
          Todavía no ha llegado ninguna entrega.
          {ejercicio.recibidos > 0 &&
            ` ${ejercicio.recibidos} ${ejercicio.recibidos === 1 ? 'persona lo está resolviendo' : 'personas lo están resolviendo'}.`}
        </p>
      ) : (
        <ul className="mt-3 overflow-hidden rounded-xl border border-borde bg-superficie">
          {ejercicio.entregas.map((e) => {
            const c = corregir(ejercicio.solucion ?? [], e.filas)
            return (
              <li key={e.estudianteId} className="border-b border-borde last:border-b-0">
                <button type="button" onClick={() => onCalificar(e)} className="flex min-h-14 w-full items-center gap-3 px-4 py-2.5 text-left pulsable">
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[14.5px] text-tinta">{e.nombre}</span>
                    <span className="tabular block text-[12.5px] text-tinta-tenue">
                      {formatoTiempo(e.segundos)} · {c.aciertos} de {c.total} renglones bien
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
      )}

      {abierta &&
        (ejercicio.solucionPublicada ? (
          <p className="mt-3 px-1 text-[13px] font-medium" style={{ color: 'var(--color-sube-tinta)' }}>
            ✓ Solución publicada: la tienen todos en su dispositivo
          </p>
        ) : confirmar ? (
          <button
            type="button"
            autoFocus
            onClick={onPublicar}
            onBlur={() => setConfirmar(false)}
            disabled={ocupado}
            className="tactil mt-3 w-full rounded-xl bg-tinta text-[15px] text-white"
          >
            Sí, enviar la solución a todos
          </button>
        ) : (
          <button type="button" onClick={() => setConfirmar(true)} className={`${botonSecundario} mt-3 w-full`}>
            Publicar la solución
          </button>
        ))}
    </div>
  )
}

/* ─────────────────────────── Calificar ─────────────────────────── */

function CalificarEntrega({
  ejercicio,
  entrega,
  reenviada,
  error,
  ocupado,
  catalogo,
  soloLectura,
  onSugerirIA,
  onCerrar,
  onGuardar,
}: {
  ejercicio: EjercicioVisto
  entrega: EntregaVisible
  /** Llegó otra entrega del mismo estudiante mientras el diálogo estaba abierto. */
  reenviada: boolean
  /** El error de la última acción: dentro del diálogo, que deja inerte el resto. */
  error: string | null
  ocupado: boolean
  catalogo: Catalogo
  soloLectura: boolean
  /** Beta: nota y comentario propuestos por la IA, que el docente revisa antes de guardar. */
  onSugerirIA: () => Promise<NotaIA>
  onCerrar: () => void
  onGuardar: (nota: number, comentario: string) => void
}) {
  const correccion = useMemo(() => corregir(ejercicio.solucion ?? [], entrega.filas), [ejercicio, entrega])
  const sugerida = notaSugerida(correccion)
  const [nota, setNota] = useState(() => formatoNota(entrega.calificacion?.nota ?? sugerida))
  const [comentario, setComentario] = useState(entrega.calificacion?.comentario ?? '')
  const [ia, setIa] = useState<{ pensando: boolean; observacion?: string; error?: string }>({ pensando: false })

  const pedirIA = async () => {
    setIa({ pensando: true })
    try {
      const r = await onSugerirIA()
      setNota(formatoNota(r.nota))
      setComentario(r.comentario)
      setIa({ pensando: false, observacion: r.observacion || undefined })
    } catch (e) {
      setIa({ pensando: false, error: (e as Error).message })
    }
  }
  const valor = Number(nota.replace(',', '.'))
  const valida = nota.trim() !== '' && Number.isFinite(valor) && valor >= 0 && valor <= 5

  return (
    <Dialogo
      abierto
      titulo={entrega.nombre}
      onCerrar={onCerrar}
      pie={
        soloLectura ? undefined : (
          <>
            <button type="button" className={botonSecundario} onClick={onCerrar}>Cancelar</button>
            <button type="button" className={botonPrimario} disabled={!valida || ocupado} onClick={() => onGuardar(valor, comentario)}>
              Guardar nota
            </button>
          </>
        )
      }
    >
      {reenviada && (
        <p className="mb-3 rounded-lg px-3 py-2 text-[13px]" style={{ background: 'var(--color-nota)', color: 'var(--color-nota-tinta)' }}>
          Volvió a enviar su asiento mientras lo revisabas: esta es la entrega nueva.
        </p>
      )}
      {error && (
        <p aria-live="polite" className="mb-3 rounded-lg px-3 py-2 text-[13px]" style={{ background: 'var(--color-error)', color: 'var(--color-error-tinta)' }}>
          {error}
        </p>
      )}
      <p className="tabular text-[13px] text-tinta-suave">
        Envió en {formatoTiempo(entrega.segundos)} · {correccion.aciertos} de {correccion.total} renglones bien
        {correccion.faltan.length > 0 && ` · le faltan ${correccion.faltan.length}`}
      </p>
      <div className="-mx-2 mt-3">
        <HojaAsiento filas={entrega.filas} onCambiar={() => {}} catalogo={catalogo} estados={correccion.estados} bloqueada />
      </div>

      {!soloLectura && (
        <>
          <label className="mt-5 block">
            <span className="rotulo">Nota de 0 a 5</span>
            <span className="mt-2 flex items-center gap-2">
              <input
                value={nota}
                onChange={(e) => setNota(e.target.value.replace(/[^\d.,]/g, '').slice(0, 3))}
                inputMode="decimal"
                className="tabular min-h-12 w-24 rounded-xl border border-borde bg-superficie px-3 text-center text-[20px] text-tinta outline-none focus:border-borde-fuerte"
              />
              <span className="text-[13px] text-tinta-tenue">Sugerida por la corrección: {formatoNota(sugerida)}</span>
            </span>
          </label>
          <button
            type="button"
            onClick={pedirIA}
            disabled={ia.pensando}
            className="mt-3 flex min-h-10 items-center text-[13px] font-medium text-tinta-suave transition-colors hover:text-tinta disabled:opacity-50"
          >
            {ia.pensando ? 'La IA está revisando la entrega…' : 'Sugerir nota y comentario con IA (beta)'}
          </button>
          {ia.error && <p className="text-[13px]" style={{ color: 'var(--color-baja-tinta)' }}>{ia.error}</p>}
          {ia.observacion && (
            <p className="mt-1 rounded-lg px-3 py-2 text-[13px] leading-relaxed" style={{ background: 'var(--color-nota)', color: 'var(--color-nota-tinta)' }}>
              Para ti: {ia.observacion}
            </p>
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
      {soloLectura && entrega.calificacion && (
        <p className="mt-4 text-[15px] text-tinta">
          Nota: <span className="tabular font-medium">{formatoNota(entrega.calificacion.nota)}</span>
          {entrega.calificacion.comentario && ` · ${entrega.calificacion.comentario}`}
        </p>
      )}
    </Dialogo>
  )
}

/* ─────────────────────────── Elegir el ejercicio ─────────────────────────── */

function SelectorEjercicio({
  abierto,
  ocupado,
  error,
  onCerrar,
  onElegir,
  onPropio,
}: {
  abierto: boolean
  ocupado: boolean
  error: string | null
  onCerrar: () => void
  onElegir: (e: EjercicioAsiento) => void
  /** Escribir uno nuevo (sin argumento) o revisar y relanzar uno guardado. */
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
    <Dialogo abierto={abierto} titulo="Lanzar un ejercicio" onCerrar={onCerrar}>
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
          {error && (
            <p aria-live="polite" className="mt-2 text-[13px]" style={{ color: 'var(--color-error-tinta)' }}>{error}</p>
          )}
        </div>
        {!filtro && (
          <div className="border-b border-borde px-5 py-3">
            <button type="button" onClick={() => onPropio()} className={`${botonSecundario} w-full`}>
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
                    <button type="button" onClick={() => onPropio(m)} className="flex min-h-12 min-w-0 flex-1 items-center gap-3 px-5 py-2.5 text-left pulsable">
                      <span className="min-w-0 flex-1 truncate text-[14px] text-tinta">{m.titulo}</span>
                      <span className="shrink-0 text-[12px] text-tinta-tenue">{m.filas.length} renglones</span>
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
                {lista.map((e) => (
                  <li key={e.id} className="border-b border-borde last:border-b-0">
                    <button
                      type="button"
                      onClick={() => onElegir(e)}
                      disabled={ocupado}
                      className="flex min-h-12 w-full items-center gap-3 px-5 py-2.5 text-left pulsable disabled:opacity-50"
                    >
                      <span className="min-w-0 flex-1 text-[14px] leading-snug text-tinta">{e.titulo}</span>
                      <span className="shrink-0 text-[12px] text-tinta-tenue">{e.solucion.length} renglones</span>
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )
        })}
      </div>
    </Dialogo>
  )
}
