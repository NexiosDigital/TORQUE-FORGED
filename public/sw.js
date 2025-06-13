// public/sw.js
// Service Worker Ultra-Otimizado para Torque Forged
// - Cache estratégico por tipo de conteúdo
// - Stale-while-revalidate para posts
// - Cache-first para assets estáticos
// - Network-first para APIs críticas

const CACHE_NAME = "torque-forged-v2.0";
const STATIC_CACHE = "torque-forged-static-v2.0";
const DYNAMIC_CACHE = "torque-forged-dynamic-v2.0";
const API_CACHE = "torque-forged-api-v2.0";

// Assets para cache imediato
const STATIC_ASSETS = [
	"/",
	"/static/css/main.css",
	"/static/js/main.js",
	"/manifest.json",
	"/favicon.ico",
	// Fontes críticas
	"https://fonts.googleapis.com/css2?family=Inter:wght@100;200;300;400;500;600;700;800;900&display=swap",
];

// Estratégias de cache por padrão de URL
const CACHE_STRATEGIES = {
	// Posts do blog - stale-while-revalidate
	posts: {
		pattern: /\/api\/posts/,
		strategy: "stale-while-revalidate",
		cache: API_CACHE,
		maxAge: 5 * 60 * 1000, // 5 minutos
	},
	// Assets estáticos - cache-first
	static: {
		pattern: /\.(js|css|png|jpg|jpeg|gif|svg|woff2|woff|ttf|ico)$/,
		strategy: "cache-first",
		cache: STATIC_CACHE,
		maxAge: 24 * 60 * 60 * 1000, // 24 horas
	},
	// APIs críticas - network-first
	auth: {
		pattern: /\/auth\//,
		strategy: "network-first",
		cache: API_CACHE,
		maxAge: 2 * 60 * 1000, // 2 minutos
	},
	// Imagens - cache-first com fallback
	images: {
		pattern: /images\.unsplash\.com|\.(?:png|jpg|jpeg|gif|webp)$/,
		strategy: "cache-first",
		cache: DYNAMIC_CACHE,
		maxAge: 7 * 24 * 60 * 60 * 1000, // 7 dias
	},
};

// Install event - cache assets críticos
self.addEventListener("install", (event) => {
	event.waitUntil(
		caches
			.open(STATIC_CACHE)
			.then((cache) => {
				return cache.addAll(STATIC_ASSETS);
			})
			.then(() => {
				return self.skipWaiting();
			})
			.catch((error) => {
				console.error("❌ Failed to cache static assets:", error);
			})
	);
});

// Activate event - limpar caches antigos
self.addEventListener("activate", (event) => {
	event.waitUntil(
		caches
			.keys()
			.then((cacheNames) => {
				const deletePromises = cacheNames
					.filter((cacheName) => {
						// Manter apenas caches da versão atual
						return (
							cacheName.startsWith("torque-forged-") &&
							!cacheName.includes("v2.0")
						);
					})
					.map((cacheName) => {
						return caches.delete(cacheName);
					});

				return Promise.all(deletePromises);
			})
			.then(() => {
				return self.clients.claim();
			})
	);
});

// Fetch event - aplicar estratégias de cache
self.addEventListener("fetch", (event) => {
	const { request } = event;
	const url = new URL(request.url);

	// Ignorar requests não-GET
	if (request.method !== "GET") return;

	// Ignorar requests para outros domínios (exceto assets conhecidos)
	if (url.origin !== location.origin && !isAllowedExternalDomain(url.origin)) {
		return;
	}

	// Encontrar estratégia apropriada
	const strategy = findCacheStrategy(url);

	if (strategy) {
		event.respondWith(executeStrategy(request, strategy));
	}
});

// Determinar estratégia de cache para uma URL
function findCacheStrategy(url) {
	const pathname = url.pathname;
	const fullUrl = url.href;

	// Verificar cada estratégia
	for (const [name, config] of Object.entries(CACHE_STRATEGIES)) {
		if (config.pattern.test(pathname) || config.pattern.test(fullUrl)) {
			return { name, ...config };
		}
	}

	// Estratégia padrão para HTML pages
	if (
		pathname.endsWith("/") ||
		pathname.endsWith(".html") ||
		!pathname.includes(".")
	) {
		return {
			name: "html",
			strategy: "network-first",
			cache: DYNAMIC_CACHE,
			maxAge: 5 * 60 * 1000,
		};
	}

	return null;
}

// Executar estratégia de cache
async function executeStrategy(request, strategy) {
	try {
		switch (strategy.strategy) {
			case "cache-first":
				return await cacheFirst(request, strategy);
			case "network-first":
				return await networkFirst(request, strategy);
			case "stale-while-revalidate":
				return await staleWhileRevalidate(request, strategy);
			default:
				return await fetch(request);
		}
	} catch (error) {
		console.error(`❌ Strategy ${strategy.name} failed:`, error);
		return await handleStrategyError(request, strategy, error);
	}
}

// Cache-first strategy
async function cacheFirst(request, strategy) {
	const cache = await caches.open(strategy.cache);
	const cachedResponse = await cache.match(request);

	if (cachedResponse && !isExpired(cachedResponse, strategy.maxAge)) {
		return cachedResponse;
	}

	const networkResponse = await fetch(request);

	if (networkResponse.ok) {
		const responseToCache = networkResponse.clone();
		await cache.put(request, responseToCache);
	}

	return networkResponse;
}

