import {
	useQuery,
	useQueries,
	useMutation,
	useQueryClient,
	useSuspenseQuery,
	useInfiniteQuery,
} from "@tanstack/react-query";
import { FastDataService } from "../services/FastDataService";
import toast from "react-hot-toast";

/**
 * Hook Ultra-Rápido CORRIGIDO
 * - Garantias de arrays válidos
 * - Timeouts mais realistas
 * - Melhor error handling
 * - Fallbacks mais robustos
 */

// Query keys centralizados
export const QUERY_KEYS = {
	posts: {
		all: ["posts"],
		featured: ["posts", "featured"],
		byCategory: (category) => ["posts", "category", category],
		byId: (id) => ["posts", "detail", id],
		popular: (limit) => ["posts", "popular", limit],
		search: (query) => ["posts", "search", query],
	},
	categories: {
		all: ["categories"],
	},
};

// Configurações de cache MAIS ESTÁVEIS
const CACHE_CONFIG = {
	featured: {
		staleTime: 5 * 60 * 1000, // 5 minutos
		cacheTime: 30 * 60 * 1000, // 30 minutos
		refetchOnWindowFocus: false,
		refetchOnMount: false,
		retry: 2,
		retryDelay: 1000,
	},
	posts: {
		staleTime: 3 * 60 * 1000, // 3 minutos
		cacheTime: 20 * 60 * 1000, // 20 minutos
		refetchOnWindowFocus: false,
		retry: 2,
		retryDelay: 1000,
	},
	postDetail: {
		staleTime: 10 * 60 * 1000, // 10 minutos
		cacheTime: 60 * 60 * 1000, // 1 hora
		refetchOnWindowFocus: false,
		retry: 2,
		retryDelay: 1000,
	},
};

// Fallback GARANTIDO - sempre disponível
const GUARANTEED_FALLBACK_POSTS = [
	{
		id: 1,
		title: "GP de Mônaco 2025: Verstappen Domina nas Ruas Principescas",
		slug: "gp-monaco-2025-verstappen-domina",
		category: "f1",
		category_name: "Fórmula 1",
		image_url:
			"https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&h=600&fit=crop",
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
		updated_at: new Date().toISOString(),
	},
	{
		id: 2,
		title: "Daytona 500: A Batalha Épica que Definiu a Temporada",
		slug: "daytona-500-batalha-epica-temporada",
		category: "nascar",
		category_name: "NASCAR",
		image_url:
			"https://images.unsplash.com/photo-1566473965997-3de9c817e938?w=800&h=600&fit=crop",
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
		updated_at: new Date().toISOString(),
	},
	{
		id: 3,
		title: "Novo Motor V8 Biturbo: A Revolução dos 1000HP",
		slug: "novo-motor-v8-biturbo-1000hp",
		category: "engines",
		category_name: "Motores",
		image_url:
			"https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?w=800&h=600&fit=crop",
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
		updated_at: new Date().toISOString(),
	},
];

/**
 * Função para garantir array válido
 */
const ensureValidArray = (data, fallback = []) => {
	if (Array.isArray(data) && data.length >= 0) {
		return data;
	}
	console.warn(
		"🔧 ensureValidArray: Data não é array válido, usando fallback",
		{
			dataType: typeof data,
			isArray: Array.isArray(data),
			fallbackLength: fallback.length,
		}
	);
	return Array.isArray(fallback) ? fallback : [];
};

/**
 * Hook principal para posts em destaque - SEM SUSPENSE
 * Mudando para hook normal para melhor error handling
 */
export const useFeaturedPosts = () => {
	return useQuery({
		queryKey: QUERY_KEYS.posts.featured,
		queryFn: async () => {
			try {
				console.log("🚀 useFeaturedPosts: Iniciando...");
				const data = await FastDataService.getFeaturedPosts();

				const validData = ensureValidArray(
					data,
					GUARANTEED_FALLBACK_POSTS.slice(0, 3)
				);
				console.log("✅ useFeaturedPosts: Sucesso", {
					count: validData.length,
				});

				return validData;
			} catch (error) {
				console.error("❌ useFeaturedPosts: Erro", error);
				return GUARANTEED_FALLBACK_POSTS.slice(0, 3);
			}
		},
		...CACHE_CONFIG.featured,
		// SEMPRE retornar array válido
		select: (data) =>
			ensureValidArray(data, GUARANTEED_FALLBACK_POSTS.slice(0, 3)),
		// Se falhar, usar placeholderData
		placeholderData: GUARANTEED_FALLBACK_POSTS.slice(0, 3),
		onError: (error) => {
			console.error("useFeaturedPosts onError:", error);
		},
	});
};

