import {
	useQuery,
	useMutation,
	useQueryClient,
	useSuspenseQuery,
} from "@tanstack/react-query";
import { PostService } from "../services/PostService";
import toast from "react-hot-toast";

/**
 * Hook Limpo para Posts - SEM fallbacks estáticos
 * - TanStack Query padrão
 * - 100% dinâmico do banco
 * - Error handling adequado
 * - Cache persistence automático
 */

// Query keys centralizados
export const QUERY_KEYS = {
	posts: {
		all: ["posts"],
		featured: ["posts", "featured"],
		byCategory: (category) => ["posts", "category", category],
		byId: (id) => ["posts", "detail", id],
		search: (query) => ["posts", "search", query],
	},
	categories: {
		all: ["categories"],
	},
};

// Configurações de cache mais simples
const CACHE_CONFIG = {
	staleTime: 5 * 60 * 1000, // 5 minutos
	gcTime: 30 * 60 * 1000, // 30 minutos (novo nome no v5)
	refetchOnWindowFocus: false,
	refetchOnMount: false,
	retry: (failureCount, error) => {
		// Não tentar novamente se post não existe
		if (error?.message?.includes("não encontrado")) return false;
		if (error?.message?.includes("not found")) return false;
		return failureCount < 2;
	},
	retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 5000),
};

/**
 * Posts em destaque
 */
export const useFeaturedPosts = () => {
	return useQuery({
		queryKey: QUERY_KEYS.posts.featured,
		queryFn: PostService.getFeaturedPosts,
		...CACHE_CONFIG,
		meta: {
			errorMessage: "Erro ao carregar posts em destaque",
		},
	});
};

/**
 * Todos os posts
 */
export const useAllPosts = (options = {}) => {
	return useQuery({
		queryKey: QUERY_KEYS.posts.all,
		queryFn: PostService.getAllPosts,
		...CACHE_CONFIG,
		meta: {
			errorMessage: "Erro ao carregar posts",
		},
		...options,
	});
};

/**
 * Posts por categoria
 */
export const usePostsByCategory = (categoryId, options = {}) => {
	return useQuery({
		queryKey: QUERY_KEYS.posts.byCategory(categoryId),
		queryFn: () => PostService.getPostsByCategory(categoryId),
		enabled: !!categoryId && typeof categoryId === "string",
		...CACHE_CONFIG,
		meta: {
			errorMessage: `Erro ao carregar posts da categoria ${categoryId}`,
		},
		...options,
	});
};

/**
 * Post individual
 */
export const usePostById = (id, options = {}) => {
	return useQuery({
		queryKey: QUERY_KEYS.posts.byId(id),
		queryFn: () => PostService.getPostById(id),
		enabled: !!id,
		staleTime: 10 * 60 * 1000, // Posts individuais ficam fresh por mais tempo
		gcTime: 60 * 60 * 1000, // 1 hora
		refetchOnWindowFocus: false,
		retry: (failureCount, error) => {
			if (error?.message?.includes("não encontrado")) return false;
			if (error?.message?.includes("not found")) return false;
			return failureCount < 1;
		},
		meta: {
			errorMessage: `Erro ao carregar post ${id}`,
		},
		...options,
	});
};

/**
 * Post individual com Suspense
 */
export const usePostByIdSuspense = (id) => {
	return useSuspenseQuery({
		queryKey: QUERY_KEYS.posts.byId(id),
		queryFn: () => PostService.getPostById(id),
		staleTime: 10 * 60 * 1000,
		gcTime: 60 * 60 * 1000,
	});
};

/**
 * Busca de posts
 */
export const useSearchPosts = (query, options = {}) => {
	return useQuery({
		queryKey: QUERY_KEYS.posts.search(query),
		queryFn: () => PostService.searchPosts(query),
		enabled: !!query && query.length >= 2,
		staleTime: 2 * 60 * 1000, // 2 minutos para buscas
		gcTime: 10 * 60 * 1000, // 10 minutos
		meta: {
			errorMessage: `Erro na busca por "${query}"`,
		},
		...options,
	});
};

/**
 * Categorias
 */
export const useCategories = () => {
	return useQuery({
		queryKey: QUERY_KEYS.categories.all,
		queryFn: PostService.getCategories,
		staleTime: 30 * 60 * 1000, // Categorias são mais estáveis
		gcTime: 60 * 60 * 1000, // 1 hora
		refetchOnWindowFocus: false,
		meta: {
			errorMessage: "Erro ao carregar categorias",
		},
	});
};

/**
 * CRUD Operations
 */
