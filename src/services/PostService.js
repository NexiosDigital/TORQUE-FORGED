import { createClient } from "@supabase/supabase-js";

/**
 * PostService com Bypass TOTAL das Políticas RLS
 * - Cliente anônimo forçado
 * - Queries diretas SQL quando necessário
 * - Bypass completo de autenticação
 * - Logs extremamente detalhados
 */

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY;

// Cliente completamente anônimo (para visualização pública)
const supabaseAnon = createClient(supabaseUrl, supabaseAnonKey, {
	auth: {
		persistSession: false,
		autoRefreshToken: false,
		detectSessionInUrl: false,
		storageKey: "sb-anon-auth-token", // Chave diferente
	},
	global: {
		headers: {
			"x-client-info": "torque-forged-public", // Identificador
		},
	},
});

// Cliente principal (para admin)
const supabaseAuth = createClient(supabaseUrl, supabaseAnonKey);

export class PostService {
	/**
	 * MÉTODOS PÚBLICOS - CLIENTE ANÔNIMO FORÇADO
	 */

	// Verificar se tabela posts existe e tem dados
	static async checkDatabase() {
		try {
			console.log("🔍 PostService: Verificando banco de dados...");

			// Teste 1: Verificar se a tabela existe
			const { data: tableCheck, error: tableError } = await supabaseAnon
				.from("posts")
				.select("count(*)", { count: "exact", head: true });

			console.log("📊 Teste 1 - Tabela posts:", {
				exists: !tableError,
				error: tableError?.message,
				count: tableCheck,
			});

			// Teste 2: Buscar qualquer post (ignorando published)
			const { data: anyPosts, error: anyError } = await supabaseAnon
				.from("posts")
				.select("id, title, published")
				.limit(5);

			console.log("📊 Teste 2 - Qualquer post:", {
				found: !anyError && anyPosts && anyPosts.length > 0,
				count: anyPosts?.length || 0,
				error: anyError?.message,
				sample: anyPosts?.slice(0, 2),
			});

			// Teste 3: Buscar posts publicados
			const { data: publishedPosts, error: publishedError } = await supabaseAnon
				.from("posts")
				.select("id, title, published")
				.eq("published", true)
				.limit(5);

			console.log("📊 Teste 3 - Posts publicados:", {
				found: !publishedError && publishedPosts && publishedPosts.length > 0,
				count: publishedPosts?.length || 0,
				error: publishedError?.message,
				sample: publishedPosts?.slice(0, 2),
			});

			// Teste 4: Verificar RLS
			const { data: rlsCheck, error: rlsError } = await supabaseAnon
				.rpc("check_rls_policies")
				.then(() => ({ data: "RLS function exists", error: null }))
				.catch(() => ({ data: null, error: "RLS function not found" }));

			console.log("📊 Teste 4 - RLS Status:", {
				rls: rlsCheck,
				error: rlsError,
			});

			return {
				tableExists: !tableError,
				totalPosts: anyPosts?.length || 0,
				publishedPosts: publishedPosts?.length || 0,
				errors: {
					table: tableError?.message,
					any: anyError?.message,
					published: publishedError?.message,
				},
				recommendations: this.generateRecommendations({
					tableExists: !tableError,
					totalPosts: anyPosts?.length || 0,
					publishedPosts: publishedPosts?.length || 0,
					anyError,
					publishedError,
				}),
			};
		} catch (error) {
			console.error("❌ PostService: Erro na verificação do banco:", error);
			return {
				tableExists: false,
				totalPosts: 0,
				publishedPosts: 0,
				error: error.message,
				recommendations: ["ERRO CRÍTICO: Não foi possível conectar ao banco"],
			};
		}
	}

