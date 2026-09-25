'use client'

import type { Catalogo } from '@/lib/catalogo'
import { hijosDe, resumir } from '@/lib/catalogo'
import { ESTADO_FINANCIERO, PALETA_CLASE, nombreLegible } from '@/lib/puc'
import { GUIA_CLASES, GUIA_GRUPOS, REGLA_LADO, type GuiaClase } from '@/data/guia'
import type { Cuenta } from '@/lib/tipos'
import { InsigniaLado, InsigniaNaturaleza } from './Insignias'
import { IconoChevron } from './Iconos'

/**
 * Mapa de clases: se navega de lo general a lo particular.
 *
 *   mosaico de las nueve clases → una clase y sus grupos → un grupo y sus cuentas → ficha
 *
 * El mosaico reparte la pantalla por prioridad de uso: las cuatro clases que aparecen
 * en casi todo asiento (1, 2, 4, 5) ocupan los cuadros grandes y las cuentas de orden
 * los pequeños. Cada cuadro lleva el color de su clase en el borde, el mismo que sigue
 * marcando sus grupos y cuentas al entrar.
 */
export default function MapaClases({
  catalogo,
  codigo,
  onAbrir,
  onCuenta,
  onSalir,
}: {
  catalogo: Catalogo
  /** Sin código se ve el mosaico; con 1 dígito una clase; con 2 un grupo. */
  codigo?: string
  onAbrir: (codigo?: string) => void
  onCuenta: (codigo: string) => void
  onSalir: () => void
}) {
  const actual = codigo ? catalogo.indice.get(codigo) : undefined
  const clase = actual ? catalogo.indice.get(actual.codigo[0]) : undefined

  return (
    <div className="flex h-dvh flex-col overflow-hidden bg-lienzo">
      <header
        className="z-20 flex shrink-0 items-center gap-1 border-b border-borde bg-lienzo px-2 py-2"
        style={{ paddingTop: 'calc(0.5rem + var(--seguro-arriba))' }}
      >
        <button
          type="button"
          onClick={() => (actual?.codigo.length === 2 ? onAbrir(actual.codigo[0]) : onSalir())}
          className="tactil flex items-center gap-1 rounded-lg pl-2 pr-3 text-[15px] text-tinta pulsable"
        >
          <IconoChevron className="size-5 rotate-180" />
          {actual?.codigo.length === 2 ? nombreLegible(clase!.nombre) : 'Inicio'}
        </button>
        <span className="ml-auto shrink-0 pr-2 text-[13px] text-tinta-tenue">
          {actual ? `${actual.codigo.length === 1 ? 'Clase' : 'Grupo'} ${actual.codigo}` : 'Mapa de clases'}
        </span>
      </header>

      <div key={codigo ?? 'mosaico'} className="surgir panel-scroll min-h-0 flex-1">
        <div className="mx-auto max-w-5xl px-4 py-6 lg:px-8 lg:py-10" style={{ paddingBottom: 'calc(var(--seguro-abajo) + 2rem)' }}>
          {!actual ? (
            <Mosaico catalogo={catalogo} onAbrir={onAbrir} />
          ) : actual.codigo.length === 1 ? (
            <VistaClase catalogo={catalogo} clase={actual} onAbrir={onAbrir} />
          ) : (
            <VistaGrupo catalogo={catalogo} grupo={actual} onAbrir={onAbrir} onCuenta={onCuenta} />
          )}
        </div>
      </div>
    </div>
  )
}

/* ─────────────────────────── Mosaico de clases ─────────────────────────── */

/** Tamaño de cada cuadro según su prioridad, sobre una rejilla de 6 columnas. */
const CUADRO: Record<GuiaClase['prioridad'], string> = {
  1: 'col-span-3 min-h-44 lg:min-h-52',
  2: 'col-span-3 min-h-36',
  3: 'col-span-2 min-h-28',
}

const ORDEN = ['1', '2', '4', '5', '3', '6', '7', '8', '9']

/**
 * El mosaico de las nueve clases. En la portada va sin encabezado ni regla de
 * «¿pagas o te pagan?», solo los cuadros; en el mapa de clases, completo.
 */
