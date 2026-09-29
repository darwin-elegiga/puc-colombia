'use client'

import { useEffect, useRef, useState } from 'react'
import type { Catalogo } from '@/lib/catalogo'
import { nombreLegible } from '@/lib/puc'
import { conRenglonLibre, sumas, type Estado, type Fila } from '@/lib/practica'
import SelectorCuenta from './SelectorCuenta'
import { IconoLupa } from './Iconos'

/**
 * La hoja del asiento, como una hoja de cálculo: Código, Cuenta o concepto, Debe y Haber.
 *
 * Pensada primero para el móvil: cuatro columnas estrechas, teclado numérico en el
 * código y los importes, y «Siguiente» en el teclado para pasar de celda en celda
 * (código → debe → haber → renglón siguiente). El nombre de la cuenta aparece solo al
 * escribir el código; tocarlo abre el buscador del catálogo. Siempre queda un renglón
 * libre al final, y el pie suma cada columna y dice si el asiento cuadra.
 */

/*
  En el móvil, tres columnas: el nombre de la cuenta va bajo el código para que el debe
  y el haber tengan ancho para importes como 10.000.000 (los campos van a 16px para que
  Safari no amplíe la página). Desde sm, las cuatro columnas de siempre.
*/
const COLUMNAS = 'grid grid-cols-[minmax(0,1fr)_7rem_7rem] sm:grid-cols-[5.5rem_minmax(0,1fr)_8.5rem_8.5rem]'

type Celda = 'codigo' | 'debe' | 'haber'
const ORDEN: Celda[] = ['codigo', 'debe', 'haber']

export const pesos = (n: number) => `$${n.toLocaleString('es-CO')}`

const ESTADO: Record<Estado, { texto: string; bien: boolean }> = {
  ok: { texto: 'Correcto', bien: true },
  importe: { texto: 'Revisa el valor', bien: false },
  columna: { texto: 'Va en la otra columna', bien: false },
  cuenta: { texto: 'Otra cuenta', bien: false },
  sobra: { texto: 'Sobra', bien: false },
}

