import {
	useQuery,
	useMutation,
	useQueryClient,
	useSuspenseQuery,
} from "@tanstack/react-query";
import { PostService } from "../services/PostService";
import toast from "react-hot-toast";

/**
 * Hooks Limpos de Posts - SEM DEBUG
 * - Queries otimizadas para performance
 * - Error handling robusto
 * - Cache persistence automático
 */

// Query keys centralizados
export const QUERY_KEYS = {
	public: {
		posts: ["public", "posts"],
		featured: ["public", "posts", "featured"],
		byCategory: (category) => ["public", "posts", "category", category],
		byId: (id) => ["public", "posts", "detail", id],
		search: (query) => ["public", "posts", "search", query],
		categories: ["public", "categories"],
	},
	admin: {
		posts: ["admin", "posts"],
		byId: (id) => ["admin", "posts", "detail", id],
	},
};

// Configurações de cache otimizadas
const PUBLIC_CACHE_CONFIG = {
	staleTime: 5 * 60 * 1000, // 5 minutos
	gcTime: 30 * 60 * 1000, // 30 minutos
	refetchOnWindowFocus: false,
	refetchOnMount: true,
	retry: (failureCount, error) => {
		if (error?.message?.includes("não encontrado")) return false;
		return failureCount < 2;
	},
	retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 3000),
};

/**
 * HOOKS PÚBLICOS
 */

// Posts em destaque
export const useFeaturedPosts = (options = {}) => {
	return useQuery({
		queryKey: QUERY_KEYS.public.featured,
		queryFn: () => PostService.getFeaturedPosts(),
		...PUBLIC_CACHE_CONFIG,
		meta: {
			errorMessage: "Erro ao carregar posts em destaque",
		},
		...options,
	});
};

// Todos os posts
export const useAllPosts = (options = {}) => {
	return useQuery({
		queryKey: QUERY_KEYS.public.posts,
		queryFn: () => PostService.getAllPosts(),
		...PUBLIC_CACHE_CONFIG,
		meta: {
			errorMessage: "Erro ao carregar posts",
		},
		...options,
	});
};

// Posts por categoria
export const usePostsByCategory = (categoryId, options = {}) => {
	return useQuery({
		queryKey: QUERY_KEYS.public.byCategory(categoryId),
		queryFn: () => PostService.getPostsByCategory(categoryId),
		enabled: !!categoryId && typeof categoryId === "string",
		...PUBLIC_CACHE_CONFIG,
		meta: {
			errorMessage: `Erro ao carregar posts da categoria ${categoryId}`,
		},
		...options,
	});
};

// Post individual
export const usePostById = (id, options = {}) => {
	return useQuery({
		queryKey: QUERY_KEYS.public.byId(id),
		queryFn: () => PostService.getPostById(id),
		enabled: !!id,
		...PUBLIC_CACHE_CONFIG,
		meta: {
			errorMessage: `Erro ao carregar post ${id}`,
		},
		...options,
	});
};

// Categorias
export const useCategories = (options = {}) => {
	return useQuery({
		queryKey: QUERY_KEYS.public.categories,
		queryFn: () => PostService.getCategories(),
		staleTime: 15 * 60 * 1000, // 15 minutos (categorias são mais estáveis)
		gcTime: 60 * 60 * 1000, // 1 hora
		refetchOnWindowFocus: false,
		meta: {
			errorMessage: "Erro ao carregar categorias",
		},
		...options,
	});
};

/**
 * HOOKS ADMIN
 */

// Posts admin
export const useAllPostsAdmin = (options = {}) => {
	return useQuery({
		queryKey: QUERY_KEYS.admin.posts,
		queryFn: () => PostService.getAllPostsAdmin(),
		staleTime: 2 * 60 * 1000, // 2 minutos
		gcTime: 10 * 60 * 1000, // 10 minutos
		refetchOnWindowFocus: true,
		meta: {
			errorMessage: "Erro ao carregar posts admin",
		},
		...options,
	});
};

