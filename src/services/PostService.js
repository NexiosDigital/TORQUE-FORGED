import { supabase } from "../lib/supabase";

/**
 * PostService Melhorado - Funciona para usuários logados e deslogados
 * - Políticas RLS corrigidas
 * - Queries otimizadas
 * - Error handling robusto
 * - Debug melhorado
 */

export class PostService {
	// Posts em destaque - MELHORADO
	static async getFeaturedPosts() {
		try {
			// Query simples e direta
			const { data, error } = await supabase
				.from("posts")
				.select(
					`
					id, title, slug, category, category_name, image_url, 
					excerpt, content, author, read_time, trending, tags, 
					published, created_at, updated_at
				`
				)
				.eq("published", true)
				.eq("trending", true)
				.order("created_at", { ascending: false })
				.limit(6); // Aumentado para 6

			if (error) {
				console.error("❌ PostService: Erro posts em destaque:", error);
				console.error("Error details:", {
					message: error.message,
					details: error.details,
					hint: error.hint,
					code: error.code,
				});
				throw new Error(`Erro ao carregar posts em destaque: ${error.message}`);
			}

			return data || [];
		} catch (error) {
			console.error("❌ PostService: Exception em getFeaturedPosts:", error);
			return []; // Retornar array vazio em caso de erro
		}
	}

	// Todos os posts - MELHORADO
	static async getAllPosts() {
		try {
			const { data, error } = await supabase
				.from("posts")
				.select(
					`
					id, title, slug, category, category_name, image_url, 
					excerpt, content, author, read_time, trending, tags, 
					published, created_at, updated_at
				`
				)
				.eq("published", true)
				.order("created_at", { ascending: false })
				.limit(50); // Aumentado para 50

			if (error) {
				console.error("❌ PostService: Erro todos os posts:", error);
				console.error("Error details:", {
					message: error.message,
					details: error.details,
					hint: error.hint,
					code: error.code,
				});
				throw new Error(`Erro ao carregar posts: ${error.message}`);
			}

			return data || [];
		} catch (error) {
			console.error("❌ PostService: Exception em getAllPosts:", error);
			return []; // Retornar array vazio em caso de erro
		}
	}

	// Posts por categoria - MELHORADO
	static async getPostsByCategory(categoryId) {
		if (!categoryId) {
			console.warn("⚠️ PostService: Category ID não fornecido");
			return [];
		}

		try {
			const { data, error } = await supabase
				.from("posts")
				.select(
					`
					id, title, slug, category, category_name, image_url, 
					excerpt, content, author, read_time, trending, tags, 
					published, created_at, updated_at
				`
				)
				.eq("published", true)
				.eq("category", categoryId)
				.order("created_at", { ascending: false })
				.limit(20); // Aumentado para 20

			if (error) {
				console.error(`❌ PostService: Erro categoria ${categoryId}:`, error);
				console.error("Error details:", {
					message: error.message,
					details: error.details,
					hint: error.hint,
					code: error.code,
				});
				throw new Error(
					`Erro ao carregar posts da categoria: ${error.message}`
				);
			}

			return data || [];
		} catch (error) {
			console.error(
				`❌ PostService: Exception em getPostsByCategory(${categoryId}):`,
				error
			);
			return []; // Retornar array vazio em caso de erro
		}
	}

	// Post individual - MELHORADO
	static async getPostById(id) {
		if (!id) {
			throw new Error("Post ID é obrigatório");
		}

		try {
			const postId = typeof id === "string" ? parseInt(id, 10) : id;

			if (isNaN(postId)) {
				throw new Error(`ID inválido: ${id}`);
			}

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
				console.error(`❌ PostService: Erro post ${id}:`, error);
				throw new Error(`Erro ao carregar post: ${error.message}`);
			}

			return data;
		} catch (error) {
			console.error(`❌ PostService: Exception em getPostById(${id}):`, error);
			throw error; // Re-throw para que o hook possa capturar
		}
	}

	// Buscar posts - MELHORADO
	static async searchPosts(query, limit = 10) {
		if (!query || query.length < 2) {
			return [];
		}

		try {
			const { data, error } = await supabase
				.from("posts")
				.select(
					`
					id, title, slug, category, category_name, excerpt, 
					created_at, image_url
				`
				)
				.eq("published", true)
				.or(`title.ilike.%${query}%,excerpt.ilike.%${query}%`)
				.order("created_at", { ascending: false })
				.limit(limit);

			if (error) {
				console.error("❌ PostService: Erro na busca:", error);
				throw new Error(`Erro na busca: ${error.message}`);
			}

			return data || [];
		} catch (error) {
			console.error("❌ PostService: Exception em searchPosts:", error);
			return [];
		}
	}

	// Categorias - MELHORADO
	static async getCategories() {
		try {
			const { data, error } = await supabase
				.from("categories")
				.select("*")
				.order("name");

			if (error) {
				console.error("❌ PostService: Erro ao carregar categorias:", error);
				console.error("Error details:", {
					message: error.message,
					details: error.details,
					hint: error.hint,
					code: error.code,
				});

				// Fallback para categorias estáticas em caso de erro
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

			return data || [];
		} catch (error) {
			console.error("❌ PostService: Exception em getCategories:", error);
			// Retornar categorias estáticas como fallback
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

	// CRUD Operations - mantidos iguais mas com melhor error handling
	static async createPost(postData) {
		try {
			const { data, error } = await supabase
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
				console.error("❌ PostService: Erro ao criar post:", error);
				throw new Error(`Erro ao criar post: ${error.message}`);
			}

			return data;
		} catch (error) {
			console.error("❌ PostService: Exception em createPost:", error);
			throw error;
		}
	}

	static async updatePost(id, postData) {
		try {
			const postId = typeof id === "string" ? parseInt(id, 10) : id;

			const { data, error } = await supabase
				.from("posts")
				.update({
					...postData,
					updated_at: new Date().toISOString(),
				})
				.eq("id", postId)
				.select()
				.single();

			if (error) {
				console.error(`❌ PostService: Erro ao atualizar post ${id}:`, error);
				throw new Error(`Erro ao atualizar post: ${error.message}`);
			}

			return data;
		} catch (error) {
			console.error(`❌ PostService: Exception em updatePost(${id}):`, error);
			throw error;
		}
	}

	static async deletePost(id) {
		try {
			const postId = typeof id === "string" ? parseInt(id, 10) : id;

			const { error } = await supabase.from("posts").delete().eq("id", postId);

			if (error) {
				console.error(`❌ PostService: Erro ao deletar post ${id}:`, error);
				throw new Error(`Erro ao deletar post: ${error.message}`);
			}
		} catch (error) {
			console.error(`❌ PostService: Exception em deletePost(${id}):`, error);
			throw error;
		}
	}

	// Método de debug para verificar autenticação
	static async debugAuth() {
		try {
			const {
				data: { session },
			} = await supabase.auth.getSession();

			// Testar acesso direto
			const { error: testError } = await supabase
				.from("posts")
				.select("id, title, published")
				.limit(1);

			return {
				session,
				canAccessPosts: !testError,
				testError,
			};
		} catch (error) {
			console.error("❌ Debug Auth failed:", error);
			return { error };
		}
	}
}
