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
 * CONFIGURAÇÕES AJUSTADAS PARA DADOS MAIS FRESCOS
 * - Cache reduzido para detectar mudanças rapidamente
 * - Refetch habilitado para atualizações automáticas
 * - MUTATIONS VERIFICADAS E CORRIGIDAS
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

// Configurações REDUZIDAS para detectar mudanças mais rápido
const PUBLIC_CACHE_CONFIG = {
	staleTime: 2 * 60 * 1000, // REDUZIDO: 2 minutos (era 10)
	gcTime: 10 * 60 * 1000, // 10 minutos
	refetchOnWindowFocus: true, // HABILITADO: refetch ao focar janela
	refetchOnMount: true, // HABILITADO: refetch ao montar componente
	retry: (failureCount, error) => {
		if (error?.message?.includes("não encontrado")) return false;
		return failureCount < 1;
	},
	retryDelay: 500,
};

const ADMIN_CACHE_CONFIG = {
	staleTime: 30 * 1000, // REDUZIDO: 30 segundos (era 2 minutos)
	gcTime: 5 * 60 * 1000, // 5 minutos
	refetchOnWindowFocus: true,
	refetchOnMount: true,
	retry: 1,
};

/**
 * ======================================
 * HOOKS PÚBLICOS - CONFIGURAÇÕES AJUSTADAS
 * ======================================
 */

// Posts em destaque - AGORA com refetch automático
export const useFeaturedPosts = (options = {}) => {
	return useQuery({
		queryKey: QUERY_KEYS.public.featured,
		queryFn: () => {
			return PostService.getFeaturedPosts();
		},
		...PUBLIC_CACHE_CONFIG,
		// Forçar refetch a cada 2 minutos
		refetchInterval: 2 * 60 * 1000,
		meta: {
			errorMessage: "Erro ao carregar posts em destaque",
		},
		...options,
	});
};

// Todos os posts - AGORA com refetch automático
export const useAllPosts = (options = {}) => {
	return useQuery({
		queryKey: QUERY_KEYS.public.posts,
		queryFn: () => {
			return PostService.getAllPosts();
		},
		...PUBLIC_CACHE_CONFIG,
		// Forçar refetch a cada 2 minutos
		refetchInterval: 2 * 60 * 1000,
		meta: {
			errorMessage: "Erro ao carregar posts",
		},
		...options,
	});
};

// Posts por categoria - AGORA com refetch automático
export const usePostsByCategory = (categoryId, options = {}) => {
	return useQuery({
		queryKey: QUERY_KEYS.public.byCategory(categoryId),
		queryFn: () => {
			return PostService.getPostsByCategory(categoryId);
		},
		enabled: !!categoryId && typeof categoryId === "string",
		...PUBLIC_CACHE_CONFIG,
		// Forçar refetch a cada 2 minutos
		refetchInterval: 2 * 60 * 1000,
		meta: {
			errorMessage: `Erro ao carregar posts da categoria ${categoryId}`,
		},
		...options,
	});
};

// Post individual - Cache um pouco maior
export const usePostById = (id, options = {}) => {
	return useQuery({
		queryKey: QUERY_KEYS.public.byId(id),
		queryFn: () => {
			return PostService.getPostById(id);
		},
		enabled: !!id,
		...PUBLIC_CACHE_CONFIG,
		staleTime: 5 * 60 * 1000, // 5 minutos para posts individuais
		meta: {
			errorMessage: `Erro ao carregar post ${id}`,
		},
		...options,
	});
};

// Categorias - Cache moderado (categorias mudam pouco)
export const useCategories = (options = {}) => {
	return useQuery({
		queryKey: QUERY_KEYS.public.categories,
		queryFn: () => {
			return PostService.getCategories();
		},
		staleTime: 10 * 60 * 1000, // 10 minutos (categorias são estáveis)
		gcTime: 30 * 60 * 1000, // 30 minutos
		refetchOnWindowFocus: false,
		refetchOnMount: false,
		meta: {
			errorMessage: "Erro ao carregar categorias",
		},
		...options,
	});
};

// Busca - sem cache
export const useSearchPosts = (query, options = {}) => {
	return useQuery({
		queryKey: QUERY_KEYS.public.search(query),
		queryFn: () => {
			return PostService.searchPosts(query);
		},
		enabled: !!query && query.length >= 2,
		staleTime: 0, // SEM CACHE para buscas
		gcTime: 2 * 60 * 1000,
		refetchOnWindowFocus: false,
		...options,
	});
};

