import { supabase } from "../lib/supabase";
import { ImageUploadService } from "./ImageUploadService";

/**
 * PostService CORRIGIDO - SEMPRE BUSCAR CATEGORIAS DO BANCO
 * Remove fallbacks e placeholders que interferem nos dados reais
 */

export class PostService {
	/**
	 * ======================================
	 * CATEGORIAS - SEMPRE DO BANCO DE DADOS
	 * ======================================
	 */

	// Buscar TODAS as categorias do banco - SEM FALLBACKS
	static async getCategories() {
		try {
			console.log("🔍 Buscando categorias do banco de dados...");

			const { data, error } = await supabase
				.from("categories")
				.select("*")
				.order("level, sort_order, name");

			if (error) {
				console.error("❌ Erro ao buscar categorias:", error);
				throw error;
			}

			console.log(`✅ Encontradas ${data?.length || 0} categorias no banco`);

			// Limpar cache local se dados mudaram
			if (data && data.length > 0) {
				localStorage.setItem(
					"tf-cache-categories-db",
					JSON.stringify({
						data,
						timestamp: Date.now(),
					})
				);
			}

			return data || [];
		} catch (error) {
			console.error("❌ Erro crítico ao buscar categorias:", error);
			throw error;
		}
	}

	// Buscar categoria por slug - DIRETO DO BANCO
	static async getCategoryBySlug(slug) {
		if (!slug) {
			throw new Error("Slug é obrigatório");
		}

		try {
			console.log(`🔍 Buscando categoria com slug: "${slug}"`);

			const { data, error } = await supabase
				.from("categories")
				.select("*")
				.eq("slug", slug)
				.eq("is_active", true)
				.single();

			if (error) {
				if (error.code === "PGRST116") {
					console.warn(`⚠️ Categoria não encontrada: "${slug}"`);
					throw new Error(`Categoria "${slug}" não encontrada`);
				}
				console.error("❌ Erro ao buscar categoria por slug:", error);
				throw error;
			}

			console.log(`✅ Categoria encontrada: ${data.name} (${data.slug})`);
			return data;
		} catch (error) {
			console.error(`❌ Erro ao buscar categoria "${slug}":`, error);
			throw error;
		}
	}

	// Buscar hierarquia completa - DIRETO DO BANCO
	static async getCategoriesHierarchy() {
		try {
			console.log("🔍 Buscando hierarquia de categorias...");

			// Primeiro tentar view otimizada
			let { data, error } = await supabase
				.from("categories_hierarchy")
				.select("*")
				.eq("is_active", true)
				.order("level, sort_order, name");

			// Se view não existir, usar tabela normal
			if (error && error.code === "42P01") {
				console.warn(
					"⚠️ View categories_hierarchy não existe, usando tabela normal"
				);
				({ data, error } = await supabase
					.from("categories")
					.select("*")
					.eq("is_active", true)
					.order("level, sort_order, name"));
			}

			if (error) {
				console.error("❌ Erro ao buscar hierarquia:", error);
				throw error;
			}

			console.log(`✅ Hierarquia carregada: ${data?.length || 0} categorias`);
			return data || [];
		} catch (error) {
			console.error("❌ Erro crítico na hierarquia:", error);
			throw error;
		}
	}

	// Buscar categorias por nível
	static async getCategoriesByLevel(level, parentId = null) {
		try {
			console.log(`🔍 Buscando categorias nível ${level}, parent: ${parentId}`);

			let query = supabase
				.from("categories")
				.select("*")
				.eq("level", level)
				.eq("is_active", true);

			if (parentId) {
				query = query.eq("parent_id", parentId);
			} else {
				query = query.is("parent_id", null);
			}

			const { data, error } = await query.order("sort_order, name");

			if (error) {
				console.error(`❌ Erro ao buscar categorias nível ${level}:`, error);
				throw error;
			}

			console.log(
				`✅ Encontradas ${data?.length || 0} categorias nível ${level}`
			);
			return data || [];
		} catch (error) {
			console.error(`❌ Erro crítico nível ${level}:`, error);
			throw error;
		}
	}

	// Buscar filhos de uma categoria
	static async getCategoryChildren(categoryId) {
		if (!categoryId) return [];

		try {
			console.log(`🔍 Buscando filhos da categoria: ${categoryId}`);

			const { data, error } = await supabase
				.from("categories")
				.select("*")
				.eq("parent_id", categoryId)
				.eq("is_active", true)
				.order("sort_order, name");

			if (error) {
				console.error(`❌ Erro ao buscar filhos de ${categoryId}:`, error);
				throw error;
			}

			console.log(
				`✅ Encontrados ${data?.length || 0} filhos para ${categoryId}`
			);
			return data || [];
		} catch (error) {
			console.error(`❌ Erro crítico filhos ${categoryId}:`, error);
			return [];
		}
	}

