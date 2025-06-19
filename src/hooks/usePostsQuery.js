import {
	useQuery,
	useMutation,
	useQueryClient,
	useSuspenseQuery,
} from "@tanstack/react-query";
import { PostService } from "../services/PostService";
import toast from "react-hot-toast";
import { useAuth } from "../contexts/AuthContext";

// Importar debug utils em desenvolvimento
if (process.env.NODE_ENV === "development") {
	import("../utils/categoriesDebugUtils").catch(() => {
		// Ignorar se arquivo não existir
	});
}

// Query keys INALTERADOS (compatibilidade)
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

// Funções de placeholder data INTELIGENTES e DINÂMICAS
const getBootstrapData = (key, fallback = []) => {
	if (
		window.TORQUE_FORGED_BOOTSTRAP?.ready &&
		window.TORQUE_FORGED_BOOTSTRAP.data[key]
	) {
		return window.TORQUE_FORGED_BOOTSTRAP.data[key];
	}
	return fallback;
};

const INSTANT_PLACEHOLDERS = {
	featuredPosts: () => getBootstrapData("featuredPosts", []),
	allPosts: () => getBootstrapData("allPosts", []),

	// Categorias DINÂMICAS - busca do bootstrap OU usa fallback mínimo
	categories: () => {
		const bootstrapCategories = getBootstrapData("categories", []);

		// Se tem categorias do bootstrap, usar essas
		if (bootstrapCategories.length > 0) {
			return bootstrapCategories;
		}

		// Se não tem bootstrap, usar categorias mínimas do cache local
		try {
			const cached = localStorage.getItem("tf-cache-categories-db");
			if (cached) {
				const { data, timestamp } = JSON.parse(cached);
				const age = Date.now() - timestamp;

				// Cache válido por 1 hora
				if (age < 60 * 60 * 1000) {
					return data;
				}
			}
		} catch (error) {
			// Ignorar erros de cache
		}

		// Fallback mínimo apenas se necessário
		return [
			{
				id: "geral",
				name: "Geral",
				description: "Conteúdo geral sobre automobilismo",
				color: "from-gray-500 to-gray-600",
				count: 0,
			},
		];
	},

	postsByCategory: (categoryId) => {
		const allPosts = getBootstrapData("allPosts", []);
		return allPosts.filter((post) => post.category === categoryId);
	},

	postById: (id) => {
		const allPosts = getBootstrapData("allPosts", []);
		const postId = typeof id === "string" ? parseInt(id, 10) : id;
		return allPosts.find((post) => post.id === postId) || null;
	},
};

// Configurações INSTANTÂNEAS - nunca loading
const INSTANT_CONFIG = {
	staleTime: 5 * 60 * 1000, // 5 min
	gcTime: 4 * 60 * 60 * 1000, // 4 horas
	refetchOnWindowFocus: false,
	refetchOnMount: false,
	refetchOnReconnect: false,
	refetchInterval: false,
	networkMode: "offlineFirst",
	retry: false,
	// CRÍTICO: sempre usar placeholder data
	placeholderData: (previousData) => previousData,
};

/**
 * ======================================
 * HOOKS PÚBLICOS - CARREGAMENTO INSTANTÂNEO
 * ======================================
 */

// Posts em destaque - SEMPRE instantâneo
export const useFeaturedPosts = (options = {}) => {
	return useQuery({
		queryKey: QUERY_KEYS.public.featured,
		queryFn: () => PostService.getFeaturedPosts(),
		...INSTANT_CONFIG,
		enabled: true,
		// SEMPRE retornar dados mesmo se query falhar
		placeholderData: () => INSTANT_PLACEHOLDERS.featuredPosts(),
		// Dados iniciais do bootstrap
		initialData: () => {
			const bootstrapData = INSTANT_PLACEHOLDERS.featuredPosts();
			return bootstrapData.length > 0 ? bootstrapData : undefined;
		},
		// Fallback se tudo falhar
		select: (data) => {
			if (!data || data.length === 0) {
				return INSTANT_PLACEHOLDERS.featuredPosts();
			}
			return data;
		},
		meta: {
			errorMessage: "Erro ao carregar posts em destaque",
		},
		...options,
	});
};

