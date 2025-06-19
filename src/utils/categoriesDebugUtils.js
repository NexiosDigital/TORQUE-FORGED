/**
 * UTILITÁRIOS DE DEBUG PARA CATEGORIAS DINÂMICAS
 *
 * Como usar:
 * 1. Abra o console do navegador (F12)
 * 2. Execute window.TorqueForgedCategoriesDebug.testAll()
 * 3. Verifique os resultados
 */

import { dataAPIService } from "../services/DataAPIService";
import { PostService } from "../services/PostService";

// Classe de debug para categorias
class CategoriesDebugUtils {
	constructor() {
		this.results = [];
	}

	/**
	 * Testar todas as funcionalidades de categorias
	 */
	async testAll() {
		console.log("🔍 Iniciando teste completo de categorias dinâmicas...\n");

		this.results = [];

		try {
			await this.testDataAPICategories();
			await this.testPostServiceCategories();
			await this.testCacheIntegrity();
			await this.testFallbackScenarios();

			this.printSummary();
		} catch (error) {
			console.error("❌ Erro durante testes:", error);
		}
	}

	/**
	 * Testar DataAPIService categorias
	 */
	async testDataAPICategories() {
		console.log("📡 Testando DataAPIService categorias...");

		try {
			// Teste 1: Buscar categorias normalmente
			const categories = await dataAPIService.getCategories();
			this.logResult("DataAPI - Busca normal", {
				success: true,
				count: categories.length,
				dynamic: categories.length > 0 && categories[0].id !== "geral",
				sample: categories
					.slice(0, 3)
					.map((cat) => ({ id: cat.id, name: cat.name })),
			});

			// Teste 2: Buscar categorias com bypass de cache
			const freshCategories = await dataAPIService.getCategories(true);
			this.logResult("DataAPI - Bypass cache", {
				success: true,
				count: freshCategories.length,
				different:
					JSON.stringify(categories) !== JSON.stringify(freshCategories),
				sample: freshCategories
					.slice(0, 3)
					.map((cat) => ({ id: cat.id, name: cat.name })),
			});

			// Teste 3: Validar categorias
			const validation = await dataAPIService.validateCategories();
			this.logResult("DataAPI - Validação", validation);

			// Teste 4: Debug completo
			const debug = await dataAPIService.debugCategories();
			this.logResult("DataAPI - Debug", {
				memoryCache: debug.memoryCache.exists,
				localStorage: debug.localStorage.exists,
				freshFetch: debug.freshFetch.success,
				dataConsistency: this.checkDataConsistency(debug),
			});
		} catch (error) {
			this.logResult("DataAPI - Erro", {
				success: false,
				error: error.message,
			});
		}
	}

	/**
	 * Testar PostService categorias
	 */
	async testPostServiceCategories() {
		console.log("📦 Testando PostService categorias...");

		try {
			// Teste 1: Buscar categorias via PostService
			const categories = await PostService.getCategories();
			this.logResult("PostService - Busca normal", {
				success: true,
				count: categories.length,
				dynamic: categories.length > 0 && categories[0].id !== "geral",
				sample: categories
					.slice(0, 3)
					.map((cat) => ({ id: cat.id, name: cat.name })),
			});

			// Teste 2: Testar fallback
			const fallbackCategories = await PostService.getCategoriesFromDatabase();
			this.logResult("PostService - Fallback direto", {
				success: true,
				count: fallbackCategories.length,
				source: "database",
				sample: fallbackCategories
					.slice(0, 3)
					.map((cat) => ({ id: cat.id, name: cat.name })),
			});

			// Teste 3: Testar diagnósticos
			const diagnostics = await PostService.runDiagnostics();
			this.logResult("PostService - Diagnósticos", {
				dataAPI: diagnostics.dataAPI?.status,
				fallback: diagnostics.fallback?.status,
				cache: diagnostics.cache?.status,
				categories: diagnostics.categories,
			});
		} catch (error) {
			this.logResult("PostService - Erro", {
				success: false,
				error: error.message,
			});
		}
	}

	/**
	 * Testar integridade do cache
	 */
	async testCacheIntegrity() {
		console.log("💾 Testando integridade do cache...");

		try {
			// Verificar cache stats
			const stats = dataAPIService.getCacheStats();
			this.logResult("Cache - Estatísticas", stats);

			// Verificar localStorage
			const localCache = localStorage.getItem("tf-cache-categories-db");
			if (localCache) {
				const { data, timestamp } = JSON.parse(localCache);
				this.logResult("Cache - localStorage", {
					exists: true,
					age: Math.round((Date.now() - timestamp) / 1000 / 60), // minutos
					count: data.length,
					valid: Date.now() - timestamp < 60 * 60 * 1000, // 1 hora
				});
			} else {
				this.logResult("Cache - localStorage", {
					exists: false,
				});
			}

			// Verificar React Query cache se disponível
			if (window.queryClient) {
				const categoriesQuery = window.queryClient.getQueryData([
					"public",
					"categories",
				]);
				this.logResult("Cache - React Query", {
					exists: !!categoriesQuery,
					count: categoriesQuery ? categoriesQuery.length : 0,
					stale: window.queryClient.getQueryState(["public", "categories"])
						?.isStale,
				});
			}
		} catch (error) {
			this.logResult("Cache - Erro", {
				success: false,
				error: error.message,
			});
		}
	}

