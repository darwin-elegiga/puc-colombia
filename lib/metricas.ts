/**
 * Métricas de uso anónimas: qué pantallas se ven, por dónde se pasa de una a otra, desde
 * qué dispositivo y cuánto tiempo.
 *
 * No se guarda nada por persona: ni identificador de sesión, ni IP, ni el contenido que se
 * consulta (solo el tipo de pantalla, nunca la cuenta o el ejercicio). El servidor suma cada
 * evento en un contador del día y descarta el evento.
 */

/** Las pantallas del catálogo, por el tipo de destino de lib/navegacion.ts; «inicio» es la portada. */
export const PANTALLAS = [
  'inicio', 'cuenta', 'movimiento', 'clases', 'asiento', 'entrenar', 'ejercicio', 'practica', 'aulas', 'aula',
] as const
export type Pantalla = (typeof PANTALLAS)[number]

/** Origen ficticio del primer paso de cada sesión, para ver por dónde se entra. */
export const ENTRADA = 'entrada'

export const NOMBRE_PANTALLA: Record<Pantalla | typeof ENTRADA, string> = {
  entrada: 'Entrada',
  inicio: 'Portada',
  cuenta: 'Ficha de cuenta',
  movimiento: 'Movimiento',
  clases: 'Mapa de clases',
  asiento: 'Hazme el asiento',
  entrenar: 'Entrenamiento',
  ejercicio: 'Ejercicio',
  practica: 'Hacer el asiento',
  aulas: 'Aulas',
  aula: 'Un aula',
}

export const TIPOS_DISPOSITIVO = ['movil', 'tableta', 'escritorio'] as const
export const SISTEMAS = ['Android', 'iOS', 'Windows', 'macOS', 'ChromeOS', 'Linux', 'Otro'] as const
export const NAVEGADORES = ['Chrome', 'Safari', 'Firefox', 'Edge', 'Samsung', 'Opera', 'Otro'] as const
export const MODOS = ['instalada', 'navegador'] as const

export const NOMBRE_DISPOSITIVO: Record<string, string> = {
  movil: 'Móvil', tableta: 'Tableta', escritorio: 'Escritorio', instalada: 'App instalada', navegador: 'En el navegador',
}

export interface Dispositivo {
  tipo: (typeof TIPOS_DISPOSITIVO)[number]
  so: (typeof SISTEMAS)[number]
  navegador: (typeof NAVEGADORES)[number]
  modo: (typeof MODOS)[number]
}

/**
 * El dispositivo a partir del user agent. `tactil` distingue el iPad, que desde iPadOS 13
 * se anuncia como un Mac de escritorio.
 */
export function leerDispositivo(ua: string, tactil: boolean, instalada: boolean): Dispositivo {
  const ipadComoMac = /Macintosh/.test(ua) && tactil
  const ios = /iPhone|iPad|iPod/.test(ua) || ipadComoMac
  const android = /Android/.test(ua)

  const tipo: Dispositivo['tipo'] =
    /iPad|Tablet/.test(ua) || ipadComoMac || (android && !/Mobile/.test(ua))
      ? 'tableta'
      : /Mobi|iPhone|iPod|Android/.test(ua)
        ? 'movil'
        : 'escritorio'

  const so: Dispositivo['so'] = android
    ? 'Android'
    : ios
      ? 'iOS'
      : /Windows/.test(ua)
        ? 'Windows'
        : /CrOS/.test(ua)
          ? 'ChromeOS'
          : /Mac OS X|Macintosh/.test(ua)
            ? 'macOS'
            : /Linux/.test(ua)
              ? 'Linux'
              : 'Otro'

  // El orden importa: casi todos dicen «Chrome» y «Safari» además de su propio nombre.
  const navegador: Dispositivo['navegador'] = /SamsungBrowser/.test(ua)
    ? 'Samsung'
    : /Edg(e|A|iOS)?\//.test(ua)
      ? 'Edge'
      : /OPR\/|Opera/.test(ua)
        ? 'Opera'
        : /Firefox\/|FxiOS/.test(ua)
          ? 'Firefox'
          : /Chrome\/|CriOS/.test(ua)
            ? 'Chrome'
            : /Safari\//.test(ua)
              ? 'Safari'
              : 'Otro'

  return { tipo, so, navegador, modo: instalada ? 'instalada' : 'navegador' }
}

/** Tiempo máximo que se le atribuye a una pantalla de una vez: una pestaña olvidada no cuenta horas. */
export const MAX_MS_PANTALLA = 30 * 60_000

