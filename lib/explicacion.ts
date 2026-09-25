/**
 * Por qué un asiento se hace así, explicado en local y sin IA.
 *
 * Cada renglón se explica con tres cosas que la aplicación ya sabe:
 *   1. la clase de la cuenta y su naturaleza: con qué columna sube su saldo;
 *   2. qué significa que suba o baje en esa clase (entra un bien, nace una deuda…);
 *   3. la frase de la dinámica oficial (Decreto 2650) que mejor encaja con el concepto.
 *
 * Con eso se arma también el efecto en la ecuación contable y la cuenta T.
 * Funciones puras: no dependen de React.
 */
import type { Cuenta, Dinamica, Naturaleza } from './tipos'
import { NOMBRE_CLASE, codigosAncestros, nombreLegible, naturalezaPorClase } from './puc'
import { normalizarTexto, palabras, raiz } from './busqueda'
import { aliasDe } from './vocabulario'

export interface RenglonAExplicar {
  codigo: string
  efecto: 'debito' | 'credito'
  concepto: string
  /** En pesos, cuando se conoce (asiento de la IA). */
  importe?: number
}

export type Sentido = 'sube' | 'baja'

export interface PasoExplicado extends RenglonAExplicar {
  nombre: string
  clase: string
  nombreClase: string
  /** Cómo se le dice a la cuenta en el día a día: «arriendo», «banco», «cartera»… */
  seLlama: string[]
  /** Naturaleza de la cuenta: la columna con la que sube su saldo. */
  naturaleza: Naturaleza
  /** true en las cuentas que restan dentro de su clase, como la depreciación acumulada. */
  correctora: boolean
  /** Qué le pasa al saldo de la cuenta con este renglón. */
  saldo: Sentido
  porQue: string
  /** La frase de la dinámica oficial que respalda el renglón, si alguna encaja. */
  oficial?: { texto: string; heredadaDe?: string }
}

/** Qué le pasa a cada gran bloque de la ecuación contable. */
export type EfectoBloque = Sentido | 'cambia' | null

export interface Explicacion {
  pasos: PasoExplicado[]
  /** Efecto por clase (1 a 7): sube, baja, cambia de forma (sube y baja a la vez) o no se toca. */
  ecuacion: Record<string, EfectoBloque>
  /** La partida doble y el equilibrio de la ecuación, en una o dos frases. */
  resumen: string
  totales: { debito: number; credito: number } | null
}

const LADO = { debito: 'el debe', credito: 'el haber' } as const
const COLUMNA = { debito: 'débito', credito: 'crédito' } as const

/** Qué significa, en cada clase, que su saldo suba o baje. */
const SIGNIFICADO: Record<string, Record<Sentido, string>> = {
  '1': {
    sube: 'la empresa recibe algo que tiene o que le deben',
    baja: 'sale algo que la empresa tenía, o se cobra algo que le debían',
  },
  '2': { sube: 'la empresa queda debiendo ese valor', baja: 'la empresa paga o cancela lo que debía' },
  '3': { sube: 'crece lo que es de los dueños', baja: 'se reduce lo de los dueños: se reparte o absorbe una pérdida' },
  '4': { sube: 'la empresa gana un ingreso', baja: 'se reduce un ingreso: una devolución, un descuento o el cierre' },
  '5': { sube: 'se consume un gasto para funcionar', baja: 'se reintegra o se cierra un gasto' },
  '6': { sube: 'se reconoce el costo de lo que se vendió', baja: 'se reversa o se cierra un costo de ventas' },
  '7': { sube: 'se acumula costo de producción', baja: 'el costo producido pasa al inventario' },
  '8': { sube: 'se anota un derecho para control', baja: 'se cancela un derecho de control' },
  '9': { sube: 'se anota una obligación para control', baja: 'se cancela una obligación de control' },
}

const ARTICULO: Record<string, string> = {
  '1': 'un activo', '2': 'un pasivo', '3': 'patrimonio', '4': 'un ingreso', '5': 'un gasto',
  '6': 'un costo de ventas', '7': 'un costo de producción', '8': 'una cuenta de orden deudora',
  '9': 'una cuenta de orden acreedora',
}

