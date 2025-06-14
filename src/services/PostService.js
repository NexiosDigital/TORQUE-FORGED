import { supabase } from "../lib/supabase";
import { dataAPIService } from "./DataAPIService";
import { ImageUploadService } from "./ImageUploadService";

/**
 * PostService - VERSÃO ULTRA OTIMIZADA para carregamento instantâneo
 * - Data API como fonte principal para dados públicos
 * - Cache agressivo em múltiplas camadas
 * - Fallbacks inteligentes sem delay
 * - Otimização de imagens automática
 * - Zero dependência de auth para dados públicos
 */

export class PostService {
	/**
	 * ======================================
	 * MÉTODOS PÚBLICOS - DATA API ULTRA RÁPIDA
	 * ======================================
	 */

	// Posts em destaque - ULTRA RÁPIDO com cache em camadas
	static async getFeaturedPosts() {
		try {
			// Tentar Data API primeiro (cache HTTP + memory cache)
			const data = await dataAPIService.getFeaturedPosts();

			// Otimização de URLs para performance máxima
			return (data || []).map((post) => ({
				...post,
				image_url: this.getOptimizedImageUrl(post.image_path, post.image_url),
			}));
		} catch (error) {
			console.warn("⚠️ DataAPI failed, trying fallback:", error.message);

			// Fallback instantâneo para dados em cache ou estáticos
			try {
				return this.getFeaturedPostsFallback();
			} catch (fallbackError) {
				console.warn(
					"⚠️ Fallback failed, returning empty:",
					fallbackError.message
				);
				return this.getEmptyFeaturedPosts();
			}
		}
	}

	// Todos os posts - ULTRA RÁPIDO
	static async getAllPosts() {
		try {
			const data = await dataAPIService.getAllPosts();

			return (data || []).map((post) => ({
				...post,
				image_url: this.getOptimizedImageUrl(post.image_path, post.image_url),
			}));
		} catch (error) {
			console.warn("⚠️ DataAPI failed for all posts:", error.message);

			try {
				return this.getAllPostsFallback();
			} catch (fallbackError) {
				console.warn("⚠️ All posts fallback failed:", fallbackError.message);
				return [];
			}
		}
	}

	// Posts por categoria - ULTRA RÁPIDO
	static async getPostsByCategory(categoryId) {
		if (!categoryId) {
			throw new Error("Category ID é obrigatório");
		}

		try {
			const data = await dataAPIService.getPostsByCategory(categoryId);

			return (data || []).map((post) => ({
				...post,
				image_url: this.getOptimizedImageUrl(post.image_path, post.image_url),
			}));
		} catch (error) {
			console.warn(
				`⚠️ DataAPI failed for category ${categoryId}:`,
				error.message
			);

			try {
				return this.getPostsByCategoryFallback(categoryId);
			} catch (fallbackError) {
				console.warn(
					`⚠️ Category ${categoryId} fallback failed:`,
					fallbackError.message
				);
				return [];
			}
		}
	}

	// Post individual - ULTRA RÁPIDO
	static async getPostById(id) {
		if (!id) {
			throw new Error("Post ID é obrigatório");
		}

		try {
			const postId = typeof id === "string" ? parseInt(id, 10) : id;

			if (isNaN(postId)) {
				throw new Error(`ID inválido: ${id}`);
			}

			const data = await dataAPIService.getPostById(postId);

			// Otimizar URL da imagem para tamanho maior (detalhes do post)
			return {
				...data,
				image_url: this.getOptimizedImageUrl(
					data.image_path,
					data.image_url,
					"1920x1080"
				),
			};
		} catch (error) {
			console.warn(`⚠️ DataAPI failed for post ${id}:`, error.message);

			if (error.message === "Post não encontrado") {
				throw error; // Re-throw 404 errors
			}

			try {
				return this.getPostByIdFallback(id);
			} catch (fallbackError) {
				console.warn(`⚠️ Post ${id} fallback failed:`, fallbackError.message);
				throw new Error("Post não encontrado");
			}
		}
	}

	// Categorias - ULTRA RÁPIDO com fallback inteligente
	static async getCategories() {
		try {
			const data = await dataAPIService.getCategories();

			// Se não conseguir carregar, usar categorias padrão imediatamente
			return data && data.length > 0 ? data : this.getFallbackCategories();
		} catch (error) {
			console.warn("⚠️ DataAPI failed for categories:", error.message);

			// Sempre retornar categorias padrão em caso de erro
			return this.getFallbackCategories();
		}
	}

