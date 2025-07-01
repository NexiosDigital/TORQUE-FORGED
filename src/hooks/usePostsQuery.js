import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { PostService } from "../services/PostService";
import toast from "react-hot-toast";
import { useAuth } from "../contexts/AuthContext";

// Query keys limpos e simples
export const QUERY_KEYS = {
	public: {
		posts: ["public", "posts"],
		featured: ["public", "posts", "featured"],
		byCategory: (category) => ["public", "posts", "category", category],
		byId: (id) => ["public", "posts", "detail", id],
		search: (query) => ["public", "posts", "search", query],
		categories: ["public", "categories"],
		categoriesHierarchy: ["public", "categories", "hierarchy"],
		categoriesByLevel: (level, parentId) => [
			"public",
			"categories",
			"level",
			level,
			parentId || "root",
		],
		categoryBySlug: (slug) => ["public", "categories", "slug", slug],
		categoryChildren: (categoryId) => [
			"public",
			"categories",
			"children",
			categoryId,
		],
		categoryBreadcrumb: (categoryId) => [
			"public",
			"categories",
			"breadcrumb",
			categoryId,
		],
		megaMenu: ["public", "categories", "megamenu"],
	},
	admin: {
		posts: ["admin", "posts"],
		byId: (id) => ["admin", "posts", "detail", id],
		categories: ["admin", "categories"],
		categoryById: (id) => ["admin", "categories", "detail", id],
	},
};

// Configurações básicas - SEM PLACEHOLDERS que interferem
const BASIC_CONFIG = {
	staleTime: 5 * 60 * 1000, // 5 minutos
	gcTime: 30 * 60 * 1000, // 30 minutos
	refetchOnWindowFocus: false,
	refetchOnMount: true, // Sempre buscar dados frescos
	retry: 1,
	networkMode: "online",
};

/**
 * ======================================
 * HOOKS PÚBLICOS - SEMPRE DO BANCO
 * ======================================
 */

// CATEGORIAS - Hook principal corrigido
export const useCategories = (options = {}) => {
	return useQuery({
		queryKey: QUERY_KEYS.public.categories,
		queryFn: () => {
			console.log("🔍 useCategories: Buscando categorias...");
			return PostService.getCategories();
		},
		...BASIC_CONFIG,
		staleTime: 10 * 60 * 1000, // 10 minutos para categorias
		meta: {
			errorMessage: "Erro ao carregar categorias",
		},
		...options,
	});
};

// Categoria por slug - CRÍTICO para roteamento
export const useCategoryBySlug = (slug, options = {}) => {
	return useQuery({
		queryKey: QUERY_KEYS.public.categoryBySlug(slug),
		queryFn: () => {
			console.log(`🔍 useCategoryBySlug: Buscando categoria "${slug}"`);
			return PostService.getCategoryBySlug(slug);
		},
		enabled: !!slug && typeof slug === "string" && slug.length > 0,
		...BASIC_CONFIG,
		meta: {
			errorMessage: `Categoria "${slug}" não encontrada`,
		},
		...options,
	});
};

// Hierarquia de categorias
export const useCategoriesHierarchy = (options = {}) => {
	return useQuery({
		queryKey: QUERY_KEYS.public.categoriesHierarchy,
		queryFn: () => {
			console.log("🔍 useCategoriesHierarchy: Buscando hierarquia...");
			return PostService.getCategoriesHierarchy();
		},
		...BASIC_CONFIG,
		staleTime: 15 * 60 * 1000, // 15 minutos para hierarquia
		meta: {
			errorMessage: "Erro ao carregar hierarquia de categorias",
		},
		...options,
	});
};

// Categorias por nível
export const useCategoriesByLevel = (level, parentId = null, options = {}) => {
	return useQuery({
		queryKey: QUERY_KEYS.public.categoriesByLevel(level, parentId),
		queryFn: () => {
			console.log(
				`🔍 useCategoriesByLevel: Nível ${level}, parent ${parentId}`
			);
			return PostService.getCategoriesByLevel(level, parentId);
		},
		enabled: typeof level === "number" && level >= 1 && level <= 3,
		...BASIC_CONFIG,
		meta: {
			errorMessage: `Erro ao carregar categorias nível ${level}`,
		},
		...options,
	});
};

// Filhos de uma categoria
export const useCategoryChildren = (categoryId, options = {}) => {
	return useQuery({
		queryKey: QUERY_KEYS.public.categoryChildren(categoryId),
		queryFn: () => {
			console.log(`🔍 useCategoryChildren: Buscando filhos de "${categoryId}"`);
			return PostService.getCategoryChildren(categoryId);
		},
		enabled: !!categoryId,
		...BASIC_CONFIG,
		meta: {
			errorMessage: `Erro ao carregar subcategorias de ${categoryId}`,
		},
		...options,
	});
};