export default function HojaAsiento({
  filas,
  onCambiar,
  catalogo,
  estados,
  bloqueada = false,
  sinCuadre = false,
}: {
  filas: Fila[]
  onCambiar: (filas: Fila[]) => void
  catalogo: Catalogo
  /** Resultado de la corrección, uno por fila. */
  estados?: (Estado | null)[]
  /** Solo lectura: para mostrar la solución. */
  bloqueada?: boolean
  /** Sin el aviso de si cuadra: en un quiz no se le da la pista al estudiante mientras lo hace. */
  sinCuadre?: boolean
}) {
  const celdas = useRef(new Map<string, HTMLInputElement>())
  const [buscando, setBuscando] = useState<number | null>(null)
  /** Renglón cuya celda del debe recibe el foco cuando se cierre el buscador. */
  const alCerrar = useRef<number | null>(null)

  // El diálogo, al cerrarse en su propio efecto, devuelve el foco a la celda de la cuenta;
  // este efecto corre justo después y lo lleva al debe, que es lo siguiente por escribir.
  useEffect(() => {
    if (buscando !== null || alCerrar.current === null) return
    celdas.current.get(`${alCerrar.current}:debe`)?.focus()
    alCerrar.current = null
  }, [buscando])
  const total = sumas(filas)
  // Una subcuenta sola dice poco («Compras»): se antepone su cuenta («Retención en la fuente · Compras»).
  const nombreDe = (codigo: string) => {
    const cuenta = catalogo.indice.get(codigo)
    if (!cuenta) return ''
    const madre = codigo.length > 4 ? catalogo.indice.get(codigo.slice(0, 4)) : undefined
    return madre ? `${nombreLegible(madre.nombre)} · ${nombreLegible(cuenta.nombre)}` : nombreLegible(cuenta.nombre)
  }
  const hayAlgo = total.debe > 0 || total.haber > 0

  const enfocar = (fila: number, celda: Celda) => {
    const destino = celdas.current.get(`${fila}:${celda}`)
    if (destino) return destino.focus()
    // La celda aún no existe (el renglón libre se añade al escribir): aparece en el siguiente pintado.
    requestAnimationFrame(() => celdas.current.get(`${fila}:${celda}`)?.focus())
  }

  const cambiar = (i: number, cambios: Partial<Fila>) =>
    onCambiar(conRenglonLibre(filas.map((f, k) => (k === i ? { ...f, ...cambios } : f))))

  const alPulsar = (i: number, celda: Celda) => (e: React.KeyboardEvent<HTMLInputElement>) => {
    const columna = ORDEN.indexOf(celda)
    if (e.key === 'Enter') {
      e.preventDefault()
      if (columna < ORDEN.length - 1) enfocar(i, ORDEN[columna + 1])
      else enfocar(i + 1, 'codigo')
    } else if (e.key === 'ArrowDown') {
      e.preventDefault()
      enfocar(Math.min(i + 1, filas.length - 1), celda)
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      enfocar(Math.max(i - 1, 0), celda)
    }
  }

  const importe = (texto: string) => {
    const digitos = texto.replace(/\D/g, '').slice(0, 13)
    // Un 0 no es un importe: se trata como celda vacía (y así se ve), no como un renglón inválido.
    return digitos && Number(digitos) > 0 ? Number(digitos) : null
  }

  const registrar = (i: number, celda: Celda) => (el: HTMLInputElement | null) => {
    const clave = `${i}:${celda}`
    if (el) celdas.current.set(clave, el)
    else celdas.current.delete(clave)
  }

  const claseCelda =
    'h-11 w-full min-w-0 bg-transparent px-2 text-[14px] text-tinta outline-none placeholder:text-borde-fuerte focus:bg-superficie focus:shadow-[inset_0_0_0_2px_var(--color-tinta)] disabled:text-tinta sm:h-11'

  return (
    <div className="overflow-hidden rounded-xl border border-borde bg-superficie">
      {/* Encabezado de columnas */}
      <div className={`${COLUMNAS} border-b border-borde bg-hueso text-[10.5px] uppercase tracking-[0.06em] text-tinta-tenue`}>
        <span className="truncate border-r border-borde px-2 py-2 sm:hidden">Código · cuenta</span>
        <span className="hidden border-r border-borde px-2 py-2 sm:block">Código</span>
        <span className="hidden truncate border-r border-borde px-2 py-2 sm:block">Cuenta o concepto</span>
        <span className="border-r border-borde px-2 py-2 text-right">Debe</span>
        <span className="px-2 py-2 text-right">Haber</span>
      </div>

      {filas.map((fila, i) => {
        const cuenta = fila.codigo ? catalogo.indice.get(fila.codigo) : undefined
        const estado = estados?.[i] ? ESTADO[estados[i]!] : null
        return (
          <div
            key={i}
            className={`${COLUMNAS} border-b border-borde`}
            style={
              estado
                ? {
                    background: estado.bien ? 'var(--color-sube)' : 'var(--color-baja)',
                    boxShadow: `inset 3px 0 0 ${estado.bien ? 'var(--color-sube-tinta)' : 'var(--color-baja-tinta)'}`,
                  }
                : undefined
            }
          >
            <div className="flex min-w-0 flex-col border-r border-borde sm:contents">
              <input
                ref={registrar(i, 'codigo')}
                value={fila.codigo}
                onChange={(e) => cambiar(i, { codigo: e.target.value.replace(/\D/g, '').slice(0, 10) })}
                onKeyDown={alPulsar(i, 'codigo')}
                disabled={bloqueada}
                inputMode="numeric"
                enterKeyHint="next"
                autoComplete="off"
                aria-label={`Código del renglón ${i + 1}`}
                placeholder="—"
                className={`${claseCelda} tabular sm:border-r sm:border-borde`}
              />

              <button
                type="button"
                onClick={() => setBuscando(i)}
                disabled={bloqueada}
                aria-label={cuenta ? `Cuenta ${nombreLegible(cuenta.nombre)}; cambiarla` : `Buscar la cuenta del renglón ${i + 1}`}
                className="flex min-w-0 flex-col justify-center px-2 pb-1.5 text-left disabled:cursor-default sm:min-h-11 sm:border-r sm:border-borde sm:py-1"
              >
                {cuenta ? (
                  <span className="line-clamp-2 text-[12px] leading-tight text-tinta-suave sm:text-[12.5px] sm:text-tinta">
                    {nombreDe(fila.codigo)}
                  </span>
                ) : fila.codigo ? (
                  <span className="text-[12px] leading-tight" style={{ color: 'var(--color-baja-tinta)' }}>No existe</span>
                ) : (
                  !bloqueada && (
                    <span className="flex items-center gap-1 text-[12px] text-borde-fuerte">
                      <IconoLupa className="size-3.5" />
                      Buscar
                    </span>
                  )
                )}
                {estado && (
                  <span
                    className="mt-0.5 text-[10.5px] font-medium leading-tight"
                    style={{ color: estado.bien ? 'var(--color-sube-tinta)' : 'var(--color-baja-tinta)' }}
                  >
                    {estado.texto}
                  </span>
                )}
              </button>
            </div>

            {(['debe', 'haber'] as const).map((columna) => (
              <input
                key={columna}
                ref={registrar(i, columna)}
                value={fila[columna] ? fila[columna]!.toLocaleString('es-CO') : ''}
                // Un renglón va en una sola columna: escribir en una vacía la otra.
                onChange={(e) =>
                  cambiar(i, columna === 'debe' ? { debe: importe(e.target.value), haber: null } : { haber: importe(e.target.value), debe: null })
                }
                onKeyDown={alPulsar(i, columna)}
                disabled={bloqueada}
                inputMode="numeric"
                enterKeyHint="next"
                autoComplete="off"
                aria-label={`${columna === 'debe' ? 'Debe' : 'Haber'} del renglón ${i + 1}`}
                // Llena el alto del renglón, que en el móvil crece con el nombre bajo el código.
                className={`${claseCelda} tabular h-auto min-h-11 self-stretch text-right ${columna === 'debe' ? 'border-r border-borde' : ''}`}
              />
            ))}
          </div>
        )
      })}

      {/* Sumas y cuadre */}
      <div className={`${COLUMNAS} bg-hueso text-[13px]`}>
        <span className="border-r border-borde px-2 py-2.5 text-[10.5px] uppercase tracking-[0.06em] text-tinta-tenue sm:col-span-2">
          Sumas
        </span>
        <span className="tabular truncate border-r border-borde px-2 py-2.5 text-right font-medium text-tinta">
          {total.debe.toLocaleString('es-CO')}
        </span>
        <span className="tabular truncate px-2 py-2.5 text-right font-medium text-tinta">{total.haber.toLocaleString('es-CO')}</span>
      </div>
      {hayAlgo && !sinCuadre && (
        <p
          className="border-t border-borde px-3 py-2 text-[12.5px] font-medium"
          style={{
            background: total.cuadra ? 'var(--color-sube)' : 'var(--color-baja)',
            color: total.cuadra ? 'var(--color-sube-tinta)' : 'var(--color-baja-tinta)',
          }}
        >
          {total.cuadra
            ? '✓ Cuadra: el debe y el haber suman lo mismo'
            : `No cuadra: falta ${pesos(Math.abs(total.diferencia))} en el ${total.diferencia > 0 ? 'haber' : 'debe'}`}
        </p>
      )}

      {!bloqueada && (
        <SelectorCuenta
          abierto={buscando !== null}
          catalogo={catalogo}
          elegida={buscando === null ? null : filas[buscando]?.codigo || null}
          onElegir={(codigo) => {
            if (buscando !== null) {
              cambiar(buscando, { codigo })
              alCerrar.current = buscando
            }
            setBuscando(null)
          }}
          onCerrar={() => setBuscando(null)}
        />
      )}
    </div>
  )
}