	// Busca de posts - Rápido com cache
	static async searchPosts(query) {
		if (!query || query.length < 2) {
			return [];
		}

		try {
			const data = await dataAPIService.searchPosts(query);

			return (data || []).map((post) => ({
				...post,
				image_url: this.getOptimizedImageUrl(post.image_path, post.image_url),
			}));
		} catch (error) {
			console.warn("⚠️ Search failed:", error.message);
			return [];
		}
	}

	/**
	 * ======================================
	 * FALLBACKS ULTRA RÁPIDOS (cache local ou SDK)
	 * ======================================
	 */

	static async getFeaturedPostsFallback() {
		// Tentar cache do navegador primeiro
		const cached = this.getCachedData("featured-posts");
		if (cached) return cached;

		// SDK como último recurso
		const { data, error } = await supabase
			.from("posts")
			.select("*")
			.eq("published", true)
			.eq("trending", true)
			.order("created_at", { ascending: false })
			.limit(6);

		if (error) throw error;

		const optimized = (data || []).map((post) => ({
			...post,
			image_url: this.getOptimizedImageUrl(post.image_path, post.image_url),
		}));

		// Cachear resultado
		this.setCachedData("featured-posts", optimized);
		return optimized;
	}

	static async getAllPostsFallback() {
		const cached = this.getCachedData("all-posts");
		if (cached) return cached;

		const { data, error } = await supabase
			.from("posts")
			.select("*")
			.eq("published", true)
			.order("created_at", { ascending: false });

		if (error) throw error;

		const optimized = (data || []).map((post) => ({
			...post,
			image_url: this.getOptimizedImageUrl(post.image_path, post.image_url),
		}));

		this.setCachedData("all-posts", optimized);
		return optimized;
	}

	static async getPostsByCategoryFallback(categoryId) {
		const cacheKey = `category-${categoryId}`;
		const cached = this.getCachedData(cacheKey);
		if (cached) return cached;

		const { data, error } = await supabase
			.from("posts")
			.select("*")
			.eq("published", true)
			.eq("category", categoryId)
			.order("created_at", { ascending: false });

		if (error) throw error;

		const optimized = (data || []).map((post) => ({
			...post,
			image_url: this.getOptimizedImageUrl(post.image_path, post.image_url),
		}));

		this.setCachedData(cacheKey, optimized);
		return optimized;
	}

	static async getPostByIdFallback(id) {
		const postId = typeof id === "string" ? parseInt(id, 10) : id;
		const cacheKey = `post-${postId}`;
		const cached = this.getCachedData(cacheKey);
		if (cached) return cached;

		const { data, error } = await supabase
			.from("posts")
			.select("*")
			.eq("id", postId)
			.eq("published", true)
			.single();

		if (error) {
			if (error.code === "PGRST116") {
				throw new Error("Post não encontrado");
			}
			throw error;
		}

		const optimized = {
			...data,
			image_url: this.getOptimizedImageUrl(
				data.image_path,
				data.image_url,
				"1920x1080"
			),
		};

		this.setCachedData(cacheKey, optimized);
		return optimized;
	}

	/**
	 * ======================================
	 * CACHE LOCAL ULTRA RÁPIDO
	 * ======================================
	 */

	static getCachedData(key) {
		try {
			const cached = localStorage.getItem(`tf-cache-${key}`);
			if (!cached) return null;

			const { data, timestamp } = JSON.parse(cached);
			const age = Date.now() - timestamp;

			// Cache válido por 10 minutos para fallbacks
			if (age < 10 * 60 * 1000) {
				return data;
			}

			// Cache expirado
			localStorage.removeItem(`tf-cache-${key}`);
			return null;
		} catch (error) {
			return null;
		}
	}

	static setCachedData(key, data) {
		try {
			const item = {
				data,
				timestamp: Date.now(),
			};
			localStorage.setItem(`tf-cache-${key}`, JSON.stringify(item));
		} catch (error) {
			// Ignorar erros de localStorage
		}
	}

	/**
	 * ======================================
	 * FALLBACKS ESTÁTICOS INSTANTÂNEOS
	 * ======================================
	 */