/**
 * Hook para todos os posts - GARANTIDO
 */
export const useAllPosts = (options = {}) => {
	const queryClient = useQueryClient();

	const query = useQuery({
		queryKey: QUERY_KEYS.posts.all,
		queryFn: async () => {
			try {
				console.log("🚀 useAllPosts: Iniciando fetch...");
				const data = await FastDataService.getAllPosts();

				const validData = ensureValidArray(data, GUARANTEED_FALLBACK_POSTS);
				console.log("✅ useAllPosts: Sucesso", { count: validData.length });

				return validData;
			} catch (error) {
				console.error("❌ useAllPosts: Erro", error);
				return [...GUARANTEED_FALLBACK_POSTS];
			}
		},
		...CACHE_CONFIG.posts,
		// TRIPLA PROTEÇÃO contra undefined
		select: (data) => {
			const validData = ensureValidArray(data, GUARANTEED_FALLBACK_POSTS);
			return validData;
		},
		placeholderData: [...GUARANTEED_FALLBACK_POSTS],
		onSuccess: (data) => {
			const validData = ensureValidArray(data);
			if (validData.length > 0) {
				// Prefetch posts individuais APENAS se data for válida
				validData.slice(0, 3).forEach((post) => {
					if (post && post.id) {
						queryClient.prefetchQuery({
							queryKey: QUERY_KEYS.posts.byId(post.id),
							queryFn: () => FastDataService.getPostById(post.id),
							...CACHE_CONFIG.postDetail,
						});
					}
				});
			}
		},
		onError: (error) => {
			console.error("useAllPosts onError:", error);
		},
		...options,
	});

	// GARANTIR que data NUNCA seja undefined
	return {
		...query,
		data: ensureValidArray(query.data, GUARANTEED_FALLBACK_POSTS),
	};
};

/**
 * Hook para posts por categoria - SUPER SEGURO
 */
export const usePostsByCategory = (categoryId, options = {}) => {
	const queryClient = useQueryClient();

	return useQuery({
		queryKey: QUERY_KEYS.posts.byCategory(categoryId),
		queryFn: async () => {
			try {
				console.log(`🚀 usePostsByCategory: Buscando ${categoryId}...`);
				const data = await FastDataService.getPostsByCategory(categoryId);

				// Filtrar fallback por categoria se API falhar
				const fallbackForCategory = GUARANTEED_FALLBACK_POSTS.filter(
					(p) => p.category === categoryId
				);

				const validData = ensureValidArray(data, fallbackForCategory);
				console.log(`✅ usePostsByCategory: ${categoryId} sucesso`, {
					count: validData.length,
				});

				return validData;
			} catch (error) {
				console.error(`❌ usePostsByCategory: ${categoryId} erro`, error);
				// Sempre retornar array, mesmo que vazio
				return GUARANTEED_FALLBACK_POSTS.filter(
					(p) => p.category === categoryId
				);
			}
		},
		enabled: !!categoryId && typeof categoryId === "string",
		...CACHE_CONFIG.posts,
		select: (data) => ensureValidArray(data, []),
		placeholderData: [],
		onSuccess: (data) => {
			const validData = ensureValidArray(data);
			if (validData.length > 0) {
				// Prefetch primeiros posts APENAS se válidos
				validData.slice(0, 2).forEach((post) => {
					if (post && post.id) {
						queryClient.prefetchQuery({
							queryKey: QUERY_KEYS.posts.byId(post.id),
							queryFn: () => FastDataService.getPostById(post.id),
							...CACHE_CONFIG.postDetail,
						});
					}
				});
			}
		},
		onError: (error) => {
			console.error(`usePostsByCategory ${categoryId} onError:`, error);
		},
		...options,
	});
};

/**
 * Hook para post individual - MELHORADO
 */
