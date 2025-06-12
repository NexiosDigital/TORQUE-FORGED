import { createClient } from "@supabase/supabase-js";
import { dataAPIService } from "./DataAPIService";

/**
 * PostService - IMPLEMENTAÇÃO HÍBRIDA
 * - Data API para queries públicas (performance)
 * - SDK para operações administrativas (type safety)
 * - Fallback automático
 */

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY;

// Cliente admin (mantém para operações administrativas)
const adminClient = createClient(supabaseUrl, supabaseAnonKey);

export class PostService {
	/**
	 * ======================================
	 * MÉTODOS PÚBLICOS - AGORA COM DATA API
	 * ======================================
	 */

	// Posts em destaque - Data API com cache HTTP
	static async getFeaturedPosts() {
		try {
			const data = await dataAPIService.getFeaturedPosts();

			if (process.env.NODE_ENV === "development") {
				console.log("✅ getFeaturedPosts (Data API):", data?.length || 0);
			}

			return data || [];
		} catch (error) {
			console.error("❌ PostService.getFeaturedPosts (Data API) error:", error);

			// Fallback para método SDK se Data API falhar
			return this.getFeaturedPostsSDK();
		}
	}

	// Todos os posts - Data API otimizada
	static async getAllPosts() {
		try {
			const data = await dataAPIService.getAllPosts();

			if (process.env.NODE_ENV === "development") {
				console.log("✅ getAllPosts (Data API):", data?.length || 0);
			}

			return data || [];
		} catch (error) {
			console.error("❌ PostService.getAllPosts (Data API) error:", error);
			return this.getAllPostsSDK();
		}
	}

	// Posts por categoria - Data API com cache
	static async getPostsByCategory(categoryId) {
		if (!categoryId) {
			throw new Error("Category ID é obrigatório");
		}

		try {
			const data = await dataAPIService.getPostsByCategory(categoryId);

			if (process.env.NODE_ENV === "development") {
				console.log(
					`✅ getPostsByCategory(${categoryId}) (Data API):`,
					data?.length || 0
				);
			}

			return data || [];
		} catch (error) {
			console.error(
				`❌ PostService.getPostsByCategory (Data API) error:`,
				error
			);
			return this.getPostsByCategorySDK(categoryId);
		}
	}

	// Post individual - Data API com cache longo
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

			if (process.env.NODE_ENV === "development") {
				console.log(`✅ getPostById(${postId}) (Data API):`, data?.title);
			}

