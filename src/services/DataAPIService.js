/**
 * DataAPIService - CACHE ULTRA AGRESSIVO para carregamento instantâneo
 * - Cache HTTP de 30+ minutos para dados públicos
 * - Browser cache persistence
 * - Headers otimizados para performance máxima
 * - Preload de dados críticos
 */

class DataAPIService {
	constructor() {
		this.baseURL = `${process.env.REACT_APP_SUPABASE_URL}/rest/v1`;
		this.headers = {
			apikey: process.env.REACT_APP_SUPABASE_ANON_KEY,
			Authorization: `Bearer ${process.env.REACT_APP_SUPABASE_ANON_KEY}`,
			"Content-Type": "application/json",
			Prefer: "return=representation",
		};

		// Cache memory para responses
		this.memoryCache = new Map();
		this.cacheTimestamps = new Map();
	}

	/**
	 * Fetch wrapper com cache ULTRA agressivo
	 */
	async fetch(endpoint, options = {}) {
		const url = `${this.baseURL}${endpoint}`;
		const cacheKey = `${endpoint}-${JSON.stringify(options.headers || {})}`;

		// Verificar cache memory primeiro (mais rápido que HTTP)
		if (this.isMemoryCacheValid(cacheKey)) {
			return this.memoryCache.get(cacheKey);
		}

		const fetchOptions = {
			...options,
			headers: {
				...this.headers,
				...options.headers,
			},
			// Cache AGRESSIVO por padrão
			cache: options.cache || "force-cache",
		};

		try {
			const response = await fetch(url, fetchOptions);

			if (!response.ok) {
				const errorData = await response.json().catch(() => ({}));
				throw new Error(
					errorData.message || `HTTP ${response.status}: ${response.statusText}`
				);
			}

			const data = await response.json();

			// Armazenar em memory cache
			this.setMemoryCache(
				cacheKey,
				data,
				options.memoryCacheTTL || 30 * 60 * 1000
			); // 30min default

			return data;
		} catch (error) {
			console.error(`❌ DataAPI Error: ${endpoint}`, error);

			// Tentar retornar cache expirado em caso de erro
			if (this.memoryCache.has(cacheKey)) {
				console.warn(`⚠️ Retornando cache expirado para: ${endpoint}`);
				return this.memoryCache.get(cacheKey);
			}

			throw error;
		}
	}

	/**
	 * Memory cache helpers
	 */
	isMemoryCacheValid(key) {
		if (!this.memoryCache.has(key)) return false;
		const timestamp = this.cacheTimestamps.get(key);
		return timestamp && Date.now() - timestamp < 30 * 60 * 1000; // 30 min
	}

	setMemoryCache(key, data, ttl) {
		this.memoryCache.set(key, data);
		this.cacheTimestamps.set(key, Date.now());

		// Auto cleanup
		setTimeout(() => {
			this.memoryCache.delete(key);
			this.cacheTimestamps.delete(key);
		}, ttl);
	}

	/**
	 * Posts públicos - Cache ULTRA AGRESSIVO (30min+)
	 */
	async getAllPosts(bypassCache = false) {
		const endpoint = "/posts?select=*&published=eq.true&order=created_at.desc";

		return this.fetch(endpoint, {
			cache: bypassCache ? "no-cache" : "force-cache",
			headers: {
				"Cache-Control": bypassCache
					? "no-cache"
					: "public, max-age=1800, s-maxage=3600", // 30min cliente, 60min CDN
				Pragma: bypassCache ? "no-cache" : "cache",
				Expires: bypassCache
					? "0"
					: new Date(Date.now() + 30 * 60 * 1000).toUTCString(),
			},
			memoryCacheTTL: 30 * 60 * 1000, // 30min memory cache
		});
	}

	/**
	 * Posts em destaque - Cache ULTRA AGRESSIVO (45min)
	 */
	async getFeaturedPosts(bypassCache = false) {
		const endpoint =
			"/posts?select=*&published=eq.true&trending=eq.true&order=created_at.desc&limit=6";

		return this.fetch(endpoint, {
			cache: bypassCache ? "no-cache" : "force-cache",
			headers: {
				"Cache-Control": bypassCache
					? "no-cache"
					: "public, max-age=2700, s-maxage=3600, immutable", // 45min cliente, 60min CDN
				Pragma: bypassCache ? "no-cache" : "cache",
				Expires: bypassCache
					? "0"
					: new Date(Date.now() + 45 * 60 * 1000).toUTCString(),
			},
			memoryCacheTTL: 45 * 60 * 1000, // 45min memory cache
		});
	}

	/**
	 * Posts por categoria - Cache AGRESSIVO (20min)
	 */
	async getPostsByCategory(categoryId, bypassCache = false) {
		const endpoint = `/posts?select=*&published=eq.true&category=eq.${categoryId}&order=created_at.desc`;

		return this.fetch(endpoint, {
			cache: bypassCache ? "no-cache" : "force-cache",
			headers: {
				"Cache-Control": bypassCache
					? "no-cache"
					: "public, max-age=1200, s-maxage=1800", // 20min cliente, 30min CDN
				Pragma: bypassCache ? "no-cache" : "cache",
			},
			memoryCacheTTL: 20 * 60 * 1000, // 20min memory cache
		});
	}

