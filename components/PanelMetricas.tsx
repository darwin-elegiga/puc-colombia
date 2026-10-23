'use client'

import { useCallback, useEffect, useState, type FormEvent } from 'react'
import Cargando from './Cargando'
import { NOMBRE_DISPOSITIVO, NOMBRE_PANTALLA, type Conteo, type Entrada, type ResumenMetricas } from '@/lib/metricas'

/** El PIN se recuerda solo mientras la pestaña siga abierta. */
const CLAVE_PIN = 'puc-metricas-pin'
const RANGOS = [7, 30, 90] as const

const nombre = (pantalla: string) => NOMBRE_PANTALLA[pantalla as keyof typeof NOMBRE_PANTALLA] ?? pantalla
const numero = (n: number) => n.toLocaleString('es-CO')
const porcentaje = (parte: number, total: number) => (total ? `${Math.round((parte / total) * 100)} %` : '—')

function duracion(ms: number) {
  const s = Math.round(ms / 1000)
  if (s < 60) return `${s} s`
  const min = Math.floor(s / 60)
  if (min < 60) return `${min} min ${s % 60} s`
  return `${Math.floor(min / 60)} h ${min % 60} min`
}

function leerPin() {
  try {
    return sessionStorage.getItem(CLAVE_PIN)
  } catch {
    return null
  }
}

function guardarPin(pin: string | null) {
  try {
    if (pin) sessionStorage.setItem(CLAVE_PIN, pin)
    else sessionStorage.removeItem(CLAVE_PIN)
  } catch {
    // Sin sessionStorage se pide el PIN en cada carga.
  }
}

/**
 * Panel privado de uso: el flujo entre pantallas, el dispositivo y las métricas, agregados
 * por día y sin datos de nadie en concreto. Se entra con un PIN de 4 dígitos.
 */
export default function PanelMetricas() {
  const [pin, setPin] = useState<string | null>(null)
  const [dias, setDias] = useState<(typeof RANGOS)[number]>(7)
  const [datos, setDatos] = useState<ResumenMetricas | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [cargando, setCargando] = useState(false)

  const cargar = useCallback(async (conPin: string, enDias: number) => {
    setCargando(true)
    setError(null)
    try {
      const respuesta = await fetch(`/api/metricas?dias=${enDias}`, { headers: { 'x-pin': conPin }, cache: 'no-store' })
      const cuerpo = await respuesta.json().catch(() => ({}))
      if (!respuesta.ok) {
        if (respuesta.status === 401) {
          guardarPin(null)
          setPin(null)
        }
        setError(cuerpo.error ?? 'No se pudieron cargar las métricas.')
        return
      }
      guardarPin(conPin)
      setPin(conPin)
      setDatos(cuerpo as ResumenMetricas)
    } catch {
      setError('Sin conexión con el servidor.')
    } finally {
      setCargando(false)
    }
  }, [])

  useEffect(() => {
    const guardado = leerPin()
    // eslint-disable-next-line react-hooks/set-state-in-effect -- el PIN vive en sessionStorage, solo disponible tras montar
    if (guardado) void cargar(guardado, 7)
  }, [cargar])

  const cambiarRango = (siguiente: (typeof RANGOS)[number]) => {
    setDias(siguiente)
    if (pin) void cargar(pin, siguiente)
  }

  return (
    <div className="min-h-dvh bg-lienzo">
      <div
        className="mx-auto max-w-3xl px-4 py-6 sm:px-6 lg:py-10"
        style={{ paddingTop: 'calc(1.5rem + var(--seguro-arriba))', paddingBottom: 'calc(var(--seguro-abajo) + 2rem)' }}
      >
        <div className="flex items-end justify-between gap-3">
          <div>
            <p className="rotulo">Uso anónimo</p>
            <h1 className="editorial mt-2 text-[30px] text-tinta lg:text-5xl">Métricas</h1>
          </div>
          {pin && (
            <button
              type="button"
              onClick={() => {
                guardarPin(null)
                setPin(null)
                setDatos(null)
              }}
              className="tactil rounded-lg px-3 text-[14px] text-tinta-suave pulsable"
            >
              Salir
            </button>
          )}
        </div>

        {!pin || !datos ? (
          <EntradaPin onEntrar={(p) => cargar(p, dias)} cargando={cargando} error={error} />
        ) : (
          <>
            <div className="mt-6 flex flex-wrap items-center gap-3">
              <div role="group" aria-label="Periodo" className="inline-flex rounded-lg border border-borde bg-superficie p-0.5">
                {RANGOS.map((r) => (
                  <button
                    key={r}
                    type="button"
                    aria-pressed={dias === r}
                    onClick={() => cambiarRango(r)}
                    className={`rounded-md px-3 py-1.5 text-[14px] ${dias === r ? 'bg-tinta text-white' : 'text-tinta-suave'}`}
                  >
                    {r} días
                  </button>
                ))}
              </div>
              <span className="text-[13px] text-tinta-tenue">
                {cargando ? <Cargando texto="Actualizando…" /> : `Del ${datos.desde} al ${datos.hasta} (hora de Colombia)`}
              </span>
            </div>
            {error && <p className="mt-3 rounded-lg bg-error px-3 py-2 text-[14px] text-error-tinta">{error}</p>}
            <Resumen datos={datos} />
          </>
        )}
      </div>
    </div>
  )
}

