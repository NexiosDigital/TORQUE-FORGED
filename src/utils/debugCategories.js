/**
 * UTILITÁRIOS DE DEBUG PARA CATEGORIAS
 * Arquivo: src/utils/debugCategories.js
 */

// Import dinâmico do Supabase
let supabase = null;
const getSupabase = async () => {
	if (!supabase) {
		const module = await import("../lib/supabase");
		supabase = module.supabase;
	}
	return supabase;
};

// Import dinâmico do PostService
let PostService = null;
const getPostService = async () => {
	if (!PostService) {
		const module = await import("../services/PostService");
		PostService = module.PostService;
	}
	return PostService;
};

/**
 * 1. TESTE DE CONEXÃO BÁSICA
 */
export async function testConnection() {
	console.log("🔍 Testando conexão com Supabase...");

	try {
		const sb = await getSupabase();

		// Teste simples
		const { data, error } = await sb
			.from("categories")
			.select("count")
			.limit(1);

		if (error) {
			console.error("❌ Erro de conexão:", error);
			return { success: false, error: error.message };
		}

		console.log("✅ Conexão OK");
		return { success: true };
	} catch (error) {
		console.error("❌ Erro crítico:", error);
		return { success: false, error: error.message };
	}
}

/**
 * 2. LISTAR CATEGORIAS DO BANCO
 */
export async function listCategories() {
	console.log("🔍 Listando categorias do banco...");

	try {
		const sb = await getSupabase();

		const { data, error } = await sb
			.from("categories")
			.select("*")
			.order("level, sort_order, name");

		if (error) {
			console.error("❌ Erro ao buscar categorias:", error);
			return { success: false, error: error.message, categories: [] };
		}

		console.log(`✅ ${data.length} categorias encontradas:`);

		// Mostrar tabela organizada
		const table = data.map((c) => ({
			id: c.id,
			name: c.name,
			slug: c.slug,
			level: c.level,
			parent: c.parent_id || "ROOT",
			active: c.is_active ? "✅" : "❌",
			icon: c.icon || "📁",
		}));

		console.table(table);

		return { success: true, categories: data, count: data.length };
	} catch (error) {
		console.error("❌ Erro crítico:", error);
		return { success: false, error: error.message, categories: [] };
	}
}

/**
 * 3. TESTAR CATEGORIA POR SLUG
 */
export async function testCategorySlug(slug) {
	console.log(`🔍 Testando categoria slug: "${slug}"`);

	try {
		const sb = await getSupabase();

		const { data, error } = await sb
			.from("categories")
			.select("*")
			.eq("slug", slug)
			.single();

		if (error) {
			if (error.code === "PGRST116") {
				console.warn(`⚠️ Categoria "${slug}" não encontrada`);
				return { success: false, found: false, error: "Não encontrada" };
			}
			console.error("❌ Erro na busca:", error);
			return { success: false, found: false, error: error.message };
		}

		console.log(`✅ Categoria encontrada:`, data);
		return { success: true, found: true, category: data };
	} catch (error) {
		console.error("❌ Erro crítico:", error);
		return { success: false, found: false, error: error.message };
	}
}

/**
 * 4. TESTAR POSTSERVICE
 */
export async function testPostService() {
	console.log("🔍 Testando PostService...");

	try {
		const PS = await getPostService();

		// Teste 1: getCategories
		console.log("Teste 1: PostService.getCategories()");
		const categories = await PS.getCategories();
		console.log(`✅ ${categories.length} categorias via PostService`);

		// Teste 2: getCategoryBySlug (se há categorias)
		if (categories.length > 0) {
			const firstCategory = categories[0];
			console.log(
				`Teste 2: PostService.getCategoryBySlug("${firstCategory.slug}")`
			);
			const category = await PS.getCategoryBySlug(firstCategory.slug);
			console.log(`✅ Categoria encontrada via PostService:`, category.name);
		}

		return {
			success: true,
			categoriesCount: categories.length,
			categories: categories.slice(0, 5), // Primeiras 5 para debug
		};
	} catch (error) {
		console.error("❌ Erro no PostService:", error);
		return { success: false, error: error.message };
	}
}

/**
 * 5. VERIFICAR HIERARCHIA
 */