	/**
	 * Post individual - Cache MUITO AGRESSIVO (60min)
	 */
	async getPostById(id, bypassCache = false) {
		const endpoint = `/posts?select=*&id=eq.${id}&published=eq.true&limit=1`;

		const data = await this.fetch(endpoint, {
			cache: bypassCache ? "no-cache" : "force-cache",
			headers: {
				"Cache-Control": bypassCache
					? "no-cache"
					: "public, max-age=3600, s-maxage=7200, immutable", // 60min cliente, 120min CDN
				Pragma: bypassCache ? "no-cache" : "cache",
				Expires: bypassCache
					? "0"
					: new Date(Date.now() + 60 * 60 * 1000).toUTCString(),
			},
			memoryCacheTTL: 60 * 60 * 1000, // 60min memory cache
		});

		if (!data || data.length === 0) {
			throw new Error("Post não encontrado");
		}

		return data[0];
	}

	/**
	 * Categorias - Cache ULTRA AGRESSIVO (2 horas)
	 */
	async getCategories(bypassCache = false) {
		const endpoint = "/categories?select=*&order=name";

		return this.fetch(endpoint, {
			cache: bypassCache ? "no-cache" : "force-cache",
			headers: {
				"Cache-Control": bypassCache
					? "no-cache"
					: "public, max-age=7200, s-maxage=10800, immutable", // 2h cliente, 3h CDN
				Pragma: bypassCache ? "no-cache" : "cache",
				Expires: bypassCache
					? "0"
					: new Date(Date.now() + 2 * 60 * 60 * 1000).toUTCString(),
			},
			memoryCacheTTL: 2 * 60 * 60 * 1000, // 2h memory cache
		});
	}

	/**
	 * Busca de posts - Cache curto (5min)
	 */
	async searchPosts(query) {
		if (!query || query.length < 2) return [];

		const endpoint = `/posts?select=*&published=eq.true&or=(title.ilike.*${encodeURIComponent(
			query
		)}*,excerpt.ilike.*${encodeURIComponent(
			query
		)}*,content.ilike.*${encodeURIComponent(
			query
		)}*,category_name.ilike.*${encodeURIComponent(
			query
		)}*,author.ilike.*${encodeURIComponent(
			query
		)}*)&order=created_at.desc&limit=20`;

		return this.fetch(endpoint, {
			cache: "default",
			headers: {
				"Cache-Control": "public, max-age=300", // 5min para busca
			},
			memoryCacheTTL: 5 * 60 * 1000,
		});
	}

	/**
	 * PRELOAD de dados críticos para carregamento instantâneo
	 */
	async preloadCriticalData() {
		try {
			// Preload em paralelo dos dados mais importantes
			const [featuredPosts, allPosts, categories] = await Promise.allSettled([
				this.getFeaturedPosts(),
				this.getAllPosts(),
				this.getCategories(),
			]);

			return {
				featuredPosts:
					featuredPosts.status === "fulfilled" ? featuredPosts.value : [],
				allPosts: allPosts.status === "fulfilled" ? allPosts.value : [],
				categories: categories.status === "fulfilled" ? categories.value : [],
				preloadTimestamp: Date.now(),
			};
		} catch (error) {
			console.warn("⚠️ Preload failed, will load on demand:", error);
			return null;
		}
	}

	/**
	 * Warmup cache - executar no app startup
	 */
	async warmupCache() {
		if (typeof window === "undefined") return; // SSR safety

		try {
			// Warmup silencioso em background
			setTimeout(async () => {
				await this.preloadCriticalData();
			}, 100);
		} catch (error) {
			console.warn("⚠️ Cache warmup failed:", error);
		}
	}

	/**
	 * Cache management otimizado
	 */
	clearMemoryCache() {
		this.memoryCache.clear();
		this.cacheTimestamps.clear();
	}

	getCacheStats() {
		return {
			memoryEntries: this.memoryCache.size,
			oldestEntry: Math.min(...Array.from(this.cacheTimestamps.values())),
			newestEntry: Math.max(...Array.from(this.cacheTimestamps.values())),
		};
	}

	/**
	 * Health check otimizado
	 */
	async healthCheck() {
		try {
			const start = Date.now();
			await this.fetch("/posts?select=count&limit=1", {
				cache: "no-cache",
				headers: { "Cache-Control": "no-cache" },
			});
			const duration = Date.now() - start;

			return {
				status: "healthy",
				responseTime: duration,
				timestamp: new Date().toISOString(),
				cacheStats: this.getCacheStats(),
			};
		} catch (error) {
			return {
				status: "unhealthy",
				error: error.message,
				timestamp: new Date().toISOString(),
			};
		}
	}

	/**
	 * Invalidação seletiva para admin
	 */
	async invalidateCache(endpoint) {
		// Invalidar memory cache
		const keysToDelete = Array.from(this.memoryCache.keys()).filter((key) =>
			key.includes(endpoint)
		);

		keysToDelete.forEach((key) => {
			this.memoryCache.delete(key);
			this.cacheTimestamps.delete(key);
		});

		// Força nova requisição para invalidar HTTP cache
		try {
			const url = `${this.baseURL}${endpoint}`;
			await fetch(url, {
				method: "HEAD",
				headers: {
					...this.headers,
					"Cache-Control": "no-cache, no-store, must-revalidate",
					Pragma: "no-cache",
					Expires: "0",
				},
			});
		} catch (error) {
			console.warn("Cache invalidation failed:", error);
		}
	}
}

// Singleton instance
export const dataAPIService = new DataAPIService();

// Auto warmup on module load
if (typeof window !== "undefined") {
	dataAPIService.warmupCache();
}
