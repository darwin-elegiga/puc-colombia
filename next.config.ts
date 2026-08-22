import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  /**
   * Next bloquea los recursos del servidor de desarrollo cuando la petición llega
   * desde un origen distinto a localhost. Al probar desde el teléfono la app se
   * abre por la IP de la red local, así que hay que permitir los rangos privados
   * o la recarga en caliente no conecta.
   *
   * Solo afecta a `next dev`: en producción no tiene ningún efecto.
   */
  allowedDevOrigins: ['192.168.*.*', '10.*.*.*', '172.16.*.*', '*.local'],

  async headers() {
    return [
      {
        /*
          El service worker no debe quedarse cacheado: si el navegador sirve una
          copia vieja, la aplicación se queda anclada a una versión anterior y las
          actualizaciones no llegan nunca.
        */
        source: '/sw.js',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=0, must-revalidate' },
          { key: 'Service-Worker-Allowed', value: '/' },
        ],
      },
    ]
  },
}

export default nextConfig
