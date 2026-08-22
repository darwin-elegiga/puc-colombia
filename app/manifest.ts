import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'PUC Colombia — Plan Único de Cuentas',
    short_name: 'PUC',
    description:
      'Catálogo del Plan Único de Cuentas colombiano: busca por código, por nombre o por movimiento contable. Funciona sin conexión.',
    id: '/',
    start_url: '/',
    scope: '/',
    display: 'standalone',
    orientation: 'any',
    background_color: '#fbfbfa',
    theme_color: '#fbfbfa',
    lang: 'es-CO',
    categories: ['education', 'productivity', 'finance'],
    icons: [
      { src: '/icono-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
      { src: '/icono-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
      { src: '/icono-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
  }
}
