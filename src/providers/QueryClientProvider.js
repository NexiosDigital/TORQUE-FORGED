import React, { useEffect } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { useWarmupCache } from "../hooks/useUltraFastPosts";
import { FastDataService } from "../services/FastDataService";

/**
 * QueryClient Provider ESTABILIZADO
 * - Configurações mais conservadoras
 * - Error handling robusto
 * - Timeouts realistas
 * - Melhor recovery
 */

// Configuração ESTÁVEL do QueryClient
const queryClient = new QueryClient({
	defaultOptions: {
		queries: {
			// Configurações MAIS CONSERVADORAS
			staleTime: 5 * 60 * 1000, // 5 minutos fresh (era 2min)
			cacheTime: 30 * 60 * 1000, // 30 minutos em cache (era 10min)
			refetchOnWindowFocus: false,
			refetchOnMount: true,
			refetchOnReconnect: true,
			refetchInterval: false,
			retry: (failureCount, error) => {
				// Retry mais conservador
				if (error?.status === 404) return false;
				if (error?.message?.includes("Timeout")) return failureCount < 1; // Apenas 1 retry para timeout
				if (error?.message?.includes("não encontrado")) return false;
				return failureCount < 2; // Máximo 2 retries
			},
			retryDelay: (attemptIndex) => {
				// Delays mais longos
				return Math.min(2000 * 2 ** attemptIndex, 30000); // Começa com 2s
			},
			// Configurações de performance ESTÁVEIS
			networkMode: "online",
			meta: {
				errorMessage: "Erro ao carregar dados",
			},
			// SEMPRE garantir que data seja válida
			select: (data) => {
				if (Array.isArray(data)) {
					return data.filter((item) => item && typeof item === "object");
				}
				if (data && typeof data === "object") {
					return data;
				}
				console.warn("QueryClient: Data inválida detectada", {
					data,
					type: typeof data,
				});
				return Array.isArray(data) ? [] : null;
			},
		},
		mutations: {
			// Configurações para mutations ESTÁVEIS
			retry: 1,
			retryDelay: 2000, // 2 segundos
			networkMode: "online",
			onError: (error, variables, context) => {
				console.error("Mutation error:", error, { variables, context });
			},
		},
	},
});

// Error Logger MELHORADO
const errorLogger = (error, query) => {
	// Log estruturado
	const errorInfo = {
		timestamp: new Date().toISOString(),
		queryKey: query?.queryKey,
		errorMessage: error?.message,
		errorCode: error?.code || error?.status,
		queryState: query?.state?.status,
		retryCount: query?.state?.failureCount,
	};

	if (process.env.NODE_ENV === "development") {
		console.group("🔴 React Query Error");
		console.error("Query:", query?.queryKey);
		console.error("Error:", error);
		console.error("State:", query?.state);
		console.error("Info:", errorInfo);
		console.groupEnd();
	}

	// Log para serviços de monitoramento em produção
	if (process.env.NODE_ENV === "production") {
		// Aqui você integraria com Sentry, LogRocket, etc.
		// analytics.track('react_query_error', errorInfo);
	}
};

// Configurar error logger para queries específicas
queryClient.setQueryDefaults(["posts"], {
	onError: errorLogger,
	// Configurações específicas para posts
	staleTime: 3 * 60 * 1000, // 3 minutos para posts
	cacheTime: 20 * 60 * 1000, // 20 minutos
});

queryClient.setQueryDefaults(["posts", "featured"], {
	onError: errorLogger,
	// Posts em destaque ficam frescos por mais tempo
	staleTime: 8 * 60 * 1000, // 8 minutos
	cacheTime: 40 * 60 * 1000, // 40 minutos
});

// Component para warmup do cache SEGURO
const CacheWarmer = () => {
	const { warmup } = useWarmupCache();

	useEffect(() => {
		// Warmup cache após carregamento inicial
		const timer = setTimeout(() => {
			warmup().catch((error) => {
				console.warn("Cache warmup failed safely:", error);
			});
		}, 500); // Esperar mais tempo antes do warmup

		return () => clearTimeout(timer);
	}, [warmup]);

	return null;
};

// Performance monitor MELHORADO para desenvolvimento
const PerformanceMonitor = () => {
	useEffect(() => {
		if (process.env.NODE_ENV !== "development") return;

		const logCacheStats = () => {
			const cache = queryClient.getQueryCache();
			const queries = cache.getAll();
			const stats = {
				total: queries.length,
				fresh: queries.filter((q) => !q.isStale()).length,
				stale: queries.filter((q) => q.isStale()).length,
				loading: queries.filter((q) => q.state.status === "loading").length,
				error: queries.filter((q) => q.state.status === "error").length,
				success: queries.filter((q) => q.state.status === "success").length,
				cacheHitRatio:
					queries.length > 0
						? (
								(queries.filter((q) => !q.isStale()).length / queries.length) *
								100
						  ).toFixed(1)
						: 0,
			};

			console.log("📊 React Query Cache Stats:", stats);

			// Verificar se há muitos erros
			if (stats.error > stats.total * 0.3) {
				console.warn("⚠️ Alta taxa de erro nas queries:", stats);
			}
		};

		// Log stats a cada 60 segundos em desenvolvimento (era 30s)
		const interval = setInterval(logCacheStats, 60000);

		// Log inicial após 5 segundos
		const initialTimer = setTimeout(logCacheStats, 5000);

		return () => {
			clearInterval(interval);
			clearTimeout(initialTimer);
		};
	}, []);

	return null;
};

