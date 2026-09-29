'use client'

import { useEffect, useEffectEvent, useRef, useState } from 'react'
import type { Catalogo } from '@/lib/catalogo'
import { MARGEN_ENVIO_MS, formatoNota, formatoTiempo, type Respuestas, type VistaEstudiante } from '@/lib/aulas'
import { conRenglonLibre, estaVacia, type Fila } from '@/lib/practica'
import { apiAulas, ErrorRed, guardarBorrador, leerBorrador, type MiAula } from '@/lib/misAulas'
import HojaAsiento from './HojaAsiento'
import Enunciado from './Enunciado'
import TextoPlegado from './TextoPlegado'

const aFilas = (lineas: { codigo: string; columna: 'debe' | 'haber'; importe: number }[]): Fila[] =>
  lineas.map((l) => ({ codigo: l.codigo, debe: l.columna === 'debe' ? l.importe : null, haber: l.columna === 'haber' ? l.importe : null }))

/**
 * Lo que ve un estudiante en el aula: la espera mientras el docente prepara el quiz;
 * después todos los ejercicios, uno por pantalla, con su hoja y el tiempo; el envío del
 * quiz completo (una sola vez, o solo al acabarse el tiempo); su nota y, cuando el
 * docente las publica, las soluciones, que quedan guardadas en «De mis clases».
 */
