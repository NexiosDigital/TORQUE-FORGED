import React, { useEffect } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

/**
 * QueryProvider SIMPLIFICADO - SEM PLACEHOLDERS
 * Remove todos os placeholders que interferem nos dados reais
 */

// QueryClient com configurações simples e diretas
const queryClient = new QueryClient({
	defaultOptions: {
		queries: {
			// Cache moderado - dados frescos sempre que necessário
			staleTime: 5 * 60 * 1000, // 5 minutos
			gcTime: 30 * 60 * 1000, // 30 minutos

			// Sempre buscar dados quando necessário
			refetchOnWindowFocus: false,
			refetchOnMount: true,
			refetchOnReconnect: true,

			// Retry simples
			retry: 1,
			retryDelay: 1000,

			// Online first - sempre tentar buscar dados frescos
			networkMode: "online",

			// SEM PLACEHOLDER DATA - sempre buscar dados reais
			placeholderData: undefined,
			initialData: undefined,

			// Estrutura sharing para performance
			structuralSharing: true,
			useErrorBoundary: false,
		},
		mutations: {
			retry: 1,
			retryDelay: 1000,
			networkMode: "online",
			useErrorBoundary: false,
		},
	},
});

// Error Boundary minimalista
class SimpleQueryErrorBoundary extends React.Component {
	constructor(props) {
		super(props);
		this.state = { hasError: false, error: null };
	}

	static getDerivedStateFromError(error) {
		return { hasError: true, error };
	}

	componentDidCatch(error, errorInfo) {
		console.error("🔴 Query Error Boundary:", error, errorInfo);
	}

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
							Erro no Carregamento
						</h2>
						<p className="text-gray-400 mb-6">
							Ocorreu um erro ao carregar os dados. Recarregue a página.
						</p>
						<button
							onClick={() => window.location.reload()}
							className="w-full bg-gradient-to-r from-red-600 to-red-500 hover:from-red-500 hover:to-red-400 text-white px-6 py-3 rounded-xl font-semibold transition-all duration-300"
						>
							Recarregar Página
						</button>
					</div>
				</div>
			);
		}

		return this.props.children;
	}
}

// Cache Manager simples
const SimpleCacheManager = () => {
	useEffect(() => {
		// Disponibilizar queryClient globalmente para debug
		window.queryClient = queryClient;

		// Cleanup na desmontagem
		return () => {
			delete window.queryClient;
		};
	}, []);

	return null;
};

// DevTools apenas em desenvolvimento
const DevTools = () => {
	useEffect(() => {
		if (process.env.NODE_ENV === "development") {
			// Debug info após alguns segundos
			const timer = setTimeout(() => {
				const cache = queryClient.getQueryCache();
				const queries = cache.getAll();

				console.log("📊 Query Stats:", {
					total: queries.length,
					categories: queries.filter((q) => q.queryKey.includes("categories"))
						.length,
					posts: queries.filter((q) => q.queryKey.includes("posts")).length,
					success: queries.filter((q) => q.state.status === "success").length,
					error: queries.filter((q) => q.state.status === "error").length,
					loading: queries.filter((q) => q.state.status === "pending").length,
				});
			}, 3000);

			return () => clearTimeout(timer);
		}
	}, []);

	return null;
};

// Provider principal simplificado
export const ModernQueryProvider = ({ children }) => {
	return (
		<SimpleQueryErrorBoundary>
			<QueryClientProvider client={queryClient}>
				{children}

				{/* Cache manager simples */}
				<SimpleCacheManager />

				{/* DevTools apenas em desenvolvimento */}
				{process.env.NODE_ENV === "development" && <DevTools />}
			</QueryClientProvider>
		</SimpleQueryErrorBoundary>
	);
};

// Hook para acessar o queryClient
export const useQueryClient = () => queryClient;

