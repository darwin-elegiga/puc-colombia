/**
 * Ampliación con IA de la explicación de un asiento (beta).
 *
 * La explicación local (lib/explicacion.ts) siempre va primero y no gasta nada.
 * Esto solo corre cuando el usuario pulsa «Ampliar con la IA», al final de la
 * ficha. Para gastar pocos tokens:
 *
 *   - el modelo recibe el asiento y la explicación local ya hecha, y se le pide
 *     que añada lo que falta (un ejemplo con cifras, errores comunes), no que la repita;
 *   - la salida está acotada por esquema y por maxOutputTokens;
 *   - la misma operación se responde de la caché del servidor.
 *
 * Solo corre en el servidor (app/api/explicar).
 */
import datosPuc from '@/data/puc.json'
import type { Cuenta } from './tipos'
import { construirCatalogo } from './catalogo'
import { explicarAsiento, type RenglonAExplicar } from './explicacion'
import { MODELO_RESPUESTAS, generarJSON } from './ia/gemini'

const CATALOGO = construirCatalogo(datosPuc.cuentas as unknown as Cuenta[], [])
const cuentaDe = (codigo: string) => CATALOGO.indice.get(codigo)

export interface ExplicacionIA {
  modelo: string
  /** Dos a cuatro párrafos cortos que amplían la explicación local. */
  parrafos: string[]
  /** El mismo asiento con cifras redondas, contado paso a paso. */
  ejemplo: string
  errores: string[]
}

const INSTRUCCIONES = `Eres profesor de contabilidad en Colombia (PUC para comerciantes, Decreto 2650 de 1993).
Te dan un asiento y la explicación que el estudiante ya leyó. No la repitas: amplíala.
- parrafos: 2 a 4 párrafos breves con el razonamiento de fondo (por qué esas cuentas y no otras, qué cambia en los estados financieros, cuándo se usaría una alternativa).
- ejemplo: el mismo asiento con importes redondos en pesos colombianos, contado en 2 o 3 frases. Comprueba cada cálculo (divisiones, porcentajes, IVA) y que el débito sea igual al crédito.
- errores: 1 a 3 errores comunes al registrar esta operación.
Español claro, tono cercano y profesional. Usa solo los códigos del asiento o del PUC real; no inventes códigos.`

const ESQUEMA = {
  type: 'object',
  properties: {
    parrafos: { type: 'array', items: { type: 'string' }, maxItems: 4 },
    ejemplo: { type: 'string' },
    errores: { type: 'array', items: { type: 'string' }, maxItems: 3 },
  },
  required: ['parrafos', 'ejemplo', 'errores'],
}

/** Renglones válidos: códigos del catálogo, columna conocida y como mucho 10 renglones. */
export function depurarRenglones(entrada: unknown): RenglonAExplicar[] {
  if (!Array.isArray(entrada)) return []
  return entrada
    .slice(0, 10)
    .map((r) => ({
      codigo: String(r?.codigo ?? '').replace(/\D/g, ''),
      efecto: r?.efecto === 'credito' ? ('credito' as const) : ('debito' as const),
      concepto: String(r?.concepto ?? '').slice(0, 160),
    }))
    .filter((r) => cuentaDe(r.codigo))
}

export async function explicacionIA(operacion: string, renglones: RenglonAExplicar[]): Promise<ExplicacionIA> {
  const local = explicarAsiento(renglones, cuentaDe, operacion)
  const usuario = [
    `Operación: ${operacion}`,
    `Asiento:\n${local.pasos.map((p) => `${p.efecto === 'debito' ? 'D' : 'C'} ${p.codigo} ${p.nombre} — ${p.concepto}`).join('\n')}`,
    `Explicación que ya leyó:\n${local.pasos.map((p) => `· ${p.porQue}`).join('\n')}\n${local.resumen}`,
  ].join('\n\n')

  const r = await generarJSON<Omit<ExplicacionIA, 'modelo'>>({ sistema: INSTRUCCIONES, usuario, esquema: ESQUEMA, maxTokens: 700 })
  const textos = (v: unknown, n: number) => (Array.isArray(v) ? v.map(String).filter(Boolean).slice(0, n) : [])
  return {
    modelo: MODELO_RESPUESTAS,
    parrafos: textos(r.parrafos, 4),
    ejemplo: String(r.ejemplo ?? ''),
    errores: textos(r.errores, 3),
  }
}