export function Mosaico({
  catalogo,
  onAbrir,
  completo = true,
}: {
  catalogo: Catalogo
  onAbrir: (codigo: string) => void
  completo?: boolean
}) {
  return (
    <>
      {completo && (
        <>
          <p className="rotulo">Plan Único de Cuentas</p>
          <h1 className="editorial mt-2 text-[30px] leading-tight text-tinta lg:text-5xl">Las nueve clases</h1>
          <p className="mt-3 max-w-2xl text-[15px] leading-relaxed text-pretty text-tinta-suave">
            Los cuadros grandes son las clases que aparecen en casi todo asiento; los pequeños, las de uso ocasional.
            Entra en una para ver qué es, sus grupos y cuándo se usa cada uno.
          </p>
        </>
      )}

      <div className={`${completo ? 'mt-6' : ''} grid grid-cols-6 gap-2.5 lg:gap-3`}>
        {ORDEN.map((c) => {
          const cuenta = catalogo.indice.get(c)
          const guia = GUIA_CLASES[c]
          if (!cuenta || !guia) return null
          const { borde, tinta, fondo } = PALETA_CLASE[c]
          const grupos = (catalogo.hijosPor.get(c) ?? []).length
          const pequeno = guia.prioridad === 3
          return (
            <button
              key={c}
              type="button"
              onClick={() => onAbrir(c)}
              className={`${CUADRO[guia.prioridad]} group flex flex-col rounded-2xl border-2 bg-superficie p-3.5 text-left transition-transform active:scale-[0.99] lg:p-5 lg:hover:-translate-y-0.5`}
              style={{ borderColor: borde, background: fondo }}
            >
              <span className="flex items-baseline justify-between gap-2">
                <span className="tabular text-[26px] leading-none lg:text-4xl" style={{ color: tinta }}>
                  {c}
                </span>
                {!pequeno && (
                  <span className="text-[11px] uppercase tracking-[0.06em] text-tinta-tenue">
                    {grupos} grupos
                  </span>
                )}
              </span>
              <span className={`mt-2 font-medium leading-snug text-tinta ${pequeno ? 'text-[13px]' : 'text-[16px] lg:text-[18px]'}`}>
                {nombreLegible(cuenta.nombre)}
              </span>
              <span
                className={`mt-1.5 text-[13px] leading-relaxed text-tinta-suave ${pequeno ? 'hidden lg:line-clamp-2' : 'line-clamp-3'}`}
              >
                {guia.simple}
              </span>
              {!pequeno && (
                <span className="mt-auto pt-3 text-[12px] italic leading-snug text-tinta-tenue">{guia.pregunta}</span>
              )}
            </button>
          )
        })}
      </div>

      {completo && (
        <>
          <p className="rotulo mb-2.5 mt-8">¿Pagas o te pagan?</p>
          <ReglaPago />
        </>
      )}
    </>
  )
}

/** La regla que decide la clase según quién paga. */
function ReglaPago({ className = '' }: { className?: string }) {
  return (
    <section className={`grid gap-2.5 sm:grid-cols-2 ${className}`}>
      {(['pago', 'cobro'] as const).map((lado) => {
        const regla = REGLA_LADO[lado]
        return (
          <div key={lado} className="rounded-xl border border-borde bg-superficie p-4">
            <InsigniaLado lado={lado} />
            <p className="mt-2 text-[14px] leading-relaxed text-tinta">{regla.regla}</p>
            <dl className="mt-2.5 space-y-1.5 text-[13px] leading-relaxed">
              <div>
                <dt className="inline font-medium" style={{ color: 'var(--color-tinta)' }}>Débito: </dt>
                <dd className="inline text-tinta-suave">{regla.debito}</dd>
              </div>
              <div>
                <dt className="inline font-medium" style={{ color: 'var(--color-tinta)' }}>Crédito: </dt>
                <dd className="inline text-tinta-suave">{regla.credito}</dd>
              </div>
            </dl>
          </div>
        )
      })}
    </section>
  )
}

/* ─────────────────────────── Una clase ─────────────────────────── */

