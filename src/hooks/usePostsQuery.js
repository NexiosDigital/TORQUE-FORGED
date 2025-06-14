import {
	useQuery,
	useMutation,
	useQueryClient,
	useSuspenseQuery,
} from "@tanstack/react-query";
import { PostService } from "../services/PostService";
import toast from "react-hot-toast";
import { useAuth } from "../contexts/AuthContext";

// Query keys INALTERADOS (compatibilidade total)
export const QUERY_KEYS = {
	// Posts públicos - SEMPRE as mesmas keys independente de auth
	public: {
		posts: ["public", "posts"],
		featured: ["public", "posts", "featured"],
		byCategory: (category) => ["public", "posts", "category", category],
		byId: (id) => ["public", "posts", "detail", id],
		search: (query) => ["public", "posts", "search", query],
		categories: ["public", "categories"],
	},
	// Posts admin - SEMPRE separados
	admin: {
		posts: ["admin", "posts"],
		byId: (id) => ["admin", "posts", "detail", id],
	},
};

// Configurações ULTRA AGRESSIVAS para carregamento instantâneo
const ULTRA_CACHE_CONFIG = {
	staleTime: 30 * 60 * 1000, // 30 minutos - dados ficam fresh por muito tempo
	gcTime: 2 * 60 * 60 * 1000, // 2 horas - manter em memória por muito tempo
	refetchOnWindowFocus: false, // NUNCA refetch ao focar
	refetchOnMount: false, // NUNCA refetch ao montar - usar cache
	refetchOnReconnect: false, // NUNCA refetch ao reconectar
	refetchInterval: false, // NUNCA refetch automático
	networkMode: "offlineFirst", // Priorizar cache offline
	retry: false, // SEM retry para ser mais rápido
	retryOnMount: false,
	retryDelay: () => 0,
};

const FEATURED_CACHE_CONFIG = {
	staleTime: 45 * 60 * 1000, // 45 minutos - featured posts mudam menos
	gcTime: 3 * 60 * 60 * 1000, // 3 horas
	refetchOnWindowFocus: false,
	refetchOnMount: false,
	refetchOnReconnect: false,
	refetchInterval: false,
	networkMode: "offlineFirst",
	retry: false,
};

const CATEGORIES_CACHE_CONFIG = {
	staleTime: 2 * 60 * 60 * 1000, // 2 horas - categorias quase nunca mudam
	gcTime: 6 * 60 * 60 * 1000, // 6 horas
	refetchOnWindowFocus: false,
	refetchOnMount: false,
	refetchOnReconnect: false,
	refetchInterval: false,
	networkMode: "offlineFirst",
	retry: false,
};

const POST_DETAIL_CACHE_CONFIG = {
	staleTime: 60 * 60 * 1000, // 1 hora para posts individuais
	gcTime: 4 * 60 * 60 * 1000, // 4 horas
	refetchOnWindowFocus: false,
	refetchOnMount: false,
	refetchOnReconnect: false,
	refetchInterval: false,
	networkMode: "offlineFirst",
	retry: false,
};

const ADMIN_CACHE_CONFIG = {
	staleTime: 30 * 60 * 1000, // 30 minutos para admin
	gcTime: 2 * 60 * 60 * 1000, // 2 horas
	refetchOnWindowFocus: false,
	refetchOnMount: false,
	refetchOnReconnect: false,
	refetchInterval: false,
	retry: 0,
};

/**
 * ======================================
 * HOOKS PÚBLICOS - CARREGAMENTO INSTANTÂNEO
 * ======================================
 */

// Posts em destaque - CACHE ULTRA AGRESSIVO
export const useFeaturedPosts = (options = {}) => {
	return useQuery({
		queryKey: QUERY_KEYS.public.featured,
		queryFn: () => PostService.getFeaturedPosts(),
		...FEATURED_CACHE_CONFIG,
		// CRÍTICO: Não depender de nenhum estado externo
		enabled: true, // SEMPRE habilitado
		placeholderData: (previousData) => previousData, // Manter dados antigos enquanto carrega
		meta: {
			errorMessage: "Erro ao carregar posts em destaque",
		},
		...options,
	});
};