// Breadcrumb
export const useCategoryBreadcrumb = (categoryId, options = {}) => {
	return useQuery({
		queryKey: QUERY_KEYS.public.categoryBreadcrumb(categoryId),
		queryFn: () => {
			console.log(
				`🔍 useCategoryBreadcrumb: Gerando breadcrumb para "${categoryId}"`
			);
			return PostService.getCategoryBreadcrumb(categoryId);
		},
		enabled: !!categoryId,
		...BASIC_CONFIG,
		meta: {
			errorMessage: `Erro ao gerar breadcrumb para ${categoryId}`,
		},
		...options,
	});
};

// Mega menu
export const useMegaMenuStructure = (options = {}) => {
	return useQuery({
		queryKey: QUERY_KEYS.public.megaMenu,
		queryFn: () => {
			console.log("🔍 useMegaMenuStructure: Construindo mega menu...");
			return PostService.getMegaMenuStructure();
		},
		...BASIC_CONFIG,
		staleTime: 20 * 60 * 1000, // 20 minutos para mega menu
		meta: {
			errorMessage: "Erro ao carregar estrutura do mega menu",
		},
		...options,
	});
};

/**
 * ======================================
 * HOOKS DE POSTS
 * ======================================
 */

// Posts em destaque
export const useFeaturedPosts = (options = {}) => {
	return useQuery({
		queryKey: QUERY_KEYS.public.featured,
		queryFn: () => PostService.getFeaturedPosts(),
		...BASIC_CONFIG,
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
		...BASIC_CONFIG,
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
		queryFn: () => {
			console.log(
				`🔍 usePostsByCategory: Buscando posts da categoria "${categoryId}"`
			);
			return PostService.getPostsByCategory(categoryId);
		},
		enabled: !!categoryId && typeof categoryId === "string",
		...BASIC_CONFIG,
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
		...BASIC_CONFIG,
		meta: {
			errorMessage: `Erro ao carregar post ${id}`,
		},
		...options,
	});
};

// Busca de posts
export const useSearchPosts = (query, options = {}) => {
	return useQuery({
		queryKey: QUERY_KEYS.public.search(query),
		queryFn: () => PostService.searchPosts(query),
		enabled: !!query && query.length >= 2,
		...BASIC_CONFIG,
		staleTime: 2 * 60 * 1000, // 2 minutos para busca
		meta: {
			errorMessage: "Erro na busca",
		},
		...options,
	});
};

/**
 * ======================================
 * HOOKS ADMIN
 * ======================================
 */

export const useAllPostsAdmin = (options = {}) => {
	const { isAdmin } = useAuth();

	return useQuery({
		queryKey: QUERY_KEYS.admin.posts,
		queryFn: () => PostService.getAllPostsAdmin(),
		enabled: isAdmin,
		...BASIC_CONFIG,
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
		...BASIC_CONFIG,
		meta: {
			errorMessage: `Erro ao carregar post admin ${id}`,
		},
		...options,
	});
};

/**
 * ======================================
 * MUTATIONS DE CATEGORIAS
 * ======================================
 */

export const useCreateCategory = () => {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: (categoryData) => {
			console.log(
				"🔧 useCreateCategory: Criando categoria...",
				categoryData.name
			);
			return PostService.createCategory(categoryData);
		},
		onSuccess: (data) => {
			console.log("✅ Categoria criada:", data.name);
			toast.success("Categoria criada com sucesso!");

			// Invalidar todas as queries de categorias
			queryClient.invalidateQueries({ queryKey: ["public", "categories"] });
			queryClient.invalidateQueries({ queryKey: ["admin", "categories"] });
		},
		onError: (error) => {
			console.error("❌ Erro ao criar categoria:", error);
			toast.error(`Erro ao criar categoria: ${error.message}`);
		},
	});
};

export const useUpdateCategory = () => {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: ({ id, ...categoryData }) => {
			console.log("🔧 useUpdateCategory: Atualizando categoria...", id);
			return PostService.updateCategory(id, categoryData);
		},
		onSuccess: (data) => {
			console.log("✅ Categoria atualizada:", data.name);
			toast.success("Categoria atualizada com sucesso!");

			// Invalidar todas as queries de categorias
			queryClient.invalidateQueries({ queryKey: ["public", "categories"] });
			queryClient.invalidateQueries({ queryKey: ["admin", "categories"] });
		},
		onError: (error) => {
			console.error("❌ Erro ao atualizar categoria:", error);
			toast.error(`Erro ao atualizar categoria: ${error.message}`);
		},
	});
};

