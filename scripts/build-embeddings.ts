/**
 * Genera data/embeddings.json: un vector por cada cuenta oficial y cada movimiento.
 *
 *   GEMINI_API_KEY=… npm run embeddings        (o la clave en .env.local)
 *
 * Solo vectoriza lo que cambió: cada entrada guarda un hash de su texto y, si el
 * texto y el modelo son los mismos, se reutiliza el vector anterior sin llamar a la API.
 */
import { createHash } from 'node:crypto'
import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import { MOVIMIENTOS } from '../data/movimientos'
import { codigosAncestros } from '../lib/puc'
import type { Cuenta } from '../lib/tipos'
import { DIMENSIONES, MODELO_EMBEDDINGS, hayClave, vectorizarVarios } from '../lib/ia/gemini'
import {
  cuantizar, textoDeCuenta, textoDeMovimiento, type EntradaIndice, type IndiceSemantico,
} from '../lib/ia/semantica'

type EntradaConHash = EntradaIndice & { h: string }

const DESTINO = new URL('../data/embeddings.json', import.meta.url)
const cuentas = JSON.parse(readFileSync(new URL('../data/puc.json', import.meta.url), 'utf8')).cuentas as Cuenta[]
const porCodigo = new Map(cuentas.map((c) => [c.codigo, c]))

const documentos = [
  ...cuentas.map((c) => ({
    tipo: 'cuenta' as const,
    id: c.codigo,
    texto: textoDeCuenta(
      c,
      codigosAncestros(c.codigo)
        .map((a) => porCodigo.get(a)?.nombre)
        .filter((n): n is string => Boolean(n)),
    ),
  })),
  ...MOVIMIENTOS.map((m) => ({ tipo: 'movimiento' as const, id: m.id, texto: textoDeMovimiento(m) })),
]

const hash = (texto: string) =>
  createHash('sha1').update(`${MODELO_EMBEDDINGS}:${DIMENSIONES}:${texto}`).digest('hex').slice(0, 12)

const anterior: IndiceSemantico = existsSync(DESTINO)
  ? JSON.parse(readFileSync(DESTINO, 'utf8'))
  : { modelo: '', dimensiones: 0, generado: null, entradas: [] }
const previas = new Map((anterior.entradas as EntradaConHash[]).map((e) => [`${e.tipo}:${e.id}:${e.h}`, e]))

const entradas: EntradaConHash[] = []
const pendientes: (typeof documentos[number] & { h: string })[] = []
for (const d of documentos) {
  const h = hash(d.texto)
  const previa = previas.get(`${d.tipo}:${d.id}:${h}`)
  if (previa) entradas.push(previa)
  else pendientes.push({ ...d, h })
}

console.log(`${documentos.length} documentos: ${entradas.length} sin cambios, ${pendientes.length} por vectorizar.`)

if (pendientes.length && !hayClave()) {
  console.error('Falta GEMINI_API_KEY. Créala gratis en https://aistudio.google.com/apikey y ponla en .env.local.')
  process.exit(1)
}

const LOTE = 100
for (let i = 0; i < pendientes.length; i += LOTE) {
  const lote = pendientes.slice(i, i + LOTE)
  const vectores = await vectorizarVarios(lote.map((d) => d.texto))
  lote.forEach((d, k) => entradas.push({ tipo: d.tipo, id: d.id, h: d.h, ...cuantizar(vectores[k]) }))
  console.log(`  ${Math.min(i + LOTE, pendientes.length)}/${pendientes.length}`)
}

// Mismo orden que los documentos, para que el diff del JSON sea legible.
const orden = new Map(documentos.map((d, i) => [`${d.tipo}:${d.id}`, i]))
entradas.sort((a, b) => orden.get(`${a.tipo}:${a.id}`)! - orden.get(`${b.tipo}:${b.id}`)!)

const indice: IndiceSemantico = {
  modelo: MODELO_EMBEDDINGS,
  dimensiones: DIMENSIONES,
  generado: pendientes.length ? new Date().toISOString() : anterior.generado,
  entradas: entradas.filter((e) => orden.has(`${e.tipo}:${e.id}`)),
}
writeFileSync(DESTINO, `${JSON.stringify(indice)}\n`)
console.log(`Listo: data/embeddings.json (${(JSON.stringify(indice).length / 1024).toFixed(0)} KB).`)
