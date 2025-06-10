import {
	useQuery,
	useMutation,
	useQueryClient,
	useSuspenseQuery,
} from "@tanstack/react-query";
import { PostService } from "../services/PostService";
import toast from "react-hot-toast";
import { useAuth } from "../contexts/AuthContext";

/**
 * Hooks com Cache Separado
 * - QUERY_KEYS separados para public vs admin
 * - Zero interferência entre estados de auth
 * - Cliente específico por contexto
 */

// Query keys SEPARADOS por contexto
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

// Configurações otimizadas
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

const ADMIN_CACHE_CONFIG = {
	staleTime: 2 * 60 * 1000, // 2 minutos
	gcTime: 10 * 60 * 1000, // 10 minutos
	refetchOnWindowFocus: true,
	refetchOnMount: true,
	retry: 1,
};

/**
 * ======================================
 * HOOKS PÚBLICOS - SEMPRE ANÔNIMO
 * ======================================
 */

// Posts em destaque - SEMPRE usa cliente público
export const useFeaturedPosts = (options = {}) => {
	return useQuery({
		queryKey: QUERY_KEYS.public.featured,
		queryFn: () => {
			return PostService.getFeaturedPosts();
		},
		...PUBLIC_CACHE_CONFIG,
		meta: {
			errorMessage: "Erro ao carregar posts em destaque",
		},
		...options,
	});
};

// Todos os posts - SEMPRE usa cliente público
export const useAllPosts = (options = {}) => {
	return useQuery({
		queryKey: QUERY_KEYS.public.posts,
		queryFn: () => {
			return PostService.getAllPosts();
		},
		...PUBLIC_CACHE_CONFIG,
		meta: {
			errorMessage: "Erro ao carregar posts",
		},
		...options,
	});
};

// Posts por categoria - SEMPRE usa cliente público
export const usePostsByCategory = (categoryId, options = {}) => {
	return useQuery({
		queryKey: QUERY_KEYS.public.byCategory(categoryId),
		queryFn: () => {
			return PostService.getPostsByCategory(categoryId);
		},
		enabled: !!categoryId && typeof categoryId === "string",
		...PUBLIC_CACHE_CONFIG,
		meta: {
			errorMessage: `Erro ao carregar posts da categoria ${categoryId}`,
		},
		...options,
	});
};

// Post individual - SEMPRE usa cliente público
export const usePostById = (id, options = {}) => {
	return useQuery({
		queryKey: QUERY_KEYS.public.byId(id),
		queryFn: () => {
			return PostService.getPostById(id);
		},
		enabled: !!id,
		...PUBLIC_CACHE_CONFIG,
		meta: {
			errorMessage: `Erro ao carregar post ${id}`,
		},
		...options,
	});
};

// Categorias - SEMPRE usa cliente público
export const useCategories = (options = {}) => {
	return useQuery({
		queryKey: QUERY_KEYS.public.categories,
		queryFn: () => {
			return PostService.getCategories();
		},
		staleTime: 15 * 60 * 1000, // 15 minutos (categorias são estáveis)
		gcTime: 60 * 60 * 1000, // 1 hora
		refetchOnWindowFocus: false,
		meta: {
			errorMessage: "Erro ao carregar categorias",
		},
		...options,
	});
};

// Busca - SEMPRE usa cliente público
export const useSearchPosts = (query, options = {}) => {
	return useQuery({
		queryKey: QUERY_KEYS.public.search(query),
		queryFn: () => {
			return PostService.searchPosts(query);
		},
		enabled: !!query && query.length >= 2,
		...PUBLIC_CACHE_CONFIG,
		...options,
	});
};

/**
 * ======================================
 * HOOKS ADMIN - SEMPRE AUTENTICADO
 * ======================================
 */

// Posts admin - SEMPRE usa cliente autenticado
export const useAllPostsAdmin = (options = {}) => {
	const { isAdmin } = useAuth();

	return useQuery({
		queryKey: QUERY_KEYS.admin.posts,
		queryFn: () => {
			return PostService.getAllPostsAdmin();
		},
		enabled: isAdmin, // Só executa se for admin
		...ADMIN_CACHE_CONFIG,
		meta: {
			errorMessage: "Erro ao carregar posts admin",
		},
		...options,
	});
};

// Post admin individual - SEMPRE usa cliente autenticado
export const usePostByIdAdmin = (id, options = {}) => {
	const { isAdmin } = useAuth();

	return useQuery({
		queryKey: QUERY_KEYS.admin.byId(id),
		queryFn: () => {
			return PostService.getPostByIdAdmin(id);
		},
		enabled: !!id && isAdmin, // Só executa se tiver ID e for admin
		...ADMIN_CACHE_CONFIG,
		meta: {
			errorMessage: `Erro ao carregar post admin ${id}`,
		},
		...options,
	});
};

/**
 * ======================================
 * MUTATIONS - SEMPRE ADMIN
 * ======================================
 */
export const useCreatePost = () => {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: (postData) => {
			return PostService.createPost(postData);
		},
		onSuccess: () => {
			toast.success("Post criado com sucesso!");
			// Invalidar AMBOS os caches
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
		mutationFn: ({ id, ...postData }) => {
			return PostService.updatePost(id, postData);
		},
		onSuccess: (data) => {
			toast.success("Post atualizado com sucesso!");
			// Invalidar AMBOS os caches
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
		mutationFn: (id) => {
			return PostService.deletePost(id);
		},
		onSuccess: () => {
			toast.success("Post deletado com sucesso!");
			// Invalidar AMBOS os caches
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
 * ======================================
 * UTILITIES
 * ======================================
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

// Suspense hook - SEMPRE público
export const usePostByIdSuspense = (id) => {
	return useSuspenseQuery({
		queryKey: QUERY_KEYS.public.byId(id),
		queryFn: () => {
			return PostService.getPostById(id);
		},
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
