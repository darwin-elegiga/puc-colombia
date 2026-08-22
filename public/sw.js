/*
  Service worker del catálogo PUC.

  El catálogo oficial y los movimientos van empaquetados en el JavaScript de la
  aplicación, así que basta con cachear el documento y los recursos estáticos para
  que todo funcione sin conexión. Las cuentas propias viven en localStorage.
*/
const VERSION = 'puc-v1'
const CACHE_APP = `${VERSION}-app`
const ESENCIALES = ['/', '/manifest.webmanifest', '/icono-192.png', '/icono-512.png']

self.addEventListener('install', (evento) => {
  evento.waitUntil(
    caches
      .open(CACHE_APP)
      .then((cache) => cache.addAll(ESENCIALES))
      .catch(() => undefined) // una descarga fallida no debe impedir la instalación
      .then(() => self.skipWaiting()),
  )
})

self.addEventListener('activate', (evento) => {
  evento.waitUntil(
    caches
      .keys()
      .then((claves) => Promise.all(claves.filter((c) => !c.startsWith(VERSION)).map((c) => caches.delete(c))))
      .then(() => self.clients.claim()),
  )
})

/** Recursos con hash en el nombre: no cambian nunca, se sirven desde caché. */
const esInmutable = (url) => url.pathname.startsWith('/_next/static/')

self.addEventListener('fetch', (evento) => {
  const peticion = evento.request
  if (peticion.method !== 'GET') return

  const url = new URL(peticion.url)
  if (url.origin !== self.location.origin) return

  // Documentos: red primero para recibir actualizaciones, caché si no hay señal.
  if (peticion.mode === 'navigate') {
    evento.respondWith(
      fetch(peticion)
        .then((respuesta) => {
          const copia = respuesta.clone()
          caches.open(CACHE_APP).then((cache) => cache.put('/', copia))
          return respuesta
        })
        .catch(async () => (await caches.match(peticion)) ?? (await caches.match('/')) ?? Response.error()),
    )
    return
  }

  if (esInmutable(url)) {
    evento.respondWith(
      caches.match(peticion).then(
        (enCache) =>
          enCache ??
          fetch(peticion).then((respuesta) => {
            const copia = respuesta.clone()
            caches.open(CACHE_APP).then((cache) => cache.put(peticion, copia))
            return respuesta
          }),
      ),
    )
    return
  }

  // Resto de recursos propios: se sirve lo cacheado y se refresca en segundo plano.
  evento.respondWith(
    caches.match(peticion).then((enCache) => {
      const desdeRed = fetch(peticion)
        .then((respuesta) => {
          if (respuesta.ok) {
            const copia = respuesta.clone()
            caches.open(CACHE_APP).then((cache) => cache.put(peticion, copia))
          }
          return respuesta
        })
        .catch(() => enCache ?? Response.error())
      return enCache ?? desdeRed
    }),
  )
})