	/**
	 * Testar cenários de fallback
	 */
	async testFallbackScenarios() {
		console.log("🔄 Testando cenários de fallback...");

		try {
			// Simular falha limpando caches
			localStorage.removeItem("tf-cache-categories-db");
			dataAPIService.clearMemoryCache();

			// Testar fallback mínimo
			const minimalCategories = PostService.getMinimalFallbackCategories();
			this.logResult("Fallback - Categorias mínimas", {
				count: minimalCategories.length,
				isMinimal: minimalCategories[0]?.id === "geral",
				sample: minimalCategories.map((cat) => ({
					id: cat.id,
					name: cat.name,
				})),
			});

			// Tentar recovery
			const recoveredCategories = await PostService.getCategories();
			this.logResult("Fallback - Recovery", {
				success: true,
				count: recoveredCategories.length,
				recovered:
					recoveredCategories.length > 1 ||
					recoveredCategories[0]?.id !== "geral",
			});
		} catch (error) {
			this.logResult("Fallback - Erro", {
				success: false,
				error: error.message,
			});
		}
	}

	/**
	 * Verificar consistência dos dados
	 */
	checkDataConsistency(debug) {
		const sources = [];

		if (debug.memoryCache.data) {
			sources.push({ name: "memory", data: debug.memoryCache.data });
		}

		if (debug.localStorage.data) {
			sources.push({ name: "localStorage", data: debug.localStorage.data });
		}

		if (debug.freshFetch.data) {
			sources.push({ name: "fresh", data: debug.freshFetch.data });
		}

		if (sources.length < 2) return true;

		// Comparar todas as fontes
		const first = JSON.stringify(sources[0].data);
		return sources.every((source) => JSON.stringify(source.data) === first);
	}

	/**
	 * Registrar resultado do teste
	 */
	logResult(test, result) {
		const entry = {
			test,
			result,
			timestamp: new Date().toISOString(),
		};

		this.results.push(entry);

		const status = result.success === false ? "❌" : "✅";
		console.log(`${status} ${test}:`, result);
	}

	/**
	 * Imprimir resumo dos testes
	 */
	printSummary() {
		console.log("\n📊 RESUMO DOS TESTES DE CATEGORIAS DINÂMICAS");
		console.log("=" * 50);

		const successful = this.results.filter(
			(r) => r.result.success !== false
		).length;
		const total = this.results.length;

		console.log(`Testes executados: ${total}`);
		console.log(`Sucessos: ${successful}`);
		console.log(`Falhas: ${total - successful}`);

		// Verificar se categorias são dinâmicas
		const categoryTests = this.results.filter((r) =>
			r.test.includes("Busca normal")
		);
		const isDynamic = categoryTests.some((t) => t.result.dynamic === true);

		console.log(`\n🔍 Status das categorias:`);
		console.log(`Dinâmicas (do banco): ${isDynamic ? "✅ SIM" : "❌ NÃO"}`);

		if (!isDynamic) {
			console.log("\n⚠️  PROBLEMA DETECTADO:");
			console.log(
				"As categorias não estão sendo carregadas do banco de dados."
			);
			console.log("Verifique se a tabela 'categories' existe e tem dados.");
		}

		// Recomendações
		console.log("\n💡 RECOMENDAÇÕES:");
		console.log("1. Execute este teste após fazer mudanças nas categorias");
		console.log(
			"2. Use window.TorqueForgedCategoriesDebug.refreshCategories() para forçar atualização"
		);
		console.log("3. Monitore os logs do console para erros de categorias");

		return {
			total,
			successful,
			failed: total - successful,
			isDynamic,
			results: this.results,
		};
	}

	/**
	 * Forçar refresh de categorias
	 */
	async refreshCategories() {
		console.log("🔄 Forçando refresh de categorias...");

		try {
			// Limpar todos os caches
			localStorage.removeItem("tf-cache-categories-db");
			dataAPIService.clearMemoryCache();

			if (window.queryClient) {
				window.queryClient.invalidateQueries({
					queryKey: ["public", "categories"],
				});
			}

			// Buscar categorias frescas
			const freshCategories = await dataAPIService.refreshCategories();

			console.log(
				`✅ Refresh concluído: ${freshCategories.length} categorias carregadas`
			);

			return freshCategories;
		} catch (error) {
			console.error("❌ Erro no refresh:", error);
			throw error;
		}
	}

