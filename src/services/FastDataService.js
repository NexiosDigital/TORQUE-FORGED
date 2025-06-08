import { supabase } from "../lib/supabase";

/**
 * FastDataService CORRIGIDO
 * - Timeouts mais realistas
 * - Melhor error handling
 * - Fallbacks mais robustos
 * - Cache mais estável
 */

// Cache ESTÁVEL
class StableCache {
	constructor() {
		this.memoryCache = new Map();
		this.memoryTTL = new Map();
		this.maxMemoryItems = 30; // Reduzido para evitar memory leaks
		this.defaultTTL = {
			memory: 5 * 60 * 1000, // 5 minutos
			localStorage: 20 * 60 * 1000, // 20 minutos
		};
	}

	setMemory(key, data, ttl = this.defaultTTL.memory) {
		try {
			if (this.memoryCache.size >= this.maxMemoryItems) {
				const firstKey = this.memoryCache.keys().next().value;
				this.memoryCache.delete(firstKey);
				this.memoryTTL.delete(firstKey);
			}

			this.memoryCache.set(key, data);
			this.memoryTTL.set(key, Date.now() + ttl);
		} catch (error) {
			console.warn("Memory cache set failed:", error);
		}
	}

	getMemory(key) {
		try {
			if (!this.memoryCache.has(key)) return null;

			const ttl = this.memoryTTL.get(key);
			if (Date.now() > ttl) {
				this.memoryCache.delete(key);
				this.memoryTTL.delete(key);
				return null;
			}

			return this.memoryCache.get(key);
		} catch (error) {
			console.warn("Memory cache get failed:", error);
			return null;
		}
	}

	setLocal(key, data, ttl = this.defaultTTL.localStorage) {
		try {
			const item = {
				data,
				expires: Date.now() + ttl,
				version: "2.1", // Nova versão para limpar cache antigo
			};
			localStorage.setItem(`tf_cache_${key}`, JSON.stringify(item));
		} catch (error) {
			// localStorage cheio ou erro - tentar limpar e continuar
			this.clearExpiredLocal();
		}
	}

	getLocal(key) {
		try {
			const item = localStorage.getItem(`tf_cache_${key}`);
			if (!item) return null;

			const parsed = JSON.parse(item);
			if (Date.now() > parsed.expires || parsed.version !== "2.1") {
				localStorage.removeItem(`tf_cache_${key}`);
				return null;
			}

			return parsed.data;
		} catch (error) {
			// Se erro ao parsear, remover item corrompido
			try {
				localStorage.removeItem(`tf_cache_${key}`);
			} catch (e) {}
			return null;
		}
	}

	get(key) {
		const memoryData = this.getMemory(key);
		if (memoryData) return memoryData;

		const localData = this.getLocal(key);
		if (localData) {
			this.setMemory(key, localData);
			return localData;
		}

		return null;
	}

	set(key, data, ttl) {
		this.setMemory(key, data, ttl);
		this.setLocal(key, data, ttl);
	}

	clearExpiredLocal() {
		try {
			const keys = Object.keys(localStorage);
			keys.forEach((key) => {
				if (key.startsWith("tf_cache_")) {
					try {
						const item = JSON.parse(localStorage.getItem(key));
						if (Date.now() > item.expires || item.version !== "2.1") {
							localStorage.removeItem(key);
						}
					} catch (e) {
						localStorage.removeItem(key);
					}
				}
			});
		} catch (error) {
			console.warn("Failed to clear expired local cache:", error);
		}
	}