const BLOQUE: Record<string, string> = {
  '1': 'el activo', '2': 'el pasivo', '3': 'el patrimonio', '4': 'los ingresos', '5': 'los gastos',
  '6': 'los costos de ventas', '7': 'los costos de producción',
}
const EN_PLURAL = new Set(['4', '5', '6', '7'])
const verbo = (clase: string, e: Sentido | 'cambia') =>
  e === 'cambia' ? (EN_PLURAL.has(clase) ? 'cambian de forma' : 'cambia de forma') : EN_PLURAL.has(clase) ? `${e}n` : e

/* ─────────────────────── Dinámica oficial ─────────────────────── */

/** Palabras que aparecen en casi toda la dinámica y no distinguen una frase de otra. */
const GENERICAS = new Set(
  (
    'valor valores ente economico economicos cuenta cuentas respectivo respectiva respectivos caso casos ' +
    'cualquier concepto conceptos correspondiente correspondientes efectuados efectuadas efectuar realizados ' +
    'para por con del las los una unos unas que sus cual cuales cuando este esta estos estas otros otras ' +
    'segun sobre entre desde hasta mismo misma forma parte periodo ejercicio empresa'
  ).split(' '),
)

const raices = (texto: string, excluir: Set<string> = new Set()) =>
  new Set(
    palabras(texto)
      .filter((p) => p.length > 3 && !GENERICAS.has(p))
      .map(raiz)
      .filter((r) => !excluir.has(r)),
  )

/** Casos excepcionales de la dinámica: solo se citan si la operación habla de ellos. */
const EXCEPCIONAL = /arqueo|divisa|tasa de cambio|sobrante|faltante|anulad|no pago|notas? (debito|credito)|reajuste|diferencia en cambio|tales como/

/** Dinámica propia o, si no la tiene, la del ancestro más cercano que la defina. */
function dinamicaDe(cuenta: Cuenta, cuentaDe: (codigo: string) => Cuenta | undefined): (Dinamica & { heredadaDe?: string }) | undefined {
  if (cuenta.dinamica) return cuenta.dinamica
  for (const c of [...codigosAncestros(cuenta.codigo)].reverse()) {
    const ancestro = cuentaDe(c)
    if (ancestro?.dinamica) return { ...ancestro.dinamica, heredadaDe: c }
  }
  return undefined
}

/**
 * La frase de «se debita por…» o «se acredita por…» que más palabras comparte con
 * el concepto del renglón (cuentan doble) y con el nombre de la operación. Las
 * palabras del nombre de la cuenta no cuentan: salen en casi todas sus frases.
 * Si ninguna encaja se cita la frase general («por cualquier otra operación…»)
 * o, si hay una sola, esa; si no, ninguna: mejor callar que citar mal.
 */
export function fraseOficial(frases: string[], concepto: string, contexto: string, nombreCuenta = ''): string | undefined {
  if (frases.length === 0) return undefined
  const propias = raices(nombreCuenta)
  const delConcepto = raices(concepto, propias)
  const delContexto = raices(contexto, propias)
  const operacion = normalizarTexto(`${concepto} ${contexto}`)
  let mejor: { frase: string; puntaje: number } | undefined
  for (const frase of frases) {
    let puntaje = 0
    for (const r of raices(frase, propias)) puntaje += delConcepto.has(r) ? 2 : delContexto.has(r) ? 1 : 0
    const rara = normalizarTexto(frase).match(EXCEPCIONAL)
    if (rara && !operacion.includes(rara[0])) puntaje -= 1.5
    // Entre frases igual de parecidas, la más corta suele ser la más directa.
    puntaje -= frase.length / 10_000
    if (!mejor || puntaje > mejor.puntaje) mejor = { frase, puntaje }
  }
  if (mejor && mejor.puntaje >= 1) return mejor.frase
  return frases.find((f) => /cualquier otr/i.test(f)) ?? (frases.length === 1 ? frases[0] : undefined)
}

/* ─────────────────────── Explicación ─────────────────────── */

