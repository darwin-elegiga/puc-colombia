#!/usr/bin/env node
/**
 * Descarga de puc.com.co la descripción y la dinámica oficiales (Decreto 2650 de 1993)
 * de cada código del catálogo y las guarda en scripts/oficial.json.
 *
 * build-seed.mjs usa ese archivo para que los textos del catálogo sean los del decreto
 * y no un resumen propio. Solo hace falta volver a ejecutarlo al añadir códigos:
 *
 *   node scripts/descargar-oficial.mjs && npm run seed
 */
import { readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const RAIZ = join(dirname(fileURLToPath(import.meta.url)), '..')
const FUENTE = 'https://puc.com.co'
const EN_PARALELO = 8

const ENTIDADES = { aacute: 'á', eacute: 'é', iacute: 'í', oacute: 'ó', uacute: 'ú', ntilde: 'ñ', Aacute: 'Á', Eacute: 'É', Iacute: 'Í', Oacute: 'Ó', Uacute: 'Ú', Ntilde: 'Ñ', uuml: 'ü', ordf: 'ª', ordm: 'º', nbsp: ' ', amp: '&', quot: '"', laquo: '«', raquo: '»' }
const decodificar = (s) =>
  s
    .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n)))
    .replace(/&([a-zA-Z]+);/g, (m, n) => ENTIDADES[n] ?? m)

/** Convierte la página en renglones de texto y separa descripción, débitos y créditos. */
function extraer(html) {
  const lineas = decodificar(
    html
      .replace(/<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>/g, '')
      .replace(/<[^>]+>/g, '\n'),
  )
    .split('\n')
    .map((l) => l.replace(/\s+/g, ' ').trim())
    .filter(Boolean)

  const inicio = lineas.indexOf('Descripción')
  if (inicio < 0) return null
  const fin = lineas.findIndex((l, i) => i > inicio && /^\d{4} PUC/.test(l))

  const salida = { descripcion: [], debita: [], acredita: [] }
  let destino = salida.descripcion
  for (const l of lineas.slice(inicio + 1, fin < 0 ? undefined : fin)) {
    if (l === 'Dinámica') continue
    if (l === 'Débitos') { destino = salida.debita; continue }
    if (l === 'Créditos') { destino = salida.acredita; continue }
    destino.push(l)
  }
  return salida
}

const codigos = JSON.parse(readFileSync(join(RAIZ, 'data/puc.json'), 'utf8')).cuentas.map((c) => c.codigo)
const resultado = {}
let pendientes = [...codigos]

async function trabajador() {
  while (pendientes.length) {
    const codigo = pendientes.shift()
    const respuesta = await fetch(`${FUENTE}/${codigo}`, { headers: { 'user-agent': 'Mozilla/5.0' } })
    if (!respuesta.ok) continue
    const datos = extraer(await respuesta.text())
    if (datos) resultado[codigo] = datos
  }
}

await Promise.all(Array.from({ length: EN_PARALELO }, trabajador))

const ordenado = Object.fromEntries(Object.entries(resultado).sort(([a], [b]) => a.localeCompare(b)))
writeFileSync(
  join(RAIZ, 'scripts/oficial.json'),
  JSON.stringify({ fuente: FUENTE, descargado: new Date().toISOString().slice(0, 10), textos: ordenado }, null, 1) + '\n',
)
console.log(`${Object.keys(ordenado).length} de ${codigos.length} códigos con texto oficial`)
