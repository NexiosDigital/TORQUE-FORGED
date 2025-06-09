import {
	useQuery,
	useMutation,
	useQueryClient,
	useSuspenseQuery,
} from "@tanstack/react-query";
import { PostService } from "../services/PostService";
import toast from "react-hot-toast";

/**
 * Hooks com Debug Detalhado e Cliente Público Forçado
 * - Logs detalhados para identificar o problema
 * - Cliente público forçado para visualização
 * - Debug automático em desenvolvimento
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
	debug: ["debug", "connection"],
};

// Configurações de cache com debug
const PUBLIC_CACHE_CONFIG = {
	staleTime: 1 * 60 * 1000, // 1 minuto para debug
	gcTime: 5 * 60 * 1000, // 5 minutos para debug
	refetchOnWindowFocus: false,
	refetchOnMount: true, // Sempre refetch para debug
	retry: (failureCount, error) => {
		console.log(`🔄 Query retry ${failureCount}:`, error?.message);
		return failureCount < 2;
	},
	retryDelay: (attemptIndex) => {
		const delay = Math.min(1000 * 2 ** attemptIndex, 3000);
		console.log(`⏰ Retry delay: ${delay}ms`);
		return delay;
	},
};

/**
 * HOOKS PÚBLICOS COM DEBUG
 */

// Posts em destaque - COM DEBUG
export const useFeaturedPosts = (options = {}) => {
	return useQuery({
		queryKey: QUERY_KEYS.public.featured,
		queryFn: async () => {
			console.log("🚀 useFeaturedPosts: Iniciando query...");
			const startTime = Date.now();

			try {
				const result = await PostService.getFeaturedPosts();
				const duration = Date.now() - startTime;

				console.log(`✅ useFeaturedPosts: Sucesso em ${duration}ms`, {
					count: result?.length || 0,
					data: result?.slice(0, 2), // Primeiros 2 para debug
				});

				return result;
			} catch (error) {
				const duration = Date.now() - startTime;
				console.error(`❌ useFeaturedPosts: Erro em ${duration}ms:`, error);
				throw error;
			}
		},
		...PUBLIC_CACHE_CONFIG,
		meta: {
			errorMessage: "Erro ao carregar posts em destaque",
		},
		...options,
	});
};

// Todos os posts - COM DEBUG
export const useAllPosts = (options = {}) => {
	return useQuery({
		queryKey: QUERY_KEYS.public.posts,
		queryFn: async () => {
			console.log("🚀 useAllPosts: Iniciando query...");
			const startTime = Date.now();

			try {
				const result = await PostService.getAllPosts();
				const duration = Date.now() - startTime;

				console.log(`✅ useAllPosts: Sucesso em ${duration}ms`, {
					count: result?.length || 0,
					data: result?.slice(0, 2), // Primeiros 2 para debug
				});

				return result;
			} catch (error) {
				const duration = Date.now() - startTime;
				console.error(`❌ useAllPosts: Erro em ${duration}ms:`, error);
				throw error;
			}
		},
		...PUBLIC_CACHE_CONFIG,
		meta: {
			errorMessage: "Erro ao carregar posts",
		},
		...options,
	});
};

// Posts por categoria - COM DEBUG
export const usePostsByCategory = (categoryId, options = {}) => {
	return useQuery({
		queryKey: QUERY_KEYS.public.byCategory(categoryId),
		queryFn: async () => {
			console.log(
				`🚀 usePostsByCategory: Iniciando query para ${categoryId}...`
			);
			const startTime = Date.now();

			try {
				const result = await PostService.getPostsByCategory(categoryId);
				const duration = Date.now() - startTime;

				console.log(
					`✅ usePostsByCategory(${categoryId}): Sucesso em ${duration}ms`,
					{
						count: result?.length || 0,
						data: result?.slice(0, 2),
					}
				);

				return result;
			} catch (error) {
				const duration = Date.now() - startTime;
				console.error(
					`❌ usePostsByCategory(${categoryId}): Erro em ${duration}ms:`,
					error
				);
				throw error;
			}
		},
		enabled: !!categoryId && typeof categoryId === "string",
		...PUBLIC_CACHE_CONFIG,
		meta: {
			errorMessage: `Erro ao carregar posts da categoria ${categoryId}`,
		},
		...options,
	});
};