export const usePostById = (id, options = {}) => {
	return useQuery({
		queryKey: QUERY_KEYS.posts.byId(id),
		queryFn: async () => {
			try {
				console.log(`🚀 usePostById: Buscando post ${id}...`);

				if (!id) {
					throw new Error("ID não fornecido");
				}

				const data = await FastDataService.getPostById(id);

				if (!data) {
					// Tentar fallback
					const postId = typeof id === "string" ? parseInt(id, 10) : id;
					const fallbackPost = GUARANTEED_FALLBACK_POSTS.find(
						(p) => p.id === postId
					);

					if (fallbackPost) {
						console.log(`🔧 usePostById: Usando fallback para ${id}`);
						return fallbackPost;
					}

					throw new Error("Post não encontrado");
				}

				console.log(`✅ usePostById: Post ${id} encontrado`);
				return data;
			} catch (error) {
				console.error(`❌ usePostById: Erro para ${id}`, error);

				// Última tentativa com fallback
				const postId = typeof id === "string" ? parseInt(id, 10) : id;
				const fallbackPost = GUARANTEED_FALLBACK_POSTS.find(
					(p) => p.id === postId
				);

				if (fallbackPost) {
					return fallbackPost;
				}

				// Se não encontrar nem no fallback, rejeitar
				throw error;
			}
		},
		enabled: !!id,
		...CACHE_CONFIG.postDetail,
		retry: (failureCount, error) => {
			if (error?.message?.includes("não encontrado")) return false;
			return failureCount < 1; // Apenas 1 retry
		},
		onError: (error) => {
			console.error(`usePostById ${id} onError:`, error);
		},
		...options,
	});
};

/**
 * Hook para post individual com Suspense - CORRIGIDO
 */
export const usePostByIdSuspense = (id) => {
	return useSuspenseQuery({
		queryKey: QUERY_KEYS.posts.byId(id),
		queryFn: async () => {
			try {
				if (!id) {
					throw new Error("Post ID não fornecido");
				}

				const data = await FastDataService.getPostById(id);

				if (!data) {
					// Tentar fallback antes de falhar
					const postId = typeof id === "string" ? parseInt(id, 10) : id;
					const fallbackPost = GUARANTEED_FALLBACK_POSTS.find(
						(p) => p.id === postId
					);

					if (fallbackPost) {
						return fallbackPost;
					}

					throw new Error("Post not found");
				}

				return data;
			} catch (error) {
				console.error(`usePostByIdSuspense error for ${id}:`, error);
				throw error;
			}
		},
		...CACHE_CONFIG.postDetail,
	});
};

/**
 * Hook para posts populares - SEGURO
 */
export const usePopularPosts = (limit = 5) => {
	return useQuery({
		queryKey: QUERY_KEYS.posts.popular(limit),
		queryFn: async () => {
			try {
				const data = await FastDataService.getPopularPosts(limit);
				const validData = ensureValidArray(
					data,
					GUARANTEED_FALLBACK_POSTS.slice(0, limit)
				);
				return validData;
			} catch (error) {
				console.error("usePopularPosts error:", error);
				return GUARANTEED_FALLBACK_POSTS.slice(0, limit);
			}
		},
		...CACHE_CONFIG.featured,
		select: (data) => ensureValidArray(data, []),
		placeholderData: GUARANTEED_FALLBACK_POSTS.slice(0, limit),
	});
};

/**
 * Hook para busca - SEGURO
 */
export const useSearchPosts = (query, options = {}) => {
	return useQuery({
		queryKey: QUERY_KEYS.posts.search(query),
		queryFn: async () => {
			try {
				if (!query || query.length < 2) {
					return [];
				}

				const data = await FastDataService.searchPosts(query);
				return ensureValidArray(data, []);
			} catch (error) {
				console.error("useSearchPosts error:", error);
				return [];
			}
		},
		enabled: !!query && query.length >= 2,
		staleTime: 5 * 60 * 1000,
		cacheTime: 10 * 60 * 1000,
		select: (data) => ensureValidArray(data, []),
		placeholderData: [],
		...options,
	});
};

/**
 * Operações CRUD Admin - MELHORADAS
 */