/**
 * ======================================
 * HOOKS ADMIN - CACHE REDUZIDO
 * ======================================
 */

// Posts admin - Cache muito curto
export const useAllPostsAdmin = (options = {}) => {
	const { isAdmin } = useAuth();

	return useQuery({
		queryKey: QUERY_KEYS.admin.posts,
		queryFn: () => {
			return PostService.getAllPostsAdmin();
		},
		enabled: isAdmin,
		...ADMIN_CACHE_CONFIG,
		// Refetch automático a cada 1 minuto para admin
		refetchInterval: 60 * 1000,
		meta: {
			errorMessage: "Erro ao carregar posts admin",
		},
		onSuccess: (data) => {},
		onError: (error) => {
			console.error("❌ useAllPostsAdmin error:", error);
		},
		...options,
	});
};

// Post admin individual - Cache muito curto
export const usePostByIdAdmin = (id, options = {}) => {
	const { isAdmin } = useAuth();

	return useQuery({
		queryKey: QUERY_KEYS.admin.byId(id),
		queryFn: () => {
			return PostService.getPostByIdAdmin(id);
		},
		enabled: !!id && isAdmin,
		...ADMIN_CACHE_CONFIG,
		meta: {
			errorMessage: `Erro ao carregar post admin ${id}`,
		},
		onSuccess: (data) => {},
		onError: (error) => {
			console.error(`❌ usePostByIdAdmin(${id}) error:`, error);
		},
		...options,
	});
};

/**
 * ======================================
 * MUTATIONS - VERSÃO CORRIGIDA E MELHORADA
 * ======================================
 */
export const useCreatePost = () => {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: async (postData) => {
			const result = await PostService.createPost(postData);
			return result;
		},
		onSuccess: (data) => {
			toast.success("Post criado com sucesso!");

			// INVALIDAÇÃO COMPLETA - força refresh de todos os caches
			queryClient.invalidateQueries({ queryKey: QUERY_KEYS.admin.posts });
			queryClient.invalidateQueries({ queryKey: QUERY_KEYS.public.posts });
			queryClient.invalidateQueries({ queryKey: QUERY_KEYS.public.featured });

			// Invalidar TODAS as categorias
			queryClient.invalidateQueries({
				queryKey: ["public", "posts", "category"],
			});

			// FORÇAR REFETCH imediato
			queryClient.refetchQueries({ queryKey: QUERY_KEYS.public.posts });
			queryClient.refetchQueries({ queryKey: QUERY_KEYS.public.featured });
			queryClient.refetchQueries({ queryKey: QUERY_KEYS.admin.posts });
		},
		onError: (error) => {
			console.error("❌ useCreatePost onError:", error);
			toast.error(`Erro ao criar post: ${error.message}`);
		},
		onMutate: (variables) => {},
	});
};

export const useUpdatePost = () => {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: async ({ id, ...postData }) => {
			const result = await PostService.updatePost(id, postData);
			return result;
		},
		onSuccess: (data) => {
			toast.success("Post atualizado com sucesso!");

			// INVALIDAÇÃO COMPLETA
			queryClient.invalidateQueries({ queryKey: QUERY_KEYS.admin.posts });
			queryClient.invalidateQueries({ queryKey: QUERY_KEYS.public.posts });
			queryClient.invalidateQueries({ queryKey: QUERY_KEYS.public.featured });

			// Invalidar categoria específica se disponível
			if (data?.category) {
				queryClient.invalidateQueries({
					queryKey: QUERY_KEYS.public.byCategory(data.category),
				});
			}

			// Invalidar post específico em ambos os caches
			if (data?.id) {
				queryClient.invalidateQueries({
					queryKey: QUERY_KEYS.public.byId(data.id),
				});
				queryClient.invalidateQueries({
					queryKey: QUERY_KEYS.admin.byId(data.id),
				});
			}

			// FORÇAR REFETCH imediato
			queryClient.refetchQueries({ queryKey: QUERY_KEYS.public.posts });
			queryClient.refetchQueries({ queryKey: QUERY_KEYS.public.featured });
			queryClient.refetchQueries({ queryKey: QUERY_KEYS.admin.posts });
		},
		onError: (error) => {
			console.error("❌ useUpdatePost onError:", error);
			toast.error(`Erro ao atualizar post: ${error.message}`);
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
		onSuccess: (data, variables) => {
			toast.success("Post deletado com sucesso!");

			// INVALIDAÇÃO COMPLETA
			queryClient.invalidateQueries({ queryKey: QUERY_KEYS.admin.posts });
			queryClient.invalidateQueries({ queryKey: QUERY_KEYS.public.posts });
			queryClient.invalidateQueries({ queryKey: QUERY_KEYS.public.featured });

			// Invalidar TODAS as categorias
			queryClient.invalidateQueries({
				queryKey: ["public", "posts", "category"],
			});

			// Remover query específica do post deletado
			queryClient.removeQueries({
				queryKey: QUERY_KEYS.public.byId(variables),
			});
			queryClient.removeQueries({
				queryKey: QUERY_KEYS.admin.byId(variables),
			});

			// FORÇAR REFETCH imediato
			queryClient.refetchQueries({ queryKey: QUERY_KEYS.public.posts });
			queryClient.refetchQueries({ queryKey: QUERY_KEYS.public.featured });
			queryClient.refetchQueries({ queryKey: QUERY_KEYS.admin.posts });
		},
		onError: (error) => {
			console.error("❌ useDeletePost onError:", error);
			toast.error(`Erro ao deletar post: ${error.message}`);
		},
	});
};

