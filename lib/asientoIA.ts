/**
 * Asiento propuesto por Gemini para una situación descrita con palabras (beta).
 *
 * Solo se usa cuando la propuesta local (asientoLocal) no encontró una operación
 * parecida o el usuario pidió algo más preciso. Para que el modelo no invente:
 *
 *   1. se le dan las cuentas candidatas: búsqueda local + base vectorial;
 *   2. se le dan como referencia las operaciones conocidas más parecidas;
 *   3. responde en JSON con un esquema fijo;
 *   4. el servidor comprueba que los códigos existan en el catálogo y que cuadre.
 *
 * Solo corre en el servidor (app/api/asiento).
 */
import datosPuc from '@/data/puc.json'
import baseVectorial from '@/data/vectores.json'
import type { Cuenta } from './tipos'
import { buscar, construirCatalogo } from './catalogo'
import { buscarMovimientos } from './movimientos'
import { nombreLegible } from './puc'
import {
  API_GEMINI, descuantizar, errorGemini, similitud, vectoresGemini, type BaseVectorial,
} from './vectores'

const CATALOGO = construirCatalogo(datosPuc.cuentas as unknown as Cuenta[], [])
const BASE = baseVectorial as BaseVectorial
const VECTORES_CUENTAS = BASE.items
  .filter((i) => i.tipo === 'cuenta')
  .map((i) => ({ ...i, bytes: descuantizar(i.v) }))

/**
 * El modelo capaz y el ligero se lanzan a la vez. En la capa gratuita los Flash se
 * saturan a ratos y tardan 20–30 s en responder «503»; Flash-Lite casi siempre
 * contesta en un segundo. Si el capaz responde a tiempo se usa su asiento, que es
 * mejor; si no, el del ligero, que ya está listo. La espera queda acotada.
 */
const PRINCIPAL = process.env.GEMINI_MODELO ?? 'gemini-3.8-flash'
const LIGEROS = ['gemini-3.5-flash-lite', 'gemini-flash-lite-latest']
const ESPERA_PRINCIPAL = 12_000
const ESPERA_LIGERO = 25_000

export interface RenglonIA {
  codigo: string
  nombre: string | null
  concepto: string
  debito: number
  credito: number
}

export interface AsientoIA {
  modelo: string
  resumen: string
  lado: 'pago' | 'cobro' | 'interno'
  renglones: RenglonIA[]
  supuestos: string[]
  advertencias: string[]
  validacion: {
    cuadra: boolean
    totalDebito: number
    totalCredito: number
    /** Códigos que no están en el catálogo de la aplicación. */
    desconocidos: string[]
  }
}

const INSTRUCCIONES = `Eres contador público en Colombia. Registras asientos con el Plan Único de Cuentas para comerciantes (Decreto 2650 de 1993).

Reglas:
- Quien describe la situación es la empresa, en primera persona: «pagué» es la empresa que paga; «me pagaron», un tercero que le paga a la empresa.
- Partida doble: al menos un débito y un crédito, y el total del débito igual al del crédito.
- Usa cuentas de 4 dígitos o subcuentas de 6 del PUC. Prefiere las de la lista de candidatas; si ninguna sirve, usa la correcta del PUC y explícalo en advertencias. No inventes códigos.
- En cada renglón, solo uno de «debito» o «credito» es mayor que cero.
- Importes en pesos colombianos, sin decimales. Si la situación no da importes, usa valores ilustrativos redondos y dilo en supuestos.
- IVA general del 19 % cuando la operación esté gravada y el texto no diga lo contrario. Retenciones solo si la situación las sugiere o son habituales; en ese caso, indícalo en supuestos con la tarifa usada.
- Conceptos cortos y en español.
- Pagar con tarjeta de crédito de la empresa no mueve bancos: nace una obligación financiera con el banco emisor (2105), que se cancela al pagar el extracto.
- Si la situación es ambigua, elige la interpretación más común, dilo en supuestos y menciona la alternativa en advertencias.`

const ESQUEMA = {
  type: 'object',
  properties: {
    resumen: { type: 'string', description: 'Qué operación es, en una frase.' },
    lado: { type: 'string', enum: ['pago', 'cobro', 'interno'], description: 'pago si sale dinero de la empresa, cobro si entra, interno si no se mueve dinero.' },
    renglones: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          codigo: { type: 'string' },
          concepto: { type: 'string' },
          debito: { type: 'number' },
          credito: { type: 'number' },
        },
        required: ['codigo', 'concepto', 'debito', 'credito'],
      },
    },
    supuestos: { type: 'array', items: { type: 'string' } },
    advertencias: { type: 'array', items: { type: 'string' } },
  },
  required: ['resumen', 'lado', 'renglones', 'supuestos', 'advertencias'],
}