export default function AulaEstudiante({
  aula,
  vista,
  catalogo,
  desfase,
  onCambio,
}: {
  aula: MiAula
  vista: VistaEstudiante
  catalogo: Catalogo
  /** Reloj del servidor menos el del dispositivo. */
  desfase: number
  /** Pide el estado al servidor tras enviar. */
  onCambio: () => void
}) {
  const { ejercicios, entrega } = vista
  /** Lo escrito en esta sesión; lo demás sale del borrador guardado en el dispositivo. */
  const [escritas, setEscritas] = useState<Respuestas>({})
  const [indice, setIndice] = useState(0)
  const [confirmando, setConfirmando] = useState(false)
  const [enviando, setEnviando] = useState(false)
  /** Enviado, pero la vista aún no lo trae: no se ofrece enviar otra vez. */
  const [enviado, setEnviado] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [reloj, setReloj] = useState(() => Date.now())
  const envioAutomatico = useRef(false)
  /** Cuándo apareció el botón de confirmar: un doble toque no debe confirmar sin querer. */
  const confirmarDesde = useRef(0)

  const cerrada = vista.aula.estado === 'cerrada'
  const ahora = reloj + desfase
  const restante = vista.fin !== null ? Math.max(0, (vista.fin - ahora) / 1000) : null
  const agotado = restante !== null && restante <= 0
  /** Pasado el margen el servidor ya no acepta el envío. */
  const fueraDePlazo = vista.fin !== null && ahora > vista.fin + MARGEN_ENVIO_MS
  const sinEnvios = cerrada || vista.aula.solucionPublicada || fueraDePlazo
  const resolviendo = ejercicios.length > 0 && !entrega && !enviado && !sinEnvios

  // El tiempo corre en pantalla mientras resuelve; el que cuenta es el del servidor.
  useEffect(() => {
    if (!resolviendo) return
    const t = setInterval(() => setReloj(Date.now()), 1000)
    return () => clearInterval(t)
  }, [resolviendo])

  const filasDe = (id: string): Fila[] => escritas[id] ?? conRenglonLibre(leerBorrador(aula.codigo, id) ?? [])
  const cambiar = (id: string, filas: Fila[]) => {
    setEscritas((e) => ({ ...e, [id]: filas }))
    guardarBorrador(aula.codigo, id, filas)
  }
  const conRespuesta = ejercicios.filter((e) => filasDe(e.id).some((f) => !estaVacia(f))).length

  /** Envía el quiz; devuelve si ya no hay que reintentar (enviado, o rechazado por el servidor). */
  const enviar = async () => {
    setEnviando(true)
    setError(null)
    try {
      const respuestas = Object.fromEntries(ejercicios.map((e) => [e.id, filasDe(e.id).filter((f) => !estaVacia(f))]))
      await apiAulas.accion(aula.codigo, aula.clave, 'entregar', { respuestas })
      setEnviado(true)
      onCambio()
      return true
    } catch (e) {
      setError((e as Error).message)
      // 409: ya estaba enviado, o se acabó el plazo; la vista lo dirá. Sin red, se reintenta.
      if (e instanceof ErrorRed && e.estado === 409) {
        onCambio()
        return true
      }
      return false
    } finally {
      setEnviando(false)
      setConfirmando(false)
    }
  }

  // Se acabó el tiempo: se envía lo que haya y, si falla la red, se reintenta dentro del margen.
  const enviarAlAgotarse = useEffectEvent(async () => {
    while (!(await enviar())) {
      await new Promise((r) => setTimeout(r, 5000))
      if (vista.fin === null || Date.now() + desfase > vista.fin + MARGEN_ENVIO_MS) return
    }
  })
  useEffect(() => {
    if (!agotado || !resolviendo || envioAutomatico.current) return
    envioAutomatico.current = true
    void enviarAlAgotarse()
  }, [agotado, resolviendo])

  const pedirConfirmacion = () => {
    confirmarDesde.current = Date.now()
    setConfirmando(true)
  }

  /* ─────────── Antes de empezar ─────────── */
  if (vista.quiz.estado === 'preparando' || (cerrada && !ejercicios.length)) {
    return (
      <div className="px-2 py-10 text-center sm:px-0">
        <p className="text-[17px] text-tinta">
          {cerrada ? 'El aula se cerró.' : `${vista.aula.docente} está preparando el quiz…`}
        </p>
        <p className="mt-2 text-[13.5px] text-tinta-tenue">
          {vista.miembros} {vista.miembros === 1 ? 'persona' : 'personas'} en el aula
          {!cerrada && ' · empezará en cuanto el docente lo abra'}
        </p>
      </div>
    )
  }

  /* ─────────── Enviado, cerrado o con las soluciones ─────────── */
  if (!resolviendo) {
    const calificacion = entrega?.calificacion ?? null
    return (
      <>
        <section className="px-2 sm:px-0">
          <p className="rotulo">Quiz · {vista.aula.nombre}</p>
          <h1 className="editorial mt-2 text-[26px] leading-tight text-tinta lg:text-4xl">
            {entrega || enviado
              ? 'Quiz enviado'
              : cerrada
                ? 'El aula se cerró antes de que enviaras'
                : vista.aula.solucionPublicada
                  ? 'El docente publicó las soluciones antes de que enviaras'
                  : 'Se acabó el tiempo antes de que se enviara el quiz'}
          </h1>
          {entrega && (
            <p className="tabular mt-2 text-[13.5px] text-tinta-suave">
              En {formatoTiempo(entrega.segundos)} · {Object.keys(entrega.respuestas).length} de {ejercicios.length} ejercicios con respuesta
            </p>
          )}
        </section>

        {calificacion ? (
          <section className="mt-4 rounded-xl border border-borde bg-superficie px-4 py-4">
            <p className="rotulo">Tu nota</p>
            <p className="tabular mt-1 text-[34px] leading-none text-tinta">
              {formatoNota(calificacion.nota)}
              <span className="text-[16px] text-tinta-tenue"> / 5</span>
            </p>
            {calificacion.comentario && <p className="mt-2 text-[14.5px] leading-relaxed text-tinta-suave">{calificacion.comentario}</p>}
          </section>
        ) : (
          (entrega || enviado) && (
            <p className="mt-4 px-2 text-[13.5px] text-tinta-tenue sm:px-0">
              {vista.aula.docente} te pondrá la nota cuando lo revise. Te llegará aquí.
            </p>
          )
        )}

        <ol className="mt-6 space-y-6">
          {ejercicios.map((ej, i) => {
            const mias = entrega?.respuestas[ej.id] ?? []
            const nota = calificacion?.porEjercicio?.[ej.id]
            return (
              <li key={ej.id}>
                <div className="flex items-baseline justify-between gap-3 px-2 sm:px-0">
                  <p className="rotulo">Ejercicio {i + 1}</p>
                  {nota !== undefined && <p className="tabular text-[13px] text-tinta-suave">{formatoNota(nota)} / 5</p>}
                </div>
                <Enunciado grupo={ej.grupo} titulo={ej.titulo} enunciado={ej.enunciado} datos={ej.datos} />
                {entrega && (
                  <>
                    <p className="rotulo mb-2 mt-4 px-2 sm:px-0">Tu respuesta</p>
                    {mias.length ? (
                      <HojaAsiento filas={mias} onCambiar={() => {}} catalogo={catalogo} bloqueada />
                    ) : (
                      <p className="px-2 text-[13.5px] text-tinta-tenue sm:px-0">No escribiste nada en este ejercicio.</p>
                    )}
                  </>
                )}
                {ej.solucionPublicada && ej.solucion && (
                  <>
                    <p className="rotulo mb-2 mt-4 px-2 sm:px-0">Solución</p>
                    <HojaAsiento filas={aFilas(ej.solucion)} onCambiar={() => {}} catalogo={catalogo} bloqueada />
                    {ej.explicacion && (
                      <div className="mt-3 px-2 text-[14.5px] leading-relaxed text-tinta-suave sm:px-0">
                        <TextoPlegado texto={ej.explicacion} />
                      </div>
                    )}
                  </>
                )}
              </li>
            )
          })}
        </ol>
        {vista.aula.solucionPublicada && (
          <p className="mt-4 px-2 text-[12.5px] text-tinta-tenue sm:px-0">
            Guardado en «De mis clases» (Entrenar › El asiento) para repasarlo cuando termine el aula.
          </p>
        )}
      </>
    )
  }

  /* ─────────── Resolviendo ─────────── */
  const numero = Math.min(indice, ejercicios.length - 1)
  const ej = ejercicios[numero]
  const faltan = ejercicios.length - conRespuesta

  return (
    <>
      <div className="flex items-center justify-between gap-3 px-2 sm:px-0">
        <p className="tabular text-[13px] text-tinta-suave">
          {restante !== null
            ? `Te quedan ${formatoTiempo(restante)}`
            : `Tiempo: ${formatoTiempo(vista.recibido ? (ahora - vista.recibido) / 1000 : 0)}`}
        </p>
        <p className="tabular text-[13px] text-tinta-tenue">
          {conRespuesta} de {ejercicios.length} con respuesta
        </p>
      </div>

      {/* Saltar a cualquier ejercicio. */}
      <nav aria-label="Ejercicios del quiz" className="mt-3 flex flex-wrap gap-1.5 px-2 sm:px-0">
        {ejercicios.map((e, i) => {
          const lleno = filasDe(e.id).some((f) => !estaVacia(f))
          return (
            <button
              key={e.id}
              type="button"
              onClick={() => setIndice(i)}
              aria-current={i === numero ? 'step' : undefined}
              aria-label={`Ejercicio ${i + 1}${lleno ? ', con respuesta' : ''}`}
              className={[
                'tabular grid size-10 place-items-center rounded-lg border text-[14px] transition-colors',
                i === numero
                  ? 'border-tinta bg-tinta text-white'
                  : lleno
                    ? 'border-borde-fuerte bg-hueso text-tinta'
                    : 'border-borde bg-superficie text-tinta-suave',
              ].join(' ')}
            >
              {i + 1}
            </button>
          )
        })}
      </nav>

      <div className="mt-5">
        <Enunciado
          grupo={`Ejercicio ${numero + 1} de ${ejercicios.length} · ${ej.grupo}`}
          titulo={ej.titulo}
          enunciado={ej.enunciado}
          datos={ej.datos}
        />
      </div>

      <section className="mt-4">
        <HojaAsiento key={ej.id} filas={filasDe(ej.id)} onCambiar={(f) => cambiar(ej.id, f)} catalogo={catalogo} />
      </section>

      <div className="mt-4 grid grid-cols-2 gap-2 px-2 sm:px-0">
        <button
          type="button"
          onClick={() => setIndice(numero - 1)}
          disabled={numero === 0}
          className="tactil rounded-xl border border-borde bg-superficie text-[14.5px] text-tinta disabled:opacity-30"
        >
          Anterior
        </button>
        <button
          type="button"
          onClick={() => setIndice(numero + 1)}
          disabled={numero === ejercicios.length - 1}
          className="tactil rounded-xl border border-borde bg-superficie text-[14.5px] text-tinta disabled:opacity-30"
        >
          Siguiente
        </button>
      </div>

      <div className="sticky bottom-0 -mx-3 mt-5 border-t border-borde bg-lienzo px-4 pt-3 sm:-mx-5" style={{ paddingBottom: 'calc(0.75rem + var(--seguro-abajo))' }}>
        {confirmando ? (
          <button
            type="button"
            autoFocus
            onClick={() => {
              if (Date.now() - confirmarDesde.current > 400) void enviar()
            }}
            onBlur={() => !enviando && setConfirmando(false)}
            disabled={enviando}
            className="tactil w-full rounded-xl bg-tinta text-[15px] text-white disabled:opacity-50"
          >
            {enviando
              ? 'Enviando…'
              : faltan > 0
                ? `Sí, enviar con ${faltan} sin responder: no podrás cambiarlo`
                : 'Sí, enviar el quiz: no podrás cambiarlo'}
          </button>
        ) : (
          <button
            type="button"
            onClick={pedirConfirmacion}
            disabled={enviando || (conRespuesta === 0 && !agotado)}
            className="tactil w-full rounded-xl bg-tinta text-[15px] text-white transition-opacity active:bg-[#3d4347] disabled:opacity-30"
          >
            {enviando ? 'Enviando…' : conRespuesta === 0 ? 'Escribe al menos un asiento' : 'Enviar el quiz'}
          </button>
        )}
        {error && <p className="mt-2 text-center text-[13px]" style={{ color: 'var(--color-baja-tinta)' }}>{error}</p>}
      </div>
    </>
  )
}