// Todos os posts - SEMPRE instantâneo
export const useAllPosts = (options = {}) => {
	return useQuery({
		queryKey: QUERY_KEYS.public.posts,
		queryFn: () => PostService.getAllPosts(),
		...INSTANT_CONFIG,
		enabled: true,
		placeholderData: () => INSTANT_PLACEHOLDERS.allPosts(),
		initialData: () => {
			const bootstrapData = INSTANT_PLACEHOLDERS.allPosts();
			return bootstrapData.length > 0 ? bootstrapData : undefined;
		},
		select: (data) => {
			if (!data || data.length === 0) {
				return INSTANT_PLACEHOLDERS.allPosts();
			}
			// Ordenação garantida
			return data.sort(
				(a, b) => new Date(b.created_at) - new Date(a.created_at)
			);
		},
		meta: {
			errorMessage: "Erro ao carregar posts",
		},
		...options,
	});
};

// Posts por categoria - SEMPRE instantâneo
export const usePostsByCategory = (categoryId, options = {}) => {
	return useQuery({
		queryKey: QUERY_KEYS.public.byCategory(categoryId),
		queryFn: () => PostService.getPostsByCategory(categoryId),
		enabled: !!categoryId && typeof categoryId === "string",
		...INSTANT_CONFIG,
		placeholderData: () => INSTANT_PLACEHOLDERS.postsByCategory(categoryId),
		initialData: () => {
			if (!categoryId) return undefined;
			const bootstrapData = INSTANT_PLACEHOLDERS.postsByCategory(categoryId);
			return bootstrapData.length > 0 ? bootstrapData : undefined;
		},
		select: (data) => {
			if (!data || data.length === 0) {
				return INSTANT_PLACEHOLDERS.postsByCategory(categoryId);
			}
			return data;
		},
		meta: {
			errorMessage: `Erro ao carregar posts da categoria ${categoryId}`,
		},
		...options,
	});
};

// Post individual - SEMPRE instantâneo
export const usePostById = (id, options = {}) => {
	return useQuery({
		queryKey: QUERY_KEYS.public.byId(id),
		queryFn: () => PostService.getPostById(id),
		enabled: !!id,
		...INSTANT_CONFIG,
		placeholderData: () => INSTANT_PLACEHOLDERS.postById(id),
		initialData: () => {
			if (!id) return undefined;
			const bootstrapData = INSTANT_PLACEHOLDERS.postById(id);
			return bootstrapData || undefined;
		},
		select: (data) => {
			if (!data) {
				// Se não encontrar, tentar bootstrap novamente
				const fallback = INSTANT_PLACEHOLDERS.postById(id);
				if (!fallback) {
					throw new Error("Post não encontrado");
				}
				return fallback;
			}
			return data;
		},
		meta: {
			errorMessage: `Erro ao carregar post ${id}`,
		},
		...options,
	});
};

