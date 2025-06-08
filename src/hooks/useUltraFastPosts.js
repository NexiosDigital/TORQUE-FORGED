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
 * Hook Ultra-Rápido com TanStack Query
 * - Cache inteligente com stale-while-revalidate
 * - Prefetching automático
 * - Updates otimistas
 * - Suspense support
 * - Background sync
 * - Garantia de arrays válidos
 */

// Query keys centralizados para cache consistency
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

// Configurações de cache otimizadas
const CACHE_CONFIG = {
	// Posts em destaque - cache mais agressivo
	featured: {
		staleTime: 3 * 60 * 1000, // 3 minutos fresh
		cacheTime: 15 * 60 * 1000, // 15 minutos em cache
		refetchOnWindowFocus: false,
		refetchOnMount: false,
	},

	// Posts gerais - cache moderado
	posts: {
		staleTime: 2 * 60 * 1000, // 2 minutos fresh
		cacheTime: 10 * 60 * 1000, // 10 minutos em cache
		refetchOnWindowFocus: false,
	},

	// Post individual - cache longo
	postDetail: {
		staleTime: 5 * 60 * 1000, // 5 minutos fresh
		cacheTime: 30 * 60 * 1000, // 30 minutos em cache
		refetchOnWindowFocus: false,
	},

	// Admin operations - sem cache
	admin: {
		staleTime: 0,
		cacheTime: 0,
		refetchOnWindowFocus: true,
	},
};

// Fallback data para casos de erro
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

/**
 * Hook principal para posts em destaque
 * Usa Suspense para carregamento instantâneo
 */
export const useFeaturedPosts = () => {
	return useSuspenseQuery({
		queryKey: QUERY_KEYS.posts.featured,
		queryFn: async () => {
			try {
				const data = await FastDataService.getFeaturedPosts();
				return Array.isArray(data) ? data : FALLBACK_POSTS.slice(0, 3);
			} catch (error) {
				console.error("Featured posts error:", error);
				return FALLBACK_POSTS.slice(0, 3);
			}
		},
		...CACHE_CONFIG.featured,
	});
};

/**
 * Hook para todos os posts com prefetching
 */
export const useAllPosts = (options = {}) => {
	const queryClient = useQueryClient();

	const query = useQuery({
		queryKey: QUERY_KEYS.posts.all,
		queryFn: async () => {
			try {
				console.log("⚡ useAllPosts: Iniciando fetch...");
				const data = await FastDataService.getAllPosts();
				console.log("✅ useAllPosts received data:", {
					isArray: Array.isArray(data),
					length: data?.length,
					type: typeof data,
				});

				// Garantir que sempre retorna um array válido
				if (!Array.isArray(data)) {
					console.warn("⚠️ useAllPosts: data não é array, usando fallback");
					return FALLBACK_POSTS;
				}

				if (data.length === 0) {
					console.warn("⚠️ useAllPosts: array vazio, usando fallback");
					return FALLBACK_POSTS;
				}

				console.log("✅ useAllPosts: Retornando", data.length, "posts");
				return data;
			} catch (error) {
				console.error("❌ useAllPosts error:", error);
				return FALLBACK_POSTS;
			}
		},
		...CACHE_CONFIG.posts,
		select: (data) => {
			// Garantir que o resultado é sempre um array
			return Array.isArray(data) ? data : FALLBACK_POSTS;
		},
		onSuccess: (data) => {
			// Prefetch posts individuais em background
			if (Array.isArray(data)) {
				data.slice(0, 5).forEach((post) => {
					queryClient.prefetchQuery({
						queryKey: QUERY_KEYS.posts.byId(post.id),
						queryFn: () => FastDataService.getPostById(post.id),
						...CACHE_CONFIG.postDetail,
					});
				});
			}
		},
		onError: (error) => {
			console.error("useAllPosts onError:", error);
		},
		...options,
	});

	// Garantir que data sempre é um array
	return {
		...query,
		data: Array.isArray(query.data) ? query.data : [],
	};
};