	static getEmptyFeaturedPosts() {
		return [];
	}

	static getFallbackCategories() {
		return [
			{
				id: "f1",
				name: "Fórmula 1",
				description: "A elite do automobilismo mundial",
				color: "from-red-500 to-orange-500",
			},
			{
				id: "nascar",
				name: "NASCAR",
				description: "A categoria mais popular dos EUA",
				color: "from-blue-500 to-cyan-500",
			},
			{
				id: "endurance",
				name: "Endurance",
				description: "Corridas de resistência épicas",
				color: "from-green-500 to-emerald-500",
			},
			{
				id: "drift",
				name: "Formula Drift",
				description: "A arte de deslizar com estilo",
				color: "from-purple-500 to-pink-500",
			},
			{
				id: "tuning",
				name: "Tuning & Custom",
				description: "Personalização e modificações",
				color: "from-yellow-500 to-orange-500",
			},
			{
				id: "engines",
				name: "Motores",
				description: "Tecnologia e performance",
				color: "from-indigo-500 to-purple-500",
			},
		];
	}

	/**
	 * ======================================
	 * MÉTODOS ADMINISTRATIVOS - SEM ALTERAÇÃO
	 * ======================================
	 */

	static async verifyAuthenticatedAdmin() {
		try {
			const {
				data: { user },
				error: authError,
			} = await supabase.auth.getUser();

			if (authError) {
				console.error("❌ Erro de autenticação:", authError);
				throw new Error("Erro de autenticação: " + authError.message);
			}

			if (!user) {
				throw new Error("Usuário não autenticado");
			}

			const { data: profile, error: profileError } = await supabase
				.from("user_profiles")
				.select("role")
				.eq("id", user.id)
				.single();

			if (profileError) {
				console.error("❌ Erro ao buscar perfil:", profileError);
				throw new Error(
					"Erro ao verificar permissões: " + profileError.message
				);
			}

			if (!profile || profile.role !== "admin") {
				throw new Error("Usuário não tem permissões de administrador");
			}

			return { user, profile };
		} catch (error) {
			console.error("❌ verifyAuthenticatedAdmin error:", error);
			throw error;
		}
	}

	static async getAllPostsAdmin() {
		try {
			await this.verifyAuthenticatedAdmin();

			const { data, error } = await supabase
				.from("posts")
				.select("*")
				.order("created_at", { ascending: false });

			if (error) {
				console.error("❌ getAllPostsAdmin error:", error);
				throw this.handleRLSError(error);
			}

			return data || [];
		} catch (error) {
			console.error("❌ PostService.getAllPostsAdmin error:", error);
			throw new Error(`Erro ao carregar posts admin: ${error.message}`);
		}
	}

	static async getPostByIdAdmin(id) {
		if (!id) {
			throw new Error("Post ID é obrigatório");
		}

		try {
			const postId = typeof id === "string" ? parseInt(id, 10) : id;

			if (isNaN(postId)) {
				throw new Error(`ID inválido: ${id}`);
			}

			await this.verifyAuthenticatedAdmin();

			const { data, error } = await supabase
				.from("posts")
				.select("*")
				.eq("id", postId)
				.single();

			if (error) {
				if (error.code === "PGRST116") {
					throw new Error("Post não encontrado");
				}
				console.error(`❌ getPostByIdAdmin(${postId}) error:`, error);
				throw this.handleRLSError(error);
			}

			return data;
		} catch (error) {
			console.error("❌ PostService.getPostByIdAdmin error:", error);
			throw new Error(`Erro ao carregar post admin: ${error.message}`);
		}
	}

