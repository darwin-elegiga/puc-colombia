/**
 * Aulas en el servidor: reglas, permisos y datos sobre un almacén clave-valor.
 *
 * El almacén es Upstash Redis en producción (lib/almacenRedis.ts) y uno en memoria en
 * las pruebas. Cada dato del aula caduca con ella, a las 24 horas.
 *
 * Distribución de claves, pensada para que nadie pise lo que escribe otro:
 *  aula:{c}                  JSON con los datos del aula (solo la escribe el docente)
 *  aula:{c}:miembros         hash id → miembro
 *  aula:{c}:ejercicios       hash id → ejercicio del quiz (con la solución)
 *  aula:{c}:recibido         hash estudiante → cuándo abrió el quiz (su tiempo empieza ahí)
 *  aula:{c}:entregas         hash estudiante → su quiz enviado (solo lo escribe él, una vez)
 *  aula:{c}:notas            hash estudiante → su nota (solo la escribe el docente)
 *  aula:{c}:version          cambios que le importan al docente (todos)
 *  aula:{c}:version:alumnos  cambios que les importan a todos los estudiantes
 *  aula:{c}:version:{id}     cambios de un estudiante (su entrega, su nota, su expulsión)
 *  aula:{c}:candado          candado de las acciones del docente que reescriben aula:{c}
 *  aula:{c}:ia               sugerencias de IA guardadas por «ejercicio:estudiante»
 *  aula:{c}:ia:usos          contador de sugerencias de IA del aula
 *  aulas:publicas            conjunto ordenado por caducidad de las aulas públicas
 */
import { createHash, randomBytes } from 'node:crypto'
import {
  DURACION_MS, MARGEN_ENVIO_MS, MAX_COMENTARIO, MAX_EJERCICIOS, MAX_LIMITE_MIN, MAX_NOMBRE_AULA, aEjercicioDeAula,
  codigoValido, estadoQuiz, generarCodigo, limpiarNombre, nombreUnico, paraEstudiante, validarNota,
  validarNotasPorEjercicio, validarPropio, validarRespuestas,
  type AulaPublica, type AulaResumen, type Calificacion, type EjercicioDeAula, type EntregaQuiz,
  type MiembroVisible, type Respuestas, type VistaAula,
} from './aulas'
import { ejercicioAsientoPorId, type Fila } from './practica'

/* ─────────────────────────── Almacén ─────────────────────────── */

/** Sugerencias de IA por aula: evita que un bucle agote la cuota gratuita de Gemini. */
export const MAX_IA_POR_AULA = 60
/** Estudiantes por aula: frena que un script llene un aula pública de miembros. */
export const MAX_MIEMBROS = 100

export interface Almacen {
  get(clave: string): Promise<string | null>
  /** Varias claves en un solo comando. */
  mget(claves: string[]): Promise<(string | null)[]>
  set(clave: string, valor: string, expiraEn: number): Promise<void>
  hget(clave: string, campo: string): Promise<string | null>
  hgetall(clave: string): Promise<Record<string, string>>
  hlen(clave: string): Promise<number>
  hset(clave: string, campo: string, valor: string, expiraEn: number): Promise<void>
  /** Escribe solo si el campo no existe; devuelve si lo escribió. */
  hsetnx(clave: string, campo: string, valor: string, expiraEn: number): Promise<boolean>
  incr(clave: string, expiraEn: number): Promise<number>
  hdel(clave: string, campo: string): Promise<void>
  /** Candado con caducidad: guarda la `ficha` de quien lo toma y devuelve si lo consiguió. */
  bloquear(clave: string, ficha: string, ms: number): Promise<boolean>
  /** Lo suelta solo si sigue siendo suyo (si caducó y otro lo tomó, no se toca). */
  soltar(clave: string, ficha: string): Promise<void>
  zadd(clave: string, puntaje: number, miembro: string): Promise<void>
  zrangePorPuntaje(clave: string, min: number, max: number): Promise<string[]>
  /** Devuelve cuántos quitó. */
  zremPorPuntaje(clave: string, min: number, max: number): Promise<number>
  zrem(clave: string, miembro: string): Promise<void>
}