function VistaClase({
  catalogo,
  clase,
  onAbrir,
}: {
  catalogo: Catalogo
  clase: Cuenta
  onAbrir: (codigo: string) => void
}) {
  const guia = GUIA_CLASES[clase.codigo]
  const { borde: color, tinta, fondo } = PALETA_CLASE[clase.codigo]
  const grupos = hijosDe(catalogo, clase.codigo)

  return (
    <>
      <header className="border-l-4 pl-4" style={{ borderColor: color }}>
        <p className="tabular text-[26px] leading-none lg:text-3xl" style={{ color: tinta }}>
          Clase {clase.codigo}
        </p>
        <h1 className="editorial mt-2 text-[32px] leading-tight text-tinta lg:text-5xl">{nombreLegible(clase.nombre)}</h1>
        <div className="mt-3 flex flex-wrap items-center gap-2 text-[13px] text-tinta-suave">
          <InsigniaNaturaleza naturaleza={clase.naturaleza} />
          <span>Aumenta por {clase.naturaleza === 'debito' ? 'el débito' : 'el crédito'}</span>
          <span aria-hidden>·</span>
          <span>{ESTADO_FINANCIERO[clase.codigo]}</span>
        </div>
      </header>

      {guia && (
        <section className="mt-6">
          <p className="rotulo mb-2">En palabras simples</p>
          <p className="text-[17px] leading-relaxed text-tinta">{guia.simple}</p>
          <p className="mt-2 text-[14px] italic text-tinta-suave">Pregúntate: {guia.pregunta}</p>

          <div className="mt-5 grid gap-2.5 sm:grid-cols-2">
            <LadoClase lado="pago" texto={guia.siPagas} />
            <LadoClase lado="cobro" texto={guia.siTePagan} />
          </div>
        </section>
      )}

      <DefinicionOficial cuenta={clase} />

      <section className="mt-8">
        <div className="mb-3 flex items-baseline justify-between gap-3">
          <p className="rotulo">Sus {grupos.length} grupos</p>
          <p className="text-[12px] text-tinta-tenue">Toca uno para ver sus cuentas</p>
        </div>
        <div className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
          {grupos.map((g) => {
            const guiaGrupo = GUIA_GRUPOS[g.codigo]
            const cuentas = (catalogo.hijosPor.get(g.codigo) ?? []).length
            return (
              <button
                key={g.codigo}
                type="button"
                onClick={() => onAbrir(g.codigo)}
                className="flex flex-col rounded-xl border border-l-4 p-4 text-left transition-colors active:bg-hueso lg:hover:border-borde-fuerte"
                style={{ borderColor: `color-mix(in srgb, ${color} 30%, transparent)`, borderLeftColor: color, background: fondo }}
              >
                <span className="flex items-baseline gap-2.5">
                  <span className="tabular text-[15px]" style={{ color: tinta }}>{g.codigo}</span>
                  <span className="min-w-0 flex-1 text-[15px] font-medium leading-snug text-tinta">{nombreLegible(g.nombre)}</span>
                </span>
                {guiaGrupo && (
                  <>
                    <span className="mt-1.5 text-[13.5px] leading-relaxed text-tinta-suave">{guiaGrupo.simple}</span>
                    <span className="mt-2 text-[13px] leading-relaxed text-tinta">
                      <span className="font-medium">Cuándo: </span>
                      {guiaGrupo.cuando}
                    </span>
                  </>
                )}
                <span className="mt-auto flex flex-wrap items-center gap-2 pt-3 text-[11px] uppercase tracking-[0.06em] text-tinta-tenue">
                  {guiaGrupo?.lado && <InsigniaLado lado={guiaGrupo.lado} />}
                  {cuentas} {cuentas === 1 ? 'cuenta' : 'cuentas'}
                </span>
              </button>
            )
          })}
        </div>
      </section>
    </>
  )
}

function LadoClase({ lado, texto }: { lado: 'pago' | 'cobro'; texto: string }) {
  return (
    <div className="rounded-xl border border-borde bg-superficie p-4">
      <InsigniaLado lado={lado} />
      <p className="mt-2 text-[14px] leading-relaxed text-tinta">{texto}</p>
    </div>
  )
}

/* ─────────────────────────── Un grupo ─────────────────────────── */

