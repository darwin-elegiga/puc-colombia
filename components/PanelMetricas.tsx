'use client'

import { useCallback, useEffect, useState, type FormEvent } from 'react'
import Cargando from './Cargando'
import {
  CLAVE_VISITANTE, MODOS, NAVEGADORES, NOMBRE_DISPOSITIVO, NOMBRE_PANTALLA, SISTEMAS, TIPOS_DISPOSITIVO, diaColombia,
  etiquetaVisitante, type Conteo, type Dispositivo, type Entrada, type FiltroDispositivo, type ResumenMetricas,
} from '@/lib/metricas'

/** El PIN se recuerda solo mientras la pestaña siga abierta. */
const CLAVE_PIN = 'puc-metricas-pin'
const RANGOS = [7, 30, 90] as const
/** Lo que guarda el servidor: no se puede pedir nada más antiguo. */
const DIAS_GUARDADOS = 90

const nombre = (pantalla: string) => NOMBRE_PANTALLA[pantalla as keyof typeof NOMBRE_PANTALLA] ?? pantalla
const numero = (n: number) => n.toLocaleString('es-CO')
const porcentaje = (parte: number, total: number) => (total ? `${Math.round((parte / total) * 100)} %` : '—')
const describir = (d: Dispositivo) =>
  `${NOMBRE_DISPOSITIVO[d.tipo]} · ${d.so} · ${d.navegador}${d.modo === 'instalada' ? ' · app instalada' : ''}`

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

/** La etiqueta de este navegador, si también ha usado la app: para marcarlo como «este dispositivo». */
function leerMiVisitante() {
  try {
    const id = localStorage.getItem(CLAVE_VISITANTE)
    return id ? etiquetaVisitante(id) : null
  } catch {
    return null
  }
}

interface Consulta {
  /** Uno de los rangos rápidos o «fechas» para elegir desde y hasta. */
  periodo: (typeof RANGOS)[number] | 'fechas'
  desde: string
  hasta: string
  filtro: FiltroDispositivo
  /** Etiqueta de un dispositivo concreto: el panel muestra solo su ficha y sus entradas. */
  visitante: string | null
}

const hoy = () => diaColombia(Date.now())
const haceDias = (n: number) => diaColombia(Date.now() - (n - 1) * 86_400_000)

function parametros(c: Consulta) {
  const p = new URLSearchParams()
  if (c.periodo === 'fechas') {
    p.set('desde', c.desde)
    p.set('hasta', c.hasta)
  } else {
    p.set('dias', String(c.periodo))
  }
  for (const [clave, valor] of Object.entries(c.filtro)) if (valor) p.set(clave, valor)
  if (c.visitante) p.set('visitante', c.visitante)
  return p.toString()
}

/**
 * Panel privado de uso: el flujo entre pantallas, el dispositivo y las métricas, con filtros
 * por fechas y por dispositivo, y cada entrada con su hora y si ese dispositivo vuelve.
 * Se entra con un PIN de 4 dígitos.
 */
