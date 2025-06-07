// src/utils/crossBrowserUtils.js
import { supabase } from "../lib/supabase";
import { useState } from "react";

/**
 * Detecta o navegador de forma robusta
 */
export const detectBrowser = () => {
	const userAgent = navigator.userAgent;
	const vendor = navigator.vendor;

	if (/Chrome/.test(userAgent) && /Google Inc/.test(vendor)) {
		return "Chrome";
	} else if (/Safari/.test(userAgent) && /Apple Computer/.test(vendor)) {
		return "Safari";
	} else if (/Firefox/.test(userAgent)) {
		return "Firefox";
	} else if (/Edge/.test(userAgent)) {
		return "Edge";
	} else {
		return "Unknown";
	}
};

/**
 * Detecta se é dispositivo móvel
 */
export const isMobile = () => {
	return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
		navigator.userAgent
	);
};

/**
 * Detecta a conexão do usuário
 */
export const getConnectionType = () => {
	if ("connection" in navigator) {
		const connection =
			navigator.connection ||
			navigator.mozConnection ||
			navigator.webkitConnection;
		return {
			effectiveType: connection?.effectiveType || "unknown",
			downlink: connection?.downlink || 0,
			rtt: connection?.rtt || 0,
		};
	}
	return { effectiveType: "unknown", downlink: 0, rtt: 0 };
};

/**
 * Timeout wrapper para Promises
 */
