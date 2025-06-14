/**
 * Service Worker para Torque Forged Motorsport
 * - Cache agressivo para carregamento instantâneo
 * - Estratégias otimizadas por tipo de recurso
 * - Fallbacks inteligentes
 * - Limpeza automática de cache antigo
 *
 * NOTA: Este arquivo deve ser colocado na pasta public/ como sw.js
 */

const CACHE_VERSION = "torque-forged-v1.2";
const STATIC_CACHE = `${CACHE_VERSION}-static`;
const API_CACHE = `${CACHE_VERSION}-api`;
const IMAGE_CACHE = `${CACHE_VERSION}-images`;

// Recursos críticos para cache imediato
const CRITICAL_RESOURCES = [
	"/",
	"/static/js/bundle.js",
	"/static/css/main.css",
	"/manifest.json",
];

// Padrões de URLs para diferentes estratégias de cache
const CACHE_STRATEGIES = {
	// Cache primeiro, fallback para network
	CACHE_FIRST: [
		/\.(js|css|woff2?|ttf|eot|ico|png|jpg|jpeg|gif|svg|webp)$/,
		/\/static\//,
	],

	// Network primeiro, fallback para cache
	NETWORK_FIRST: [/\/api\//, /supabase\.co/],

	// Sempre network, sem cache
	NETWORK_ONLY: [/\/auth\//, /\/admin\//, /google-analytics/],

	// Stale while revalidate
	STALE_WHILE_REVALIDATE: [/\/posts/, /\/categories/, /images\.unsplash\.com/],
};

// Instalação do Service Worker
self.addEventListener("install", (event) => {
	console.log("🔧 ServiceWorker: Installing...");

	event.waitUntil(
		caches
			.open(STATIC_CACHE)
			.then((cache) => {
				console.log("🔧 ServiceWorker: Caching critical resources");
				return cache.addAll(CRITICAL_RESOURCES);
			})
			.then(() => {
				console.log("🔧 ServiceWorker: Installation complete");
				return self.skipWaiting(); // Força ativação imediata
			})
			.catch((error) => {
				console.error("🔧 ServiceWorker: Installation failed", error);
			})
	);
});

// Ativação do Service Worker
self.addEventListener("activate", (event) => {
	console.log("🔧 ServiceWorker: Activating...");

	event.waitUntil(
		Promise.all([
			// Limpar caches antigos
			caches.keys().then((cacheNames) => {
				return Promise.all(
					cacheNames
						.filter((cacheName) => {
							return !cacheName.startsWith(CACHE_VERSION);
						})
						.map((cacheName) => {
							console.log("🗑️ ServiceWorker: Deleting old cache", cacheName);
							return caches.delete(cacheName);
						})
				);
			}),

			// Tomar controle de todas as abas
			self.clients.claim(),
		]).then(() => {
			console.log("🔧 ServiceWorker: Activation complete");
		})
	);
});

// Interceptação de requests
self.addEventListener("fetch", (event) => {
	const { request } = event;
	const url = new URL(request.url);

	// Ignorar requests que não devem ser cacheados
	if (shouldIgnoreRequest(request)) {
		return;
	}

	// Determinar estratégia baseada na URL
	const strategy = getStrategy(request.url);

	event.respondWith(
		handleRequest(request, strategy).catch((error) => {
			console.warn("🔧 ServiceWorker: Request failed", request.url, error);
			return handleFallback(request);
		})
	);
});

// Determinar se request deve ser ignorado
function shouldIgnoreRequest(request) {
	const url = new URL(request.url);

	// Ignorar requests não-GET
	if (request.method !== "GET") {
		return true;
	}

	// Ignorar chrome-extension e outros protocolos
	if (!url.protocol.startsWith("http")) {
		return true;
	}

	// Ignorar requests para network-only resources
	return CACHE_STRATEGIES.NETWORK_ONLY.some((pattern) =>
		pattern.test(request.url)
	);
}

// Determinar estratégia de cache baseada na URL
function getStrategy(url) {
	if (CACHE_STRATEGIES.CACHE_FIRST.some((pattern) => pattern.test(url))) {
		return "cache-first";
	}

	if (CACHE_STRATEGIES.NETWORK_FIRST.some((pattern) => pattern.test(url))) {
		return "network-first";
	}

	if (
		CACHE_STRATEGIES.STALE_WHILE_REVALIDATE.some((pattern) => pattern.test(url))
	) {
		return "stale-while-revalidate";
	}

	// Default para navegação
	return "network-first";
}

// Manipular request baseado na estratégia
async function handleRequest(request, strategy) {
	switch (strategy) {
		case "cache-first":
			return handleCacheFirst(request);

		case "network-first":
			return handleNetworkFirst(request);

		case "stale-while-revalidate":
			return handleStaleWhileRevalidate(request);

		default:
			return handleNetworkFirst(request);
	}
}

// Estratégia: Cache First
async function handleCacheFirst(request) {
	const cache = await caches.open(getCache(request));
	const cached = await cache.match(request);

	if (cached) {
		return cached;
	}

	const response = await fetch(request);

	if (response.ok) {
		cache.put(request, response.clone());
	}

	return response;
}

// Estratégia: Network First
async function handleNetworkFirst(request) {
	const cache = await caches.open(getCache(request));

	try {
		const response = await fetch(request);

		if (response.ok) {
			cache.put(request, response.clone());
		}

		return response;
	} catch (error) {
		const cached = await cache.match(request);

		if (cached) {
			return cached;
		}

		throw error;
	}
}

// Estratégia: Stale While Revalidate
async function handleStaleWhileRevalidate(request) {
	const cache = await caches.open(getCache(request));
	const cached = await cache.match(request);

	// Atualizar cache em background
	const fetchPromise = fetch(request).then((response) => {
		if (response.ok) {
			cache.put(request, response.clone());
		}
		return response;
	});

	// Retornar cached imediatamente ou aguardar network
	return cached || fetchPromise;
}

// Determinar qual cache usar
function getCache(request) {
	const url = request.url;

	if (
		/\.(png|jpg|jpeg|gif|svg|webp|ico)$/.test(url) ||
		url.includes("images.unsplash.com")
	) {
		return IMAGE_CACHE;
	}

	if (url.includes("supabase.co") || url.includes("/api/")) {
		return API_CACHE;
	}

	return STATIC_CACHE;
}

// Fallback para requests que falharam
async function handleFallback(request) {
	const url = new URL(request.url);

	// Fallback para páginas HTML
	if (request.destination === "document") {
		const cache = await caches.open(STATIC_CACHE);
		return cache.match("/") || new Response("Offline", { status: 503 });
	}

	// Fallback para imagens
	if (request.destination === "image") {
		return new Response(
			'<svg xmlns="http://www.w3.org/2000/svg" width="200" height="150" viewBox="0 0 200 150"><rect width="200" height="150" fill="#f3f4f6"/><text x="100" y="75" text-anchor="middle" font-family="Arial" font-size="14" fill="#6b7280">Imagem indisponível</text></svg>',
			{ headers: { "Content-Type": "image/svg+xml" } }
		);
	}

	// Para outros tipos, retornar erro
	return new Response("Recurso indisponível offline", {
		status: 503,
		statusText: "Service Unavailable",
	});
}

// Limpeza periódica de cache
function cleanupCache() {
	caches.keys().then((cacheNames) => {
		cacheNames.forEach(async (cacheName) => {
			if (cacheName.includes("images")) {
				const cache = await caches.open(cacheName);
				const requests = await cache.keys();

				// Limitar cache de imagens a 50 itens
				if (requests.length > 50) {
					const toDelete = requests.slice(0, requests.length - 50);
					toDelete.forEach((request) => cache.delete(request));
				}
			}
		});
	});
}

// Executar limpeza a cada 24 horas
setInterval(cleanupCache, 24 * 60 * 60 * 1000);

// Mensagens do cliente
self.addEventListener("message", (event) => {
	if (event.data && event.data.type) {
		switch (event.data.type) {
			case "SKIP_WAITING":
				self.skipWaiting();
				break;

			case "CACHE_URLS":
				const { urls } = event.data;
				caches.open(STATIC_CACHE).then((cache) => {
					cache.addAll(urls);
				});
				break;

			case "CLEAR_CACHE":
				caches
					.keys()
					.then((cacheNames) => {
						return Promise.all(
							cacheNames.map((cacheName) => caches.delete(cacheName))
						);
					})
					.then(() => {
						event.ports[0].postMessage({ success: true });
					});
				break;

			case "GET_CACHE_SIZE":
				getCacheSize().then((size) => {
					event.ports[0].postMessage({ size });
				});
				break;
		}
	}
});

// Utilitário para obter tamanho do cache
async function getCacheSize() {
	const cacheNames = await caches.keys();
	let totalSize = 0;

	for (const cacheName of cacheNames) {
		const cache = await caches.open(cacheName);
		const requests = await cache.keys();

		for (const request of requests) {
			const response = await cache.match(request);
			if (response) {
				const blob = await response.blob();
				totalSize += blob.size;
			}
		}
	}

	return totalSize;
}

console.log("🔧 ServiceWorker: Script loaded and ready");
