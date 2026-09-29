'use client'

import { useEffect, useRef, useState } from 'react'
import type { AulaPublica } from '@/lib/aulas'
import { apiAulas, marcarAulaTerminada, useMisAulas, vigentes, type ErrorRed } from '@/lib/misAulas'
import { useDestino } from '@/lib/navegacion'
import BurbujaAula from './BurbujaAula'
import { IconoCerrar } from './Iconos'

const CLAVE_DESCARTADOS = 'puc-colombia:avisos-aula-descartados'

function leerDescartados(): string[] {
  try {
    return JSON.parse(window.sessionStorage.getItem(CLAVE_DESCARTADOS) ?? '[]') as string[]
  } catch {
    return []
  }
}

/**
 * Lo flotante de las aulas, montado una sola vez sobre toda la aplicación (app/page.tsx):
 *  - si este dispositivo está en un aula vigente, la burbuja abajo a la derecha
 *    (BurbujaAula) en cualquier pantalla del catálogo, para volver a ella;
 *  - si no, en el catálogo (portada, resultados, fichas, mapa), la pastilla con la primera
 *    aula pública abierta que no sea propia ni se haya descartado, para unirse.
 * Nada de esto aparece dentro de las aulas ni en las tareas a pantalla completa. Cada aviso
 * se descarta con la «×» durante la sesión. Las públicas se consultan cada 10 s (y al volver
 * a la app) preguntando solo por la versión de la lista; si no cambió, cuesta un comando.
 */