export const withTimeout = (promise, timeoutMs = 10000) => {
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

/**
 * Retry wrapper para funções async
 */
export const withRetry = async (fn, maxRetries = 3, delay = 1000) => {
	let lastError;

	for (let i = 0; i <= maxRetries; i++) {
		try {
			return await fn();
		} catch (error) {
			lastError = error;
			console.warn(`Tentativa ${i + 1} falhou:`, error.message);

			if (i < maxRetries) {
				await new Promise((resolve) => setTimeout(resolve, delay * (i + 1)));
			}
		}
	}

	throw lastError;
};

/**
 * Logger cross-browser com fallbacks
 */
export const logger = {
	info: (message, ...args) => {
		const browser = detectBrowser();
		const mobile = isMobile() ? "[MOBILE]" : "[DESKTOP]";
		const timestamp = new Date().toISOString().split("T")[1].split(".")[0];

		if (console && console.log) {
			console.log(`🔄 [${browser}] ${mobile} ${timestamp}`, message, ...args);
		}
	},

	error: (message, ...args) => {
		const browser = detectBrowser();
		const mobile = isMobile() ? "[MOBILE]" : "[DESKTOP]";
		const timestamp = new Date().toISOString().split("T")[1].split(".")[0];

		if (console && console.error) {
			console.error(`❌ [${browser}] ${mobile} ${timestamp}`, message, ...args);
		}
	},

	success: (message, ...args) => {
		const browser = detectBrowser();
		const mobile = isMobile() ? "[MOBILE]" : "[DESKTOP]";
		const timestamp = new Date().toISOString().split("T")[1].split(".")[0];

		if (console && console.log) {
			console.log(`✅ [${browser}] ${mobile} ${timestamp}`, message, ...args);
		}
	},
};

/**
 * Fetcher robusto para Supabase com fallbacks
 */
export const robustFetch = {
	/**
	 * Busca todos os posts com retry e timeout
	 */
	async getAllPosts(published = true) {
		return withRetry(
			async () => {
				logger.info("Iniciando busca de posts...", { published });

				let query = supabase
					.from("posts")
					.select("*")
					.order("created_at", { ascending: false });

				if (published !== null) {
					query = query.eq("published", published);
				}

				const result = await withTimeout(query, 8000);

				if (result.error) {
					throw new Error(`Supabase Error: ${result.error.message}`);
				}

				const posts = result.data || [];
				logger.success("Posts carregados com sucesso", { count: posts.length });
				return posts;
			},
			3,
			2000
		);
	},

	/**
	 * Busca posts por categoria com retry e timeout
	 */
	async getPostsByCategory(categoryId, published = true) {
		return withRetry(
			async () => {
				logger.info("Buscando posts por categoria...", {
					categoryId,
					published,
				});

				let query = supabase
					.from("posts")
					.select("*")
					.eq("category", categoryId)
					.order("created_at", { ascending: false });

				if (published !== null) {
					query = query.eq("published", published);
				}

				const result = await withTimeout(query, 8000);

				if (result.error) {
					throw new Error(`Supabase Error: ${result.error.message}`);
				}

				const posts = result.data || [];
				logger.success("Posts da categoria carregados", {
					categoryId,
					count: posts.length,
				});
				return posts;
			},
			3,
			2000
		);
	},

	/**
	 * Busca um post específico por ID
	 */
	async getPostById(id) {
		return withRetry(
			async () => {
				logger.info("Buscando post por ID...", { id });

				const postId = typeof id === "string" ? parseInt(id, 10) : id;

				const result = await withTimeout(
					supabase.from("posts").select("*").eq("id", postId).single(),
					8000
				);

				if (result.error) {
					throw new Error(`Supabase Error: ${result.error.message}`);
				}

				logger.success("Post encontrado", {
					id: postId,
					title: result.data?.title,
				});
				return result.data;
			},
			3,
			2000
		);
	},
};

/**
 * Cache simples em memória para melhor performance
 */
class SimpleCache {
	constructor() {
		this.cache = new Map();
		this.timestamps = new Map();
		this.TTL = 5 * 60 * 1000; // 5 minutos
	}

	set(key, value) {
		this.cache.set(key, value);
		this.timestamps.set(key, Date.now());
		logger.info("Cache SET", { key, size: this.cache.size });
	}

	get(key) {
		const timestamp = this.timestamps.get(key);
		if (!timestamp || Date.now() - timestamp > this.TTL) {
			this.cache.delete(key);
			this.timestamps.delete(key);
			logger.info("Cache MISS/EXPIRED", { key });
			return null;
		}

		const value = this.cache.get(key);
		logger.info("Cache HIT", { key });
		return value;
	}

	clear() {
		this.cache.clear();
		this.timestamps.clear();
		logger.info("Cache CLEARED");
	}
}

export const appCache = new SimpleCache();

/**
 * Fallback data para quando tudo falhar
 */
export const fallbackData = {
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
				"Max Verstappen mais uma vez demonstrou sua maestria nas ruas estreitas de Monte Carlo, conquistando uma vitória dominante no GP de Mônaco 2025. O piloto holandês, largando da pole position, controlou a corrida do início ao fim. A estratégia da Red Bull foi perfeita, com pit stops precisos e uma gestão exemplar dos pneus.",
			author: "Equipe TF",
			read_time: "5 min",
			published: true,
			trending: true,
			tags: ["f1", "verstappen", "monaco"],
			created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
		},
		{
			id: 2,
			title: "Novo Motor V8 Biturbo: A Revolução dos 1000HP",
			slug: "novo-motor-v8-biturbo-1000hp",
			category: "engines",
			category_name: "Motores",
			image_url:
				"https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?w=800",
			excerpt:
				"Análise completa do novo propulsor que está mudando o cenário do tuning com tecnologia de ponta.",
			content:
				"A indústria automotiva testemunha mais uma revolução com o lançamento do novo motor V8 biturbo que promete entregar incríveis 1000 cavalos de potência. Este propulsor representa o que há de mais avançado em engenharia automotiva.",
			author: "Tech Team",
			read_time: "8 min",
			published: true,
			trending: false,
			tags: ["motores", "v8", "biturbo"],
			created_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
		},
		{
			id: 3,
			title: "Daytona 500: A Batalha Épica que Definiu a Temporada",
			slug: "daytona-500-batalha-epica-temporada",
			category: "nascar",
			category_name: "NASCAR",
			image_url:
				"https://images.unsplash.com/photo-1566473965997-3de9c817e938?w=800",
			excerpt:
				"Relato completo da corrida mais emocionante do ano com ultrapassagens incríveis e estratégias audaciosas.",
			content:
				"A Daytona 500 de 2025 entrou para a história como uma das corridas mais emocionantes já disputadas no autódromo mais famoso da NASCAR. Com 200 voltas de pura adrenalina, a corrida teve de tudo: ultrapassagens espetaculares, estratégias arriscadas e um final de tirar o fôlego.",
			author: "Race Team",
			read_time: "6 min",
			published: true,
			trending: true,
			tags: ["nascar", "daytona", "500"],
			created_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
		},
	],

	categoriesMap: {
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

/**
 * Hook personalizado para posts com cache e fallbacks
 */
export const useRobustPosts = () => {
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState(null);

	const getAllPosts = async () => {
		try {
			setLoading(true);
			setError(null);

			// Verificar cache primeiro
			const cacheKey = "all-posts";
			const cached = appCache.get(cacheKey);
			if (cached) {
				logger.info("Usando posts do cache");
				setLoading(false);
				return cached;
			}

			// Buscar do banco
			const posts = await robustFetch.getAllPosts(true);
			appCache.set(cacheKey, posts);
			setLoading(false);
			return posts;
		} catch (error) {
			logger.error("Erro ao buscar posts, usando fallback", error);
			setError(error.message);
			setLoading(false);
			return fallbackData.posts;
		}
	};

	const getPostsByCategory = async (categoryId) => {
		try {
			setLoading(true);
			setError(null);

			// Verificar cache primeiro
			const cacheKey = `category-${categoryId}`;
			const cached = appCache.get(cacheKey);
			if (cached) {
				logger.info("Usando posts da categoria do cache", { categoryId });
				setLoading(false);
				return cached;
			}

			// Buscar do banco
			const posts = await robustFetch.getPostsByCategory(categoryId, true);
			appCache.set(cacheKey, posts);
			setLoading(false);
			return posts;
		} catch (error) {
			logger.error("Erro ao buscar posts da categoria, usando fallback", {
				categoryId,
				error,
			});
			setError(error.message);
			setLoading(false);
			return fallbackData.categoriesMap[categoryId] || [];
		}
	};

	const getFeaturedPosts = async (limit = 3) => {
		try {
			const allPosts = await getAllPosts();

			// Separar trending e recentes
			const trending = allPosts.filter((p) => p.trending);
			const recent = allPosts.filter((p) => !p.trending);

			// Garantir que temos 3 posts
			let featured = [...trending];
			if (featured.length < limit) {
				const needed = limit - featured.length;
				const additional = recent.slice(0, needed);
				featured = [...featured, ...additional];
			}

			return featured.slice(0, limit);
		} catch (error) {
			logger.error("Erro ao buscar posts em destaque, usando fallback", error);
			return fallbackData.posts.slice(0, limit);
		}
	};

	return {
		loading,
		error,
		getAllPosts,
		getPostsByCategory,
		getFeaturedPosts,
	};
};