/** Almacén en memoria con caducidad, para las pruebas. */
export function almacenEnMemoria(reloj: () => number = Date.now): Almacen {
  const datos = new Map<string, { valor: unknown; expira: number }>()
  const leer = <T>(clave: string): T | undefined => {
    const e = datos.get(clave)
    if (!e) return undefined
    if (e.expira <= reloj()) {
      datos.delete(clave)
      return undefined
    }
    return e.valor as T
  }
  const hash = (clave: string, expiraEn: number) => {
    let h = leer<Map<string, string>>(clave)
    if (!h) {
      h = new Map()
      datos.set(clave, { valor: h, expira: expiraEn })
    }
    return h
  }
  const zset = (clave: string) => {
    let z = leer<Map<string, number>>(clave)
    if (!z) {
      z = new Map()
      datos.set(clave, { valor: z, expira: Infinity })
    }
    return z
  }
  return {
    async get(clave) { return leer<string>(clave) ?? null },
    async mget(claves) { return claves.map((c) => leer<string>(c) ?? null) },
    async set(clave, valor, expiraEn) { datos.set(clave, { valor, expira: expiraEn }) },
    async hget(clave, campo) { return leer<Map<string, string>>(clave)?.get(campo) ?? null },
    async hgetall(clave) { return Object.fromEntries(leer<Map<string, string>>(clave) ?? []) },
    async hlen(clave) { return leer<Map<string, string>>(clave)?.size ?? 0 },
    async hset(clave, campo, valor, expiraEn) { hash(clave, expiraEn).set(campo, valor) },
    async hsetnx(clave, campo, valor, expiraEn) {
      const h = hash(clave, expiraEn)
      if (h.has(campo)) return false
      h.set(campo, valor)
      return true
    },
    async incr(clave, expiraEn) {
      const n = Number(leer<string>(clave) ?? 0) + 1
      datos.set(clave, { valor: String(n), expira: expiraEn })
      return n
    },
    async hdel(clave, campo) { leer<Map<string, string>>(clave)?.delete(campo) },
    async bloquear(clave, ficha, ms) {
      if (leer<string>(clave) !== undefined) return false
      datos.set(clave, { valor: ficha, expira: reloj() + ms })
      return true
    },
    async soltar(clave, ficha) {
      if (leer<string>(clave) === ficha) datos.delete(clave)
    },
    async zadd(clave, puntaje, miembro) { zset(clave).set(miembro, puntaje) },
    async zrangePorPuntaje(clave, min, max) {
      return [...zset(clave)].filter(([, p]) => p >= min && p <= max).sort((a, b) => a[1] - b[1]).map(([m]) => m)
    },
    async zremPorPuntaje(clave, min, max) {
      const z = zset(clave)
      let quitados = 0
      for (const [m, p] of z) if (p >= min && p <= max) quitados += Number(z.delete(m))
      return quitados
    },
    async zrem(clave, miembro) { zset(clave).delete(miembro) },
  }
}

/* ─────────────────────────── Errores y credenciales ─────────────────────────── */

export class ErrorAula extends Error {
  constructor(public estado: number, mensaje: string) {
    super(mensaje)
  }
}

/** Credencial que guarda el navegador: «docente.secreto» o «{idEstudiante}.secreto». */
export interface Credencial {
  id: string
  secreto: string
}

export function leerCredencial(cabecera: string | null): Credencial | null {
  const valor = cabecera?.replace(/^Bearer\s+/i, '') ?? ''
  const [id, secreto] = valor.split('.')
  return id && secreto && /^[a-z0-9-]{1,40}$/.test(id) && /^[A-Za-z0-9_-]{20,80}$/.test(secreto) ? { id, secreto } : null
}

const huella = (secreto: string) => createHash('sha256').update(secreto).digest('hex')
const nuevoSecreto = () => randomBytes(24).toString('base64url')

/* ─────────────────────────── Modelo guardado ─────────────────────────── */

interface Aula extends AulaResumen {
  huellaDocente: string
  /** Cuántos ejercicios se han añadido, para numerarlos. */
  lanzados: number
}

interface Miembro extends MiembroVisible {
  huella: string
}

interface Entrega {
  respuestas: Respuestas
  enviada: number
  segundos: number
}

