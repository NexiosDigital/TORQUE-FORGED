import { supabase } from "../lib/supabase";

/**
 * Sistema de dados ULTRA-RÁPIDO
 * - Timeouts reduzidos para 3-5s
 * - Cache mais agressivo (5min)
 * - Fallback instantâneo
 * - Queries otimizadas
 */

const log = (type, message, data = {}) => {
	const timestamp = new Date().toISOString().split("T")[1].split(".")[0];
	const prefix = `${type} ${timestamp}`;

	if (type === "✅") console.log(prefix, message, data);
	else if (type === "❌") console.error(prefix, message, data);
	else console.log(prefix, message, data);
};

// Cache ultra-rápido com TTL de 5 minutos
class FastCache {
	constructor() {
		this.store = new Map();
		this.timestamps = new Map();
		this.TTL = 5 * 60 * 1000; // 5 minutos
	}

	set(key, value) {
		this.store.set(key, value);
		this.timestamps.set(key, Date.now());
		log("💾", `Cache SET: ${key}`);
	}

	get(key) {
		const timestamp = this.timestamps.get(key);
		const now = Date.now();

		if (!timestamp || now - timestamp > this.TTL) {
			this.store.delete(key);
			this.timestamps.delete(key);
			return null;
		}

		log("💾", `Cache HIT: ${key}`);
		return this.store.get(key);
	}

	clear() {
		this.store.clear();
		this.timestamps.clear();
		log("💾", "Cache CLEARED");
	}
}

const cache = new FastCache();

// Timeout MUITO mais rápido - 3-5s máximo
const withFastTimeout = (promise, timeoutMs = 4000) => {
	return new Promise((resolve, reject) => {
		const timer = setTimeout(() => {
			reject(new Error(`Timeout após ${timeoutMs}ms`));
		}, timeoutMs);

		promise
			.then((result) => {
				clearTimeout(timer);
				resolve(result);
			})
			.catch((error) => {
				clearTimeout(timer);
				reject(error);
			});
	});
};