// ======================================
// CATEGORIAS DINÂMICAS - SEMPRE BUSCA DO BANCO
// ======================================
export const useCategories = (options = {}) => {
	return useQuery({
		queryKey: QUERY_KEYS.public.categories,
		queryFn: () => PostService.getCategories(),
		...INSTANT_CONFIG,
		enabled: true,
		// Cache mais longo para categorias (1 hora)
		staleTime: 60 * 60 * 1000,
		gcTime: 4 * 60 * 60 * 1000,

		// Placeholder dinâmico baseado em cache ou bootstrap
		placeholderData: () => INSTANT_PLACEHOLDERS.categories(),

		// Dados iniciais do cache ou bootstrap
		initialData: () => {
			const bootstrapData = INSTANT_PLACEHOLDERS.categories();
			return bootstrapData.length > 0 ? bootstrapData : undefined;
		},

		// Sempre retornar alguma categoria (nunca array vazio)
		select: (data) => {
			if (!data || data.length === 0) {
				console.warn("⚠️ Nenhuma categoria encontrada, usando fallback");
				return INSTANT_PLACEHOLDERS.categories();
			}
			return data;
		},

		meta: {
			errorMessage: "Erro ao carregar categorias",
		},

		// Configurações específicas para categorias
		refetchOnWindowFocus: false,
		refetchOnMount: false,
		retry: (failureCount, error) => {
			// Permitir retry para categorias (mais crítico)
			return failureCount < 2;
		},

		...options,
	});
};

// Busca - cache moderado mas sem loading desnecessário
export const useSearchPosts = (query, options = {}) => {
	return useQuery({
		queryKey: QUERY_KEYS.public.search(query),
		queryFn: () => PostService.searchPosts(query),
		enabled: !!query && query.length >= 2,
		staleTime: 5 * 60 * 1000, // 5min para buscas
		gcTime: 10 * 60 * 1000,
		refetchOnWindowFocus: false,
		refetchOnMount: false,
		placeholderData: () => [], // Lista vazia para buscas
		meta: {
			errorMessage: "Erro na busca",
		},
		...options,
	});
};

/**
 * ======================================
 * HOOKS ADMIN - sem alterações significativas
 * ======================================
 */

export const useAllPostsAdmin = (options = {}) => {
	const { isAdmin } = useAuth();

	return useQuery({
		queryKey: QUERY_KEYS.admin.posts,
		queryFn: () => PostService.getAllPostsAdmin(),
		enabled: isAdmin,
		staleTime: 30 * 60 * 1000,
		gcTime: 2 * 60 * 60 * 1000,
		refetchOnWindowFocus: false,
		refetchOnMount: false,
		retry: false,
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
		staleTime: 10 * 60 * 1000,
		gcTime: 2 * 60 * 60 * 1000,
		refetchOnWindowFocus: false,
		refetchOnMount: false,
		retry: false,
		placeholderData: (previousData) => previousData,
		meta: {
			errorMessage: `Erro ao carregar post admin ${id}`,
		},
		...options,
	});
};

/**
 * ======================================
 * MUTATIONS - com invalidação de categorias
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
			if (context?.previousPosts) {
				queryClient.setQueryData(QUERY_KEYS.admin.posts, context.previousPosts);
			}
			toast.error(`Erro ao criar post: ${err.message}`);
		},
		onSuccess: (data) => {
			toast.success("Post criado com sucesso!");

			queryClient.invalidateQueries({ queryKey: QUERY_KEYS.admin.posts });

			if (data?.published) {
				queryClient.invalidateQueries({ queryKey: QUERY_KEYS.public.posts });
				queryClient.invalidateQueries({ queryKey: QUERY_KEYS.public.featured });

				if (data.category) {
					queryClient.invalidateQueries({
						queryKey: QUERY_KEYS.public.byCategory(data.category),
					});
				}
			}

			// Invalidar categorias se necessário
			queryClient.invalidateQueries({ queryKey: QUERY_KEYS.public.categories });
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

			// Invalidar categorias se necessário
			queryClient.invalidateQueries({ queryKey: QUERY_KEYS.public.categories });
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

			queryClient.invalidateQueries({ queryKey: QUERY_KEYS.admin.posts });
			queryClient.invalidateQueries({ queryKey: QUERY_KEYS.public.posts });
			queryClient.invalidateQueries({ queryKey: QUERY_KEYS.public.featured });
			queryClient.invalidateQueries({
				queryKey: ["public", "posts", "category"],
			});

			queryClient.removeQueries({
				queryKey: QUERY_KEYS.public.byId(variables),
			});
			queryClient.removeQueries({
				queryKey: QUERY_KEYS.admin.byId(variables),
			});

			// Invalidar categorias se necessário
			queryClient.invalidateQueries({ queryKey: QUERY_KEYS.public.categories });
		},
	});
};

/**
 * ======================================
 * UTILITIES INSTANTÂNEAS
 * ======================================
 */