/** El nombre de la cuenta y de sus ancestros: sus palabras no distinguen una frase de otra. */
const nombresDe = (codigo: string, cuentaDe: (codigo: string) => Cuenta | undefined) =>
  [codigo, ...codigosAncestros(codigo)].map((c) => cuentaDe(c)?.nombre ?? '').join(' ')

/* ─────────────────────── En el día a día ─────────────────────── */

/**
 * Lo que sirve al buscador pero no se lee bien en una explicación: frases en primera
 * persona («me prestó el banco», «le debo al proveedor»), jerga y marcas.
 */
const PRIMERA_PERSONA = /^(me|le|les|nos|lo|la|se|yo|mi|mis)\s|\b(debo|debemos|tengo|tenemos|hice|hicimos|pague|compre|vendi|saque|firme|preste|recibi|cobre|puse|doy)\b/
/** Frases en pretérito: «me sobregiré», «el cliente devolvió». Se mira con tildes. */
const PRETERITO = /\p{L}{3,}[éó](\s|$)/u
const JERGA = /^(guita|lana|pasta|lucas|billullo|billete|cash|petty cash|plata)$/
const MARCAS = /bancolombia|davivienda|bbva|scotiabank|colpatria|nequi|daviplata|banco de bogota|banco agrario|banco popular|banco de occidente|av villas|itau|falabella/

/** Raíces de un texto, para comparar «banco» con «bancos» o un alias con el nombre oficial. */
const firma = (texto: string) => [...raices(texto)].sort().join(' ')

/**
 * Cómo se le dice a una cuenta en el día a día, para mostrarlo junto a su nombre oficial.
 *
 * Toma los alias del vocabulario (lib/vocabulario.ts): primero los de la cuenta y, si
 * es una subcuenta, los de su cuenta de 4 dígitos; así 111005 se dice «cuenta
 * corriente», pero también «banco» (1110). Deja fuera lo que repite los nombres
 * oficiales que se le pasan, las frases en primera persona, la jerga, las marcas y lo de más de tres
 * palabras. Sin repetir lo que se dice igual («banco» y «bancos»).
 */
export function comoSeLlama(codigo: string, nombresOficiales: string[], maximo = 4): string[] {
  // Solo el nombre de la propia cuenta: el de la madre sí aclara (111005 → «banco»).
  const oficiales = new Set(nombresOficiales.map(firma))
  const vistas = new Set<string>()
  const elegidos: string[] = []
  for (const alias of [...aliasDe(codigo), ...(codigo.length > 4 ? aliasDe(codigo.slice(0, 4)) : [])]) {
    const texto = normalizarTexto(alias).trim()
    const clave = firma(alias)
    if (!clave || vistas.has(clave) || oficiales.has(clave)) continue
    if (texto.split(/\s+/).length > 3 || PRIMERA_PERSONA.test(texto) || PRETERITO.test(alias.toLowerCase()) || JERGA.test(texto) || MARCAS.test(texto)) continue
    vistas.add(clave)
    elegidos.push(alias)
    if (elegidos.length === maximo) break
  }
  return elegidos
}

const pesos = (n: number) => `$ ${n.toLocaleString('es-CO')}`