// Todos os posts - CACHE ULTRA AGRESSIVO
export const useAllPosts = (options = {}) => {
	return useQuery({
		queryKey: QUERY_KEYS.public.posts,
		queryFn: () => PostService.getAllPosts(),
		...ULTRA_CACHE_CONFIG,
		enabled: true,
		placeholderData: (previousData) => previousData,
		select: (data) => {
			// Ordenação e otimização no cliente para cache mais eficiente
			return (
				data?.sort((a, b) => new Date(b.created_at) - new Date(a.created_at)) ||
				[]
			);
		},
		meta: {
			errorMessage: "Erro ao carregar posts",
		},
		...options,
	});
};

// Posts por categoria - CACHE AGRESSIVO
export const usePostsByCategory = (categoryId, options = {}) => {
	return useQuery({
		queryKey: QUERY_KEYS.public.byCategory(categoryId),
		queryFn: () => PostService.getPostsByCategory(categoryId),
		enabled: !!categoryId && typeof categoryId === "string",
		...ULTRA_CACHE_CONFIG,
		placeholderData: (previousData) => previousData,
		meta: {
			errorMessage: `Erro ao carregar posts da categoria ${categoryId}`,
		},
		...options,
	});
};

// Post individual - CACHE MUITO AGRESSIVO
export const usePostById = (id, options = {}) => {
	return useQuery({
		queryKey: QUERY_KEYS.public.byId(id),
		queryFn: () => PostService.getPostById(id),
		enabled: !!id,
		...POST_DETAIL_CACHE_CONFIG,
		placeholderData: (previousData) => previousData,
		meta: {
			errorMessage: `Erro ao carregar post ${id}`,
		},
		...options,
	});
};

// Categorias - CACHE ULTRA LONGO
export const useCategories = (options = {}) => {
	return useQuery({
		queryKey: QUERY_KEYS.public.categories,
		queryFn: () => PostService.getCategories(),
		...CATEGORIES_CACHE_CONFIG,
		enabled: true,
		placeholderData: (previousData) => previousData,
		// Fallback para categorias padrão se não conseguir carregar
		select: (data) => {
			if (!data || data.length === 0) {
				return PostService.getFallbackCategories();
			}
			return data;
		},
		meta: {
			errorMessage: "Erro ao carregar categorias",
		},
		...options,
	});
};

// Busca - cache moderado
export const useSearchPosts = (query, options = {}) => {
	return useQuery({
		queryKey: QUERY_KEYS.public.search(query),
		queryFn: () => PostService.searchPosts(query),
		enabled: !!query && query.length >= 2,
		staleTime: 5 * 60 * 1000, // 5 min para buscas
		gcTime: 10 * 60 * 1000,
		refetchOnWindowFocus: false,
		refetchOnMount: false,
		placeholderData: (previousData) => previousData,
		...options,
	});
};

/**
 * ======================================
 * HOOKS ADMIN - CONFIGURAÇÕES SEGURAS
 * ======================================
 */

export const useAllPostsAdmin = (options = {}) => {
	const { isAdmin } = useAuth();

	return useQuery({
		queryKey: QUERY_KEYS.admin.posts,
		queryFn: () => PostService.getAllPostsAdmin(),
		enabled: isAdmin,
		...ADMIN_CACHE_CONFIG,
		placeholderData: (previousData) => previousData,
		meta: {
			errorMessage: "Erro ao carregar posts admin",
		},
		...options,
	});
};

export const usePostByIdAdmin = (id, options = {}) => {
	const { isAdmin } = useAuth();

	return useQuery({
		queryKey: QUERY_KEYS.admin.byId(id),
		queryFn: () => PostService.getPostByIdAdmin(id),
		enabled: !!id && isAdmin,
		...ADMIN_CACHE_CONFIG,
		placeholderData: (previousData) => previousData,
		meta: {
			errorMessage: `Erro ao carregar post admin ${id}`,
		},
		...options,
	});
};

/**
 * ======================================
 * MUTATIONS OTIMIZADAS
 * ======================================
 */