export const useDeleteCategory = () => {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: (id) => {
			console.log("🔧 useDeleteCategory: Deletando categoria...", id);
			return PostService.deleteCategory(id);
		},
		onSuccess: () => {
			console.log("✅ Categoria deletada");
			toast.success("Categoria deletada com sucesso!");

			// Invalidar todas as queries de categorias
			queryClient.invalidateQueries({ queryKey: ["public", "categories"] });
			queryClient.invalidateQueries({ queryKey: ["admin", "categories"] });
		},
		onError: (error) => {
			console.error("❌ Erro ao deletar categoria:", error);
			toast.error(`Erro ao deletar categoria: ${error.message}`);
		},
	});
};

/**
 * ======================================
 * MUTATIONS DE POSTS (mantidas)
 * ======================================
 */

export const useCreatePost = () => {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: (postData) => PostService.createPost(postData),
		onSuccess: (data) => {
			toast.success("Post criado com sucesso!");
			queryClient.invalidateQueries({ queryKey: QUERY_KEYS.admin.posts });
			if (data?.published) {
				queryClient.invalidateQueries({ queryKey: QUERY_KEYS.public.posts });
				queryClient.invalidateQueries({ queryKey: QUERY_KEYS.public.featured });
			}
		},
		onError: (error) => {
			toast.error(`Erro ao criar post: ${error.message}`);
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
			if (data?.published) {
				queryClient.invalidateQueries({ queryKey: QUERY_KEYS.public.posts });
				queryClient.invalidateQueries({ queryKey: QUERY_KEYS.public.featured });
			}
		},
		onError: (error) => {
			toast.error(`Erro ao atualizar post: ${error.message}`);
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
		onError: (error) => {
			toast.error(`Erro ao deletar post: ${error.message}`);
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
			staleTime: 60 * 60 * 1000,
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

	const refreshCategories = () => {
		console.log("🔄 Forçando refresh de categorias...");
		PostService.clearCategoriesCache();
		queryClient.invalidateQueries({ queryKey: ["public", "categories"] });
		queryClient.refetchQueries({ queryKey: ["public", "categories"] });
		toast.success("Categorias atualizadas!");
	};

	const clearCache = () => {
		queryClient.clear();
		PostService.clearCategoriesCache();
		toast.success("Cache limpo com sucesso!");
	};

	const getCacheStats = () => {
		const cache = queryClient.getQueryCache();
		const queries = cache.getAll();

		return {
			total: queries.length,
			public: queries.filter((q) => q.queryKey[0] === "public").length,
			admin: queries.filter((q) => q.queryKey[0] === "admin").length,
			categories: queries.filter((q) => q.queryKey.includes("categories"))
				.length,
			success: queries.filter((q) => q.state.status === "success").length,
			error: queries.filter((q) => q.state.status === "error").length,
		};
	};

	return {
		refreshCategories,
		clearCache,
		getCacheStats,
	};
};

/**
 * ======================================
 * SUSPENSE HOOKS
 * ======================================
 */

// Hook suspense para post individual (compatibilidade)
export const usePostByIdSuspense = (id) => {
	const { data, error, isLoading } = usePostById(id, {
		suspense: false, // React Query suspense não é mais recomendado
	});

	// Se está carregando, lançar uma promise para suspense
	if (isLoading) {
		throw PostService.getPostById(id);
	}

	// Se tem erro, lançar erro
	if (error) {
		throw error;
	}

	return data;
};

/**
 * ======================================
 * DEBUG HOOKS
 * ======================================
 */

export const useDebugCategories = () => {
	return {
		debugCategories: () => PostService.debugCategories(),
		testRouting: (slug) => PostService.testCategoryRouting(slug),
		clearCache: () => PostService.clearCategoriesCache(),
	};
};

export default {
	useCategories,
	useCategoryBySlug,
	useCategoriesHierarchy,
	useCategoriesByLevel,
	useCategoryChildren,
	useCategoryBreadcrumb,
	useMegaMenuStructure,
	useFeaturedPosts,
	useAllPosts,
	usePostsByCategory,
	usePostById,
	usePostByIdSuspense,
	useSearchPosts,
	useAllPostsAdmin,
	usePostByIdAdmin,
	useCreateCategory,
	useUpdateCategory,
	useDeleteCategory,
	useCreatePost,
	useUpdatePost,
	useDeletePost,
	usePrefetch,
	useCacheUtils,
	useDebugCategories,
	QUERY_KEYS,
};