export async function checkHierarchy() {
	console.log("🔍 Verificando hierarquia...");

	try {
		const result = await listCategories();
		if (!result.success) {
			return result;
		}

		const categories = result.categories;

		// Agrupar por nível
		const levels = {
			1: categories.filter((c) => c.level === 1),
			2: categories.filter((c) => c.level === 2),
			3: categories.filter((c) => c.level === 3),
		};

		console.log("📊 Distribuição por níveis:");
		console.log(`Nível 1 (Principal): ${levels[1].length}`);
		console.log(`Nível 2 (Sub): ${levels[2].length}`);
		console.log(`Nível 3 (Sub-sub): ${levels[3].length}`);

		// Verificar orphans (categorias sem pai válido)
		const orphans = categories.filter((c) => {
			if (c.level === 1) return false; // Nível 1 não precisa de pai
			if (!c.parent_id) return true; // Nível > 1 sem pai
			return !categories.some((p) => p.id === c.parent_id); // Pai não existe
		});

		if (orphans.length > 0) {
			console.warn(`⚠️ ${orphans.length} categorias órfãs:`, orphans);
		}

		// Verificar estrutura válida
		const validStructure = categories.every((c) => {
			if (c.level === 1) return !c.parent_id; // Nível 1 sem pai
			if (c.level > 1) return !!c.parent_id; // Níveis > 1 com pai
			return true;
		});

		console.log(
			`📋 Estrutura hierárquica: ${
				validStructure ? "✅ Válida" : "❌ Inválida"
			}`
		);

		return {
			success: true,
			levels,
			orphans,
			validStructure,
			summary: {
				total: categories.length,
				level1: levels[1].length,
				level2: levels[2].length,
				level3: levels[3].length,
				orphans: orphans.length,
				valid: validStructure,
			},
		};
	} catch (error) {
		console.error("❌ Erro na verificação:", error);
		return { success: false, error: error.message };
	}
}

/**
 * 6. VERIFICAR CACHE
 */
export function checkCache() {
	console.log("🔍 Verificando cache...");

	const result = {
		localStorage: null,
		queryClient: null,
		timestamp: new Date().toISOString(),
	};

	// Verificar localStorage
	try {
		const cached = localStorage.getItem("tf-cache-categories-db");
		if (cached) {
			const { data, timestamp } = JSON.parse(cached);
			const age = Math.round((Date.now() - timestamp) / 1000 / 60);
			result.localStorage = {
				exists: true,
				count: data.length,
				ageMinutes: age,
				valid: age < 60, // Válido por 1 hora
				data: data.slice(0, 3), // Primeiras 3 para debug
			};
			console.log(`💾 Cache local: ${data.length} categorias, ${age} min`);
		} else {
			result.localStorage = { exists: false };
			console.log("💾 Cache local: não encontrado");
		}
	} catch (error) {
		result.localStorage = { exists: false, error: error.message };
		console.warn("⚠️ Erro no cache local:", error);
	}

	// Verificar React Query cache
	if (window.queryClient) {
		const cache = window.queryClient.getQueryCache();
		const queries = cache.getAll();
		const categoryQueries = queries.filter((q) =>
			q.queryKey.includes("categories")
		);

		result.queryClient = {
			exists: true,
			totalQueries: queries.length,
			categoryQueries: categoryQueries.length,
			categoriesData: categoryQueries.map((q) => ({
				key: q.queryKey,
				status: q.state.status,
				dataLength: Array.isArray(q.state.data) ? q.state.data.length : "N/A",
			})),
		};

		console.log(
			`🎯 React Query: ${queries.length} queries, ${categoryQueries.length} de categorias`
		);
	} else {
		result.queryClient = { exists: false };
		console.log("🎯 React Query: não encontrado");
	}

	return result;
}

/**
 * 7. LIMPAR CACHE
 */
export function clearCache() {
	console.log("🗑️ Limpando cache...");

	// localStorage
	try {
		Object.keys(localStorage).forEach((key) => {
			if (key.startsWith("tf-cache-")) {
				localStorage.removeItem(key);
			}
		});
		console.log("✅ Cache local limpo");
	} catch (error) {
		console.warn("⚠️ Erro ao limpar cache local:", error);
	}

	// React Query
	if (window.queryClient) {
		window.queryClient.clear();
		console.log("✅ React Query cache limpo");
	}

	// Cache utils se disponível
	if (window.cacheUtils) {
		window.cacheUtils.clear();
		console.log("✅ Cache utils executado");
	}

	console.log("🎉 Cache totalmente limpo");
}

/**
 * 8. DIAGNÓSTICO COMPLETO
 */