// Dados fallback compactos para máxima velocidade
const FAST_FALLBACK = {
	posts: [
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
				"Max Verstappen mais uma vez demonstrou sua maestria nas ruas estreitas de Monte Carlo, conquistando uma vitória dominante no GP de Mônaco 2025. O piloto holandês, largando da pole position, controlou a corrida do início ao fim.",
			author: "Equipe TF",
			read_time: "5 min",
			published: true,
			trending: true,
			tags: ["f1", "verstappen", "monaco"],
			created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
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
				"Relato completo da corrida mais emocionante do ano com ultrapassagens incríveis e estratégias audaciosas.",
			content:
				"A Daytona 500 de 2025 entrou para a história como uma das corridas mais emocionantes já disputadas no autódromo mais famoso da NASCAR.",
			author: "Race Team",
			read_time: "6 min",
			published: true,
			trending: true,
			tags: ["nascar", "daytona", "500"],
			created_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
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
				"Análise completa do novo propulsor que está mudando o cenário do tuning com tecnologia de ponta.",
			content:
				"A indústria automotiva testemunha mais uma revolução com o lançamento do novo motor V8 biturbo que promete entregar incríveis 1000 cavalos de potência.",
			author: "Tech Team",
			read_time: "8 min",
			published: true,
			trending: false,
			tags: ["motores", "v8", "biturbo"],
			created_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
		},
	],

	byCategory: {
		f1: [
			{
				id: 101,
				title: "Hamilton vs Verstappen: A Rivalidade Continua em 2025",
				category: "f1",
				category_name: "Fórmula 1",
				image_url:
					"https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800",
				excerpt:
					"A batalha entre os dois campeões mundiais promete esquentar ainda mais a temporada 2025.",
				content:
					"A rivalidade entre Lewis Hamilton e Max Verstappen continua sendo um dos principais atrativos da F1.",
				author: "F1 Team",
				read_time: "4 min",
				published: true,
				trending: true,
				tags: ["f1", "hamilton", "verstappen"],
				created_at: new Date(
					Date.now() - 1 * 24 * 60 * 60 * 1000
				).toISOString(),
			},
		],
		nascar: [
			{
				id: 201,
				title: "Talladega Superspeedway: A Pista Mais Desafiadora",
				category: "nascar",
				category_name: "NASCAR",
				image_url:
					"https://images.unsplash.com/photo-1566473965997-3de9c817e938?w=800",
				excerpt:
					"Por que Talladega é considerada uma das pistas mais perigosas e emocionantes da NASCAR.",
				content:
					"Talladega Superspeedway é famosa por suas corridas imprevisíveis e emocionantes.",
				author: "NASCAR Team",
				read_time: "5 min",
				published: true,
				trending: false,
				tags: ["nascar", "talladega"],
				created_at: new Date(
					Date.now() - 1 * 24 * 60 * 60 * 1000
				).toISOString(),
			},
		],
		engines: [
			{
				id: 301,
				title: "V8 vs V6 Turbo: Qual Motor Escolher",
				category: "engines",
				category_name: "Motores",
				image_url:
					"https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?w=800",
				excerpt:
					"Comparativo técnico entre motores V8 aspirados e V6 turbo para projetos de tuning.",
				content:
					"A escolha entre um V8 aspirado e um V6 turbo depende de vários fatores.",
				author: "Engine Team",
				read_time: "8 min",
				published: true,
				trending: false,
				tags: ["motores", "v8", "v6"],
				created_at: new Date(
					Date.now() - 1 * 24 * 60 * 60 * 1000
				).toISOString(),
			},
		],
		endurance: [
			{
				id: 401,
				title: "Le Mans 2025: Prévia das 24 Horas",
				category: "endurance",
				category_name: "Endurance",
				image_url:
					"https://images.unsplash.com/photo-1583121274602-3e2820c69888?w=800",
				excerpt:
					"Tudo sobre a maior corrida de resistência do mundo e os favoritos para 2025.",
				content:
					"As 24 Horas de Le Mans são a prova máxima de resistência no automobilismo.",
				author: "Endurance Team",
				read_time: "6 min",
				published: true,
				trending: false,
				tags: ["endurance", "le mans"],
				created_at: new Date(
					Date.now() - 1 * 24 * 60 * 60 * 1000
				).toISOString(),
			},
		],
		drift: [
			{
				id: 501,
				title: "Formula Drift: Técnicas Essenciais",
				category: "drift",
				category_name: "Formula Drift",
				image_url:
					"https://images.unsplash.com/photo-1552519507-da3b142c6e3d?w=800",
				excerpt:
					"Aprenda as técnicas básicas do drift e como começar neste esporte emocionante.",
				content:
					"O drift é uma das modalidades mais espetaculares do automobilismo.",
				author: "Drift Team",
				read_time: "7 min",
				published: true,
				trending: false,
				tags: ["drift", "tecnicas"],
				created_at: new Date(
					Date.now() - 1 * 24 * 60 * 60 * 1000
				).toISOString(),
			},
		],
		tuning: [
			{
				id: 601,
				title: "Suspensão Fixa vs Roscada",
				category: "tuning",
				category_name: "Tuning & Custom",
				image_url:
					"https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?w=800",
				excerpt:
					"Comparativo entre sistemas de suspensão fixa e roscada para carros preparados.",
				content:
					"A escolha da suspensão é fundamental para o comportamento do carro.",
				author: "Tuning Team",
				read_time: "6 min",
				published: true,
				trending: false,
				tags: ["tuning", "suspensao"],
				created_at: new Date(
					Date.now() - 1 * 24 * 60 * 60 * 1000
				).toISOString(),
			},
		],
	},
};

