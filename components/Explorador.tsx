'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import datosPuc from '@/data/puc.json'
import type { BorradorCuenta, Cuenta, Filtros } from '@/lib/tipos'
import { aCSV, desdeCSV, validarBorrador } from '@/lib/puc'
import {
  arbol, buscar, construirCatalogo, descripcionEfectiva, estadisticas, fichaDe, leerCodigo,
} from '@/lib/catalogo'
import { buscarMovimientos, movimientoPorId, movimientosDeCuenta } from '@/lib/movimientos'
import { descargar, useCuentasPropias } from '@/lib/almacenamiento'
import { useDestino } from '@/lib/navegacion'
import { EJERCICIOS } from '@/lib/ejercicios'
import PanelClases from './PanelClases'
import ListaResultados from './ListaResultados'
import FichaCuenta from './FichaCuenta'
import FichaMovimiento from './FichaMovimiento'
import Entrenador from './Entrenador'
import LecturaCodigo from './LecturaCodigo'
import DialogoNuevaCuenta from './DialogoNuevaCuenta'
import DialogoDatos, { type ResultadoImportacion } from './DialogoDatos'
import Dialogo, { botonSecundario } from './Dialogo'
import Menu from './Menu'
import {
  IconoBalanza, IconoCapas, IconoCerrar, IconoChevron, IconoDescarga, IconoInfo, IconoInstalar,
  IconoLupa, IconoMas, IconoPuntos, IconoSinConexion, IconoSubida,
} from './Iconos'

const OFICIALES = datosPuc.cuentas as unknown as Cuenta[]
const PAGINA = 40
const FILTROS_VACIOS: Filtros = { q: '', clase: '', nivel: '', naturaleza: '', origen: '' }

/** Evento de instalación de la PWA, que solo existe en navegadores basados en Chromium. */
interface EventoInstalacion extends Event {
  prompt: () => Promise<void>
}

