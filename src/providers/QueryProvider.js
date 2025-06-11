import React, { useEffect } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

/**
 * QueryProvider FINAL - SOLUÇÃO PARA CACHE PERSISTENTE
 * - Force cache clearing em situações específicas
 * - Melhor detecção de estados inconsistentes
 * - Debug logs para "old caches cleaner"
 * - Zero interferência entre login/logout
 */

// QueryClient com configurações MAIS AGRESSIVAS para evitar cache persistente
const queryClient = new QueryClient({
	defaultOptions: {
		queries: {
			// Cache mais agressivo para evitar problemas
			staleTime: 2 * 60 * 1000, // 2 minutos (reduzido)
			gcTime: 10 * 60 * 1000, // 10 minutos (reduzido)
			refetchOnWindowFocus: false,
			refetchOnMount: true,
			refetchOnReconnect: true,
			refetchInterval: false,

			// Error handling mais rigoroso
			retry: (failureCount, error) => {
				// Não retry para 404 ou dados não encontrados
				if (error?.message?.includes("não encontrado")) return false;
				if (error?.message?.includes("not found")) return false;
				if (error?.status === 404) return false;

				// Máximo 1 retry para evitar loops
				return failureCount < 1;
			},

			retryDelay: (attemptIndex) => {
				return Math.min(500 * 2 ** attemptIndex, 2000); // Delays menores
			},

			// Configurações de network
			networkMode: "online",
		},
		mutations: {
			retry: 0, // Sem retry em mutations
			retryDelay: 500,
			networkMode: "online",
		},
	},
});

// Component para integração do Realtime
const RealtimeProvider = ({ children }) => {
	return <>{children}</>;
};

// Error Boundary para queries
class QueryErrorBoundary extends React.Component {
	constructor(props) {
		super(props);
		this.state = {
			hasError: false,
			error: null,
			retryCount: 0,
		};
	}

	static getDerivedStateFromError(error) {
		return { hasError: true, error };
	}

	componentDidCatch(error, errorInfo) {
		console.error("🔴 QueryErrorBoundary:", error, errorInfo);

		// Log para monitoramento em produção
		if (process.env.NODE_ENV === "production") {
			// Aqui você pode integrar com Sentry, LogRocket, etc.
		}
	}

	handleRetry = () => {
		this.setState((prevState) => ({
			hasError: false,
			error: null,
			retryCount: prevState.retryCount + 1,
		}));

		// Limpar cache com problemas
		queryClient.clear();
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
							Erro no Sistema
						</h2>

						<p className="text-gray-400 mb-6">
							Ocorreu um erro inesperado. Tente recarregar a página ou entre em
							contato com o suporte.
						</p>

						{this.state.retryCount > 0 && (
							<p className="text-xs text-gray-500 mb-4">
								Tentativas: {this.state.retryCount}
							</p>
						)}

						<div className="space-y-3">
							<button
								onClick={this.handleRetry}
								disabled={this.state.retryCount >= 3}
								className="w-full bg-gradient-to-r from-red-600 to-red-500 hover:from-red-500 hover:to-red-400 text-white px-6 py-3 rounded-xl font-semibold transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
							>
								{this.state.retryCount >= 3
									? "Limite atingido"
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
									Detalhes (desenvolvimento)
								</summary>
								<pre className="bg-gray-900 p-4 rounded-lg text-xs text-gray-300 overflow-auto max-h-32">
									{this.state.error.stack}
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

// Performance monitor MELHORADO para identificar problemas de cache
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
				loading: queries.filter((q) => q.state.status === "pending").length,
				error: queries.filter((q) => q.state.status === "error").length,
				success: queries.filter((q) => q.state.status === "success").length,
			};

			console.log("📊 Cache Stats:", stats);

			// Alertar se muitos erros
			if (stats.error > stats.total * 0.2) {
				console.warn("⚠️ Alta taxa de erro nas queries - limpando cache");
				queryClient.clear();
			}

			// Alertar se muitas queries stale
			if (stats.stale > stats.total * 0.8) {
				console.warn("⚠️ Muitas queries stale - possível problema de cache");
			}

			// Detectar queries órfãs
			const orphanQueries = queries.filter(
				(q) => q.state.status === "success" && !q.getObserversCount()
			);

			if (orphanQueries.length > 10) {
				console.warn(
					"🗑️ Queries órfãs detectadas - limpando:",
					orphanQueries.length
				);
				orphanQueries.forEach((q) =>
					queryClient.removeQueries({ queryKey: q.queryKey })
				);
			}
		};

		// Log a cada 15 segundos em desenvolvimento
		const interval = setInterval(logCacheStats, 15000);

		// Log inicial após 2 segundos
		const timeout = setTimeout(logCacheStats, 2000);

		return () => {
			clearInterval(interval);
			clearTimeout(timeout);
		};
	}, []);

	return null;
};