	static async createPost(postData) {
		try {
			await this.verifyAuthenticatedAdmin();

			if (!postData.title) {
				throw new Error("Título é obrigatório");
			}

			if (!postData.image_url) {
				throw new Error("Imagem de capa é obrigatória");
			}

			if (!postData.category) {
				throw new Error("Categoria é obrigatória");
			}

			if (!postData.content || postData.content.trim() === "") {
				throw new Error("Conteúdo é obrigatório");
			}

			const dataToInsert = {
				title: postData.title.trim(),
				slug: postData.slug?.trim() || this.generateSlug(postData.title),
				excerpt: postData.excerpt?.trim() || "",
				content: postData.content.trim(),
				image_url: postData.image_url,
				image_path: postData.image_path || null,
				category: postData.category,
				category_name: postData.category_name || "",
				author: postData.author || "Equipe TF",
				read_time: postData.read_time || "5 min",
				published: Boolean(postData.published),
				trending: Boolean(postData.trending),
				tags: Array.isArray(postData.tags) ? postData.tags : [],
				created_at: new Date().toISOString(),
				updated_at: new Date().toISOString(),
			};

			if (!dataToInsert.image_url) {
				throw new Error("CRÍTICO: image_url não foi definida");
			}

			const { data, error } = await supabase
				.from("posts")
				.insert([dataToInsert])
				.select()
				.single();

			if (error) {
				console.error("❌ Erro na inserção:", error);
				throw this.handleRLSError(error);
			}

			// Invalidar cache
			try {
				await this.invalidatePublicCache();
				this.clearLocalCache();
			} catch (cacheError) {
				console.warn("⚠️ Erro ao invalidar cache:", cacheError);
			}

			return data;
		} catch (error) {
			console.error("❌ PostService.createPost error:", error);
			throw error;
		}
	}

	static async updatePost(id, postData) {
		try {
			const postId = typeof id === "string" ? parseInt(id, 10) : id;

			if (isNaN(postId)) {
				throw new Error(`ID inválido: ${id}`);
			}

			await this.verifyAuthenticatedAdmin();

			if (!postData.title) {
				throw new Error("Título é obrigatório");
			}

			if (!postData.image_url) {
				throw new Error("Imagem de capa é obrigatória");
			}

			const { data: currentPost } = await supabase
				.from("posts")
				.select("image_path")
				.eq("id", postId)
				.single();

			const dataToUpdate = {
				title: postData.title,
				slug: postData.slug,
				excerpt: postData.excerpt,
				content: postData.content,
				image_url: postData.image_url,
				image_path: postData.image_path || null,
				category: postData.category,
				category_name: postData.category_name,
				author: postData.author || "Equipe TF",
				read_time: postData.read_time || "5 min",
				published: Boolean(postData.published),
				trending: Boolean(postData.trending),
				tags: Array.isArray(postData.tags) ? postData.tags : [],
				updated_at: new Date().toISOString(),
			};

			if (!dataToUpdate.image_url) {
				throw new Error("CRÍTICO: image_url não foi definida para atualização");
			}

			const { data, error } = await supabase
				.from("posts")
				.update(dataToUpdate)
				.eq("id", postId)
				.select()
				.single();

			if (error) {
				console.error("❌ updatePost error:", error);
				throw this.handleRLSError(error);
			}

			if (
				currentPost?.image_path &&
				currentPost.image_path !== postData.image_path &&
				postData.image_path
			) {
				this.scheduleImageCleanup(currentPost.image_path);
			}

			// Invalidar cache
			await this.invalidatePublicCache();
			this.clearLocalCache();

			return data;
		} catch (error) {
			console.error("❌ PostService.updatePost error:", error);
			throw error;
		}
	}

	static async deletePost(id) {
		try {
			const postId = typeof id === "string" ? parseInt(id, 10) : id;

			await this.verifyAuthenticatedAdmin();

			const { data: postToDelete } = await supabase
				.from("posts")
				.select("image_path")
				.eq("id", postId)
				.single();

			const { error } = await supabase.from("posts").delete().eq("id", postId);

			if (error) {
				console.error("❌ deletePost error:", error);
				throw this.handleRLSError(error);
			}

			if (postToDelete?.image_path) {
				this.scheduleImageCleanup(postToDelete.image_path);
			}

			// Invalidar cache
			await this.invalidatePublicCache();
			this.clearLocalCache();
		} catch (error) {
			console.error("❌ PostService.deletePost error:", error);
			throw error;
		}
	}

	/**
	 * ======================================
	 * UTILITIES OTIMIZADAS
	 * ======================================
	 */

	static getOptimizedImageUrl(imagePath, originalUrl, size = "800x600") {
		if (imagePath) {
			return ImageUploadService.getOptimizedImageUrl(imagePath, size);
		}

		if (originalUrl) {
			return originalUrl;
		}

		return "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&h=600&fit=crop";
	}