export default function Explorador() {
  const { cuentas: propias, agregar, agregarVarias, eliminar, vaciar } = useCuentasPropias()
  const { destino, abrir, cerrar } = useDestino()

  // "borrador" es lo que se está escribiendo; "consulta" es lo que ya se buscó.
  // Se separan para poder teclear un código completo sin que la app reaccione a cada dígito.
  const [borrador, setBorrador] = useState('')
  const [consulta, setConsulta] = useState('')
  const [filtros, setFiltros] = useState<Filtros>(FILTROS_VACIOS)
  const [mostradas, setMostradas] = useState(PAGINA)
  const [expandida, setExpandida] = useState<string | null>(null)
  const [hojaClases, setHojaClases] = useState(false)
  const [dialogo, setDialogo] = useState<'nueva' | 'datos' | 'instalar' | 'acerca' | null>(null)
  const [codigoInicial, setCodigoInicial] = useState('')
  const [aviso, setAviso] = useState<string | null>(null)
  const [sinConexion, setSinConexion] = useState(false)
  const [eventoInstalacion, setEventoInstalacion] = useState<EventoInstalacion | null>(null)

  const campoBusqueda = useRef<HTMLInputElement>(null)

  const catalogo = useMemo(() => construirCatalogo(OFICIALES, propias), [propias])
  const clases = useMemo(() => arbol(catalogo), [catalogo])
  const datos = useMemo(() => estadisticas(catalogo), [catalogo])

  const resultados = useMemo(
    () => buscar(catalogo, { ...filtros, q: consulta }, mostradas),
    [catalogo, filtros, consulta, mostradas],
  )
  const movimientos = useMemo(() => buscarMovimientos(consulta), [consulta])

  const lectura = useMemo(() => {
    const codigo = consulta.trim()
    return /^\d+$/.test(codigo) ? leerCodigo(catalogo, codigo) : null
  }, [consulta, catalogo])

  /* Atajo de teclado, solo relevante con teclado físico. */
  useEffect(() => {
    const alPulsar = (e: KeyboardEvent) => {
      const enCampo = ['INPUT', 'TEXTAREA', 'SELECT'].includes((e.target as HTMLElement)?.tagName)
      if (e.key === '/' && !enCampo) {
        e.preventDefault()
        campoBusqueda.current?.focus()
      }
    }
    window.addEventListener('keydown', alPulsar)
    return () => window.removeEventListener('keydown', alPulsar)
  }, [])

  useEffect(() => {
    const actualizar = () => setSinConexion(!navigator.onLine)
    actualizar()
    window.addEventListener('online', actualizar)
    window.addEventListener('offline', actualizar)
    return () => {
      window.removeEventListener('online', actualizar)
      window.removeEventListener('offline', actualizar)
    }
  }, [])

  useEffect(() => {
    const alPoderInstalar = (evento: Event) => {
      evento.preventDefault()
      setEventoInstalacion(evento as EventoInstalacion)
    }
    window.addEventListener('beforeinstallprompt', alPoderInstalar)
    return () => window.removeEventListener('beforeinstallprompt', alPoderInstalar)
  }, [])

  useEffect(() => {
    if (!aviso) return
    const id = setTimeout(() => setAviso(null), 3200)
    return () => clearTimeout(id)
  }, [aviso])

  /* ─────────────── Acciones ─────────────── */

  const irACuenta = useCallback(
    (codigo: string) => {
      abrir({ tipo: 'cuenta', codigo })
      setHojaClases(false)
    },
    [abrir],
  )

  /** Ejecuta la búsqueda: con Enter, con la lupa o al elegir un ejemplo. */
  const ejecutarBusqueda = useCallback(
    (texto: string) => {
      const limpio = texto.trim()
      setBorrador(texto)
      setConsulta(limpio)
      setMostradas(PAGINA)
      // Un código completo que existe abre su ficha directamente.
      if (/^\d+$/.test(limpio) && catalogo.indice.has(limpio)) abrir({ tipo: 'cuenta', codigo: limpio })
      // En el móvil, esconder el teclado deja ver los resultados.
      campoBusqueda.current?.blur()
    },
    [catalogo, abrir],
  )

  const limpiarBusqueda = useCallback(() => {
    setBorrador('')
    setConsulta('')
    setMostradas(PAGINA)
    campoBusqueda.current?.focus()
  }, [])

  /** Hay texto escrito que todavía no se ha buscado. */
  const pendienteDeBuscar = borrador.trim() !== consulta

  const cambiarFiltros = useCallback((cambios: Partial<Filtros>) => {
    setFiltros((previos) => ({ ...previos, ...cambios }))
    setMostradas(PAGINA)
  }, [])

  const existe = useCallback((codigo: string) => catalogo.indice.has(codigo), [catalogo])
  const segmentosDe = useCallback((codigo: string) => leerCodigo(catalogo, codigo).segmentos, [catalogo])

  const guardarCuenta = (borrador: BorradorCuenta) => {
    const validacion = validarBorrador(borrador, existe)
    if (!validacion.ok || !validacion.cuenta) return
    agregar({ ...validacion.cuenta, creada: new Date().toISOString() })
    setDialogo(null)
    abrir({ tipo: 'cuenta', codigo: validacion.cuenta.codigo })
    setAviso(`Cuenta ${validacion.cuenta.codigo} creada`)
  }

  const importar = (csv: string): ResultadoImportacion => {
    const nuevas: Cuenta[] = []
    const errores: { codigo: string; mensaje: string }[] = []
    // Por longitud, para que cada nivel superior exista antes que sus hijos.
    const enOrden = [...desdeCSV(csv)].sort((a, b) => String(a.codigo).length - String(b.codigo).length)
    const yaExiste = (codigo: string) => existe(codigo) || nuevas.some((c) => c.codigo === codigo)

    for (const fila of enOrden) {
      const validacion = validarBorrador(fila, yaExiste)
      if (validacion.ok && validacion.cuenta) nuevas.push({ ...validacion.cuenta, creada: new Date().toISOString() })
      else errores.push({ codigo: fila.codigo, mensaje: validacion.mensaje ?? 'Fila inválida' })
    }
    if (nuevas.length) agregarVarias(nuevas)
    return { creadas: nuevas.length, errores }
  }

  const exportar = (soloMias: boolean) => {
    const lista = soloMias ? catalogo.lista.filter((c) => c.origen === 'personalizada') : catalogo.lista
    descargar(soloMias ? 'mis-cuentas-puc.csv' : 'puc-colombia.csv', aCSV(lista))
  }

  const eliminarCuenta = (codigo: string) => {
    const conHijos = (catalogo.hijosPor.get(codigo) ?? []).length
    if (conHijos > 0) {
      setAviso(`${codigo} tiene ${conHijos} subnivel(es). Elimínalos primero.`)
      return
    }
    eliminar(codigo)
    cerrar()
    setAviso(`Cuenta ${codigo} eliminada`)
  }

  const instalar = async () => {
    if (!eventoInstalacion) {
      setDialogo('instalar')
      return
    }
    await eventoInstalacion.prompt()
    setEventoInstalacion(null)
  }

  /* ─────────────── Estado derivado ─────────────── */

  const hayFiltros = Boolean(filtros.clase || filtros.nivel || filtros.naturaleza || filtros.origen)
  const ficha = destino?.tipo === 'cuenta' ? fichaDe(catalogo, destino.codigo) : null
  const movimiento = destino?.tipo === 'movimiento' ? movimientoPorId(destino.id) : undefined
  const hayDetalle = Boolean(ficha || movimiento)

  const opcionesMenu = [
    {
      etiqueta: 'Nueva cuenta',
      descripcion: 'Crear una cuenta propia',
      icono: <IconoMas className="size-4" />,
      onSeleccionar: () => { setCodigoInicial(''); setDialogo('nueva') },
    },
    {
      etiqueta: 'Importar y exportar',
      descripcion: 'CSV de cuentas',
      icono: <IconoSubida className="size-4" />,
      onSeleccionar: () => setDialogo('datos'),
    },
    {
      etiqueta: 'Descargar el catálogo',
      descripcion: `${datos.total} cuentas en CSV`,
      icono: <IconoDescarga className="size-4" />,
      onSeleccionar: () => exportar(false),
    },
    {
      etiqueta: 'Instalar en el teléfono',
      descripcion: 'Para usarla sin conexión',
      icono: <IconoInstalar className="size-4" />,
      onSeleccionar: instalar,
    },
    {
      etiqueta: 'Sobre el catálogo',
      icono: <IconoInfo className="size-4" />,
      onSeleccionar: () => setDialogo('acerca'),
    },
  ]

  /*
    El entrenamiento no es una consulta del catálogo sino una tarea con principio
    y final, así que se lleva la pantalla entera en lugar de vivir en la columna
    de detalle.
  */
  if (destino?.tipo === 'entrenar' || destino?.tipo === 'ejercicio') {
    return (
      <Entrenador
        catalogo={catalogo}
        ejercicioId={destino.tipo === 'ejercicio' ? destino.id : null}
        onAbrir={(id) => abrir({ tipo: 'ejercicio', id })}
        onVolverALista={cerrar}
        onSalir={() => abrir(null)}
      />
    )
  }

  return (
    <div className="flex h-dvh flex-col overflow-hidden">
      {/* ═══════════ Cabecera de búsqueda ═══════════ */}
      <header
        className={[
          'z-30 shrink-0 border-b border-borde bg-lienzo',
          hayDetalle ? 'hidden lg:block' : 'block',
        ].join(' ')}
        style={{ paddingTop: 'var(--seguro-arriba)' }}
      >
        <div className="flex items-center gap-3 px-4 py-2.5 lg:px-5">
          <div className="hidden shrink-0 items-baseline gap-2 lg:flex">
            <span className="editorial text-xl text-tinta">PUC</span>
            <span className="text-[11px] text-tinta-tenue">Colombia</span>
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault()
              ejecutarBusqueda(borrador)
            }}
            role="search"
            className="relative min-w-0 flex-1"
          >
            {/* La lupa busca: se oscurece cuando hay algo escrito sin buscar. */}
            <button
              type="submit"
              aria-label="Buscar"
              className={[
                'absolute left-0 top-1/2 grid size-12 -translate-y-1/2 place-items-center rounded-xl transition-colors lg:size-10',
                pendienteDeBuscar && borrador.trim() ? 'text-tinta' : 'text-tinta-tenue',
              ].join(' ')}
            >
              <IconoLupa className="size-[18px]" />
            </button>

            <input
              ref={campoBusqueda}
              type="search"
              enterKeyHint="search"
              value={borrador}
              onChange={(e) => setBorrador(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Escape') limpiarBusqueda()
              }}
              autoComplete="off"
              autoCorrect="off"
              autoCapitalize="none"
              spellCheck={false}
              placeholder="Código, cuenta o movimiento"
              aria-label="Buscar en el catálogo"
              className="min-h-12 w-full rounded-xl border border-borde bg-superficie pl-12 pr-11 text-tinta outline-none placeholder:text-tinta-tenue focus:border-borde-fuerte lg:min-h-10 lg:rounded-lg"
            />

            {borrador ? (
              <button
                type="button"
                onClick={limpiarBusqueda}
                aria-label="Limpiar búsqueda"
                className="absolute right-1 top-1/2 grid size-11 -translate-y-1/2 place-items-center rounded-lg text-tinta-tenue pulsable lg:size-9"
              >
                <IconoCerrar className="size-4" />
              </button>
            ) : (
              <kbd className="pointer-events-none absolute right-3 top-1/2 hidden -translate-y-1/2 rounded border border-borde bg-hueso px-1.5 py-0.5 font-mono text-[10px] text-tinta-tenue lg:block">
                /
              </kbd>
            )}
          </form>

          {/* Acciones de escritorio: en móvil viven en la barra inferior. */}
          <button
            type="button"
            onClick={() => abrir({ tipo: 'entrenar' })}
            className="hidden shrink-0 items-center gap-1.5 rounded-lg bg-tinta px-3 py-2 text-[13px] text-white hover:bg-[#3d4347] lg:inline-flex"
          >
            <IconoBalanza className="size-3.5" />
            Entrenar
          </button>
          <Menu
            etiqueta="Más opciones"
            opciones={opcionesMenu}
            className="hidden shrink-0 lg:block"
            claseBoton="grid size-9 place-items-center rounded-lg border border-borde bg-superficie text-tinta-suave hover:border-borde-fuerte hover:text-tinta"
          >
            <IconoPuntos className="size-4" />
          </Menu>
        </div>

        {sinConexion && (
          <p className="flex items-center justify-center gap-1.5 border-t border-borde bg-hueso py-1.5 text-[12px] text-tinta-suave">
            <IconoSinConexion className="size-3.5" />
            Sin conexión — el catálogo sigue disponible
          </p>
        )}
      </header>

      {/*
        ═══════════ Cuerpo ═══════════
        Las columnas llevan min-w-0: por omisión un hijo de grid no baja de su
        contenido, así que una descripción larga ensanchaba el panel más allá de
        la pantalla y el texto quedaba cortado por la derecha en el móvil.
      */}
      <div className="grid min-h-0 flex-1 lg:grid-cols-[15rem_24rem_1fr]">
        {/* Lateral: solo escritorio. En móvil es la hoja inferior. */}
        <aside className="panel-scroll hidden min-w-0 border-r border-borde bg-lienzo lg:block">
          <div className="border-b border-borde px-5 py-3">
            <p className="rotulo">Las nueve clases</p>
          </div>
          <PanelClases
            clases={clases}
            filtros={filtros}
            onFiltros={cambiarFiltros}
            onIr={irACuenta}
            expandida={expandida}
            onExpandir={setExpandida}
            propias={propias.length}
          />
        </aside>

        {/* Resultados */}
        <section
          className={[
            'flex min-h-0 min-w-0 flex-col border-borde lg:border-r',
            hayDetalle ? 'hidden lg:flex' : 'flex',
          ].join(' ')}
        >
          <ListaResultados
            cuentas={resultados}
            movimientos={movimientos}
            seleccion={destino}
            onSeleccionar={(d) => { abrir(d); setHojaClases(false) }}
            mostradas={mostradas}
            onVerMas={() => setMostradas((n) => n + PAGINA)}
            encabezado={
              <>
                {lectura && (
                  <div className="border-b border-borde bg-superficie px-5 py-4">
                    <div className="mb-2 flex items-baseline justify-between gap-3">
                      <p className="rotulo">Lectura del código</p>
                      <p className="text-[12px] text-tinta-tenue">
                        {lectura.longitudValida
                          ? `${lectura.codigo.length} ${lectura.codigo.length === 1 ? 'dígito' : 'dígitos'}`
                          : 'Longitud no válida'}
                      </p>
                    </div>
                    <LecturaCodigo
                      codigo={lectura.codigo}
                      segmentos={lectura.segmentos}
                      longitudValida={lectura.longitudValida}
                      onIr={irACuenta}
                      compacta
                    />
                  </div>
                )}

                {hayFiltros && (
                  <div className="flex items-center justify-between gap-3 border-b border-borde px-5 py-2.5">
                    <p className="text-[13px] text-tinta-suave">Filtros activos</p>
                    <button
                      type="button"
                      onClick={() => { setFiltros(FILTROS_VACIOS); setMostradas(PAGINA) }}
                      className="min-h-9 rounded-lg border border-borde bg-superficie px-3 text-[13px] text-tinta-suave pulsable"
                    >
                      Quitar
                    </button>
                  </div>
                )}

                {!consulta && !hayFiltros && (
                  <IntroCompacta
                    onEjemplo={ejecutarBusqueda}
                    onEntrenar={() => abrir({ tipo: 'entrenar' })}
                  />
                )}
              </>
            }
          />
        </section>

        {/* Detalle */}
        <section
          className={['min-h-0 min-w-0 flex-col bg-lienzo', hayDetalle ? 'flex' : 'hidden lg:flex'].join(' ')}
        >
          {hayDetalle && (
            <div
              className="z-20 flex shrink-0 items-center gap-1 border-b border-borde bg-lienzo px-2 py-2 lg:hidden"
              style={{ paddingTop: 'calc(0.5rem + var(--seguro-arriba))' }}
            >
              <button
                type="button"
                onClick={cerrar}
                className="tactil flex items-center gap-1 rounded-lg pl-2 pr-3 text-[15px] text-tinta pulsable"
              >
                <IconoChevron className="size-5 rotate-180" />
                Resultados
              </button>
              <span className="tabular ml-auto truncate pr-2 text-[13px] text-tinta-tenue">
                {ficha?.codigo ?? movimiento?.categoria}
              </span>
            </div>
          )}

          <div className="min-h-0 flex-1">
            {ficha ? (
              <FichaCuenta
                key={ficha.codigo}
                ficha={ficha}
                descripcion={descripcionEfectiva(catalogo, ficha)}
                movimientos={
                  // En clases y grupos la lista sería casi todo el catálogo de operaciones:
                  // solo se muestra a partir del nivel de cuenta, donde es informativa.
                  ficha.nivel === 'clase' || ficha.nivel === 'grupo' ? [] : movimientosDeCuenta(ficha.codigo)
                }
                onIr={irACuenta}
                onVerMovimiento={(id) => abrir({ tipo: 'movimiento', id })}
                onCrearHija={(padre) => { setCodigoInicial(padre); setDialogo('nueva') }}
                onEliminar={eliminarCuenta}
              />
            ) : movimiento ? (
              <FichaMovimiento
                key={movimiento.id}
                movimiento={movimiento}
                nombreDe={(codigo) => catalogo.indice.get(codigo)}
                onIr={irACuenta}
              />
            ) : (
              <Bienvenida
                total={datos.total}
                onEjemplo={ejecutarBusqueda}
                onEntrenar={() => abrir({ tipo: 'entrenar' })}
              />
            )}
          </div>
        </section>
      </div>

      {/* ═══════════ Barra inferior (solo móvil, solo en la lista) ═══════════ */}
      {!hayDetalle && (
        <nav
          className="z-30 flex shrink-0 items-stretch gap-2 border-t border-borde bg-lienzo px-3 pt-2 lg:hidden"
          style={{ paddingBottom: 'calc(0.5rem + var(--seguro-abajo))' }}
        >
          <button
            type="button"
            onClick={() => setHojaClases(true)}
            className="tactil flex flex-1 items-center justify-center gap-2 rounded-xl border border-borde bg-superficie text-[14px] text-tinta-suave pulsable"
          >
            <IconoCapas className="size-[18px]" />
            Clases
            {hayFiltros && <span className="size-1.5 rounded-full bg-tinta" aria-hidden />}
          </button>

          <button
            type="button"
            onClick={() => abrir({ tipo: 'entrenar' })}
            className="tactil flex flex-1 items-center justify-center gap-2 rounded-xl bg-tinta text-[14px] text-white active:bg-[#3d4347]"
          >
            <IconoBalanza className="size-[18px]" />
            Entrenar
          </button>

          <Menu
            etiqueta="Más opciones"
            opciones={opcionesMenu}
            direccion="arriba"
            className="shrink-0"
            claseBoton="tactil grid h-full w-14 place-items-center rounded-xl border border-borde bg-superficie text-tinta-suave pulsable"
          >
            <IconoPuntos className="size-[18px]" />
          </Menu>
        </nav>
      )}

      {/* ═══════════ Hoja de clases y filtros (móvil) ═══════════ */}
      <Dialogo abierto={hojaClases} titulo="Clases y filtros" onCerrar={() => setHojaClases(false)}>
        <div className="-mx-5 -my-5">
          <PanelClases
            clases={clases}
            filtros={filtros}
            onFiltros={cambiarFiltros}
            onIr={irACuenta}
            expandida={expandida}
            onExpandir={setExpandida}
            propias={propias.length}
          />
        </div>
      </Dialogo>

      {/* ═══════════ Diálogos ═══════════ */}
      <DialogoNuevaCuenta
        key={`nueva-${dialogo}-${codigoInicial}`}
        abierto={dialogo === 'nueva'}
        codigoInicial={codigoInicial}
        existe={existe}
        segmentosDe={segmentosDe}
        onCerrar={() => setDialogo(null)}
        onGuardar={guardarCuenta}
      />

      <DialogoDatos
        abierto={dialogo === 'datos'}
        propias={propias.length}
        onCerrar={() => setDialogo(null)}
        onImportar={importar}
        onExportar={exportar}
        onVaciar={() => { vaciar(); cerrar(); setAviso('Se eliminaron tus cuentas') }}
      />

      <Dialogo
        abierto={dialogo === 'instalar'}
        titulo="Instalar en el teléfono"
        onCerrar={() => setDialogo(null)}
        pie={
          <button type="button" className={botonSecundario} onClick={() => setDialogo(null)}>
            Entendido
          </button>
        }
      >
        <div className="space-y-4 text-[15px] leading-relaxed text-tinta">
          <p>Al instalarla se abre a pantalla completa y funciona sin conexión.</p>
          <div>
            <p className="rotulo mb-1.5">iPhone — Safari</p>
            <p className="text-tinta-suave">
              Toca el botón de compartir y elige <span className="text-tinta">Agregar a inicio</span>.
            </p>
          </div>
          <div>
            <p className="rotulo mb-1.5">Android — Chrome</p>
            <p className="text-tinta-suave">
              Abre el menú de tres puntos y elige <span className="text-tinta">Instalar aplicación</span>.
            </p>
          </div>
        </div>
      </Dialogo>

      <Dialogo
        abierto={dialogo === 'acerca'}
        titulo="Sobre el catálogo"
        onCerrar={() => setDialogo(null)}
        pie={
          <button type="button" className={botonSecundario} onClick={() => setDialogo(null)}>
            Cerrar
          </button>
        }
      >
        <div className="space-y-4 text-[15px] leading-relaxed">
          <dl className="space-y-2.5">
            <Dato etiqueta="Fuente" valor="Decreto 2650 de 1993 y modificaciones" />
            <Dato etiqueta="Registros" valor={`${datos.total} — ${datos.porNivel.clase} clases, ${datos.porNivel.grupo} grupos, ${datos.porNivel.cuenta} cuentas, ${datos.porNivel.subcuenta} subcuentas`} />
            <Dato etiqueta="Tuyas" valor={propias.length ? `${propias.length} guardadas en este dispositivo` : 'Ninguna todavía'} />
          </dl>
          <p className="text-[13.5px] leading-relaxed text-tinta-suave">
            El PUC completo tiene varios miles de subcuentas: aquí están las de mayor uso, y el resto se agrega
            desde la aplicación o importando un CSV. Las clases 7, 8 y 9 traen el detalle esencial.
          </p>
          <p className="text-[13.5px] leading-relaxed text-tinta-suave">
            Con la convergencia a NIIF el Decreto 2650 dejó de ser obligatorio para reconocimiento y medición.
            Se mantiene como catálogo operativo y de referencia, que es el uso que cubre esta aplicación.
          </p>
        </div>
      </Dialogo>

      {aviso && (
        <p
          role="status"
          className="surgir fixed left-1/2 z-40 -translate-x-1/2 rounded-xl border border-borde bg-superficie px-4 py-2.5 text-[14px] text-tinta"
          style={{ bottom: 'calc(var(--seguro-abajo) + 5.5rem)' }}
        >
          {aviso}
        </p>
      )}
    </div>
  )
}

