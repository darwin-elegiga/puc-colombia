'use client'

import { useEffect, useState } from 'react'
import { MAX_NOMBRE, MAX_NOMBRE_AULA, normalizarCodigo, type AulaPublica } from '@/lib/aulas'
import { apiAulas, guardarMiNombre, leerMiNombre, limpiarBorradores, useMisAulas, vigentes } from '@/lib/misAulas'
import { IconoChevron, IconoPapelera } from './Iconos'

const campo =
  'min-h-12 w-full rounded-xl border border-borde bg-superficie px-3.5 text-tinta outline-none placeholder:text-tinta-tenue focus:border-borde-fuerte'
const primario =
  'tactil w-full rounded-xl bg-tinta text-[15px] text-white transition-opacity active:bg-[#3d4347] disabled:opacity-30 lg:hover:bg-[#3d4347]'

/** Minutos u horas que le quedan a un aula. */
function quedan(expira: number) {
  const min = Math.max(0, Math.round((expira - Date.now()) / 60000))
  return min < 60 ? `${min} min` : `${Math.floor(min / 60)} h`
}

/**
 * La pestaña «Aulas» de Entrenar: volver a las aulas de este dispositivo, crear una
 * (pública o privada), unirse con un código o elegir una pública abierta.
 */
export default function PanelAulas({ onAbrir }: { onAbrir: (codigo: string) => void }) {
  const { aulas, recordar, olvidar } = useMisAulas()
  const [ahora, setAhora] = useState(() => Date.now())
  const mias = vigentes(aulas, ahora)
  const historial = aulas.filter((a) => a.expira <= ahora)
  const [borrando, setBorrando] = useState<string | null>(null)
  const [nombre, setNombre] = useState(leerMiNombre)
  const [nombreAula, setNombreAula] = useState('')
  const [publica, setPublica] = useState(false)
  const [codigo, setCodigo] = useState('')
  const [creando, setCreando] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [publicas, setPublicas] = useState<AulaPublica[] | null>(null)

  // Los borradores de aulas que ya terminaron no sirven: se borran al abrir el panel.
  useEffect(() => limpiarBorradores(), [])

  // Las públicas se consultan cada 15 s mientras la pestaña está visible.
  useEffect(() => {
    let vivo = true
    // La primera carga siempre; las siguientes, solo con la pantalla visible.
    const cargar = (siempre = false) => {
      if (!siempre && document.visibilityState !== 'visible') return
      apiAulas.publicas().then((l) => vivo && setPublicas(l)).catch(() => vivo && setPublicas([]))
    }
    cargar(true)
    const reloj = setInterval(() => {
      setAhora(Date.now())
      cargar()
    }, 15000)
    return () => {
      vivo = false
      clearInterval(reloj)
    }
  }, [])

  const crear = async () => {
    setCreando(true)
    setError(null)
    try {
      const r = await apiAulas.crear({ nombre: nombreAula, docente: nombre, publica })
      guardarMiNombre(nombre.trim())
      recordar({
        codigo: r.codigo, rol: 'docente', clave: r.clave, nombre: r.aula.docente, nombreAula: r.aula.nombre,
        docente: r.aula.docente, publica: r.aula.publica, expira: r.aula.expira, unido: Date.now(),
      })
      onAbrir(r.codigo)
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setCreando(false)
    }
  }

  return (
    <>
      <p className="mt-3 text-[15px] leading-relaxed text-pretty text-tinta-suave">
        Quien crea el aula la dirige: lanza el ejercicio, ve las entregas y califica. Los demás entran con el código
        y su nombre, sin cuentas. Las aulas duran 24 horas.
      </p>

      {/* ─────────── Tus aulas ─────────── */}
      {mias.length > 0 && (
        <section className="mt-6">
          <p className="rotulo mb-2">Tus aulas</p>
          <ul className="overflow-hidden rounded-xl border border-borde bg-superficie">
            {mias.map((a) => (
              <li key={a.codigo} className="border-b border-borde last:border-b-0">
                <button type="button" onClick={() => onAbrir(a.codigo)} className="flex min-h-14 w-full items-center gap-3 px-4 py-2.5 text-left pulsable">
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[15px] text-tinta">{a.nombreAula}</span>
                    <span className="block text-[12.5px] text-tinta-tenue">
                      {a.rol === 'docente' ? 'La diriges tú' : `Con ${a.docente}`} · <span className="tabular">{a.codigo}</span> · quedan {quedan(a.expira)}
                    </span>
                  </span>
                  <IconoChevron className="size-4 shrink-0 text-tinta-tenue" />
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* ─────────── Tu nombre ─────────── */}
      <section className="mt-6">
        <label className="rotulo mb-2 block" htmlFor="mi-nombre">Tu nombre</label>
        <input
          id="mi-nombre"
          value={nombre}
          onChange={(e) => setNombre(e.target.value.slice(0, MAX_NOMBRE))}
          autoComplete="name"
          placeholder="Como te verán en el aula"
          className={campo}
        />
      </section>

      {/* ─────────── Unirse ─────────── */}
      <section className="mt-6 rounded-xl border border-borde bg-superficie p-4">
        <p className="text-[15px] font-medium text-tinta">Entrar a un aula</p>
        <div className="mt-3 flex gap-2">
          <input
            value={codigo}
            onChange={(e) => setCodigo(normalizarCodigo(e.target.value))}
            placeholder="Código"
            aria-label="Código del aula"
            autoCapitalize="characters"
            autoComplete="off"
            className={`${campo} tabular min-w-0 flex-1 tracking-[0.2em] uppercase`}
          />
          <button
            type="button"
            onClick={() => onAbrir(codigo)}
            disabled={codigo.length !== 6}
            className="tactil shrink-0 rounded-xl bg-tinta px-5 text-[15px] text-white transition-opacity disabled:opacity-30"
          >
            Entrar
          </button>
        </div>
      </section>

      {/* ─────────── Crear ─────────── */}
      <section className="mt-4 rounded-xl border border-borde bg-superficie p-4">
        <p className="text-[15px] font-medium text-tinta">Crear un aula</p>
        <input
          value={nombreAula}
          onChange={(e) => setNombreAula(e.target.value.slice(0, MAX_NOMBRE_AULA))}
          placeholder="Nombre del aula, p. ej. Contabilidad I"
          aria-label="Nombre del aula"
          className={`${campo} mt-3`}
        />
        <div role="radiogroup" aria-label="Quién puede verla" className="mt-3 grid grid-cols-2 gap-1 rounded-xl bg-hueso p-1">
          {([
            [false, 'Privada', 'Solo con el código'],
            [true, 'Pública', 'Todos la ven'],
          ] as const).map(([valor, titulo, detalle]) => (
            <button
              key={titulo}
              type="button"
              role="radio"
              aria-checked={publica === valor}
              onClick={() => setPublica(valor)}
              className={[
                'min-h-12 rounded-lg px-2 text-center transition-colors',
                publica === valor ? 'bg-superficie text-tinta shadow-[0_0_0_1px_var(--color-borde)]' : 'text-tinta-suave',
              ].join(' ')}
            >
              <span className="block text-[14px] font-medium">{titulo}</span>
              <span className="block text-[11.5px] text-tinta-tenue">{detalle}</span>
            </button>
          ))}
        </div>
        <button type="button" onClick={crear} disabled={creando || !nombre.trim() || !nombreAula.trim()} className={`${primario} mt-3`}>
          {creando ? 'Creando…' : !nombre.trim() ? 'Escribe tu nombre arriba' : 'Crear el aula'}
        </button>
        {error && <p className="mt-2 text-[13px]" style={{ color: 'var(--color-baja-tinta)' }}>{error}</p>}
      </section>

      {/* ─────────── Historial ─────────── */}
      {historial.length > 0 && (
        <section className="mt-8">
          <div className="mb-2 flex items-baseline justify-between gap-3">
            <p className="rotulo">Historial</p>
            <p className="text-[12px] text-tinta-tenue">En este dispositivo</p>
          </div>
          <ul className="overflow-hidden rounded-xl border border-borde bg-superficie">
            {historial.map((a) => (
              <li key={a.codigo} className="flex items-center border-b border-borde last:border-b-0">
                <button type="button" onClick={() => onAbrir(a.codigo)} className="flex min-h-14 min-w-0 flex-1 items-center gap-3 px-4 py-2.5 text-left pulsable">
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[15px] text-tinta">{a.nombreAula}</span>
                    <span className="block text-[12.5px] text-tinta-tenue">
                      {new Date(a.unido).toLocaleDateString('es-CO', { day: 'numeric', month: 'short' })} ·{' '}
                      {a.rol === 'docente' ? 'la dirigiste · ver entregas y notas' : `con ${a.docente}`}
                    </span>
                  </span>
                </button>
                {borrando === a.codigo ? (
                  <button
                    type="button"
                    onClick={() => { olvidar(a.codigo); setBorrando(null) }}
                    onBlur={() => setBorrando(null)}
                    autoFocus
                    className="mr-2 min-h-9 shrink-0 rounded-lg px-3 text-[13px] font-medium"
                    style={{ background: 'var(--color-baja)', color: 'var(--color-baja-tinta)' }}
                  >
                    Borrar
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => setBorrando(a.codigo)}
                    aria-label={`Borrar «${a.nombreAula}» del historial`}
                    className="tactil grid w-12 shrink-0 place-items-center text-tinta-tenue hover:text-tinta"
                  >
                    <IconoPapelera className="size-4" />
                  </button>
                )}
              </li>
            ))}
          </ul>
          <p className="mt-2 px-1 text-[12px] leading-relaxed text-tinta-tenue">
            Las aulas se borran del servidor a las 24 horas. Aquí quedan las notas y entregas que guardó este dispositivo;
            los ejercicios con solución están en «De mis clases».
          </p>
        </section>
      )}

      {/* ─────────── Públicas ─────────── */}
      <section className="mt-8">
        <div className="mb-2 flex items-baseline justify-between gap-3">
          <p className="rotulo">Aulas públicas abiertas</p>
          {publicas && <p className="tabular text-[12px] text-tinta-tenue">{publicas.length}</p>}
        </div>
        {publicas === null ? (
          <p className="px-1 text-[13.5px] text-tinta-tenue">Buscando…</p>
        ) : publicas.length === 0 ? (
          <p className="rounded-xl border border-dashed border-borde px-4 py-5 text-center text-[13.5px] text-tinta-tenue">
            Ninguna ahora mismo. Crea una pública y aparecerá aquí para todos.
          </p>
        ) : (
          <ul className="overflow-hidden rounded-xl border border-borde bg-superficie">
            {publicas.map((a) => (
              <li key={a.codigo} className="border-b border-borde last:border-b-0">
                <button type="button" onClick={() => onAbrir(a.codigo)} className="flex min-h-14 w-full items-center gap-3 px-4 py-2.5 text-left pulsable">
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[15px] text-tinta">{a.nombre}</span>
                    <span className="block text-[12.5px] text-tinta-tenue">
                      Con {a.docente} · {a.miembros} {a.miembros === 1 ? 'persona' : 'personas'}
                    </span>
                  </span>
                  <span className="shrink-0 text-[13px] font-medium text-tinta">Unirme</span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>
    </>
  )
}
