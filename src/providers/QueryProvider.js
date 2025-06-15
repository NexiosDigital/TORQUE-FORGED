import React, { useEffect } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

/**
 * QueryProvider INSTANTÂNEO - ZERO LOADING STATES
 * - Usa dados do bootstrap para carregamento instantâneo
 * - Placeholder data inteligente evita loading
 * - Cache ultra agressivo com dados pré-populados
 * - Nunca mostra "Carregando..."
 */

// Função para obter dados do bootstrap
const getBootstrapData = (key) => {
	if (
		window.TORQUE_FORGED_BOOTSTRAP?.ready &&
		window.TORQUE_FORGED_BOOTSTRAP.data[key]
	) {
		return window.TORQUE_FORGED_BOOTSTRAP.data[key];
	}
	return null;
};

// Placeholder data functions - NUNCA retornam undefined
const placeholderData = {
	featuredPosts: () => getBootstrapData("featuredPosts") || [],
	allPosts: () => getBootstrapData("allPosts") || [],
	categories: () =>
		getBootstrapData("categories") || [
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
		],
	byCategory: (categoryId) => {
		const allPosts = getBootstrapData("allPosts") || [];
		return allPosts.filter((post) => post.category === categoryId);
	},
	postById: (id) => {
		const allPosts = getBootstrapData("allPosts") || [];
		return allPosts.find((post) => post.id === parseInt(id)) || null;
	},
};

// QueryClient com configurações INSTANTÂNEAS
const queryClient = new QueryClient({
	defaultOptions: {
		queries: {
			// Cache EXTREMAMENTE agressivo
			staleTime: 60 * 60 * 1000, // 1 hora - dados nunca ficam stale
			gcTime: 4 * 60 * 60 * 1000, // 4 horas - manter em memória

			// NUNCA refetch - usar sempre cache/placeholder
			refetchOnWindowFocus: false,
			refetchOnMount: false,
			refetchOnReconnect: false,
			refetchInterval: false,
			refetchIntervalInBackground: false,

			// Offline first para carregamento instantâneo
			networkMode: "offlineFirst",

			// Zero retry para velocidade máxima
			retry: false,
			retryOnMount: false,
			retryDelay: 0,

			// SEMPRE usar placeholder data
			placeholderData: (previousData) => previousData,

			// Inicializar com bootstrap data
			initialData: undefined, // Será definido por query
			initialDataUpdatedAt: Date.now(),

			// Performance otimizada
			structuralSharing: true,
			useErrorBoundary: false,
		},
		mutations: {
			retry: 0,
			retryDelay: 0,
			networkMode: "online",
			useErrorBoundary: false,
		},
	},
});

// Bootstrap Query Cache com dados pré-carregados
const bootstrapQueryCache = () => {
	try {
		// Popular cache com dados do bootstrap
		const featuredPosts = getBootstrapData("featuredPosts");
		const allPosts = getBootstrapData("allPosts");
		const categories = getBootstrapData("categories");

		if (featuredPosts) {
			queryClient.setQueryData(["public", "posts", "featured"], featuredPosts);
		}

		if (allPosts) {
			queryClient.setQueryData(["public", "posts"], allPosts);

			// Popular cache de posts individuais
			allPosts.forEach((post) => {
				queryClient.setQueryData(["public", "posts", "detail", post.id], post);
			});
		}

		if (categories) {
			queryClient.setQueryData(["public", "categories"], categories);

			// Popular cache por categoria
			categories.forEach((category) => {
				const categoryPosts = placeholderData.byCategory(category.id);
				if (categoryPosts.length > 0) {
					queryClient.setQueryData(
						["public", "posts", "category", category.id],
						categoryPosts
					);
				}
			});
		}
	} catch (error) {
		console.warn("⚠️ Bootstrap: Query Cache population failed", error);
	}
};

// Error Boundary minimalista
class InstantQueryErrorBoundary extends React.Component {
	constructor(props) {
		super(props);
		this.state = {
			hasError: false,
			error: null,
		};
	}

	static getDerivedStateFromError(error) {
		return { hasError: true, error };
	}