export default function PanelMetricas() {
  const [pin, setPin] = useState<string | null>(null)
  const [consulta, setConsulta] = useState<Consulta>({ periodo: 7, desde: haceDias(7), hasta: hoy(), filtro: {}, visitante: null })
  const [datos, setDatos] = useState<ResumenMetricas | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [cargando, setCargando] = useState(false)
  const [miVisitante, setMiVisitante] = useState<string | null>(null)

  const cargar = useCallback(async (conPin: string, c: Consulta) => {
    setCargando(true)
    setError(null)
    try {
      const respuesta = await fetch(`/api/metricas?${parametros(c)}`, { headers: { 'x-pin': conPin }, cache: 'no-store' })
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
    // localStorage y sessionStorage solo existen tras montar.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMiVisitante(leerMiVisitante())
    const guardado = leerPin()
    if (guardado) void cargar(guardado, { periodo: 7, desde: haceDias(7), hasta: hoy(), filtro: {}, visitante: null })
  }, [cargar])

  /** Cambia la consulta y, si es válida, la pide al servidor. */
  const cambiar = (parcial: Partial<Consulta>) => {
    const siguiente = { ...consulta, ...parcial }
    setConsulta(siguiente)
    const fechasValidas = siguiente.periodo !== 'fechas' || (siguiente.desde && siguiente.hasta && siguiente.desde <= siguiente.hasta)
    if (pin && fechasValidas) void cargar(pin, siguiente)
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
          <EntradaPin onEntrar={(p) => cargar(p, consulta)} cargando={cargando} error={error} />
        ) : (
          <>
            <Filtros consulta={consulta} onCambiar={cambiar} />
            <p className="mt-3 h-5 text-[13px] text-tinta-tenue">
              {cargando ? <Cargando texto="Actualizando…" /> : `Del ${datos.desde} al ${datos.hasta} (hora de Colombia)`}
            </p>
            {error && <p className="mt-3 rounded-lg bg-error px-3 py-2 text-[14px] text-error-tinta">{error}</p>}
            {consulta.visitante ? (
              <FichaVisitante
                etiqueta={consulta.visitante}
                entradas={datos.entradas}
                esMio={consulta.visitante === miVisitante}
                onCerrar={() => cambiar({ visitante: null })}
              />
            ) : (
              <Resumen datos={datos} miVisitante={miVisitante} onVisitante={(visitante) => cambiar({ visitante })} />
            )}
          </>
        )}
      </div>
    </div>
  )
}

const OPCIONES_FILTRO: { clave: keyof Dispositivo; titulo: string; valores: readonly string[] }[] = [
  { clave: 'tipo', titulo: 'Tipo', valores: TIPOS_DISPOSITIVO },
  { clave: 'so', titulo: 'Sistema', valores: SISTEMAS },
  { clave: 'navegador', titulo: 'Navegador', valores: NAVEGADORES },
  { clave: 'modo', titulo: 'Instalación', valores: MODOS },
]

function Filtros({ consulta, onCambiar }: { consulta: Consulta; onCambiar: (parcial: Partial<Consulta>) => void }) {
  const hayFiltro = Object.values(consulta.filtro).some(Boolean)
  const campo = 'rounded-lg border border-borde bg-superficie px-2.5 py-2 text-[14px] text-tinta outline-none focus:border-tinta'
  return (
    <div className="mt-6 space-y-3">
      <div className="flex flex-wrap items-end gap-2">
        <div role="group" aria-label="Periodo" className="inline-flex rounded-lg border border-borde bg-superficie p-0.5">
          {[...RANGOS, 'fechas' as const].map((r) => (
            <button
              key={r}
              type="button"
              aria-pressed={consulta.periodo === r}
              onClick={() =>
                onCambiar(r === 'fechas' ? { periodo: r } : { periodo: r, desde: haceDias(r), hasta: hoy() })
              }
              className={`rounded-md px-3 py-1.5 text-[14px] ${consulta.periodo === r ? 'bg-tinta text-white' : 'text-tinta-suave'}`}
            >
              {r === 'fechas' ? 'Fechas' : `${r} días`}
            </button>
          ))}
        </div>
        {consulta.periodo === 'fechas' && (
          <div className="flex flex-wrap items-end gap-2">
            <label className="text-[12px] text-tinta-suave">
              Desde
              <input
                type="date"
                value={consulta.desde}
                min={haceDias(DIAS_GUARDADOS)}
                max={consulta.hasta || hoy()}
                onChange={(e) => onCambiar({ desde: e.target.value })}
                className={`${campo} mt-1 block`}
              />
            </label>
            <label className="text-[12px] text-tinta-suave">
              Hasta
              <input
                type="date"
                value={consulta.hasta}
                min={consulta.desde || haceDias(DIAS_GUARDADOS)}
                max={hoy()}
                onChange={(e) => onCambiar({ hasta: e.target.value })}
                className={`${campo} mt-1 block`}
              />
            </label>
          </div>
        )}
      </div>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {OPCIONES_FILTRO.map(({ clave, titulo, valores }) => (
          <label key={clave} className="text-[12px] text-tinta-suave">
            {titulo}
            <select
              value={consulta.filtro[clave] ?? ''}
              onChange={(e) => onCambiar({ filtro: { ...consulta.filtro, [clave]: e.target.value || undefined } })}
              className={`${campo} mt-1 block w-full`}
            >
              <option value="">Todos</option>
              {valores.map((v) => (
                <option key={v} value={v}>
                  {NOMBRE_DISPOSITIVO[v] ?? v}
                </option>
              ))}
            </select>
          </label>
        ))}
      </div>
      {hayFiltro && (
        <button type="button" onClick={() => onCambiar({ filtro: {} })} className="text-[13px] text-tinta-suave underline underline-offset-2">
          Quitar el filtro de dispositivo
        </button>
      )}
    </div>
  )
}