export const useCreatePost = () => {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: PostService.createPost,
		onMutate: async (newPost) => {
			// Cancelar queries pendentes
			await queryClient.cancelQueries({ queryKey: QUERY_KEYS.posts.all });
			await queryClient.cancelQueries({ queryKey: QUERY_KEYS.posts.featured });

			// Snapshot do estado anterior
			const previousAll = queryClient.getQueryData(QUERY_KEYS.posts.all);
			const previousFeatured = queryClient.getQueryData(
				QUERY_KEYS.posts.featured
			);

			// Update otimista
			const optimisticPost = {
				...newPost,
				id: Date.now(), // ID temporário
				created_at: new Date().toISOString(),
			};

			queryClient.setQueryData(QUERY_KEYS.posts.all, (old) =>
				old ? [optimisticPost, ...old] : [optimisticPost]
			);

			if (newPost.trending) {
				queryClient.setQueryData(QUERY_KEYS.posts.featured, (old) =>
					old ? [optimisticPost, ...old.slice(0, 2)] : [optimisticPost]
				);
			}

			return { previousAll, previousFeatured };
		},
		onError: (err, newPost, context) => {
			// Rollback
			if (context?.previousAll) {
				queryClient.setQueryData(QUERY_KEYS.posts.all, context.previousAll);
			}
			if (context?.previousFeatured) {
				queryClient.setQueryData(
					QUERY_KEYS.posts.featured,
					context.previousFeatured
				);
			}
			toast.error(`Erro ao criar post: ${err.message}`);
		},
		onSuccess: (data) => {
			toast.success("Post criado com sucesso!");
		},
		onSettled: () => {
			// Invalidar para garantir sincronização
			queryClient.invalidateQueries({ queryKey: QUERY_KEYS.posts.all });
			queryClient.invalidateQueries({ queryKey: QUERY_KEYS.posts.featured });
		},
	});
};

export const useUpdatePost = () => {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: ({ id, ...postData }) => PostService.updatePost(id, postData),
		onSuccess: (data) => {
			// Update direto no cache
			queryClient.setQueryData(QUERY_KEYS.posts.byId(data.id), data);

			toast.success("Post atualizado com sucesso!");
		},
		onError: (err) => {
			toast.error(`Erro ao atualizar post: ${err.message}`);
		},
		onSettled: (data, error, { id }) => {
			// Invalidar queries relacionadas
			queryClient.invalidateQueries({ queryKey: QUERY_KEYS.posts.all });
			queryClient.invalidateQueries({ queryKey: QUERY_KEYS.posts.featured });

			if (data?.category) {
				queryClient.invalidateQueries({
					queryKey: QUERY_KEYS.posts.byCategory(data.category),
				});
			}
		},
	});
};

export const useDeletePost = () => {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: PostService.deletePost,
		onSuccess: () => {
			toast.success("Post deletado com sucesso!");
		},
		onError: (err) => {
			toast.error(`Erro ao deletar post: ${err.message}`);
		},
		onSettled: (data, error, id) => {
			// Remover do cache
			queryClient.removeQueries({ queryKey: QUERY_KEYS.posts.byId(id) });

			// Invalidar listas
			queryClient.invalidateQueries({ queryKey: QUERY_KEYS.posts.all });
			queryClient.invalidateQueries({ queryKey: QUERY_KEYS.posts.featured });
		},
	});
};

/**
 * Prefetching
 */
export const usePrefetch = () => {
	const queryClient = useQueryClient();

	const prefetchPost = (id) => {
		if (!id) return;

		queryClient.prefetchQuery({
			queryKey: QUERY_KEYS.posts.byId(id),
			queryFn: () => PostService.getPostById(id),
			staleTime: 10 * 60 * 1000,
		});
	};

	const prefetchCategory = (categoryId) => {
		if (!categoryId) return;

		queryClient.prefetchQuery({
			queryKey: QUERY_KEYS.posts.byCategory(categoryId),
			queryFn: () => PostService.getPostsByCategory(categoryId),
			staleTime: 5 * 60 * 1000,
		});
	};

	return {
		prefetchPost,
		prefetchCategory,
	};
};

/**
 * Cache utilities
 */
export const useCacheUtils = () => {
	const queryClient = useQueryClient();

	const invalidateAllPosts = () => {
		queryClient.invalidateQueries({ queryKey: ["posts"] });
	};

	const clearCache = () => {
		queryClient.clear();
		toast.success("Cache limpo com sucesso!");
	};

	const getCacheStats = () => {
		const cache = queryClient.getQueryCache();
		const queries = cache.getAll();

		return {
			totalQueries: queries.length,
			freshQueries: queries.filter((q) => !q.isStale()).length,
			staleQueries: queries.filter((q) => q.isStale()).length,
			errorQueries: queries.filter((q) => q.state.status === "error").length,
			loadingQueries: queries.filter((q) => q.state.status === "pending")
				.length,
		};
	};

	return {
		invalidateAllPosts,
		clearCache,
		getCacheStats,
	};
};