export const useCreatePost = () => {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: async (postData) => {
			const result = await PostService.createPost(postData);
			return result;
		},
		onMutate: async (newPost) => {
			// Optimistic updates para UI instantânea
			await queryClient.cancelQueries({ queryKey: QUERY_KEYS.admin.posts });

			const previousPosts = queryClient.getQueryData(QUERY_KEYS.admin.posts);

			if (previousPosts) {
				queryClient.setQueryData(QUERY_KEYS.admin.posts, [
					{
						...newPost,
						id: "temp-" + Date.now(),
						created_at: new Date().toISOString(),
					},
					...previousPosts,
				]);
			}

			return { previousPosts };
		},
		onError: (err, newPost, context) => {
			// Rollback optimistic update
			if (context?.previousPosts) {
				queryClient.setQueryData(QUERY_KEYS.admin.posts, context.previousPosts);
			}
			toast.error(`Erro ao criar post: ${err.message}`);
		},
		onSuccess: (data) => {
			toast.success("Post criado com sucesso!");

			// Invalidar apenas queries necessárias
			queryClient.invalidateQueries({ queryKey: QUERY_KEYS.admin.posts });

			// Se publicado, invalidar cache público
			if (data?.published) {
				queryClient.invalidateQueries({ queryKey: QUERY_KEYS.public.posts });
				queryClient.invalidateQueries({ queryKey: QUERY_KEYS.public.featured });

				if (data.category) {
					queryClient.invalidateQueries({
						queryKey: QUERY_KEYS.public.byCategory(data.category),
					});
				}
			}
		},
	});
};

export const useUpdatePost = () => {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: async ({ id, ...postData }) => {
			const result = await PostService.updatePost(id, postData);
			return result;
		},
		onMutate: async ({ id, ...newData }) => {
			// Optimistic updates
			await queryClient.cancelQueries({ queryKey: QUERY_KEYS.admin.byId(id) });

			const previousPost = queryClient.getQueryData(QUERY_KEYS.admin.byId(id));

			if (previousPost) {
				queryClient.setQueryData(QUERY_KEYS.admin.byId(id), {
					...previousPost,
					...newData,
					updated_at: new Date().toISOString(),
				});
			}

			return { previousPost };
		},
		onError: (err, { id }, context) => {
			if (context?.previousPost) {
				queryClient.setQueryData(
					QUERY_KEYS.admin.byId(id),
					context.previousPost
				);
			}
			toast.error(`Erro ao atualizar post: ${err.message}`);
		},
		onSuccess: (data) => {
			toast.success("Post atualizado com sucesso!");

			// Invalidações otimizadas
			queryClient.invalidateQueries({ queryKey: QUERY_KEYS.admin.posts });

			if (data?.published) {
				queryClient.invalidateQueries({ queryKey: QUERY_KEYS.public.posts });
				queryClient.invalidateQueries({ queryKey: QUERY_KEYS.public.featured });

				if (data.category) {
					queryClient.invalidateQueries({
						queryKey: QUERY_KEYS.public.byCategory(data.category),
					});
				}

				if (data.id) {
					queryClient.invalidateQueries({
						queryKey: QUERY_KEYS.public.byId(data.id),
					});
				}
			}
		},
	});
};

export const useDeletePost = () => {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: async (id) => {
			const result = await PostService.deletePost(id);
			return result;
		},
		onMutate: async (id) => {
			// Optimistic removal
			await queryClient.cancelQueries({ queryKey: QUERY_KEYS.admin.posts });

			const previousPosts = queryClient.getQueryData(QUERY_KEYS.admin.posts);

			if (previousPosts) {
				queryClient.setQueryData(
					QUERY_KEYS.admin.posts,
					previousPosts.filter((post) => post.id !== id)
				);
			}

			return { previousPosts };
		},
		onError: (err, id, context) => {
			if (context?.previousPosts) {
				queryClient.setQueryData(QUERY_KEYS.admin.posts, context.previousPosts);
			}
			toast.error(`Erro ao deletar post: ${err.message}`);
		},
		onSuccess: (data, variables) => {
			toast.success("Post deletado com sucesso!");

			// Limpeza completa
			queryClient.invalidateQueries({ queryKey: QUERY_KEYS.admin.posts });
			queryClient.invalidateQueries({ queryKey: QUERY_KEYS.public.posts });
			queryClient.invalidateQueries({ queryKey: QUERY_KEYS.public.featured });
			queryClient.invalidateQueries({
				queryKey: ["public", "posts", "category"],
			});

			// Remover query específica
			queryClient.removeQueries({
				queryKey: QUERY_KEYS.public.byId(variables),
			});
			queryClient.removeQueries({
				queryKey: QUERY_KEYS.admin.byId(variables),
			});
		},
	});
};

/**
 * ======================================
 * UTILITIES OTIMIZADAS
 * ======================================
 */
export const usePrefetch = () => {
	const queryClient = useQueryClient();

	const prefetchPost = (id) => {
		if (!id) return;

		queryClient.prefetchQuery({
			queryKey: QUERY_KEYS.public.byId(id),
			queryFn: () => PostService.getPostById(id),
			staleTime: 60 * 60 * 1000, // 1 hora para prefetch
		});
	};

	const prefetchCategory = (categoryId) => {
		if (!categoryId) return;

		queryClient.prefetchQuery({
			queryKey: QUERY_KEYS.public.byCategory(categoryId),
			queryFn: () => PostService.getPostsByCategory(categoryId),
			staleTime: 30 * 60 * 1000,
		});
	};

	return { prefetchPost, prefetchCategory };
};