function EntradaPin({ onEntrar, cargando, error }: { onEntrar: (pin: string) => void; cargando: boolean; error: string | null }) {
  const [valor, setValor] = useState('')
  const enviar = (e: FormEvent) => {
    e.preventDefault()
    if (valor.length === 4) onEntrar(valor)
  }
  return (
    <form onSubmit={enviar} className="mt-8 max-w-xs">
      <label htmlFor="pin" className="block text-[14px] text-tinta-suave">
        PIN de acceso
      </label>
      <input
        id="pin"
        type="password"
        inputMode="numeric"
        autoComplete="off"
        autoFocus
        maxLength={4}
        value={valor}
        onChange={(e) => {
          const limpio = e.target.value.replace(/\D/g, '').slice(0, 4)
          setValor(limpio)
          if (limpio.length === 4 && !cargando) onEntrar(limpio)
        }}
        className="mt-2 w-full rounded-lg border border-borde-fuerte bg-superficie px-4 py-3 text-center font-mono text-2xl tracking-[0.6em] text-tinta outline-none focus:border-tinta"
        aria-describedby={error ? 'pin-error' : undefined}
      />
      {error && (
        <p id="pin-error" className="mt-3 text-[14px] text-error-tinta">
          {error}
        </p>
      )}
      <button
        type="submit"
        disabled={valor.length !== 4 || cargando}
        className="tactil mt-4 w-full rounded-lg bg-tinta text-[15px] text-white disabled:opacity-40"
      >
        {cargando ? <Cargando texto="Entrando…" /> : 'Entrar'}
      </button>
    </form>
  )
}

function Resumen({ datos }: { datos: ResumenMetricas }) {
  if (datos.sesiones === 0 && datos.vistas === 0) {
    return (
      <p className="mt-8 rounded-xl border border-borde bg-superficie px-4 py-6 text-center text-[15px] text-tinta-suave">
        Todavía no hay visitas en este periodo.
      </p>
    )
  }
  return (
    <>
      <section aria-label="Métricas principales" className="mt-6 grid grid-cols-2 gap-2 sm:grid-cols-4">
        <Cifra titulo="Sesiones" valor={numero(datos.sesiones)} />
        <Cifra titulo="Pantallas vistas" valor={numero(datos.vistas)} />
        <Cifra titulo="Pantallas por sesión" valor={datos.sesiones ? (datos.vistas / datos.sesiones).toFixed(1).replace('.', ',') : '—'} />
        <Cifra titulo="Tiempo por sesión" valor={datos.sesiones ? duracion(datos.ms / datos.sesiones) : '—'} />
        <Cifra titulo="Primera vez" valor={numero(datos.nuevos)} />
        <Cifra titulo="Vuelven a entrar" valor={numero(datos.recurrentes)} />
        <Cifra titulo="% que vuelve" valor={porcentaje(datos.recurrentes, datos.nuevos + datos.recurrentes)} />
      </section>

      <Seccion titulo="Entradas" nota="Cada vez que alguien abre la app: hora, dispositivo y si ese navegador ya había entrado.">
        <ListaEntradas entradas={datos.entradas} />
      </Seccion>

      <Seccion titulo="Entradas por hora" nota="Hora de Colombia.">
        <PorHora porHora={datos.porHora} />
      </Seccion>

      <Seccion titulo="Sesiones por día">
        <SesionesPorDia porDia={datos.porDia} />
      </Seccion>

      <Seccion titulo="Flujo de la app" nota="De qué pantalla a cuál se pasa. «Entrada» es la primera pantalla de cada sesión.">
        <Flujo pasos={datos.pasos} />
      </Seccion>

      <Seccion titulo="Pantallas">
        <TablaPantallas datos={datos} />
      </Seccion>

      <Seccion titulo="Dispositivo" nota="Una vez por sesión.">
        <div className="grid gap-6 sm:grid-cols-2">
          <Barras titulo="Tipo" conteos={datos.dispositivo.tipo} />
          <Barras titulo="Instalación" conteos={datos.dispositivo.modo} />
          <Barras titulo="Sistema operativo" conteos={datos.dispositivo.so} />
          <Barras titulo="Navegador" conteos={datos.dispositivo.navegador} />
        </div>
      </Seccion>
    </>
  )
}