export const useCreatePost = () => {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: FastDataService.createPost,
		onMutate: async (newPost) => {
			await queryClient.cancelQueries({ queryKey: QUERY_KEYS.posts.all });

			const previousPosts = queryClient.getQueryData(QUERY_KEYS.posts.all);
			const validPreviousPosts = ensureValidArray(previousPosts, []);

			const optimisticPost = {
				...newPost,
				id: Date.now(),
				created_at: new Date().toISOString(),
				updated_at: new Date().toISOString(),
			};

			queryClient.setQueryData(QUERY_KEYS.posts.all, [
				optimisticPost,
				...validPreviousPosts,
			]);

			return { previousPosts: validPreviousPosts };
		},
		onError: (err, newPost, context) => {
			if (context?.previousPosts) {
				queryClient.setQueryData(QUERY_KEYS.posts.all, context.previousPosts);
			}
			toast.error("Erro ao criar post: " + err.message);
		},
		onSuccess: () => {
			toast.success("Post criado com sucesso!");
		},
		onSettled: () => {
			queryClient.invalidateQueries({ queryKey: QUERY_KEYS.posts.all });
			queryClient.invalidateQueries({ queryKey: QUERY_KEYS.posts.featured });
		},
	});
};

export const useUpdatePost = () => {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: ({ id, ...postData }) =>
			FastDataService.updatePost(id, postData),
		onSuccess: () => {
			toast.success("Post atualizado com sucesso!");
		},
		onError: (err) => {
			toast.error("Erro ao atualizar post: " + err.message);
		},
		onSettled: (data, error, { id }) => {
			queryClient.invalidateQueries({ queryKey: QUERY_KEYS.posts.byId(id) });
			queryClient.invalidateQueries({ queryKey: QUERY_KEYS.posts.all });
			queryClient.invalidateQueries({ queryKey: QUERY_KEYS.posts.featured });
		},
	});
};

export const useDeletePost = () => {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: FastDataService.deletePost,
		onSuccess: () => {
			toast.success("Post deletado com sucesso!");
		},
		onError: (err) => {
			toast.error("Erro ao deletar post: " + err.message);
		},
		onSettled: (data, error, id) => {
			queryClient.removeQueries({ queryKey: QUERY_KEYS.posts.byId(id) });
			queryClient.invalidateQueries({ queryKey: QUERY_KEYS.posts.all });
			queryClient.invalidateQueries({ queryKey: QUERY_KEYS.posts.featured });
		},
	});
};

/**
 * Hook para prefetching - SEGURO
 */
export const usePrefetch = () => {
	const queryClient = useQueryClient();

	const prefetchPost = (id) => {
		if (!id) return;

		queryClient.prefetchQuery({
			queryKey: QUERY_KEYS.posts.byId(id),
			queryFn: () => FastDataService.getPostById(id),
			...CACHE_CONFIG.postDetail,
		});
	};

	const prefetchCategory = (categoryId) => {
		if (!categoryId) return;

		queryClient.prefetchQuery({
			queryKey: QUERY_KEYS.posts.byCategory(categoryId),
			queryFn: () => FastDataService.getPostsByCategory(categoryId),
			...CACHE_CONFIG.posts,
		});
	};

	return {
		prefetchPost,
		prefetchCategory,
	};
};

/**
 * Hook para warmup do cache - OTIMIZADO
 */
export const useWarmupCache = () => {
	const queryClient = useQueryClient();

	const warmup = async () => {
		console.log("🔥 Starting safe cache warmup...");

		const queries = [
			{
				queryKey: QUERY_KEYS.posts.featured,
				queryFn: () =>
					FastDataService.getFeaturedPosts().catch(() =>
						GUARANTEED_FALLBACK_POSTS.slice(0, 3)
					),
			},
			{
				queryKey: QUERY_KEYS.posts.all,
				queryFn: () =>
					FastDataService.getAllPosts().catch(() => [
						...GUARANTEED_FALLBACK_POSTS,
					]),
			},
		];

		try {
			await Promise.allSettled(
				queries.map((query) => queryClient.prefetchQuery(query))
			);
			console.log("✅ Safe cache warmup completed");
		} catch (error) {
			console.error("❌ Cache warmup failed:", error);
		}
	};

	return { warmup };
};

/**
 * Hook para estatísticas de cache
 */
export const useCacheStats = () => {
	const queryClient = useQueryClient();

	const getStats = () => {
		const cache = queryClient.getQueryCache();
		const queries = cache.getAll();

		return {
			totalQueries: queries.length,
			freshQueries: queries.filter((q) => q.isStale() === false).length,
			staleQueries: queries.filter((q) => q.isStale() === true).length,
			errorQueries: queries.filter((q) => q.state.status === "error").length,
			loadingQueries: queries.filter((q) => q.state.status === "loading")
				.length,
		};
	};

	const clearCache = () => {
		queryClient.clear();
		toast.success("Cache limpo com sucesso!");
	};

	return {
		getStats,
		clearCache,
	};
};
