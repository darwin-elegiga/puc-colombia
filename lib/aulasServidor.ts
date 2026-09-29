/**
 * Aulas en el servidor: reglas, permisos y datos sobre un almacén clave-valor.
 *
 * El almacén es Upstash Redis en producción (lib/almacenRedis.ts) y uno en memoria en
 * las pruebas. Cada dato del aula caduca con ella, a las 24 horas.
 *
 * Distribución de claves, pensada para que nadie pise lo que escribe otro:
 *  aula:{c}                  JSON con los datos del aula (solo la escribe el docente)
 *  aula:{c}:miembros         hash id → miembro
 *  aula:{c}:ejercicios       hash id → ejercicio lanzado (con la solución)
 *  aula:{c}:recibido:{ej}    hash estudiante → cuándo le llegó el ejercicio
 *  aula:{c}:entregas:{ej}    hash estudiante → su entrega (solo la escribe él)
 *  aula:{c}:notas:{ej}       hash estudiante → su nota (solo la escribe el docente)
 *  aula:{c}:version          cambios que le importan al docente (todos)
 *  aula:{c}:version:alumnos  cambios que les importan a todos los estudiantes
 *  aula:{c}:version:{id}     cambios de un estudiante (su entrega, su nota, su expulsión)
 *  aula:{c}:candado          candado de las acciones del docente que reescriben aula:{c}
 *  aula:{c}:ia               sugerencias de IA guardadas por «ejercicio:estudiante»
 *  aulas:publicas            conjunto ordenado por caducidad de las aulas públicas
 */
