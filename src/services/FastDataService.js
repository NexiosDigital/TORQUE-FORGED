import { supabase } from "../lib/supabase";

/**
 * FastDataService Ultra-Otimizado
 * - Usa funções SQL otimizadas
 * - Cache hierárquico (memória → localStorage → fallback)
 * - Timeouts agressivos para performance
 * - Queries paralelas onde possível
 */

// Cache multi-layer ultra-rápido
class UltraFastCache {
	constructor() {
		this.memoryCache = new Map();
		this.memoryTTL = new Map();
		this.maxMemoryItems = 50;
		this.defaultTTL = {
			memory: 2 * 60 * 1000, // 2 minutos
			localStorage: 10 * 60 * 1000, // 10 minutos
		};
	}

	// Memória (mais rápido)
	setMemory(key, data, ttl = this.defaultTTL.memory) {
		if (this.memoryCache.size >= this.maxMemoryItems) {
			const firstKey = this.memoryCache.keys().next().value;
			this.memoryCache.delete(firstKey);
			this.memoryTTL.delete(firstKey);
		}

		this.memoryCache.set(key, data);
		this.memoryTTL.set(key, Date.now() + ttl);
	}

	getMemory(key) {
		if (!this.memoryCache.has(key)) return null;

		const ttl = this.memoryTTL.get(key);
		if (Date.now() > ttl) {
			this.memoryCache.delete(key);
			this.memoryTTL.delete(key);
			return null;
		}

		return this.memoryCache.get(key);
	}

	// localStorage (persistente)
	setLocal(key, data, ttl = this.defaultTTL.localStorage) {
		try {
			const item = {
				data,
				expires: Date.now() + ttl,
				version: "2.0", // Para invalidar cache antigo
			};
			localStorage.setItem(`tf_cache_${key}`, JSON.stringify(item));
		} catch (e) {
			// localStorage cheio, limpar expirados
			this.clearExpiredLocal();
		}
	}

	getLocal(key) {
		try {
			const item = localStorage.getItem(`tf_cache_${key}`);
			if (!item) return null;

			const parsed = JSON.parse(item);
			if (Date.now() > parsed.expires || parsed.version !== "2.0") {
				localStorage.removeItem(`tf_cache_${key}`);
				return null;
			}

			return parsed.data;
		} catch (e) {
			return null;
		}
	}

	clearExpiredLocal() {
		const keys = Object.keys(localStorage);
		keys.forEach((key) => {
			if (key.startsWith("tf_cache_")) {
				try {
					const item = JSON.parse(localStorage.getItem(key));
					if (Date.now() > item.expires) {
						localStorage.removeItem(key);
					}
				} catch (e) {
					localStorage.removeItem(key);
				}
			}
		});
	}

	get(key) {
		// 1. Tentar memória primeiro
		const memoryData = this.getMemory(key);
		if (memoryData) return memoryData;

		// 2. Tentar localStorage
		const localData = this.getLocal(key);
		if (localData) {
			// Promover para memória
			this.setMemory(key, localData);
			return localData;
		}

		return null;
	}

	set(key, data, ttl) {
		this.setMemory(key, data, ttl);
		this.setLocal(key, data, ttl);
	}

	clear() {
		this.memoryCache.clear();
		this.memoryTTL.clear();
		// Limpar apenas nossos caches do localStorage
		const keys = Object.keys(localStorage);
		keys.forEach((key) => {
			if (key.startsWith("tf_cache_")) {
				localStorage.removeItem(key);
			}
		});
	}

	getStats() {
		return {
			memorySize: this.memoryCache.size,
			localStorageKeys: Object.keys(localStorage).filter((k) =>
				k.startsWith("tf_cache_")
			).length,
		};
	}
}

const cache = new UltraFastCache();

// Logger otimizado
const log = (level, message, data = {}) => {
	if (process.env.NODE_ENV === "development") {
		const timestamp = new Date().toISOString().split("T")[1].substring(0, 8);
		console[level === "error" ? "error" : "log"](
			`[${timestamp}] FastData ${level}: ${message}`,
			data
		);
	}
};

// Timeout agressivo para performance
const withTimeout = (promise, ms = 2000) => {
	return Promise.race([
		promise,
		new Promise((_, reject) =>
			setTimeout(() => reject(new Error(`Timeout ${ms}ms`)), ms)
		),
	]);
};