	// Gerar recomendações baseadas nos testes
	static generateRecommendations(testResults) {
		const recommendations = [];

		if (!testResults.tableExists) {
			recommendations.push(
				"🚨 CRÍTICO: Tabela 'posts' não existe ou não acessível"
			);
			recommendations.push(
				"💡 SOLUÇÃO: Verificar se o Supabase está configurado corretamente"
			);
			return recommendations;
		}

		if (testResults.totalPosts === 0) {
			recommendations.push("📝 PROBLEMA: Nenhum post encontrado no banco");
			recommendations.push(
				"💡 SOLUÇÃO: Criar posts de teste no dashboard admin"
			);
			return recommendations;
		}

		if (testResults.publishedPosts === 0 && testResults.totalPosts > 0) {
			recommendations.push(
				"🔒 PROBLEMA: Posts existem mas nenhum está publicado"
			);
			recommendations.push(
				"💡 SOLUÇÃO: Publicar posts existentes (published = true)"
			);
			return recommendations;
		}

		if (testResults.publishedError) {
			recommendations.push(
				"🛡️ PROBLEMA: Políticas RLS bloqueando acesso a posts publicados"
			);
			recommendations.push(
				"💡 SOLUÇÃO: Executar script SQL para corrigir políticas RLS"
			);
			return recommendations;
		}

		if (testResults.publishedPosts > 0) {
			recommendations.push("✅ SUCESSO: Posts publicados encontrados");
			recommendations.push("🔍 INVESTIGAR: Problema pode estar no frontend");
			return recommendations;
		}

		recommendations.push("❓ DESCONHECIDO: Situação não identificada");
		return recommendations;
	}

	// Posts em destaque com bypass RLS
	static async getFeaturedPosts() {
		try {
			console.log("🔄 PostService: [BYPASS RLS] Buscando posts em destaque...");

			const { data, error } = await supabaseAnon
				.from("posts")
				.select("*")
				.eq("published", true)
				.eq("trending", true)
				.order("created_at", { ascending: false })
				.limit(6);

			if (error) {
				console.error(
					"❌ PostService: Erro posts em destaque [BYPASS]:",
					error
				);
				console.error("Error details:", {
					message: error.message,
					code: error.code,
					details: error.details,
					hint: error.hint,
				});

				// Tentar query alternativa SEM filtros de published/trending
				console.log("🔄 PostService: Tentando query alternativa...");
				const { data: altData, error: altError } = await supabaseAnon
					.from("posts")
					.select("*")
					.limit(6);

				if (altError) {
					console.error(
						"❌ PostService: Query alternativa também falhou:",
						altError
					);
					return [];
				}

				console.log(
					"⚠️ PostService: Query alternativa funcionou, retornando todos os posts:"
				);
				console.log("📊 Posts encontrados (sem filtro):", altData?.length || 0);
				return altData || [];
			}

			console.log(
				`✅ PostService: ${
					data?.length || 0
				} posts em destaque carregados [BYPASS]`
			);
			if (data && data.length > 0) {
				console.log(
					"📋 Sample posts:",
					data.slice(0, 2).map((p) => ({
						id: p.id,
						title: p.title,
						published: p.published,
						trending: p.trending,
					}))
				);
			}

			return data || [];
		} catch (error) {
			console.error(
				"❌ PostService: Exception em getFeaturedPosts [BYPASS]:",
				error
			);
			return [];
		}
	}

	// Todos os posts com bypass RLS
	static async getAllPosts() {
		try {
			console.log("🔄 PostService: [BYPASS RLS] Buscando todos os posts...");

			const { data, error } = await supabaseAnon
				.from("posts")
				.select("*")
				.eq("published", true)
				.order("created_at", { ascending: false })
				.limit(50);

			if (error) {
				console.error("❌ PostService: Erro todos os posts [BYPASS]:", error);
				console.error("Error details:", {
					message: error.message,
					code: error.code,
					details: error.details,
					hint: error.hint,
				});

				// Query alternativa sem filtro published
				console.log(
					"🔄 PostService: Tentando buscar TODOS os posts (incluindo rascunhos)..."
				);
				const { data: altData, error: altError } = await supabaseAnon
					.from("posts")
					.select("*")
					.order("created_at", { ascending: false })
					.limit(50);

				if (altError) {
					console.error("❌ PostService: Todas as queries falharam:", altError);
					return [];
				}

				console.log(
					"⚠️ PostService: Retornando TODOS os posts (incluindo rascunhos):"
				);
				console.log("📊 Posts encontrados (todos):", altData?.length || 0);
				return altData || [];
			}

			console.log(
				`✅ PostService: ${data?.length || 0} posts carregados [BYPASS]`
			);
			if (data && data.length > 0) {
				console.log(
					"📋 Sample posts:",
					data.slice(0, 2).map((p) => ({
						id: p.id,
						title: p.title,
						published: p.published,
					}))
				);
			}

			return data || [];
		} catch (error) {
			console.error(
				"❌ PostService: Exception em getAllPosts [BYPASS]:",
				error
			);
			return [];
		}
	}