function Seccion({ titulo, nota, children }: { titulo: string; nota?: string; children: React.ReactNode }) {
  return (
    <section className="mt-8">
      <h2 className="text-[17px] font-medium text-tinta">{titulo}</h2>
      {nota && <p className="mt-0.5 text-[13px] text-tinta-tenue">{nota}</p>}
      <div className="mt-3 rounded-xl border border-borde bg-superficie p-4">{children}</div>
    </section>
  )
}

function Cifra({ titulo, valor }: { titulo: string; valor: string }) {
  return (
    <div className="rounded-xl border border-borde bg-superficie px-4 py-3">
      <p className="text-[13px] text-tinta-suave">{titulo}</p>
      <p className="mt-1 font-mono text-[22px] leading-tight text-tinta tabular-nums">{valor}</p>
    </div>
  )
}

const fechaHora = new Intl.DateTimeFormat('es-CO', {
  timeZone: 'America/Bogota', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit', hour12: false,
})

/** Entradas que se muestran antes de pedir más. */
const PAGINA_ENTRADAS = 25

function ListaEntradas({ entradas }: { entradas: Entrada[] }) {
  const [visibles, setVisibles] = useState(PAGINA_ENTRADAS)
  if (!entradas.length) return <p className="text-[14px] text-tinta-suave">Sin entradas en este periodo.</p>
  return (
    <div>
      <ul className="divide-y divide-borde">
        {entradas.slice(0, visibles).map((e) => {
          const d = e.dispositivo
          return (
            <li key={`${e.t}-${e.visitante}`} className="flex items-start justify-between gap-3 py-2.5 text-[14px]">
              <div className="min-w-0">
                <p className="text-tinta tabular-nums">{fechaHora.format(e.t)}</p>
                <p className="text-[13px] text-tinta-suave">
                  {NOMBRE_DISPOSITIVO[d.tipo]} · {d.so} · {d.navegador}
                  {d.modo === 'instalada' ? ' · app instalada' : ''}
                </p>
              </div>
              <div className="shrink-0 text-right">
                {e.visita === null ? (
                  <span className="text-[13px] text-tinta-tenue">Sin identificar</span>
                ) : e.visita === 1 ? (
                  <span className="rounded-full bg-hueso px-2 py-0.5 text-[12px] text-tinta-suave">Primera vez</span>
                ) : (
                  <span className="rounded-full bg-propia px-2 py-0.5 text-[12px] text-propia-tinta">Vuelve · {e.visita}.ª vez</span>
                )}
                {e.visitante && <p className="mt-1 font-mono text-[11px] text-tinta-tenue">#{e.visitante}</p>}
              </div>
            </li>
          )
        })}
      </ul>
      {entradas.length > visibles && (
        <button
          type="button"
          onClick={() => setVisibles((v) => v + PAGINA_ENTRADAS)}
          className="tactil mt-2 w-full rounded-lg border border-borde text-[14px] text-tinta-suave pulsable"
        >
          Ver más ({entradas.length - visibles})
        </button>
      )}
    </div>
  )
}

function PorHora({ porHora }: { porHora: number[] }) {
  const [activa, setActiva] = useState<number | null>(null)
  const max = Math.max(1, ...porHora)
  const pico = porHora.indexOf(Math.max(...porHora))
  return (
    <div>
      <p className="h-5 text-[13px] text-tinta-suave tabular-nums" aria-live="polite">
        {activa !== null
          ? `De ${activa}:00 a ${activa}:59 → ${numero(porHora[activa])} entradas`
          : `Hora con más entradas: ${pico}:00 (${numero(porHora[pico])})`}
      </p>
      <div className="mt-2 flex h-28 items-end gap-[2px] border-b border-borde-fuerte" onMouseLeave={() => setActiva(null)}>
        {porHora.map((n, h) => (
          <button
            key={h}
            type="button"
            aria-label={`${h}:00, ${n} entradas`}
            onMouseEnter={() => setActiva(h)}
            onFocus={() => setActiva(h)}
            onClick={() => setActiva(h)}
            className="flex h-full min-w-0 flex-1 items-end"
          >
            <span
              className={`block w-full rounded-t-[4px] ${activa === h ? 'bg-tinta' : 'bg-tinta-suave/70'}`}
              style={{ height: n ? `${Math.max(2, (n / max) * 100)}%` : 0 }}
            />
          </button>
        ))}
      </div>
      <div className="mt-1 flex justify-between text-[12px] text-tinta-tenue tabular-nums">
        <span>0 h</span>
        <span>6 h</span>
        <span>12 h</span>
        <span>18 h</span>
        <span>23 h</span>
      </div>
    </div>
  )
}

function SesionesPorDia({ porDia }: { porDia: ResumenMetricas['porDia'] }) {
  const [activo, setActivo] = useState<number | null>(null)
  const max = Math.max(1, ...porDia.map((d) => d.sesiones))
  const elegido = activo === null ? null : porDia[activo]
  return (
    <div>
      <p className="h-5 text-[13px] text-tinta-suave tabular-nums" aria-live="polite">
        {elegido
          ? `${elegido.dia}: ${numero(elegido.sesiones)} sesiones · ${numero(elegido.vistas)} pantallas`
          : `Máximo: ${numero(max)} sesiones en un día`}
      </p>
      <div className="mt-2 flex h-32 items-end gap-[2px] border-b border-borde-fuerte" onMouseLeave={() => setActivo(null)}>
        {porDia.map((d, i) => (
          <button
            key={d.dia}
            type="button"
            aria-label={`${d.dia}: ${d.sesiones} sesiones`}
            onMouseEnter={() => setActivo(i)}
            onFocus={() => setActivo(i)}
            onClick={() => setActivo(i)}
            className="flex h-full min-w-0 flex-1 items-end"
          >
            <span
              className={`block w-full rounded-t-[4px] ${activo === i ? 'bg-tinta' : 'bg-tinta-suave/70'}`}
              style={{ height: d.sesiones ? `${Math.max(2, (d.sesiones / max) * 100)}%` : 0 }}
            />
          </button>
        ))}
      </div>
      <div className="mt-1 flex justify-between text-[12px] text-tinta-tenue tabular-nums">
        <span>{porDia[0]?.dia.slice(5)}</span>
        <span>{porDia.at(-1)?.dia.slice(5)}</span>
      </div>
    </div>
  )
}

/** Cuántos flujos se dibujan: el resto queda en la lista de abajo. */
const MAX_FLUJOS = 18

/**
 * Diagrama de dos columnas: a la izquierda la pantalla de origen, a la derecha la de
 * destino; el grosor de cada banda es el número de veces que se hizo ese paso.
 */
function Flujo({ pasos }: { pasos: ResumenMetricas['pasos'] }) {
  const [activo, setActivo] = useState<number | null>(null)
  if (!pasos.length) return <p className="text-[14px] text-tinta-suave">Sin pasos registrados.</p>

  const dibujados = pasos.slice(0, MAX_FLUJOS)
  const total = pasos.reduce((a, p) => a + p.n, 0)
  const salidasDe = new Map<string, number>()
  for (const p of pasos) salidasDe.set(p.de, (salidasDe.get(p.de) ?? 0) + p.n)

  const ANCHO = 420
  const NODO = 8
  const X_IZQ = 104
  const X_DER = ANCHO - 104 - NODO
  const HUECO = 6
  const MIN_RANURA = 18

  const columna = (clave: 'de' | 'a') => {
    const suma = new Map<string, number>()
    for (const p of dibujados) suma.set(p[clave], (suma.get(p[clave]) ?? 0) + p.n)
    return [...suma].sort((a, b) => b[1] - a[1])
  }
  const izquierda = columna('de')
  const derecha = columna('a')
  const filas = Math.max(izquierda.length, derecha.length)
  const totalDibujado = dibujados.reduce((a, p) => a + p.n, 0)
  const escala = Math.max(140, filas * 26) / totalDibujado

  const colocar = (lista: [string, number][]) => {
    const pos = new Map<string, { y: number; alto: number; usado: number }>()
    let y = 0
    for (const [clave, n] of lista) {
      const alto = Math.max(2, n * escala)
      pos.set(clave, { y, alto, usado: 0 })
      y += Math.max(alto, MIN_RANURA) + HUECO
    }
    return { pos, alto: y - HUECO }
  }
  const izq = colocar(izquierda)
  const der = colocar(derecha)
  const ALTO = Math.max(izq.alto, der.alto)

  // Orden de las bandas dentro de cada nodo: por la posición del otro extremo, para que no se crucen de más.
  const orden = dibujados.map((p, i) => ({ p, i }))
  const bandas = new Map<number, { y0: number; y1: number; grosor: number }>()
  for (const { p, i } of [...orden].sort((a, b) => der.pos.get(a.p.a)!.y - der.pos.get(b.p.a)!.y)) {
    const nodo = izq.pos.get(p.de)!
    const grosor = Math.max(1, p.n * escala)
    bandas.set(i, { y0: nodo.y + nodo.usado + grosor / 2, y1: 0, grosor })
    nodo.usado += grosor
  }
  for (const { p, i } of [...orden].sort((a, b) => izq.pos.get(a.p.de)!.y - izq.pos.get(b.p.de)!.y)) {
    const nodo = der.pos.get(p.a)!
    const banda = bandas.get(i)!
    banda.y1 = nodo.y + nodo.usado + banda.grosor / 2
    nodo.usado += banda.grosor
  }

  const elegido = activo === null ? null : dibujados[activo]
  const medio = (X_IZQ + NODO + X_DER) / 2

  return (
    <div>
      <p className="min-h-5 text-[13px] text-tinta-suave tabular-nums" aria-live="polite">
        {elegido
          ? `${nombre(elegido.de)} → ${nombre(elegido.a)}: ${numero(elegido.n)} veces (${porcentaje(elegido.n, salidasDe.get(elegido.de) ?? 0)} de lo que sale de ${nombre(elegido.de)})`
          : 'Toca o pasa sobre una banda para ver el detalle.'}
      </p>
      <svg
        viewBox={`0 0 ${ANCHO} ${ALTO}`}
        className="mt-3 w-full"
        role="img"
        aria-label="Diagrama del flujo entre pantallas"
        onMouseLeave={() => setActivo(null)}
      >
        {dibujados.map((p, i) => {
          const b = bandas.get(i)!
          const camino = `M${X_IZQ + NODO},${b.y0} C${medio},${b.y0} ${medio},${b.y1} ${X_DER},${b.y1}`
          const resaltado = activo === null || activo === i
          return (
            <path
              key={`${p.de}>${p.a}`}
              d={camino}
              fill="none"
              stroke="var(--color-tinta)"
              strokeOpacity={activo === i ? 0.55 : resaltado ? 0.18 : 0.06}
              strokeWidth={Math.max(b.grosor, 1)}
              onMouseEnter={() => setActivo(i)}
              onClick={() => setActivo(i)}
              className="cursor-pointer transition-[stroke-opacity] duration-150"
            >
              <title>{`${nombre(p.de)} → ${nombre(p.a)}: ${p.n}`}</title>
            </path>
          )
        })}
        {[...izq.pos].map(([clave, { y, alto }]) => (
          <g key={`i-${clave}`}>
            <rect x={X_IZQ} y={y} width={NODO} height={alto} rx={2} fill="var(--color-tinta)" />
            <text x={X_IZQ - 6} y={y + Math.max(alto, MIN_RANURA) / 2} dy="0.35em" textAnchor="end" fontSize={12} fill="var(--color-tinta)">
              {nombre(clave)}
            </text>
          </g>
        ))}
        {[...der.pos].map(([clave, { y, alto }]) => (
          <g key={`d-${clave}`}>
            <rect x={X_DER} y={y} width={NODO} height={alto} rx={2} fill="var(--color-tinta)" />
            <text x={X_DER + NODO + 6} y={y + Math.max(alto, MIN_RANURA) / 2} dy="0.35em" fontSize={12} fill="var(--color-tinta)">
              {nombre(clave)}
            </text>
          </g>
        ))}
      </svg>

      <details className="mt-4">
        <summary className="cursor-pointer text-[14px] text-tinta-suave">
          Todos los pasos ({pasos.length}){pasos.length > MAX_FLUJOS ? ` · el diagrama muestra los ${MAX_FLUJOS} más frecuentes` : ''}
        </summary>
        <table className="mt-2 w-full text-[14px]">
          <thead>
            <tr className="text-left text-[12px] text-tinta-tenue">
              <th className="py-1 font-normal">Desde</th>
              <th className="py-1 font-normal">Hacia</th>
              <th className="py-1 text-right font-normal">Veces</th>
              <th className="py-1 text-right font-normal">% del total</th>
            </tr>
          </thead>
          <tbody className="tabular-nums">
            {pasos.map((p) => (
              <tr key={`${p.de}>${p.a}`} className="border-t border-borde">
                <td className="py-1.5">{nombre(p.de)}</td>
                <td className="py-1.5">{nombre(p.a)}</td>
                <td className="py-1.5 text-right">{numero(p.n)}</td>
                <td className="py-1.5 text-right text-tinta-suave">{porcentaje(p.n, total)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </details>
    </div>
  )
}

function TablaPantallas({ datos }: { datos: ResumenMetricas }) {
  const max = Math.max(1, ...datos.pantallas.map((p) => p.vistas))
  return (
    <table className="w-full text-[14px]">
      <thead>
        <tr className="text-left text-[12px] text-tinta-tenue">
          <th className="py-1 font-normal">Pantalla</th>
          <th className="py-1 text-right font-normal">Vistas</th>
          <th className="py-1 text-right font-normal">Tiempo medio</th>
        </tr>
      </thead>
      <tbody className="tabular-nums">
        {datos.pantallas.map((p) => (
          <tr key={p.pantalla} className="border-t border-borde">
            <td className="py-2 pr-3">
              <span className="block">{nombre(p.pantalla)}</span>
              <span className="mt-1 block h-1.5 rounded-full bg-hueso">
                <span className="block h-full rounded-full bg-tinta-suave" style={{ width: `${(p.vistas / max) * 100}%` }} />
              </span>
            </td>
            <td className="py-2 text-right align-top">
              {numero(p.vistas)}
              <span className="block text-[12px] text-tinta-tenue">{porcentaje(p.vistas, datos.vistas)}</span>
            </td>
            <td className="py-2 text-right align-top">{p.vistas ? duracion(p.ms / p.vistas) : '—'}</td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}

function Barras({ titulo, conteos }: { titulo: string; conteos: Conteo[] }) {
  const total = conteos.reduce((a, c) => a + c.n, 0)
  return (
    <div>
      <h3 className="text-[13px] text-tinta-suave">{titulo}</h3>
      {conteos.length === 0 ? (
        <p className="mt-2 text-[14px] text-tinta-tenue">Sin datos.</p>
      ) : (
        <ul className="mt-2 space-y-2">
          {conteos.map((c) => (
            <li key={c.clave} className="text-[14px]">
              <div className="flex justify-between gap-2 tabular-nums">
                <span>{NOMBRE_DISPOSITIVO[c.clave] ?? c.clave}</span>
                <span className="text-tinta-suave">
                  {numero(c.n)} · {porcentaje(c.n, total)}
                </span>
              </div>
              <span className="mt-1 block h-1.5 rounded-full bg-hueso">
                <span className="block h-full rounded-full bg-tinta-suave" style={{ width: `${(c.n / total) * 100}%` }} />
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