	// Buscar breadcrumb de uma categoria
	static async getCategoryBreadcrumb(categoryId) {
		if (!categoryId) return [];

		try {
			console.log(`🔍 Gerando breadcrumb para: ${categoryId}`);

			const breadcrumb = [];
			let currentId = categoryId;

			while (currentId) {
				const { data, error } = await supabase
					.from("categories")
					.select("id, name, slug, parent_id")
					.eq("id", currentId)
					.single();

				if (error || !data) {
					console.warn(
						`⚠️ Categoria não encontrada no breadcrumb: ${currentId}`
					);
					break;
				}

				breadcrumb.unshift(data);
				currentId = data.parent_id;
			}

			console.log(`✅ Breadcrumb gerado: ${breadcrumb.length} níveis`);
			return breadcrumb;
		} catch (error) {
			console.error(`❌ Erro no breadcrumb ${categoryId}:`, error);
			return [];
		}
	}

	// Estrutura do mega menu - DIRETO DO BANCO
	static async getMegaMenuStructure() {
		try {
			console.log("🔍 Construindo estrutura do mega menu...");

			// Buscar todas as categorias ativas
			const { data: categories, error } = await supabase
				.from("categories")
				.select("*")
				.eq("is_active", true)
				.order("level, sort_order, name");

			if (error) {
				console.error("❌ Erro ao buscar categorias para mega menu:", error);
				throw error;
			}

			// Construir estrutura hierárquica
			const result = {};

			// Primeiro, adicionar categorias nível 1
			categories
				.filter((cat) => cat.level === 1)
				.forEach((cat) => {
					result[cat.id] = {
						id: cat.id,
						name: cat.name,
						color: cat.color || "from-gray-500 to-gray-400",
						icon: cat.icon || "📁",
						subcategories: {},
					};
				});

			// Depois, adicionar subcategorias nível 2
			categories
				.filter((cat) => cat.level === 2 && cat.parent_id)
				.forEach((cat) => {
					if (result[cat.parent_id]) {
						result[cat.parent_id].subcategories[cat.id] = {
							id: cat.id,
							name: cat.name,
							slug: cat.slug,
							href: `/${cat.slug}`,
							items: [],
						};
					}
				});

			// Finalmente, adicionar sub-subcategorias nível 3
			categories
				.filter((cat) => cat.level === 3 && cat.parent_id)
				.forEach((cat) => {
					// Encontrar categoria pai nível 2
					const parentLevel2 = categories.find((c) => c.id === cat.parent_id);
					if (parentLevel2 && parentLevel2.parent_id) {
						const grandparent = result[parentLevel2.parent_id];
						if (grandparent && grandparent.subcategories[parentLevel2.id]) {
							grandparent.subcategories[parentLevel2.id].items.push({
								id: cat.id,
								name: cat.name,
								slug: cat.slug,
								href: `/${cat.slug}`,
							});
						}
					}
				});

			console.log(
				`✅ Mega menu estruturado: ${
					Object.keys(result).length
				} categorias principais`
			);
			return result;
		} catch (error) {
			console.error("❌ Erro crítico no mega menu:", error);
			throw error;
		}
	}

	/**
	 * ======================================
	 * POSTS - MÉTODOS SIMPLES
	 * ======================================
	 */

	// Posts em destaque
	static async getFeaturedPosts() {
		try {
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
		} catch (error) {
			console.error("❌ Erro ao buscar posts em destaque:", error);
			return [];
		}
	}

	// Todos os posts
	static async getAllPosts() {
		try {
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
		} catch (error) {
			console.error("❌ Erro ao buscar todos os posts:", error);
			return [];
		}
	}

	// Posts por categoria
	static async getPostsByCategory(categoryId) {
		if (!categoryId) return [];

		try {
			console.log(`🔍 Buscando posts da categoria: ${categoryId}`);

			const { data, error } = await supabase
				.from("posts")
				.select("*")
				.eq("published", true)
				.eq("category", categoryId)
				.order("created_at", { ascending: false });

			if (error) throw error;

			console.log(
				`✅ Encontrados ${data?.length || 0} posts para categoria ${categoryId}`
			);

			return (data || []).map((post) => ({
				...post,
				image_url: this.getOptimizedImageUrl(post.image_path, post.image_url),
			}));
		} catch (error) {
			console.error(
				`❌ Erro ao buscar posts da categoria ${categoryId}:`,
				error
			);
			return [];
		}
	}