function Dato({ etiqueta, valor }: { etiqueta: string; valor: string }) {
  return (
    <div>
      <dt className="rotulo">{etiqueta}</dt>
      <dd className="mt-0.5 text-[14px] text-tinta">{valor}</dd>
    </div>
  )
}

const EJEMPLOS = ['1105', '110505', '2365', 'depreciación', 'consigno el dinero', 'pago la nómina']

/** Presentación breve en la lista del móvil, donde no hay tercera columna. */
function IntroCompacta({
  onEjemplo,
  onEntrenar,
}: {
  onEjemplo: (texto: string) => void
  onEntrenar: () => void
}) {
  return (
    <div className="border-b border-borde px-5 py-5 lg:hidden">
      <h1 className="editorial text-[26px] text-tinta">Qué significa cada código, dígito a dígito.</h1>
      <p className="mt-2 text-[14px] leading-relaxed text-tinta-suave">
        Escribe un código, un nombre de cuenta o la operación que necesitas registrar.
      </p>
      <div className="mt-4 flex flex-wrap gap-2">
        {EJEMPLOS.map((e) => (
          <button
            key={e}
            type="button"
            onClick={() => onEjemplo(e)}
            className="min-h-10 rounded-lg border border-borde bg-superficie px-3 text-[13.5px] text-tinta-suave pulsable"
          >
            {e}
          </button>
        ))}
      </div>

      <EntradaEntrenamiento onEntrenar={onEntrenar} className="mt-4" />
    </div>
  )
}

