import { supabase } from "../lib/supabase";

/**
 * PostService - Sistema Limpo e Direto
 * - SEM fallbacks estáticos
 * - SEM cache complexo
 * - 100% dinâmico do banco
 * - Error handling robusto
 */

export class PostService {
	// Posts em destaque
	static async getFeaturedPosts() {
		console.log("🚀 PostService: Buscando posts em destaque...");

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
			.limit(3);

		if (error) {
			console.error("❌ PostService: Erro posts em destaque:", error);
			throw new Error(`Erro ao carregar posts em destaque: ${error.message}`);
		}

		console.log(
			"✅ PostService: Posts em destaque carregados:",
			data?.length || 0
		);
		return data || [];
	}

	// Todos os posts
	static async getAllPosts() {
		console.log("🚀 PostService: Buscando todos os posts...");

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
			.limit(20);

		if (error) {
			console.error("❌ PostService: Erro todos os posts:", error);
			throw new Error(`Erro ao carregar posts: ${error.message}`);
		}

		console.log(
			"✅ PostService: Todos os posts carregados:",
			data?.length || 0
		);
		return data || [];
	}

	// Posts por categoria
	static async getPostsByCategory(categoryId) {
		if (!categoryId) {
			throw new Error("Category ID é obrigatório");
		}

		console.log(`🚀 PostService: Buscando posts da categoria ${categoryId}...`);

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
			.limit(12);

		if (error) {
			console.error(`❌ PostService: Erro categoria ${categoryId}:`, error);
			throw new Error(`Erro ao carregar posts da categoria: ${error.message}`);
		}

		console.log(
			`✅ PostService: Categoria ${categoryId} carregada:`,
			data?.length || 0
		);
		return data || [];
	}

	// Post individual
	static async getPostById(id) {
		if (!id) {
			throw new Error("Post ID é obrigatório");
		}

		console.log(`🚀 PostService: Buscando post ${id}...`);

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
				console.log(`⚠️ PostService: Post ${id} não encontrado`);
				throw new Error("Post não encontrado");
			}
			console.error(`❌ PostService: Erro post ${id}:`, error);
			throw new Error(`Erro ao carregar post: ${error.message}`);
		}

		console.log(`✅ PostService: Post ${id} carregado`);
		return data;
	}

	// Buscar posts
	static async searchPosts(query, limit = 10) {
		if (!query || query.length < 2) {
			return [];
		}

		console.log(`🚀 PostService: Buscando "${query}"...`);

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

		console.log(`✅ PostService: Busca completada:`, data?.length || 0);
		return data || [];
	}

	// CRUD Operations
	static async createPost(postData) {
		console.log("🚀 PostService: Criando post...");

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

		console.log("✅ PostService: Post criado com sucesso");
		return data;
	}

	static async updatePost(id, postData) {
		console.log(`🚀 PostService: Atualizando post ${id}...`);

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

		console.log(`✅ PostService: Post ${id} atualizado`);
		return data;
	}

	static async deletePost(id) {
		console.log(`🚀 PostService: Deletando post ${id}...`);

		const postId = typeof id === "string" ? parseInt(id, 10) : id;

		const { error } = await supabase.from("posts").delete().eq("id", postId);

		if (error) {
			console.error(`❌ PostService: Erro ao deletar post ${id}:`, error);
			throw new Error(`Erro ao deletar post: ${error.message}`);
		}

		console.log(`✅ PostService: Post ${id} deletado`);
	}

	// Categorias
	static async getCategories() {
		console.log("🚀 PostService: Buscando categorias...");

		const { data, error } = await supabase
			.from("categories")
			.select("*")
			.order("name");

		if (error) {
			console.error("❌ PostService: Erro ao carregar categorias:", error);
			throw new Error(`Erro ao carregar categorias: ${error.message}`);
		}

		console.log("✅ PostService: Categorias carregadas:", data?.length || 0);
		return data || [];
	}
}
