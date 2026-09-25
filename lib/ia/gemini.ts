/**
 * Cliente mínimo de la API de Gemini, con fetch y sin SDK.
 *
 * Solo corre en el servidor (ruta /api/asistente y script de embeddings): la clave
 * GEMINI_API_KEY nunca llega al navegador. Los modelos se pueden cambiar por
 * variable de entorno sin tocar el código.
 */

const BASE = 'https://generativelanguage.googleapis.com/v1beta'

export const MODELO_EMBEDDINGS = process.env.GEMINI_MODELO_EMBEDDINGS || 'gemini-embedding-2'
export const MODELO_RESPUESTAS = process.env.GEMINI_MODELO || 'gemini-3.5-flash-lite'
export const DIMENSIONES = 768

export class ErrorGemini extends Error {
  constructor(
    message: string,
    readonly estado: number,
  ) {
    super(message)
  }
}

export const hayClave = () => Boolean(process.env.GEMINI_API_KEY)

async function llamar<T>(ruta: string, cuerpo: unknown, { intentos = 3, espera = 20_000 } = {}): Promise<T> {
  const clave = process.env.GEMINI_API_KEY
  if (!clave) throw new ErrorGemini('Falta GEMINI_API_KEY', 503)

  for (let intento = 1; ; intento++) {
    const respuesta = await fetch(`${BASE}/${ruta}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-goog-api-key': clave },
      body: JSON.stringify(cuerpo),
      signal: AbortSignal.timeout(espera),
    })
    if (respuesta.ok) return (await respuesta.json()) as T

    // 429 (cuota de la capa gratuita) y 5xx suelen pasar solos: se reintenta con espera creciente.
    const reintentable = respuesta.status === 429 || respuesta.status >= 500
    if (!reintentable || intento >= intentos) {
      const detalle = await respuesta.text().catch(() => '')
      throw new ErrorGemini(`Gemini respondió ${respuesta.status}: ${detalle.slice(0, 300)}`, respuesta.status)
    }
    await new Promise((r) => setTimeout(r, 1000 * 2 ** intento))
  }
}

/* ─────────────────────────── Embeddings ─────────────────────────── */

export async function vectorizar(texto: string): Promise<number[]> {
  const r = await llamar<{ embedding: { values: number[] } }>(`models/${MODELO_EMBEDDINGS}:embedContent`, {
    content: { parts: [{ text: texto }] },
    output_dimensionality: DIMENSIONES,
  })
  return r.embedding.values
}

/** Hasta 100 textos por petición, que es el máximo de batchEmbedContents. */
export async function vectorizarVarios(textos: string[]): Promise<number[][]> {
  const r = await llamar<{ embeddings: { values: number[] }[] }>(
    `models/${MODELO_EMBEDDINGS}:batchEmbedContents`,
    {
      requests: textos.map((text) => ({
        model: `models/${MODELO_EMBEDDINGS}`,
        content: { parts: [{ text }] },
        output_dimensionality: DIMENSIONES,
      })),
    },
    { intentos: 5, espera: 60_000 },
  )
  return r.embeddings.map((e) => e.values)
}

/* ─────────────────────────── Respuestas ─────────────────────────── */

interface RespuestaGenerar {
  candidates?: { content?: { parts?: { text?: string }[] }; finishReason?: string }[]
  usageMetadata?: { promptTokenCount?: number; candidatesTokenCount?: number }
}

/** Pide una respuesta en JSON que cumpla el esquema y la devuelve ya parseada. */
export async function generarJSON<T>({
  sistema,
  usuario,
  esquema,
  maxTokens = 900,
  modelo = MODELO_RESPUESTAS,
  espera = 20_000,
  intentos = 2,
}: {
  sistema: string
  usuario: string
  esquema: object
  maxTokens?: number
  modelo?: string
  /** Milisegundos antes de abandonar la petición. */
  espera?: number
  intentos?: number
}): Promise<T> {
  const r = await llamar<RespuestaGenerar>(
    `models/${modelo}:generateContent`,
    {
      systemInstruction: { parts: [{ text: sistema }] },
      contents: [{ role: 'user', parts: [{ text: usuario }] }],
      generationConfig: {
        responseMimeType: 'application/json',
        responseJsonSchema: esquema,
        temperature: 0.2,
        maxOutputTokens: maxTokens,
        // La respuesta sale de un contexto ya acotado: no hace falta razonar a fondo.
        thinkingConfig: { thinkingLevel: 'minimal' },
      },
    },
    { intentos, espera },
  )
  const texto = r.candidates?.[0]?.content?.parts?.map((p) => p.text ?? '').join('') ?? ''
  if (!texto) throw new ErrorGemini(`Gemini no devolvió texto (${r.candidates?.[0]?.finishReason ?? 'sin candidatos'})`, 502)
  try {
    return JSON.parse(texto) as T
  } catch {
    throw new ErrorGemini('La respuesta de Gemini no es JSON válido', 502)
  }
}