// Utilities simples e diretas
export const cacheUtils = {
	// Limpar tudo
	clear: () => {
		queryClient.clear();

		// Limpar localStorage também
		try {
			Object.keys(localStorage).forEach((key) => {
				if (key.startsWith("tf-cache-")) {
					localStorage.removeItem(key);
				}
			});
		} catch (error) {
			// Ignorar erros de localStorage
		}

		console.log("🗑️ Cache limpo completamente");
	},

	// Invalidar todas as queries
	invalidateAll: () => {
		queryClient.invalidateQueries();
		console.log("🔄 Todas as queries invalidadas");
	},

	// Invalidar apenas categorias
	invalidateCategories: () => {
		queryClient.invalidateQueries({
			queryKey: ["public", "categories"],
		});
		queryClient.invalidateQueries({
			queryKey: ["admin", "categories"],
		});

		// Limpar cache local de categorias
		try {
			localStorage.removeItem("tf-cache-categories-db");
		} catch (error) {
			// Ignorar
		}

		console.log("🔄 Cache de categorias invalidado");
	},

	// Forçar refetch de categorias
	refetchCategories: async () => {
		await queryClient.refetchQueries({
			queryKey: ["public", "categories"],
		});
		console.log("🔄 Categorias recarregadas");
	},

	// Estatísticas do cache
	getStats: () => {
		const cache = queryClient.getQueryCache();
		const queries = cache.getAll();

		return {
			total: queries.length,
			byStatus: {
				success: queries.filter((q) => q.state.status === "success").length,
				error: queries.filter((q) => q.state.status === "error").length,
				loading: queries.filter((q) => q.state.status === "pending").length,
				idle: queries.filter((q) => q.state.status === "idle").length,
			},
			byType: {
				categories: queries.filter((q) => q.queryKey.includes("categories"))
					.length,
				posts: queries.filter((q) => q.queryKey.includes("posts")).length,
				public: queries.filter((q) => q.queryKey[0] === "public").length,
				admin: queries.filter((q) => q.queryKey[0] === "admin").length,
			},
			errors: queries
				.filter((q) => q.state.status === "error")
				.map((q) => ({
					queryKey: q.queryKey,
					error: q.state.error?.message,
				})),
		};
	},

	// Debug de uma query específica
	debugQuery: (queryKey) => {
		const query = queryClient.getQueryCache().find(queryKey);
		if (query) {
			console.log(`🔍 Query Debug [${JSON.stringify(queryKey)}]:`, {
				status: query.state.status,
				data: query.state.data,
				error: query.state.error,
				lastUpdated: new Date(query.state.dataUpdatedAt).toLocaleString(),
				stale: query.isStale(),
			});
		} else {
			console.warn(`⚠️ Query não encontrada: ${JSON.stringify(queryKey)}`);
		}
	},

	// Forçar estado limpo
	reset: () => {
		queryClient.clear();
		queryClient.getQueryCache().clear();
		queryClient.getMutationCache().clear();

		// Limpar localStorage
		try {
			Object.keys(localStorage).forEach((key) => {
				if (key.startsWith("tf-cache-") || key.startsWith("sb-")) {
					localStorage.removeItem(key);
				}
			});
		} catch (error) {
			// Ignorar
		}

		console.log("🔄 Sistema completamente resetado");
	},
};

// Disponibilizar utils globalmente em desenvolvimento
if (process.env.NODE_ENV === "development") {
	window.cacheUtils = cacheUtils;

	console.log(`
🔧 === CACHE UTILS DISPONÍVEIS ===

// Limpar cache
cacheUtils.clear()

// Invalidar categorias  
cacheUtils.invalidateCategories()

// Recarregar categorias
await cacheUtils.refetchCategories()

// Ver estatísticas
cacheUtils.getStats()

// Debug query específica
cacheUtils.debugQuery(["public", "categories"])

// Reset completo
cacheUtils.reset()

======================================
	`);
}

export default ModernQueryProvider;