/** Lo que manda el navegador. Cada evento se convierte en incrementos de contadores. */
export type Evento =
  /** Empieza una sesión (una pestaña) en una pantalla. */
  | { tipo: 'inicio'; pantalla: Pantalla; dispositivo: Dispositivo; visitante: string | null }
  /** Pasa de una pantalla a otra tras `ms` visibles en la primera. */
  | { tipo: 'paso'; de: Pantalla; a: Pantalla; ms: number }
  /** La app pasa a segundo plano: el tiempo visible acumulado en la pantalla actual. */
  | { tipo: 'tiempo'; pantalla: Pantalla; ms: number }

const esUna = <T extends string>(lista: readonly T[], valor: unknown): valor is T =>
  typeof valor === 'string' && (lista as readonly string[]).includes(valor)

const msValido = (valor: unknown) =>
  typeof valor === 'number' && Number.isFinite(valor) ? Math.min(MAX_MS_PANTALLA, Math.max(0, Math.round(valor))) : 0

/** Identificador aleatorio que el navegador guarda para reconocer a quien vuelve. */
export const VISITANTE_VALIDO = /^[a-z0-9]{16,32}$/

/** Valida un evento recibido: solo valores de las listas, para que nadie invente contadores. */
export function validarEvento(crudo: unknown): Evento | null {
  if (!crudo || typeof crudo !== 'object') return null
  const e = crudo as Record<string, unknown>
  if (e.tipo === 'inicio') {
    const d = e.dispositivo as Record<string, unknown> | null
    if (!esUna(PANTALLAS, e.pantalla) || !d || typeof d !== 'object') return null
    if (!esUna(TIPOS_DISPOSITIVO, d.tipo) || !esUna(SISTEMAS, d.so) || !esUna(NAVEGADORES, d.navegador) || !esUna(MODOS, d.modo)) {
      return null
    }
    const visitante = typeof e.visitante === 'string' && VISITANTE_VALIDO.test(e.visitante) ? e.visitante : null
    return { tipo: 'inicio', pantalla: e.pantalla, dispositivo: { tipo: d.tipo, so: d.so, navegador: d.navegador, modo: d.modo }, visitante }
  }
  if (e.tipo === 'paso') {
    if (!esUna(PANTALLAS, e.de) || !esUna(PANTALLAS, e.a)) return null
    return { tipo: 'paso', de: e.de, a: e.a, ms: msValido(e.ms) }
  }
  if (e.tipo === 'tiempo') {
    if (!esUna(PANTALLAS, e.pantalla)) return null
    const ms = msValido(e.ms)
    return ms > 0 ? { tipo: 'tiempo', pantalla: e.pantalla, ms } : null
  }
  return null
}

/**
 * Los campos del contador del día que suma cada evento:
 *  - sesiones
 *  - vista:{pantalla}          veces que se abrió
 *  - ms:{pantalla}             tiempo visible acumulado
 *  - paso:{de}>{a}             transiciones (de «entrada» en el primer paso)
 *  - disp:{tipo}, so:{…}, nav:{…}, modo:{…}   una vez por sesión
 */
export function incrementos(evento: Evento): Record<string, number> {
  switch (evento.tipo) {
    case 'inicio': {
      const d = evento.dispositivo
      return {
        sesiones: 1,
        [`vista:${evento.pantalla}`]: 1,
        [`paso:${ENTRADA}>${evento.pantalla}`]: 1,
        [`disp:${d.tipo}`]: 1,
        [`so:${d.so}`]: 1,
        [`nav:${d.navegador}`]: 1,
        [`modo:${d.modo}`]: 1,
      }
    }
    case 'paso': {
      const suma: Record<string, number> = { [`vista:${evento.a}`]: 1, [`paso:${evento.de}>${evento.a}`]: 1 }
      if (evento.ms > 0) suma[`ms:${evento.de}`] = evento.ms
      return suma
    }
    case 'tiempo':
      return { [`ms:${evento.pantalla}`]: evento.ms }
  }
}

export interface Conteo {
  clave: string
  n: number
}

export interface ResumenMetricas {
  desde: string
  hasta: string
  sesiones: number
  vistas: number
  /** Milisegundos visibles en total. */
  ms: number
  porDia: { dia: string; sesiones: number; vistas: number }[]
  pantallas: { pantalla: string; vistas: number; ms: number }[]
  pasos: { de: string; a: string; n: number }[]
  dispositivo: { tipo: Conteo[]; so: Conteo[]; navegador: Conteo[]; modo: Conteo[] }
  /** Sesiones de navegadores que no habían entrado antes, y de los que vuelven. */
  nuevos: number
  recurrentes: number
  /** Sesiones por hora del día (0 a 23, hora de Colombia). */
  porHora: number[]
  /** Las entradas del periodo, de la más reciente a la más antigua. */
  entradas: Entrada[]
}

