/**
 * Genera la base vectorial (data/vectores.json): un vector por cada cuenta del
 * catálogo oficial y por cada movimiento, calculado con Gemini.
 *
 * Se ejecuta a mano cuando cambia el catálogo o los movimientos:
 *
 *   npm run vectores
 *
 * Necesita GEMINI_API_KEY en .env.local (gratis en https://aistudio.google.com/apikey).
 *
 * Es incremental: cada vector guarda una huella de su texto y solo se piden los que
 * cambiaron o son nuevos. La capa gratuita limita los tokens por minuto, así que se
 * envían lotes pequeños y, ante un 429, se espera y se reintenta.
 */
import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import { createHash } from 'node:crypto'
import { join } from 'node:path'
import { MOVIMIENTOS } from '../data/movimientos'
import type { Cuenta } from '../lib/tipos'
import {
  DIMENSIONES, MODELO, cuantizar, documentoDeCuenta, documentoDeMovimiento, vectoresGemini,
  type BaseVectorial,
} from '../lib/vectores'

const RAIZ = join(__dirname, '..')
for (const archivo of ['.env.local', '.env']) {
  if (existsSync(join(RAIZ, archivo))) process.loadEnvFile(join(RAIZ, archivo))
}
const CLAVE = process.env.GEMINI_API_KEY
if (!CLAVE) {
  console.error('Falta GEMINI_API_KEY. Créala gratis en https://aistudio.google.com/apikey y añádela a .env.local')
  process.exit(1)
}

const cuentas = (JSON.parse(readFileSync(join(RAIZ, 'data/puc.json'), 'utf8')).cuentas as Cuenta[])
const documentos = [...cuentas.map(documentoDeCuenta), ...MOVIMIENTOS.map(documentoDeMovimiento)]

// Función y no await suelto: el proyecto compila los .ts como CommonJS.
async function main(clave: string) {
  const LOTE = 20
  const espera = (ms: number) => new Promise((r) => setTimeout(r, ms))
  const huella = (d: { titulo: string; texto: string }) =>
    createHash('sha1').update(`${MODELO}|${DIMENSIONES}|${d.titulo}|${d.texto}`).digest('hex').slice(0, 12)

  const ruta = join(RAIZ, 'data/vectores.json')
  const previa: BaseVectorial | null = existsSync(ruta) ? JSON.parse(readFileSync(ruta, 'utf8')) : null
  const guardados = new Map((previa?.items ?? []).map((i) => [`${i.tipo}:${i.id}`, i]))

  const items: BaseVectorial['items'] = []
  const pendientes: (typeof documentos)[number][] = []
  for (const d of documentos) {
    const previo = guardados.get(`${d.tipo}:${d.id}`)
    if (previo?.h === huella(d)) items.push(previo)
    else pendientes.push(d)
  }
  // Primero lo que no tiene ningún vector (operaciones o cuentas nuevas); luego lo que cambió.
  pendientes.sort((a, b) => Number(guardados.has(`${a.tipo}:${a.id}`)) - Number(guardados.has(`${b.tipo}:${b.id}`)))
  console.log(`${documentos.length - pendientes.length} vectores sin cambios; ${pendientes.length} por pedir`)

  // Se guarda tras cada lote: si la cuota diaria se agota a medias, la próxima vez sigue desde ahí.
  const guardar = () => {
    const orden = new Map(documentos.map((d, k) => [`${d.tipo}:${d.id}`, k]))
    const vigentes = new Map(items.map((it) => [`${it.tipo}:${it.id}`, it]))
    // Los vectores previos aún no regenerados se conservan hasta que se sustituyan.
    for (const [clave, previo] of guardados) if (orden.has(clave) && !vigentes.has(clave)) vigentes.set(clave, previo)
    const lista = [...vigentes.values()].sort((a, b) => orden.get(`${a.tipo}:${a.id}`)! - orden.get(`${b.tipo}:${b.id}`)!)
    const base: BaseVectorial = { modelo: MODELO, dimensiones: DIMENSIONES, generado: new Date().toISOString().slice(0, 10), items: lista }
    writeFileSync(ruta, JSON.stringify(base) + '\n')
    return lista.length
  }

  for (let i = 0; i < pendientes.length; i += LOTE) {
    const lote = pendientes.slice(i, i + LOTE)
    for (let intento = 1; ; intento++) {
      try {
        const vectores = await vectoresGemini(clave, lote, 'documento')
        vectores.forEach((v, k) => items.push({ tipo: lote[k].tipo, id: lote[k].id, ...cuantizar(v), h: huella(lote[k]) }))
        break
      } catch (error) {
        // Límite de tokens por minuto de la capa gratuita: se espera y se reintenta.
        if ((error as { estado?: number }).estado !== 429 || intento >= 6) {
          const total = guardar()
          console.error(`Se detuvo con ${total} vectores guardados; vuelve a ejecutarlo más tarde para completar.`)
          throw error
        }
        const segundos = Math.min(20 * intento, 90)
        console.log(`  límite por minuto, reintento en ${segundos} s…`)
        await espera(segundos * 1000)
      }
    }
    guardar()
    console.log(`  ${Math.min(i + LOTE, pendientes.length)} de ${pendientes.length}`)
  }

  const total = guardar()
  console.log(`data/vectores.json: ${total} vectores de ${DIMENSIONES} dimensiones (${MODELO})`)
}

main(CLAVE).catch((error) => {
  console.error(error instanceof Error ? error.message : error)
  process.exit(1)
})
