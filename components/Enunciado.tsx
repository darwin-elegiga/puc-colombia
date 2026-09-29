import type { Dato } from '@/lib/practica'
import { pesos } from './HojaAsiento'

/**
 * El enunciado de un ejercicio de asiento: el texto, o —en los generados desde una
 * operación— la tabla de datos con importes y tarifas. Lo usan la práctica y las aulas.
 */
export default function Enunciado({
  grupo,
  titulo,
  enunciado,
  datos,
  enTarjeta = false,
}: {
  grupo: string
  titulo: string
  enunciado: string
  datos: Dato[]
  /** Dentro de una tarjeta (el tablero del docente): con margen propio y un título más contenido. */
  enTarjeta?: boolean
}) {
  // Un ejercicio propio sin título toma el comienzo del enunciado (tituloDe): no se repite el
  // mismo texto. Solo entonces: el título es el enunciado entero o su comienzo con «…».
  const repetido =
    datos.length === 0 && (titulo === enunciado || (titulo.endsWith('…') && enunciado.startsWith(titulo.slice(0, -1))))
  return (
    <div className={enTarjeta ? 'px-4 py-4' : 'px-2 sm:px-0'}>
      <p className="rotulo">{grupo}</p>
      {!repetido && (
        <h1
          className={
            enTarjeta
              ? 'mt-1.5 text-[18px] font-medium leading-snug text-tinta'
              : 'editorial mt-2 text-[26px] leading-tight text-tinta lg:text-4xl'
          }
        >
          {titulo}
        </h1>
      )}

      {datos.length === 0 ? (
        <p
          className={[
            'leading-relaxed text-pretty',
            repetido ? 'mt-2 text-[16px] text-tinta' : 'mt-3 text-[15px] text-tinta-suave',
            enTarjeta && !repetido ? 'mt-2' : '',
          ].join(' ')}
        >
          {enunciado}
        </p>
      ) : (
        <section className="mt-4">
          <p className="rotulo mb-2">Datos</p>
          <dl className="overflow-hidden rounded-xl border border-borde bg-superficie">
            {datos.map((d) => (
              <div key={d.texto} className="flex items-baseline justify-between gap-3 border-b border-borde px-3.5 py-2.5 last:border-b-0">
                <dt className="min-w-0 text-[13.5px] leading-snug text-tinta-suave">{d.texto}</dt>
                <dd className={`shrink-0 text-right text-[13.5px] font-medium text-tinta ${d.importe !== undefined ? 'tabular' : ''}`}>
                  {d.importe !== undefined ? pesos(d.importe) : d.etiqueta}
                </dd>
              </div>
            ))}
          </dl>
          <p className="mt-2 text-[13px] leading-relaxed text-tinta-tenue">
            Calcula los valores que faltan y registra el asiento completo.
          </p>
        </section>
      )}
    </div>
  )
}
