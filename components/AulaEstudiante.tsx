'use client'

import { useEffect, useEffectEvent, useRef, useState } from 'react'
import type { Catalogo } from '@/lib/catalogo'
import { MARGEN_ENVIO_MS, formatoNota, formatoTiempo, type Respuestas, type VistaEstudiante } from '@/lib/aulas'
import { conRenglonLibre, corregir, estaVacia, type Fila } from '@/lib/practica'
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

        {(entrega || enviado) && (
          <Seguimiento enviado calificado={Boolean(calificacion)} soluciones={vista.aula.solucionPublicada} />
        )}

        {calificacion ? (
          // Llegó la nota: tarjeta verde, distinta de la espera.
          <section
            className="surgir mt-4 rounded-xl px-4 py-4"
            style={{ background: 'var(--color-sube)', color: 'var(--color-sube-tinta)' }}
          >
            <p className="flex items-baseline justify-between gap-3 text-[12px] font-medium uppercase tracking-[0.06em]">
              Llegó tu nota
              <span className="normal-case tracking-normal opacity-80">
                {new Date(calificacion.fecha).toLocaleTimeString('es-CO', { hour: 'numeric', minute: '2-digit' })}
              </span>
            </p>
            <p className="tabular mt-1.5 text-[38px] leading-none text-tinta">
              {formatoNota(calificacion.nota)}
              <span className="text-[16px] text-tinta-tenue"> / 5</span>
            </p>
            {calificacion.comentario && <p className="mt-2 text-[14.5px] leading-relaxed text-tinta">«{calificacion.comentario}»</p>}
          </section>
        ) : (
          (entrega || enviado) && (
            <section className="mt-4 flex items-center gap-3 rounded-xl border border-dashed border-borde-fuerte bg-superficie px-4 py-3.5">
              <span className="size-4 shrink-0 animate-spin rounded-full border-2 border-borde-fuerte border-t-transparent motion-reduce:animate-none" aria-hidden />
              <p className="text-[13.5px] leading-relaxed text-tinta-suave">
                Esperando la nota de {vista.aula.docente}. Te llegará aquí sola, sin recargar.
              </p>
            </section>
          )
        )}

        <ol className="mt-6 space-y-6">
          {ejercicios.map((ej, i) => {
            const mias = entrega?.respuestas[ej.id] ?? []
            const nota = calificacion?.porEjercicio?.[ej.id]
            const solucion = ej.solucionPublicada ? ej.solucion ?? [] : []
            // Con la solución publicada, cada renglón propio se marca bien o mal.
            const marcas = solucion.length && mias.length ? corregir(solucion, mias).estados : undefined
            return (
              <li key={ej.id}>
                <div className="flex items-baseline justify-between gap-3 px-2 sm:px-0">
                  <p className="rotulo">Ejercicio {i + 1}</p>
                  {nota !== undefined && (
                    <p
                      className="tabular rounded-md px-2 py-0.5 text-[13px] font-medium"
                      style={{ background: 'var(--color-sube)', color: 'var(--color-sube-tinta)' }}
                    >
                      {formatoNota(nota)} / 5
                    </p>
                  )}
                </div>
                <Enunciado grupo={ej.grupo} titulo={ej.titulo} enunciado={ej.enunciado} datos={ej.datos} />
                {entrega && (
                  <Bloque tono="respuesta" titulo="Tu respuesta" detalle={marcas ? 'verde: bien · rojo: revisar' : undefined}>
                    {mias.length ? (
                      <HojaAsiento filas={mias} onCambiar={() => {}} catalogo={catalogo} estados={marcas} bloqueada />
                    ) : (
                      <p className="px-1 py-2 text-[13.5px] text-tinta-suave">No escribiste nada en este ejercicio.</p>
                    )}
                  </Bloque>
                )}
                {ej.solucionPublicada && (solucion.length > 0 || Boolean(ej.explicacion)) && (
                  <Bloque tono="solucion" titulo={solucion.length ? 'Solución' : 'Explicación'}>
                    {/* Un ejercicio propio puede no tener solución: entonces solo la explicación, si la hay. */}
                    {solucion.length > 0 && <HojaAsiento filas={aFilas(solucion)} onCambiar={() => {}} catalogo={catalogo} bloqueada />}
                    {ej.explicacion && (
                      <div className={`px-1 text-[14.5px] leading-relaxed text-tinta ${solucion.length ? 'mt-3' : ''}`}>
                        <TextoPlegado texto={ej.explicacion} />
                      </div>
                    )}
                  </Bloque>
                )}
                {entrega && !ej.solucionPublicada && (
                  <p className="mt-2 px-2 text-[12.5px] text-tinta-tenue sm:px-0">
                    La solución aparecerá aquí cuando {vista.aula.docente} la publique.
                  </p>
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

/** En qué va el quiz enviado: enviado → calificado → soluciones. */
function Seguimiento({ enviado, calificado, soluciones }: { enviado: boolean; calificado: boolean; soluciones: boolean }) {
  const pasos = [
    { texto: 'Enviado', hecho: enviado },
    { texto: 'Calificado', hecho: calificado },
    { texto: 'Soluciones', hecho: soluciones },
  ]
  return (
    <ol className="mt-4 grid grid-cols-3 gap-1.5 px-2 sm:px-0" aria-label="Estado del quiz">
      {pasos.map((p) => (
        <li
          key={p.texto}
          className="flex min-h-9 items-center justify-center gap-1.5 rounded-lg px-2 text-[12.5px] font-medium"
          style={
            p.hecho
              ? { background: 'var(--color-sube)', color: 'var(--color-sube-tinta)' }
              : { background: 'var(--color-hueso)', color: 'var(--color-tinta-tenue)' }
          }
        >
          <span aria-hidden>{p.hecho ? '✓' : '·'}</span>
          {p.texto}
          <span className="sr-only">{p.hecho ? ' (listo)' : ' (pendiente)'}</span>
        </li>
      ))}
    </ol>
  )
}

/** Un bloque con fondo de color: la respuesta del estudiante (ámbar) o la solución (verde). */
function Bloque({
  tono,
  titulo,
  detalle,
  children,
}: {
  tono: 'respuesta' | 'solucion'
  titulo: string
  detalle?: string
  children: React.ReactNode
}) {
  const color =
    tono === 'respuesta'
      ? { fondo: 'var(--color-nota)', tinta: 'var(--color-nota-tinta)' }
      : { fondo: 'var(--color-sube)', tinta: 'var(--color-sube-tinta)' }
  return (
    <section className="mt-3 rounded-xl p-2 pt-2.5" style={{ background: color.fondo }}>
      <p
        className="mb-2 flex items-baseline justify-between gap-3 px-1 text-[11.5px] font-medium uppercase tracking-[0.06em]"
        style={{ color: color.tinta }}
      >
        {titulo}
        {detalle && <span className="normal-case tracking-normal opacity-80">{detalle}</span>}
      </p>
      {children}
    </section>
  )
}