const k = {
  aula: (c: string) => `aula:${c}`,
  miembros: (c: string) => `aula:${c}:miembros`,
  ejercicios: (c: string) => `aula:${c}:ejercicios`,
  recibido: (c: string) => `aula:${c}:recibido`,
  entregas: (c: string) => `aula:${c}:entregas`,
  notas: (c: string) => `aula:${c}:notas`,
  version: (c: string) => `aula:${c}:version`,
  versionAlumnos: (c: string) => `aula:${c}:version:alumnos`,
  versionDe: (c: string, id: string) => `aula:${c}:version:${id}`,
  candado: (c: string) => `aula:${c}:candado`,
  ia: (c: string) => `aula:${c}:ia`,
  usoIA: (c: string) => `aula:${c}:ia:usos`,
  publicas: 'aulas:publicas',
  /** Sube cada vez que se abre, cierra o cierra la entrada un aula pública: consultarlo cuesta un comando. */
  versionPublicas: 'aulas:publicas:version',
}

const json = <T>(texto: string | null): T | null => (texto ? (JSON.parse(texto) as T) : null)
const valores = <T>(hash: Record<string, string>): T[] => Object.values(hash).map((v) => JSON.parse(v) as T)

const resumen = (a: Aula): AulaResumen => ({
  codigo: a.codigo, nombre: a.nombre, docente: a.docente, publica: a.publica,
  estado: a.estado, entradaCerrada: a.entradaCerrada, creada: a.creada, expira: a.expira,
  iniciado: a.iniciado, limiteMin: a.limiteMin, solucionPublicada: a.solucionPublicada,
})
const visible = (m: Miembro): MiembroVisible => ({ id: m.id, nombre: m.nombre, unido: m.unido, expulsado: m.expulsado })
const texto = (v: unknown) => (typeof v === 'string' ? v : '')

/* ─────────────────────────── Servicio ─────────────────────────── */

