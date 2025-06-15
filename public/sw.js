const CACHE_VERSION = "torque-forged-v1.3";
const STATIC_CACHE = `${CACHE_VERSION}-static`;
const API_CACHE = `${CACHE_VERSION}-api`;
const IMAGE_CACHE = `${CACHE_VERSION}-images`;

// RECURSOS SEGUROS - só recursos que existem mesmo
const SAFE_CRITICAL_RESOURCES = ["/", "/manifest.json"];

// Estratégias de cache por tipo
const CACHE_STRATEGIES = {
	CACHE_FIRST: [
		/\.(js|css|woff2?|ttf|eot|ico|png|jpg|jpeg|gif|svg|webp)$/,
		/\/static\//,
		/supabase\.co.*\.(js|css)$/,
	],
	NETWORK_FIRST: [/\/api\//, /supabase\.co\/rest\//, /supabase\.co\/storage\//],
	NETWORK_ONLY: [/\/auth\//, /\/admin\//, /google-analytics/, /gtag/],
	STALE_WHILE_REVALIDATE: [/\/posts/, /\/categories/, /images\.unsplash\.com/],
};

// Instalação segura do Service Worker
self.addEventListener("install", (event) => {
	event.waitUntil(
		(async () => {
			try {
				const cache = await caches.open(STATIC_CACHE);

				// Cache apenas recursos que existem
				const validResources = [];

				for (const resource of SAFE_CRITICAL_RESOURCES) {
					try {
						const response = await fetch(resource, { method: "HEAD" });
						if (response.ok) {
							validResources.push(resource);
						}
					} catch (error) {
						console.warn(`⚠️ Resource ${resource} not available, skipping`);
					}
				}

				if (validResources.length > 0) {
					await cache.addAll(validResources);
				}

				// Skip waiting para ativação imediata
				return self.skipWaiting();
			} catch (error) {
				console.error(
					"🔧 ServiceWorker: Installation error (non-critical)",
					error
				);
				// Não falhar a instalação por causa de cache
				return self.skipWaiting();
			}
		})()
	);
});

// Ativação otimizada
self.addEventListener("activate", (event) => {
	event.waitUntil(
		Promise.all([
			// Limpar caches antigos
			caches.keys().then((cacheNames) => {
				return Promise.all(
					cacheNames
						.filter((cacheName) => !cacheName.startsWith(CACHE_VERSION))
						.map((cacheName) => {
							return caches.delete(cacheName);
						})
				);
			}),
			// Tomar controle imediato
			self.clients.claim(),
		]).then(() => {})
	);
});

// Interceptação inteligente de requests
self.addEventListener("fetch", (event) => {
	const { request } = event;

	// Ignorar requests problemáticos
	if (shouldIgnoreRequest(request)) {
		return;
	}

	const strategy = getStrategy(request.url);

	event.respondWith(handleRequestSafely(request, strategy));
});

// Verificar se deve ignorar request
function shouldIgnoreRequest(request) {
	const url = new URL(request.url);

	// Ignorar non-GET
	if (request.method !== "GET") return true;

	// Ignorar protocolos não-HTTP
	if (!url.protocol.startsWith("http")) return true;

	// Ignorar network-only
	return CACHE_STRATEGIES.NETWORK_ONLY.some((pattern) =>
		pattern.test(request.url)
	);
}

// Determinar estratégia
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
	return "network-first";
}

// Handler seguro para requests
async function handleRequestSafely(request, strategy) {
	try {
		switch (strategy) {
			case "cache-first":
				return await handleCacheFirst(request);
			case "network-first":
				return await handleNetworkFirst(request);
			case "stale-while-revalidate":
				return await handleStaleWhileRevalidate(request);
			default:
				return await handleNetworkFirst(request);
		}
	} catch (error) {
		console.warn("🔧 ServiceWorker: Request failed", request.url, error);
		return handleFallback(request);
	}
}

// Cache First - para recursos estáticos
async function handleCacheFirst(request) {
	try {
		const cache = await caches.open(getCache(request));
		const cached = await cache.match(request);

		if (cached) {
			return cached;
		}

		const response = await fetch(request);

		if (response.ok && response.status < 400) {
			// Clone antes de cachear
			cache.put(request, response.clone()).catch(() => {
				// Ignorar erros de cache não críticos
			});
		}

		return response;
	} catch (error) {
		// Tentar cache mesmo se network falhar
		const cache = await caches.open(getCache(request));
		const cached = await cache.match(request);

		if (cached) {
			return cached;
		}

		throw error;
	}
}

// Network First - para dados dinâmicos
async function handleNetworkFirst(request) {
	const cache = await caches.open(getCache(request));

	try {
		const response = await fetch(request);

		if (response.ok && response.status < 400) {
			// Cache response válidos
			cache.put(request, response.clone()).catch(() => {
				// Ignorar erros de cache
			});
		}

		return response;
	} catch (error) {
		// Fallback para cache se network falhar
		const cached = await cache.match(request);

		if (cached) {
			return cached;
		}

		throw error;
	}
}

// Stale While Revalidate - para dados que podem ser atualizados
async function handleStaleWhileRevalidate(request) {
	const cache = await caches.open(getCache(request));
	const cached = await cache.match(request);

	// Atualizar em background (não esperar)
	const fetchPromise = fetch(request)
		.then((response) => {
			if (response.ok && response.status < 400) {
				cache.put(request, response.clone()).catch(() => {
					// Ignorar erros de cache
				});
			}
			return response;
		})
		.catch(() => {
			// Ignorar erros de network em background
		});

	// Retornar cache imediatamente ou aguardar network
	return cached || fetchPromise;
}

// Determinar cache apropriado
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

// Fallbacks seguros
async function handleFallback(request) {
	const url = new URL(request.url);

	// Fallback para documentos HTML
	if (
		request.destination === "document" ||
		request.headers.get("accept")?.includes("text/html")
	) {
		try {
			const cache = await caches.open(STATIC_CACHE);
			const indexResponse = await cache.match("/");

			if (indexResponse) {
				return indexResponse;
			}
		} catch (error) {
			// Ignorar erro de cache
		}

		// Fallback HTML mínimo
		return new Response(
			`<!DOCTYPE html>
			<html>
			<head>
				<title>Torque Forged Motorsport</title>
				<meta charset="utf-8">
				<meta name="viewport" content="width=device-width, initial-scale=1">
				<style>
					body { font-family: Arial, sans-serif; text-align: center; padding: 50px; background: #000; color: #fff; }
					.logo { color: #dc2626; font-size: 24px; font-weight: bold; margin-bottom: 20px; }
				</style>
			</head>
			<body>
				<div class="logo">TORQUE FORGED MOTORSPORT</div>
				<p>Conectando... Por favor, verifique sua conexão de internet.</p>
				<button onclick="window.location.reload()">Tentar Novamente</button>
			</body>
			</html>`,
			{
				status: 503,
				statusText: "Service Unavailable",
				headers: { "Content-Type": "text/html" },
			}
		);
	}

	// Fallback para imagens
	if (request.destination === "image") {
		return new Response(
			'<svg xmlns="http://www.w3.org/2000/svg" width="400" height="300" viewBox="0 0 400 300"><rect width="400" height="300" fill="#1f2937"/><text x="200" y="150" text-anchor="middle" font-family="Arial" font-size="16" fill="#9ca3af">Imagem indisponível</text></svg>',
			{
				status: 503,
				headers: { "Content-Type": "image/svg+xml" },
			}
		);
	}

	// Para outros recursos
	return new Response("Recurso indisponível", {
		status: 503,
		statusText: "Service Unavailable",
	});
}

// Limpeza automática de cache
function cleanupCache() {
	caches.keys().then((cacheNames) => {
		cacheNames.forEach(async (cacheName) => {
			if (cacheName.includes("images")) {
				try {
					const cache = await caches.open(cacheName);
					const requests = await cache.keys();

					// Limitar cache de imagens a 100 itens
					if (requests.length > 100) {
						const toDelete = requests.slice(0, requests.length - 100);
						toDelete.forEach((request) => {
							cache.delete(request).catch(() => {
								// Ignorar erros de limpeza
							});
						});
					}
				} catch (error) {
					// Ignorar erros de limpeza
				}
			}
		});
	});
}

// Limpeza a cada 30 minutos
setInterval(cleanupCache, 30 * 60 * 1000);

// Mensagens do cliente
self.addEventListener("message", (event) => {
	if (event.data && event.data.type) {
		switch (event.data.type) {
			case "SKIP_WAITING":
				self.skipWaiting();
				break;

			case "CACHE_URLS":
				const { urls } = event.data;
				if (urls && Array.isArray(urls)) {
					caches.open(STATIC_CACHE).then((cache) => {
						// Cache apenas URLs válidas
						const validUrls = urls.filter(
							(url) => url && typeof url === "string"
						);
						if (validUrls.length > 0) {
							cache.addAll(validUrls).catch((error) => {
								console.warn("Cache addAll failed (non-critical):", error);
							});
						}
					});
				}
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
						if (event.ports[0]) {
							event.ports[0].postMessage({ success: true });
						}
					})
					.catch(() => {
						if (event.ports[0]) {
							event.ports[0].postMessage({ success: false });
						}
					});
				break;
		}
	}
});