	// Post individual
	static async getPostById(id) {
		if (!id) throw new Error("Post ID é obrigatório");

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
		} catch (error) {
			console.error(`❌ Erro ao buscar post ${id}:`, error);
			throw error;
		}
	}

	// Buscar posts
	static async searchPosts(query) {
		if (!query || query.length < 2) return [];

		try {
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
		} catch (error) {
			console.error("❌ Erro na busca:", error);
			return [];
		}
	}

	/**
	 * ======================================
	 * MÉTODOS ADMIN - SEM ALTERAÇÕES
	 * ======================================
	 */

	static async verifyAuthenticatedAdmin() {
		try {
			const {
				data: { user },
				error: authError,
			} = await supabase.auth.getUser();

			if (authError || !user) {
				throw new Error("Usuário não autenticado");
			}

			const { data: profile, error: profileError } = await supabase
				.from("user_profiles")
				.select("role")
				.eq("id", user.id)
				.single();

			if (profileError || profile?.role !== "admin") {
				throw new Error("Usuário não tem permissões de administrador");
			}

			return { user, profile };
		} catch (error) {
			console.error("❌ Erro de autenticação admin:", error);
			throw error;
		}
	}

	// Criar categoria
	static async createCategory(categoryData) {
		try {
			await this.verifyAuthenticatedAdmin();

			const dataToInsert = {
				id: categoryData.id || this.generateCategoryId(categoryData.name),
				name: categoryData.name.trim(),
				description: categoryData.description?.trim() || "",
				slug: categoryData.slug || this.generateSlug(categoryData.name),
				color: categoryData.color || "from-gray-500 to-gray-400",
				icon: categoryData.icon || "📁",
				parent_id: categoryData.parent_id || null,
				level: categoryData.level || 1,
				sort_order: categoryData.sort_order || 0,
				is_active: categoryData.is_active !== false,
				meta_title: categoryData.meta_title || categoryData.name,
				meta_description:
					categoryData.meta_description || categoryData.description,
				created_at: new Date().toISOString(),
				updated_at: new Date().toISOString(),
			};

			const { data, error } = await supabase
				.from("categories")
				.insert([dataToInsert])
				.select()
				.single();

			if (error) {
				console.error("❌ Erro ao criar categoria:", error);
				throw error;
			}

			// Limpar cache
			this.clearCategoriesCache();
			return data;
		} catch (error) {
			console.error("❌ createCategory error:", error);
			throw error;
		}
	}

	// Atualizar categoria
	static async updateCategory(id, categoryData) {
		try {
			await this.verifyAuthenticatedAdmin();

			const dataToUpdate = {
				name: categoryData.name,
				description: categoryData.description,
				slug: categoryData.slug,
				color: categoryData.color,
				icon: categoryData.icon,
				parent_id: categoryData.parent_id,
				level: categoryData.level,
				sort_order: categoryData.sort_order,
				is_active: categoryData.is_active,
				meta_title: categoryData.meta_title,
				meta_description: categoryData.meta_description,
				updated_at: new Date().toISOString(),
			};

			const { data, error } = await supabase
				.from("categories")
				.update(dataToUpdate)
				.eq("id", id)
				.select()
				.single();

			if (error) {
				console.error("❌ Erro ao atualizar categoria:", error);
				throw error;
			}

			this.clearCategoriesCache();
			return data;
		} catch (error) {
			console.error("❌ updateCategory error:", error);
			throw error;
		}
	}

	// Deletar categoria
	static async deleteCategory(id) {
		try {
			await this.verifyAuthenticatedAdmin();

			// Verificar se tem filhos
			const children = await this.getCategoryChildren(id);
			if (children.length > 0) {
				throw new Error(
					"Não é possível deletar categoria que possui subcategorias"
				);
			}

			// Verificar se tem posts
			const { count } = await supabase
				.from("posts")
				.select("*", { count: "exact", head: true })
				.eq("category", id);

			if (count > 0) {
				throw new Error(
					`Não é possível deletar categoria que possui ${count} posts`
				);
			}

			const { error } = await supabase.from("categories").delete().eq("id", id);

			if (error) {
				console.error("❌ Erro ao deletar categoria:", error);
				throw error;
			}

			this.clearCategoriesCache();
		} catch (error) {
			console.error("❌ deleteCategory error:", error);
			throw error;
		}
	}

	/**
	 * ======================================
	 * UTILITIES
	 * ======================================
	 */

	static getOptimizedImageUrl(imagePath, originalUrl, size = "800x600") {
		if (imagePath && ImageUploadService?.getOptimizedImageUrl) {
			return ImageUploadService.getOptimizedImageUrl(imagePath, size);
		}

		if (originalUrl) {
			return originalUrl;
		}

		return "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&h=600&fit=crop";
	}

	static generateSlug(title) {
		if (!title) return `item-${Date.now()}`;

		return title
			.toLowerCase()
			.normalize("NFD")
			.replace(/[\u0300-\u036f]/g, "")
			.replace(/[^a-z0-9\s-]/g, "")
			.replace(/\s+/g, "-")
			.replace(/-+/g, "-")
			.trim();
	}

	static generateCategoryId(name) {
		return this.generateSlug(name).slice(0, 50);
	}

	static clearCategoriesCache() {
		try {
			// Limpar cache local
			localStorage.removeItem("tf-cache-categories-db");

			// Limpar cache do query client se disponível
			if (window.queryClient) {
				window.queryClient.invalidateQueries({
					queryKey: ["public", "categories"],
				});
				window.queryClient.invalidateQueries({
					queryKey: ["admin", "categories"],
				});
			}

			console.log("🗑️ Cache de categorias limpo");
		} catch (error) {
			console.warn("⚠️ Erro ao limpar cache:", error);
		}
	}

	/**
	 * ======================================
	 * DEBUG E DIAGNÓSTICO
	 * ======================================
	 */

	static async debugCategories() {
		console.log("🔍 === DEBUG CATEGORIAS ===");

		try {
			const categories = await this.getCategories();
			console.log(`✅ Total de categorias encontradas: ${categories.length}`);

			if (categories.length > 0) {
				console.table(
					categories.map((c) => ({
						id: c.id,
						name: c.name,
						slug: c.slug,
						level: c.level,
						parent_id: c.parent_id,
						is_active: c.is_active,
					}))
				);
			}

			return {
				success: true,
				count: categories.length,
				categories: categories.map((c) => ({
					id: c.id,
					name: c.name,
					slug: c.slug,
				})),
			};
		} catch (error) {
			console.error("❌ Debug failed:", error);
			return {
				success: false,
				error: error.message,
			};
		}
	}

	static async testCategoryRouting(slug) {
		console.log(`🧪 Testando roteamento para slug: "${slug}"`);

		try {
			const category = await this.getCategoryBySlug(slug);
			const children = await this.getCategoryChildren(category.id);
			const posts = await this.getPostsByCategory(category.id);

			console.log(`✅ Categoria encontrada: ${category.name}`);
			console.log(`✅ Filhos: ${children.length}`);
			console.log(`✅ Posts: ${posts.length}`);

			return {
				success: true,
				category,
				children,
				posts,
			};
		} catch (error) {
			console.error(`❌ Teste falhou para "${slug}":`, error);
			return {
				success: false,
				error: error.message,
			};
		}
	}

	// Métodos admin para posts (mantendo compatibilidade)
	static async getAllPostsAdmin() {
		try {
			await this.verifyAuthenticatedAdmin();

			const { data, error } = await supabase
				.from("posts")
				.select("*")
				.order("created_at", { ascending: false });

			if (error) {
				console.error("❌ getAllPostsAdmin error:", error);
				throw error;
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
				throw error;
			}

			return data;
		} catch (error) {
			console.error("❌ PostService.getPostByIdAdmin error:", error);
			throw new Error(`Erro ao carregar post admin: ${error.message}`);
		}
	}

	// Métodos de posts admin (create, update, delete)
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

			const { data, error } = await supabase
				.from("posts")
				.insert([dataToInsert])
				.select()
				.single();

			if (error) {
				console.error("❌ Erro na inserção:", error);
				throw error;
			}

			this.clearCategoriesCache();
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

			const { data, error } = await supabase
				.from("posts")
				.update(dataToUpdate)
				.eq("id", postId)
				.select()
				.single();

			if (error) {
				console.error("❌ updatePost error:", error);
				throw error;
			}

			this.clearCategoriesCache();
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

			const { error } = await supabase.from("posts").delete().eq("id", postId);

			if (error) {
				console.error("❌ deletePost error:", error);
				throw error;
			}

			this.clearCategoriesCache();
		} catch (error) {
			console.error("❌ PostService.deletePost error:", error);
			throw error;
		}
	}
}