// Cache Monitor para detectar estados inconsistentes
const CacheMonitor = () => {
	useEffect(() => {
		if (process.env.NODE_ENV !== "development") return;

		// Monitor para detectar "old caches cleaner" situations
		const detectInconsistentStates = () => {
			try {
				const cache = queryClient.getQueryCache();
				const queries = cache.getAll();

				// Detectar queries com dados conflitantes
				const publicQueries = queries.filter((q) => q.queryKey[0] === "public");

				const adminQueries = queries.filter((q) => q.queryKey[0] === "admin");

				// Se há queries admin mas usuário não está logado, limpar
				if (adminQueries.length > 0) {
					const hasUserInStorage = localStorage.getItem(
						"sb-zqeblzdfvoywvftkfghw-auth-token"
					);
					if (!hasUserInStorage) {
						console.warn(
							"🗑️ Old caches cleaner: Admin queries sem usuário logado"
						);
						queryClient.removeQueries({ queryKey: ["admin"] });
					}
				}

				// Detectar queries muito antigas
				const now = Date.now();
				const oldQueries = queries.filter((q) => {
					const dataUpdatedAt = q.state.dataUpdatedAt;
					return dataUpdatedAt && now - dataUpdatedAt > 30 * 60 * 1000; // 30 min
				});

				if (oldQueries.length > 5) {
					console.warn(
						"🗑️ Old caches cleaner: Queries muito antigas detectadas"
					);
					oldQueries.forEach((q) => {
						queryClient.removeQueries({ queryKey: q.queryKey });
					});
				}
			} catch (error) {
				console.warn("Erro no cache monitor:", error);
			}
		};

		// Executar verificação a cada 30 segundos
		const interval = setInterval(detectInconsistentStates, 30000);

		// Verificação inicial
		setTimeout(detectInconsistentStates, 5000);

		return () => clearInterval(interval);
	}, []);

	return null;
};

// Provider principal COM MONITORING AGRESSIVO
export const ModernQueryProvider = ({ children }) => {
	// Disponibilizar o queryClient globalmente para o AuthContext
	useEffect(() => {
		window.queryClient = queryClient;

		// Force clear na inicialização se detectar estado inconsistente
		const initCacheCheck = () => {
			try {
				const cache = queryClient.getQueryCache();
				const queries = cache.getAll();

				// Se há muitas queries na inicialização, pode ser cache antigo
				if (queries.length > 20) {
					console.warn(
						"🗑️ Cache inicial muito grande - limpando:",
						queries.length
					);
					queryClient.clear();
				}

				console.log("✅ QueryProvider inicializado");
			} catch (error) {
				console.warn("Erro na verificação inicial de cache:", error);
			}
		};

		// Verificar após um pequeno delay
		setTimeout(initCacheCheck, 1000);

		return () => {
			// Limpar referência global na desmontagem
			delete window.queryClient;
		};
	}, []);

	// Listener para limpeza automática em visibilitychange
	useEffect(() => {
		const handleVisibilityChange = () => {
			if (document.hidden) {
				// Quando tab fica hidden, limpar queries antigas
				const cache = queryClient.getQueryCache();
				const queries = cache.getAll();
				const staleLongerThan10Min = queries.filter((q) => {
					const dataUpdatedAt = q.state.dataUpdatedAt;
					return dataUpdatedAt && Date.now() - dataUpdatedAt > 10 * 60 * 1000;
				});

				if (staleLongerThan10Min.length > 0) {
					console.log(
						"🗑️ Tab hidden: Limpando queries antigas:",
						staleLongerThan10Min.length
					);
					staleLongerThan10Min.forEach((q) => {
						queryClient.removeQueries({ queryKey: q.queryKey });
					});
				}
			}
		};

		document.addEventListener("visibilitychange", handleVisibilityChange);
		return () =>
			document.removeEventListener("visibilitychange", handleVisibilityChange);
	}, []);

	return (
		<QueryErrorBoundary>
			<QueryClientProvider client={queryClient}>
				<RealtimeProvider>
					{children}

					{/* DevTools e Monitors apenas em desenvolvimento */}
					{process.env.NODE_ENV === "development" && (
						<>
							<PerformanceMonitor />
							<CacheMonitor />
						</>
					)}
				</RealtimeProvider>
			</QueryClientProvider>
		</QueryErrorBoundary>
	);
};

// Hook para acessar o queryClient
export const useQueryClient = () => queryClient;

// Utilities para cache MELHORADAS
export const cacheUtils = {
	clear: () => {
		console.log("🗑️ Manual cache clear");
		queryClient.clear();
	},

	invalidateAll: () => {
		console.log("🔄 Manual invalidate all");
		queryClient.invalidateQueries();
	},

	forceCleanup: () => {
		console.log("🗑️ Force cleanup - removendo queries órfãs");
		const cache = queryClient.getQueryCache();
		const queries = cache.getAll();

		// Remover queries sem observers
		const orphanQueries = queries.filter((q) => !q.getObserversCount());
		orphanQueries.forEach((q) => {
			queryClient.removeQueries({ queryKey: q.queryKey });
		});

		console.log(`✅ Removed ${orphanQueries.length} orphan queries`);
	},

	detectProblems: () => {
		const cache = queryClient.getQueryCache();
		const queries = cache.getAll();

		const problems = {
			total: queries.length,
			errors: queries.filter((q) => q.state.status === "error").length,
			stale: queries.filter((q) => q.isStale()).length,
			orphans: queries.filter((q) => !q.getObserversCount()).length,
			old: queries.filter((q) => {
				const dataUpdatedAt = q.state.dataUpdatedAt;
				return dataUpdatedAt && Date.now() - dataUpdatedAt > 20 * 60 * 1000;
			}).length,
		};

		console.log("🔍 Cache Problems:", problems);
		return problems;
	},

	getStats: () => {
		const cache = queryClient.getQueryCache();
		const queries = cache.getAll();

		return {
			total: queries.length,
			fresh: queries.filter((q) => !q.isStale()).length,
			stale: queries.filter((q) => q.isStale()).length,
			error: queries.filter((q) => q.state.status === "error").length,
			loading: queries.filter((q) => q.state.status === "pending").length,
			success: queries.filter((q) => q.state.status === "success").length,
			orphans: queries.filter((q) => !q.getObserversCount()).length,
		};
	},
};

export default ModernQueryProvider;
