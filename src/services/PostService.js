import { createClient } from "@supabase/supabase-js";
import { dataAPIService } from "./DataAPIService";
import { ImageUploadService } from "./ImageUploadService";

/**
 * PostService - IMPLEMENTAÇÃO HÍBRIDA com Upload de Imagens
 * - Data API para queries públicas (performance)
 * - SDK para operações administrativas (type safety)
 * - Integração com ImageUploadService
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

			// Otimizar URLs das imagens para performance
			return (data || []).map((post) => ({
				...post,
				image_url: this.getOptimizedImageUrl(post.image_path, post.image_url),
			}));
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

			// Otimizar URLs das imagens para performance
			return (data || []).map((post) => ({
				...post,
				image_url: this.getOptimizedImageUrl(post.image_path, post.image_url),
			}));
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

			// Otimizar URLs das imagens para performance
			return (data || []).map((post) => ({
				...post,
				image_url: this.getOptimizedImageUrl(post.image_path, post.image_url),
			}));
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

			// Otimizar URL da imagem para performance (tamanho maior para detalhes)
			return {
				...data,
				image_url: this.getOptimizedImageUrl(
					data.image_path,
					data.image_url,
					"1920x1080"
				),
			};
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

			// Otimizar URLs das imagens para performance
			return (data || []).map((post) => ({
				...post,
				image_url: this.getOptimizedImageUrl(post.image_path, post.image_url),
			}));
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

		return (data || []).map((post) => ({
			...post,
			image_url: this.getOptimizedImageUrl(post.image_path, post.image_url),
		}));
	}

	static async getAllPostsSDK() {
		const freshClient = this.createFreshAnonymousClient();
		const { data, error } = await freshClient
			.from("posts")
			.select("*")
			.eq("published", true)
			.order("created_at", { ascending: false });

		if (error) throw error;

		return (data || []).map((post) => ({
			...post,
			image_url: this.getOptimizedImageUrl(post.image_path, post.image_url),
		}));
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

		return (data || []).map((post) => ({
			...post,
			image_url: this.getOptimizedImageUrl(post.image_path, post.image_url),
		}));
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

		return {
			...data,
			image_url: this.getOptimizedImageUrl(
				data.image_path,
				data.image_url,
				"1920x1080"
			),
		};
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

		return (data || []).map((post) => ({
			...post,
			image_url: this.getOptimizedImageUrl(post.image_path, post.image_url),
		}));
	}

	/**
	 * ======================================
	 * MÉTODOS ADMINISTRATIVOS - MANTÉM SDK
	 * ======================================
	 */

	static async getAllPostsAdmin() {
		try {
			const { data, error } = await adminClient
				.from("posts")
				.select("*")
				.order("created_at", { ascending: false });

			if (error) {
				console.error("❌ getAllPostsAdmin error:", error);
				throw error;
			}

			// Para admin, manter URLs originais para edição
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

			// Para admin, manter URLs originais para edição
			return data;
		} catch (error) {
			console.error("❌ PostService.getPostByIdAdmin error:", error);
			throw new Error(`Erro ao carregar post admin: ${error.message}`);
		}
	}

	static async createPost(postData) {
		try {
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

			return data;
		} catch (error) {
			console.error("❌ PostService.createPost error:", error);
			throw new Error(`Erro ao criar post: ${error.message}`);
		}
	}

	static async updatePost(id, postData) {
		try {
			const postId = typeof id === "string" ? parseInt(id, 10) : id;

			// Buscar post atual para comparar imagens
			const { data: currentPost } = await adminClient
				.from("posts")
				.select("image_path")
				.eq("id", postId)
				.single();

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

			// Se a imagem mudou, agendar limpeza da imagem antiga
			if (
				currentPost?.image_path &&
				currentPost.image_path !== postData.image_path &&
				postData.image_path // Se nova imagem foi definida
			) {
				this.scheduleImageCleanup(currentPost.image_path);
			}

			// Invalidar cache do Data API
			await this.invalidatePublicCache();

			return data;
		} catch (error) {
			console.error("❌ PostService.updatePost error:", error);
			throw new Error(`Erro ao atualizar post: ${error.message}`);
		}
	}

	static async deletePost(id) {
		try {
			const postId = typeof id === "string" ? parseInt(id, 10) : id;

			// Buscar imagem do post antes de deletar
			const { data: postToDelete } = await adminClient
				.from("posts")
				.select("image_path")
				.eq("id", postId)
				.single();

			const { error } = await adminClient
				.from("posts")
				.delete()
				.eq("id", postId);

			if (error) {
				console.error("❌ deletePost error:", error);
				throw error;
			}

			// Agendar limpeza da imagem
			if (postToDelete?.image_path) {
				this.scheduleImageCleanup(postToDelete.image_path);
			}

			// Invalidar cache do Data API
			await this.invalidatePublicCache();
		} catch (error) {
			console.error("❌ PostService.deletePost error:", error);
			throw new Error(`Erro ao deletar post: ${error.message}`);
		}
	}

	/**
	 * ======================================
	 * UTILITIES - OTIMIZAÇÃO DE IMAGENS
	 * ======================================
	 */

	/**
	 * Obter URL otimizada da imagem com fallback
	 */
	static getOptimizedImageUrl(imagePath, originalUrl, size = "800x600") {
		// Se temos image_path, usar URL otimizada
		if (imagePath) {
			return ImageUploadService.getOptimizedImageUrl(imagePath, size);
		}

		// Fallback para URL original (posts antigos)
		if (originalUrl) {
			return originalUrl;
		}

		// Fallback final para imagem padrão
		return "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&h=600&fit=crop";
	}

	/**
	 * Agendar limpeza de imagem antiga
	 */
	static scheduleImageCleanup(imagePath) {
		if (!imagePath) return;

		// Agendar limpeza com delay para evitar problemas de cache
		setTimeout(async () => {
			try {
				await ImageUploadService.removePostImage(imagePath);
			} catch (error) {
				console.warn("⚠️ Erro ao remover imagem antiga:", error);
			}
		}, 5 * 60 * 1000); // 5 minutos de delay
	}

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
