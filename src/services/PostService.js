import { supabase } from "../lib/supabase";
import { dataAPIService } from "./DataAPIService";
import { ImageUploadService } from "./ImageUploadService";

/**
 * PostService - VERSÃO CORRIGIDA PARA RLS
 * - Usa cliente autenticado para operações administrativas
 * - Verifica sessão antes de operações CRUD
 * - Error handling melhorado para RLS
 * - Logs detalhados para debug de permissões
 */

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
		const { data, error } = await supabase
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
		const { data, error } = await supabase
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
		const { data, error } = await supabase
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
		const { data, error } = await supabase
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
	 * HELPER PARA VERIFICAR AUTENTICAÇÃO
	 * ======================================
	 */

	static async verifyAuthenticatedAdmin() {
		try {
			// Verificar se há usuário autenticado
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

			// Verificar se é admin na tabela user_profiles
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

	/**
	 * ======================================
	 * MÉTODOS ADMINISTRATIVOS - VERSÃO CORRIGIDA COM RLS
	 * ======================================
	 */

	static async getAllPostsAdmin() {
		try {
			// CRÍTICO: Verificar autenticação primeiro
			await this.verifyAuthenticatedAdmin();

			const { data, error } = await supabase
				.from("posts")
				.select("*")
				.order("created_at", { ascending: false });

			if (error) {
				console.error("❌ getAllPostsAdmin error:", error);
				throw this.handleRLSError(error);
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

			// CRÍTICO: Verificar autenticação primeiro
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

			// Para admin, manter URLs originais para edição
			return data;
		} catch (error) {
			console.error("❌ PostService.getPostByIdAdmin error:", error);
			throw new Error(`Erro ao carregar post admin: ${error.message}`);
		}
	}

	// MÉTODO CREATEPOST - VERSÃO CORRIGIDA PARA RLS
	static async createPost(postData) {
		/*
		console.log("🆕 PostService.createPost: Iniciando criação de post...");
		console.log("📝 Dados recebidos:", {
			title: postData.title,
			slug: postData.slug,
			category: postData.category,
			image_url: postData.image_url ? "✅ Presente" : "❌ Ausente",
			image_path: postData.image_path ? "✅ Presente" : "❌ Ausente",
			published: postData.published,
			content_length: postData.content?.length || 0,
		});*/

		try {
			// CRÍTICO: Verificar autenticação E permissões primeiro
			// Validar dados obrigatórios
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

			// Preparar dados para inserção - INCLUINDO CAMPOS DE IMAGEM
			const dataToInsert = {
				// Campos básicos
				title: postData.title.trim(),
				slug: postData.slug?.trim() || this.generateSlug(postData.title),
				excerpt: postData.excerpt?.trim() || "",
				content: postData.content.trim(),

				// CAMPOS DE IMAGEM - CRÍTICOS
				image_url: postData.image_url,
				image_path: postData.image_path || null,

				// Categoria e metadados
				category: postData.category,
				category_name: postData.category_name || "",

				// Metadados
				author: postData.author || "Equipe TF",
				read_time: postData.read_time || "5 min",

				// Estados
				published: Boolean(postData.published),
				trending: Boolean(postData.trending),

				// Tags
				tags: Array.isArray(postData.tags) ? postData.tags : [],

				// Timestamps
				created_at: new Date().toISOString(),
				updated_at: new Date().toISOString(),
			};

			// Verificação final
			if (!dataToInsert.image_url) {
				throw new Error("CRÍTICO: image_url não foi definida");
			}

			// REALIZAR INSERÇÃO COM CLIENTE AUTENTICADO
			const { data, error } = await supabase
				.from("posts")
				.insert([dataToInsert])
				.select()
				.single();

			if (error) {
				console.error("❌ Erro na inserção:", error);
				console.error("🔍 Detalhes do erro:", {
					code: error.code,
					message: error.message,
					details: error.details,
					hint: error.hint,
				});

				// Throw do erro tratado pelo RLS handler
				throw this.handleRLSError(error);
			}

			// Invalidar cache do Data API
			try {
				await this.invalidatePublicCache();
				//console.log("🗑️ Cache invalidado com sucesso");
			} catch (cacheError) {
				console.warn("⚠️ Erro ao invalidar cache:", cacheError);
			}

			return data;
		} catch (error) {
			console.error("❌ PostService.createPost error:", error);

			// Log adicional para debug
			console.error("🔍 Error details:", {
				name: error.name,
				message: error.message,
				stack: error.stack,
			});

			throw error; // Re-throw o erro já tratado
		}
	}

	// MÉTODO UPDATEPOST - VERSÃO CORRIGIDA PARA RLS
	static async updatePost(id, postData) {
		try {
			const postId = typeof id === "string" ? parseInt(id, 10) : id;

			if (isNaN(postId)) {
				throw new Error(`ID inválido: ${id}`);
			}

			// CRÍTICO: Verificar autenticação primeiro
			await this.verifyAuthenticatedAdmin();

			// Validar dados obrigatórios
			if (!postData.title) {
				throw new Error("Título é obrigatório");
			}

			if (!postData.image_url) {
				throw new Error("Imagem de capa é obrigatória");
			}

			// Buscar post atual para comparar imagens
			const { data: currentPost } = await supabase
				.from("posts")
				.select("image_path")
				.eq("id", postId)
				.single();

			// Preparar dados para atualização - INCLUINDO CAMPOS DE IMAGEM
			const dataToUpdate = {
				// Campos básicos
				title: postData.title,
				slug: postData.slug,
				excerpt: postData.excerpt,
				content: postData.content,

				// CAMPOS DE IMAGEM - CRÍTICOS
				image_url: postData.image_url,
				image_path: postData.image_path || null,

				// Categoria e metadados
				category: postData.category,
				category_name: postData.category_name,

				// Metadados
				author: postData.author || "Equipe TF",
				read_time: postData.read_time || "5 min",

				// Estados
				published: Boolean(postData.published),
				trending: Boolean(postData.trending),

				// Tags
				tags: Array.isArray(postData.tags) ? postData.tags : [],

				// Timestamp de atualização
				updated_at: new Date().toISOString(),
			};

			// Verificação final
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
			throw error; // Re-throw o erro já tratado
		}
	}

	static async deletePost(id) {
		try {
			const postId = typeof id === "string" ? parseInt(id, 10) : id;

			// CRÍTICO: Verificar autenticação primeiro
			await this.verifyAuthenticatedAdmin();

			// Buscar imagem do post antes de deletar
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

			// Agendar limpeza da imagem
			if (postToDelete?.image_path) {
				this.scheduleImageCleanup(postToDelete.image_path);
			}

			// Invalidar cache do Data API
			await this.invalidatePublicCache();
		} catch (error) {
			console.error("❌ PostService.deletePost error:", error);
			throw error; // Re-throw o erro já tratado
		}
	}

	/**
	 * ======================================
	 * ERROR HANDLING MELHORADO PARA RLS
	 * ======================================
	 */

	static handleRLSError(error) {
		console.error("🔍 Analisando erro RLS:", error);

		// Erros de permissão específicos
		if (
			error.code === "42501" ||
			error.message?.includes("permission denied")
		) {
			return new Error(
				"Erro de permissão: Verifique se você está logado como administrador"
			);
		}

		// Erros de política RLS
		if (
			error.code === "PGRST301" ||
			error.message?.includes("policy") ||
			error.message?.includes("RLS")
		) {
			return new Error(
				"Política de segurança: Suas permissões não permitem esta operação"
			);
		}

		// Erros de autenticação
		if (error.code === "PGRST302" || error.message?.includes("JWT")) {
			return new Error("Sessão expirada: Faça login novamente para continuar");
		}

		// Erros de dados duplicados
		if (error.message?.includes("duplicate") || error.code === "23505") {
			return new Error("Já existe um post com este slug");
		}

		// Erros de campos obrigatórios
		if (error.message?.includes("null value") || error.code === "23502") {
			return new Error("Alguns campos obrigatórios não foram preenchidos");
		}

		// Erros de chave estrangeira
		if (error.message?.includes("foreign key") || error.code === "23503") {
			return new Error("Categoria inválida selecionada");
		}

		// Erro genérico com mais contexto
		return new Error(`Erro no banco de dados: ${error.message}`);
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
	 * Gerar slug a partir do título
	 */
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

	/**
	 * ======================================
	 * MÉTODOS DE DEBUG E DIAGNÓSTICO
	 * ======================================
	 */

	// Verificar schema da tabela posts
	static async debugTableSchema() {
		try {
			const { data, error } = await supabase.from("posts").select("*").limit(1);

			if (error) {
				console.error("❌ Erro ao verificar schema:", error);
				return { success: false, error };
			}

			const columns = data.length > 0 ? Object.keys(data[0]) : [];

			return { success: true, columns, sampleData: data[0] };
		} catch (error) {
			console.error("❌ debugTableSchema error:", error);
			return { success: false, error };
		}
	}

	// Testar inserção simples
	static async debugTestInsert() {
		try {
			// Verificar autenticação primeiro
			await this.verifyAuthenticatedAdmin();

			const testData = {
				title: "Post de Teste",
				slug: "post-de-teste-" + Date.now(),
				excerpt: "Este é um post de teste",
				content: "Conteúdo do post de teste",
				image_url: "https://example.com/test.jpg",
				image_path: "test/image.jpg",
				category: "f1",
				category_name: "Fórmula 1",
				author: "Admin",
				read_time: "5 min",
				published: false,
				trending: false,
				tags: ["teste"],
				created_at: new Date().toISOString(),
				updated_at: new Date().toISOString(),
			};

			const { data, error } = await supabase
				.from("posts")
				.insert([testData])
				.select()
				.single();

			if (error) {
				console.error("❌ debugTestInsert error:", error);
				return { success: false, error: this.handleRLSError(error) };
			}

			// Limpar teste
			await supabase.from("posts").delete().eq("id", data.id);

			return { success: true, data };
		} catch (error) {
			console.error("❌ debugTestInsert error:", error);
			return { success: false, error };
		}
	}

	// Verificar permissões RLS
	static async debugCheckPermissions() {
		try {
			// Primeiro verificar autenticação
			const authResult = await this.verifyAuthenticatedAdmin();

			// Tentar diferentes operações
			const tests = {
				auth: !!authResult.user,
				isAdmin: authResult.profile?.role === "admin",
				select: false,
				insert: false,
				update: false,
				delete: false,
			};

			// Teste SELECT
			try {
				await supabase.from("posts").select("id").limit(1);
				tests.select = true;
			} catch (error) {
				console.warn("⚠️ SELECT falhou:", error.message);
			}

			// Teste INSERT (com dados de teste)
			try {
				const { data, error } = await supabase
					.from("posts")
					.insert([
						{
							title: "Teste Permissão",
							slug: "teste-permissao-" + Date.now(),
							excerpt: "Teste",
							content: "Teste",
							image_url: "https://example.com/test.jpg",
							category: "f1",
							published: false,
						},
					])
					.select()
					.single();

				if (!error) {
					tests.insert = true;
					// Limpar imediatamente
					await supabase.from("posts").delete().eq("id", data.id);
				}
			} catch (error) {
				console.warn("⚠️ INSERT falhou:", error.message);
			}

			return tests;
		} catch (error) {
			console.error("❌ debugCheckPermissions error:", error);
			return { error: error.message };
		}
	}

	// Método principal de diagnóstico
	static async runDiagnostics() {
		const results = {
			timestamp: new Date().toISOString(),
			schema: await this.debugTableSchema(),
			permissions: await this.debugCheckPermissions(),
			testInsert: await this.debugTestInsert(),
		};

		return results;
	}
}