// Fallback posts para carregamento instantâneo
const FALLBACK_POSTS = [
	{
		id: 1,
		title: "GP de Mônaco 2025: Verstappen Domina nas Ruas Principescas",
		slug: "gp-monaco-2025-verstappen-domina",
		category: "f1",
		category_name: "Fórmula 1",
		image_url:
			"https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800",
		excerpt:
			"Max Verstappen conquista mais uma vitória em Mônaco com uma performance impecável que deixou os fãs extasiados.",
		content:
			"Max Verstappen mais uma vez demonstrou sua maestria nas ruas estreitas de Monte Carlo...",
		author: "Equipe TF",
		read_time: "5 min",
		published: true,
		trending: true,
		tags: ["f1", "verstappen", "monaco"],
		created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
		updated_at: new Date().toISOString(),
	},
	{
		id: 2,
		title: "Daytona 500: A Batalha Épica que Definiu a Temporada",
		slug: "daytona-500-batalha-epica-temporada",
		category: "nascar",
		category_name: "NASCAR",
		image_url:
			"https://images.unsplash.com/photo-1566473965997-3de9c817e938?w=800",
		excerpt:
			"Relato completo da corrida mais emocionante do ano com ultrapassagens incríveis.",
		content: "A Daytona 500 de 2025 entrou para a história...",
		author: "Race Team",
		read_time: "6 min",
		published: true,
		trending: true,
		tags: ["nascar", "daytona", "500"],
		created_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
		updated_at: new Date().toISOString(),
	},
	{
		id: 3,
		title: "Novo Motor V8 Biturbo: A Revolução dos 1000HP",
		slug: "novo-motor-v8-biturbo-1000hp",
		category: "engines",
		category_name: "Motores",
		image_url:
			"https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?w=800",
		excerpt:
			"Análise completa do novo propulsor que está mudando o cenário do tuning.",
		content: "A indústria automotiva testemunha mais uma revolução...",
		author: "Tech Team",
		read_time: "8 min",
		published: true,
		trending: false,
		tags: ["motores", "v8", "biturbo"],
		created_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
		updated_at: new Date().toISOString(),
	},
];

// Função helper para queries otimizadas
const executeQuery = async (queryFn, operation, timeout = 2000) => {
	const startTime = Date.now();
	log("info", `Starting ${operation}`);

	try {
		const result = await withTimeout(queryFn(), timeout);

		if (result.error) {
			throw new Error(`Supabase error: ${result.error.message}`);
		}

		const duration = Date.now() - startTime;
		const data = result.data || [];

		log("success", `${operation} completed`, {
			duration: `${duration}ms`,
			records: Array.isArray(data) ? data.length : 1,
		});

		return data;
	} catch (error) {
		const duration = Date.now() - startTime;
		log("error", `${operation} failed`, {
			duration: `${duration}ms`,
			error: error.message,
		});
		throw error;
	}
};

