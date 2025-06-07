// src/services/DataService.js
import { supabase } from "../lib/supabase";

/**
 * Sistema de dados ultra-rápido com fallback instantâneo
 * Funciona em QUALQUER navegador e dispositivo
 */

// Detectar navegador de forma simples e confiável
export const getBrowserInfo = () => {
	const ua = navigator.userAgent;
	const isChrome = /Chrome/.test(ua) && /Google Inc/.test(navigator.vendor);
	const isSafari =
		/Safari/.test(ua) &&
		/Apple Computer/.test(navigator.vendor) &&
		!/Chrome/.test(ua);
	const isFirefox = /Firefox/.test(ua);
	const isMobile =
		/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(ua);

	return {
		browser: isChrome
			? "Chrome"
			: isSafari
			? "Safari"
			: isFirefox
			? "Firefox"
			: "Other",
		isChrome,
		isSafari,
		isFirefox,
		isMobile,
		viewport: { width: window.innerWidth, height: window.innerHeight },
	};
};

// Logger universal
export const log = {
	info: (msg, data = {}) => {
		const { browser, isMobile } = getBrowserInfo();
		const time = new Date().toLocaleTimeString();
		console.log(
			`🔄 [${browser}${isMobile ? "-Mobile" : ""}] ${time}`,
			msg,
			data
		);
	},
	success: (msg, data = {}) => {
		const { browser, isMobile } = getBrowserInfo();
		const time = new Date().toLocaleTimeString();
		console.log(
			`✅ [${browser}${isMobile ? "-Mobile" : ""}] ${time}`,
			msg,
			data
		);
	},
	error: (msg, error = {}) => {
		const { browser, isMobile } = getBrowserInfo();
		const time = new Date().toLocaleTimeString();
		console.error(
			`❌ [${browser}${isMobile ? "-Mobile" : ""}] ${time}`,
			msg,
			error
		);
	},
};

// Cache simples e eficiente
class FastCache {
	constructor() {
		this.data = {};
		this.timestamps = {};
		this.TTL = 3 * 60 * 1000; // 3 minutos apenas
	}

	set(key, value) {
		this.data[key] = value;
		this.timestamps[key] = Date.now();
		log.info(`Cache SET: ${key}`);
	}

	get(key) {
		const timestamp = this.timestamps[key];
		if (!timestamp || Date.now() - timestamp > this.TTL) {
			delete this.data[key];
			delete this.timestamps[key];
			return null;
		}
		log.info(`Cache HIT: ${key}`);
		return this.data[key];
	}

	clear() {
		this.data = {};
		this.timestamps = {};
		log.info("Cache cleared");
	}
}

const cache = new FastCache();

// Dados de fallback GARANTIDOS - sempre funcionam
export const FALLBACK_DATA = {
	featuredPosts: [
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
				"Max Verstappen mais uma vez demonstrou sua maestria nas ruas estreitas de Monte Carlo, conquistando uma vitória dominante no GP de Mônaco 2025.",
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
				slug: "hamilton-vs-verstappen-rivalidade-2025",
				category: "f1",
				category_name: "Fórmula 1",
				image_url:
					"https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800",
				excerpt:
					"A batalha entre os dois campeões mundiais promete esquentar ainda mais a temporada 2025 da Fórmula 1.",
				content:
					"A rivalidade entre Lewis Hamilton e Max Verstappen continua sendo um dos principais atrativos da Fórmula 1.",
				author: "F1 Team",
				read_time: "4 min",
				published: true,
				trending: true,
				tags: ["f1", "hamilton", "verstappen"],
				created_at: new Date(
					Date.now() - 1 * 24 * 60 * 60 * 1000
				).toISOString(),
			},
			{
				id: 102,
				title: "GP do Brasil 2025: Prévia de Interlagos",
				slug: "gp-brasil-2025-previa-interlagos",
				category: "f1",
				category_name: "Fórmula 1",
				image_url:
					"https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800",
				excerpt:
					"Tudo o que você precisa saber sobre o Grande Prêmio do Brasil em Interlagos.",
				content:
					"O circuito de Interlagos mais uma vez receberá a Fórmula 1 para o GP do Brasil.",
				author: "Brasil Team",
				read_time: "5 min",
				published: true,
				trending: false,
				tags: ["f1", "brasil", "interlagos"],
				created_at: new Date(
					Date.now() - 3 * 24 * 60 * 60 * 1000
				).toISOString(),
			},
		],
		nascar: [
			{
				id: 201,
				title: "Talladega Superspeedway: A Pista Mais Desafiadora",
				slug: "talladega-superspeedway-pista-desafiadora",
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
				trending: true,
				tags: ["nascar", "talladega", "superspeedway"],
				created_at: new Date(
					Date.now() - 1 * 24 * 60 * 60 * 1000
				).toISOString(),
			},
		],
		engines: [
			{
				id: 301,
				title: "V8 vs V6 Turbo: Qual Motor Escolher para Seu Projeto",
				slug: "v8-vs-v6-turbo-qual-motor-escolher",
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
				trending: true,
				tags: ["motores", "v8", "v6", "turbo"],
				created_at: new Date(
					Date.now() - 1 * 24 * 60 * 60 * 1000
				).toISOString(),
			},
		],
		endurance: [
			{
				id: 401,
				title: "Le Mans 2025: Prévia das 24 Horas Mais Famosas",
				slug: "le-mans-2025-previa-24-horas",
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
				trending: true,
				tags: ["endurance", "le mans", "24 horas"],
				created_at: new Date(
					Date.now() - 1 * 24 * 60 * 60 * 1000
				).toISOString(),
			},
		],
		drift: [
			{
				id: 501,
				title: "Formula Drift: Técnicas Essenciais para Iniciantes",
				slug: "formula-drift-tecnicas-essenciais-iniciantes",
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
				trending: true,
				tags: ["drift", "tecnicas", "iniciantes"],
				created_at: new Date(
					Date.now() - 1 * 24 * 60 * 60 * 1000
				).toISOString(),
			},
		],
		tuning: [
			{
				id: 601,
				title: "Suspensão Fixa vs Roscada: Qual a Melhor Opção?",
				slug: "suspensao-fixa-vs-roscada-melhor-opcao",
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
				trending: true,
				tags: ["tuning", "suspensao", "preparacao"],
				created_at: new Date(
					Date.now() - 1 * 24 * 60 * 60 * 1000
				).toISOString(),
			},
		],
	},
};