// Network-first strategy
async function networkFirst(request, strategy) {
	const cache = await caches.open(strategy.cache);

	try {
		const networkResponse = await fetch(request);

		if (networkResponse.ok) {
			const responseToCache = networkResponse.clone();
			await cache.put(request, responseToCache);
		}

		return networkResponse;
	} catch (error) {
		const cachedResponse = await cache.match(request);

		if (cachedResponse) {
			return cachedResponse;
		}

		throw error;
	}
}

// Stale-while-revalidate strategy
async function staleWhileRevalidate(request, strategy) {
	const cache = await caches.open(strategy.cache);
	const cachedResponse = await cache.match(request);

	// Sempre tentar fetch em background
	const fetchPromise = fetch(request)
		.then((networkResponse) => {
			if (networkResponse.ok) {
				const responseToCache = networkResponse.clone();
				cache.put(request, responseToCache);
			}
			return networkResponse;
		})
		.catch((error) => {});

	// Retornar cache se disponível, senão esperar network
	if (cachedResponse) {
		return cachedResponse;
	}

	return await fetchPromise;
}

// Verificar se response está expirado
function isExpired(response, maxAge) {
	if (!maxAge) return false;

	const responseTime = response.headers.get("sw-cache-time");
	if (!responseTime) return false;

	return Date.now() - parseInt(responseTime) > maxAge;
}

// Adicionar timestamp ao response para controle de expiração
function addCacheTimestamp(response) {
	const responseClone = response.clone();
	responseClone.headers.set("sw-cache-time", Date.now().toString());
	return responseClone;
}

// Handle errors em estratégias
async function handleStrategyError(request, strategy, error) {
	console.error(`❌ Strategy error for ${request.url}:`, error);

	// Tentar cache como fallback
	const cache = await caches.open(strategy.cache);
	const cachedResponse = await cache.match(request);

	if (cachedResponse) {
		return cachedResponse;
	}

	// Se for request de página HTML, retornar página offline
	if (request.mode === "navigate") {
		return await getOfflinePage();
	}

	throw error;
}

// Página offline de fallback
async function getOfflinePage() {
	return new Response(
		`
    <!DOCTYPE html>
    <html lang="pt-BR">
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1">
      <title>Offline - Torque Forged</title>
      <style>
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          background: linear-gradient(135deg, #000000 0%, #1f2937 50%, #000000 100%);
          color: #ffffff;
          margin: 0;
          padding: 0;
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .container {
          text-align: center;
          padding: 2rem;
          max-width: 400px;
        }
        .icon {
          width: 80px;
          height: 80px;
          background: linear-gradient(45deg, #dc2626, #ef4444);
          border-radius: 16px;
          margin: 0 auto 2rem;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 2rem;
        }
        h1 { margin-bottom: 1rem; color: #dc2626; }
        p { color: #9ca3af; line-height: 1.6; margin-bottom: 2rem; }
        button {
          background: linear-gradient(45deg, #dc2626, #ef4444);
          color: white;
          border: none;
          padding: 12px 24px;
          border-radius: 8px;
          cursor: pointer;
          font-weight: 600;
        }
        button:hover { opacity: 0.9; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="icon">🏁</div>
        <h1>Você está offline</h1>
        <p>Não foi possível conectar ao Torque Forged. Verifique sua conexão e tente novamente.</p>
        <button onclick="window.location.reload()">Tentar Novamente</button>
      </div>
    </body>
    </html>
  `,
		{
			headers: {
				"Content-Type": "text/html",
				"Cache-Control": "no-cache",
			},
		}
	);
}

// Verificar se domínio externo é permitido
function isAllowedExternalDomain(origin) {
	const allowedDomains = [
		"https://fonts.googleapis.com",
		"https://fonts.gstatic.com",
		"https://images.unsplash.com",
		"https://api.supabase.co",
	];

	return allowedDomains.some((domain) => origin.startsWith(domain));
}

// Message handler para comunicação com app
self.addEventListener("message", (event) => {
	const { type, payload } = event.data;

	switch (type) {
		case "SKIP_WAITING":
			self.skipWaiting();
			break;

		case "CLEAR_CACHE":
			clearAllCaches();
			break;

		case "GET_CACHE_STATS":
			getCacheStats().then((stats) => {
				event.ports[0].postMessage({ type: "CACHE_STATS", payload: stats });
			});
			break;

		default:
	}
});

// Limpar todos os caches
async function clearAllCaches() {
	const cacheNames = await caches.keys();
	const deletePromises = cacheNames
		.filter((name) => name.startsWith("torque-forged-"))
		.map((name) => caches.delete(name));

	await Promise.all(deletePromises);
}

// Obter estatísticas de cache
async function getCacheStats() {
	const stats = {};
	const cacheNames = await caches.keys();

	for (const cacheName of cacheNames) {
		if (cacheName.startsWith("torque-forged-")) {
			const cache = await caches.open(cacheName);
			const keys = await cache.keys();
			stats[cacheName] = keys.length;
		}
	}

	return stats;
}

// Periodic cleanup (executado quando SW fica idle)
self.addEventListener("periodicsync", (event) => {
	if (event.tag === "cache-cleanup") {
		event.waitUntil(performCacheCleanup());
	}
});

// Limpeza periódica de cache
async function performCacheCleanup() {
	// Limpar entradas expiradas
	const cacheNames = await caches.keys();

	for (const cacheName of cacheNames) {
		if (!cacheName.startsWith("torque-forged-")) continue;

		const cache = await caches.open(cacheName);
		const requests = await cache.keys();

		for (const request of requests) {
			const response = await cache.match(request);
			if (response && isExpired(response, 24 * 60 * 60 * 1000)) {
				// 24h max
				await cache.delete(request);
			}
		}
	}
}