// Post admin individual
export const usePostByIdAdmin = (id, options = {}) => {
	return useQuery({
		queryKey: QUERY_KEYS.admin.byId(id),
		queryFn: () => PostService.getPostByIdAdmin(id),
		enabled: !!id,
		staleTime: 2 * 60 * 1000,
		gcTime: 10 * 60 * 1000,
		meta: {
			errorMessage: `Erro ao carregar post admin ${id}`,
		},
		...options,
	});
};

/**
 * MUTATIONS
 */
export const useCreatePost = () => {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: (postData) => PostService.createPost(postData),
		onSuccess: () => {
			toast.success("Post criado com sucesso!");
			queryClient.invalidateQueries({ queryKey: QUERY_KEYS.admin.posts });
			queryClient.invalidateQueries({ queryKey: QUERY_KEYS.public.posts });
			queryClient.invalidateQueries({ queryKey: QUERY_KEYS.public.featured });
		},
		onError: (err) => {
			toast.error(`Erro ao criar post: ${err.message}`);
		},
	});
};

export const useUpdatePost = () => {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: ({ id, ...postData }) => PostService.updatePost(id, postData),
		onSuccess: (data) => {
			toast.success("Post atualizado com sucesso!");
			queryClient.invalidateQueries({ queryKey: QUERY_KEYS.admin.posts });
			queryClient.invalidateQueries({ queryKey: QUERY_KEYS.public.posts });
			queryClient.invalidateQueries({ queryKey: QUERY_KEYS.public.featured });

			if (data?.category) {
				queryClient.invalidateQueries({
					queryKey: QUERY_KEYS.public.byCategory(data.category),
				});
			}
		},
		onError: (err) => {
			toast.error(`Erro ao atualizar post: ${err.message}`);
		},
	});
};

export const useDeletePost = () => {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: (id) => PostService.deletePost(id),
		onSuccess: () => {
			toast.success("Post deletado com sucesso!");
			queryClient.invalidateQueries({ queryKey: QUERY_KEYS.admin.posts });
			queryClient.invalidateQueries({ queryKey: QUERY_KEYS.public.posts });
			queryClient.invalidateQueries({ queryKey: QUERY_KEYS.public.featured });
		},
		onError: (err) => {
			toast.error(`Erro ao deletar post: ${err.message}`);
		},
	});
};

/**
 * UTILITIES
 */
export const usePrefetch = () => {
	const queryClient = useQueryClient();

	const prefetchPost = (id) => {
		if (!id) return;
		queryClient.prefetchQuery({
			queryKey: QUERY_KEYS.public.byId(id),
			queryFn: () => PostService.getPostById(id),
			staleTime: 5 * 60 * 1000,
		});
	};

	const prefetchCategory = (categoryId) => {
		if (!categoryId) return;
		queryClient.prefetchQuery({
			queryKey: QUERY_KEYS.public.byCategory(categoryId),
			queryFn: () => PostService.getPostsByCategory(categoryId),
			staleTime: 5 * 60 * 1000,
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
		};
	};

	const forceRefreshAll = () => {
		queryClient.invalidateQueries();
		queryClient.refetchQueries();
	};

	return {
		invalidateAllPosts,
		clearCache,
		getCacheStats,
		forceRefreshAll,
	};
};

// Suspense hook
export const usePostByIdSuspense = (id) => {
	return useSuspenseQuery({
		queryKey: QUERY_KEYS.public.byId(id),
		queryFn: () => PostService.getPostById(id),
	});
};

// Busca
export const useSearchPosts = (query, options = {}) => {
	return useQuery({
		queryKey: QUERY_KEYS.public.search(query),
		queryFn: () => PostService.searchPosts(query),
		enabled: !!query && query.length >= 2,
		...PUBLIC_CACHE_CONFIG,
		...options,
	});
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
	QUERY_KEYS,
};