/** Lo que se sabe de un dispositivo concreto en el periodo: cuántas veces entró, cuándo y desde qué. */
function FichaVisitante({ etiqueta, entradas, esMio, onCerrar }: { etiqueta: string; entradas: Entrada[]; esMio: boolean; onCerrar: () => void }) {
  const ultima = entradas[0]
  const primera = entradas.at(-1)
  const visitas = Math.max(0, ...entradas.map((e) => e.visita ?? 0))
  return (
    <>
      <section className="mt-6 rounded-xl border border-borde bg-superficie p-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-[13px] text-tinta-suave">Dispositivo</p>
            <p className="mt-0.5 font-mono text-[22px] text-tinta">
              #{etiqueta}
              {esMio && <span className="ml-2 align-middle font-sans text-[12px] text-propia-tinta">este dispositivo</span>}
            </p>
            {ultima && <p className="text-[14px] text-tinta-suave">{describir(ultima.dispositivo)}</p>}
          </div>
          <button type="button" onClick={onCerrar} className="tactil shrink-0 rounded-lg border border-borde px-3 text-[14px] text-tinta-suave pulsable">
            Ver todos
          </button>
        </div>
        {entradas.length ? (
          <dl className="mt-4 grid grid-cols-2 gap-3 text-[14px] sm:grid-cols-4">
            <Dato titulo="Entradas en el periodo" valor={numero(entradas.length)} />
            <Dato titulo="Visitas en total" valor={visitas ? numero(visitas) : '—'} />
            <Dato titulo="Primera del periodo" valor={primera ? fechaHora.format(primera.t) : '—'} />
            <Dato titulo="Última" valor={ultima ? fechaHora.format(ultima.t) : '—'} />
          </dl>
        ) : (
          <p className="mt-3 text-[14px] text-tinta-suave">No entró en este periodo con el filtro elegido.</p>
        )}
      </section>
      <Seccion titulo="Sus entradas">
        <ListaEntradas entradas={entradas} miVisitante={esMio ? etiqueta : null} />
      </Seccion>
    </>
  )
}