export function servicioAulas(almacen: Almacen, reloj: () => number = Date.now) {
  async function cargar(codigo: string): Promise<Aula> {
    if (!codigoValido(codigo)) throw new ErrorAula(404, 'Esa aula no existe o ya caducó.')
    const aula = json<Aula>(await almacen.get(k.aula(codigo)))
    if (!aula || aula.expira <= reloj()) throw new ErrorAula(404, 'Esa aula no existe o ya caducó.')
    return aula
  }

  const guardarAula = (aula: Aula) => almacen.set(k.aula(aula.codigo), JSON.stringify(aula), aula.expira)
  /** Aviso barato para todos los dispositivos: la lista de aulas públicas cambió. */
  const cambioPublicas = () => almacen.incr(k.versionPublicas, reloj() + 365 * DURACION_MS)

  /**
   * Anota un cambio. El docente lo ve siempre; los estudiantes solo si les afecta a todos
   * (`alumnos`) o a uno en concreto (`estudiante`). Así un envío o una nota no hace que
   * toda la clase pida el estado completo.
   */
  async function cambio(aula: Aula, a: { alumnos?: boolean; estudiante?: string } = {}) {
    await almacen.incr(k.version(aula.codigo), aula.expira)
    if (a.alumnos) await almacen.incr(k.versionAlumnos(aula.codigo), aula.expira)
    if (a.estudiante) await almacen.incr(k.versionDe(aula.codigo, a.estudiante), aula.expira)
  }

  /**
   * La versión que ve quien pregunta. La del estudiante es la suma de la de la clase y la
   * suya: cualquiera de las dos que suba la hace subir. Null si el aula no existe.
   */
  async function versionPara(codigo: string, cred: Credencial | null): Promise<number | null> {
    if (!codigoValido(codigo)) return null
    if (!cred || cred.id === 'docente') {
      const v = await almacen.get(k.version(codigo))
      return v === null ? null : Number(v)
    }
    const [clase, propia] = await almacen.mget([k.versionAlumnos(codigo), k.versionDe(codigo, cred.id)])
    return clase === null ? null : Number(clase) + Number(propia ?? 0)
  }

  /** Las acciones del docente que leen y reescriben aula:{c} van de una en una. */
  async function conCandado<T>(codigo: string, accion: () => Promise<T>): Promise<T> {
    const ficha = randomBytes(8).toString('hex')
    let conseguido = false
    for (let i = 0; i < 20 && !(conseguido = await almacen.bloquear(k.candado(codigo), ficha, 10_000)); i++) {
      await new Promise((r) => setTimeout(r, 100))
    }
    if (!conseguido) throw new ErrorAula(409, 'Hay otra acción en curso en el aula. Vuelve a intentarlo.')
    try {
      return await accion()
    } finally {
      await almacen.soltar(k.candado(codigo), ficha)
    }
  }

  /** Comprueba la credencial y devuelve el rol; el miembro si es estudiante. */
  async function autenticar(aula: Aula, cred: Credencial | null) {
    if (!cred) throw new ErrorAula(401, 'Falta la clave del aula.')
    if (cred.id === 'docente') {
      if (huella(cred.secreto) !== aula.huellaDocente) throw new ErrorAula(403, 'La clave no corresponde a esta aula.')
      return { rol: 'docente' as const, miembro: null }
    }
    const miembro = json<Miembro>(await almacen.hget(k.miembros(aula.codigo), cred.id))
    if (!miembro || huella(cred.secreto) !== miembro.huella) throw new ErrorAula(403, 'La clave no corresponde a esta aula.')
    if (miembro.expulsado) throw new ErrorAula(403, 'El docente te sacó de esta aula.')
    return { rol: 'estudiante' as const, miembro }
  }

  async function soloDocente(codigo: string, cred: Credencial | null) {
    const aula = await cargar(codigo)
    const { rol } = await autenticar(aula, cred)
    if (rol !== 'docente') throw new ErrorAula(403, 'Solo quien creó el aula puede hacer esto.')
    return aula
  }

  /** El docente solo cambia los ejercicios antes de empezar el quiz. */
  function preparando(aula: Aula) {
    if (aula.estado !== 'abierta') throw new ErrorAula(409, 'El aula está cerrada.')
    if (aula.iniciado !== null) throw new ErrorAula(409, 'El quiz ya empezó: ya no se pueden cambiar los ejercicios.')
  }

  const ejerciciosDe = async (codigo: string) =>
    valores<EjercicioDeAula>(await almacen.hgetall(k.ejercicios(codigo))).sort((a, b) => a.lanzado - b.lanzado)

  /** Hasta cuándo puede enviar un estudiante que abrió el quiz en `recibido` (null: sin límite). */
  const finDe = (aula: Aula, recibido: number | null) =>
    aula.limiteMin !== null && recibido !== null ? recibido + aula.limiteMin * 60_000 : null

  return {
    async crear(entrada: { nombre: unknown; docente: unknown; publica: unknown }) {
      const nombre = limpiarNombre(entrada.nombre, MAX_NOMBRE_AULA)
      const docente = limpiarNombre(entrada.docente)
      if (!nombre) throw new ErrorAula(400, 'Ponle un nombre al aula (sin palabras ofensivas).')
      if (!docente) throw new ErrorAula(400, 'Escribe tu nombre (sin palabras ofensivas).')
      const creada = reloj()
      const expira = creada + DURACION_MS
      const secreto = nuevoSecreto()
      // Un código libre: con 31^6 combinaciones casi siempre basta el primero.
      let codigo = generarCodigo()
      for (let i = 0; i < 5 && (await almacen.get(k.aula(codigo))); i++) codigo = generarCodigo()
      const aula: Aula = {
        codigo, nombre, docente, publica: entrada.publica === true, estado: 'abierta', entradaCerrada: false,
        creada, expira, huellaDocente: huella(secreto), lanzados: 0, iniciado: null, limiteMin: null, solucionPublicada: false,
      }
      await guardarAula(aula)
      // También la de la clase: sin ella la versión del estudiante sería null (aula inexistente).
      await cambio(aula, { alumnos: true })
      if (aula.publica) {
        await almacen.zadd(k.publicas, expira, codigo)
        await cambioPublicas()
      }
      return { codigo, clave: `docente.${secreto}`, aula: resumen(aula) }
    },

    /** La versión de la lista de aulas públicas: si no cambió, el navegador no pide la lista. */
    async versionPublicas(): Promise<number> {
      return Number((await almacen.get(k.versionPublicas)) ?? 0)
    },

    async publicas(): Promise<AulaPublica[]> {
      const ahora = reloj()
      // Las que caducaron salen de la lista: quien la tenga guardada debe enterarse.
      if (await almacen.zremPorPuntaje(k.publicas, 0, ahora)) await cambioPublicas()
      const codigos = await almacen.zrangePorPuntaje(k.publicas, ahora, Number.MAX_SAFE_INTEGER)
      const lista: AulaPublica[] = []
      for (const codigo of codigos.reverse()) {
        if (lista.length >= 20) break
        const aula = json<Aula>(await almacen.get(k.aula(codigo)))
        if (!aula || aula.estado !== 'abierta' || aula.entradaCerrada) continue
        lista.push({
          codigo, nombre: aula.nombre, docente: aula.docente, miembros: await almacen.hlen(k.miembros(codigo)),
          creada: aula.creada, expira: aula.expira,
        })
      }
      return lista
    },

    async unirse(codigo: string, entrada: { nombre: unknown }) {
      const aula = await cargar(codigo)
      if (aula.estado !== 'abierta') throw new ErrorAula(409, 'El aula ya se cerró.')
      if (aula.entradaCerrada) throw new ErrorAula(409, 'El docente cerró la entrada al aula.')
      const pedido = limpiarNombre(entrada.nombre)
      if (!pedido) throw new ErrorAula(400, 'Escribe tu nombre (sin palabras ofensivas).')
      if ((await almacen.hlen(k.miembros(codigo))) >= MAX_MIEMBROS) {
        throw new ErrorAula(409, `El aula ya tiene ${MAX_MIEMBROS} estudiantes.`)
      }
      const existentes = valores<Miembro>(await almacen.hgetall(k.miembros(codigo)))
      const nombre = nombreUnico(pedido, [aula.docente, ...existentes.map((m) => m.nombre)])
      const secreto = nuevoSecreto()
      let id = `e${randomBytes(5).toString('hex')}`
      const miembro: Miembro = { id, nombre, unido: reloj(), expulsado: false, huella: huella(secreto) }
      while (!(await almacen.hsetnx(k.miembros(codigo), id, JSON.stringify(miembro), aula.expira))) {
        id = `e${randomBytes(5).toString('hex')}`
        miembro.id = id
      }
      await cambio(aula)
      return { clave: `${id}.${secreto}`, nombre, aula: resumen(aula) }
    },

    /** El contador de cambios de quien pregunta: si no cambió, no necesita pedir el estado. */
    version: (codigo: string, cred: Credencial | null = null) => versionPara(codigo, cred),

    /** Límite de uso por ventana de tiempo (por IP en las rutas): 429 si se supera. */
    async limitar(clave: string, maximo: number, ventanaMs: number) {
      const ventana = Math.floor(reloj() / ventanaMs)
      const usos = await almacen.incr(`limite:${clave}:${ventana}`, (ventana + 1) * ventanaMs + 1000)
      if (usos > maximo) throw new ErrorAula(429, 'Demasiados intentos seguidos. Espera un poco y vuelve a intentarlo.')
    },

    async estado(codigo: string, cred: Credencial | null): Promise<VistaAula> {
      // La versión se lee ANTES que los datos: si alguien escribe a mitad de la lectura, el
      // cliente queda con una versión vieja y la siguiente consulta trae lo nuevo.
      const version = (await versionPara(codigo, cred)) ?? 0
      const aula = await cargar(codigo)
      const { rol, miembro } = await autenticar(aula, cred)
      const ahora = reloj()
      const ejercicios = await ejerciciosDe(codigo)

      if (rol === 'docente') {
        const miembros = valores<Miembro>(await almacen.hgetall(k.miembros(codigo))).sort((a, b) => a.unido - b.unido)
        const nombreDe = new Map(miembros.map((m) => [m.id, m.nombre]))
        const [entregas, notas] = await Promise.all([almacen.hgetall(k.entregas(codigo)), almacen.hgetall(k.notas(codigo))])
        return {
          rol, modo: 'quiz', version, ahora, aula: resumen(aula),
          miembros: miembros.map(visible),
          ejercicios,
          entregas: Object.entries(entregas)
            .map(([id, t]) => ({
              estudianteId: id, nombre: nombreDe.get(id) ?? '—', ...(JSON.parse(t) as Entrega),
              calificacion: json<Calificacion>(notas[id] ?? null),
            }))
            .sort((a, b) => a.segundos - b.segundos),
          empezados: aula.iniciado === null ? 0 : await almacen.hlen(k.recibido(codigo)),
        }
      }

      // El estudiante solo lee lo suyo: su hora de inicio, su envío y su nota, campo a campo.
      const yo = miembro!
      let recibido: number | null = null
      if (aula.iniciado !== null) {
        const previo = await almacen.hget(k.recibido(codigo), yo.id)
        if (previo) recibido = Number(previo)
        else if (aula.estado === 'abierta') {
          // La primera vez que lo abre empieza su tiempo; el docente ve subir «lo están resolviendo».
          if (await almacen.hsetnx(k.recibido(codigo), yo.id, String(ahora), aula.expira)) await cambio(aula)
          recibido = Number(await almacen.hget(k.recibido(codigo), yo.id))
        }
      }
      const [e, n] = await Promise.all([almacen.hget(k.entregas(codigo), yo.id), almacen.hget(k.notas(codigo), yo.id)])
      const guardada = json<Entrega>(e)
      const entrega: EntregaQuiz | null = guardada
        ? { estudianteId: yo.id, nombre: yo.nombre, ...guardada, calificacion: json<Calificacion>(n) }
        : null
      return {
        rol, version, ahora, aula: resumen(aula),
        yo: visible(yo), miembros: await almacen.hlen(k.miembros(codigo)),
        quiz: { estado: estadoQuiz(aula), enviado: Boolean(entrega) },
        ejercicios: aula.iniciado === null ? [] : ejercicios.map(paraEstudiante),
        recibido,
        fin: finDe(aula, recibido),
        entrega,
        publicados: aula.solucionPublicada
          ? ejercicios.map((ej) => ({
              ...ej,
              entrega: entrega
                ? {
                    estudianteId: yo.id, nombre: yo.nombre, filas: entrega.respuestas[ej.id] ?? [],
                    enviada: entrega.enviada, segundos: entrega.segundos, calificacion: entrega.calificacion,
                  }
                : null,
            }))
          : [],
      }
    },

    /** Añade al quiz uno de los ejercicios de la aplicación (por id) o uno escrito por el docente. */
    agregar: (codigo: string, cred: Credencial | null, entrada: { ejercicio?: unknown; propio?: unknown }) => conCandado(codigo, async () => {
      const aula = await soloDocente(codigo, cred)
      preparando(aula)
      if ((await almacen.hlen(k.ejercicios(codigo))) >= MAX_EJERCICIOS) {
        throw new ErrorAula(409, `Un quiz tiene como mucho ${MAX_EJERCICIOS} ejercicios.`)
      }
      let ejercicio: EjercicioDeAula
      const id = `ej${aula.lanzados + 1}`
      if (entrada.propio !== undefined) {
        const propio = validarPropio(entrada.propio)
        if (typeof propio === 'string') throw new ErrorAula(400, propio)
        ejercicio = {
          id, origenId: 'propio', titulo: propio.titulo, grupo: `Ejercicio de ${aula.docente}`, enunciado: propio.enunciado,
          datos: [], lanzado: reloj(), solucionPublicada: false, explicacion: propio.explicacion,
          solucion: propio.filas.map((f) => ({
            codigo: f.codigo, columna: f.debe ? ('debe' as const) : ('haber' as const), importe: (f.debe ?? f.haber)!, concepto: '',
          })),
        }
      } else {
        const origen = typeof entrada.ejercicio === 'string' ? ejercicioAsientoPorId(entrada.ejercicio) : undefined
        if (!origen) throw new ErrorAula(400, 'Ese ejercicio no existe.')
        ejercicio = aEjercicioDeAula(origen, id, reloj())
      }
      aula.lanzados += 1
      await almacen.hset(k.ejercicios(codigo), id, JSON.stringify(ejercicio), aula.expira)
      await guardarAula(aula)
      await cambio(aula)
      return { id }
    }),

    quitar: (codigo: string, cred: Credencial | null, entrada: { ejercicio: unknown }) => conCandado(codigo, async () => {
      const aula = await soloDocente(codigo, cred)
      preparando(aula)
      await almacen.hdel(k.ejercicios(codigo), texto(entrada.ejercicio))
      await cambio(aula)
    }),

    /** Empieza el quiz: desde ahora los ejercicios quedan fijos y los estudiantes los ven. */
    empezar: (codigo: string, cred: Credencial | null, entrada: { limiteMin: unknown }) => conCandado(codigo, async () => {
      const aula = await soloDocente(codigo, cred)
      preparando(aula)
      if (!(await almacen.hlen(k.ejercicios(codigo)))) throw new ErrorAula(400, 'Añade al menos un ejercicio antes de empezar.')
      const limite = entrada.limiteMin
      if (limite !== null && limite !== undefined && !(Number.isInteger(limite) && (limite as number) >= 1 && (limite as number) <= MAX_LIMITE_MIN)) {
        throw new ErrorAula(400, `El tiempo va de 1 a ${MAX_LIMITE_MIN} minutos, o sin límite.`)
      }
      aula.iniciado = reloj()
      aula.limiteMin = (limite as number | null | undefined) ?? null
      await guardarAula(aula)
      await cambio(aula, { alumnos: true })
    }),

    /** El estudiante envía el quiz completo, una sola vez. */
    async entregar(codigo: string, cred: Credencial | null, entrada: { respuestas: unknown }) {
      const aula = await cargar(codigo)
      const { rol, miembro } = await autenticar(aula, cred)
      if (rol !== 'estudiante') throw new ErrorAula(403, 'El docente no envía el quiz.')
      if (aula.estado !== 'abierta') throw new ErrorAula(409, 'El aula se cerró: ya no se aceptan envíos.')
      if (aula.iniciado === null) throw new ErrorAula(409, 'El quiz todavía no ha empezado.')
      if (aula.solucionPublicada) throw new ErrorAula(409, 'El docente ya publicó las soluciones: no se aceptan más envíos.')
      const ids = (await ejerciciosDe(codigo)).map((e) => e.id)
      const respuestas = validarRespuestas(entrada.respuestas, ids)
      if (!respuestas) throw new ErrorAula(400, 'El quiz tiene renglones que no son válidos.')
      const id = miembro!.id
      const ahora = reloj()
      await almacen.hsetnx(k.recibido(codigo), id, String(ahora), aula.expira)
      const recibido = Number(await almacen.hget(k.recibido(codigo), id))
      const fin = finDe(aula, recibido)
      if (fin !== null && ahora > fin + MARGEN_ENVIO_MS) throw new ErrorAula(409, 'Se acabó el tiempo del quiz.')
      const segundos = Math.round((Math.min(ahora, fin ?? ahora) - recibido) / 1000)
      const entrega: Entrega = { respuestas, enviada: ahora, segundos }
      // Una sola vez: el primero que escribe gana.
      if (!(await almacen.hsetnx(k.entregas(codigo), id, JSON.stringify(entrega), aula.expira))) {
        throw new ErrorAula(409, 'Ya enviaste este quiz.')
      }
      await cambio(aula, { estudiante: id })
      return { segundos, enviada: ahora }
    },

    /** El docente emite (o corrige) la nota de un quiz enviado. */
    async calificar(
      codigo: string, cred: Credencial | null,
      entrada: { estudiante: unknown; nota: unknown; comentario: unknown; porEjercicio?: unknown },
    ) {
      const aula = await soloDocente(codigo, cred)
      const est = texto(entrada.estudiante)
      if (!(await almacen.hget(k.entregas(codigo), est))) throw new ErrorAula(404, 'Ese estudiante no ha enviado el quiz.')
      const nota = validarNota(entrada.nota)
      if (nota === null) throw new ErrorAula(400, 'La nota va de 0 a 5.')
      const porEjercicio = validarNotasPorEjercicio(entrada.porEjercicio, (await ejerciciosDe(codigo)).map((e) => e.id))
      if (!porEjercicio) throw new ErrorAula(400, 'La nota de cada ejercicio va de 0 a 5.')
      const comentario = typeof entrada.comentario === 'string' ? entrada.comentario.trim().slice(0, MAX_COMENTARIO) : ''
      const calificacion: Calificacion = { nota, comentario, fecha: reloj(), porEjercicio }
      await almacen.hset(k.notas(codigo), est, JSON.stringify(calificacion), aula.expira)
      await cambio(aula, { estudiante: est })
      return calificacion
    },

    /**
     * Lo que necesita la IA para sugerir la nota de un ejercicio: solo para el docente del
     * aula y con tope por aula. Si ya se sugirió, devuelve la guardada sin gastar IA.
     */
    async entregaParaIA(codigo: string, cred: Credencial | null, entrada: { ejercicio: unknown; estudiante: unknown }) {
      const aula = await soloDocente(codigo, cred)
      const ej = texto(entrada.ejercicio)
      const est = texto(entrada.estudiante)
      const ejercicio = json<EjercicioDeAula>(await almacen.hget(k.ejercicios(codigo), ej))
      const entrega = json<Entrega>(await almacen.hget(k.entregas(codigo), est))
      if (!ejercicio || !entrega) throw new ErrorAula(404, 'No hay entrega que calificar.')
      const filas: Fila[] = entrega.respuestas[ej] ?? []
      const previa = json<{ enviada: number; sugerencia: unknown }>(await almacen.hget(k.ia(codigo), `${ej}:${est}`))
      if (previa && previa.enviada === entrega.enviada) return { ejercicio, filas, enviada: entrega.enviada, guardada: previa.sugerencia }
      if ((await almacen.incr(k.usoIA(codigo), aula.expira)) > MAX_IA_POR_AULA) {
        throw new ErrorAula(429, `Esta aula ya usó sus ${MAX_IA_POR_AULA} sugerencias de IA.`)
      }
      return { ejercicio, filas, enviada: entrega.enviada, guardada: undefined }
    },

    /** Guarda la sugerencia de la IA para no pedirla otra vez por la misma entrega. */
    async guardarSugerenciaIA(codigo: string, entrada: { ejercicio: string; estudiante: string; enviada: number; sugerencia: unknown }) {
      const aula = await cargar(codigo)
      const valor = JSON.stringify({ enviada: entrada.enviada, sugerencia: entrada.sugerencia })
      await almacen.hset(k.ia(codigo), `${entrada.ejercicio}:${entrada.estudiante}`, valor, aula.expira)
    },

    /** Publica las soluciones de todos los ejercicios del quiz. */
    publicarSolucion: (codigo: string, cred: Credencial | null) => conCandado(codigo, async () => {
      const aula = await soloDocente(codigo, cred)
      if (aula.iniciado === null) throw new ErrorAula(409, 'El quiz todavía no ha empezado.')
      for (const ej of await ejerciciosDe(codigo)) {
        await almacen.hset(k.ejercicios(codigo), ej.id, JSON.stringify({ ...ej, solucionPublicada: true }), aula.expira)
      }
      aula.solucionPublicada = true
      await guardarAula(aula)
      await cambio(aula, { alumnos: true })
    }),

    cerrar: (codigo: string, cred: Credencial | null) => conCandado(codigo, async () => {
      const aula = await soloDocente(codigo, cred)
      aula.estado = 'cerrada'
      await guardarAula(aula)
      await almacen.zrem(k.publicas, codigo)
      if (aula.publica) await cambioPublicas()
      await cambio(aula, { alumnos: true })
    }),

    cerrarEntrada: (codigo: string, cred: Credencial | null, entrada: { cerrada: unknown }) => conCandado(codigo, async () => {
      const aula = await soloDocente(codigo, cred)
      aula.entradaCerrada = entrada.cerrada === true
      await guardarAula(aula)
      // Después de guardar: quien lea la versión nueva debe ver ya la lista nueva.
      if (aula.publica) await cambioPublicas()
      await cambio(aula)
    }),

    async expulsar(codigo: string, cred: Credencial | null, entrada: { estudiante: unknown }) {
      const aula = await soloDocente(codigo, cred)
      const id = texto(entrada.estudiante)
      const miembro = json<Miembro>(await almacen.hget(k.miembros(codigo), id))
      if (!miembro) throw new ErrorAula(404, 'Esa persona no está en el aula.')
      miembro.expulsado = true
      await almacen.hset(k.miembros(codigo), id, JSON.stringify(miembro), aula.expira)
      await cambio(aula, { estudiante: id })
    },
  }
}

export type ServicioAulas = ReturnType<typeof servicioAulas>