export const usePrefetch = () => {
	const queryClient = useQueryClient();

	const prefetchPost = (id) => {
		if (!id) return;

		// Verificar se já tem no bootstrap primeiro
		const bootstrapPost = INSTANT_PLACEHOLDERS.postById(id);
		if (bootstrapPost) {
			queryClient.setQueryData(QUERY_KEYS.public.byId(id), bootstrapPost);
			return;
		}

		// Prefetch normal se não tem no bootstrap
		queryClient.prefetchQuery({
			queryKey: QUERY_KEYS.public.byId(id),
			queryFn: () => PostService.getPostById(id),
			staleTime: 60 * 60 * 1000,
		});
	};

	const prefetchCategory = (categoryId) => {
		if (!categoryId) return;

		// Verificar bootstrap primeiro
		const bootstrapPosts = INSTANT_PLACEHOLDERS.postsByCategory(categoryId);
		if (bootstrapPosts.length > 0) {
			queryClient.setQueryData(
				QUERY_KEYS.public.byCategory(categoryId),
				bootstrapPosts
			);
			return;
		}

		// Prefetch normal
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
		// Repopular com bootstrap
		if (window.TORQUE_FORGED_BOOTSTRAP?.ready) {
			setTimeout(() => {
				// Re-popular cache básico
				const featuredPosts = INSTANT_PLACEHOLDERS.featuredPosts();
				const allPosts = INSTANT_PLACEHOLDERS.allPosts();
				const categories = INSTANT_PLACEHOLDERS.categories();

				if (featuredPosts.length > 0) {
					queryClient.setQueryData(QUERY_KEYS.public.featured, featuredPosts);
				}
				if (allPosts.length > 0) {
					queryClient.setQueryData(QUERY_KEYS.public.posts, allPosts);
				}
				if (categories.length > 0) {
					queryClient.setQueryData(QUERY_KEYS.public.categories, categories);
				}
			}, 100);
		}
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

	// Método específico para refresh de categorias
	const refreshCategories = () => {
		queryClient.invalidateQueries({ queryKey: QUERY_KEYS.public.categories });
		queryClient.refetchQueries({ queryKey: QUERY_KEYS.public.categories });
		toast.success("Categorias atualizadas!");
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
			hasBootstrap: !!window.TORQUE_FORGED_BOOTSTRAP?.ready,
			categoriesInCache: !!queryClient.getQueryData(
				QUERY_KEYS.public.categories
			),
		};
	};

	return {
		invalidateAllPosts,
		clearCache,
		getCacheStats,
		forceRefreshAll,
		refreshPosts,
		refreshCategories,
	};
};

// Suspense hook - dados sempre disponíveis
export const usePostByIdSuspense = (id) => {
	return useSuspenseQuery({
		queryKey: QUERY_KEYS.public.byId(id),
		queryFn: () => PostService.getPostById(id),
		staleTime: 60 * 60 * 1000,
		refetchOnWindowFocus: false,
		refetchOnMount: false,
	});
};

// Hook de preload crítico (agora com categorias dinâmicas)
export const usePreloadCriticalData = () => {
	const queryClient = useQueryClient();

	const preloadAll = async () => {
		// Com bootstrap, isto é quase instantâneo
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
				staleTime: 2 * 60 * 60 * 1000, // 2 horas para categorias
			}),
		];

		try {
			await Promise.allSettled(promises);
			console.log(
				"🚀 Critical data preloaded successfully (including dynamic categories)"
			);
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
	// Expor placeholders para debug
	INSTANT_PLACEHOLDERS,
};