// Error Boundary MELHORADO para React Query
class QueryErrorBoundary extends React.Component {
	constructor(props) {
		super(props);
		this.state = {
			hasError: false,
			error: null,
			errorInfo: null,
			retryCount: 0,
		};
	}

	static getDerivedStateFromError(error) {
		return { hasError: true, error };
	}

	componentDidCatch(error, errorInfo) {
		console.error("React Query Error Boundary:", error, errorInfo);

		this.setState({
			errorInfo,
		});

		// Log para serviços de monitoramento
		if (process.env.NODE_ENV === "production") {
			// analytics.track('react_query_boundary_error', {
			//   error: error.message,
			//   stack: error.stack,
			//   componentStack: errorInfo.componentStack,
			//   retryCount: this.state.retryCount,
			// });
		}
	}

	handleRetry = () => {
		this.setState((prevState) => ({
			hasError: false,
			error: null,
			errorInfo: null,
			retryCount: prevState.retryCount + 1,
		}));

		// Limpar cache de queries com erro
		const cache = queryClient.getQueryCache();
		const errorQueries = cache
			.getAll()
			.filter((q) => q.state.status === "error");
		errorQueries.forEach((query) => {
			queryClient.removeQueries({ queryKey: query.queryKey });
		});
	};

	render() {
		if (this.state.hasError) {
			return (
				<div className="min-h-screen bg-black flex items-center justify-center">
					<div className="text-center p-8 max-w-md mx-auto">
						<div className="w-16 h-16 bg-red-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
							<svg
								className="w-8 h-8 text-white"
								fill="none"
								stroke="currentColor"
								viewBox="0 0 24 24"
							>
								<path
									strokeLinecap="round"
									strokeLinejoin="round"
									strokeWidth={2}
									d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
								/>
							</svg>
						</div>
						<h2 className="text-2xl font-bold text-white mb-4">
							Ops! Algo deu errado
						</h2>
						<p className="text-gray-400 mb-6">
							Ocorreu um erro inesperado no sistema de dados.
							{this.state.retryCount > 0 && (
								<span className="block mt-2 text-sm text-gray-500">
									Tentativas: {this.state.retryCount}
								</span>
							)}
						</p>

						<div className="space-y-3">
							<button
								onClick={this.handleRetry}
								disabled={this.state.retryCount >= 3}
								className="w-full bg-gradient-to-r from-red-600 to-red-500 hover:from-red-500 hover:to-red-400 text-white px-6 py-3 rounded-xl font-semibold transition-all duration-300 shadow-lg hover:shadow-red-500/25 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
							>
								{this.state.retryCount >= 3
									? "Limite de tentativas"
									: "Tentar Novamente"}
							</button>

							<button
								onClick={() => window.location.reload()}
								className="w-full border border-gray-600 hover:border-red-500 text-gray-300 hover:text-white px-6 py-3 rounded-xl font-semibold transition-all duration-300"
							>
								Recarregar Página
							</button>
						</div>

						{process.env.NODE_ENV === "development" && this.state.error && (
							<details className="mt-6 text-left">
								<summary className="text-red-400 cursor-pointer mb-2 text-sm">
									Detalhes do erro (desenvolvimento)
								</summary>
								<div className="bg-gray-900 p-4 rounded-lg text-xs text-gray-300 space-y-2">
									<div>
										<strong>Error:</strong>
										<pre className="overflow-auto max-h-32 mt-1">
											{this.state.error?.stack}
										</pre>
									</div>
									{this.state.errorInfo && (
										<div>
											<strong>Component Stack:</strong>
											<pre className="overflow-auto max-h-32 mt-1">
												{this.state.errorInfo.componentStack}
											</pre>
										</div>
									)}
								</div>
							</details>
						)}
					</div>
				</div>
			);
		}

		return this.props.children;
	}
}

