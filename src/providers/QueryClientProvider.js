import React, { useEffect } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { useWarmupCache } from "../hooks/useUltraFastPosts";
import { FastDataService } from "../services/FastDataService";

/**
 * QueryClient Provider Ultra-Otimizado
 * - Configurações de cache agressivas
 * - Error boundaries
 * - Background refetch otimizado
 * - DevTools apenas em desenvolvimento
 */

// Configuração otimizada do QueryClient
const queryClient = new QueryClient({
	defaultOptions: {
		queries: {
			// Configurações globais otimizadas
			staleTime: 2 * 60 * 1000, // 2 minutos fresh por padrão
			cacheTime: 10 * 60 * 1000, // 10 minutos em cache
			refetchOnWindowFocus: false, // Não refetch ao focar janela
			refetchOnMount: true, // Refetch ao montar componente
			refetchOnReconnect: true, // Refetch ao reconectar
			refetchInterval: false, // Não refetch automático
			retry: (failureCount, error) => {
				// Retry inteligente
				if (error?.status === 404) return false;
				if (error?.message?.includes("Timeout")) return failureCount < 2;
				return failureCount < 3;
			},
			retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
			// Configurações de performance
			networkMode: "online", // Apenas quando online
			meta: {
				errorMessage: "Erro ao carregar dados",
			},
		},
		mutations: {
			// Configurações para mutations
			retry: 1,
			retryDelay: 1000,
			networkMode: "online",
			onError: (error) => {
				console.error("Mutation error:", error);
			},
		},
	},
});

// Error Logger personalizado
const errorLogger = (error, query) => {
	if (process.env.NODE_ENV === "development") {
		console.group("🔴 React Query Error");
		console.error("Query:", query.queryKey);
		console.error("Error:", error);
		console.error("Query State:", query.state);
		console.groupEnd();
	}

	// Log para serviços de monitoramento em produção
	if (process.env.NODE_ENV === "production") {
		// Integrar com Sentry, LogRocket, etc.
		// analytics.track('react_query_error', {
		//   queryKey: query.queryKey,
		//   error: error.message,
		//   stack: error.stack,
		// });
	}
};

// Configurar error logger
queryClient.setQueryDefaults(["posts"], {
	onError: errorLogger,
});

// Component para warmup do cache
const CacheWarmer = () => {
	const { warmup } = useWarmupCache();

	useEffect(() => {
		// Warmup cache após 100ms do carregamento inicial
		const timer = setTimeout(() => {
			warmup();
		}, 100);

		return () => clearTimeout(timer);
	}, [warmup]);

	return null;
};

// Performance monitor para desenvolvimento
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
			};

			console.log("📊 React Query Cache Stats:", stats);
		};

		// Log stats a cada 30 segundos em desenvolvimento
		const interval = setInterval(logCacheStats, 30000);

		return () => clearInterval(interval);
	}, []);

	return null;
};

// Error Boundary para React Query
class QueryErrorBoundary extends React.Component {
	constructor(props) {
		super(props);
		this.state = { hasError: false, error: null };
	}

	static getDerivedStateFromError(error) {
		return { hasError: true, error };
	}

	componentDidCatch(error, errorInfo) {
		console.error("React Query Error Boundary:", error, errorInfo);

		// Log para serviços de monitoramento
		if (process.env.NODE_ENV === "production") {
			// analytics.track('react_query_boundary_error', {
			//   error: error.message,
			//   stack: error.stack,
			//   componentStack: errorInfo.componentStack,
			// });
		}
	}

	render() {
		if (this.state.hasError) {
			return (
				<div className="min-h-screen bg-black flex items-center justify-center">
					<div className="text-center p-8">
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
							Ocorreu um erro inesperado. Tente recarregar a página.
						</p>
						<button
							onClick={() => window.location.reload()}
							className="bg-gradient-to-r from-red-600 to-red-500 hover:from-red-500 hover:to-red-400 text-white px-6 py-3 rounded-xl font-semibold transition-all duration-300 shadow-lg hover:shadow-red-500/25 hover:scale-105"
						>
							Recarregar Página
						</button>

						{process.env.NODE_ENV === "development" && (
							<details className="mt-6 text-left">
								<summary className="text-red-400 cursor-pointer mb-2">
									Detalhes do erro (desenvolvimento)
								</summary>
								<pre className="bg-gray-900 p-4 rounded-lg text-xs text-gray-300 overflow-auto">
									{this.state.error?.stack}
								</pre>
							</details>
						)}
					</div>
				</div>
			);
		}

		return this.props.children;
	}
}

// Provider principal otimizado
export const OptimizedQueryProvider = ({ children }) => {
	return (
		<QueryErrorBoundary>
			<QueryClientProvider client={queryClient}>
				{/* Cache warmer - aquece cache crítico */}
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
								marginRight: "80px", // Para não sobrepor o DebugPanel
								marginBottom: "20px",
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

// Utilities para cache management
export const cacheUtils = {
	// Invalidar todas as queries de posts
	invalidateAllPosts: () => {
		queryClient.invalidateQueries({ queryKey: ["posts"] });
	},

	// Invalidar posts específicos
	invalidatePostsByCategory: (category) => {
		queryClient.invalidateQueries({
			queryKey: ["posts", "category", category],
		});
	},

	// Prefetch post específico
	prefetchPost: (id) => {
		queryClient.prefetchQuery({
			queryKey: ["posts", "detail", id],
			queryFn: () => FastDataService.getPostById(id),
			staleTime: 5 * 60 * 1000,
		});
	},

	// Limpar cache completamente
	clearAllCache: () => {
		queryClient.clear();
		FastDataService.clearCache();
	},

	// Obter estatísticas do cache
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
		};
	},

	// Configurar background refetch
	setBackgroundRefetch: (enabled = true) => {
		queryClient.setDefaultOptions({
			queries: {
				refetchOnWindowFocus: enabled,
				refetchInterval: enabled ? 5 * 60 * 1000 : false, // 5 minutos
			},
		});
	},
};

export default OptimizedQueryProvider;