/** Acceso al entrenamiento desde las pantallas de inicio. */
function EntradaEntrenamiento({
  onEntrenar,
  className = '',
}: {
  onEntrenar: () => void
  className?: string
}) {
  return (
    <button
      type="button"
      onClick={onEntrenar}
      className={`tactil flex w-full items-center gap-3 rounded-xl border border-borde bg-superficie px-4 py-3 text-left pulsable lg:hover:border-borde-fuerte ${className}`}
    >
      <IconoBalanza className="size-5 shrink-0 text-tinta-suave" />
      <span className="min-w-0 flex-1">
        <span className="block text-[15px] leading-snug text-tinta">Entrena el debe y el haber</span>
        <span className="block truncate text-[12.5px] text-tinta-tenue">
          {EJERCICIOS.length} ejercicios, de menor a mayor dificultad
        </span>
      </span>
      <IconoChevron className="size-4 shrink-0 text-tinta-tenue" />
    </button>
  )
}

function Bienvenida({
  total,
  onEjemplo,
  onEntrenar,
}: {
  total: number
  onEjemplo: (texto: string) => void
  onEntrenar: () => void
}) {
  return (
    <div className="surgir panel-scroll h-full">
      <div className="mx-auto max-w-xl px-8 py-14">
        <p className="rotulo">Plan Único de Cuentas</p>
        <h1 className="editorial mt-3 text-5xl text-tinta">Qué significa cada código, dígito a dígito.</h1>
        <p className="mt-4 text-[15px] leading-relaxed text-tinta-suave">
          Escribe un código y verás cómo se descompone en clase, grupo, cuenta y subcuenta. Escribe un nombre y
          encontrarás la cuenta. Escribe una operación del día a día y verás qué se debita y qué se acredita.
        </p>

        <div className="mt-7">
          <p className="rotulo mb-2.5">Prueba con</p>
          <div className="flex flex-wrap gap-2">
            {EJEMPLOS.map((e) => (
              <button
                key={e}
                type="button"
                onClick={() => onEjemplo(e)}
                className="min-h-9 rounded-lg border border-borde bg-superficie px-3 text-[13px] text-tinta-suave transition-colors hover:border-borde-fuerte hover:text-tinta"
              >
                {e}
              </button>
            ))}
          </div>
        </div>

        <EntradaEntrenamiento onEntrenar={onEntrenar} className="mt-8" />

        <dl className="mt-10 space-y-4 border-t border-borde pt-6 text-[14px]">
          <div className="grid gap-1 sm:grid-cols-[8rem_1fr]">
            <dt className="text-tinta-tenue">Estructura</dt>
            <dd className="text-tinta">1 dígito clase · 2 grupo · 4 cuenta · 6 subcuenta · 7 o más auxiliar</dd>
          </div>
          <div className="grid gap-1 sm:grid-cols-[8rem_1fr]">
            <dt className="text-tinta-tenue">Naturaleza</dt>
            <dd className="text-tinta">Débito en las clases 1, 5, 6, 7 y 8 · Crédito en las clases 2, 3, 4 y 9</dd>
          </div>
          <div className="grid gap-1 sm:grid-cols-[8rem_1fr]">
            <dt className="text-tinta-tenue">Catálogo</dt>
            <dd className="text-tinta">{total} registros del Decreto 2650 de 1993</dd>
          </div>
        </dl>
      </div>
    </div>
  )
}
