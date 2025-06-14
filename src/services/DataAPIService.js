/**
 * DataAPIService - CACHE REDUZIDO para dados mais frescos
 * - Cache HTTP mais curto
 * - Opção para bypass de cache
 * - Headers ajustados para detecção de mudanças
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
	}

	/**
	 * Fetch wrapper com cache HTTP reduzido
	 */
	async fetch(endpoint, options = {}) {
		const url = `${this.baseURL}${endpoint}`;

		const fetchOptions = {
			...options,
			headers: {
				...this.headers,
				...options.headers,
			},
			// Cache mais agressivo apenas quando solicitado
			cache: options.cache || "default",
		};

		try {
			const response = await fetch(url, fetchOptions);

			if (!response.ok) {
				const errorData = await response.json().catch(() => ({}));
				throw new Error(
					errorData.message || `HTTP ${response.status}: ${response.statusText}`
				);
			}

			return await response.json();
		} catch (error) {
			console.error(`❌ DataAPI Error: ${endpoint}`, error);
			throw error;
		}
	}

	/**
	 * Posts públicos - Cache REDUZIDO
	 */
	async getAllPosts(bypassCache = false) {
		const endpoint = "/posts?select=*&published=eq.true&order=created_at.desc";

		return this.fetch(endpoint, {
			cache: bypassCache ? "no-cache" : "default",
			headers: {
				"Cache-Control": bypassCache ? "no-cache" : "max-age=60", // REDUZIDO: 1 minuto
			},
		});
	}

	/**
	 * Posts em destaque - Cache REDUZIDO
	 */
	async getFeaturedPosts(bypassCache = false) {
		const endpoint =
			"/posts?select=*&published=eq.true&trending=eq.true&order=created_at.desc&limit=6";

		return this.fetch(endpoint, {
			cache: bypassCache ? "no-cache" : "default",
			headers: {
				"Cache-Control": bypassCache ? "no-cache" : "max-age=60", // REDUZIDO: 1 minuto
			},
		});
	}

	/**
	 * Posts por categoria - Cache REDUZIDO
	 */
	async getPostsByCategory(categoryId, bypassCache = false) {
		const endpoint = `/posts?select=*&published=eq.true&category=eq.${categoryId}&order=created_at.desc`;

		return this.fetch(endpoint, {
			cache: bypassCache ? "no-cache" : "default",
			headers: {
				"Cache-Control": bypassCache ? "no-cache" : "max-age=60", // REDUZIDO: 1 minuto
			},
		});
	}

	/**
	 * Post individual - Cache moderado
	 */
	async getPostById(id, bypassCache = false) {
		const endpoint = `/posts?select=*&id=eq.${id}&published=eq.true&limit=1`;

		const data = await this.fetch(endpoint, {
			cache: bypassCache ? "no-cache" : "default",
			headers: {
				"Cache-Control": bypassCache ? "no-cache" : "max-age=120", // 2 minutos para posts individuais
			},
		});

		if (!data || data.length === 0) {
			throw new Error("Post não encontrado");
		}

		return data[0];
	}

	/**
	 * Categorias - Cache moderado (categorias mudam pouco)
	 */
	async getCategories(bypassCache = false) {
		const endpoint = "/categories?select=*&order=name";

		return this.fetch(endpoint, {
			cache: bypassCache ? "no-cache" : "force-cache",
			headers: {
				"Cache-Control": bypassCache ? "no-cache" : "max-age=600", // 10 minutos para categorias
			},
		});
	}

	/**
	 * Busca de posts - SEM cache
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
			cache: "no-cache", // SEMPRE sem cache para buscas
			headers: {
				"Cache-Control": "no-cache",
			},
		});
	}

	/**
	 * NOVO: Método para buscar dados frescos (bypass total de cache)
	 */
	async getAllPostsFresh() {
		return this.getAllPosts(true);
	}

	async getFeaturedPostsFresh() {
		return this.getFeaturedPosts(true);
	}

	async getPostsByCategoryFresh(categoryId) {
		return this.getPostsByCategory(categoryId, true);
	}

	async getCategoriesFresh() {
		return this.getCategories(true);
	}

	/**
	 * Busca avançada com filtros
	 */
	async searchPostsAdvanced(filters = {}) {
		const { query, category, author, trending, limit = 20 } = filters;

		let conditions = ["published=eq.true"];

		if (query && query.length >= 2) {
			conditions.push(
				`or=(title.ilike.*${encodeURIComponent(
					query
				)}*,excerpt.ilike.*${encodeURIComponent(
					query
				)}*,content.ilike.*${encodeURIComponent(query)}*)`
			);
		}

		if (category) {
			conditions.push(`category=eq.${category}`);
		}

		if (author) {
			conditions.push(`author.ilike.*${encodeURIComponent(author)}*`);
		}

		if (trending !== undefined) {
			conditions.push(`trending=eq.${trending}`);
		}

		const endpoint = `/posts?select=*&${conditions.join(
			"&"
		)}&order=created_at.desc&limit=${limit}`;

		return this.fetch(endpoint, {
			cache: "no-cache",
			headers: {
				"Cache-Control": "no-cache",
			},
		});
	}

	/**
	 * Posts relacionados por categoria
	 */
	async getRelatedPosts(categoryId, excludePostId, limit = 3) {
		const endpoint = `/posts?select=*&published=eq.true&category=eq.${categoryId}&id=neq.${excludePostId}&order=created_at.desc&limit=${limit}`;

		return this.fetch(endpoint, {
			cache: "default",
			headers: {
				"Cache-Control": "max-age=120", // 2 minutos
			},
		});
	}

	/**
	 * Posts mais recentes (para widgets)
	 */
	async getLatestPosts(limit = 5, bypassCache = false) {
		const endpoint = `/posts?select=id,title,excerpt,image_url,image_path,category_name,created_at,author&published=eq.true&order=created_at.desc&limit=${limit}`;

		return this.fetch(endpoint, {
			cache: bypassCache ? "no-cache" : "default",
			headers: {
				"Cache-Control": bypassCache ? "no-cache" : "max-age=60", // 1 minuto
			},
		});
	}

	/**
	 * Posts por autor
	 */
	async getPostsByAuthor(author, limit = 10) {
		const endpoint = `/posts?select=*&published=eq.true&author.ilike.*${encodeURIComponent(
			author
		)}*&order=created_at.desc&limit=${limit}`;

		return this.fetch(endpoint, {
			cache: "default",
			headers: {
				"Cache-Control": "max-age=180", // 3 minutos
			},
		});
	}

	/**
	 * Estatísticas básicas
	 */
	async getPublicStats() {
		const [totalPosts, featuredPosts, categories] = await Promise.all([
			this.fetch("/posts?select=count&published=eq.true", {
				cache: "default",
				headers: { "Cache-Control": "max-age=300" }, // 5 minutos para stats
			}),
			this.fetch("/posts?select=count&published=eq.true&trending=eq.true", {
				cache: "default",
				headers: { "Cache-Control": "max-age=300" },
			}),
			this.fetch("/categories?select=count", {
				cache: "default",
				headers: { "Cache-Control": "max-age=600" }, // 10 minutos para contagem de categorias
			}),
		]);

		return {
			totalPosts: totalPosts?.[0]?.count || 0,
			featuredPosts: featuredPosts?.[0]?.count || 0,
			totalCategories: categories?.[0]?.count || 0,
		};
	}

	/**
	 * Verificar se post existe
	 */
	async postExists(id) {
		try {
			const endpoint = `/posts?select=id&id=eq.${id}&published=eq.true&limit=1`;
			const data = await this.fetch(endpoint, {
				cache: "default",
				headers: { "Cache-Control": "max-age=60" },
			});
			return data && data.length > 0;
		} catch (error) {
			return false;
		}
	}

	/**
	 * MELHORADA: Invalidar cache HTTP para rotas específicas
	 */
	async invalidateCache(endpoint) {
		try {
			const url = `${this.baseURL}${endpoint}`;

			// Fazer uma requisição HEAD com no-cache para forçar invalidação
			await fetch(url, {
				method: "HEAD",
				headers: {
					...this.headers,
					"Cache-Control": "no-cache",
					Pragma: "no-cache",
				},
			});
		} catch (error) {
			console.warn("Cache invalidation failed:", error);
		}
	}

	/**
	 * MELHORADA: Invalidar cache de múltiplas rotas
	 */
	async invalidateMultipleCache(endpoints) {
		const results = await Promise.allSettled(
			endpoints.map((endpoint) => this.invalidateCache(endpoint))
		);

		const failed = results.filter((r) => r.status === "rejected");
		if (failed.length > 0) {
			console.warn(`Failed to invalidate ${failed.length} cache entries`);
		}
	}

	/**
	 * NOVA: Invalidar todos os caches de posts
	 */
	async invalidateAllPostsCache() {
		const endpoints = [
			"/posts",
			"/posts?published=eq.true",
			"/posts?published=eq.true&trending=eq.true",
		];

		await this.invalidateMultipleCache(endpoints);
	}

	/**
	 * Health check da API
	 */
	async healthCheck() {
		try {
			const endpoint = "/posts?select=count&limit=1";
			await this.fetch(endpoint, {
				cache: "no-cache",
				headers: { "Cache-Control": "no-cache" },
			});
			return { status: "healthy", timestamp: new Date().toISOString() };
		} catch (error) {
			return {
				status: "unhealthy",
				error: error.message,
				timestamp: new Date().toISOString(),
			};
		}
	}

	/**
	 * Buscar posts por tags
	 */
	async getPostsByTag(tag, limit = 10) {
		const endpoint = `/posts?select=*&published=eq.true&tags.cs.["${tag}"]&order=created_at.desc&limit=${limit}`;

		return this.fetch(endpoint, {
			cache: "default",
			headers: {
				"Cache-Control": "max-age=180", // 3 minutos
			},
		});
	}

	/**
	 * Buscar todas as tags únicas
	 */
	async getAllTags() {
		const endpoint = "/posts?select=tags&published=eq.true&not.tags.is.null";

		const posts = await this.fetch(endpoint, {
			cache: "force-cache",
			headers: {
				"Cache-Control": "max-age=900", // 15 minutos para tags
			},
		});

		// Processar tags no cliente
		const allTags = new Set();
		posts.forEach((post) => {
			if (post.tags && Array.isArray(post.tags)) {
				post.tags.forEach((tag) => allTags.add(tag.trim()));
			}
		});

		return Array.from(allTags).sort();
	}
}

// Singleton instance
export const dataAPIService = new DataAPIService();
