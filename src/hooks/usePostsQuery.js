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
 * Hooks com Cache Otimizado para Data API
 * - QUERY_KEYS mantidos iguais (compatibilidade)
 * - Cache configurado para aproveitar Data API
 * - Fallback automático
 */

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

// Configurações OTIMIZADAS para Data API
const PUBLIC_CACHE_CONFIG = {
	staleTime: 10 * 60 * 1000, // 10 minutos (aumentado devido ao cache HTTP)
	gcTime: 60 * 60 * 1000, // 1 hora (aumentado)
	refetchOnWindowFocus: false,
	refetchOnMount: false, // MUDANÇA: confiar mais no cache HTTP nativo
	retry: (failureCount, error) => {
		if (error?.message?.includes("não encontrado")) return false;
		return failureCount < 1; // Menos retries devido à velocidade da Data API
	},
	retryDelay: 500, // Delay menor
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
 * HOOKS PÚBLICOS - OTIMIZADOS PARA DATA API
 * ======================================
 */

// Posts em destaque - AGORA usa Data API
export const useFeaturedPosts = (options = {}) => {
	return useQuery({
		queryKey: QUERY_KEYS.public.featured,
		queryFn: () => {
			return PostService.getFeaturedPosts(); // Agora usa Data API com fallback
		},
		...PUBLIC_CACHE_CONFIG,
		meta: {
			errorMessage: "Erro ao carregar posts em destaque",
		},
		...options,
	});
};

// Todos os posts - AGORA usa Data API
export const useAllPosts = (options = {}) => {
	return useQuery({
		queryKey: QUERY_KEYS.public.posts,
		queryFn: () => {
			return PostService.getAllPosts(); // Agora usa Data API com fallback
		},
		...PUBLIC_CACHE_CONFIG,
		meta: {
			errorMessage: "Erro ao carregar posts",
		},
		...options,
	});
};

// Posts por categoria - AGORA usa Data API
export const usePostsByCategory = (categoryId, options = {}) => {
	return useQuery({
		queryKey: QUERY_KEYS.public.byCategory(categoryId),
		queryFn: () => {
			return PostService.getPostsByCategory(categoryId); // Agora usa Data API com fallback
		},
		enabled: !!categoryId && typeof categoryId === "string",
		...PUBLIC_CACHE_CONFIG,
		meta: {
			errorMessage: `Erro ao carregar posts da categoria ${categoryId}`,
		},
		...options,
	});
};

// Post individual - AGORA usa Data API
export const usePostById = (id, options = {}) => {
	return useQuery({
		queryKey: QUERY_KEYS.public.byId(id),
		queryFn: () => {
			return PostService.getPostById(id); // Agora usa Data API com fallback
		},
		enabled: !!id,
		...PUBLIC_CACHE_CONFIG,
		staleTime: 30 * 60 * 1000, // Cache mais longo para posts individuais
		meta: {
			errorMessage: `Erro ao carregar post ${id}`,
		},
		...options,
	});
};

// Categorias - AGORA usa Data API
export const useCategories = (options = {}) => {
	return useQuery({
		queryKey: QUERY_KEYS.public.categories,
		queryFn: () => {
			return PostService.getCategories(); // Agora usa Data API com fallback
		},
		staleTime: 60 * 60 * 1000, // 1 hora (categorias são muito estáveis)
		gcTime: 2 * 60 * 60 * 1000, // 2 horas
		refetchOnWindowFocus: false,
		refetchOnMount: false, // Categorias raramente mudam
		meta: {
			errorMessage: "Erro ao carregar categorias",
		},
		...options,
	});
};

// Busca - AGORA usa Data API
export const useSearchPosts = (query, options = {}) => {
	return useQuery({
		queryKey: QUERY_KEYS.public.search(query),
		queryFn: () => {
			return PostService.searchPosts(query); // Agora usa Data API com fallback
		},
		enabled: !!query && query.length >= 2,
		staleTime: 2 * 60 * 1000, // Cache curto para buscas
		gcTime: 5 * 60 * 1000,
		refetchOnWindowFocus: false,
		...options,
	});
};

/**
 * ======================================
 * HOOKS ADMIN - MANTÉM SDK (inalterado)
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
 * MUTATIONS - MANTÉM INALTERADO
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
 * UTILITIES - MANTÉM INALTERADO
 * ======================================
 */
export const usePrefetch = () => {
	const queryClient = useQueryClient();

	const prefetchPost = (id) => {
		if (!id) return;

		queryClient.prefetchQuery({
			queryKey: QUERY_KEYS.public.byId(id),
			queryFn: () => PostService.getPostById(id), // Agora usa Data API
			staleTime: 30 * 60 * 1000, // Cache longo para prefetch
		});
	};

	const prefetchCategory = (categoryId) => {
		if (!categoryId) return;

		queryClient.prefetchQuery({
			queryKey: QUERY_KEYS.public.byCategory(categoryId),
			queryFn: () => PostService.getPostsByCategory(categoryId), // Agora usa Data API
			staleTime: 10 * 60 * 1000,
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

// Suspense hook - AGORA usa Data API
export const usePostByIdSuspense = (id) => {
	return useSuspenseQuery({
		queryKey: QUERY_KEYS.public.byId(id),
		queryFn: () => {
			return PostService.getPostById(id); // Agora usa Data API com fallback
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
