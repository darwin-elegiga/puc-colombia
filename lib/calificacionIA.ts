/**
 * Nota y comentario sugeridos por Gemini para una entrega del aula (beta).
 *
 * Solo corre en el servidor y solo cuando el docente pulsa «Sugerir con IA»: la
 * corrección automática local sigue siendo la sugerencia por defecto. El modelo recibe
 * el enunciado, la solución del docente, la entrega y lo que ya marcó la corrección
 * local, y devuelve una nota de 0 a 5 y un comentario para el estudiante. El docente
 * lo revisa antes de guardarlo.
 */
import datosPuc from '@/data/puc.json'
import type { Cuenta } from './tipos'
import { construirCatalogo } from './catalogo'
import { nombreLegible } from './puc'
import { generarJSON } from './ia/gemini'
import { validarNota, type EjercicioDeAula } from './aulas'
import { corregir, type Fila } from './practica'

const CATALOGO = construirCatalogo(datosPuc.cuentas as unknown as Cuenta[], [])

export interface NotaIA {
  nota: number
  comentario: string
  /** Algo que el docente debería revisar, como un posible error en su propia solución. */
  observacion: string
}

const INSTRUCCIONES = `Eres docente de contabilidad en Colombia y calificas asientos contables hechos con el Plan Único de Cuentas (Decreto 2650 de 1993).

Recibes el enunciado, la solución de referencia del docente, la respuesta del estudiante y lo que ya marcó una corrección automática renglón por renglón.

Reglas:
- Nota de 0 a 5 con un decimal. 5 si el asiento es correcto; resta según la gravedad: una cuenta de otra naturaleza o una columna invertida es grave; un importe mal calculado (por ejemplo un impuesto) es moderado; una subcuenta en lugar de su cuenta de 4 dígitos, o al revés, no resta si es correcta.
- Un asiento que no cuadra no puede pasar de 3.
- Valora el razonamiento: si el estudiante usó una cuenta distinta pero contablemente válida para esa operación, no la castigues como error y dilo.
- El comentario va dirigido al estudiante, en segunda persona, en español, en dos o tres frases: primero lo que hizo bien y luego el error concreto (qué cuenta, columna o importe) y cómo corregirlo.
- «observacion» es solo para el docente y casi siempre va vacía. Úsala únicamente si la solución de referencia tiene un error contable real (una cuenta, columna o importe incorrecto según el enunciado) o no cuadra. Nunca la uses para hablar de los errores del estudiante ni para repetir el comentario.`

const ESQUEMA = {
  type: 'object',
  properties: {
    nota: { type: 'number', description: 'De 0 a 5, con un decimal.' },
    comentario: { type: 'string' },
    observacion: { type: 'string' },
  },
  required: ['nota', 'comentario', 'observacion'],
}

const renglones = (filas: Fila[]) =>
  filas
    .map((f) => {
      const cuenta = CATALOGO.indice.get(f.codigo)
      const nombre = cuenta ? nombreLegible(cuenta.nombre) : 'código que no está en el catálogo'
      return `  ${f.codigo} ${nombre}: ${f.debe ? `debe ${f.debe}` : `haber ${f.haber}`}`
    })
    .join('\n')

export async function sugerirNotaIA(ejercicio: EjercicioDeAula, filas: Fila[]): Promise<NotaIA> {
  const solucion = ejercicio.solucion ?? []
  const referencia: Fila[] = solucion.map((l) => ({
    codigo: l.codigo, debe: l.columna === 'debe' ? l.importe : null, haber: l.columna === 'haber' ? l.importe : null,
  }))
  const local = corregir(solucion, filas)
  const marcas = filas.map((f, i) => `  ${f.codigo}: ${local.estados[i] ?? '—'}`).join('\n')
  const datos = ejercicio.datos
    .map((d) => `  ${d.texto}: ${d.importe !== undefined ? d.importe : d.etiqueta}`)
    .join('\n')

  const usuario = [
    `Ejercicio: ${ejercicio.titulo}`,
    `Enunciado: ${ejercicio.enunciado}`,
    datos ? `Datos:\n${datos}` : '',
    `Solución de referencia:\n${renglones(referencia)}`,
    `Respuesta del estudiante:\n${renglones(filas)}`,
    `Corrección automática (ok, importe, columna, cuenta, sobra):\n${marcas}`,
    local.faltan.length ? `Renglones de la solución que no escribió: ${local.faltan.map((l) => l.codigo).join(', ')}` : '',
  ]
    .filter(Boolean)
    .join('\n\n')

  // Un solo intento con 40 s: la ruta tiene 60 s y un reintento con espera se pasaría.
  const r = await generarJSON<NotaIA>({ sistema: INSTRUCCIONES, usuario, esquema: ESQUEMA, maxTokens: 500, intentos: 1, espera: 40_000 })
  return {
    nota: validarNota(Number(r.nota)) ?? 0,
    comentario: String(r.comentario ?? '').trim().slice(0, 500),
    observacion: String(r.observacion ?? '').trim().slice(0, 500),
  }
}