export default function AvisoAulas() {
  const { destino, abrir } = useDestino()
  const onAbrir = (codigo: string) => abrir({ tipo: 'aula', codigo })
  const { aulas } = useMisAulas()
  const [ahora, setAhora] = useState(() => Date.now())
  const [publicas, setPublicas] = useState<AulaPublica[]>([])
  const [descartados, setDescartados] = useState<string[]>(leerDescartados)
  const mia = vigentes(aulas, ahora).find((a) => !descartados.includes(a.codigo))

  /** Pantallas del catálogo: la portada, los resultados, las fichas y el mapa de clases. Las
      tareas a pantalla completa (entrenar, practicar, el asiento con IA) no se interrumpen. */
  const enCatalogo = destino === null || destino.tipo === 'cuenta' || destino.tipo === 'movimiento' || destino.tipo === 'clases'

  // El reloj corre siempre: la burbuja desaparece sola cuando el aula caduca.
  useEffect(() => {
    const t = setInterval(() => setAhora(Date.now()), 30_000)
    return () => clearInterval(t)
  }, [])

  // Las aulas en las que este dispositivo es estudiante (aunque se haya ocultado la
  // burbuja): una comprobación ligera al montar, cada minuto y al volver a la pestaña. Si
  // el docente la cerró, caducó o sacaron a este estudiante, deja de condicionar la app.
  // Se salta el aula que está abierta en pantalla: su vista ya la consulta.
  const comoEstudiante = vigentes(aulas, ahora).filter((a) => a.rol === 'estudiante')
  const aComprobar = comoEstudiante
    .filter((a) => !(destino?.tipo === 'aula' && destino.codigo === a.codigo))
    .map((a) => `${a.codigo}|${a.clave}`)
    .join(',')
  const versiones = useRef(new Map<string, number>())
  /** Aulas en las que el quiz está en curso y este estudiante aún no lo envió: la burbuja lo marca. */
  const [pendientes, setPendientes] = useState<string[]>([])
  useEffect(() => {
    if (!aComprobar) return
    const lista = aComprobar.split(',').map((x) => {
      const [codigo, clave] = x.split('|')
      return { codigo, clave }
    })
    const comprobar = () => {
      if (document.visibilityState !== 'visible') return
      for (const { codigo, clave } of lista) {
        apiAulas
          // Con la versión conocida, si nada cambió el servidor responde con un solo comando.
          .estado(codigo, clave, versiones.current.get(codigo))
          .then((v) => {
            versiones.current.set(codigo, v.version)
            if (!('aula' in v)) return
            if (v.aula.estado === 'cerrada') marcarAulaTerminada(codigo)
            if (v.rol === 'estudiante') {
              const falta = v.quiz.estado === 'en-curso' && !v.quiz.enviado
              setPendientes((p) => (falta ? (p.includes(codigo) ? p : [...p, codigo]) : p.filter((c) => c !== codigo)))
            }
          })
          .catch((e: ErrorRed) => {
            if (e.estado === 404 || e.estado === 403 || e.estado === 401) marcarAulaTerminada(codigo)
          })
      }
    }
    const primera = setTimeout(comprobar, 0)
    const t = setInterval(comprobar, 60_000)
    document.addEventListener('visibilitychange', comprobar)
    return () => {
      clearTimeout(primera)
      clearInterval(t)
      document.removeEventListener('visibilitychange', comprobar)
    }
  }, [aComprobar])

  // Sin aula propia: las públicas, en cualquier pantalla del catálogo (el panel de aulas ya
  // las consulta). Cada 10 s y al volver a la app se pregunta solo por la versión de la lista:
  // si no cambió, el servidor responde con un comando; si cambió, llega la lista nueva.
  const versionPublicas = useRef<number | undefined>(undefined)
  useEffect(() => {
    if (mia || !enCatalogo) return
    let vivo = true
    const cargar = (siempre = false) => {
      if (!siempre && document.visibilityState !== 'visible') return
      apiAulas
        .publicasDesde(versionPublicas.current)
        .then((r) => {
          if (!vivo) return
          versionPublicas.current = r.version
          if ('aulas' in r) setPublicas(r.aulas)
        })
        .catch(() => undefined)
    }
    cargar(true)
    const reloj = setInterval(cargar, 10_000)
    // «focus» y «visibilitychange» llegan juntos al volver: una sola consulta.
    let ultima = 0
    const alVolver = () => {
      if (Date.now() - ultima < 2000) return
      ultima = Date.now()
      cargar()
    }
    document.addEventListener('visibilitychange', alVolver)
    window.addEventListener('focus', alVolver)
    return () => {
      vivo = false
      clearInterval(reloj)
      document.removeEventListener('visibilitychange', alVolver)
      window.removeEventListener('focus', alVolver)
    }
  }, [mia, enCatalogo])

  // La invitación a un aula pública ajena, en el catálogo: la primera que no sea propia ni
  // se haya descartado.
  // Sin las caducadas: la lista guardada puede ser de hace un rato.
  const publica = publicas.find(
    (p) => p.expira > ahora && !descartados.includes(p.codigo) && !aulas.some((a) => a.codigo === p.codigo),
  )

  // Con la burbuja o la pastilla a la vista, las pantallas dejan espacio al final para que no tapen nada.
  const flotanteVisible = mia ? destino?.tipo !== 'aula' && destino?.tipo !== 'aulas' : Boolean(enCatalogo && publica)
  useEffect(() => {
    document.body.classList.toggle('con-burbuja', flotanteVisible)
    return () => document.body.classList.remove('con-burbuja')
  }, [flotanteVisible])

  const descartar = (codigo: string) => {
    const lista = [...descartados, codigo]
    setDescartados(lista)
    try {
      window.sessionStorage.setItem(CLAVE_DESCARTADOS, JSON.stringify(lista))
    } catch {
      // Sin almacenamiento: se oculta hasta recargar.
    }
  }

  if (destino?.tipo === 'aula' || destino?.tipo === 'aulas') return null

  if (mia) {
    return (
      <BurbujaAula
        etiqueta={mia.nombreAula}
        rol={mia.rol}
        pendiente={mia.rol === 'estudiante' && pendientes.includes(mia.codigo)}
        onAbrir={() => onAbrir(mia.codigo)}
        onDescartar={() => descartar(mia.codigo)}
      />
    )
  }

  const aviso =
    enCatalogo && publica
      ? { codigo: publica.codigo, rotulo: `Quiz abierto · con ${publica.docente}`, titulo: publica.nombre, accion: 'Unirme' }
      : null
  if (!aviso) return null

  return (
    <div
      className="subir fixed left-1/2 z-20 flex w-[min(26rem,calc(100%-1.5rem))] -translate-x-1/2 items-center gap-1 rounded-2xl border border-borde bg-superficie p-1.5 shadow-[0_8px_30px_rgba(0,0,0,0.10)] bottom-[calc(var(--seguro-abajo)+5rem)] lg:bottom-6"
    >
      <button type="button" onClick={() => onAbrir(aviso.codigo)} className="flex min-h-12 min-w-0 flex-1 items-center gap-3 rounded-xl px-2.5 text-left pulsable">
        <span className="relative flex size-2.5 shrink-0" aria-hidden>
          <span className="absolute inline-flex size-full motion-safe:animate-ping rounded-full opacity-60" style={{ background: 'var(--color-sube-tinta)' }} />
          <span className="relative inline-flex size-2.5 rounded-full" style={{ background: 'var(--color-sube-tinta)' }} />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-[11.5px] text-tinta-tenue">{aviso.rotulo}</span>
          <span className="block truncate text-[14.5px] font-medium text-tinta">{aviso.titulo}</span>
        </span>
        <span className="shrink-0 rounded-lg bg-tinta px-3 py-1.5 text-[13px] font-medium text-white">{aviso.accion}</span>
      </button>
      <button
        type="button"
        onClick={() => descartar(aviso.codigo)}
        aria-label="Ocultar el aviso"
        className="grid size-10 shrink-0 place-items-center rounded-xl text-tinta-tenue transition-colors hover:text-tinta"
      >
        <IconoCerrar className="size-4" />
      </button>
    </div>
  )
}