function Dato({ titulo, valor }: { titulo: string; valor: string }) {
  return (
    <div>
      <dt className="text-[12px] text-tinta-tenue">{titulo}</dt>
      <dd className="text-tinta tabular-nums">{valor}</dd>
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

function Resumen({ datos, miVisitante, onVisitante }: { datos: ResumenMetricas; miVisitante: string | null; onVisitante: (etiqueta: string) => void }) {
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
        <ListaEntradas entradas={datos.entradas} miVisitante={miVisitante} onVisitante={onVisitante} />
      </Seccion>

      <Seccion titulo="Dispositivos que vuelven" nota="Cada dispositivo se reconoce por su etiqueta. Tócalo para ver todas sus entradas.">
        <DispositivosQueVuelven entradas={datos.entradas} miVisitante={miVisitante} onVisitante={onVisitante} />
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

function ListaEntradas({
  entradas, miVisitante, onVisitante,
}: { entradas: Entrada[]; miVisitante: string | null; onVisitante?: (etiqueta: string) => void }) {
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
                <p className="text-[13px] text-tinta-suave">{describir(d)}</p>
              </div>
              <div className="shrink-0 text-right">
                {e.visita === null ? (
                  <span className="text-[13px] text-tinta-tenue">Sin identificar</span>
                ) : e.visita === 1 ? (
                  <span className="rounded-full bg-hueso px-2 py-0.5 text-[12px] text-tinta-suave">Primera vez</span>
                ) : (
                  <span className="rounded-full bg-propia px-2 py-0.5 text-[12px] text-propia-tinta">Vuelve · {e.visita}.ª vez</span>
                )}
                {e.visitante && (
                  <EtiquetaVisitante etiqueta={e.visitante} esMio={e.visitante === miVisitante} onVisitante={onVisitante} />
                )}
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

/** La etiqueta de un dispositivo; si se puede, lleva a su ficha. */
function EtiquetaVisitante({ etiqueta, esMio, onVisitante }: { etiqueta: string; esMio: boolean; onVisitante?: (etiqueta: string) => void }) {
  const texto = (
    <>
      #{etiqueta}
      {esMio && <span className="ml-1 font-sans text-propia-tinta">· este</span>}
    </>
  )
  if (!onVisitante) return <p className="mt-1 font-mono text-[11px] text-tinta-tenue">{texto}</p>
  return (
    <button
      type="button"
      onClick={() => onVisitante(etiqueta)}
      aria-label={`Ver las entradas del dispositivo ${etiqueta}`}
      className="mt-1 block w-full text-right font-mono text-[11px] text-tinta-suave underline decoration-borde-fuerte underline-offset-2"
    >
      {texto}
    </button>
  )
}

/** Los dispositivos con más de una visita, agrupados por su etiqueta, del más reciente al más antiguo. */
function DispositivosQueVuelven({
  entradas, miVisitante, onVisitante,
}: { entradas: Entrada[]; miVisitante: string | null; onVisitante: (etiqueta: string) => void }) {
  const grupos = new Map<string, { etiqueta: string; dispositivo: Dispositivo; entradas: number; visitas: number; ultima: number }>()
  // Las entradas llegan de la más reciente a la más antigua: la primera de cada grupo es la última visita.
  for (const e of entradas) {
    if (!e.visitante) continue
    const g = grupos.get(e.visitante)
    if (g) {
      g.entradas += 1
      g.visitas = Math.max(g.visitas, e.visita ?? 0)
    } else {
      grupos.set(e.visitante, { etiqueta: e.visitante, dispositivo: e.dispositivo, entradas: 1, visitas: e.visita ?? 0, ultima: e.t })
    }
  }
  const vuelven = [...grupos.values()].filter((g) => g.visitas > 1 || g.entradas > 1)
  if (!vuelven.length) return <p className="text-[14px] text-tinta-suave">Ningún dispositivo ha vuelto a entrar en este periodo.</p>
  return (
    <ul className="divide-y divide-borde">
      {vuelven.map((g) => (
        <li key={g.etiqueta}>
          <button
            type="button"
            onClick={() => onVisitante(g.etiqueta)}
            className="flex w-full items-start justify-between gap-3 py-2.5 text-left text-[14px] pulsable"
          >
            <div className="min-w-0">
              <p className="font-mono text-tinta">
                #{g.etiqueta}
                {g.etiqueta === miVisitante && <span className="ml-2 font-sans text-[12px] text-propia-tinta">este dispositivo</span>}
              </p>
              <p className="text-[13px] text-tinta-suave">{describir(g.dispositivo)}</p>
            </div>
            <div className="shrink-0 text-right tabular-nums">
              <p className="text-tinta">{numero(g.visitas || g.entradas)} visitas</p>
              <p className="text-[12px] text-tinta-tenue">última: {fechaHora.format(g.ultima)}</p>
            </div>
          </button>
        </li>
      ))}
    </ul>
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
