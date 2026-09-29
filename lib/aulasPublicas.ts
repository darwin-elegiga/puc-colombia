/**
 * La lista de aulas públicas, guardada en la caché de datos de Next (compartida entre
 * las funciones de Vercel). Todos los dispositivos con la app abierta la consultan cada
 * pocos segundos: mientras nadie cree, cierre o cambie un aula pública, esas consultas se
 * responden desde la caché y no llegan a Upstash. Cada cambio la invalida y la siguiente
 * consulta la vuelve a leer una sola vez.
 */
import { revalidateTag, unstable_cache } from 'next/cache'
import type { AulaPublica } from './aulas'
import type { ServicioAulas } from './aulasServidor'

const ETIQUETA = 'aulas-publicas'

/** Por si se pierde algún aviso (y para retirar las que caducan): se relee cada 6 h. */
const RELEER_S = 6 * 60 * 60

export function publicasEnCache(servicio: ServicioAulas): Promise<{ version: number; aulas: AulaPublica[] }> {
  return unstable_cache(
    async () => ({ version: await servicio.versionPublicas(), aulas: await servicio.publicas() }),
    ['aulas-publicas-v1'],
    { tags: [ETIQUETA], revalidate: RELEER_S },
  )()
}

/** Tras crear, cerrar o cambiar un aula pública: la siguiente consulta lee la lista nueva. */
export function avisarCambioPublicas() {
  // Caduca ya (sin servir la copia vieja mientras se relee): el aviso debe llegar enseguida.
  revalidateTag(ETIQUETA, { expire: 0 })
}
