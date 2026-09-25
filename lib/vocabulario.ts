/**
 * Vocabulario del buscador reunido en un solo sitio: los alias y sinónimos base
 * (data/sinonimos.ts) más los ampliados por clase (data/vocabulario/).
 */
import { ALIAS_CUENTAS, GRUPOS_SINONIMOS } from '@/data/sinonimos'
import { ALIAS_CLASE_1, GRUPOS_CLASE_1, PRUEBAS_CLASE_1 } from '@/data/vocabulario/clase-1'
import { ALIAS_CLASES_2_3, GRUPOS_CLASES_2_3, PRUEBAS_CLASES_2_3 } from '@/data/vocabulario/clases-2-3'
import { ALIAS_CLASES_4_5, GRUPOS_CLASES_4_5, PRUEBAS_CLASES_4_5 } from '@/data/vocabulario/clases-4-5'
import { ALIAS_CLASES_6_9, GRUPOS_CLASES_6_9, PRUEBAS_CLASES_6_9 } from '@/data/vocabulario/clases-6-9-general'

const ALIAS = new Map<string, string[]>()
for (const fuente of [ALIAS_CUENTAS, ALIAS_CLASE_1, ALIAS_CLASES_2_3, ALIAS_CLASES_4_5, ALIAS_CLASES_6_9]) {
  for (const [codigo, alias] of Object.entries(fuente)) {
    ALIAS.set(codigo, [...new Set([...(ALIAS.get(codigo) ?? []), ...alias])])
  }
}

/** Formas coloquiales de nombrar lo que registra una cuenta. */
export const aliasDe = (codigo: string): string[] => ALIAS.get(codigo) ?? []

/** Códigos que tienen alias, para las pruebas. */
export const codigosConAlias = () => [...ALIAS.keys()]

/** Grupos de sinónimos de palabra suelta: los base y los de cada clase. */
export const GRUPOS: string[][] = [
  ...GRUPOS_SINONIMOS,
  ...GRUPOS_CLASE_1,
  ...GRUPOS_CLASES_2_3,
  ...GRUPOS_CLASES_4_5,
  ...GRUPOS_CLASES_6_9,
]

/** Consultas reales con la cuenta que deben encontrar entre las primeras (se usan en las pruebas). */
export const PRUEBAS_VOCABULARIO: Record<string, string> = {
  ...PRUEBAS_CLASE_1,
  ...PRUEBAS_CLASES_2_3,
  ...PRUEBAS_CLASES_4_5,
  ...PRUEBAS_CLASES_6_9,
}
