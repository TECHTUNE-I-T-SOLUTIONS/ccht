const CACHE_NAME = 'ccht-portal-v1'
const STATIC_ASSETS = ['/', '/login', '/admissions', '/programs']

// Routes that must NEVER be served from cache or have their responses cached,
// because they carry auth tokens / session state that must be fresh every time.
const NEVER_CACHE_PATTERNS = [
  /^\/auth\//, // /auth/callback, /auth/confirm — token exchange
  /^\/reset-password/, // /reset-password/confirm — password change
  /^\/forgot-password/, // /forgot-password — initiates reset
  /^\/login/, // login page (may carry redirect tokens)
  /^\/secure\//, // secure admin area
  /^\/api\//, // API routes
]

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS)),
  )
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.map((key) => (key === CACHE_NAME ? null : caches.delete(key)))),
    ),
  )
  self.clients.claim()
})

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url)

  // Only handle same-origin GET requests.
  if (event.request.method !== 'GET' || url.origin !== self.location.origin) return

  // Never intercept auth / reset / api routes — let them go straight to the
  // network. Caching these would serve stale tokens and break password reset.
  if (NEVER_CACHE_PATTERNS.some((re) => re.test(url.pathname))) {
    return // fall through to the browser's default handling
  }

  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) return cached

      return fetch(event.request)
        .then((response) => {
          const responseClone = response.clone()
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, responseClone))
          return response
        })
        .catch(() => caches.match('/'))
    }),
  )
})