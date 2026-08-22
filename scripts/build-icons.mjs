#!/usr/bin/env node
/**
 * Genera los iconos PNG de la PWA sin dependencias externas.
 * Dibuja el monograma "PUC" con una retícula de 5x7 por letra y codifica el PNG a mano.
 */
import { deflateSync } from 'node:zlib'
import { writeFileSync, mkdirSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const RAIZ = join(dirname(fileURLToPath(import.meta.url)), '..')

const GLIFOS = {
  P: ['11110', '10001', '10001', '11110', '10000', '10000', '10000'],
  U: ['10001', '10001', '10001', '10001', '10001', '10001', '01110'],
  C: ['01110', '10001', '10000', '10000', '10000', '10001', '01110'],
}

const TINTA = [47, 52, 55]      // #2F3437 charcoal
const PAPEL = [251, 251, 250]   // #FBFBFA hueso

/* ── Codificador PNG mínimo (RGB de 8 bits, sin filtro) ── */

const TABLA_CRC = Array.from({ length: 256 }, (_, n) => {
  let c = n
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1
  return c >>> 0
})

function crc32(buffer) {
  let c = 0xffffffff
  for (const byte of buffer) c = TABLA_CRC[(c ^ byte) & 0xff] ^ (c >>> 8)
  return (c ^ 0xffffffff) >>> 0
}

function trozo(tipo, datos) {
  const largo = Buffer.alloc(4)
  largo.writeUInt32BE(datos.length)
  const cuerpo = Buffer.concat([Buffer.from(tipo, 'ascii'), datos])
  const crc = Buffer.alloc(4)
  crc.writeUInt32BE(crc32(cuerpo))
  return Buffer.concat([largo, cuerpo, crc])
}

function codificarPNG(ancho, alto, pixeles) {
  const firma = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])
  const ihdr = Buffer.alloc(13)
  ihdr.writeUInt32BE(ancho, 0)
  ihdr.writeUInt32BE(alto, 4)
  ihdr[8] = 8   // profundidad de bits
  ihdr[9] = 2   // color RGB
  const filas = []
  for (let y = 0; y < alto; y++) {
    filas.push(Buffer.from([0]), pixeles.subarray(y * ancho * 3, (y + 1) * ancho * 3))
  }
  const idat = deflateSync(Buffer.concat(filas), { level: 9 })
  return Buffer.concat([firma, trozo('IHDR', ihdr), trozo('IDAT', idat), trozo('IEND', Buffer.alloc(0))])
}

/* ── Dibujo del monograma ── */

function generarIcono(lado, proporcionTexto) {
  const pixeles = Buffer.alloc(lado * lado * 3)
  for (let i = 0; i < lado * lado; i++) {
    pixeles[i * 3] = TINTA[0]
    pixeles[i * 3 + 1] = TINTA[1]
    pixeles[i * 3 + 2] = TINTA[2]
  }

  const letras = ['P', 'U', 'C']
  const anchoRetícula = letras.length * 5 + (letras.length - 1) // 17 columnas
  const escala = Math.max(1, Math.floor((lado * proporcionTexto) / anchoRetícula))
  const anchoTexto = anchoRetícula * escala
  const altoTexto = 7 * escala
  const inicioX = Math.round((lado - anchoTexto) / 2)
  const inicioY = Math.round((lado - altoTexto) / 2)

  letras.forEach((letra, indice) => {
    const desplazamiento = indice * 6 * escala
    GLIFOS[letra].forEach((fila, y) => {
      [...fila].forEach((celda, x) => {
        if (celda !== '1') return
        for (let dy = 0; dy < escala; dy++) {
          for (let dx = 0; dx < escala; dx++) {
            const px = inicioX + desplazamiento + x * escala + dx
            const py = inicioY + y * escala + dy
            if (px < 0 || py < 0 || px >= lado || py >= lado) continue
            const i = (py * lado + px) * 3
            pixeles[i] = PAPEL[0]
            pixeles[i + 1] = PAPEL[1]
            pixeles[i + 2] = PAPEL[2]
          }
        }
      })
    })
  })

  return codificarPNG(lado, lado, pixeles)
}

mkdirSync(join(RAIZ, 'public'), { recursive: true })
const iconos = [
  ['icono-192.png', 192, 0.62],
  ['icono-512.png', 512, 0.62],
  ['icono-180.png', 180, 0.62],
  ['icono-maskable-512.png', 512, 0.46], // margen para el recorte del sistema
]
for (const [nombre, lado, proporcion] of iconos) {
  writeFileSync(join(RAIZ, 'public', nombre), generarIcono(lado, proporcion))
  console.log(`public/${nombre}  ${lado}x${lado}`)
}
