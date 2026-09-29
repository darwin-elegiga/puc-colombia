'use client'

import { useState } from 'react'
import type { Catalogo } from '@/lib/catalogo'
import { MAX_ENUNCIADO, tituloDe, type EjercicioPropio } from '@/lib/aulas'
import { conRenglonLibre, estaVacia, sumas, type Fila } from '@/lib/practica'
import { proponerSolucionIA } from '@/lib/misAulas'
import HojaAsiento from './HojaAsiento'
import { botonPrimario, botonSecundario } from './Dialogo'
import Cargando from './Cargando'

const campo =
  'w-full rounded-xl border border-borde bg-superficie px-3.5 text-tinta outline-none placeholder:text-tinta-tenue focus:border-borde-fuerte'

/**
 * El docente escribe su propio ejercicio: el enunciado, la solución en la hoja y, si
 * quiere, una explicación. La solución la pone él; la IA (beta) solo propone un
 * borrador cuando se lo pide, que puede corregir antes de añadirlo al quiz.
 */
export default function EditorEjercicio({
  catalogo,
  inicial,
  ocupado,
  error,
  onCancelar,
  onAgregar,
}: {
  catalogo: Catalogo
  /** Para volver a usar uno guardado. */
  inicial?: EjercicioPropio
  ocupado: boolean
  /** El error al añadirlo (lo devuelve el servidor). */
  error: string | null
  onCancelar: () => void
  onAgregar: (ejercicio: EjercicioPropio) => void
}) {
  const [titulo, setTitulo] = useState(inicial?.titulo ?? '')
  const [enunciado, setEnunciado] = useState(inicial?.enunciado ?? '')
  const [filas, setFilas] = useState<Fila[]>(() => conRenglonLibre(inicial?.filas ?? []))
  const [explicacion, setExplicacion] = useState(inicial?.explicacion ?? '')
  const [pensando, setPensando] = useState(false)
  const [notasIA, setNotasIA] = useState<string[]>([])
  const [errorIA, setErrorIA] = useState<string | null>(null)

  const escritas = filas.filter((f) => !estaVacia(f))
  const total = sumas(escritas)
  const faltaEnunciado = enunciado.trim().length < 8
  // Como en el servidor (validarPropio): cada renglón de la solución lleva código e importe.
  const incompletos = escritas.some((f) => !f.codigo || !(f.debe ?? f.haber))
  // La solución es opcional: sin ella, el ejercicio es solo el enunciado y se califica a mano.
  const sinSolucion = escritas.length === 0
  const listo = !faltaEnunciado && (sinSolucion || (escritas.length >= 2 && !incompletos && total.cuadra))

  const proponer = async () => {
    setPensando(true)
    setErrorIA(null)
    try {
      const r = await proponerSolucionIA(enunciado.trim())
      setFilas(conRenglonLibre(r.filas))
      setNotasIA(r.notas)
    } catch (e) {
      setErrorIA((e as Error).message)
    } finally {
      setPensando(false)
    }
  }

  return (
    <section>
      <div className="px-2 sm:px-0">
        <p className="rotulo">Ejercicio propio</p>
        <h2 className="editorial mt-2 text-[26px] leading-tight text-tinta">Escribe el ejercicio</h2>
      </div>

      <label className="mt-5 block px-2 sm:px-0">
        <span className="rotulo">Título (opcional)</span>
        <input
          value={titulo}
          onChange={(e) => setTitulo(e.target.value.slice(0, 80))}
          placeholder="Por ejemplo: Compra de mercancía a crédito"
          className={`${campo} mt-2 min-h-12`}
        />
      </label>

      <label className="mt-4 block px-2 sm:px-0">
        <span className="rotulo">Enunciado</span>
        <textarea
          value={enunciado}
          onChange={(e) => setEnunciado(e.target.value.slice(0, MAX_ENUNCIADO))}
          rows={4}
          placeholder="Compras mercancía por $2.000.000 más IVA a crédito; el proveedor es gran contribuyente…"
          className={`${campo} mt-2 resize-y py-3 text-[15px] leading-relaxed`}
        />
      </label>

      <div className="mt-5 flex items-center justify-between gap-3 px-2 sm:px-0">
        <p className="rotulo">Solución (opcional)</p>
        <button
          type="button"
          onClick={proponer}
          disabled={faltaEnunciado || pensando}
          className="min-h-9 rounded-lg px-2 text-[13px] font-medium text-tinta-suave transition-colors hover:text-tinta disabled:opacity-40"
        >
          {pensando ? <Cargando texto="La IA está pensando…" /> : 'Proponer con IA (beta)'}
        </button>
      </div>
      <p className="mt-1 px-2 text-[12.5px] leading-relaxed text-tinta-tenue sm:px-0">
        Si la escribes, cada entrega se corrige sola. Si la dejas vacía, el ejercicio es solo el enunciado y lo calificas tú
        (o con la IA).
      </p>
      <div className="mt-2">
        <HojaAsiento filas={filas} onCambiar={setFilas} catalogo={catalogo} />
      </div>
      {errorIA && <p className="mt-2 px-2 text-[13px]" style={{ color: 'var(--color-baja-tinta)' }}>{errorIA}</p>}
      {notasIA.length > 0 && (
        <div className="mt-3 rounded-xl px-4 py-3 text-[13px] leading-relaxed" style={{ background: 'var(--color-nota)', color: 'var(--color-nota-tinta)' }}>
          <p className="font-medium">Borrador de la IA: revísalo antes de añadirlo.</p>
          <ul className="mt-1 list-disc pl-4">
            {notasIA.map((n) => <li key={n}>{n}</li>)}
          </ul>
        </div>
      )}

      <label className="mt-5 block px-2 sm:px-0">
        <span className="rotulo">Explicación para después (opcional)</span>
        <textarea
          value={explicacion}
          onChange={(e) => setExplicacion(e.target.value.slice(0, MAX_ENUNCIADO))}
          rows={2}
          placeholder="Se verá junto a la solución cuando la publiques."
          className={`${campo} mt-2 resize-y py-3 text-[15px] leading-relaxed`}
        />
      </label>

      <div className="mt-5 grid grid-cols-2 gap-2">
        <button type="button" onClick={onCancelar} className={botonSecundario}>Cancelar</button>
        <button
          type="button"
          disabled={!listo || ocupado}
          onClick={() => onAgregar({ titulo: tituloDe(titulo, enunciado.trim()), enunciado: enunciado.trim(), filas: escritas, explicacion: explicacion.trim() })}
          className={botonPrimario}
        >
          {ocupado ? <Cargando texto="Añadiendo…" /> : 'Añadir al quiz'}
        </button>
      </div>
      {!listo && (
        <p className="mt-2 px-2 text-center text-[12.5px] text-tinta-tenue">
          {faltaEnunciado
            ? 'Escribe el enunciado.'
            : escritas.length < 2
              ? 'La solución necesita al menos dos renglones (o déjala vacía).'
              : incompletos
                ? 'Cada renglón de la solución necesita código e importe.'
                : 'La solución debe cuadrar para añadirlo.'}
        </p>
      )}
      {error && (
        <p aria-live="polite" className="mt-2 px-2 text-center text-[13px]" style={{ color: 'var(--color-error-tinta)' }}>{error}</p>
      )}
    </section>
  )
}