export function explicarAsiento(
  renglones: RenglonAExplicar[],
  cuentaDe: (codigo: string) => Cuenta | undefined,
  /** Nombre y descripción de la operación, o la situación escrita por el usuario. */
  contexto = '',
): Explicacion {
  const pasos = renglones.map((r): PasoExplicado => {
    const cuenta = cuentaDe(r.codigo)
    const clase = r.codigo[0]
    const deClase = naturalezaPorClase(r.codigo) ?? 'debito'
    const naturaleza = cuenta?.naturaleza ?? deClase
    const correctora = naturaleza !== deClase
    const saldo: Sentido = r.efecto === naturaleza ? 'sube' : 'baja'
    const nombre = cuenta ? nombreLegible(cuenta.nombre) : 'Cuenta no encontrada'

    const lado = LADO[r.efecto]
    const neto = `${BLOQUE[clase] ?? 'la clase'} ${EN_PLURAL.has(clase) ? 'netos' : 'neto'}`
    const porQue = correctora
      ? `${r.codigo} ${nombre} es una cuenta correctora ${(BLOQUE[clase] ?? 'su clase').replace(/^el /, 'del ').replace(/^(los|la|su) /, 'de $1 ')}: tiene naturaleza ${COLUMNA[naturaleza]}, al revés que su clase, y le resta. ` +
        (saldo === 'sube'
          ? `Aquí su saldo sube por ${lado}, así que ${neto} ${verbo(clase, 'baja')}.`
          : `Aquí su saldo baja por ${lado}: se retira lo acumulado y ${neto} ${verbo(clase, 'sube')}.`)
      : `${r.codigo} ${nombre} es ${ARTICULO[clase] ?? 'una cuenta'} (clase ${clase}): su saldo sube por ${LADO[naturaleza]}. ` +
        (saldo === 'sube'
          ? `Aquí sube porque ${SIGNIFICADO[clase]?.sube ?? 'aumenta'}, así que va al ${COLUMNA[r.efecto]}.`
          : `Aquí baja porque ${SIGNIFICADO[clase]?.baja ?? 'disminuye'}, así que va al ${COLUMNA[r.efecto]}, el lado que la disminuye.`)

    const dinamica = cuenta ? dinamicaDe(cuenta, cuentaDe) : undefined
    const texto = dinamica
      ? fraseOficial(r.efecto === 'debito' ? dinamica.debita : dinamica.acredita, r.concepto, contexto, nombresDe(r.codigo, cuentaDe))
      : undefined

    return {
      ...r,
      nombre,
      clase,
      nombreClase: NOMBRE_CLASE[clase] ?? '',
      seLlama: comoSeLlama(r.codigo, cuenta ? [cuenta.nombre] : []),
      naturaleza,
      correctora,
      saldo,
      porQue,
      oficial: texto ? { texto, heredadaDe: dinamica?.heredadaDe } : undefined,
    }
  })

  const ecuacion: Record<string, EfectoBloque> = {}
  for (const clase of ['1', '2', '3', '4', '5', '6', '7']) {
    const deLaClase = pasos.filter((p) => p.clase === clase)
    const sube = deLaClase.some((p) => p.efecto === naturalezaPorClase(clase))
    const baja = deLaClase.some((p) => p.efecto !== naturalezaPorClase(clase))
    ecuacion[clase] = sube && baja ? 'cambia' : sube ? 'sube' : baja ? 'baja' : null
  }

  const conImportes = renglones.length > 0 && renglones.every((r) => typeof r.importe === 'number')
  const totales = conImportes
    ? {
        debito: renglones.filter((r) => r.efecto === 'debito').reduce((s, r) => s + (r.importe ?? 0), 0),
        credito: renglones.filter((r) => r.efecto === 'credito').reduce((s, r) => s + (r.importe ?? 0), 0),
      }
    : null

  return { pasos, ecuacion, resumen: resumir(pasos, ecuacion, totales), totales }
}

function resumir(pasos: PasoExplicado[], ecuacion: Record<string, EfectoBloque>, totales: Explicacion['totales']): string {
  const debitos = pasos.filter((p) => p.efecto === 'debito').length
  const creditos = pasos.length - debitos
  const cuantas = (n: number) => `${n} ${n === 1 ? 'cuenta' : 'cuentas'}`
  const partida = totales
    ? totales.debito === totales.credito
      ? `Partida doble: el debe suma ${pesos(totales.debito)} y el haber suma lo mismo.`
      : `El debe suma ${pesos(totales.debito)} y el haber ${pesos(totales.credito)}: así no cuadra, revisa los importes.`
    : `Partida doble: ${cuantas(debitos)} en el debe y ${cuantas(creditos)} en el haber, que suman el mismo valor.`

  const efectos = Object.entries(ecuacion)
    .filter(([, e]) => e)
    .map(([clase, e]) => `${BLOQUE[clase]} ${verbo(clase, e!)}`)
  if (efectos.length === 0) return partida
  const lista = efectos.length === 1 ? efectos[0] : `${efectos.slice(0, -1).join(', ')} y ${efectos.at(-1)}`
  return `${partida} En la ecuación contable, ${lista}, y la igualdad activo = pasivo + patrimonio se mantiene.`
}
