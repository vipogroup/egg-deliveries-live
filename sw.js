const CACHE = 'egg-shell-2'

self.addEventListener('install', () => {
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((key) => key !== CACHE).map((key) => caches.delete(key))))
      .then(() => self.clients.claim()),
  )
})

function sameOrigin(url) {
  return url.origin === self.location.origin
}

function asset(url) {
  return /\.(?:js|css|woff2?|png|webmanifest)$/.test(url.pathname)
}

function shell(request, url) {
  return request.mode === 'navigate' || url.pathname.endsWith('/') || url.pathname.endsWith('.html')
}

async function networkFirst(request) {
  const cache = await caches.open(CACHE)
  try {
    const response = await fetch(request)
    if (response.ok) cache.put(request, response.clone())
    return response
  } catch {
    const hit = await cache.match(request)
    if (hit) return hit
    return Response.error()
  }
}

async function cacheFirst(request) {
  const cache = await caches.open(CACHE)
  const hit = await cache.match(request)
  if (hit) return hit
  const response = await fetch(request)
  if (response.ok) cache.put(request, response.clone())
  return response
}

self.addEventListener('fetch', (event) => {
  const request = event.request
  if (request.method !== 'GET') return
  const url = new URL(request.url)
  if (!sameOrigin(url) || url.pathname.endsWith('.json') || url.pathname.endsWith('/sw.js')) return
  if (shell(request, url)) {
    event.respondWith(networkFirst(request))
    return
  }
  if (asset(url)) event.respondWith(cacheFirst(request))
})
