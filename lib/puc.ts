/**
 * Reglas del Plan Único de Cuentas colombiano (Decreto 2650 de 1993).
 * Funciones puras: no tocan almacenamiento ni React.
 */
import type { Naturaleza, Nivel, Cuenta, BorradorCuenta, Lectura, Segmento } from './tipos'

/** Longitud del código → nivel jerárquico. 7 dígitos o más son auxiliares definidos por cada empresa. */
export const CORTES = [1, 2, 4, 6] as const

export const NIVELES: Record<number, { nivel: Nivel; etiqueta: string }> = {
  1: { nivel: 'clase', etiqueta: 'Clase' },
  2: { nivel: 'grupo', etiqueta: 'Grupo' },
  4: { nivel: 'cuenta', etiqueta: 'Cuenta' },
  6: { nivel: 'subcuenta', etiqueta: 'Subcuenta' },
}

export const ETIQUETA_NIVEL: Record<Nivel, string> = {
  clase: 'Clase',
  grupo: 'Grupo',
  cuenta: 'Cuenta',
  subcuenta: 'Subcuenta',
  auxiliar: 'Auxiliar',
}

/** Naturaleza que corresponde a cada clase: 1, 5, 6, 7 y 8 son débito; 2, 3, 4 y 9 son crédito. */
export const NATURALEZA_POR_CLASE: Record<string, Naturaleza> = {
  '1': 'debito', '2': 'credito', '3': 'credito', '4': 'credito', '5': 'debito',
  '6': 'debito', '7': 'debito', '8': 'debito', '9': 'credito',
}

export const ESTADO_FINANCIERO: Record<string, string> = {
  '1': 'Estado de situación financiera (Balance)',
  '2': 'Estado de situación financiera (Balance)',
  '3': 'Estado de situación financiera (Balance)',
  '4': 'Estado de resultados',
  '5': 'Estado de resultados',
  '6': 'Estado de resultados',
  '7': 'Costos de producción — se trasladan a inventarios o al costo de ventas',
  '8': 'Cuentas de orden — se revelan en notas',
  '9': 'Cuentas de orden — se revelan en notas',
}

export const COLOR_CLASE: Record<string, string> = {
  '1': '#2563eb', '2': '#dc2626', '3': '#7c3aed', '4': '#059669', '5': '#ea580c',
  '6': '#0891b2', '7': '#c026d3', '8': '#64748b', '9': '#475569',
}

export function nivelDe(codigo: string): Nivel | null {
  if (NIVELES[codigo.length]) return NIVELES[codigo.length].nivel
  return codigo.length >= 7 ? 'auxiliar' : null
}

/** Longitud del código padre. null si el código es una clase. */
export function longitudPadre(codigo: string): number | null {
  const l = codigo.length
  if (l === 1) return null
  if (l === 2) return 1
  if (l === 4) return 2
  if (l === 6) return 4
  if (l >= 7) return 6
  return null
}

export function codigoPadre(codigo: string): string | null {
  const lp = longitudPadre(codigo)
  return lp === null ? null : codigo.slice(0, lp)
}

/** Códigos de todos los ancestros, de la clase hacia abajo. */
export function codigosAncestros(codigo: string): string[] {
  return CORTES.filter((n) => n < codigo.length).map((n) => codigo.slice(0, n))
}

export const naturalezaPorClase = (codigo: string): Naturaleza | null =>
  NATURALEZA_POR_CLASE[codigo[0]] ?? null

export const normalizar = (texto: unknown): string =>
  String(texto ?? '').normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase().trim()

/**
 * Lee un código dígito a dígito y explica qué significa cada tramo.
 * Funciona con códigos que no están en el catálogo, incluidos los auxiliares.
 */
export function decodificar(codigo: string, buscar: (c: string) => Cuenta | undefined): Lectura {
  const cod = String(codigo ?? '').trim()
  const cortes = CORTES.filter((n) => n <= cod.length)

  const segmentos: Segmento[] = cortes.map((n, i) => {
    const parcial = cod.slice(0, n)
    const cuenta = buscar(parcial)
    const inicio = i === 0 ? 0 : cortes[i - 1]
    return {
      codigo: parcial,
      digitos: parcial.slice(inicio),
      nivel: NIVELES[n].nivel,
      etiqueta: NIVELES[n].etiqueta,
      nombre: cuenta?.nombre ?? null,
      existe: Boolean(cuenta),
    }
  })

  if (cod.length > 6) {
    segmentos.push({
      codigo: cod,
      digitos: cod.slice(6),
      nivel: 'auxiliar',
      etiqueta: 'Auxiliar',
      nombre: buscar(cod)?.nombre ?? null,
      existe: Boolean(buscar(cod)),
      libre: true,
    })
  } else if (cod.length && !NIVELES[cod.length]) {
    // Longitudes como 3 o 5 dígitos no corresponden a ningún nivel: se muestran los
    // dígitos que sobran para que se vea dónde está el error.
    const ultimoCorte = cortes.length ? cortes[cortes.length - 1] : 0
    segmentos.push({
      codigo: cod,
      digitos: cod.slice(ultimoCorte),
      nivel: 'auxiliar',
      etiqueta: 'Dígitos sobrantes',
      nombre: null,
      existe: false,
      incompleto: true,
    })
  }

  return {
    codigo: cod,
    nivel: nivelDe(cod),
    naturaleza: naturalezaPorClase(cod),
    estadoFinanciero: ESTADO_FINANCIERO[cod[0]] ?? null,
    registrada: Boolean(buscar(cod)),
    longitudValida: Boolean(nivelDe(cod)),
    segmentos,
  }
}