/**
 * ======================================
 * UTILITIES - MELHORADOS
 * ======================================
 */
export const usePrefetch = () => {
	const queryClient = useQueryClient();

	const prefetchPost = (id) => {
		if (!id) return;

		queryClient.prefetchQuery({
			queryKey: QUERY_KEYS.public.byId(id),
			queryFn: () => PostService.getPostById(id),
			staleTime: 30 * 1000, // Cache curto para prefetch
		});
	};

	const prefetchCategory = (categoryId) => {
		if (!categoryId) return;

		queryClient.prefetchQuery({
			queryKey: QUERY_KEYS.public.byCategory(categoryId),
			queryFn: () => PostService.getPostsByCategory(categoryId),
			staleTime: 30 * 1000,
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

	// NOVA FUNÇÃO: Force refresh de todos os dados
	const forceRefreshAll = () => {
		queryClient.invalidateQueries();
		queryClient.refetchQueries();
		toast.success("Dados atualizados!");
	};

	// NOVA FUNÇÃO: Refresh específico para posts
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

	// NOVA FUNÇÃO: Debug mutations
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
		debugMutations, // NOVA
	};
};

// Suspense hook - Cache reduzido
export const usePostByIdSuspense = (id) => {
	return useSuspenseQuery({
		queryKey: QUERY_KEYS.public.byId(id),
		queryFn: () => {
			return PostService.getPostById(id);
		},
		staleTime: 2 * 60 * 1000, // Cache reduzido
	});
};

/**
 * ======================================
 * HOOK DE DEBUG PARA DESENVOLVIMENTO
 * ======================================
 */
export const usePostsDebug = () => {
	const runDiagnostics = async () => {
		try {
			const results = await PostService.runDiagnostics();
			return results;
		} catch (error) {
			console.error("❌ Erro nos diagnósticos:", error);
			return { error };
		}
	};

	const testCreatePost = async () => {
		const testData = {
			title: "Post de Teste DEBUG",
			slug: "post-teste-debug-" + Date.now(),
			excerpt: "Este é um post de teste para debug",
			content: "# Título\n\nEste é o conteúdo do post de teste.",
			image_url:
				"https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&h=600&fit=crop",
			image_path: "test/debug-image.jpg",
			category: "f1",
			category_name: "Fórmula 1",
			author: "Debug",
			read_time: "1 min",
			published: false,
			trending: false,
			tags: ["debug", "teste"],
		};

		try {
			const result = await PostService.createPost(testData);

			// Limpar o post de teste
			setTimeout(async () => {
				try {
					await PostService.deletePost(result.id);
				} catch (cleanupError) {
					console.warn("⚠️ Erro ao limpar post de teste:", cleanupError);
				}
			}, 5000);

			return { success: true, data: result };
		} catch (error) {
			console.error("❌ Erro no teste de criação:", error);
			return { success: false, error };
		}
	};

	return {
		runDiagnostics,
		testCreatePost,
	};
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
	usePostsDebug, // NOVO
	QUERY_KEYS,
};
