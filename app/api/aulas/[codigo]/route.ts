/**
 * GET  /api/aulas/{código}?v=N   estado según quien pregunta (clave en Authorization).
 *                                Si la versión sigue siendo N responde { sinCambios: true }.
 * POST /api/aulas/{código}       { accion, ... } — unirse sin clave; el resto con ella.
 */
import { leerCredencial } from '@/lib/aulasServidor'
import { ipDe, leerCuerpo, obtenerServicio, responderError, sinConfigurar } from '@/lib/aulasApi'
import { normalizarCodigo } from '@/lib/aulas'
import { sugerirNotaIA } from '@/lib/calificacionIA'
import { avisarCambioPublicas } from '@/lib/aulasPublicas'

/** La IA puede tardar: margen para la función de Vercel. */
export const maxDuration = 60

type Contexto = { params: Promise<{ codigo: string }> }

const sinCache = { 'Cache-Control': 'no-store' }

export async function GET(peticion: Request, { params }: Contexto) {
  const servicio = obtenerServicio()
  if (!servicio) return sinConfigurar()
  const codigo = normalizarCodigo((await params).codigo)
  try {
    const credencial = leerCredencial(peticion.headers.get('authorization'))
    const conocida = new URL(peticion.url).searchParams.get('v')
    if (conocida !== null) {
      const version = await servicio.version(codigo, credencial)
      if (version !== null && String(version) === conocida) {
        return Response.json({ sinCambios: true, version }, { headers: sinCache })
      }
    }
    return Response.json(await servicio.estado(codigo, credencial), { headers: sinCache })
  } catch (error) {
    return responderError(error)
  }
}

export async function POST(peticion: Request, { params }: Contexto) {
  const servicio = obtenerServicio()
  if (!servicio) return sinConfigurar()
  const codigo = normalizarCodigo((await params).codigo)
  const credencial = leerCredencial(peticion.headers.get('authorization'))
  try {
    const cuerpo = await leerCuerpo(peticion)
    const hecho = async () => {
      switch (cuerpo.accion) {
        case 'unirse':
          await servicio.limitar(`unirse:${ipDe(peticion)}`, 30, 10 * 60_000)
          return servicio.unirse(codigo, { nombre: cuerpo.nombre })
        case 'agregar': return servicio.agregar(codigo, credencial, { ejercicio: cuerpo.ejercicio, propio: cuerpo.propio })
        case 'quitar': return servicio.quitar(codigo, credencial, { ejercicio: cuerpo.ejercicio })
        case 'empezar': return servicio.empezar(codigo, credencial, { limiteMin: cuerpo.limiteMin })
        case 'sugerir': {
          // Beta: solo cuando el docente lo pide; la corrección local es la sugerencia por defecto.
          if (!process.env.GEMINI_API_KEY) return Response.json({ error: 'La IA no está configurada' }, { status: 503 })
          const { ejercicio, filas, enviada, guardada } = await servicio.entregaParaIA(codigo, credencial, {
            ejercicio: cuerpo.ejercicio, estudiante: cuerpo.estudiante,
          })
          if (guardada) return guardada
          await servicio.limitar(`ia:${ipDe(peticion)}`, 30, 60 * 60_000)
          try {
            const sugerencia = await sugerirNotaIA(ejercicio, filas)
            await servicio.guardarSugerenciaIA(codigo, { ejercicio: ejercicio.id, estudiante: String(cuerpo.estudiante), enviada, sugerencia })
            return sugerencia
          } catch (error) {
            const estado = (error as { estado?: number }).estado
            return Response.json(
              { error: estado === 429 ? 'Se agotó la cuota gratuita de la IA por ahora' : 'La IA no respondió; vuelve a intentarlo' },
              { status: estado === 429 ? 429 : 502 },
            )
          }
        }
        case 'entregar': return servicio.entregar(codigo, credencial, { respuestas: cuerpo.respuestas })
        case 'calificar':
          return servicio.calificar(codigo, credencial, {
            estudiante: cuerpo.estudiante, nota: cuerpo.nota, comentario: cuerpo.comentario, porEjercicio: cuerpo.porEjercicio,
          })
        case 'publicar': return servicio.publicarSolucion(codigo, credencial)
        case 'cerrar': return servicio.cerrar(codigo, credencial)
        case 'entrada': return servicio.cerrarEntrada(codigo, credencial, { cerrada: cuerpo.cerrada })
        case 'expulsar': return servicio.expulsar(codigo, credencial, { estudiante: cuerpo.estudiante })
        default: return undefined
      }
    }
    const resultado = await hecho()
    if (resultado instanceof Response) return resultado
    // La lista de públicas (en caché) cambia al cerrar o abrir la entrada, o cuando alguien se une.
    const accion = String(cuerpo.accion)
    if (accion === 'cerrar' || accion === 'entrada' || (accion === 'unirse' && (resultado as { aula?: { publica?: boolean } }).aula?.publica)) {
      avisarCambioPublicas()
    }
    if (resultado === undefined && !['quitar', 'empezar', 'publicar', 'cerrar', 'entrada', 'expulsar'].includes(String(cuerpo.accion))) {
      return Response.json({ error: 'Acción desconocida.' }, { status: 400 })
    }
    return Response.json(resultado ?? { ok: true }, { headers: sinCache })
  } catch (error) {
    return responderError(error)
  }
}
