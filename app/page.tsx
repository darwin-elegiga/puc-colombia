import Explorador from '@/components/Explorador'
import AvisoAulas from '@/components/AvisoAulas'

export default function Pagina() {
  return (
    <>
      <Explorador />
      {/* La burbuja del aula activa (o la invitación a una pública) sobre todas las pantallas del catálogo. */}
      <AvisoAulas />
    </>
  )
}