// Provider principal ESTABILIZADO
export const OptimizedQueryProvider = ({ children }) => {
	return (
		<QueryErrorBoundary>
			<QueryClientProvider client={queryClient}>
				{/* Cache warmer - aquece cache crítico de forma segura */}
				<CacheWarmer />

				{/* Performance monitor - apenas em dev */}
				{process.env.NODE_ENV === "development" && <PerformanceMonitor />}

				{/* Conteúdo da aplicação */}
				{children}

				{/* DevTools - apenas em desenvolvimento */}
				{process.env.NODE_ENV === "development" && (
					<ReactQueryDevtools
						initialIsOpen={false}
						position="bottom-right"
						toggleButtonProps={{
							style: {
								marginRight: "20px",
								marginBottom: "20px",
								zIndex: 9999,
							},
						}}
					/>
				)}
			</QueryClientProvider>
		</QueryErrorBoundary>
	);
};

// Hook para acessar o queryClient
export const useOptimizedQueryClient = () => queryClient;

// Utilities para cache management MELHORADAS
export const cacheUtils = {
	// Invalidar todas as queries de posts
	invalidateAllPosts: () => {
		queryClient.invalidateQueries({ queryKey: ["posts"] });
	},

	// Invalidar posts específicos
	invalidatePostsByCategory: (category) => {
		if (!category) return;
		queryClient.invalidateQueries({
			queryKey: ["posts", "category", category],
		});
	},

	// Prefetch post específico com timeout
	prefetchPost: async (id) => {
		if (!id) return;

		try {
			await queryClient.prefetchQuery({
				queryKey: ["posts", "detail", id],
				queryFn: () =>
					Promise.race([
						FastDataService.getPostById(id),
						new Promise((_, reject) =>
							setTimeout(() => reject(new Error("Prefetch timeout")), 3000)
						),
					]),
				staleTime: 5 * 60 * 1000,
			});
		} catch (error) {
			console.warn(`Prefetch failed for post ${id}:`, error.message);
		}
	},

	// Limpar cache completamente
	clearAllCache: () => {
		queryClient.clear();
		FastDataService.clearCache();
		console.log("🧹 All cache cleared");
	},

	// Obter estatísticas do cache DETALHADAS
	getCacheStats: () => {
		const cache = queryClient.getQueryCache();
		const queries = cache.getAll();

		return {
			totalQueries: queries.length,
			freshQueries: queries.filter((q) => !q.isStale()).length,
			staleQueries: queries.filter((q) => q.isStale()).length,
			errorQueries: queries.filter((q) => q.state.status === "error").length,
			loadingQueries: queries.filter((q) => q.state.status === "loading")
				.length,
			successQueries: queries.filter((q) => q.state.status === "success")
				.length,
			idleQueries: queries.filter((q) => q.state.status === "idle").length,
			// Estatísticas por tipo
			postQueries: queries.filter((q) => q.queryKey[0] === "posts").length,
			featuredQueries: queries.filter(
				(q) => q.queryKey[0] === "posts" && q.queryKey[1] === "featured"
			).length,
			categoryQueries: queries.filter(
				(q) => q.queryKey[0] === "posts" && q.queryKey[1] === "category"
			).length,
			// Cálculos úteis
			cacheHitRatio:
				queries.length > 0
					? (
							(queries.filter((q) => !q.isStale()).length / queries.length) *
							100
					  ).toFixed(1) + "%"
					: "0%",
			errorRate:
				queries.length > 0
					? (
							(queries.filter((q) => q.state.status === "error").length /
								queries.length) *
							100
					  ).toFixed(1) + "%"
					: "0%",
		};
	},

	// Configurar background refetch
	setBackgroundRefetch: (enabled = true) => {
		queryClient.setDefaultOptions({
			queries: {
				refetchOnWindowFocus: enabled,
				refetchInterval: enabled ? 10 * 60 * 1000 : false, // 10 minutos (era 5)
			},
		});
		console.log(`Background refetch ${enabled ? "enabled" : "disabled"}`);
	},

	// Limpar queries com erro
	clearErrorQueries: () => {
		const cache = queryClient.getQueryCache();
		const errorQueries = cache
			.getAll()
			.filter((q) => q.state.status === "error");

		errorQueries.forEach((query) => {
			queryClient.removeQueries({ queryKey: query.queryKey });
		});

		console.log(`🧹 Cleared ${errorQueries.length} error queries`);
	},

	// Revalidar todas as queries
	revalidateAll: async () => {
		await queryClient.invalidateQueries();
		console.log("🔄 All queries revalidated");
	},

	// Diagnosticar problemas
	diagnose: () => {
		const stats = cacheUtils.getCacheStats();

		console.group("🔍 Cache Diagnosis");
		console.log("Stats:", stats);

		if (parseFloat(stats.errorRate) > 20) {
			console.warn("⚠️ High error rate detected:", stats.errorRate);
		}

		if (parseFloat(stats.cacheHitRatio) < 50) {
			console.warn("⚠️ Low cache hit ratio:", stats.cacheHitRatio);
		}

		if (stats.totalQueries > 100) {
			console.warn("⚠️ High number of cached queries:", stats.totalQueries);
		}

		console.groupEnd();

		return stats;
	},
};

export default OptimizedQueryProvider;
