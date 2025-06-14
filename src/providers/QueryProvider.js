import React, { useEffect } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

/**
 * QueryProvider CORRIGIDO - SEM REFETCH AUTOMÁTICO AGRESSIVO
 * - Removido visibilitychange listener que causava recarregamentos
 * - Cache mais estável para preservar dados do editor
 * - Limpeza menos agressiva para evitar perda de dados
 */

// QueryClient com configurações ESTÁVEIS para evitar refetch desnecessário
const queryClient = new QueryClient({
	defaultOptions: {
		queries: {
			// Cache mais longo para estabilidade
			staleTime: 5 * 60 * 1000, // 5 minutos
			gcTime: 30 * 60 * 1000, // 30 minutos
			refetchOnWindowFocus: false, // CRÍTICO: nunca refetch ao focar
			refetchOnMount: true,
			refetchOnReconnect: false, // DESABILITADO para evitar refetch em reconexões
			refetchInterval: false, // NUNCA refetch automático por interval

			// Error handling menos agressivo
			retry: (failureCount, error) => {
				// Não retry para 404 ou dados não encontrados
				if (error?.message?.includes("não encontrado")) return false;
				if (error?.message?.includes("not found")) return false;
				if (error?.status === 404) return false;

				// Máximo 1 retry para evitar loops
				return failureCount < 1;
			},

			retryDelay: (attemptIndex) => {
				return Math.min(1000 * 2 ** attemptIndex, 3000); // Delays menores
			},

			// Configurações de network
			networkMode: "online",
		},
		mutations: {
			retry: 0, // Sem retry em mutations
			retryDelay: 1000,
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

		// Limpar cache com problemas apenas se necessário
		if (this.state.retryCount >= 2) {
			queryClient.clear();
		}
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

// Performance monitor MENOS AGRESSIVO
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

			// Apenas log para debug, sem limpeza automática agressiva
			console.log("📊 Cache Stats:", stats);

			// Alertar apenas em casos extremos
			if (stats.error > 10) {
				console.warn("⚠️ Muitos erros no cache - considere limpar manualmente");
			}
		};

		// Log a cada 30 segundos (aumentado) em desenvolvimento
		const interval = setInterval(logCacheStats, 30000);

		// Log inicial após 5 segundos
		const timeout = setTimeout(logCacheStats, 5000);

		return () => {
			clearInterval(interval);
			clearTimeout(timeout);
		};
	}, []);

	return null;
};

// Cache Monitor MENOS AGRESSIVO - sem limpeza automática
const CacheMonitor = () => {
	useEffect(() => {
		if (process.env.NODE_ENV !== "development") return;

		// Monitor mais passivo - apenas log, sem limpeza automática
		const detectProblems = () => {
			try {
				const cache = queryClient.getQueryCache();
				const queries = cache.getAll();

				// Apenas contabilizar problemas, sem agir automaticamente
				const problems = {
					total: queries.length,
					adminQueries: queries.filter((q) => q.queryKey[0] === "admin").length,
					oldQueries: queries.filter((q) => {
						const dataUpdatedAt = q.state.dataUpdatedAt;
						return dataUpdatedAt && Date.now() - dataUpdatedAt > 60 * 60 * 1000; // 1 hora
					}).length,
				};

				// Log apenas se há problemas significativos
				if (problems.total > 50 || problems.oldQueries > 20) {
					console.log("🔍 Cache Monitor:", problems);
				}

				// REMOVIDO: Limpeza automática que causava perda de dados
			} catch (error) {
				console.warn("Cache monitor error:", error);
			}
		};

		// Verificação a cada 5 minutos (muito menos agressivo)
		const interval = setInterval(detectProblems, 5 * 60 * 1000);

		// Verificação inicial após 30 segundos
		setTimeout(detectProblems, 30000);

		return () => clearInterval(interval);
	}, []);

	return null;
};

// Provider principal SEM MONITORING AGRESSIVO
export const ModernQueryProvider = ({ children }) => {
	// Disponibilizar o queryClient globalmente para o AuthContext
	useEffect(() => {
		window.queryClient = queryClient;

		// REMOVIDO: Verificação inicial agressiva que causava limpeza desnecessária

		return () => {
			// Limpar referência global na desmontagem
			delete window.queryClient;
		};
	}, []);

	// REMOVIDO: Listener para visibilitychange que causava recarregamentos automáticos
	// Este era um dos principais causadores do problema

	return (
		<QueryErrorBoundary>
			<QueryClientProvider client={queryClient}>
				<RealtimeProvider>
					{children}

					{/* DevTools e Monitors apenas em desenvolvimento - MENOS AGRESSIVOS */}
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

// Utilities para cache CORRIGIDAS - apenas manuais
export const cacheUtils = {
	// Limpeza manual
	clear: () => {
		console.log("🗑️ Manual cache clear");
		queryClient.clear();
	},

	// Invalidação manual
	invalidateAll: () => {
		console.log("🔄 Manual invalidate all");
		queryClient.invalidateQueries();
	},

	// Limpeza manual de queries órfãs
	forceCleanup: () => {
		console.log("🗑️ Manual cleanup - removendo queries órfãs");
		const cache = queryClient.getQueryCache();
		const queries = cache.getAll();

		// Remover apenas queries órfãs (sem observers)
		const orphanQueries = queries.filter((q) => !q.getObserversCount());
		orphanQueries.forEach((q) => {
			queryClient.removeQueries({ queryKey: q.queryKey });
		});

		console.log(`✅ Removed ${orphanQueries.length} orphan queries`);
	},

	// Detecção de problemas sem ação automática
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
				return dataUpdatedAt && Date.now() - dataUpdatedAt > 30 * 60 * 1000;
			}).length,
		};

		console.log("🔍 Cache Problems:", problems);
		return problems;
	},

	// Estatísticas do cache
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