export const useCacheUtils = () => {
	const queryClient = useQueryClient();

	const invalidateAllPosts = () => {
		queryClient.invalidateQueries({ queryKey: ["posts"] });
		queryClient.invalidateQueries({ queryKey: ["public"] });
		queryClient.invalidateQueries({ queryKey: ["admin"] });
	};

	const clearCache = () => {
		queryClient.clear();
		toast.success("Cache limpo com sucesso!");
	};

	const forceRefreshAll = () => {
		queryClient.invalidateQueries();
		queryClient.refetchQueries();
		toast.success("Dados atualizados!");
	};

	const refreshPosts = () => {
		queryClient.invalidateQueries({ queryKey: QUERY_KEYS.public.posts });
		queryClient.invalidateQueries({ queryKey: QUERY_KEYS.public.featured });
		queryClient.invalidateQueries({
			queryKey: ["public", "posts", "category"],
		});
		queryClient.invalidateQueries({ queryKey: QUERY_KEYS.admin.posts });

		queryClient.refetchQueries({ queryKey: QUERY_KEYS.public.posts });
		queryClient.refetchQueries({ queryKey: QUERY_KEYS.public.featured });
		queryClient.refetchQueries({ queryKey: QUERY_KEYS.admin.posts });

		toast.success("Posts atualizados!");
	};

	const getCacheStats = () => {
		const cache = queryClient.getQueryCache();
		const queries = cache.getAll();

		return {
			total: queries.length,
			public: queries.filter((q) => q.queryKey[0] === "public").length,
			admin: queries.filter((q) => q.queryKey[0] === "admin").length,
			errors: queries.filter((q) => q.state.status === "error").length,
			loading: queries.filter((q) => q.state.status === "pending").length,
			success: queries.filter((q) => q.state.status === "success").length,
			stale: queries.filter((q) => q.isStale()).length,
		};
	};

	const debugMutations = () => {
		const cache = queryClient.getMutationCache();
		const mutations = cache.getAll();
		return mutations;
	};

	return {
		invalidateAllPosts,
		clearCache,
		getCacheStats,
		forceRefreshAll,
		refreshPosts,
		debugMutations,
	};
};

// Suspense hook - Cache super agressivo
export const usePostByIdSuspense = (id) => {
	return useSuspenseQuery({
		queryKey: QUERY_KEYS.public.byId(id),
		queryFn: () => PostService.getPostById(id),
		staleTime: 60 * 60 * 1000, // 1 hora
		refetchOnWindowFocus: false,
		refetchOnMount: false,
	});
};

/**
 * ======================================
 * PRELOAD HOOKS PARA PERFORMANCE
 * ======================================
 */

// Hook para preload de dados críticos
export const usePreloadCriticalData = () => {
	const queryClient = useQueryClient();

	const preloadAll = async () => {
		const promises = [
			queryClient.prefetchQuery({
				queryKey: QUERY_KEYS.public.featured,
				queryFn: () => PostService.getFeaturedPosts(),
				staleTime: 45 * 60 * 1000,
			}),
			queryClient.prefetchQuery({
				queryKey: QUERY_KEYS.public.posts,
				queryFn: () => PostService.getAllPosts(),
				staleTime: 30 * 60 * 1000,
			}),
			queryClient.prefetchQuery({
				queryKey: QUERY_KEYS.public.categories,
				queryFn: () => PostService.getCategories(),
				staleTime: 2 * 60 * 60 * 1000,
			}),
		];

		try {
			await Promise.allSettled(promises);
			console.log("🚀 Critical data preloaded successfully");
		} catch (error) {
			console.warn("⚠️ Preload failed:", error);
		}
	};

	return { preloadAll };
};

export default {
	useFeaturedPosts,
	useAllPosts,
	usePostsByCategory,
	usePostById,
	usePostByIdSuspense,
	useSearchPosts,
	useCategories,
	useAllPostsAdmin,
	usePostByIdAdmin,
	useCreatePost,
	useUpdatePost,
	useDeletePost,
	usePrefetch,
	useCacheUtils,
	usePreloadCriticalData,
	QUERY_KEYS,
};