// Função de fetch SUPER otimizada
const fastFetch = async (queryFn, operation = "fetch", timeout = 3000) => {
	try {
		log("🚀", `FAST fetch: ${operation}`);
		const startTime = Date.now();

		const result = await withFastTimeout(queryFn(), timeout);

		const duration = Date.now() - startTime;

		if (result.error) {
			throw new Error(`Supabase: ${result.error.message}`);
		}

		const data = result.data || [];
		log("✅", `FAST fetch OK: ${operation}`, {
			duration: `${duration}ms`,
			records: Array.isArray(data) ? data.length : 1,
		});

		return data;
	} catch (error) {
		log("❌", `FAST fetch failed: ${operation}`, { error: error.message });
		throw error;
	}
};

/**
 * API ULTRA-RÁPIDA
 */
export const FastDataService = {
	/**
	 * Featured posts - SEMPRE 3 posts em ≤2s
	 */
	async getFeaturedPosts() {
		const cacheKey = "featured-posts";

		try {
			// 1. Cache instantâneo
			const cached = cache.get(cacheKey);
			if (cached) {
				log("⚡", "Featured posts: CACHE HIT", { count: cached.length });
				return cached;
			}

			// 2. Promise race: fetch vs fallback em 2s
			const fetchPromise = (async () => {
				const trending = await fastFetch(
					() =>
						supabase
							.from("posts")
							.select(
								"id, title, slug, category, category_name, image_url, excerpt, content, author, read_time, published, trending, tags, created_at"
							)
							.eq("published", true)
							.eq("trending", true)
							.order("created_at", { ascending: false })
							.limit(3),
					"trending",
					2000
				);

				if (trending.length >= 3) {
					return trending.slice(0, 3);
				}

				// Se precisar de mais, buscar recentes rapidamente
				const recent = await fastFetch(
					() =>
						supabase
							.from("posts")
							.select(
								"id, title, slug, category, category_name, image_url, excerpt, content, author, read_time, published, trending, tags, created_at"
							)
							.eq("published", true)
							.order("created_at", { ascending: false })
							.limit(5),
					"recent",
					2000
				);

				const trendingIds = trending.map((p) => p.id);
				const additional = recent
					.filter((p) => !trendingIds.includes(p.id))
					.slice(0, 3 - trending.length);

				return [...trending, ...additional].slice(0, 3);
			})();

			const fallbackPromise = new Promise((resolve) => {
				setTimeout(() => {
					log("⚡", "Featured posts: FALLBACK após 2s");
					resolve(FAST_FALLBACK.posts.slice(0, 3));
				}, 2000);
			});

			// Race: o que chegar primeiro em 2s
			const result = await Promise.race([fetchPromise, fallbackPromise]);

			// Cache o resultado
			cache.set(cacheKey, result);

			// Se fetch real chegar depois, atualizar cache em background
			fetchPromise
				.then((realData) => {
					if (realData !== result) {
						cache.set(cacheKey, realData);
						log("🔄", "Featured posts: cache atualizado em background");
					}
				})
				.catch(() => {}); // Silenciar erros de background

			return result;
		} catch (error) {
			log("❌", "Featured posts: ERRO GERAL, usando fallback", error);
			return FAST_FALLBACK.posts.slice(0, 3);
		}
	},

	/**
	 * Todos os posts - máximo 3s
	 */
	async getAllPosts() {
		const cacheKey = "all-posts";

		try {
			// Cache primeiro
			const cached = cache.get(cacheKey);
			if (cached) {
				log("⚡", "All posts: CACHE HIT", { count: cached.length });
				return cached;
			}

			// Fetch rápido com select otimizado
			const posts = await fastFetch(
				() =>
					supabase
						.from("posts")
						.select(
							"id, title, slug, category, category_name, image_url, excerpt, content, author, read_time, published, trending, tags, created_at"
						)
						.eq("published", true)
						.order("created_at", { ascending: false })
						.limit(20), // Limitar para 20 posts mais recentes
				"all-posts",
				3000
			);

			cache.set(cacheKey, posts);
			return posts;
		} catch (error) {
			log("❌", "All posts: ERRO, usando fallback", error);
			const fallback = [...FAST_FALLBACK.posts];
			cache.set(cacheKey, fallback);
			return fallback;
		}
	},

	/**
	 * Posts por categoria - máximo 3s
	 */
	async getPostsByCategory(categoryId) {
		const cacheKey = `category-${categoryId}`;

		try {
			// Cache primeiro
			const cached = cache.get(cacheKey);
			if (cached) {
				log("⚡", `Category ${categoryId}: CACHE HIT`, {
					count: cached.length,
				});
				return cached;
			}

			// Fetch rápido
			const posts = await fastFetch(
				() =>
					supabase
						.from("posts")
						.select(
							"id, title, slug, category, category_name, image_url, excerpt, content, author, read_time, published, trending, tags, created_at"
						)
						.eq("category", categoryId)
						.eq("published", true)
						.order("created_at", { ascending: false })
						.limit(12), // Limitar a 12 posts por categoria
				`category-${categoryId}`,
				3000
			);

			if (posts.length > 0) {
				cache.set(cacheKey, posts);
				return posts;
			}

			// Se não encontrou, usar fallback
			const fallback = FAST_FALLBACK.byCategory[categoryId] || [];
			cache.set(cacheKey, fallback);
			return fallback;
		} catch (error) {
			log("❌", `Category ${categoryId}: ERRO, usando fallback`, error);
			const fallback = FAST_FALLBACK.byCategory[categoryId] || [];
			cache.set(cacheKey, fallback);
			return fallback;
		}
	},

	/**
	 * Post por ID - máximo 4s
	 */
	async getPostById(id) {
		try {
			const postId = typeof id === "string" ? parseInt(id, 10) : id;

			const post = await fastFetch(
				() => supabase.from("posts").select("*").eq("id", postId).single(),
				`post-${postId}`,
				4000
			);

			return post;
		} catch (error) {
			log("❌", `Post ${id}: ERRO, tentando fallback`, error);

			// Tentar encontrar nos fallbacks
			const postId = typeof id === "string" ? parseInt(id, 10) : id;
			const allFallbackPosts = [
				...FAST_FALLBACK.posts,
				...Object.values(FAST_FALLBACK.byCategory).flat(),
			];

			return allFallbackPosts.find((p) => p.id === postId) || null;
		}
	},

	/**
	 * Funções administrativas - com timeouts maiores
	 */
	async createPost(postData) {
		try {
			log("📝", "Criando post", { title: postData.title });

			const result = await fastFetch(
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
				6000
			); // 6s para operações admin

			cache.clear(); // Limpar cache após modificação

			return { data: result, error: null };
		} catch (error) {
			log("❌", "Erro ao criar post", error);
			return { data: null, error };
		}
	},

	async updatePost(id, postData) {
		try {
			const postId = typeof id === "string" ? parseInt(id, 10) : id;

			const result = await fastFetch(
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
				6000
			);

			cache.clear(); // Limpar cache após modificação

			return { data: result, error: null };
		} catch (error) {
			log("❌", "Erro ao atualizar post", error);
			return { data: null, error };
		}
	},

	async deletePost(id) {
		try {
			const postId = typeof id === "string" ? parseInt(id, 10) : id;

			await fastFetch(
				() => supabase.from("posts").delete().eq("id", postId),
				"delete-post",
				6000
			);

			cache.clear(); // Limpar cache após modificação

			return { error: null };
		} catch (error) {
			log("❌", "Erro ao deletar post", error);
			return { error };
		}
	},

	/**
	 * Utilitários
	 */
	clearCache() {
		cache.clear();
	},

	getCacheStats() {
		return {
			entries: cache.store.size,
			keys: Array.from(cache.store.keys()),
		};
	},
};

export default FastDataService;