			return data;
		} catch (error) {
			console.error("❌ PostService.getPostById (Data API) error:", error);

			if (error.message === "Post não encontrado") {
				throw error;
			}

			return this.getPostByIdSDK(id);
		}
	}

	// Categorias - Data API com cache longo
	static async getCategories() {
		try {
			const data = await dataAPIService.getCategories();

			if (process.env.NODE_ENV === "development") {
				console.log("✅ getCategories (Data API):", data?.length || 0);
			}

			return data && data.length > 0 ? data : this.getFallbackCategories();
		} catch (error) {
			console.error("❌ PostService.getCategories (Data API) error:", error);
			return this.getFallbackCategories();
		}
	}

	// Busca de posts - Data API sem cache
	static async searchPosts(query) {
		if (!query || query.length < 2) {
			return [];
		}

		try {
			const data = await dataAPIService.searchPosts(query);

			if (process.env.NODE_ENV === "development") {
				console.log(
					`✅ searchPosts("${query}") (Data API):`,
					data?.length || 0
				);
			}

			return data || [];
		} catch (error) {
			console.error("❌ PostService.searchPosts (Data API) error:", error);
			return this.searchPostsSDK(query);
		}
	}

	/**
	 * ======================================
	 * MÉTODOS FALLBACK - SDK (para compatibilidade)
	 * ======================================
	 */

	static async getFeaturedPostsSDK() {
		const freshClient = this.createFreshAnonymousClient();
		const { data, error } = await freshClient
			.from("posts")
			.select("*")
			.eq("published", true)
			.eq("trending", true)
			.order("created_at", { ascending: false })
			.limit(6);

		if (error) throw error;
		return data || [];
	}

	static async getAllPostsSDK() {
		const freshClient = this.createFreshAnonymousClient();
		const { data, error } = await freshClient
			.from("posts")
			.select("*")
			.eq("published", true)
			.order("created_at", { ascending: false });

		if (error) throw error;
		return data || [];
	}

	static async getPostsByCategorySDK(categoryId) {
		const freshClient = this.createFreshAnonymousClient();
		const { data, error } = await freshClient
			.from("posts")
			.select("*")
			.eq("published", true)
			.eq("category", categoryId)
			.order("created_at", { ascending: false });

		if (error) throw error;
		return data || [];
	}

	static async getPostByIdSDK(id) {
		const postId = typeof id === "string" ? parseInt(id, 10) : id;
		const freshClient = this.createFreshAnonymousClient();
		const { data, error } = await freshClient
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
		return data;
	}

	static async searchPostsSDK(query) {
		const freshClient = this.createFreshAnonymousClient();
		const { data, error } = await freshClient
			.from("posts")
			.select("*")
			.eq("published", true)
			.or(
				`title.ilike.%${query}%,excerpt.ilike.%${query}%,content.ilike.%${query}%`
			)
			.order("created_at", { ascending: false })
			.limit(20);

		if (error) throw error;
		return data || [];
	}

	/**
	 * ======================================
	 * MÉTODOS ADMINISTRATIVOS - MANTÉM SDK
	 * ======================================
	 */

	static async getAllPostsAdmin() {
		try {
			if (process.env.NODE_ENV === "development") {
				console.log(
					"🛡️ getAllPostsAdmin: Usando cliente autenticado (mantido)"
				);
			}

			const { data, error } = await adminClient
				.from("posts")
				.select("*")
				.order("created_at", { ascending: false });

			if (error) {
				console.error("❌ getAllPostsAdmin error:", error);
				throw error;
			}

			if (process.env.NODE_ENV === "development") {
				console.log("✅ getAllPostsAdmin success:", data?.length || 0, "posts");
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

			if (process.env.NODE_ENV === "development") {
				console.log(
					`🛡️ getPostByIdAdmin(${postId}): Usando cliente autenticado (mantido)`
				);
			}

			const { data, error } = await adminClient
				.from("posts")
				.select("*")
				.eq("id", postId)
				.single();

			if (error) {
				if (error.code === "PGRST116") {
					throw new Error("Post não encontrado");
				}
				console.error(`❌ getPostByIdAdmin(${postId}) error:`, error);
				throw error;
			}

			if (process.env.NODE_ENV === "development") {
				console.log(`✅ getPostByIdAdmin(${postId}) success:`, data.title);
			}
			return data;
		} catch (error) {
			console.error("❌ PostService.getPostByIdAdmin error:", error);
			throw new Error(`Erro ao carregar post admin: ${error.message}`);
		}
	}

	static async createPost(postData) {
		try {
			if (process.env.NODE_ENV === "development") {
				console.log("🛡️ createPost: Usando cliente autenticado (mantido)");
			}

			const { data, error } = await adminClient
				.from("posts")
				.insert([
					{
						...postData,
						created_at: new Date().toISOString(),
						updated_at: new Date().toISOString(),
					},
				])
				.select()
				.single();

			if (error) {
				console.error("❌ createPost error:", error);
				throw error;
			}

			// Invalidar cache do Data API
			await this.invalidatePublicCache();

			if (process.env.NODE_ENV === "development") {
				console.log("✅ createPost success:", data.title);
			}
			return data;
		} catch (error) {
			console.error("❌ PostService.createPost error:", error);
			throw new Error(`Erro ao criar post: ${error.message}`);
		}
	}

	static async updatePost(id, postData) {
		try {
			const postId = typeof id === "string" ? parseInt(id, 10) : id;

			if (process.env.NODE_ENV === "development") {
				console.log(
					`🛡️ updatePost(${postId}): Usando cliente autenticado (mantido)`
				);
			}

			const { data, error } = await adminClient
				.from("posts")
				.update({
					...postData,
					updated_at: new Date().toISOString(),
				})
				.eq("id", postId)
				.select()
				.single();

			if (error) {
				console.error("❌ updatePost error:", error);
				throw error;
			}

			// Invalidar cache do Data API
			await this.invalidatePublicCache();

			if (process.env.NODE_ENV === "development") {
				console.log("✅ updatePost success:", data.title);
			}
			return data;
		} catch (error) {
			console.error("❌ PostService.updatePost error:", error);
			throw new Error(`Erro ao atualizar post: ${error.message}`);
		}
	}

	static async deletePost(id) {
		try {
			const postId = typeof id === "string" ? parseInt(id, 10) : id;

			if (process.env.NODE_ENV === "development") {
				console.log(
					`🛡️ deletePost(${postId}): Usando cliente autenticado (mantido)`
				);
			}

			const { error } = await adminClient
				.from("posts")
				.delete()
				.eq("id", postId);

			if (error) {
				console.error("❌ deletePost error:", error);
				throw error;
			}

			// Invalidar cache do Data API
			await this.invalidatePublicCache();

			if (process.env.NODE_ENV === "development") {
				console.log("✅ deletePost success, ID:", postId);
			}
		} catch (error) {
			console.error("❌ PostService.deletePost error:", error);
			throw new Error(`Erro ao deletar post: ${error.message}`);
		}
	}

	/**
	 * ======================================
	 * UTILITIES
	 * ======================================
	 */

	static createFreshAnonymousClient() {
		return createClient(supabaseUrl, supabaseAnonKey, {
			auth: {
				persistSession: false,
				autoRefreshToken: false,
				detectSessionInUrl: false,
				storageKey: `supabase.auth.token.anonymous.${Date.now()}`,
			},
		});
	}

	static async invalidatePublicCache() {
		try {
			// Invalidar cache HTTP das principais rotas
			await Promise.all([
				dataAPIService.invalidateCache("/posts"),
				dataAPIService.invalidateCache("/categories"),
			]);

			if (process.env.NODE_ENV === "development") {
				console.log("🧹 Cache HTTP invalidado após operação admin");
			}
		} catch (error) {
			console.warn("Cache invalidation failed:", error);
		}
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
}