/** Una entrada a la app: cuándo, desde qué dispositivo y si ese navegador ya había entrado. */
export interface Entrada {
  /** Instante en milisegundos. */
  t: number
  pantalla: Pantalla
  dispositivo: Dispositivo
  /** Los primeros caracteres del identificador anónimo, para reconocer al mismo visitante en la lista. */
  visitante: string | null
  /** Qué vez es que entra ese navegador (1 = primera); null si no guarda identificador. */
  visita: number | null
}

const ordenar = (mapa: Map<string, number>): Conteo[] =>
  [...mapa].map(([clave, n]) => ({ clave, n })).sort((a, b) => b.n - a.n)

/** Junta los contadores de varios días (de más antiguo a más reciente) en el resumen del panel. */
export function resumir(dias: { dia: string; campos: Record<string, string> }[], entradas: Entrada[] = []): ResumenMetricas {
  const vistas = new Map<string, number>()
  const ms = new Map<string, number>()
  const pasos = new Map<string, number>()
  const disp = { tipo: new Map<string, number>(), so: new Map<string, number>(), navegador: new Map<string, number>(), modo: new Map<string, number>() }
  const prefijos: Record<string, Map<string, number>> = {
    'vista:': vistas, 'ms:': ms, 'paso:': pasos, 'disp:': disp.tipo, 'so:': disp.so, 'nav:': disp.navegador, 'modo:': disp.modo,
  }
  const sumar = (mapa: Map<string, number>, clave: string, n: number) => mapa.set(clave, (mapa.get(clave) ?? 0) + n)

  let sesiones = 0
  let nuevos = 0
  let recurrentes = 0
  const porHora = Array<number>(24).fill(0)
  const porDia: ResumenMetricas['porDia'] = []
  for (const { dia, campos } of dias) {
    let sesionesDia = 0
    let vistasDia = 0
    for (const [campo, texto] of Object.entries(campos)) {
      const n = Number(texto)
      if (!Number.isFinite(n)) continue
      if (campo === 'sesiones') {
        sesionesDia += n
        continue
      }
      if (campo === 'nuevos' || campo === 'recurrentes') {
        if (campo === 'nuevos') nuevos += n
        else recurrentes += n
        continue
      }
      if (campo.startsWith('hora:')) {
        const hora = Number(campo.slice(5))
        if (hora >= 0 && hora < 24) porHora[hora] += n
        continue
      }
      const corte = campo.indexOf(':') + 1
      const mapa = prefijos[campo.slice(0, corte)]
      if (!mapa) continue
      sumar(mapa, campo.slice(corte), n)
      if (mapa === vistas) vistasDia += n
    }
    sesiones += sesionesDia
    porDia.push({ dia, sesiones: sesionesDia, vistas: vistasDia })
  }

  const totalVistas = [...vistas.values()].reduce((a, b) => a + b, 0)
  const pantallas = [...new Set([...vistas.keys(), ...ms.keys()])]
    .map((pantalla) => ({ pantalla, vistas: vistas.get(pantalla) ?? 0, ms: ms.get(pantalla) ?? 0 }))
    .sort((a, b) => b.vistas - a.vistas)

  return {
    desde: dias[0]?.dia ?? '',
    hasta: dias.at(-1)?.dia ?? '',
    sesiones,
    vistas: totalVistas,
    ms: [...ms.values()].reduce((a, b) => a + b, 0),
    porDia,
    pantallas,
    pasos: ordenar(pasos).map(({ clave, n }) => {
      const [de, a] = clave.split('>')
      return { de, a, n }
    }),
    dispositivo: { tipo: ordenar(disp.tipo), so: ordenar(disp.so), navegador: ordenar(disp.navegador), modo: ordenar(disp.modo) },
    nuevos,
    recurrentes,
    porHora,
    entradas,
  }
}

/** La hora del día en Colombia, de 0 a 23. */
export function horaColombia(instante: number): number {
  return Number(new Intl.DateTimeFormat('en-US', { timeZone: 'America/Bogota', hour: 'numeric', hourCycle: 'h23' }).format(instante))
}

/** El día en Colombia (AAAA-MM-DD), que es donde se usa la app. */
export function diaColombia(instante: number): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Bogota' }).format(instante)
}

/** Los últimos `n` días hasta `hoy`, del más antiguo al más reciente. */
export function ultimosDias(hoy: number, n: number): string[] {
  return Array.from({ length: n }, (_, i) => diaColombia(hoy - (n - 1 - i) * 86_400_000))
}