	static generateSlug(title) {
		if (!title) return `post-${Date.now()}`;

		return title
			.toLowerCase()
			.normalize("NFD")
			.replace(/[\u0300-\u036f]/g, "")
			.replace(/[^a-z0-9\s-]/g, "")
			.replace(/\s+/g, "-")
			.replace(/-+/g, "-")
			.trim();
	}

	static scheduleImageCleanup(imagePath) {
		if (!imagePath) return;

		setTimeout(async () => {
			try {
				await ImageUploadService.removePostImage(imagePath);
			} catch (error) {
				console.warn("⚠️ Erro ao remover imagem antiga:", error);
			}
		}, 5 * 60 * 1000);
	}

	static async invalidatePublicCache() {
		try {
			await Promise.all([
				dataAPIService.invalidateCache("/posts"),
				dataAPIService.invalidateCache("/categories"),
			]);
		} catch (error) {
			console.warn("Cache invalidation failed:", error);
		}
	}

	static clearLocalCache() {
		try {
			Object.keys(localStorage).forEach((key) => {
				if (key.startsWith("tf-cache-")) {
					localStorage.removeItem(key);
				}
			});
		} catch (error) {
			// Ignorar erros de localStorage
		}
	}

	static handleRLSError(error) {
		console.error("🔍 Analisando erro RLS:", error);

		if (
			error.code === "42501" ||
			error.message?.includes("permission denied")
		) {
			return new Error(
				"Erro de permissão: Verifique se você está logado como administrador"
			);
		}

		if (
			error.code === "PGRST301" ||
			error.message?.includes("policy") ||
			error.message?.includes("RLS")
		) {
			return new Error(
				"Política de segurança: Suas permissões não permitem esta operação"
			);
		}

		if (error.code === "PGRST302" || error.message?.includes("JWT")) {
			return new Error("Sessão expirada: Faça login novamente para continuar");
		}

		if (error.message?.includes("duplicate") || error.code === "23505") {
			return new Error("Já existe um post com este slug");
		}

		if (error.message?.includes("null value") || error.code === "23502") {
			return new Error("Alguns campos obrigatórios não foram preenchidos");
		}

		if (error.message?.includes("foreign key") || error.code === "23503") {
			return new Error("Categoria inválida selecionada");
		}

		return new Error(`Erro no banco de dados: ${error.message}`);
	}

	/**
	 * ======================================
	 * PRELOAD E WARMUP para carregamento instantâneo
	 * ======================================
	 */

	static async preloadCriticalData() {
		try {
			console.log("🚀 Preloading critical data...");

			const promises = [
				this.getFeaturedPosts(),
				this.getAllPosts(),
				this.getCategories(),
			];

			const results = await Promise.allSettled(promises);

			const successful = results.filter((r) => r.status === "fulfilled").length;
			console.log(`✅ Preloaded ${successful}/3 critical data sets`);

			return {
				success: true,
				loaded: successful,
				total: 3,
			};
		} catch (error) {
			console.warn("⚠️ Critical data preload failed:", error);
			return {
				success: false,
				error: error.message,
			};
		}
	}

	/**
	 * ======================================
	 * DEBUG E DIAGNÓSTICO
	 * ======================================
	 */

	static async runDiagnostics() {
		const results = {
			timestamp: new Date().toISOString(),
			dataAPI: null,
			fallback: null,
			cache: null,
		};

		// Teste Data API
		try {
			const start = Date.now();
			await dataAPIService.healthCheck();
			results.dataAPI = {
				status: "healthy",
				responseTime: Date.now() - start,
			};
		} catch (error) {
			results.dataAPI = {
				status: "unhealthy",
				error: error.message,
			};
		}

		// Teste fallback
		try {
			const start = Date.now();
			await this.getFallbackCategories();
			results.fallback = {
				status: "healthy",
				responseTime: Date.now() - start,
			};
		} catch (error) {
			results.fallback = {
				status: "unhealthy",
				error: error.message,
			};
		}

		// Teste cache local
		try {
			this.setCachedData("test", { timestamp: Date.now() });
			const cached = this.getCachedData("test");
			results.cache = {
				status: cached ? "healthy" : "unhealthy",
				working: !!cached,
			};
		} catch (error) {
			results.cache = {
				status: "unhealthy",
				error: error.message,
			};
		}

		return results;
	}
}