// Post individual - COM DEBUG
export const usePostById = (id, options = {}) => {
	return useQuery({
		queryKey: QUERY_KEYS.public.byId(id),
		queryFn: async () => {
			console.log(`🚀 usePostById: Iniciando query para ${id}...`);
			const startTime = Date.now();

			try {
				const result = await PostService.getPostById(id);
				const duration = Date.now() - startTime;

				console.log(`✅ usePostById(${id}): Sucesso em ${duration}ms`, {
					title: result?.title,
					published: result?.published,
				});

				return result;
			} catch (error) {
				const duration = Date.now() - startTime;
				console.error(`❌ usePostById(${id}): Erro em ${duration}ms:`, error);
				throw error;
			}
		},
		enabled: !!id,
		...PUBLIC_CACHE_CONFIG,
		meta: {
			errorMessage: `Erro ao carregar post ${id}`,
		},
		...options,
	});
};

// Categorias - COM DEBUG
export const useCategories = (options = {}) => {
	return useQuery({
		queryKey: QUERY_KEYS.public.categories,
		queryFn: async () => {
			console.log("🚀 useCategories: Iniciando query...");
			const startTime = Date.now();

			try {
				const result = await PostService.getCategories();
				const duration = Date.now() - startTime;

				console.log(`✅ useCategories: Sucesso em ${duration}ms`, {
					count: result?.length || 0,
					categories: result?.map((c) => c.id) || [],
				});

				return result;
			} catch (error) {
				const duration = Date.now() - startTime;
				console.error(`❌ useCategories: Erro em ${duration}ms:`, error);
				throw error;
			}
		},
		staleTime: 10 * 60 * 1000, // Categorias são mais estáveis
		gcTime: 30 * 60 * 1000,
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

// Posts admin - COM DEBUG
export const useAllPostsAdmin = (options = {}) => {
	return useQuery({
		queryKey: QUERY_KEYS.admin.posts,
		queryFn: async () => {
			console.log("🚀 useAllPostsAdmin: Iniciando query admin...");
			const startTime = Date.now();

			try {
				const result = await PostService.getAllPostsAdmin();
				const duration = Date.now() - startTime;

				console.log(`✅ useAllPostsAdmin: Sucesso em ${duration}ms`, {
					total: result?.length || 0,
					published: result?.filter((p) => p.published).length || 0,
					drafts: result?.filter((p) => !p.published).length || 0,
				});

				return result;
			} catch (error) {
				const duration = Date.now() - startTime;
				console.error(`❌ useAllPostsAdmin: Erro em ${duration}ms:`, error);
				throw error;
			}
		},
		staleTime: 2 * 60 * 1000,
		gcTime: 10 * 60 * 1000,
		refetchOnWindowFocus: true,
		meta: {
			errorMessage: "Erro ao carregar posts admin",
		},
		...options,
	});
};

// Post admin individual - COM DEBUG
export const usePostByIdAdmin = (id, options = {}) => {
	return useQuery({
		queryKey: QUERY_KEYS.admin.byId(id),
		queryFn: async () => {
			console.log(`🚀 usePostByIdAdmin: Iniciando query admin para ${id}...`);
			const startTime = Date.now();

			try {
				const result = await PostService.getPostByIdAdmin(id);
				const duration = Date.now() - startTime;

				console.log(`✅ usePostByIdAdmin(${id}): Sucesso em ${duration}ms`, {
					title: result?.title,
					published: result?.published,
				});

				return result;
			} catch (error) {
				const duration = Date.now() - startTime;
				console.error(
					`❌ usePostByIdAdmin(${id}): Erro em ${duration}ms:`,
					error
				);
				throw error;
			}
		},
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
 * HOOK DE DEBUG AUTOMÁTICO
 */
export const useAutoDebug = () => {
	return useQuery({
		queryKey: QUERY_KEYS.debug,
		queryFn: async () => {
			console.log("🔧 useAutoDebug: Executando debug automático...");

			try {
				const result = await PostService.debugConnection();
				console.log("🔧 Debug Result:", result);
				return result;
			} catch (error) {
				console.error("❌ useAutoDebug: Erro:", error);
				return { error: error.message };
			}
		},
		enabled: process.env.NODE_ENV === "development",
		staleTime: 30 * 1000, // 30 segundos
		gcTime: 2 * 60 * 1000, // 2 minutos
		refetchOnMount: true,
	});
};

/**
 * MUTATIONS
 */
export const useCreatePost = () => {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: async (postData) => {
			console.log("🚀 useCreatePost: Criando post...", postData.title);
			return await PostService.createPost(postData);
		},
		onSuccess: (data) => {
			console.log("✅ useCreatePost: Post criado com sucesso:", data.title);
			toast.success("Post criado com sucesso!");

			// Invalidar ambos os caches
			queryClient.invalidateQueries({ queryKey: QUERY_KEYS.admin.posts });
			queryClient.invalidateQueries({ queryKey: QUERY_KEYS.public.posts });
			queryClient.invalidateQueries({ queryKey: QUERY_KEYS.public.featured });
		},
		onError: (err) => {
			console.error("❌ useCreatePost: Erro:", err);
			toast.error(`Erro ao criar post: ${err.message}`);
		},
	});
};

export const useUpdatePost = () => {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: async ({ id, ...postData }) => {
			console.log(`🚀 useUpdatePost: Atualizando post ${id}...`);
			return await PostService.updatePost(id, postData);
		},
		onSuccess: (data) => {
			console.log("✅ useUpdatePost: Post atualizado:", data.title);
			toast.success("Post atualizado com sucesso!");

			// Invalidar caches
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
			console.error("❌ useUpdatePost: Erro:", err);
			toast.error(`Erro ao atualizar post: ${err.message}`);
		},
	});
};

export const useDeletePost = () => {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: async (id) => {
			console.log(`🚀 useDeletePost: Deletando post ${id}...`);
			return await PostService.deletePost(id);
		},
		onSuccess: () => {
			console.log("✅ useDeletePost: Post deletado com sucesso");
			toast.success("Post deletado com sucesso!");

			// Invalidar todos os caches
			queryClient.invalidateQueries({ queryKey: QUERY_KEYS.admin.posts });
			queryClient.invalidateQueries({ queryKey: QUERY_KEYS.public.posts });
			queryClient.invalidateQueries({ queryKey: QUERY_KEYS.public.featured });
		},
		onError: (err) => {
			console.error("❌ useDeletePost: Erro:", err);
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

		console.log(`🔄 Prefetching post ${id}...`);
		queryClient.prefetchQuery({
			queryKey: QUERY_KEYS.public.byId(id),
			queryFn: () => PostService.getPostById(id),
			staleTime: 5 * 60 * 1000,
		});
	};

	const prefetchCategory = (categoryId) => {
		if (!categoryId) return;

		console.log(`🔄 Prefetching category ${categoryId}...`);
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
		console.log("🔄 Invalidando todos os posts...");
		queryClient.invalidateQueries({ queryKey: ["posts"] });
		queryClient.invalidateQueries({ queryKey: ["public"] });
		queryClient.invalidateQueries({ queryKey: ["admin"] });
	};

	const clearCache = () => {
		console.log("🗑️ Limpando todo o cache...");
		queryClient.clear();
		toast.success("Cache limpo com sucesso!");
	};

	const getCacheStats = () => {
		const cache = queryClient.getQueryCache();
		const queries = cache.getAll();

		const stats = {
			total: queries.length,
			public: queries.filter((q) => q.queryKey[0] === "public").length,
			admin: queries.filter((q) => q.queryKey[0] === "admin").length,
			debug: queries.filter((q) => q.queryKey[0] === "debug").length,
			errors: queries.filter((q) => q.state.status === "error").length,
			loading: queries.filter((q) => q.state.status === "pending").length,
			success: queries.filter((q) => q.state.status === "success").length,
		};

		console.log("📊 Cache Stats:", stats);
		return stats;
	};

	const debugConnection = async () => {
		console.log("🔧 Executando debug manual...");
		try {
			const result = await PostService.debugConnection();
			console.table(result);
			return result;
		} catch (error) {
			console.error("❌ Debug manual falhou:", error);
			return { error: error.message };
		}
	};

	const forceRefreshAll = () => {
		console.log("🔄 Forçando refresh de todas as queries...");
		queryClient.invalidateQueries();
		queryClient.refetchQueries();
	};

	return {
		invalidateAllPosts,
		clearCache,
		getCacheStats,
		debugConnection,
		forceRefreshAll,
	};
};

// Suspense
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
	useAutoDebug,
	QUERY_KEYS,
};