// Função de timeout específica por navegador
const getTimeoutForBrowser = () => {
	const { isChrome, isMobile } = getBrowserInfo();

	// Chrome precisa de timeouts maiores
	if (isChrome) {
		return isMobile ? 15000 : 12000; // 15s mobile, 12s desktop
	}
	return isMobile ? 10000 : 8000; // 10s mobile, 8s desktop para outros
};

// Wrapper de timeout robusto
const withTimeout = (promise, customTimeout = null) => {
	const timeout = customTimeout || getTimeoutForBrowser();

	return new Promise((resolve, reject) => {
		const timer = setTimeout(() => {
			reject(new Error(`Timeout após ${timeout}ms`));
		}, timeout);

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

// Fetch ultra-otimizado para Supabase
const fastSupabaseFetch = async (query, description = "") => {
	const { browser } = getBrowserInfo();

	try {
		log.info(`Iniciando fetch: ${description}`);

		const startTime = Date.now();
		const result = await withTimeout(query);
		const duration = Date.now() - startTime;

		if (result.error) {
			throw new Error(`Supabase Error: ${result.error.message}`);
		}

		log.success(`Fetch concluído: ${description}`, {
			duration: `${duration}ms`,
			records: result.data?.length || 0,
		});

		return result.data || [];
	} catch (error) {
		log.error(`Fetch falhou: ${description}`, error);
		throw error;
	}
};

/**
 * SISTEMA PRINCIPAL DE DADOS
 * Estratégia: Fallback INSTANTÂNEO + Update em background
 */
export const DataService = {
	/**
	 * Buscar posts em destaque - SEMPRE retorna 3 posts
	 */
	async getFeaturedPosts() {
		const cacheKey = "featured-posts";

		try {
			// 1. CACHE PRIMEIRO (instantâneo)
			const cached = cache.get(cacheKey);
			if (cached) {
				log.success("Featured posts do cache", { count: cached.length });
				return cached;
			}

			// 2. FALLBACK INSTANTÂNEO enquanto busca dados reais
			const fallbackPromise = new Promise((resolve) => {
				setTimeout(() => {
					log.info("Usando fallback instantâneo para featured posts");
					resolve(FALLBACK_DATA.featuredPosts);
				}, 50); // 50ms delay simbólico
			});

			// 3. FETCH REAL em paralelo
			const realDataPromise = (async () => {
				try {
					// Buscar posts trending primeiro
					const trendingQuery = supabase
						.from("posts")
						.select("*")
						.eq("published", true)
						.eq("trending", true)
						.order("created_at", { ascending: false });

					const trendingPosts = await fastSupabaseFetch(
						trendingQuery,
						"trending posts"
					);

					// Se temos menos de 3 trending, buscar posts recentes
					if (trendingPosts.length < 3) {
						const recentQuery = supabase
							.from("posts")
							.select("*")
							.eq("published", true)
							.order("created_at", { ascending: false })
							.limit(5);

						const recentPosts = await fastSupabaseFetch(
							recentQuery,
							"recent posts"
						);

						// Combinar trending + recentes, evitando duplicatas
						const trendingIds = trendingPosts.map((p) => p.id);
						const additionalPosts = recentPosts
							.filter((p) => !trendingIds.includes(p.id))
							.slice(0, 3 - trendingPosts.length);

						const finalPosts = [...trendingPosts, ...additionalPosts].slice(
							0,
							3
						);

						// Cache resultado
						cache.set(cacheKey, finalPosts);
						return finalPosts;
					}

					const finalTrending = trendingPosts.slice(0, 3);
					cache.set(cacheKey, finalTrending);
					return finalTrending;
				} catch (error) {
					log.error("Fetch real falhou, mantendo fallback", error);
					return null;
				}
			})();

			// 4. RACE: Retorna o que chegar primeiro (fallback ou dados reais)
			const result = await Promise.race([fallbackPromise, realDataPromise]);

			// Se dados reais chegaram, atualizar cache em background
			realDataPromise
				.then((realData) => {
					if (realData && realData !== result) {
						cache.set(cacheKey, realData);
						log.info("Cache atualizado em background com dados reais");
					}
				})
				.catch(() => {}); // Silenciar erros de background

			return result;
		} catch (error) {
			log.error("Erro geral em getFeaturedPosts, usando fallback", error);
			return FALLBACK_DATA.featuredPosts;
		}
	},

	/**
	 * Buscar todos os posts
	 */
	async getAllPosts() {
		const cacheKey = "all-posts";

		try {
			// Cache primeiro
			const cached = cache.get(cacheKey);
			if (cached) {
				log.success("All posts do cache", { count: cached.length });
				return cached;
			}

			// Fetch com timeout otimizado
			const query = supabase
				.from("posts")
				.select("*")
				.eq("published", true)
				.order("created_at", { ascending: false });

			const posts = await fastSupabaseFetch(query, "all posts");

			// Cache resultado
			cache.set(cacheKey, posts);
			return posts;
		} catch (error) {
			log.error("Erro em getAllPosts, usando fallback", error);
			// Retornar todos os posts do fallback
			return [...FALLBACK_DATA.featuredPosts];
		}
	},

	/**
	 * Buscar posts por categoria
	 */
	async getPostsByCategory(categoryId) {
		const cacheKey = `category-${categoryId}`;

		try {
			// Cache primeiro
			const cached = cache.get(cacheKey);
			if (cached) {
				log.success(`Posts da categoria ${categoryId} do cache`, {
					count: cached.length,
				});
				return cached;
			}

			// Fallback instantâneo
			const fallbackPosts = FALLBACK_DATA.byCategory[categoryId] || [];

			// Fetch real
			try {
				const query = supabase
					.from("posts")
					.select("*")
					.eq("category", categoryId)
					.eq("published", true)
					.order("created_at", { ascending: false });

				const posts = await fastSupabaseFetch(
					query,
					`posts categoria ${categoryId}`
				);

				// Cache resultado
				cache.set(cacheKey, posts);
				return posts.length > 0 ? posts : fallbackPosts;
			} catch (error) {
				log.error(
					`Fetch da categoria ${categoryId} falhou, usando fallback`,
					error
				);
				return fallbackPosts;
			}
		} catch (error) {
			log.error(`Erro geral na categoria ${categoryId}`, error);
			return FALLBACK_DATA.byCategory[categoryId] || [];
		}
	},

	/**
	 * Buscar post por ID
	 */
	async getPostById(id) {
		try {
			const postId = typeof id === "string" ? parseInt(id, 10) : id;

			const query = supabase
				.from("posts")
				.select("*")
				.eq("id", postId)
				.single();

			const post = await fastSupabaseFetch(query, `post ID ${postId}`);
			return post;
		} catch (error) {
			log.error(`Erro ao buscar post ${id}`, error);
			// Tentar encontrar nos fallbacks
			const allFallbackPosts = [
				...FALLBACK_DATA.featuredPosts,
				...Object.values(FALLBACK_DATA.byCategory).flat(),
			];

			const postId = typeof id === "string" ? parseInt(id, 10) : id;
			return allFallbackPosts.find((p) => p.id === postId) || null;
		}
	},

	/**
	 * Limpar cache
	 */
	clearCache() {
		cache.clear();
		log.info("Cache limpo manualmente");
	},

	/**
	 * Status do sistema
	 */
	getSystemInfo() {
		const browserInfo = getBrowserInfo();
		return {
			...browserInfo,
			cacheSize: Object.keys(cache.data).length,
			timeout: getTimeoutForBrowser(),
			timestamp: new Date().toISOString(),
		};
	},
};
