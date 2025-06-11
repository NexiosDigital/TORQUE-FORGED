import { createClient } from "@supabase/supabase-js";

/**
 * PostService - SOLUÇÃO RADICAL
 * - Cliente NOVO a cada request público
 * - ZERO possibilidade de contaminação
 * - Literalmente simula estar sempre deslogado
 */

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY;

// Cliente admin (mantém como estava)
const adminClient = createClient(supabaseUrl, supabaseAnonKey);

// Função para criar cliente SEMPRE novo e anônimo
const createFreshAnonymousClient = () => {
	if (process.env.NODE_ENV === "development") {
		console.log("🆕 Criando cliente TOTALMENTE NOVO e anônimo");
	}

	return createClient(supabaseUrl, supabaseAnonKey, {
		auth: {
			persistSession: false,
			autoRefreshToken: false,
			detectSessionInUrl: false,
			flowType: "implicit",
			storageKey: `supabase.auth.token.anonymous.${Date.now()}`, // Key única
		},
		global: {
			headers: {
				"X-Client-Type": `fresh-anonymous-${Date.now()}`,
				"X-Force-Anonymous": "true",
			},
		},
	});
};

export class PostService {
	/**
	 * ======================================
	 * MÉTODOS PÚBLICOS - CLIENTE NOVO SEMPRE
	 * ======================================
	 */

	// Posts em destaque - Cliente NOVO a cada chamada
	static async getFeaturedPosts() {
		try {
			if (process.env.NODE_ENV === "development") {
				console.log("🌟 getFeaturedPosts: Criando cliente NOVO e anônimo");
			}

			// Cliente completamente novo
			const freshClient = createFreshAnonymousClient();

			const { data, error } = await freshClient
				.from("posts")
				.select("*")
				.eq("published", true)
				.eq("trending", true)
				.order("created_at", { ascending: false })
				.limit(6);

			if (error) {
				console.warn("Featured posts error, trying fallback:", error);

				// Fallback com OUTRO cliente novo
				const fallbackClient = createFreshAnonymousClient();
				const { data: fallbackData, error: fallbackError } =
					await fallbackClient
						.from("posts")
						.select("*")
						.eq("published", true)
						.order("created_at", { ascending: false })
						.limit(6);

				if (fallbackError) {
					console.error("Fallback também falhou:", fallbackError);
					throw fallbackError;
				}
				if (process.env.NODE_ENV === "development") {
					console.log(
						"✅ getFeaturedPosts fallback success:",
						fallbackData?.length || 0
					);
				}
				return fallbackData || [];
			}
			if (process.env.NODE_ENV === "development") {
				console.log("✅ getFeaturedPosts success:", data?.length || 0);
			}
			return data || [];
		} catch (error) {
			console.error("❌ PostService.getFeaturedPosts error:", error);
			throw new Error(`Erro ao carregar posts em destaque: ${error.message}`);
		}
	}

	// Todos os posts - Cliente NOVO a cada chamada
	static async getAllPosts() {
		try {
			if (process.env.NODE_ENV === "development") {
				console.log("📰 getAllPosts: Criando cliente NOVO e anônimo");
			}

			// Cliente completamente novo
			const freshClient = createFreshAnonymousClient();

			const { data, error } = await freshClient
				.from("posts")
				.select("*")
				.eq("published", true)
				.order("created_at", { ascending: false });

			if (error) {
				console.error("❌ getAllPosts error:", error);
				throw error;
			}
			if (process.env.NODE_ENV === "development") {
				console.log("✅ getAllPosts success:", data?.length || 0, "posts");
			}
			return data || [];
		} catch (error) {
			console.error("❌ PostService.getAllPosts error:", error);
			throw new Error(`Erro ao carregar posts: ${error.message}`);
		}
	}

	// Posts por categoria - Cliente NOVO a cada chamada
	static async getPostsByCategory(categoryId) {
		if (!categoryId) {
			throw new Error("Category ID é obrigatório");
		}

		try {
			if (process.env.NODE_ENV === "development") {
				console.log(
					`🏷️ getPostsByCategory(${categoryId}): Criando cliente NOVO e anônimo`
				);
			}

			// Cliente completamente novo
			const freshClient = createFreshAnonymousClient();

			const { data, error } = await freshClient
				.from("posts")
				.select("*")
				.eq("published", true)
				.eq("category", categoryId)
				.order("created_at", { ascending: false });

			if (error) {
				console.error(`❌ getPostsByCategory(${categoryId}) error:`, error);
				throw error;
			}

			if (process.env.NODE_ENV === "development") {
				console.log(
					`✅ getPostsByCategory(${categoryId}) success:`,
					data?.length || 0,
					"posts"
				);
			}
			return data || [];
		} catch (error) {
			console.error("❌ PostService.getPostsByCategory error:", error);
			throw new Error(
				`Erro ao carregar posts da categoria ${categoryId}: ${error.message}`
			);
		}
	}

	// Post individual - Cliente NOVO a cada chamada
	static async getPostById(id) {
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
					`📖 getPostById(${postId}): Criando cliente NOVO e anônimo`
				);
			}

			// Cliente completamente novo
			const freshClient = createFreshAnonymousClient();

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
				console.error(`❌ getPostById(${postId}) error:`, error);
				throw error;
			}

			if (process.env.NODE_ENV === "development") {
				console.log(`✅ getPostById(${postId}) success:`, data.title);
			}
			return data;
		} catch (error) {
			console.error("❌ PostService.getPostById error:", error);
			throw new Error(`Erro ao carregar post: ${error.message}`);
		}
	}

	// Categorias - Cliente NOVO a cada chamada
	static async getCategories() {
		try {
			if (process.env.NODE_ENV === "development") {
				console.log("🏷️ getCategories: Criando cliente NOVO e anônimo");
			}

			// Cliente completamente novo
			const freshClient = createFreshAnonymousClient();

			const { data, error } = await freshClient
				.from("categories")
				.select("*")
				.order("name");

			if (error) {
				console.warn("Categories error, using fallback:", error);
				return this.getFallbackCategories();
			}

			const result =
				data && data.length > 0 ? data : this.getFallbackCategories();
			return result;
		} catch (error) {
			console.error("❌ PostService.getCategories error:", error);
			return this.getFallbackCategories();
		}
	}

	// Busca de posts - Cliente NOVO a cada chamada
	static async searchPosts(query) {
		if (!query || query.length < 2) {
			return [];
		}

		try {
			if (process.env.NODE_ENV === "development") {
				console.log(
					`🔍 searchPosts("${query}"): Criando cliente NOVO e anônimo`
				);
			}

			// Cliente completamente novo
			const freshClient = createFreshAnonymousClient();

			const { data, error } = await freshClient
				.from("posts")
				.select("*")
				.eq("published", true)
				.or(
					`title.ilike.%${query}%,excerpt.ilike.%${query}%,content.ilike.%${query}%`
				)
				.order("created_at", { ascending: false })
				.limit(20);

			if (error) {
				console.error(`❌ searchPosts("${query}") error:`, error);
				throw error;
			}

			if (process.env.NODE_ENV === "development") {
				console.log(`✅ searchPosts("${query}") success:`, data?.length || 0);
			}
			return data || [];
		} catch (error) {
			console.error("❌ PostService.searchPosts error:", error);
			throw new Error(`Erro na busca: ${error.message}`);
		}
	}

	/**
	 * ======================================
	 * MÉTODOS ADMINISTRATIVOS - MANTÉM COMO ESTAVA
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
