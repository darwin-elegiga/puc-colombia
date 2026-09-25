'use client'

import type { Ficha } from '@/lib/tipos'
import type { Movimiento } from '@/lib/movimientos'
import { ESTADO_FINANCIERO, nombreLegible } from '@/lib/puc'
import LecturaCodigo from './LecturaCodigo'
import { Codigo, InsigniaClase, InsigniaNaturaleza, InsigniaNivel, InsigniaOrigen, franjaClase } from './Insignias'
import { colorDe } from '@/lib/puc'
import { IconoMas, IconoPapelera, IconoIntercambio, IconoCapas } from './Iconos'
import { GUIA_CLASES, GUIA_GRUPOS } from '@/data/guia'
import { FuenteOficial } from './MapaClases'

export default function FichaCuenta({
  ficha,
  descripcion,
  movimientos,
  onIr,
  onVerMovimiento,
  onCrearHija,
  onEliminar,
  onVerEnMapa,
}: {
  ficha: Ficha
  descripcion: { texto: string; heredadaDe?: string }
  movimientos: Movimiento[]
  onIr: (codigo: string) => void
  onVerMovimiento: (id: string) => void
  onCrearHija: (codigoPadre: string) => void
  onEliminar: (codigo: string) => void
  /** Abre la clase o el grupo de esta cuenta en el mapa de clases. */
  onVerEnMapa: (codigo: string) => void
}) {
  const guiaClase = ficha.nivel === 'clase' ? GUIA_CLASES[ficha.codigo] : undefined
  const guiaGrupo = ficha.nivel === 'grupo' ? GUIA_GRUPOS[ficha.codigo] : undefined
  const enMapa = ficha.codigo.slice(0, 2)
  return (
    <article className="surgir panel-scroll h-full overflow-y-auto">
      <div className="mx-auto max-w-2xl px-5 py-6 lg:px-8 lg:py-8">
        {/* Ruta jerárquica */}
        {ficha.ancestros.length > 0 && (
          <nav className="-ml-1 mb-4 flex flex-wrap items-center gap-x-1 gap-y-1 text-[13px] text-tinta-tenue">
            {ficha.ancestros.map((a) => (
              <span key={a.codigo} className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => onIr(a.codigo)}
                  className="min-h-9 rounded-lg px-2 py-1 pulsable"
                >
                  <Codigo valor={a.codigo} /> {nombreLegible(a.nombre)}
                </button>
                <span aria-hidden>/</span>
              </span>
            ))}
          </nav>
        )}

        <header className="border-l-4 pl-4" style={{ borderColor: colorDe(ficha.codigo).borde }}>
          <Codigo valor={ficha.codigo} className="block text-[26px] lg:text-3xl" />
          <h2 className="editorial mt-1 text-[30px] text-tinta lg:text-4xl">{nombreLegible(ficha.nombre)}</h2>
          <div className="mt-3 flex flex-wrap items-center gap-1.5">
            <InsigniaClase codigo={ficha.codigo} />
            <InsigniaNivel nivel={ficha.nivel} />
            <InsigniaNaturaleza naturaleza={ficha.naturaleza} forzada={ficha.naturalezaForzada} />
            <InsigniaOrigen origen={ficha.origen} />
          </div>
        </header>

        {ficha.naturalezaForzada && (
          <p
            className="mt-4 rounded-lg px-3.5 py-2.5 text-[13.5px] leading-relaxed"
            style={{ background: 'var(--color-nota)', color: 'var(--color-nota-tinta)' }}
          >
            Cuenta de contrapartida: su naturaleza es contraria a la de la clase {ficha.codigo[0]}, por eso resta en
            lugar de sumar.
          </p>
        )}

        {(guiaClase || guiaGrupo) && (
          <section className="mt-6">
            <p className="rotulo mb-2">En palabras simples</p>
            <p className="text-[16px] leading-relaxed text-tinta">{(guiaClase ?? guiaGrupo)!.simple}</p>
            <p className="mt-2 text-[14px] leading-relaxed text-tinta-suave">
              {guiaClase ? `Pregúntate: ${guiaClase.pregunta}` : `Cuándo se usa: ${guiaGrupo!.cuando}`}
            </p>
          </section>
        )}

        {descripcion.texto && (
          <section className="mt-6">
            <p className="rotulo mb-2">{ficha.textoOficial ? 'Qué registra · texto oficial' : 'Qué registra'}</p>
            <div className="space-y-2.5 text-[15px] leading-relaxed text-tinta">
              {descripcion.texto.split('\n\n').map((parrafo) => (
                <p key={parrafo}>{parrafo}</p>
              ))}
            </div>
            {ficha.textoOficial && !descripcion.heredadaDe && <FuenteOficial />}
            {descripcion.heredadaDe && (
              <p className="mt-1.5 text-[11px] text-tinta-tenue">
                Descripción tomada de{' '}
                <button type="button" onClick={() => onIr(descripcion.heredadaDe!)} className="tabular underline underline-offset-2 hover:text-tinta">
                  {descripcion.heredadaDe}
                </button>
                , su nivel superior.
              </p>
            )}
          </section>
        )}

        {ficha.origen === 'oficial' && (
          <button
            type="button"
            onClick={() => onVerEnMapa(enMapa)}
            className="tactil mt-5 inline-flex items-center gap-2 rounded-xl border border-borde bg-superficie px-4 text-[14px] text-tinta-suave pulsable lg:min-h-9 lg:text-[13px] lg:hover:border-borde-fuerte"
          >
            <IconoCapas className="size-4" />
            {ficha.nivel === 'clase' ? 'Ver sus grupos en el mapa' : `Ver el grupo ${enMapa} en el mapa`}
          </button>
        )}

        {/* Lectura del código */}
        <section className="mt-7">
          <p className="rotulo mb-2">Cómo se lee el código</p>
          <div className="rounded-xl border border-borde bg-superficie px-4">
            <LecturaCodigo codigo={ficha.codigo} segmentos={ficha.anatomia} onIr={onIr} compacta />
          </div>
        </section>

        {/* Dinámica */}
        {ficha.dinamica && (
          <section className="mt-7">
            <div className="mb-2 flex items-baseline justify-between gap-3">
              <p className="rotulo">Dinámica</p>
              {ficha.dinamica.heredadaDe && (
                <p className="text-[11px] text-tinta-tenue">
                  Regla general de{' '}
                  <button type="button" onClick={() => onIr(ficha.dinamica!.heredadaDe!)} className="tabular underline underline-offset-2 hover:text-tinta">
                    {ficha.dinamica.heredadaDe}
                  </button>
                </p>
              )}
            </div>
            <div className="grid gap-3 lg:grid-cols-2">
              <BloqueDinamica titulo="Se debita por" items={ficha.dinamica.debita} tono="debito" />
              <BloqueDinamica titulo="Se acredita por" items={ficha.dinamica.acredita} tono="credito" />
            </div>
          </section>
        )}

        {/* Estado financiero */}
        <section className="mt-7 border-t border-borde pt-4">
          <dl className="grid gap-x-6 gap-y-2.5 text-[14px] sm:grid-cols-[auto_1fr]">
            <dt className="text-tinta-tenue">Se presenta en</dt>
            <dd className="text-tinta">{ficha.estadoFinanciero ?? ESTADO_FINANCIERO[ficha.codigo[0]]}</dd>
            <dt className="text-tinta-tenue">Saldo normal</dt>
            <dd className="text-tinta">{ficha.naturaleza === 'debito' ? 'Débito' : 'Crédito'}</dd>
            {ficha.creada && (
              <>
                <dt className="text-tinta-tenue">Creada</dt>
                <dd className="text-tinta">{new Date(ficha.creada).toLocaleDateString('es-CO')}</dd>
              </>
            )}
          </dl>
        </section>

        {/* Subniveles */}
        {ficha.hijos.length > 0 && (
          <section className="mt-7">
            <p className="rotulo mb-2">
              Contiene {ficha.hijos.length} {ficha.hijos.length === 1 ? 'subnivel' : 'subniveles'}
            </p>
            <ul className="overflow-hidden rounded-xl border border-borde bg-superficie">
              {ficha.hijos.map((h) => (
                <li key={h.codigo} className="border-b border-borde last:border-b-0" style={franjaClase(h.codigo)}>
                  <button
                    type="button"
                    onClick={() => onIr(h.codigo)}
                    className="tactil flex w-full items-center gap-3 px-4 text-left pulsable"
                  >
                    <Codigo valor={h.codigo} className="text-[14px] font-medium" />
                    <span className="min-w-0 flex-1 truncate text-[14.5px] text-tinta">{nombreLegible(h.nombre)}</span>
                    <InsigniaOrigen origen={h.origen} />
                  </button>
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* Movimientos donde interviene */}
        {movimientos.length > 0 && (
          <section className="mt-7">
            <p className="rotulo mb-2">Aparece en estos movimientos</p>
            <ul className="overflow-hidden rounded-xl border border-borde bg-superficie">
              {movimientos.map((m) => (
                <li key={m.id} className="border-b border-borde last:border-b-0">
                  <button
                    type="button"
                    onClick={() => onVerMovimiento(m.id)}
                    className="tactil flex w-full items-center gap-3 px-4 py-2.5 text-left pulsable"
                  >
                    <IconoIntercambio className="size-[18px] shrink-0 text-tinta-tenue" />
                    <span className="min-w-0 flex-1">
                      <span className="block text-[14.5px] leading-snug text-tinta">{m.nombre}</span>
                      <span className="text-[12.5px] text-tinta-tenue">{m.categoria}</span>
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* Acciones */}
        <footer className="mt-8 flex flex-wrap gap-2 border-t border-borde pt-5" style={{ paddingBottom: 'var(--seguro-abajo)' }}>
          {ficha.codigo.length < 10 && (
            <button
              type="button"
              onClick={() => onCrearHija(ficha.codigo)}
              className="tactil inline-flex flex-1 items-center justify-center gap-2 rounded-xl border border-borde bg-superficie px-4 text-[14px] text-tinta-suave pulsable lg:min-h-9 lg:flex-none lg:text-[13px]"
            >
              <IconoMas className="size-4" />
              Crear subnivel
            </button>
          )}
          {ficha.origen === 'personalizada' && (
            <button
              type="button"
              onClick={() => onEliminar(ficha.codigo)}
              className="tactil inline-flex flex-1 items-center justify-center gap-2 rounded-xl border border-borde bg-superficie px-4 text-[14px] text-error-tinta pulsable lg:min-h-9 lg:flex-none lg:text-[13px]"
            >
              <IconoPapelera className="size-4" />
              Eliminar
            </button>
          )}
        </footer>
      </div>
    </article>
  )
}

function BloqueDinamica({ titulo, items, tono }: { titulo: string; items: string[]; tono: 'debito' | 'credito' }) {
  return (
    <div className="rounded-xl border border-borde bg-superficie p-4">
      <p
        className="mb-2 inline-flex rounded-full px-2 py-0.5 text-[10px] font-medium uppercase tracking-[0.06em]"
        style={{
          background: tono === 'debito' ? 'var(--color-debito)' : 'var(--color-credito)',
          color: tono === 'debito' ? 'var(--color-debito-tinta)' : 'var(--color-credito-tinta)',
        }}
      >
        {titulo}
      </p>
      <ul className="space-y-1.5">
        {items.map((item, i) =>
          // Los rótulos «§ …» separan tramos de la dinámica oficial, como «Registro de pagos».
          item.startsWith('§ ') ? (
            <li key={`${i}-${item}`} className="pt-2 text-[11px] font-medium uppercase tracking-[0.06em] text-tinta-tenue">
              {item.slice(2)}
            </li>
          ) : (
            <li key={`${i}-${item}`} className="flex gap-2.5 text-[14px] leading-relaxed text-tinta">
              <span className="mt-[7px] size-1 shrink-0 rounded-full bg-borde-fuerte" aria-hidden />
              {item}
            </li>
          ),
        )}
      </ul>
    </div>
  )
}