export interface ResultadoValidacion {
  ok: boolean
  campo?: 'codigo' | 'nombre' | 'naturaleza'
  mensaje?: string
  cuenta?: Cuenta
}

/**
 * Valida un borrador antes de incorporarlo al catálogo: formato del código,
 * unicidad y existencia de la cuenta superior.
 */
export function validarBorrador(
  borrador: BorradorCuenta,
  existe: (c: string) => boolean,
): ResultadoValidacion {
  const codigo = String(borrador.codigo ?? '').trim()
  const nombre = String(borrador.nombre ?? '').trim()

  if (!codigo) return { ok: false, campo: 'codigo', mensaje: 'El código es obligatorio.' }
  if (!/^\d+$/.test(codigo)) return { ok: false, campo: 'codigo', mensaje: 'El código solo puede contener dígitos.' }
  if (codigo.length > 10) return { ok: false, campo: 'codigo', mensaje: 'El código no puede superar 10 dígitos.' }

  const nivel = nivelDe(codigo)
  if (!nivel) {
    return {
      ok: false,
      campo: 'codigo',
      mensaje: 'Longitud inválida. Usa 1 dígito (clase), 2 (grupo), 4 (cuenta), 6 (subcuenta) o 7 y más (auxiliar).',
    }
  }
  if (!NATURALEZA_POR_CLASE[codigo[0]]) {
    return { ok: false, campo: 'codigo', mensaje: 'El primer dígito debe ser una clase del 1 al 9.' }
  }
  if (existe(codigo)) {
    return { ok: false, campo: 'codigo', mensaje: `El código ${codigo} ya existe en el catálogo.` }
  }

  const padre = codigoPadre(codigo)
  if (padre && !existe(padre)) {
    return {
      ok: false,
      campo: 'codigo',
      mensaje: `Falta la cuenta superior ${padre}. Créala antes de registrar ${codigo}.`,
    }
  }
  if (!nombre) return { ok: false, campo: 'nombre', mensaje: 'El nombre es obligatorio.' }
  if (nombre.length > 200) return { ok: false, campo: 'nombre', mensaje: 'El nombre no puede superar 200 caracteres.' }

  const forzada = borrador.naturaleza || ''
  if (forzada && forzada !== 'debito' && forzada !== 'credito') {
    return { ok: false, campo: 'naturaleza', mensaje: 'La naturaleza debe ser débito o crédito.' }
  }
  const naturaleza = (forzada || NATURALEZA_POR_CLASE[codigo[0]]) as Naturaleza

  return {
    ok: true,
    cuenta: {
      codigo,
      nombre,
      nivel,
      naturaleza,
      naturalezaForzada: Boolean(forzada) && forzada !== NATURALEZA_POR_CLASE[codigo[0]],
      descripcion: String(borrador.descripcion ?? '').trim(),
      origen: 'personalizada',
    },
  }
}

/* ─────────────────────────────── CSV ─────────────────────────────── */

export function aCSV(cuentas: Cuenta[]): string {
  const escapar = (v: unknown) => `"${String(v ?? '').replace(/"/g, '""')}"`
  const lineas = ['codigo,nombre,nivel,naturaleza,origen,descripcion']
  for (const c of cuentas) {
    lineas.push([c.codigo, c.nombre, c.nivel, c.naturaleza, c.origen, c.descripcion].map(escapar).join(','))
  }
  return lineas.join('\n') + '\n'
}

function partirLinea(linea: string): string[] {
  const campos: string[] = []
  let actual = ''
  let entreComillas = false
  for (let i = 0; i < linea.length; i++) {
    const ch = linea[i]
    if (ch === '"') {
      if (entreComillas && linea[i + 1] === '"') { actual += '"'; i++ }
      else entreComillas = !entreComillas
    } else if ((ch === ',' || ch === ';') && !entreComillas) {
      campos.push(actual); actual = ''
    } else actual += ch
  }
  campos.push(actual)
  return campos.map((c) => c.trim())
}

/** Convierte un CSV en borradores. Detecta el encabezado y acepta coma o punto y coma. */
export function desdeCSV(texto: string): BorradorCuenta[] {
  const lineas = String(texto).split(/\r?\n/).filter((l) => l.trim())
  if (!lineas.length) return []

  const primera = partirLinea(lineas[0]).map(normalizar)
  const tieneEncabezado = ['codigo', 'cuenta', 'code'].includes(primera[0])
  const columnas = tieneEncabezado ? primera : ['codigo', 'nombre', 'descripcion', 'naturaleza']

  return lineas.slice(tieneEncabezado ? 1 : 0).map((linea) => {
    const campos = partirLinea(linea)
    const fila: Record<string, string> = {}
    columnas.forEach((col, i) => { fila[col] = campos[i] ?? '' })
    const naturaleza = normalizar(fila.naturaleza)
    return {
      codigo: fila.codigo ?? '',
      nombre: fila.nombre ?? '',
      descripcion: fila.descripcion ?? '',
      naturaleza: naturaleza === 'debito' || naturaleza === 'credito' ? naturaleza : '',
    }
  })
}
