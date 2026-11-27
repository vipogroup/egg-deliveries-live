const CACHE = 'egg-shell-1'

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

async function fromCache(request) {
  const cache = await caches.open(CACHE)
  const hit = await cache.match(request)
  const fresh = fetch(request)
    .then((response) => {
      if (response.ok) cache.put(request, response.clone())
      return response
    })
    .catch(() => hit)
  return hit || fresh
}

self.addEventListener('fetch', (event) => {
  const request = event.request
  if (request.method !== 'GET') return
  const url = new URL(request.url)
  if (!sameOrigin(url) || url.pathname.endsWith('.json')) return
  if (request.mode === 'navigate' || asset(url) || url.pathname.endsWith('/') || url.pathname.endsWith('.html')) {
    event.respondWith(fromCache(request))
  }
})