	/**
	 * Verificar configuração do banco
	 */
	async checkDatabaseSetup() {
		console.log("🗄️  Verificando configuração do banco...");

		try {
			// Tentar buscar categorias direto da API
			const response = await fetch(
				`${process.env.REACT_APP_SUPABASE_URL}/rest/v1/categories?select=*`,
				{
					headers: {
						apikey: process.env.REACT_APP_SUPABASE_ANON_KEY,
						Authorization: `Bearer ${process.env.REACT_APP_SUPABASE_ANON_KEY}`,
					},
				}
			);

			if (!response.ok) {
				throw new Error(`HTTP ${response.status}: ${response.statusText}`);
			}

			const categories = await response.json();

			console.log("✅ Tabela 'categories' encontrada");
			console.log(`📊 ${categories.length} categorias no banco`);

			if (categories.length === 0) {
				console.log(
					"\n⚠️  A tabela está vazia! Execute este SQL para criar categorias de exemplo:"
				);
				console.log(this.getSampleCategoriesSQL());
			} else {
				console.log("\n📋 Categorias existentes:");
				categories.forEach((cat) => {
					console.log(`  - ${cat.id}: ${cat.name}`);
				});
			}

			return categories;
		} catch (error) {
			console.error("❌ Erro ao verificar banco:", error);
			console.log("\n🔧 Verifique se:");
			console.log("1. A tabela 'categories' existe");
			console.log("2. As variáveis de ambiente do Supabase estão corretas");
			console.log("3. As RLS policies permitem leitura pública");

			throw error;
		}
	}

	/**
	 * SQL para criar categorias de exemplo
	 */
	getSampleCategoriesSQL() {
		return `
-- Inserir categorias de exemplo
INSERT INTO categories (id, name, description, color, icon, count) VALUES
('f1', 'Fórmula 1', 'A elite do automobilismo mundial', 'from-red-500 to-orange-500', '🏎️', 0),
('nascar', 'NASCAR', 'A categoria mais popular dos EUA', 'from-blue-500 to-cyan-500', '🏁', 0),
('endurance', 'Endurance', 'Corridas de resistência épicas', 'from-green-500 to-emerald-500', '🏃', 0),
('drift', 'Formula Drift', 'A arte de deslizar com estilo', 'from-purple-500 to-pink-500', '🌪️', 0),
('tuning', 'Tuning & Custom', 'Personalização e modificações', 'from-yellow-500 to-orange-500', '🔧', 0),
('engines', 'Motores', 'Tecnologia e performance', 'from-indigo-500 to-purple-500', '⚙️', 0)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  color = EXCLUDED.color,
  icon = EXCLUDED.icon;
		`;
	}

	/**
	 * Monitorar categorias em tempo real
	 */
	startMonitoring(intervalMs = 30000) {
		console.log(
			`🔍 Iniciando monitoramento de categorias (${intervalMs / 1000}s)`
		);

		let lastCount = 0;
		let lastHash = "";

		const monitor = async () => {
			try {
				const categories = await PostService.getCategories();
				const currentCount = categories.length;
				const currentHash = JSON.stringify(
					categories.map((c) => ({ id: c.id, name: c.name }))
				);

				if (currentCount !== lastCount || currentHash !== lastHash) {
					console.log(`🔄 Mudança detectada em categorias:`);
					console.log(`  Quantidade: ${lastCount} → ${currentCount}`);

					if (currentHash !== lastHash) {
						console.log(`  Dados alterados`);
					}

					lastCount = currentCount;
					lastHash = currentHash;
				}
			} catch (error) {
				console.error("❌ Erro no monitoramento:", error);
			}
		};

		// Executar imediatamente
		monitor();

		// Executar periodicamente
		const interval = setInterval(monitor, intervalMs);

		console.log(
			"Para parar o monitoramento, execute: clearInterval(" + interval + ")"
		);

		return interval;
	}
}

// Instanciar e disponibilizar globalmente
const categoriesDebug = new CategoriesDebugUtils();

// Disponibilizar no window para uso no console
if (typeof window !== "undefined") {
	window.TorqueForgedCategoriesDebug = categoriesDebug;

	// Log de instruções
	console.log("🔧 Utilitários de debug de categorias carregados!");
	console.log("Execute no console:");
	console.log("  window.TorqueForgedCategoriesDebug.testAll() - Testar tudo");
	console.log(
		"  window.TorqueForgedCategoriesDebug.checkDatabaseSetup() - Verificar banco"
	);
	console.log(
		"  window.TorqueForgedCategoriesDebug.refreshCategories() - Forçar refresh"
	);
	console.log(
		"  window.TorqueForgedCategoriesDebug.startMonitoring() - Monitorar mudanças"
	);
}

export default categoriesDebug;
