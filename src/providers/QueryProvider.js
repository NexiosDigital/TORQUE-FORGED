import React, { useEffect } from "react";
import { QueryClient, QueryErrorResetBoundary } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import {
	PersistQueryClientProvider,
	removeOldestQuery,
} from "@tanstack/react-query-persist-client";
import { createSyncStoragePersister } from "@tanstack/query-sync-storage-persister";
import { useRealtimeSync } from "../hooks/useRealtimeSync";

/**
 * QueryProvider Moderno - Resolver problema do refresh
 * - Cache persistence para resolver F5/refresh
 * - TanStack Query v5 configurações otimizadas
 * - Supabase Realtime integrado
 * - Error boundaries robustos
 */

// Persister para localStorage (resolve problema do F5)
const persister = createSyncStoragePersister({
	storage: window.localStorage,
	key: "torque-forged-cache-v2",
	serialize: JSON.stringify,
	deserialize: JSON.parse,
});

// QueryClient otimizado
const queryClient = new QueryClient({
	defaultOptions: {
		queries: {
			// Configurações para resolver problemas de cache
			staleTime: 5 * 60 * 1000, // 5 minutos fresh
			gcTime: 30 * 60 * 1000, // 30 minutos em cache (gcTime é o novo nome)
			refetchOnWindowFocus: false,
			refetchOnMount: true,
			refetchOnReconnect: true,
			refetchInterval: false,

			// Error handling melhorado
			retry: (failureCount, error) => {
				// Não retry para 404 ou dados não encontrados
				if (error?.message?.includes("não encontrado")) return false;
				if (error?.message?.includes("not found")) return false;
				if (error?.status === 404) return false;

				// Máximo 2 retries para outros erros
				return failureCount < 2;
			},

			retryDelay: (attemptIndex) => {
				// Delay progressivo: 1s, 2s, 4s
				return Math.min(1000 * 2 ** attemptIndex, 4000);
			},

			// Configurações de network
			networkMode: "online",
		},
		mutations: {
			retry: 1,
			retryDelay: 1000,
			networkMode: "online",
		},
	},
});

// Configurações de persistência
const persistOptions = {
	persister,
	maxAge: 1000 * 60 * 60 * 24, // 24 horas
	hydrateOptions: {
		// Configurações para quando o cache for restaurado
	},
	dehydrateOptions: {
		// Controlar quais queries persistir
		shouldDehydrateQuery: (query) => {
			// Persistir apenas queries importantes
			const queryKey = query.queryKey[0];
			const importantQueries = ["posts", "categories", "user-profile"];

			// Não persistir se houver erro
			if (query.state.status === "error") return false;

			// Não persistir buscas (muito específicas)
			if (queryKey === "posts" && query.queryKey[1] === "search") return false;

			return importantQueries.includes(queryKey);
		},
	},
	// Remover queries antigas quando limite for atingido
	removeOldestQuery,
};

// Component para integração do Realtime
const RealtimeProvider = ({ children }) => {
	const { connectionStatus, lastUpdate, isConnected } = useRealtimeSync();

	// Log status da conexão em desenvolvimento
	useEffect(() => {
		if (process.env.NODE_ENV === "development") {
			console.log("📡 Realtime Status:", connectionStatus);
			if (lastUpdate) {
				console.log("🔄 Última atualização:", lastUpdate);
			}
		}
	}, [connectionStatus, lastUpdate]);

	return (
		<>
			{children}

			{/* Indicador de conexão em desenvolvimento */}
			{process.env.NODE_ENV === "development" && (
				<div className="fixed bottom-4 right-4 z-[9999]">
					<div
						className={`
            px-3 py-2 rounded-lg text-xs font-mono shadow-lg
            ${isConnected ? "bg-green-600 text-white" : "bg-red-600 text-white"}
          `}
					>
						📡 {connectionStatus}
						{lastUpdate && (
							<div className="text-[10px] opacity-75">
								{lastUpdate.toLocaleTimeString()}
							</div>
						)}
					</div>
				</div>
			)}
		</>
	);
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
			// analytics.track('query_error_boundary', { error: error.message });
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
				loading: queries.filter((q) => q.state.status === "pending").length,
				error: queries.filter((q) => q.state.status === "error").length,
				success: queries.filter((q) => q.state.status === "success").length,
			};

			console.log("📊 Cache Stats:", stats);

			// Alertar se muitos erros
			if (stats.error > stats.total * 0.2) {
				console.warn("⚠️ Alta taxa de erro nas queries");
			}
		};

		// Log a cada 30 segundos em desenvolvimento
		const interval = setInterval(logCacheStats, 30000);

		// Log inicial após 3 segundos
		const timeout = setTimeout(logCacheStats, 3000);

		return () => {
			clearInterval(interval);
			clearTimeout(timeout);
		};
	}, []);

	return null;
};

// Provider principal
export const ModernQueryProvider = ({ children }) => {
	return (
		<QueryErrorBoundary>
			<PersistQueryClientProvider
				client={queryClient}
				persistOptions={persistOptions}
			>
				<QueryErrorResetBoundary>
					{({ reset }) => (
						<RealtimeProvider>
							{children}

							{/* DevTools apenas em desenvolvimento */}
							{process.env.NODE_ENV === "development" && (
								<>
									<ReactQueryDevtools
										initialIsOpen={false}
										position="bottom-left"
										toggleButtonProps={{
											style: {
												marginLeft: "20px",
												marginBottom: "80px", // Não sobrepor indicador de realtime
												zIndex: 9998,
											},
										}}
									/>
									<PerformanceMonitor />
								</>
							)}
						</RealtimeProvider>
					)}
				</QueryErrorResetBoundary>
			</PersistQueryClientProvider>
		</QueryErrorBoundary>
	);
};

// Hook para acessar o queryClient
export const useQueryClient = () => queryClient;

// Utilities para cache
export const cacheUtils = {
	clear: () => {
		queryClient.clear();
		console.log("🧹 Cache limpo");
	},

	invalidateAll: () => {
		queryClient.invalidateQueries();
		console.log("🔄 Todas as queries invalidadas");
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
		};
	},
};

export default ModernQueryProvider;
