'use client'

import { useState } from 'react'
import type { Catalogo } from '@/lib/catalogo'
import { MAX_NOMBRE } from '@/lib/aulas'
import { apiAulas, guardarMiNombre, leerMiNombre, useMisAulas } from '@/lib/misAulas'
import { useAula } from '@/lib/useAula'
import AulaDocente from './AulaDocente'
import AulaEstudiante from './AulaEstudiante'
import { IconoChevron, IconoSinConexion } from './Iconos'

/**
 * Un aula abierta en pantalla completa. Si este dispositivo ya está dentro (lo recuerda
 * aunque se cierre el navegador), entra directo como docente o estudiante; si llega por
 * un enlace o un código nuevo, pide el nombre para unirse.
 */
export default function VistaAula({ codigo, catalogo, onVolver }: { codigo: string; catalogo: Catalogo; onVolver: () => void }) {
  const { aulas, recordar, olvidar } = useMisAulas()
  const aula = aulas.find((a) => a.codigo === codigo)
  const { vista, error, actualizarYa, desfase } = useAula(aula)
  const [nombre, setNombre] = useState(leerMiNombre)
  const [uniendo, setUniendo] = useState(false)
  const [errorUnion, setErrorUnion] = useState<string | null>(null)

  const unirse = async () => {
    setUniendo(true)
    setErrorUnion(null)
    try {
      const r = await apiAulas.unirse(codigo, nombre)
      guardarMiNombre(nombre.trim())
      recordar({
        codigo, rol: 'estudiante', clave: r.clave, nombre: r.nombre, nombreAula: r.aula.nombre, docente: r.aula.docente,
        publica: r.aula.publica, expira: r.aula.expira, unido: Date.now(),
      })
    } catch (e) {
      setErrorUnion((e as Error).message)
    } finally {
      setUniendo(false)
    }
  }

  const caducada = error?.estado === 404
  const sinPermiso = error?.estado === 403 || error?.estado === 401
  const sinRed = error?.estado === 0

  return (
    <div className="flex h-dvh flex-col overflow-hidden bg-lienzo">
      <header
        className="z-20 flex shrink-0 items-center gap-1 border-b border-borde bg-lienzo px-2 py-2"
        style={{ paddingTop: 'calc(0.5rem + var(--seguro-arriba))' }}
      >
        <button type="button" onClick={onVolver} className="tactil flex items-center gap-1 rounded-lg pl-2 pr-3 text-[15px] text-tinta pulsable">
          <IconoChevron className="size-5 rotate-180" />
          Aulas
        </button>
        <span className="ml-auto min-w-0 truncate pr-2 text-[13px] text-tinta-tenue">
          {aula ? `${aula.nombreAula} · ${aula.rol === 'docente' ? 'la diriges tú' : aula.nombre}` : `Aula ${codigo}`}
        </span>
      </header>

      <div className="panel-scroll min-h-0 flex-1">
        <div className="mx-auto max-w-2xl px-3 py-6 sm:px-5 lg:px-8 lg:py-8">
          {sinRed && (
            <p className="mb-4 flex items-center gap-2 rounded-xl px-4 py-3 text-[13.5px]" style={{ background: 'var(--color-nota)', color: 'var(--color-nota-tinta)' }}>
              <IconoSinConexion className="size-4 shrink-0" />
              Sin conexión: lo que escribes se guarda en tu dispositivo; envíalo cuando vuelva internet.
            </p>
          )}

          {!aula ? (
            <section className="px-2 sm:px-0">
              <p className="rotulo">Entrar al aula</p>
              <p className="tabular mt-2 text-[32px] tracking-[0.18em] text-tinta">{codigo}</p>
              <label className="mt-5 block">
                <span className="rotulo">Tu nombre</span>
                <input
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value.slice(0, MAX_NOMBRE))}
                  autoComplete="name"
                  placeholder="Como te verá el docente"
                  className="mt-2 min-h-12 w-full rounded-xl border border-borde bg-superficie px-3.5 text-tinta outline-none placeholder:text-tinta-tenue focus:border-borde-fuerte"
                />
              </label>
              <button
                type="button"
                onClick={unirse}
                disabled={uniendo || !nombre.trim()}
                className="tactil mt-3 w-full rounded-xl bg-tinta text-[15px] text-white transition-opacity disabled:opacity-30"
              >
                {uniendo ? 'Entrando…' : 'Entrar'}
              </button>
              {errorUnion && <p className="mt-2 text-[13.5px]" style={{ color: 'var(--color-baja-tinta)' }}>{errorUnion}</p>}
            </section>
          ) : vista?.rol === 'docente' ? (
            <AulaDocente aula={aula} vista={vista} catalogo={catalogo} soloCopia={caducada} onCambio={actualizarYa} />
          ) : caducada || sinPermiso ? (
            <section className="px-2 py-8 text-center sm:px-0">
              <p className="text-[17px] text-tinta">{caducada ? 'Esta aula ya caducó.' : error?.message}</p>
              <p className="mt-2 text-[13.5px] leading-relaxed text-tinta-tenue">
                Los ejercicios con la solución publicada siguen en «De mis clases», en Entrenar › El asiento.
              </p>
              <button
                type="button"
                onClick={() => {
                  olvidar(codigo)
                  onVolver()
                }}
                className="tactil mt-5 w-full rounded-xl border border-borde bg-superficie text-[15px] text-tinta-suave"
              >
                Quitarla de mis aulas
              </button>
            </section>
          ) : vista?.rol === 'estudiante' ? (
            <AulaEstudiante aula={aula} vista={vista} catalogo={catalogo} desfase={desfase} onCambio={actualizarYa} />
          ) : (
            <p className="px-2 py-10 text-center text-[14px] text-tinta-tenue">Conectando con el aula…</p>
          )}
        </div>
      </div>
    </div>
  )
}