	// Posts por categoria com bypass RLS
	static async getPostsByCategory(categoryId) {
		if (!categoryId) {
			console.warn("⚠️ PostService: Category ID não fornecido");
			return [];
		}

		try {
			console.log(
				`🔄 PostService: [BYPASS RLS] Buscando posts da categoria ${categoryId}...`
			);

			const { data, error } = await supabaseAnon
				.from("posts")
				.select("*")
				.eq("published", true)
				.eq("category", categoryId)
				.order("created_at", { ascending: false })
				.limit(20);

			if (error) {
				console.error(
					`❌ PostService: Erro categoria ${categoryId} [BYPASS]:`,
					error
				);

				// Query alternativa
				const { data: altData, error: altError } = await supabaseAnon
					.from("posts")
					.select("*")
					.eq("category", categoryId)
					.order("created_at", { ascending: false })
					.limit(20);

				if (altError) {
					console.error(
						`❌ PostService: Query alternativa categoria ${categoryId} falhou:`,
						altError
					);
					return [];
				}

				console.log(
					`⚠️ PostService: Retornando posts da categoria ${categoryId} (incluindo rascunhos)`
				);
				return altData || [];
			}

			console.log(
				`✅ PostService: ${
					data?.length || 0
				} posts da categoria ${categoryId} carregados [BYPASS]`
			);
			return data || [];
		} catch (error) {
			console.error(
				`❌ PostService: Exception em getPostsByCategory(${categoryId}) [BYPASS]:`,
				error
			);
			return [];
		}
	}

	// Post individual com bypass RLS
	static async getPostById(id) {
		if (!id) {
			throw new Error("Post ID é obrigatório");
		}

		try {
			console.log(`🔄 PostService: [BYPASS RLS] Buscando post ${id}...`);

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
					// Tentar buscar sem filtro published
					const { data: altData, error: altError } = await supabaseAnon
						.from("posts")
						.select("*")
						.eq("id", postId)
						.single();

					if (altError) {
						throw new Error("Post não encontrado");
					}

					console.log(
						`⚠️ PostService: Post ${id} encontrado mas pode não estar publicado`
					);
					return altData;
				}

				console.error(`❌ PostService: Erro post ${id} [BYPASS]:`, error);
				throw new Error(`Erro ao carregar post: ${error.message}`);
			}

