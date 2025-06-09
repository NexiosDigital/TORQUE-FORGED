import { createClient } from "@supabase/supabase-js";

/**
 * PostService Limpo - SEM DEBUG
 * - Cliente público para visualização
 * - Cliente autenticado para admin
 * - Error handling robusto
 * - Fallbacks automáticos
 */

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY;

// Cliente anônimo para visualização pública
const supabaseAnon = createClient(supabaseUrl, supabaseAnonKey, {
	auth: {
		persistSession: false,
		autoRefreshToken: false,
		detectSessionInUrl: false,
	},
});

// Cliente principal para admin
const supabaseAuth = createClient(supabaseUrl, supabaseAnonKey);

export class PostService {
	/**
	 * MÉTODOS PÚBLICOS
	 */

	// Posts em destaque
	static async getFeaturedPosts() {
		try {
			const { data, error } = await supabaseAnon
				.from("posts")
				.select("*")
				.eq("published", true)
				.eq("trending", true)
				.order("created_at", { ascending: false })
				.limit(6);

			if (error) {
				// Fallback: buscar posts recentes se não houver trending
				const { data: fallbackData, error: fallbackError } = await supabaseAnon
					.from("posts")
					.select("*")
					.eq("published", true)
					.order("created_at", { ascending: false })
					.limit(6);

				if (fallbackError) throw fallbackError;
				return fallbackData || [];
			}

			return data || [];
		} catch (error) {
			throw new Error(`Erro ao carregar posts em destaque: ${error.message}`);
		}
	}

	// Todos os posts
	static async getAllPosts() {
		try {
			const { data, error } = await supabaseAnon
				.from("posts")
				.select("*")
				.eq("published", true)
				.order("created_at", { ascending: false });

			if (error) throw error;
			return data || [];
		} catch (error) {
			throw new Error(`Erro ao carregar posts: ${error.message}`);
		}
	}

	// Posts por categoria
	static async getPostsByCategory(categoryId) {
		if (!categoryId) {
			throw new Error("Category ID é obrigatório");
		}

		try {
			const { data, error } = await supabaseAnon
				.from("posts")
				.select("*")
				.eq("published", true)
				.eq("category", categoryId)
				.order("created_at", { ascending: false });

			if (error) throw error;
			return data || [];
		} catch (error) {
			throw new Error(
				`Erro ao carregar posts da categoria ${categoryId}: ${error.message}`
			);
		}
	}

	// Post individual
	static async getPostById(id) {
		if (!id) {
			throw new Error("Post ID é obrigatório");
		}

		try {
			const postId = typeof id === "string" ? parseInt(id, 10) : id;

			if (isNaN(postId)) {
				throw new Error(`ID inválido: ${id}`);
			}

			const { data, error } = await supabaseAnon
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
		} catch (error) {
			throw new Error(`Erro ao carregar post: ${error.message}`);
		}
	}

	// Categorias
	static async getCategories() {
		try {
			const { data, error } = await supabaseAnon
				.from("categories")
				.select("*")
				.order("name");

			if (error) {
				// Fallback para categorias hardcoded
				return this.getFallbackCategories();
			}

			return data && data.length > 0 ? data : this.getFallbackCategories();
		} catch (error) {
			return this.getFallbackCategories();
		}
	}

	// Categorias fallback
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

	// Busca de posts
	static async searchPosts(query) {
		if (!query || query.length < 2) {
			return [];
		}

		try {
			const { data, error } = await supabaseAnon
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
		} catch (error) {
			throw new Error(`Erro na busca: ${error.message}`);
		}
	}

	/**
	 * MÉTODOS ADMINISTRATIVOS
	 */

	// Posts admin (incluindo rascunhos)
	static async getAllPostsAdmin() {
		try {
			const { data, error } = await supabaseAuth
				.from("posts")
				.select("*")
				.order("created_at", { ascending: false });

			if (error) throw error;
			return data || [];
		} catch (error) {
			throw new Error(`Erro ao carregar posts admin: ${error.message}`);
		}
	}

	// Post admin individual
	static async getPostByIdAdmin(id) {
		if (!id) {
			throw new Error("Post ID é obrigatório");
		}

		try {
			const postId = typeof id === "string" ? parseInt(id, 10) : id;

			if (isNaN(postId)) {
				throw new Error(`ID inválido: ${id}`);
			}

			const { data, error } = await supabaseAuth
				.from("posts")
				.select("*")
				.eq("id", postId)
				.single();

			if (error) {
				if (error.code === "PGRST116") {
					throw new Error("Post não encontrado");
				}
				throw error;
			}

			return data;
		} catch (error) {
			throw new Error(`Erro ao carregar post admin: ${error.message}`);
		}
	}

	// Criar post
	static async createPost(postData) {
		try {
			const { data, error } = await supabaseAuth
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

			if (error) throw error;
			return data;
		} catch (error) {
			throw new Error(`Erro ao criar post: ${error.message}`);
		}
	}

	// Atualizar post
	static async updatePost(id, postData) {
		try {
			const postId = typeof id === "string" ? parseInt(id, 10) : id;

			const { data, error } = await supabaseAuth
				.from("posts")
				.update({
					...postData,
					updated_at: new Date().toISOString(),
				})
				.eq("id", postId)
				.select()
				.single();

			if (error) throw error;
			return data;
		} catch (error) {
			throw new Error(`Erro ao atualizar post: ${error.message}`);
		}
	}

	// Deletar post
	static async deletePost(id) {
		try {
			const postId = typeof id === "string" ? parseInt(id, 10) : id;

			const { error } = await supabaseAuth
				.from("posts")
				.delete()
				.eq("id", postId);

			if (error) throw error;
		} catch (error) {
			throw new Error(`Erro ao deletar post: ${error.message}`);
		}
	}
}