export async function fullDiagnosis() {
	console.log("🔬 === DIAGNÓSTICO COMPLETO ===");

	const results = {
		timestamp: new Date().toISOString(),
		connection: null,
		categories: null,
		hierarchy: null,
		postService: null,
		cache: null,
		issues: [],
		recommendations: [],
	};

	try {
		// 1. Conexão
		console.log("\n1. Testando conexão...");
		results.connection = await testConnection();
		if (!results.connection.success) {
			results.issues.push("Falha na conexão com Supabase");
		}

		// 2. Categorias
		console.log("\n2. Listando categorias...");
		results.categories = await listCategories();
		if (!results.categories.success) {
			results.issues.push("Erro ao buscar categorias do banco");
		} else if (results.categories.count === 0) {
			results.issues.push("Nenhuma categoria encontrada no banco");
			results.recommendations.push("Inserir categorias na tabela 'categories'");
		}

		// 3. Hierarquia
		if (results.categories.success && results.categories.count > 0) {
			console.log("\n3. Verificando hierarquia...");
			results.hierarchy = await checkHierarchy();
			if (!results.hierarchy.validStructure) {
				results.issues.push("Estrutura hierárquica inválida");
			}
		}

		// 4. PostService
		console.log("\n4. Testando PostService...");
		results.postService = await testPostService();
		if (!results.postService.success) {
			results.issues.push("PostService não está funcionando");
		}

		// 5. Cache
		console.log("\n5. Verificando cache...");
		results.cache = checkCache();

		// Recomendações baseadas nos resultados
		if (results.categories.success && results.categories.count > 0) {
			results.recommendations.push("✅ Categorias encontradas no banco");
		}

		if (results.issues.length === 0) {
			results.recommendations.push("🎉 Sistema funcionando corretamente!");
		}

		// Sumário final
		console.log("\n🎯 === SUMÁRIO ===");
		console.log(`Conexão: ${results.connection.success ? "✅" : "❌"}`);
		console.log(
			`Categorias: ${
				results.categories.success ? `✅ (${results.categories.count})` : "❌"
			}`
		);
		console.log(
			`Hierarquia: ${results.hierarchy?.validStructure ? "✅" : "❌"}`
		);
		console.log(`PostService: ${results.postService.success ? "✅" : "❌"}`);
		console.log(`Issues: ${results.issues.length}`);

		if (results.issues.length > 0) {
			console.log("\n⚠️ PROBLEMAS ENCONTRADOS:");
			results.issues.forEach((issue, i) => {
				console.log(`${i + 1}. ${issue}`);
			});
		}

		if (results.recommendations.length > 0) {
			console.log("\n💡 RECOMENDAÇÕES:");
			results.recommendations.forEach((rec, i) => {
				console.log(`${i + 1}. ${rec}`);
			});
		}

		return results;
	} catch (error) {
		console.error("❌ Erro no diagnóstico:", error);
		results.issues.push(`Erro crítico: ${error.message}`);
		return results;
	}
}

/**
 * 9. TESTES RÁPIDOS ESPECÍFICOS
 */
export const quickTests = {
	// Testar categorias das imagens fornecidas
	async testKnownCategories() {
		const slugsToTest = ["ferrari", "f1", "corridas", "motores", "tecnologia"];

		console.log("🧪 Testando categorias conhecidas...");

		for (const slug of slugsToTest) {
			const result = await testCategorySlug(slug);
			console.log(`${slug}: ${result.found ? "✅" : "❌"}`);
		}
	},

	// Testar roteamento
	async testRouting(slug) {
		console.log(`🛣️ Testando roteamento para "${slug}"`);

		try {
			const result = await testCategorySlug(slug);
			if (result.found) {
				console.log(`✅ Categoria "${slug}" existe e pode ser roteada`);
				console.log(`URL: /${slug}`);
				console.log(`Nome: ${result.category.name}`);
				return true;
			} else {
				console.warn(`❌ Categoria "${slug}" não encontrada para roteamento`);
				return false;
			}
		} catch (error) {
			console.error(`❌ Erro no teste de roteamento:`, error);
			return false;
		}
	},
};

// Disponibilizar globalmente
const debugCategories = {
	test: testConnection,
	list: listCategories,
	slug: testCategorySlug,
	service: testPostService,
	hierarchy: checkHierarchy,
	cache: checkCache,
	clear: clearCache,
	diagnosis: fullDiagnosis,
	quick: quickTests,

	// Atalhos para testes específicos
	testFerrari: () => testCategorySlug("ferrari"),
	testF1: () => testCategorySlug("f1"),
	testCorridas: () => testCategorySlug("corridas"),
};

if (typeof window !== "undefined") {
	window.debugCategories = debugCategories;

	console.log(`
🔧 === DEBUG CATEGORIAS CARREGADO ===

Comandos disponíveis:

// Diagnóstico completo
await debugCategories.diagnosis()

// Testar conexão
await debugCategories.test()

// Listar categorias
await debugCategories.list()

// Testar categoria específica
await debugCategories.slug('ferrari')

// Testar PostService
await debugCategories.service()

// Verificar hierarquia
await debugCategories.hierarchy()

// Cache
debugCategories.cache()
debugCategories.clear()

// Testes rápidos
await debugCategories.quick.testKnownCategories()
await debugCategories.quick.testRouting('ferrari')

======================================
	`);
}

export default debugCategories;