import { createHash, randomBytes } from 'node:crypto'
import {
  DURACION_MS, MAX_COMENTARIO, MAX_NOMBRE_AULA, aEjercicioDeAula, codigoValido, generarCodigo, limpiarNombre,
  nombreUnico, paraEstudiante, validarFilas, validarNota, validarPropio,
  type AulaPublica, type AulaResumen, type Calificacion, type EjercicioDeAula, type EntregaVisible,
  type MiembroVisible, type VistaAula,
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
  /**
   * Escribe `campo` en el hash `clave` solo si `campo` en el hash `condicion` vale
   * `igual` (o no existe, con null). Atómico: nadie escribe entre la comprobación y la escritura.
   */
  hsetSi(clave: string, campo: string, valor: string, expiraEn: number, condicion: string, igual: string | null): Promise<boolean>
  /** Candado con caducidad: true si se consiguió. */
  bloquear(clave: string, ms: number): Promise<boolean>
  soltar(clave: string): Promise<void>
  zadd(clave: string, puntaje: number, miembro: string): Promise<void>
  zrangePorPuntaje(clave: string, min: number, max: number): Promise<string[]>
  zremPorPuntaje(clave: string, min: number, max: number): Promise<void>
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
    async hsetSi(clave, campo, valor, expiraEn, condicion, igual) {
      const actual = leer<Map<string, string>>(condicion)?.get(campo) ?? null
      if (actual !== igual) return false
      hash(clave, expiraEn).set(campo, valor)
      return true
    },
    async bloquear(clave, ms) {
      if (leer<string>(clave) !== undefined) return false
      datos.set(clave, { valor: '1', expira: reloj() + ms })
      return true
    },
    async soltar(clave) { datos.delete(clave) },
    async zadd(clave, puntaje, miembro) { zset(clave).set(miembro, puntaje) },
    async zrangePorPuntaje(clave, min, max) {
      return [...zset(clave)].filter(([, p]) => p >= min && p <= max).sort((a, b) => a[1] - b[1]).map(([m]) => m)
    },
    async zremPorPuntaje(clave, min, max) {
      const z = zset(clave)
      for (const [m, p] of z) if (p >= min && p <= max) z.delete(m)
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
  /** Ejercicio en curso: al que se envían las entregas. */
  actual: string | null
  /** Cuántos ejercicios se han lanzado, para numerarlos. */
  lanzados: number
}

interface Miembro extends MiembroVisible {
  huella: string
}

interface Entrega {
  filas: Fila[]
  enviada: number
  segundos: number
}

const k = {
  aula: (c: string) => `aula:${c}`,
  miembros: (c: string) => `aula:${c}:miembros`,
  ejercicios: (c: string) => `aula:${c}:ejercicios`,
  recibido: (c: string, e: string) => `aula:${c}:recibido:${e}`,
  entregas: (c: string, e: string) => `aula:${c}:entregas:${e}`,
  notas: (c: string, e: string) => `aula:${c}:notas:${e}`,
  version: (c: string) => `aula:${c}:version`,
  versionAlumnos: (c: string) => `aula:${c}:version:alumnos`,
  versionDe: (c: string, id: string) => `aula:${c}:version:${id}`,
  candado: (c: string) => `aula:${c}:candado`,
  ia: (c: string) => `aula:${c}:ia`,
  usoIA: (c: string) => `aula:${c}:ia:usos`,
  publicas: 'aulas:publicas',
}

const json = <T>(texto: string | null): T | null => (texto ? (JSON.parse(texto) as T) : null)
const valores = <T>(hash: Record<string, string>): T[] => Object.values(hash).map((v) => JSON.parse(v) as T)

const resumen = (a: Aula): AulaResumen => ({
  codigo: a.codigo, nombre: a.nombre, docente: a.docente, publica: a.publica,
  estado: a.estado, entradaCerrada: a.entradaCerrada, creada: a.creada, expira: a.expira,
})
const visible = (m: Miembro): MiembroVisible => ({ id: m.id, nombre: m.nombre, unido: m.unido, expulsado: m.expulsado })

/* ─────────────────────────── Servicio ─────────────────────────── */

export function servicioAulas(almacen: Almacen, reloj: () => number = Date.now) {
  async function cargar(codigo: string): Promise<Aula> {
    if (!codigoValido(codigo)) throw new ErrorAula(404, 'Esa aula no existe o ya caducó.')
    const aula = json<Aula>(await almacen.get(k.aula(codigo)))
    if (!aula || aula.expira <= reloj()) throw new ErrorAula(404, 'Esa aula no existe o ya caducó.')
    return aula
  }

  /**
   * Anota un cambio. El docente lo ve siempre; los estudiantes solo si les afecta a todos
   * (`alumnos`) o a uno en concreto (`estudiante`). Así una entrega o una nota no hace que
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
    let conseguido = false
    for (let i = 0; i < 20 && !(conseguido = await almacen.bloquear(k.candado(codigo), 5000)); i++) {
      await new Promise((r) => setTimeout(r, 100))
    }
    if (!conseguido) throw new ErrorAula(409, 'Hay otra acción en curso en el aula. Vuelve a intentarlo.')
    try {
      return await accion()
    } finally {
      await almacen.soltar(k.candado(codigo))
    }
  }
  const guardarAula = (aula: Aula) => almacen.set(k.aula(aula.codigo), JSON.stringify(aula), aula.expira)

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
        creada, expira, huellaDocente: huella(secreto), actual: null, lanzados: 0,
      }
      await guardarAula(aula)
      // También la de la clase: sin ella la versión del estudiante sería null (aula inexistente).
      await cambio(aula, { alumnos: true })
      if (aula.publica) {
        await almacen.zadd(k.publicas, expira, codigo)
      }
      return { codigo, clave: `docente.${secreto}`, aula: resumen(aula) }
    },

    async publicas(): Promise<AulaPublica[]> {
      const ahora = reloj()
      await almacen.zremPorPuntaje(k.publicas, 0, ahora)
      const codigos = await almacen.zrangePorPuntaje(k.publicas, ahora, Number.MAX_SAFE_INTEGER)
      const lista: AulaPublica[] = []
      for (const codigo of codigos.reverse()) {
        if (lista.length >= 20) break
        const aula = json<Aula>(await almacen.get(k.aula(codigo)))
        if (!aula || aula.estado !== 'abierta' || aula.entradaCerrada) continue
        lista.push({ codigo, nombre: aula.nombre, docente: aula.docente, miembros: await almacen.hlen(k.miembros(codigo)), creada: aula.creada })
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
      const ejercicios = valores<EjercicioDeAula>(await almacen.hgetall(k.ejercicios(codigo))).sort((a, b) => a.lanzado - b.lanzado)

      if (rol === 'docente') {
        const miembros = valores<Miembro>(await almacen.hgetall(k.miembros(codigo))).sort((a, b) => a.unido - b.unido)
        const nombreDe = new Map(miembros.map((m) => [m.id, m.nombre]))
        const entregasDe = async (ej: EjercicioDeAula): Promise<EntregaVisible[]> => {
          const [entregas, notas] = await Promise.all([
            almacen.hgetall(k.entregas(codigo, ej.id)),
            almacen.hgetall(k.notas(codigo, ej.id)),
          ])
          return Object.entries(entregas)
            .map(([id, texto]) => {
              const e = JSON.parse(texto) as Entrega
              return { estudianteId: id, nombre: nombreDe.get(id) ?? '—', ...e, calificacion: json<Calificacion>(notas[id] ?? null) }
            })
            .sort((a, b) => a.segundos - b.segundos)
        }
        return {
          rol, version, ahora, aula: resumen(aula),
          miembros: miembros.map(visible),
          ejercicios: await Promise.all(
            ejercicios.map(async (ej) => ({
              ...ej,
              entregas: await entregasDe(ej),
              recibidos: await almacen.hlen(k.recibido(codigo, ej.id)),
            })),
          ),
        }
      }

      // El estudiante solo lee lo suyo: su entrega y su nota, campo a campo (no todo el hash).
      const yo = miembro!
      const actual = ejercicios.find((e) => e.id === aula.actual) ?? null
      let recibido: number | null = null
      if (actual) {
        // Su tiempo empieza la primera vez que el ejercicio le llega, no cuando se lanzó.
        const previo = await almacen.hget(k.recibido(codigo, actual.id), yo.id)
        if (previo) recibido = Number(previo)
        else {
          // La primera vez: el docente ve subir «N lo están resolviendo».
          if (await almacen.hsetnx(k.recibido(codigo, actual.id), yo.id, String(ahora), aula.expira)) await cambio(aula)
          recibido = Number(await almacen.hget(k.recibido(codigo, actual.id), yo.id))
        }
      }
      const miEntrega = async (ej: EjercicioDeAula): Promise<EntregaVisible | null> => {
        const [e, n] = await Promise.all([almacen.hget(k.entregas(codigo, ej.id), yo.id), almacen.hget(k.notas(codigo, ej.id), yo.id)])
        const entrega = json<Entrega>(e)
        return entrega ? { estudianteId: yo.id, nombre: yo.nombre, ...entrega, calificacion: json<Calificacion>(n) } : null
      }
      return {
        rol, version, ahora, aula: resumen(aula),
        yo: visible(yo), miembros: await almacen.hlen(k.miembros(codigo)),
        actual: actual ? { ...paraEstudiante(actual), recibido, entrega: await miEntrega(actual) } : null,
        publicados: await Promise.all(
          ejercicios.filter((e) => e.solucionPublicada).map(async (e) => ({ ...e, entrega: await miEntrega(e) })),
        ),
      }
    },

    /** Lanza uno de los ejercicios de la aplicación (por id) o uno escrito por el docente (propio). */
    lanzar: (codigo: string, cred: Credencial | null, entrada: { ejercicio?: unknown; propio?: unknown }) => conCandado(codigo, async () => {
      const aula = await soloDocente(codigo, cred)
      if (aula.estado !== 'abierta') throw new ErrorAula(409, 'El aula está cerrada.')
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
      aula.actual = id
      await guardarAula(aula)
      await cambio(aula, { alumnos: true })
      return { id }
    }),

    async entregar(codigo: string, cred: Credencial | null, entrada: { ejercicio: unknown; filas: unknown }) {
      const aula = await cargar(codigo)
      const { rol, miembro } = await autenticar(aula, cred)
      if (rol !== 'estudiante') throw new ErrorAula(403, 'El docente no envía entregas.')
      if (aula.estado !== 'abierta') throw new ErrorAula(409, 'El aula se cerró: ya no se aceptan envíos.')
      if (entrada.ejercicio !== aula.actual) throw new ErrorAula(409, 'Ese ejercicio ya no está en curso.')
      const filas = validarFilas(entrada.filas)
      if (!filas || !filas.length) throw new ErrorAula(400, 'La entrega no tiene renglones válidos.')
      const ej = aula.actual!
      const id = miembro!.id
      const ahora = reloj()
      await almacen.hsetnx(k.recibido(codigo, ej), id, String(ahora), aula.expira)
      const recibido = Number(await almacen.hget(k.recibido(codigo, ej), id))
      const entrega: Entrega = { filas, enviada: ahora, segundos: Math.round((ahora - recibido) / 1000) }
      // Solo si aún no tiene nota, en un paso: si el docente califica a la vez, gana la nota.
      const escrita = await almacen.hsetSi(k.entregas(codigo, ej), id, JSON.stringify(entrega), aula.expira, k.notas(codigo, ej), null)
      if (!escrita) throw new ErrorAula(409, 'El docente ya calificó tu entrega: no se puede cambiar.')
      await cambio(aula, { estudiante: id })
      return { segundos: entrega.segundos, enviada: entrega.enviada }
    },

    /**
     * `enviada` es la entrega que el docente tiene delante: si el estudiante reenvió
     * mientras la revisaba, no se califica la nueva a ciegas.
     */
    async calificar(
      codigo: string, cred: Credencial | null,
      entrada: { ejercicio: unknown; estudiante: unknown; nota: unknown; comentario: unknown; enviada?: unknown },
    ) {
      const aula = await soloDocente(codigo, cred)
      const ej = typeof entrada.ejercicio === 'string' ? entrada.ejercicio : ''
      const est = typeof entrada.estudiante === 'string' ? entrada.estudiante : ''
      const texto = await almacen.hget(k.entregas(codigo, ej), est)
      if (!texto) throw new ErrorAula(404, 'No hay entrega que calificar.')
      const nota = validarNota(entrada.nota)
      if (nota === null) throw new ErrorAula(400, 'La nota va de 0 a 5.')
      const reenviada = new ErrorAula(409, 'El estudiante volvió a enviar su asiento: revisa la entrega nueva.')
      if (entrada.enviada !== undefined && (JSON.parse(texto) as Entrega).enviada !== entrada.enviada) throw reenviada
      const comentario = typeof entrada.comentario === 'string' ? entrada.comentario.trim().slice(0, MAX_COMENTARIO) : ''
      const calificacion: Calificacion = { nota, comentario, fecha: reloj() }
      // Solo si la entrega sigue siendo la leída: un reenvío entre medias no se queda con esta nota.
      if (!(await almacen.hsetSi(k.notas(codigo, ej), est, JSON.stringify(calificacion), aula.expira, k.entregas(codigo, ej), texto))) {
        throw reenviada
      }
      await cambio(aula, { estudiante: est })
      return calificacion
    },

    /**
     * Lo que necesita la IA para sugerir una nota: solo para el docente del aula y con tope
     * por aula. Si ya se sugirió para esta misma entrega, devuelve la guardada sin gastar IA.
     */
    async entregaParaIA(codigo: string, cred: Credencial | null, entrada: { ejercicio: unknown; estudiante: unknown }) {
      const aula = await soloDocente(codigo, cred)
      const ej = typeof entrada.ejercicio === 'string' ? entrada.ejercicio : ''
      const est = typeof entrada.estudiante === 'string' ? entrada.estudiante : ''
      const ejercicio = json<EjercicioDeAula>(await almacen.hget(k.ejercicios(codigo), ej))
      const entrega = json<Entrega>(await almacen.hget(k.entregas(codigo, ej), est))
      if (!ejercicio || !entrega) throw new ErrorAula(404, 'No hay entrega que calificar.')
      const previa = json<{ enviada: number; sugerencia: unknown }>(await almacen.hget(k.ia(codigo), `${ej}:${est}`))
      if (previa && previa.enviada === entrega.enviada) return { ejercicio, filas: entrega.filas, enviada: entrega.enviada, guardada: previa.sugerencia }
      if ((await almacen.incr(k.usoIA(codigo), aula.expira)) > MAX_IA_POR_AULA) {
        throw new ErrorAula(429, `Esta aula ya usó sus ${MAX_IA_POR_AULA} sugerencias de IA.`)
      }
      return { ejercicio, filas: entrega.filas, enviada: entrega.enviada, guardada: undefined }
    },

    /** Guarda la sugerencia de la IA para no pedirla otra vez por la misma entrega. */
    async guardarSugerenciaIA(codigo: string, entrada: { ejercicio: string; estudiante: string; enviada: number; sugerencia: unknown }) {
      const aula = await cargar(codigo)
      const valor = JSON.stringify({ enviada: entrada.enviada, sugerencia: entrada.sugerencia })
      await almacen.hset(k.ia(codigo), `${entrada.ejercicio}:${entrada.estudiante}`, valor, aula.expira)
    },

    async publicarSolucion(codigo: string, cred: Credencial | null, entrada: { ejercicio: unknown }) {
      const aula = await soloDocente(codigo, cred)
      const id = typeof entrada.ejercicio === 'string' ? entrada.ejercicio : ''
      const ej = json<EjercicioDeAula>(await almacen.hget(k.ejercicios(codigo), id))
      if (!ej) throw new ErrorAula(404, 'Ese ejercicio no existe en el aula.')
      ej.solucionPublicada = true
      await almacen.hset(k.ejercicios(codigo), id, JSON.stringify(ej), aula.expira)
      await cambio(aula, { alumnos: true })
    },

    cerrar: (codigo: string, cred: Credencial | null) => conCandado(codigo, async () => {
      const aula = await soloDocente(codigo, cred)
      aula.estado = 'cerrada'
      await guardarAula(aula)
      await almacen.zrem(k.publicas, codigo)
      await cambio(aula, { alumnos: true })
    }),

    cerrarEntrada: (codigo: string, cred: Credencial | null, entrada: { cerrada: unknown }) => conCandado(codigo, async () => {
      const aula = await soloDocente(codigo, cred)
      aula.entradaCerrada = entrada.cerrada === true
      await guardarAula(aula)
      await cambio(aula)
    }),

    async expulsar(codigo: string, cred: Credencial | null, entrada: { estudiante: unknown }) {
      const aula = await soloDocente(codigo, cred)
      const id = typeof entrada.estudiante === 'string' ? entrada.estudiante : ''
      const miembro = json<Miembro>(await almacen.hget(k.miembros(codigo), id))
      if (!miembro) throw new ErrorAula(404, 'Esa persona no está en el aula.')
      miembro.expulsado = true
      await almacen.hset(k.miembros(codigo), id, JSON.stringify(miembro), aula.expira)
      await cambio(aula, { estudiante: id })
    },
  }
}

export type ServicioAulas = ReturnType<typeof servicioAulas>
