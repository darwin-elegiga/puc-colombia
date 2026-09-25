/**
 * Genera la base vectorial (data/vectores.json): un vector por cada cuenta del
 * catálogo oficial y por cada movimiento, calculado con Gemini.
 *
 * Se ejecuta a mano cuando cambia el catálogo o los movimientos:
 *
 *   npm run vectores
 *
 * Necesita GEMINI_API_KEY en .env.local (gratis en https://aistudio.google.com/apikey).
 * Son unas seis llamadas de hasta 100 textos cada una: cabe de sobra en la capa gratuita.
 */
import { existsSync, readFileSync, writeFileSync } from 'node:fs'
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
  const LOTE = 100
  const espera = (ms: number) => new Promise((r) => setTimeout(r, ms))
  const items: BaseVectorial['items'] = []

  for (let i = 0; i < documentos.length; i += LOTE) {
    const lote = documentos.slice(i, i + LOTE)
    for (let intento = 1; ; intento++) {
      try {
        const vectores = await vectoresGemini(clave, lote, 'documento')
        vectores.forEach((v, k) => items.push({ tipo: lote[k].tipo, id: lote[k].id, ...cuantizar(v) }))
        break
      } catch (error) {
        // La capa gratuita limita peticiones por minuto: ante un 429 se espera y se reintenta.
        if ((error as { estado?: number }).estado !== 429 || intento >= 6) throw error
        console.log(`  límite de la capa gratuita, reintento en ${intento * 15} s…`)
        await espera(intento * 15_000)
      }
    }
    console.log(`  ${Math.min(i + LOTE, documentos.length)} de ${documentos.length}`)
  }

  const base: BaseVectorial = { modelo: MODELO, dimensiones: DIMENSIONES, generado: new Date().toISOString().slice(0, 10), items }
  writeFileSync(join(RAIZ, 'data/vectores.json'), JSON.stringify(base) + '\n')
  console.log(`data/vectores.json: ${items.length} vectores de ${DIMENSIONES} dimensiones (${MODELO})`)
}

main(CLAVE).catch((error) => {
  console.error(error instanceof Error ? error.message : error)
  process.exit(1)
})
