/**
 * El almacén de las aulas: Upstash Redis, conectado desde el Marketplace de Vercel
 * (variables KV_REST_API_URL y KV_REST_API_TOKEN).
 *
 * Sin credenciales:
 *  - en producción no hay almacén y las rutas de aulas responden 503 (el resto de la
 *    aplicación sigue funcionando);
 *  - en desarrollo local se usa uno en memoria del servidor, para poder probar el flujo
 *    completo sin conexión. Se pierde al reiniciar `next dev` y nunca se usa en producción.
 */
import { Redis } from '@upstash/redis'
import { almacenEnMemoria, type Almacen } from './aulasServidor'

const global = globalThis as typeof globalThis & { __almacenAulas?: Almacen }

const SOLTAR = `if redis.call('GET', KEYS[1]) == ARGV[1] then return redis.call('DEL', KEYS[1]) end return 0`

/** Upstash guarda y devuelve texto: el servicio serializa sus propios JSON. */
function almacenUpstash(url: string, token: string): Almacen {
  const redis = new Redis({ url, token, automaticDeserialization: false })
  return {
    async get(clave) {
      return (await redis.get<string>(clave)) ?? null
    },
    async set(clave, valor, expiraEn) {
      await redis.set(clave, valor, { pxat: expiraEn })
    },
    async mget(claves) {
      if (!claves.length) return []
      return (await redis.mget<(string | null)[]>(...claves)).map((v) => v ?? null)
    },
    async hget(clave, campo) {
      return (await redis.hget<string>(clave, campo)) ?? null
    },
    async hgetall(clave) {
      // Sin deserialización automática, HGETALL llega como lista plana [campo, valor, campo, valor…].
      const crudo = (await redis.hgetall(clave)) as unknown
      if (!crudo) return {}
      if (Array.isArray(crudo)) {
        const objeto: Record<string, string> = {}
        for (let i = 0; i + 1 < crudo.length; i += 2) objeto[String(crudo[i])] = String(crudo[i + 1])
        return objeto
      }
      return crudo as Record<string, string>
    },
    async hlen(clave) {
      return redis.hlen(clave)
    },
    async hset(clave, campo, valor, expiraEn) {
      // Escribir y fijar la caducidad en un solo viaje.
      const p = redis.pipeline()
      p.hset(clave, { [campo]: valor })
      p.pexpireat(clave, expiraEn)
      await p.exec()
    },
    async hsetnx(clave, campo, valor, expiraEn) {
      const p = redis.pipeline()
      p.hsetnx(clave, campo, valor)
      p.pexpireat(clave, expiraEn)
      const [escrito] = await p.exec<[number, number]>()
      return escrito === 1
    },
    async incr(clave, expiraEn) {
      const p = redis.pipeline()
      p.incr(clave)
      p.pexpireat(clave, expiraEn)
      const [n] = await p.exec<[number, number]>()
      return n
    },
    async hdel(clave, campo) {
      await redis.hdel(clave, campo)
    },
    async bloquear(clave, ficha, ms) {
      return (await redis.set(clave, ficha, { nx: true, px: ms })) !== null
    },
    async soltar(clave, ficha) {
      // Comparar y borrar en un paso: si caducó y otro lo tomó, no se le quita.
      await redis.eval(SOLTAR, [clave], [ficha])
    },
    async zadd(clave, puntaje, miembro) {
      await redis.zadd(clave, { score: puntaje, member: miembro })
    },
    async zrangePorPuntaje(clave, min, max) {
      return redis.zrange<string[]>(clave, min, max, { byScore: true })
    },
    async zremPorPuntaje(clave, min, max) {
      await redis.zremrangebyscore(clave, min, max)
    },
    async zrem(clave, miembro) {
      await redis.zrem(clave, miembro)
    },
  }
}

export function crearAlmacen(): Almacen | null {
  const url = process.env.KV_REST_API_URL ?? process.env.UPSTASH_REDIS_REST_URL
  const token = process.env.KV_REST_API_TOKEN ?? process.env.UPSTASH_REDIS_REST_TOKEN
  if (url && token) return almacenUpstash(url, token)
  if (process.env.NODE_ENV !== 'production') {
    // Las rutas se empaquetan por separado en desarrollo: el almacén se comparte vía globalThis.
    global.__almacenAulas ??= almacenEnMemoria()
    return global.__almacenAulas
  }
  return null
}