	clear() {
		this.memoryCache.clear();
		this.memoryTTL.clear();

		try {
			const keys = Object.keys(localStorage);
			keys.forEach((key) => {
				if (key.startsWith("tf_cache_")) {
					localStorage.removeItem(key);
				}
			});
		} catch (error) {
			console.warn("Failed to clear localStorage:", error);
		}
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

const cache = new StableCache();

// Logger SEGURO
const log = (level, message, data = {}) => {
	if (process.env.NODE_ENV === "development") {
		const timestamp = new Date().toISOString().split("T")[1].substring(0, 8);
		const method = level === "error" ? "error" : "log";
		console[method](`[${timestamp}] FastData ${level}: ${message}`, data);
	}
};

// Timeout MAIS REALISTA (era muito agressivo antes)
const withTimeout = (promise, ms = 8000) => {
	// Aumentado de 2s para 8s
	return Promise.race([
		promise,
		new Promise((_, reject) =>
			setTimeout(() => reject(new Error(`Timeout após ${ms}ms`)), ms)
		),
	]);
};

// Fallback posts MELHORADOS
const STABLE_FALLBACK_POSTS = [
	{
		id: 1,
		title: "GP de Mônaco 2025: Verstappen Domina nas Ruas Principescas",
		slug: "gp-monaco-2025-verstappen-domina",
		category: "f1",
		category_name: "Fórmula 1",
		image_url:
			"https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&h=600&fit=crop&auto=format",
		excerpt:
			"Max Verstappen conquista mais uma vitória em Mônaco com uma performance impecável que deixou os fãs extasiados.",
		content: `Max Verstappen mais uma vez demonstrou sua maestria nas ruas estreitas de Monte Carlo, conquistando uma vitória dominante no GP de Mônaco 2025. O piloto holandês, largando da pole position, controlou a corrida do início ao fim.

A estratégia da Red Bull foi perfeita, com pit stops precisos e uma gestão exemplar dos pneus. Verstappen cruzou a linha de chegada com uma vantagem de mais de 15 segundos sobre Charles Leclerc, que ficou em segundo lugar para alegria da torcida local.

O pódio foi completado por Lewis Hamilton, que com uma Mercedes renovada mostrou sinais de recuperação após algumas temporadas difíceis. A corrida foi marcada por poucas ultrapassagens, característica típica de Mônaco, mas nem por isso deixou de ser emocionante.`,
		author: "Equipe TF",
		read_time: "5 min",
		published: true,
		trending: true,
		tags: ["f1", "verstappen", "monaco", "red-bull"],
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
			"https://images.unsplash.com/photo-1566473965997-3de9c817e938?w=800&h=600&fit=crop&auto=format",
		excerpt:
			"Relato completo da corrida mais emocionante do ano com ultrapassagens incríveis e estratégias audaciosas.",
		content: `A Daytona 500 de 2025 entrou para a história como uma das corridas mais emocionantes já disputadas no autódromo mais famoso da NASCAR. Com 200 voltas de pura adrenalina, a corrida teve de tudo: ultrapassagens espetaculares, estratégias arriscadas e um final de tirar o fôlego.

Joey Logano conquistou sua segunda vitória na "Grande Americana", mas não foi fácil. O piloto da Ford teve que superar adversários formidáveis como Kyle Larson e Chase Elliott, que protagonizaram batalhas épicas nas últimas 50 voltas.

A corrida foi marcada por apenas duas bandeiras amarelas, permitindo um ritmo intenso do início ao fim. A estratégia de combustível foi crucial, com várias equipes apostando em diferentes janelas de abastecimento.`,
		author: "Race Team",
		read_time: "6 min",
		published: true,
		trending: true,
		tags: ["nascar", "daytona", "500", "logano"],
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
			"https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?w=800&h=600&fit=crop&auto=format",
		excerpt:
			"Análise completa do novo propulsor que está mudando o cenário do tuning com tecnologia de ponta.",
		content: `A indústria automotiva testemunha mais uma revolução com o lançamento do novo motor V8 biturbo que promete entregar incríveis 1000 cavalos de potência. Este propulsor representa o que há de mais avançado em engenharia automotiva.

O motor utiliza tecnologia de injeção direta de combustível combinada com dois turbocompressores de geometria variável, resultando em uma resposta instantânea do acelerador e uma curva de torque impressionante.

Os materiais utilizados incluem liga de alumínio aeroespacial no bloco e pistões forjados de alta resistência. O sistema de lubrificação foi aprimorado com uma bomba de óleo de volume variável que se adapta às condições de uso.`,
		author: "Tech Team",
		read_time: "8 min",
		published: true,
		trending: false,
		tags: ["motores", "v8", "biturbo", "tuning", "1000hp"],
		created_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
		updated_at: new Date().toISOString(),
	},
	// Adicionar mais posts para diferentes categorias
	{
		id: 4,
		title: "Formula Drift: A Arte do Controle Total",
		slug: "formula-drift-arte-controle-total",
		category: "drift",
		category_name: "Formula Drift",
		image_url:
			"https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?w=800&h=600&fit=crop&auto=format",
		excerpt:
			"Mergulhe no mundo do drift profissional onde precisão e estilo se encontram em perfeita harmonia.",
		content:
			"O Formula Drift representa o ápice da arte de deslizar controladamente, onde pilotos demonstram habilidades extraordinárias...",
		author: "Drift Team",
		read_time: "7 min",
		published: true,
		trending: false,
		tags: ["drift", "formula-drift", "controle"],
		created_at: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
		updated_at: new Date().toISOString(),
	},
	{
		id: 5,
		title: "Tuning Extremo: Personalização Sem Limites",
		slug: "tuning-extremo-personalizacao-sem-limites",
		category: "tuning",
		category_name: "Tuning & Custom",
		image_url:
			"https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=800&h=600&fit=crop&auto=format",
		excerpt:
			"Explore os projetos mais audaciosos do mundo do tuning automotivo.",
		content:
			"O mundo do tuning não conhece limites quando se trata de personalização e performance...",
		author: "Custom Team",
		read_time: "6 min",
		published: true,
		trending: false,
		tags: ["tuning", "custom", "personalização"],
		created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
		updated_at: new Date().toISOString(),
	},
	{
		id: 6,
		title: "24 Horas de Le Mans: A Prova Definitiva",
		slug: "24-horas-le-mans-prova-definitiva",
		category: "endurance",
		category_name: "Endurance",
		image_url:
			"https://images.unsplash.com/photo-1511919884226-fd3cad34687c?w=800&h=600&fit=crop&auto=format",
		excerpt:
			"A corrida mais desafiadora do mundo testa os limites de homens e máquinas.",
		content:
			"As 24 Horas de Le Mans representam o teste supremo de resistência no automobilismo mundial...",
		author: "Endurance Team",
		read_time: "9 min",
		published: true,
		trending: false,
		tags: ["endurance", "le-mans", "24h"],
		created_at: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString(),
		updated_at: new Date().toISOString(),
	},
];

// Função helper MELHORADA
const executeQuery = async (queryFn, operation, timeout = 8000) => {
	const startTime = Date.now();
	log("info", `🚀 ${operation} - Iniciando`);

	try {
		const result = await withTimeout(queryFn(), timeout);

		if (result?.error) {
			throw new Error(`Supabase error: ${result.error.message}`);
		}

		const duration = Date.now() - startTime;
		const data = result?.data || result || [];

		log("info", `✅ ${operation} - Sucesso`, {
			duration: `${duration}ms`,
			records: Array.isArray(data) ? data.length : "single",
		});

		return data;
	} catch (error) {
		const duration = Date.now() - startTime;
		log("error", `❌ ${operation} - Falhou`, {
			duration: `${duration}ms`,
			error: error.message,
		});
		throw error;
	}
};

// Validador de dados
const validateData = (data, context = "unknown") => {
	if (data === null || data === undefined) {
		log("warn", `Dados nulos/undefined em ${context}`);
		return false;
	}

	if (Array.isArray(data)) {
		return data.length >= 0; // Array vazio é válido
	}

	if (typeof data === "object") {
		return Object.keys(data).length > 0;
	}

	return true;
};

export const FastDataService = {
	/**
	 * Posts em destaque - ESTABILIZADO
	 */
	async getFeaturedPosts() {
		const cacheKey = "featured_posts_v2_1";

		try {
			// Cache hit
			const cached = cache.get(cacheKey);
			if (cached && validateData(cached, "featured-cache")) {
				log("info", "✨ Featured posts - Cache HIT", { count: cached.length });
				return cached;
			}

			log("info", "🔄 Featured posts - Buscando no banco...");

			// Tentar query otimizada primeiro
			let result;
			try {
				result = await executeQuery(
					() =>
						supabase
							.from("posts")
							.select(
								`
							id, title, slug, category, category_name, image_url, 
							excerpt, content, author, read_time, trending, tags, 
							published, created_at, updated_at
						`
							)
							.eq("published", true)
							.eq("trending", true)
							.order("created_at", { ascending: false })
							.limit(3),
					"featured-posts-query",
					6000 // 6 segundos
				);
			} catch (queryError) {
				log("warn", "Query falhou, tentando RPC...", {
					error: queryError.message,
				});

				// Fallback para RPC se query normal falhar
				try {
					result = await executeQuery(
						() => supabase.rpc("get_featured_posts", { limit_count: 3 }),
						"featured-posts-rpc",
						4000
					);
				} catch (rpcError) {
					log("warn", "RPC também falhou", { error: rpcError.message });
					throw rpcError;
				}
			}

			// Validar resultado
			if (validateData(result, "featured-db") && result.length > 0) {
				cache.set(cacheKey, result, 10 * 60 * 1000); // 10 minutos
				log("info", "✅ Featured posts - Sucesso do banco", {
					count: result.length,
				});
				return result;
			}

			// Se resultado vazio ou inválido, usar fallback
			log("warn", "Resultado do banco inválido, usando fallback");
			const fallback = STABLE_FALLBACK_POSTS.filter((p) => p.trending).slice(
				0,
				3
			);
			cache.set(cacheKey, fallback, 5 * 60 * 1000); // Cache por menos tempo
			return fallback;
		} catch (error) {
			log("error", "Featured posts - Erro total", { error: error.message });

			// Fallback garantido
			const fallback = STABLE_FALLBACK_POSTS.filter((p) => p.trending).slice(
				0,
				3
			);
			cache.set(cacheKey, fallback, 3 * 60 * 1000);
			return fallback;
		}
	},

	/**
	 * Todos os posts - MELHORADO
	 */
	async getAllPosts() {
		const cacheKey = "all_posts_v2_1";

		try {
			const cached = cache.get(cacheKey);
			if (cached && validateData(cached, "all-cache")) {
				log("info", "✨ All posts - Cache HIT", { count: cached.length });
				return cached;
			}

			log("info", "🔄 All posts - Buscando no banco...");

			const result = await executeQuery(
				() =>
					supabase
						.from("posts")
						.select(
							`
						id, title, slug, category, category_name, image_url, 
						excerpt, content, author, read_time, trending, tags, 
						published, created_at, updated_at
					`
						)
						.eq("published", true)
						.order("created_at", { ascending: false })
						.limit(20),
				"all-posts-query",
				10000 // 10 segundos para query maior
			);

			if (validateData(result, "all-db") && result.length > 0) {
				cache.set(cacheKey, result, 15 * 60 * 1000); // 15 minutos
				log("info", "✅ All posts - Sucesso do banco", {
					count: result.length,
				});
				return result;
			}

			// Fallback se não encontrar nada
			log("warn", "Nenhum post no banco, usando fallback");
			const fallback = [...STABLE_FALLBACK_POSTS];
			cache.set(cacheKey, fallback, 5 * 60 * 1000);
			return fallback;
		} catch (error) {
			log("error", "All posts - Erro", { error: error.message });

			const fallback = [...STABLE_FALLBACK_POSTS];
			cache.set(cacheKey, fallback, 3 * 60 * 1000);
			return fallback;
		}
	},

	/**
	 * Posts por categoria - ESTABILIZADO
	 */
	async getPostsByCategory(categoryId) {
		if (!categoryId || typeof categoryId !== "string") {
			log("warn", "CategoryId inválido", { categoryId });
			return [];
		}

		const cacheKey = `category_${categoryId}_v2_1`;

		try {
			const cached = cache.get(cacheKey);
			if (cached && validateData(cached, `category-${categoryId}-cache`)) {
				log("info", `✨ Category ${categoryId} - Cache HIT`, {
					count: cached.length,
				});
				return cached;
			}

			log("info", `🔄 Category ${categoryId} - Buscando no banco...`);

			let result;
			try {
				// Query normal primeiro
				result = await executeQuery(
					() =>
						supabase
							.from("posts")
							.select(
								`
							id, title, slug, category, category_name, image_url, 
							excerpt, content, author, read_time, trending, tags, 
							published, created_at, updated_at
						`
							)
							.eq("published", true)
							.eq("category", categoryId)
							.order("created_at", { ascending: false })
							.limit(12),
					`category-${categoryId}-query`,
					8000
				);
			} catch (queryError) {
				// Fallback para RPC
				try {
					result = await executeQuery(
						() =>
							supabase.rpc("get_posts_by_category", {
								category_slug: categoryId,
								limit_count: 12,
								offset_count: 0,
							}),
						`category-${categoryId}-rpc`,
						6000
					);
				} catch (rpcError) {
					throw rpcError;
				}
			}

			if (validateData(result, `category-${categoryId}-db`)) {
				cache.set(cacheKey, result, 12 * 60 * 1000); // 12 minutos
				log("info", `✅ Category ${categoryId} - Sucesso`, {
					count: result.length,
				});
				return result;
			}

			// Fallback específico para categoria
			const fallback = STABLE_FALLBACK_POSTS.filter(
				(p) => p.category === categoryId
			);
			cache.set(cacheKey, fallback, 5 * 60 * 1000);
			log("info", `🔧 Category ${categoryId} - Usando fallback`, {
				count: fallback.length,
			});
			return fallback;
		} catch (error) {
			log("error", `Category ${categoryId} - Erro`, { error: error.message });

			const fallback = STABLE_FALLBACK_POSTS.filter(
				(p) => p.category === categoryId
			);
			cache.set(cacheKey, fallback, 3 * 60 * 1000);
			return fallback;
		}
	},

	/**
	 * Post individual - ROBUSTO
	 */
	async getPostById(id) {
		if (!id) {
			log("warn", "Post ID não fornecido");
			return null;
		}

		const cacheKey = `post_${id}_v2_1`;

		try {
			const cached = cache.get(cacheKey);
			if (cached && validateData(cached, `post-${id}-cache`)) {
				log("info", `✨ Post ${id} - Cache HIT`);
				return cached;
			}

			log("info", `🔄 Post ${id} - Buscando no banco...`);

			const postId = typeof id === "string" ? parseInt(id, 10) : id;

			if (isNaN(postId)) {
				throw new Error(`ID inválido: ${id}`);
			}

			const result = await executeQuery(
				() =>
					supabase
						.from("posts")
						.select("*")
						.eq("id", postId)
						.eq("published", true)
						.single(),
				`post-${postId}-query`,
				6000
			);

			if (validateData(result, `post-${id}-db`)) {
				cache.set(cacheKey, result, 20 * 60 * 1000); // 20 minutos
				log("info", `✅ Post ${id} - Encontrado no banco`);
				return result;
			}

			// Tentar fallback
			const fallbackPost = STABLE_FALLBACK_POSTS.find((p) => p.id === postId);
			if (fallbackPost) {
				cache.set(cacheKey, fallbackPost, 10 * 60 * 1000);
				log("info", `🔧 Post ${id} - Usando fallback`);
				return fallbackPost;
			}

			log("warn", `Post ${id} - Não encontrado`);
			return null;
		} catch (error) {
			log("error", `Post ${id} - Erro`, { error: error.message });

			// Última tentativa com fallback
			const postId = typeof id === "string" ? parseInt(id, 10) : id;
			const fallbackPost = STABLE_FALLBACK_POSTS.find((p) => p.id === postId);

			if (fallbackPost) {
				cache.set(cacheKey, fallbackPost, 5 * 60 * 1000);
				return fallbackPost;
			}

			return null;
		}
	},

	/**
	 * Posts populares - SIMPLIFICADO
	 */
	async getPopularPosts(limit = 5) {
		const cacheKey = `popular_posts_${limit}_v2_1`;

		try {
			const cached = cache.get(cacheKey);
			if (cached && validateData(cached, "popular-cache")) {
				log("info", "✨ Popular posts - Cache HIT", { count: cached.length });
				return cached;
			}

			log("info", "🔄 Popular posts - Buscando...");

			// Usar posts trending como "populares"
			const result = await executeQuery(
				() =>
					supabase
						.from("posts")
						.select(
							`
						id, title, slug, category, category_name, image_url, 
						excerpt, author, read_time, created_at
					`
						)
						.eq("published", true)
						.eq("trending", true)
						.order("created_at", { ascending: false })
						.limit(limit),
				"popular-posts-query",
				6000
			);

			if (validateData(result, "popular-db") && result.length > 0) {
				cache.set(cacheKey, result, 20 * 60 * 1000);
				return result;
			}

			// Fallback
			const fallback = STABLE_FALLBACK_POSTS.slice(0, limit);
			cache.set(cacheKey, fallback, 10 * 60 * 1000);
			return fallback;
		} catch (error) {
			log("error", "Popular posts - Erro", { error: error.message });

			const fallback = STABLE_FALLBACK_POSTS.slice(0, limit);
			cache.set(cacheKey, fallback, 5 * 60 * 1000);
			return fallback;
		}
	},

	/**
	 * Busca - MELHORADA
	 */
	async searchPosts(query, limit = 10) {
		if (!query || typeof query !== "string" || query.length < 2) {
			return [];
		}

		const cacheKey = `search_${query.toLowerCase().trim()}_${limit}_v2_1`;

		try {
			const cached = cache.get(cacheKey);
			if (cached && validateData(cached, "search-cache")) {
				return cached;
			}

			const sanitizedQuery = query.trim().toLowerCase();

			const result = await executeQuery(
				() =>
					supabase
						.from("posts")
						.select(
							`
						id, title, slug, category, category_name, excerpt, 
						created_at, image_url
					`
						)
						.eq("published", true)
						.or(
							`title.ilike.%${sanitizedQuery}%,excerpt.ilike.%${sanitizedQuery}%`
						)
						.order("created_at", { ascending: false })
						.limit(limit),
				"search-query",
				5000
			);

			const validResult = validateData(result, "search-db") ? result : [];
			cache.set(cacheKey, validResult, 10 * 60 * 1000);
			return validResult;
		} catch (error) {
			log("error", "Search - Erro", { error: error.message });
			return [];
		}
	},

	/**
	 * CRUD Operations - ESTABILIZADAS
	 */
	async createPost(postData) {
		try {
			log("info", "🔄 Criando post...");

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
				15000 // 15 segundos para operações de escrita
			);

			this.clearRelatedCaches();
			log("info", "✅ Post criado com sucesso");
			return result;
		} catch (error) {
			log("error", "Create post - Erro", { error: error.message });
			throw error;
		}
	},

	async updatePost(id, postData) {
		try {
			log("info", `🔄 Atualizando post ${id}...`);

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
				15000
			);

			this.clearRelatedCaches();
			log("info", `✅ Post ${id} atualizado`);
			return result;
		} catch (error) {
			log("error", `Update post ${id} - Erro`, { error: error.message });
			throw error;
		}
	},