/**
 * Hook para posts por categoria com prefetching inteligente
 */
export const usePostsByCategory = (categoryId, options = {}) => {
	const queryClient = useQueryClient();

	return useQuery({
		queryKey: QUERY_KEYS.posts.byCategory(categoryId),
		queryFn: async () => {
			try {
				const data = await FastDataService.getPostsByCategory(categoryId);

				// Garantir que sempre retorna um array válido
				if (!Array.isArray(data)) {
					const fallbackCategory = FALLBACK_POSTS.filter(
						(p) => p.category === categoryId
					);
					return fallbackCategory.length > 0 ? fallbackCategory : [];
				}

				return data;
			} catch (error) {
				console.error(`usePostsByCategory error for ${categoryId}:`, error);
				const fallbackCategory = FALLBACK_POSTS.filter(
					(p) => p.category === categoryId
				);
				return fallbackCategory.length > 0 ? fallbackCategory : [];
			}
		},
		enabled: !!categoryId,
		...CACHE_CONFIG.posts,
		select: (data) => {
			// Garantir que o resultado é sempre um array
			return Array.isArray(data) ? data : [];
		},
		onSuccess: (data) => {
			// Prefetch primeiros 3 posts da categoria
			if (Array.isArray(data)) {
				data.slice(0, 3).forEach((post) => {
					queryClient.prefetchQuery({
						queryKey: QUERY_KEYS.posts.byId(post.id),
						queryFn: () => FastDataService.getPostById(post.id),
						...CACHE_CONFIG.postDetail,
					});
				});
			}
		},
		...options,
	});
};

/**
 * Hook para post individual com cache longo
 */
export const usePostById = (id, options = {}) => {
	return useQuery({
		queryKey: QUERY_KEYS.posts.byId(id),
		queryFn: async () => {
			try {
				const data = await FastDataService.getPostById(id);

				if (!data) {
					// Tentar fallback
					const postId = typeof id === "string" ? parseInt(id, 10) : id;
					const fallbackPost = FALLBACK_POSTS.find((p) => p.id === postId);
					return fallbackPost || null;
				}

				return data;
			} catch (error) {
				console.error(`usePostById error for ${id}:`, error);

				// Tentar fallback
				const postId = typeof id === "string" ? parseInt(id, 10) : id;
				const fallbackPost = FALLBACK_POSTS.find((p) => p.id === postId);
				return fallbackPost || null;
			}
		},
		enabled: !!id,
		...CACHE_CONFIG.postDetail,
		retry: (failureCount, error) => {
			// Não retry para 404
			if (error?.message?.includes("not found")) return false;
			return failureCount < 2;
		},
		...options,
	});
};

/**
 * Hook para post individual com Suspense
 */