export const FastDataService = {
	/**
	 * Posts em destaque - ULTRA RÁPIDO com função SQL otimizada
	 */
	async getFeaturedPosts() {
		const cacheKey = "featured_posts_v2";

		try {
			// 1. Cache hit instantâneo
			const cached = cache.get(cacheKey);
			if (cached) {
				log("success", "Featured posts cache HIT", {
					count: cached.length,
				});
				return cached;
			}

			// 2. Promise race: SQL function vs fallback
			const sqlPromise = executeQuery(
				() => supabase.rpc("get_featured_posts", { limit_count: 3 }),
				"featured-posts-sql",
				1500
			);

			const fallbackPromise = new Promise((resolve) => {
				setTimeout(() => {
					log("info", "Using fallback for featured posts");
					resolve(FALLBACK_POSTS.slice(0, 3));
				}, 1500);
			});

			const result = await Promise.race([sqlPromise, fallbackPromise]);

			// Cache resultado
			cache.set(cacheKey, result, 5 * 60 * 1000); // 5 minutos

			// Se SQL real completar depois, atualizar cache em background
			if (result === FALLBACK_POSTS.slice(0, 3)) {
				sqlPromise
					.then((realData) => {
						if (realData && realData.length > 0) {
							cache.set(cacheKey, realData);
							log("info", "Featured posts cache updated in background");
						}
					})
					.catch(() => {}); // Silenciar erros de background
			}

			return result;
		} catch (error) {
			log("error", "Featured posts fallback", { error: error.message });
			const fallback = FALLBACK_POSTS.slice(0, 3);
			cache.set(cacheKey, fallback, 2 * 60 * 1000); // Cache fallback por menos tempo
			return fallback;
		}
	},

	/**
	 * Todos os posts publicados - usando índices otimizados
	 */
	async getAllPosts() {
		const cacheKey = "all_posts_v2";

		try {
			const cached = cache.get(cacheKey);
			if (cached) {
				log("success", "All posts cache HIT", { count: cached.length });
				return cached;
			}

			// Query otimizada usando índice composto
			const posts = await executeQuery(
				() =>
					supabase
						.from("posts")
						.select(
							`id, title, slug, category, category_name, image_url, 
             excerpt, content, author, read_time, trending, tags, 
             published, created_at, updated_at`
						)
						.eq("published", true)
						.order("created_at", { ascending: false })
						.limit(20),
				"all-posts",
				2500
			);

			cache.set(cacheKey, posts, 8 * 60 * 1000); // 8 minutos
			return posts;
		} catch (error) {
			log("error", "All posts fallback", { error: error.message });
			const fallback = [...FALLBACK_POSTS];
			cache.set(cacheKey, fallback, 3 * 60 * 1000);
			return fallback;
		}
	},

	/**
	 * Posts por categoria - usando função SQL otimizada
	 */
	async getPostsByCategory(categoryId) {
		const cacheKey = `category_${categoryId}_v2`;

		try {
			const cached = cache.get(cacheKey);
			if (cached) {
				log("success", `Category ${categoryId} cache HIT`, {
					count: cached.length,
				});
				return cached;
			}

			// Usar função SQL otimizada
			const posts = await executeQuery(
				() =>
					supabase.rpc("get_posts_by_category", {
						category_slug: categoryId,
						limit_count: 12,
						offset_count: 0,
					}),
				`category-${categoryId}`,
				2000
			);

			if (posts && posts.length > 0) {
				cache.set(cacheKey, posts, 10 * 60 * 1000); // 10 minutos
				return posts;
			}

			// Fallback para categoria específica
			const fallback = FALLBACK_POSTS.filter((p) => p.category === categoryId);
			cache.set(cacheKey, fallback, 5 * 60 * 1000);
			return fallback;
		} catch (error) {
			log("error", `Category ${categoryId} fallback`, {
				error: error.message,
			});
			const fallback = FALLBACK_POSTS.filter((p) => p.category === categoryId);
			cache.set(cacheKey, fallback, 3 * 60 * 1000);
			return fallback;
		}
	},

	/**
	 * Post individual por ID
	 */
	async getPostById(id) {
		const cacheKey = `post_${id}_v2`;

		try {
			const cached = cache.get(cacheKey);
			if (cached) {
				log("success", `Post ${id} cache HIT`);
				return cached;
			}

			const postId = typeof id === "string" ? parseInt(id, 10) : id;

			const post = await executeQuery(
				() =>
					supabase
						.from("posts")
						.select("*")
						.eq("id", postId)
						.eq("published", true)
						.single(),
				`post-${postId}`,
				3000
			);

			if (post) {
				cache.set(cacheKey, post, 15 * 60 * 1000); // 15 minutos
				return post;
			}

			return null;
		} catch (error) {
			log("error", `Post ${id} not found`, { error: error.message });

			// Tentar fallback
			const postId = typeof id === "string" ? parseInt(id, 10) : id;
			const fallbackPost = FALLBACK_POSTS.find((p) => p.id === postId);

			if (fallbackPost) {
				cache.set(cacheKey, fallbackPost, 5 * 60 * 1000);
				return fallbackPost;
			}

			return null;
		}
	},

	/**
	 * Posts populares da view materializada
	 */
	async getPopularPosts(limit = 5) {
		const cacheKey = `popular_posts_${limit}_v2`;

		try {
			const cached = cache.get(cacheKey);
			if (cached) {
				log("success", "Popular posts cache HIT", { count: cached.length });
				return cached;
			}

			// Usar view materializada
			const posts = await executeQuery(
				() =>
					supabase
						.from("mv_popular_posts")
						.select("*")
						.limit(limit)
						.order("total_views", { ascending: false }),
				"popular-posts",
				2000
			);

			cache.set(cacheKey, posts, 30 * 60 * 1000); // 30 minutos
			return posts;
		} catch (error) {
			log("error", "Popular posts fallback", { error: error.message });
			const fallback = FALLBACK_POSTS.slice(0, limit);
			cache.set(cacheKey, fallback, 5 * 60 * 1000);
			return fallback;
		}
	},

	/**
	 * Busca rápida (para implementar futuramente)
	 */
	async searchPosts(query, limit = 10) {
		const cacheKey = `search_${query}_${limit}_v2`;

		try {
			const cached = cache.get(cacheKey);
			if (cached) return cached;

			// Busca usando full-text search
			const results = await executeQuery(
				() =>
					supabase
						.from("posts")
						.select(
							"id, title, slug, category, category_name, excerpt, created_at"
						)
						.textSearch("title", query)
						.eq("published", true)
						.limit(limit),
				"search",
				2000
			);

			cache.set(cacheKey, results, 5 * 60 * 1000); // 5 minutos
			return results;
		} catch (error) {
			log("error", "Search failed", { error: error.message });
			return [];
		}
	},

	/**
	 * CRUD Operations para Admin (com timeout maior)
	 */
	async createPost(postData) {
		try {
			const result = await executeQuery(
				() =>
					supabase
						.from("posts")
						.insert([
							{
								...postData,
								created_at: new Date().toISOString(),
								updated_at: new Date().toISOString(),
							},
						])
						.select()
						.single(),
				"create-post",
				5000
			);

			// Invalidar caches relacionados
			this.clearRelatedCaches();

			return { data: result, error: null };
		} catch (error) {
			log("error", "Create post failed", { error: error.message });
			return { data: null, error };
		}
	},

	async updatePost(id, postData) {
		try {
			const postId = typeof id === "string" ? parseInt(id, 10) : id;

			const result = await executeQuery(
				() =>
					supabase
						.from("posts")
						.update({
							...postData,
							updated_at: new Date().toISOString(),
						})
						.eq("id", postId)
						.select()
						.single(),
				"update-post",
				5000
			);

			// Invalidar caches relacionados
			this.clearRelatedCaches();

			return { data: result, error: null };
		} catch (error) {
			log("error", "Update post failed", { error: error.message });
			return { data: null, error };
		}
	},

	async deletePost(id) {
		try {
			const postId = typeof id === "string" ? parseInt(id, 10) : id;

			await executeQuery(
				() => supabase.from("posts").delete().eq("id", postId),
				"delete-post",
				5000
			);

			// Invalidar caches relacionados
			this.clearRelatedCaches();

			return { error: null };
		} catch (error) {
			log("error", "Delete post failed", { error: error.message });
			return { error };
		}
	},

	/**
	 * Utility methods
	 */
	clearCache() {
		cache.clear();
		log("info", "Cache cleared");
	},

	clearRelatedCaches() {
		// Invalidar apenas caches relacionados aos posts
		const keys = [
			"featured_posts_v2",
			"all_posts_v2",
			"popular_posts_5_v2",
			"popular_posts_3_v2",
		];

		keys.forEach((key) => {
			cache.memoryCache.delete(key);
			cache.memoryTTL.delete(key);
		});

		// Limpar caches de categoria do localStorage
		Object.keys(localStorage)
			.filter((key) => key.startsWith("tf_cache_category_"))
			.forEach((key) => localStorage.removeItem(key));

		log("info", "Related caches cleared");
	},

	getCacheStats() {
		return cache.getStats();
	},

	/**
	 * Prefetch para melhorar UX
	 */
	async prefetchCategory(categoryId) {
		// Prefetch em background sem bloquear
		setTimeout(() => {
			this.getPostsByCategory(categoryId).catch(() => {});
		}, 100);
	},

	async prefetchPost(id) {
		setTimeout(() => {
			this.getPostById(id).catch(() => {});
		}, 100);
	},

	/**
	 * Warmup cache - chama isso no app startup
	 */
	async warmupCache() {
		log("info", "Starting cache warmup");

		// Prefetch dados críticos em paralelo
		const promises = [
			this.getFeaturedPosts(),
			this.getAllPosts(),
			this.getPopularPosts(5),
		];

		// Prefetch categorias principais
		const mainCategories = ["f1", "nascar", "engines"];
		mainCategories.forEach((cat) => promises.push(this.prefetchCategory(cat)));

		try {
			await Promise.allSettled(promises);
			log("info", "Cache warmup completed");
		} catch (error) {
			log("error", "Cache warmup failed", { error: error.message });
		}
	},
};
