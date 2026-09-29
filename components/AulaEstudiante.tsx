'use client'

import { useEffect, useState } from 'react'
import type { Catalogo } from '@/lib/catalogo'
import { formatoNota, formatoTiempo, type VistaEstudiante } from '@/lib/aulas'
import { conRenglonLibre, estaVacia, type Fila } from '@/lib/practica'
import { apiAulas, guardarBorrador, leerBorrador, type MiAula } from '@/lib/misAulas'
import HojaAsiento from './HojaAsiento'
import Enunciado from './Enunciado'
import TextoPlegado from './TextoPlegado'

const aFilas = (lineas: { codigo: string; columna: 'debe' | 'haber'; importe: number }[]): Fila[] =>
  lineas.map((l) => ({ codigo: l.codigo, debe: l.columna === 'debe' ? l.importe : null, haber: l.columna === 'haber' ? l.importe : null }))

const iguales = (a: Fila[], b: Fila[]) =>
  JSON.stringify(a.filter((f) => !estaVacia(f))) === JSON.stringify(b.filter((f) => !estaVacia(f)))

/**
 * Lo que ve un estudiante en el aula: la espera, el ejercicio en curso con su hoja y el
 * tiempo corriendo, el envío (y el reenvío hasta que le califiquen), su nota y, cuando
 * el docente la publica, la solución, que queda guardada en «De mis clases».
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
  const actual = vista.actual
  const clave = actual ? `${actual.id}` : ''
  const [filas, setFilas] = useState<Fila[]>(() =>
    conRenglonLibre(actual ? leerBorrador(aula.codigo, actual.id) ?? actual.entrega?.filas ?? [] : []),
  )
  const [deEjercicio, setDeEjercicio] = useState(clave)
  const [enviando, setEnviando] = useState(false)
  /** Cuándo se hizo el último envío, hasta que la vista lo refleje: evita reenviar sin querer. */
  const [enviadoEn, setEnviadoEn] = useState<number | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [reloj, setReloj] = useState(() => Date.now())

  // Llega otro ejercicio: la hoja cambia a su borrador (o vacía).
  if (clave !== deEjercicio) {
    setDeEjercicio(clave)
    setFilas(conRenglonLibre(actual ? leerBorrador(aula.codigo, actual.id) ?? actual.entrega?.filas ?? [] : []))
    setError(null)
    setEnviadoEn(null)
  }

  // El tiempo corre en pantalla hasta que envía; lo que cuenta es el del servidor.
  const corriendo = Boolean(actual && !actual.entrega && vista.aula.estado === 'abierta')
  useEffect(() => {
    if (!corriendo) return
    const t = setInterval(() => setReloj(Date.now()), 1000)
    return () => clearInterval(t)
  }, [corriendo])

  const cambiar = (siguientes: Fila[]) => {
    setFilas(siguientes)
    if (actual) guardarBorrador(aula.codigo, actual.id, siguientes)
  }

  const enviar = async () => {
    if (!actual) return
    setEnviando(true)
    setError(null)
    try {
      const r = await apiAulas.accion<{ segundos: number; enviada: number }>(aula.codigo, aula.clave, 'entregar', {
        ejercicio: actual.id, filas: filas.filter((f) => !estaVacia(f)),
      })
      setEnviadoEn(r.enviada)
      onCambio()
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setEnviando(false)
    }
  }

  if (!actual) {
    return (
      <div className="px-2 py-10 text-center sm:px-0">
        <p className="text-[17px] text-tinta">
          {vista.aula.estado === 'cerrada' ? 'El aula se cerró.' : `Esperando a que ${vista.aula.docente} lance un ejercicio…`}
        </p>
        <p className="mt-2 text-[13.5px] text-tinta-tenue">
          {vista.miembros} {vista.miembros === 1 ? 'persona' : 'personas'} en el aula
        </p>
      </div>
    )
  }

  const entrega = actual.entrega
  const calificada = entrega?.calificacion ?? null
  const cerrada = vista.aula.estado === 'cerrada'
  const bloqueada = Boolean(calificada) || cerrada
  const escritas = filas.filter((f) => !estaVacia(f)).length
  // Enviado, pero la vista aún no trae la entrega: el botón espera en vez de ofrecer «Enviar» otra vez.
  const porLlegar = enviadoEn !== null && (entrega?.enviada ?? 0) < enviadoEn
  const sinCambios = porLlegar || (entrega ? iguales(filas, entrega.filas) : false)
  const segundos = entrega ? entrega.segundos : actual.recibido ? (reloj + desfase - actual.recibido) / 1000 : 0

  return (
    <>
      <Enunciado grupo={actual.grupo} titulo={actual.titulo} enunciado={actual.enunciado} datos={actual.datos} />

      <p className="tabular mt-4 px-2 text-[13px] text-tinta-suave sm:px-0">
        {entrega ? `Enviado en ${formatoTiempo(segundos)}` : `Tiempo: ${formatoTiempo(segundos)}`}
      </p>

      <section className="mt-2">
        <HojaAsiento filas={bloqueada && entrega ? entrega.filas : filas} onCambiar={cambiar} catalogo={catalogo} bloqueada={bloqueada} />
      </section>

      {calificada && (
        <section className="mt-4 rounded-xl border border-borde bg-superficie px-4 py-4">
          <p className="rotulo">Tu nota</p>
          <p className="tabular mt-1 text-[34px] leading-none text-tinta">{formatoNota(calificada.nota)}<span className="text-[16px] text-tinta-tenue"> / 5</span></p>
          {calificada.comentario && <p className="mt-2 text-[14.5px] leading-relaxed text-tinta-suave">{calificada.comentario}</p>}
        </section>
      )}

      {!calificada && entrega && !cerrada && (
        <p className="mt-3 px-2 text-[13px] leading-relaxed text-tinta-tenue sm:px-0">
          Puedes corregir y reenviar hasta que te califiquen; cuenta el último envío.
        </p>
      )}
      {cerrada && !entrega && (
        <p className="mt-3 px-2 text-[13.5px] font-medium sm:px-0" style={{ color: 'var(--color-baja-tinta)' }}>
          El aula se cerró antes de que enviaras.
        </p>
      )}

      {actual.solucionPublicada && actual.solucion && (
        <section className="mt-6">
          <p className="rotulo mb-2 px-2 sm:px-0">Solución</p>
          <HojaAsiento filas={aFilas(actual.solucion)} onCambiar={() => {}} catalogo={catalogo} bloqueada />
          {actual.explicacion && (
            <div className="mt-4 px-2 text-[14.5px] leading-relaxed text-tinta-suave sm:px-0">
              <TextoPlegado texto={actual.explicacion} />
            </div>
          )}
          <p className="mt-3 px-2 text-[12.5px] text-tinta-tenue sm:px-0">Guardado en «De mis clases» (Entrenar › El asiento) para repasarlo cuando termine el aula.</p>
        </section>
      )}

      {!bloqueada && (
        <div className="sticky bottom-0 -mx-3 mt-5 border-t border-borde bg-lienzo px-4 pt-3 sm:-mx-5" style={{ paddingBottom: 'calc(0.75rem + var(--seguro-abajo))' }}>
          <button
            type="button"
            onClick={enviar}
            disabled={enviando || escritas === 0 || sinCambios}
            className="tactil w-full rounded-xl bg-tinta text-[15px] text-white transition-opacity active:bg-[#3d4347] disabled:opacity-30"
          >
            {enviando ? 'Enviando…' : escritas === 0 ? 'Escribe el asiento' : sinCambios ? 'Enviado' : entrega ? 'Reenviar' : 'Enviar'}
          </button>
          {error && <p className="mt-2 text-center text-[13px]" style={{ color: 'var(--color-baja-tinta)' }}>{error}</p>}
        </div>
      )}
    </>
  )
}