export const usePostByIdSuspense = (id) => {
	return useSuspenseQuery({
		queryKey: QUERY_KEYS.posts.byId(id),
		queryFn: async () => {
			try {
				const data = await FastDataService.getPostById(id);

				if (!data) {
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
 * Hook para posts populares
 */
export const usePopularPosts = (limit = 5) => {
	return useQuery({
		queryKey: QUERY_KEYS.posts.popular(limit),
		queryFn: async () => {
			try {
				const data = await FastDataService.getPopularPosts(limit);
				return Array.isArray(data) ? data : FALLBACK_POSTS.slice(0, limit);
			} catch (error) {
				console.error("usePopularPosts error:", error);
				return FALLBACK_POSTS.slice(0, limit);
			}
		},
		...CACHE_CONFIG.featured,
		select: (data) => {
			return Array.isArray(data) ? data : [];
		},
	});
};

/**
 * Hook para busca com debounce
 */
export const useSearchPosts = (query, options = {}) => {
	return useQuery({
		queryKey: QUERY_KEYS.posts.search(query),
		queryFn: async () => {
			try {
				const data = await FastDataService.searchPosts(query);
				return Array.isArray(data) ? data : [];
			} catch (error) {
				console.error("useSearchPosts error:", error);
				return [];
			}
		},
		enabled: !!query && query.length >= 2,
		staleTime: 5 * 60 * 1000, // 5 minutos
		cacheTime: 10 * 60 * 1000, // 10 minutos
		select: (data) => {
			return Array.isArray(data) ? data : [];
		},
		...options,
	});
};

/**
 * Hook para carregar múltiplas categorias em paralelo
 */
export const useMultipleCategories = (categories = []) => {
	return useQueries({
		queries: categories.map((categoryId) => ({
			queryKey: QUERY_KEYS.posts.byCategory(categoryId),
			queryFn: async () => {
				try {
					const data = await FastDataService.getPostsByCategory(categoryId);
					return Array.isArray(data) ? data : [];
				} catch (error) {
					console.error(
						`useMultipleCategories error for ${categoryId}:`,
						error
					);
					return [];
				}
			},
			...CACHE_CONFIG.posts,
		})),
	});
};

/**
 * Hook para infinite scroll (para implementar futuramente)
 */
export const useInfinitePosts = (categoryId = null) => {
	return useInfiniteQuery({
		queryKey: categoryId
			? QUERY_KEYS.posts.byCategory(categoryId)
			: QUERY_KEYS.posts.all,
		queryFn: async ({ pageParam = 0 }) => {
			try {
				const data = categoryId
					? await FastDataService.getPostsByCategory(
							categoryId,
							12,
							pageParam * 12
					  )
					: await FastDataService.getAllPosts(12, pageParam * 12);

				return Array.isArray(data) ? data : [];
			} catch (error) {
				console.error("useInfinitePosts error:", error);
				return [];
			}
		},
		getNextPageParam: (lastPage, pages) => {
			return Array.isArray(lastPage) && lastPage.length === 12
				? pages.length
				: undefined;
		},
		...CACHE_CONFIG.posts,
	});
};

/**
 * Hooks para operações CRUD Admin
 */
export const useCreatePost = () => {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: FastDataService.createPost,
		onMutate: async (newPost) => {
			// Cancel ongoing refetches
			await queryClient.cancelQueries({ queryKey: QUERY_KEYS.posts.all });

			// Snapshot current value
			const previousPosts = queryClient.getQueryData(QUERY_KEYS.posts.all);

			// Optimistic update
			if (Array.isArray(previousPosts)) {
				queryClient.setQueryData(QUERY_KEYS.posts.all, (old) => [
					{ ...newPost, id: Date.now(), created_at: new Date().toISOString() },
					...(Array.isArray(old) ? old : []),
				]);
			}

			return { previousPosts };
		},
		onError: (err, newPost, context) => {
			// Rollback on error
			if (context?.previousPosts) {
				queryClient.setQueryData(QUERY_KEYS.posts.all, context.previousPosts);
			}
			toast.error("Erro ao criar post: " + err.message);
		},
		onSuccess: (data) => {
			toast.success("Post criado com sucesso!");
		},
		onSettled: () => {
			// Always refetch after error or success
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
		onMutate: async ({ id, ...newData }) => {
			// Cancel ongoing refetches
			await queryClient.cancelQueries({ queryKey: QUERY_KEYS.posts.byId(id) });

			// Snapshot current value
			const previousPost = queryClient.getQueryData(QUERY_KEYS.posts.byId(id));

			// Optimistic update
			if (previousPost) {
				queryClient.setQueryData(QUERY_KEYS.posts.byId(id), (old) => ({
					...old,
					...newData,
					updated_at: new Date().toISOString(),
				}));
			}

			return { previousPost, id };
		},
		onError: (err, variables, context) => {
			// Rollback on error
			if (context?.previousPost) {
				queryClient.setQueryData(
					QUERY_KEYS.posts.byId(context.id),
					context.previousPost
				);
			}
			toast.error("Erro ao atualizar post: " + err.message);
		},
		onSuccess: () => {
			toast.success("Post atualizado com sucesso!");
		},
		onSettled: (data, error, { id }) => {
			// Invalidate all related queries
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
		onMutate: async (id) => {
			// Cancel ongoing refetches
			await queryClient.cancelQueries({ queryKey: QUERY_KEYS.posts.all });

			// Snapshot current value
			const previousPosts = queryClient.getQueryData(QUERY_KEYS.posts.all);

			// Optimistic update - remove post from list
			if (Array.isArray(previousPosts)) {
				queryClient.setQueryData(QUERY_KEYS.posts.all, (old) =>
					Array.isArray(old) ? old.filter((post) => post.id !== id) : []
				);
			}

			return { previousPosts, id };
		},
		onError: (err, id, context) => {
			// Rollback on error
			if (context?.previousPosts) {
				queryClient.setQueryData(QUERY_KEYS.posts.all, context.previousPosts);
			}
			toast.error("Erro ao deletar post: " + err.message);
		},
		onSuccess: () => {
			toast.success("Post deletado com sucesso!");
		},
		onSettled: (data, error, id) => {
			// Remove from cache and invalidate
			queryClient.removeQueries({ queryKey: QUERY_KEYS.posts.byId(id) });
			queryClient.invalidateQueries({ queryKey: QUERY_KEYS.posts.all });
			queryClient.invalidateQueries({ queryKey: QUERY_KEYS.posts.featured });
		},
	});
};

/**
 * Hook para prefetching inteligente
 */
export const usePrefetch = () => {
	const queryClient = useQueryClient();

	const prefetchPost = (id) => {
		queryClient.prefetchQuery({
			queryKey: QUERY_KEYS.posts.byId(id),
			queryFn: () => FastDataService.getPostById(id),
			...CACHE_CONFIG.postDetail,
		});
	};

	const prefetchCategory = (categoryId) => {
		queryClient.prefetchQuery({
			queryKey: QUERY_KEYS.posts.byCategory(categoryId),
			queryFn: () => FastDataService.getPostsByCategory(categoryId),
			...CACHE_CONFIG.posts,
		});
	};

	const prefetchSearch = (query) => {
		if (query && query.length >= 2) {
			queryClient.prefetchQuery({
				queryKey: QUERY_KEYS.posts.search(query),
				queryFn: () => FastDataService.searchPosts(query),
				staleTime: 5 * 60 * 1000,
			});
		}
	};

	return {
		prefetchPost,
		prefetchCategory,
		prefetchSearch,
	};
};

/**
 * Hook para warmup do cache
 */
export const useWarmupCache = () => {
	const queryClient = useQueryClient();

	const warmup = async () => {
		console.log("🔥 Starting cache warmup...");

		// Prefetch dados críticos
		const criticalQueries = [
			{
				queryKey: QUERY_KEYS.posts.featured,
				queryFn: FastDataService.getFeaturedPosts,
				...CACHE_CONFIG.featured,
			},
			{
				queryKey: QUERY_KEYS.posts.all,
				queryFn: FastDataService.getAllPosts,
				...CACHE_CONFIG.posts,
			},
			{
				queryKey: QUERY_KEYS.posts.popular(5),
				queryFn: () => FastDataService.getPopularPosts(5),
				...CACHE_CONFIG.featured,
			},
		];

		// Prefetch categorias principais
		const mainCategories = ["f1", "nascar", "engines", "drift"];
		mainCategories.forEach((category) => {
			criticalQueries.push({
				queryKey: QUERY_KEYS.posts.byCategory(category),
				queryFn: () => FastDataService.getPostsByCategory(category),
				...CACHE_CONFIG.posts,
			});
		});

		try {
			await Promise.allSettled(
				criticalQueries.map((query) => queryClient.prefetchQuery(query))
			);
			console.log("✅ Cache warmup completed");
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
			fastDataStats: FastDataService.getCacheStats(),
		};
	};

	const clearCache = () => {
		queryClient.clear();
		FastDataService.clearCache();
		toast.success("Cache limpo com sucesso!");
	};

	return {
		getStats,
		clearCache,
	};
};