	componentDidCatch(error, errorInfo) {
		console.error("🔴 InstantQueryErrorBoundary:", error, errorInfo);
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
							Sistema Temporariamente Indisponível
						</h2>
						<p className="text-gray-400 mb-6">
							Ocorreu um erro inesperado. Recarregue a página para tentar
							novamente.
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

// Bootstrap Cache Manager
const BootstrapCacheManager = () => {
	useEffect(() => {
		// Popular cache imediatamente
		bootstrapQueryCache();

		// Re-popular se bootstrap data for atualizada
		const checkForUpdates = () => {
			if (window.TORQUE_FORGED_BOOTSTRAP?.ready) {
				bootstrapQueryCache();
			}
		};

		// Verificar atualizações a cada 30 segundos
		const updateInterval = setInterval(checkForUpdates, 30000);

		// Cleanup
		return () => {
			clearInterval(updateInterval);
		};
	}, []);

	return null;
};

// Preload Critical Data (background)
const CriticalDataPreloader = () => {
	useEffect(() => {
		// Preload adicional em background após 2 segundos
		const timer = setTimeout(async () => {
			try {
				// Refresh bootstrap data se necessário
				if (window.TORQUE_FORGED_BOOTSTRAP?.utils?.refresh) {
					await window.TORQUE_FORGED_BOOTSTRAP.utils.refresh();
				}
			} catch (error) {
				console.warn("⚠️ Background preload failed:", error);
			}
		}, 2000);

		return () => clearTimeout(timer);
	}, []);

	return null;
};

// Provider principal INSTANTÂNEO
export const ModernQueryProvider = ({ children }) => {
	// Disponibilizar queryClient globalmente
	useEffect(() => {
		window.queryClient = queryClient;

		// Popular cache inicial se ainda não foi feito
		if (window.TORQUE_FORGED_BOOTSTRAP?.ready) {
			bootstrapQueryCache();
		}

		// Cleanup na desmontagem
		return () => {
			delete window.queryClient;
		};
	}, []);

	return (
		<InstantQueryErrorBoundary>
			<QueryClientProvider client={queryClient}>
				{children}

				{/* Managers de cache em background */}
				<BootstrapCacheManager />
				<CriticalDataPreloader />

				{/* DevTools apenas em desenvolvimento */}
				{process.env.NODE_ENV === "development" && <DevTools />}
			</QueryClientProvider>
		</InstantQueryErrorBoundary>
	);
};

// DevTools para desenvolvimento
const DevTools = () => {
	useEffect(() => {
		// Debug info após 5 segundos
		const timer = setTimeout(() => {
			const cache = queryClient.getQueryCache();
			const queries = cache.getAll();

			console.log("📊 Instant Query Stats:", {
				total: queries.length,
				fresh: queries.filter((q) => !q.isStale()).length,
				stale: queries.filter((q) => q.isStale()).length,
				hasBootstrap: !!window.TORQUE_FORGED_BOOTSTRAP?.ready,
				bootstrapKeys: Object.keys(window.TORQUE_FORGED_BOOTSTRAP?.data || {}),
			});
		}, 5000);

		return () => clearTimeout(timer);
	}, []);

	return null;
};

// Hook para acessar o queryClient
export const useQueryClient = () => queryClient;

// Utilities otimizadas para carregamento instantâneo
export const cacheUtils = {
	// Verificar se dados estão prontos (sempre true com bootstrap)
	isReady: () => {
		return window.TORQUE_FORGED_BOOTSTRAP?.ready || false;
	},

	// Obter dados do bootstrap diretamente
	getBootstrapData: (key) => {
		return getBootstrapData(key);
	},

	// Limpeza total
	clear: () => {
		queryClient.clear();
		if (window.TORQUE_FORGED_BOOTSTRAP?.utils?.clearCache) {
			window.TORQUE_FORGED_BOOTSTRAP.utils.clearCache();
		}
	},

	// Invalidação manual (raramente necessária)
	invalidateAll: () => {
		queryClient.invalidateQueries();
	},

	// Re-popular cache com bootstrap
	repopulate: () => {
		bootstrapQueryCache();
	},

	// Forçar refresh do bootstrap
	refreshBootstrap: async () => {
		if (window.TORQUE_FORGED_BOOTSTRAP?.utils?.refresh) {
			await window.TORQUE_FORGED_BOOTSTRAP.utils.refresh();
			bootstrapQueryCache();
		}
	},

	// Preload crítico (compatibilidade)
	preloadCritical: async () => {
		bootstrapQueryCache();

		// Refresh bootstrap se necessário
		if (window.TORQUE_FORGED_BOOTSTRAP?.utils?.refresh) {
			try {
				await window.TORQUE_FORGED_BOOTSTRAP.utils.refresh();
				bootstrapQueryCache();
			} catch (error) {
				console.warn("⚠️ Bootstrap refresh failed:", error);
			}
		}
	},

	// Estatísticas instantâneas
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
			hasBootstrap: !!window.TORQUE_FORGED_BOOTSTRAP?.ready,
			bootstrapTimestamp: window.TORQUE_FORGED_BOOTSTRAP?.timestamp,
		};
	},
};

// Override do placeholder data para hooks
export const instantPlaceholderData = placeholderData;

export default ModernQueryProvider;
