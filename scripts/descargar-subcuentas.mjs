#!/usr/bin/env node
/**
 * Descarga de puc.com.co las subcuentas (6 dígitos) que el Decreto 2650 de 1993 define
 * para cada cuenta de 4 dígitos del catálogo y las guarda en scripts/subcuentas.json.
 *
 * build-seed.mjs las añade al catálogo con su nombre oficial. Solo hace falta volver a
 * ejecutarlo si cambian las cuentas de 4 dígitos:
 *
 *   node scripts/descargar-subcuentas.mjs && npm run seed
 */
import { readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const RAIZ = join(dirname(fileURLToPath(import.meta.url)), '..')
const FUENTE = 'https://puc.com.co'
const EN_PARALELO = 8

const ENTIDADES = { aacute: 'á', eacute: 'é', iacute: 'í', oacute: 'ó', uacute: 'ú', ntilde: 'ñ', Aacute: 'Á', Eacute: 'É', Iacute: 'Í', Oacute: 'Ó', Uacute: 'Ú', Ntilde: 'Ñ', uuml: 'ü', Uuml: 'Ü', ordf: 'ª', ordm: 'º', nbsp: ' ', amp: '&', quot: '"', laquo: '«', raquo: '»' }
const decodificar = (s) =>
  s
    .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n)))
    .replace(/&([a-zA-Z]+);/g, (m, n) => ENTIDADES[n] ?? m)

/** La página de una cuenta lista «Subcuentas» como pares código / nombre antes de «Descripción». */
function extraer(html, cuenta) {
  const lineas = decodificar(
    html
      .replace(/<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>/g, '')
      .replace(/<[^>]+>/g, '\n'),
  )
    .split('\n')
    .map((l) => l.replace(/\s+/g, ' ').trim())
    .filter(Boolean)

  const inicio = lineas.indexOf('Subcuentas')
  if (inicio < 0) return []
  const subcuentas = []
  for (let i = inicio + 1; i + 1 < lineas.length; i += 2) {
    const codigo = lineas[i]
    if (!/^\d{6}$/.test(codigo) || !codigo.startsWith(cuenta)) break
    subcuentas.push({ codigo, nombre: lineas[i + 1].toUpperCase() })
  }
  return subcuentas
}

const cuentas = JSON.parse(readFileSync(join(RAIZ, 'data/puc.json'), 'utf8'))
  .cuentas.filter((c) => c.codigo.length === 4)
  .map((c) => c.codigo)
const resultado = {}
const pendientes = [...cuentas]
const fallidas = []

async function trabajador() {
  while (pendientes.length) {
    const cuenta = pendientes.shift()
    // El sitio a veces corta alguna petición: se reintenta antes de darla por perdida.
    let respuesta
    for (let intento = 0; intento < 3 && !respuesta?.ok && respuesta?.status !== 404; intento++) {
      respuesta = await fetch(`${FUENTE}/${cuenta}`, { headers: { 'user-agent': 'Mozilla/5.0' } }).catch(() => undefined)
    }
    // Un 404 es una cuenta que el sitio no publica (7105, 7205…): no tiene subcuentas que traer.
    if (respuesta?.status === 404) continue
    if (!respuesta?.ok) { fallidas.push(cuenta); continue }
    const subcuentas = extraer(await respuesta.text(), cuenta)
    if (subcuentas.length) resultado[cuenta] = subcuentas
  }
}

await Promise.all(Array.from({ length: EN_PARALELO }, trabajador))

const ordenado = Object.fromEntries(Object.entries(resultado).sort(([a], [b]) => a.localeCompare(b)))
writeFileSync(
  join(RAIZ, 'scripts/subcuentas.json'),
  JSON.stringify({ fuente: FUENTE, descargado: new Date().toISOString().slice(0, 10), subcuentas: ordenado }, null, 2) + '\n',
  'utf8',
)
const total = Object.values(ordenado).reduce((n, l) => n + l.length, 0)
console.log(`${total} subcuentas de ${Object.keys(ordenado).length} cuentas`)
if (fallidas.length) console.log(`Sin respuesta: ${fallidas.join(', ')}`)