	async deletePost(id) {
		try {
			log("info", `🔄 Deletando post ${id}...`);

			const postId = typeof id === "string" ? parseInt(id, 10) : id;

			await executeQuery(
				() => supabase.from("posts").delete().eq("id", postId),
				"delete-post",
				10000
			);

			this.clearRelatedCaches();
			log("info", `✅ Post ${id} deletado`);
		} catch (error) {
			log("error", `Delete post ${id} - Erro`, { error: error.message });
			throw error;
		}
	},

	/**
	 * Utility methods
	 */
	clearCache() {
		cache.clear();
		log("info", "🧹 Cache limpo completamente");
	},

	clearRelatedCaches() {
		// Limpar apenas caches relacionados a posts
		const keysToRemove = ["featured_posts_v2_1", "all_posts_v2_1"];

		keysToRemove.forEach((key) => {
			cache.memoryCache.delete(key);
			cache.memoryTTL.delete(key);
		});

		// Limpar localStorage de categorias
		try {
			Object.keys(localStorage)
				.filter(
					(key) =>
						key.startsWith("tf_cache_category_") ||
						key.startsWith("tf_cache_popular_")
				)
				.forEach((key) => localStorage.removeItem(key));
		} catch (error) {
			console.warn("Erro ao limpar localStorage:", error);
		}

		log("info", "🧹 Caches relacionados limpos");
	},