/** Cuentas candidatas: las que encuentra la búsqueda local y las más cercanas en la base vectorial. */
async function candidatas(clave: string, situacion: string): Promise<string[]> {
  const codigos = new Set(buscar(CATALOGO, { q: situacion }, 30).resultados.map((r) => r.codigo))
  if (VECTORES_CUENTAS.length) {
    try {
      const [vector] = await vectoresGemini(clave, [{ texto: situacion }], 'consulta')
      VECTORES_CUENTAS.map((i) => ({ id: i.id, s: similitud(vector, i.bytes, i.escala) }))
        .sort((a, b) => b.s - a.s)
        .slice(0, 25)
        .forEach((i) => codigos.add(i.id))
    } catch {
      // Sin vectores se sigue con las candidatas locales.
    }
  }
  return [...codigos]
}

async function generar(clave: string, modelo: string, texto: string, espera: number) {
  const respuesta = await fetch(`${API_GEMINI}/models/${modelo}:generateContent`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'x-goog-api-key': clave },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: INSTRUCCIONES }] },
      contents: [{ role: 'user', parts: [{ text: texto }] }],
      generationConfig: { responseMimeType: 'application/json', responseSchema: ESQUEMA, temperature: 0.2 },
    }),
    signal: AbortSignal.timeout(espera),
  })
  if (!respuesta.ok) throw errorGemini(respuesta.status, await respuesta.text())
  const datos = (await respuesta.json()) as { candidates?: { content?: { parts?: { text?: string }[] } }[] }
  const json = datos.candidates?.[0]?.content?.parts?.map((p) => p.text ?? '').join('') ?? ''
  return JSON.parse(json) as Omit<AsientoIA, 'modelo' | 'validacion'>
}

export async function asientoIA(clave: string, situacion: string): Promise<AsientoIA> {
  const codigos = await candidatas(clave, situacion)
  const listaCandidatas = codigos
    .map((c) => CATALOGO.indice.get(c))
    .filter(Boolean)
    .map((c) => `${c!.codigo} — ${nombreLegible(c!.nombre)}`)
    .join('\n')
  const referencias = buscarMovimientos(situacion, 3)
    .map((m) => `• ${m.nombre}: ${m.asiento.map((r) => `${r.efecto === 'debito' ? 'D' : 'C'} ${r.codigo} (${r.concepto})`).join('; ')}`)
    .join('\n')

  const texto = [
    `Situación: ${situacion}`,
    `Cuentas candidatas del catálogo:\n${listaCandidatas || '(ninguna)'}`,
    referencias ? `Operaciones parecidas ya conocidas, como referencia de estructura:\n${referencias}` : '',
  ]
    .filter(Boolean)
    .join('\n\n')

  // El ligero arranca ya; su resultado (o su error) queda guardado para usarlo si hace falta.
  const ligero = generar(clave, LIGEROS[0], texto, ESPERA_LIGERO).then(
    (propuesta) => ({ modelo: LIGEROS[0], propuesta }),
    (error: unknown) => ({ modelo: LIGEROS[0], error }),
  )
  try {
    return validar(PRINCIPAL, await generar(clave, PRINCIPAL, texto, ESPERA_PRINCIPAL))
  } catch {
    // Saturado, sin cuota o lento: se sigue con el ligero.
  }
  const respaldo = await ligero
  if ('propuesta' in respaldo) return validar(respaldo.modelo, respaldo.propuesta)
  // Último intento con el otro ligero; si también falla, el error llega a la ruta.
  return validar(LIGEROS[1], await generar(clave, LIGEROS[1], texto, ESPERA_LIGERO))
}

/** Completa los nombres y comprueba códigos y cuadre: el modelo propone, el catálogo decide. */
function validar(modelo: string, p: Omit<AsientoIA, 'modelo' | 'validacion'>): AsientoIA {
  const redondear = (n: unknown) => Math.max(0, Math.round(Number(n) || 0))
  const renglones: RenglonIA[] = (p.renglones ?? []).map((r) => {
    const codigo = String(r.codigo ?? '').replace(/\D/g, '')
    return {
      codigo,
      nombre: CATALOGO.indice.get(codigo)?.nombre ?? null,
      concepto: String(r.concepto ?? ''),
      debito: redondear(r.debito),
      credito: redondear(r.credito),
    }
  })
  const totalDebito = renglones.reduce((s, r) => s + r.debito, 0)
  const totalCredito = renglones.reduce((s, r) => s + r.credito, 0)
  const desconocidos = renglones.filter((r) => !r.nombre).map((r) => r.codigo)

  const advertencias = [...(p.advertencias ?? [])]
  if (desconocidos.length) {
    advertencias.push(
      `${desconocidos.join(', ')} no ${desconocidos.length === 1 ? 'está' : 'están'} en el catálogo de la aplicación: compruébalo en puc.com.co antes de usarlo.`,
    )
  }
  if (totalDebito !== totalCredito) advertencias.push('El asiento no cuadra: revisa los importes.')

  return {
    modelo,
    resumen: String(p.resumen ?? ''),
    lado: ['pago', 'cobro', 'interno'].includes(p.lado) ? p.lado : 'interno',
    renglones,
    supuestos: p.supuestos ?? [],
    advertencias,
    validacion: { cuadra: totalDebito === totalCredito && totalDebito > 0, totalDebito, totalCredito, desconocidos },
  }
}
