import type { Metadata, Viewport } from 'next'
import { Geist, Geist_Mono, Instrument_Serif } from 'next/font/google'
import './globals.css'
import RegistroServiceWorker from '@/components/RegistroServiceWorker'

const geistSans = Geist({ variable: '--font-geist-sans', subsets: ['latin'] })
const geistMono = Geist_Mono({ variable: '--font-geist-mono', subsets: ['latin'] })
const editorial = Instrument_Serif({
  variable: '--font-editorial',
  subsets: ['latin'],
  weight: '400',
})

export const metadata: Metadata = {
  title: 'PUC Colombia — Plan Único de Cuentas',
  description:
    'Consulta el Plan Único de Cuentas colombiano por clase, grupo, cuenta y subcuenta. Busca por código, por nombre o por el movimiento que necesitas registrar. Funciona sin conexión.',
  applicationName: 'PUC Colombia',
  appleWebApp: { capable: true, title: 'PUC', statusBarStyle: 'default' },
  formatDetection: { telephone: false },
  icons: {
    icon: [
      { url: '/icono-192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icono-512.png', sizes: '512x512', type: 'image/png' },
    ],
    apple: [{ url: '/icono-180.png', sizes: '180x180', type: 'image/png' }],
  },
}

export const viewport: Viewport = {
  themeColor: '#fbfbfa',
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
}

export default function RootLayout({ children }: LayoutProps<'/'>) {
  return (
    <html
      lang="es"
      className={`${geistSans.variable} ${geistMono.variable} ${editorial.variable} h-full antialiased`}
    >
      {/*
        Las extensiones del navegador añaden atributos a <body> antes de que React
        hidrate (ColorZilla, gestores de contraseñas...). No es un fallo de la
        aplicación, así que se silencia el aviso solo en este elemento.
      */}
      <body className="min-h-full flex flex-col" suppressHydrationWarning>
        {children}
        <RegistroServiceWorker />
      </body>
    </html>
  )
}