	getCacheStats() {
		return {
			...cache.getStats(),
			fallbackPostsAvailable: STABLE_FALLBACK_POSTS.length,
		};
	},

	// Prefetch methods
	async prefetchCategory(categoryId) {
		if (!categoryId) return;

		setTimeout(() => {
			this.getPostsByCategory(categoryId).catch(() => {
				log("warn", `Prefetch failed for category ${categoryId}`);
			});
		}, 200);
	},

	async prefetchPost(id) {
		if (!id) return;

		setTimeout(() => {
			this.getPostById(id).catch(() => {
				log("warn", `Prefetch failed for post ${id}`);
			});
		}, 200);
	},

	/**
	 * Warmup cache SEGURO
	 */
	async warmupCache() {
		log("info", "🔥 Iniciando warmup seguro do cache...");

		const warmupPromises = [
			this.getFeaturedPosts().catch(() =>
				log("warn", "Warmup featured posts falhou")
			),
			this.getAllPosts().catch(() => log("warn", "Warmup all posts falhou")),
			this.getPopularPosts(5).catch(() =>
				log("warn", "Warmup popular posts falhou")
			),
		];

		// Warmup categorias principais
		const mainCategories = ["f1", "nascar", "engines"];
		mainCategories.forEach((cat) => {
			warmupPromises.push(
				this.getPostsByCategory(cat).catch(() =>
					log("warn", `Warmup ${cat} falhou`)
				)
			);
		});

		try {
			await Promise.allSettled(warmupPromises);
			log("info", "✅ Warmup do cache concluído");
		} catch (error) {
			log("error", "Warmup falhou", { error: error.message });
		}
	},
};
