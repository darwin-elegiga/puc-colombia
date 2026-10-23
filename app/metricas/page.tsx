import type { Metadata } from 'next'
import PanelMetricas from '@/components/PanelMetricas'

export const metadata: Metadata = {
  title: 'Métricas — PUC Colombia',
  robots: { index: false, follow: false },
}

export default function PaginaMetricas() {
  return <PanelMetricas />
}