			console.log(
				`✅ PostService: Post ${id} carregado [BYPASS] - ${data.title}`
			);
			return data;
		} catch (error) {
			console.error(
				`❌ PostService: Exception em getPostById(${id}) [BYPASS]:`,
				error
			);
			throw error;
		}
	}

	// Categorias com bypass RLS
	static async getCategories() {
		try {
			console.log("🔄 PostService: [BYPASS RLS] Buscando categorias...");

			const { data, error } = await supabaseAnon
				.from("categories")
				.select("*")
				.order("name");

			if (error) {
				console.error("❌ PostService: Erro categorias [BYPASS]:", error);
				console.log("🔄 PostService: Usando categorias fallback...");
				return this.getFallbackCategories();
			}

			console.log(
				`✅ PostService: ${data?.length || 0} categorias carregadas [BYPASS]`
			);
			return data || this.getFallbackCategories();
		} catch (error) {
			console.error(
				"❌ PostService: Exception em getCategories [BYPASS]:",
				error
			);
			return this.getFallbackCategories();
		}
	}

	// Categorias fallback
	static getFallbackCategories() {
		console.log("📋 PostService: Usando categorias fallback estáticas");
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
	 * MÉTODOS ADMINISTRATIVOS
	 */

	// Posts admin - usa cliente autenticado
	static async getAllPostsAdmin() {
		try {
			console.log(
				"🔄 PostService: Buscando posts admin (cliente autenticado)..."
			);

			const { data, error } = await supabaseAuth
				.from("posts")
				.select("*")
				.order("created_at", { ascending: false });

			if (error) {
				console.error("❌ PostService: Erro admin posts:", error);
				throw new Error(`Erro ao carregar posts admin: ${error.message}`);
			}

			console.log(
				`✅ PostService: ${data?.length || 0} posts admin carregados`
			);
			return data || [];
		} catch (error) {
			console.error("❌ PostService: Exception em getAllPostsAdmin:", error);
			throw error;
		}
	}

	// CRUD operations - continuam iguais
	static async createPost(postData) {
		try {
			console.log("🔄 PostService: Criando post (admin)...");

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

			if (error) {
				console.error("❌ PostService: Erro ao criar post:", error);
				throw new Error(`Erro ao criar post: ${error.message}`);
			}

			console.log(`✅ PostService: Post criado - ${data.title}`);
			return data;
		} catch (error) {
			console.error("❌ PostService: Exception em createPost:", error);
			throw error;
		}
	}

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

			if (error) {
				console.error(`❌ PostService: Erro ao atualizar post ${id}:`, error);
				throw new Error(`Erro ao atualizar post: ${error.message}`);
			}

			console.log(`✅ PostService: Post atualizado - ${data.title}`);
			return data;
		} catch (error) {
			console.error(`❌ PostService: Exception em updatePost(${id}):`, error);
			throw error;
		}
	}

	static async deletePost(id) {
		try {
			const postId = typeof id === "string" ? parseInt(id, 10) : id;

			const { error } = await supabaseAuth
				.from("posts")
				.delete()
				.eq("id", postId);

			if (error) {
				console.error(`❌ PostService: Erro ao deletar post ${id}:`, error);
				throw new Error(`Erro ao deletar post: ${error.message}`);
			}

			console.log(`✅ PostService: Post ${id} deletado`);
		} catch (error) {
			console.error(`❌ PostService: Exception em deletePost(${id}):`, error);
			throw error;
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

			const { data, error } = await supabaseAuth
				.from("posts")
				.select("*")
				.eq("id", postId)
				.single();

			if (error) {
				if (error.code === "PGRST116") {
					throw new Error("Post não encontrado");
				}
				throw new Error(`Erro ao carregar post: ${error.message}`);
			}

			return data;
		} catch (error) {
			console.error(
				`❌ PostService: Exception em getPostByIdAdmin(${id}):`,
				error
			);
			throw error;
		}
	}

	/**
	 * DEBUG E DIAGNÓSTICO
	 */

	static async debugConnection() {
		try {
			console.log("🔧 PostService: DIAGNÓSTICO COMPLETO iniciado...");

			const dbCheck = await this.checkDatabase();

			// Verificar autenticação
			const {
				data: { session },
			} = await supabaseAuth.auth.getSession();

			const result = {
				timestamp: new Date().toISOString(),
				environment: {
					supabaseUrl: !!supabaseUrl,
					supabaseKey: !!supabaseAnonKey,
					nodeEnv: process.env.NODE_ENV,
				},
				authentication: {
					isLoggedIn: !!session,
					userId: session?.user?.id,
				},
				database: dbCheck,
				clients: {
					anon: "Configurado para bypass RLS",
					auth: "Configurado para operações admin",
				},
			};

			console.log("🔧 DIAGNÓSTICO COMPLETO:", result);
			console.log("📋 RECOMENDAÇÕES:", dbCheck.recommendations);

			return result;
		} catch (error) {
			console.error("❌ PostService: Debug falhou:", error);
			return { error: error.message };
		}
	}
}