function VistaGrupo({
  catalogo,
  grupo,
  onAbrir,
  onCuenta,
}: {
  catalogo: Catalogo
  grupo: Cuenta
  onAbrir: (codigo?: string) => void
  onCuenta: (codigo: string) => void
}) {
  const clase = catalogo.indice.get(grupo.codigo[0])!
  const guia = GUIA_GRUPOS[grupo.codigo]
  const { borde: color, tinta, fondo } = PALETA_CLASE[clase.codigo]
  const cuentas = hijosDe(catalogo, grupo.codigo)

  return (
    <>
      <nav className="-ml-1 mb-4 flex flex-wrap items-center gap-1 text-[13px] text-tinta-tenue">
        <button type="button" onClick={() => onAbrir()} className="min-h-9 rounded-lg px-2 pulsable">
          Inicio
        </button>
        <span aria-hidden>/</span>
        <button type="button" onClick={() => onAbrir(clase.codigo)} className="min-h-9 rounded-lg px-2 pulsable">
          <span className="tabular" style={{ color: tinta }}>{clase.codigo}</span> {nombreLegible(clase.nombre)}
        </button>
      </nav>

      <header className="border-l-4 pl-4" style={{ borderColor: color }}>
        <p className="tabular text-[26px] leading-none lg:text-3xl" style={{ color: tinta }}>
          {grupo.codigo}
        </p>
        <h1 className="editorial mt-2 text-[30px] leading-tight text-tinta lg:text-5xl">{nombreLegible(grupo.nombre)}</h1>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <InsigniaNaturaleza naturaleza={grupo.naturaleza} forzada={grupo.naturalezaForzada} />
          {guia?.lado && <InsigniaLado lado={guia.lado} />}
        </div>
      </header>

      {guia && (
        <section className="mt-6">
          <p className="rotulo mb-2">En palabras simples</p>
          <p className="text-[17px] leading-relaxed text-tinta">{guia.simple}</p>
          <div className="mt-4 rounded-xl border border-borde bg-superficie p-4">
            <p className="rotulo mb-1.5">Cuándo se usa</p>
            <p className="text-[14.5px] leading-relaxed text-tinta">{guia.cuando}</p>
          </div>
        </section>
      )}

      <DefinicionOficial cuenta={grupo} />

      <section className="mt-8">
        <div className="mb-3 flex items-baseline justify-between gap-3">
          <p className="rotulo">Sus {cuentas.length} cuentas</p>
          <p className="text-[12px] text-tinta-tenue">Toca una para ver su ficha</p>
        </div>
        <ul className="grid gap-2.5 lg:grid-cols-2">
          {cuentas.map((c) => {
            const dinamica = c.dinamica
            const debita = dinamica?.debita.find((d) => !d.startsWith('§ '))
            const acredita = dinamica?.acredita.find((d) => !d.startsWith('§ '))
            return (
              <li key={c.codigo}>
                <button
                  type="button"
                  onClick={() => onCuenta(c.codigo)}
                  className="flex h-full w-full flex-col rounded-xl border border-l-4 p-4 text-left transition-colors active:bg-hueso lg:hover:border-borde-fuerte"
                  style={{ borderColor: `color-mix(in srgb, ${color} 30%, transparent)`, borderLeftColor: color, background: fondo }}
                >
                  <span className="flex items-baseline gap-2.5">
                    <span className="tabular text-[15px]" style={{ color: tinta }}>{c.codigo}</span>
                    <span className="min-w-0 flex-1 text-[15px] font-medium leading-snug text-tinta">{nombreLegible(c.nombre)}</span>
                    <IconoChevron className="size-4 shrink-0 self-center text-tinta-tenue" />
                  </span>
                  {c.descripcion && (
                    <span className="mt-1.5 text-[13.5px] leading-relaxed text-tinta-suave">{resumir(c.descripcion, 180)}</span>
                  )}
                  {(debita || acredita) && (
                    <span className="mt-3 grid gap-1.5 border-t border-borde pt-2.5 text-[12.5px] leading-relaxed">
                      {debita && (
                        <span>
                          <span className="font-medium" style={{ color: 'var(--color-tinta)' }}>Se debita </span>
                          <span className="text-tinta-suave">{minuscula(debita)}</span>
                        </span>
                      )}
                      {acredita && (
                        <span>
                          <span className="font-medium" style={{ color: 'var(--color-tinta)' }}>Se acredita </span>
                          <span className="text-tinta-suave">{minuscula(acredita)}</span>
                        </span>
                      )}
                    </span>
                  )}
                </button>
              </li>
            )
          })}
        </ul>
      </section>
    </>
  )
}

/** «Por el valor…» se lee seguido de «Se debita»: «Se debita por el valor…». */
const minuscula = (texto: string) => texto.charAt(0).toLowerCase() + texto.slice(1)

/* ─────────────────────────── Texto oficial ─────────────────────────── */

function DefinicionOficial({ cuenta }: { cuenta: Cuenta }) {
  if (!cuenta.descripcion) return null
  return (
    <section className="mt-7">
      <p className="rotulo mb-2">Definición oficial</p>
      <div className="space-y-2.5 rounded-xl bg-hueso px-4 py-3.5 text-[14px] leading-relaxed text-tinta">
        {cuenta.descripcion.split('\n\n').map((parrafo) => (
          <p key={parrafo}>{parrafo}</p>
        ))}
      </div>
      {cuenta.textoOficial && <FuenteOficial />}
    </section>
  )
}

export function FuenteOficial() {
  return (
    <p className="mt-1.5 text-[11px] text-tinta-tenue">
      Decreto 2650 de 1993, según{' '}
      <a href="https://puc.com.co" target="_blank" rel="noreferrer" className="underline underline-offset-2 hover:text-tinta">
        puc.com.co
      </a>
    </p>
  )
}
