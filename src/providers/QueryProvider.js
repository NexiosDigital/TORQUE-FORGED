import React, { useEffect } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

/**
 * QueryProvider ULTRA OTIMIZADO - Carregamento instantâneo
 * - Cache ULTRA agressivo para performance máxima
 * - Sem refetch automático desnecessário
 * - Persistência em localStorage
 * - Background prefetch otimizado
 */

// QueryClient com configurações ULTRA AGRESSIVAS
const queryClient = new QueryClient({
	defaultOptions: {
		queries: {
			// Cache ULTRA longo para carregamento instantâneo
			staleTime: 30 * 60 * 1000, // 30 minutos - dados ficam fresh por muito tempo
			gcTime: 4 * 60 * 60 * 1000, // 4 horas - manter em memória por muito tempo

			// NUNCA refetch automático - sempre usar cache primeiro
			refetchOnWindowFocus: false,
			refetchOnMount: false,
			refetchOnReconnect: false,
			refetchInterval: false,
			refetchIntervalInBackground: false,

			// Offline-first para carregamento instantâneo
			networkMode: "offlineFirst",

			// Retry mínimo para velocidade
			retry: false,
			retryOnMount: false,
			retryDelay: () => 0,

			// Placeholder data para UX suave
			placeholderData: (previousData, previousQuery) => previousData,

			// Configurações de network otimizadas
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

// Persistência local para cache entre sessões
const persistCache = {
	save: (key, data) => {
		try {
			const item = {
				data,
				timestamp: Date.now(),
				version: "1.0",
			};
			localStorage.setItem(`torque-cache-${key}`, JSON.stringify(item));
		} catch (error) {
			console.warn("Failed to save cache:", error);
		}
	},

	load: (key, maxAge = 30 * 60 * 1000) => {
		try {
			const item = localStorage.getItem(`torque-cache-${key}`);
			if (!item) return null;

			const parsed = JSON.parse(item);
			const age = Date.now() - parsed.timestamp;

			if (age > maxAge) {
				localStorage.removeItem(`torque-cache-${key}`);
				return null;
			}

			return parsed.data;
		} catch (error) {
			console.warn("Failed to load cache:", error);
			return null;
		}
	},

	clear: () => {
		try {
			Object.keys(localStorage).forEach((key) => {
				if (key.startsWith("torque-cache-")) {
					localStorage.removeItem(key);
				}
			});
		} catch (error) {
			console.warn("Failed to clear cache:", error);
		}
	},
};

// Error Boundary minimalista
class QueryErrorBoundary extends React.Component {
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
		console.error("🔴 QueryErrorBoundary:", error, errorInfo);
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
							Erro no Sistema
						</h2>

						<p className="text-gray-400 mb-6">
							Ocorreu um erro inesperado. Tente recarregar a página.
						</p>

						<div className="space-y-3">
							<button
								onClick={() => window.location.reload()}
								className="w-full bg-gradient-to-r from-red-600 to-red-500 hover:from-red-500 hover:to-red-400 text-white px-6 py-3 rounded-xl font-semibold transition-all duration-300"
							>
								Recarregar Página
							</button>
						</div>
					</div>
				</div>
			);
		}

		return this.props.children;
	}
}

// Background cache warmer
const CacheWarmer = () => {
	useEffect(() => {
		const warmupCache = async () => {
			try {
				// Preload de dados críticos após 100ms
				setTimeout(async () => {
					const { PostService } = await import("../services/PostService");

					// Prefetch silencioso em background
					Promise.allSettled([
						queryClient.prefetchQuery({
							queryKey: ["public", "posts", "featured"],
							queryFn: () => PostService.getFeaturedPosts(),
							staleTime: 45 * 60 * 1000,
						}),
						queryClient.prefetchQuery({
							queryKey: ["public", "posts"],
							queryFn: () => PostService.getAllPosts(),
							staleTime: 30 * 60 * 1000,
						}),
						queryClient.prefetchQuery({
							queryKey: ["public", "categories"],
							queryFn: () => PostService.getCategories(),
							staleTime: 2 * 60 * 60 * 1000,
						}),
					])
						.then(() => {
							console.log("🚀 Cache warmed up successfully");
						})
						.catch((error) => {
							console.warn("⚠️ Cache warmup failed:", error);
						});
				}, 100);
			} catch (error) {
				console.warn("⚠️ Cache warmer error:", error);
			}
		};

		warmupCache();
	}, []);

	return null;
};

// Cache persistence manager
const CachePersistence = () => {
	useEffect(() => {
		// Carregar cache persistido na inicialização
		const loadPersistedCache = () => {
			try {
				// Carregar dados críticos do localStorage
				const featuredPosts = persistCache.load(
					"featured-posts",
					45 * 60 * 1000
				);
				const allPosts = persistCache.load("all-posts", 30 * 60 * 1000);
				const categories = persistCache.load("categories", 2 * 60 * 60 * 1000);

				if (featuredPosts) {
					queryClient.setQueryData(
						["public", "posts", "featured"],
						featuredPosts
					);
				}

				if (allPosts) {
					queryClient.setQueryData(["public", "posts"], allPosts);
				}

				if (categories) {
					queryClient.setQueryData(["public", "categories"], categories);
				}

				if (featuredPosts || allPosts || categories) {
					console.log("💾 Loaded persisted cache");
				}
			} catch (error) {
				console.warn("⚠️ Failed to load persisted cache:", error);
			}
		};

		// Carregar cache após 50ms
		setTimeout(loadPersistedCache, 50);

		// Salvar cache periodicamente (a cada 5 minutos)
		const saveInterval = setInterval(() => {
			try {
				const featuredPosts = queryClient.getQueryData([
					"public",
					"posts",
					"featured",
				]);
				const allPosts = queryClient.getQueryData(["public", "posts"]);
				const categories = queryClient.getQueryData(["public", "categories"]);

				if (featuredPosts) persistCache.save("featured-posts", featuredPosts);
				if (allPosts) persistCache.save("all-posts", allPosts);
				if (categories) persistCache.save("categories", categories);
			} catch (error) {
				console.warn("⚠️ Failed to persist cache:", error);
			}
		}, 5 * 60 * 1000);

		// Cleanup
		return () => {
			clearInterval(saveInterval);
		};
	}, []);

	return null;
};

// Provider principal ULTRA OTIMIZADO
export const ModernQueryProvider = ({ children }) => {
	// Disponibilizar o queryClient globalmente
	useEffect(() => {
		window.queryClient = queryClient;

		// Cleanup na desmontagem
		return () => {
			delete window.queryClient;
		};
	}, []);

	return (
		<QueryErrorBoundary>
			<QueryClientProvider client={queryClient}>
				{children}

				{/* Cache optimization components */}
				<CacheWarmer />
				<CachePersistence />

				{/* DevTools apenas em desenvolvimento */}
				{process.env.NODE_ENV === "development" && <DevTools />}
			</QueryClientProvider>
		</QueryErrorBoundary>
	);
};

// DevTools minimalistas para desenvolvimento
const DevTools = () => {
	useEffect(() => {
		// Log de cache stats apenas uma vez
		const logStats = () => {
			const cache = queryClient.getQueryCache();
			const queries = cache.getAll();

			console.log("📊 Cache Stats:", {
				total: queries.length,
				fresh: queries.filter((q) => !q.isStale()).length,
				stale: queries.filter((q) => q.isStale()).length,
			});
		};

		// Log inicial após 10 segundos
		setTimeout(logStats, 10000);
	}, []);

	return null;
};

// Hook para acessar o queryClient
export const useQueryClient = () => queryClient;

// Utilities para cache OTIMIZADAS
export const cacheUtils = {
	// Limpeza manual total
	clear: () => {
		console.log("🗑️ Manual cache clear");
		queryClient.clear();
		persistCache.clear();
	},

	// Invalidação manual
	invalidateAll: () => {
		console.log("🔄 Manual invalidate all");
		queryClient.invalidateQueries();
	},

	// Preload de dados críticos
	preloadCritical: async () => {
		try {
			const { PostService } = await import("../services/PostService");

			await Promise.allSettled([
				queryClient.prefetchQuery({
					queryKey: ["public", "posts", "featured"],
					queryFn: () => PostService.getFeaturedPosts(),
					staleTime: 45 * 60 * 1000,
				}),
				queryClient.prefetchQuery({
					queryKey: ["public", "posts"],
					queryFn: () => PostService.getAllPosts(),
					staleTime: 30 * 60 * 1000,
				}),
				queryClient.prefetchQuery({
					queryKey: ["public", "categories"],
					queryFn: () => PostService.getCategories(),
					staleTime: 2 * 60 * 60 * 1000,
				}),
			]);

			console.log("🚀 Critical data preloaded");
		} catch (error) {
			console.warn("⚠️ Preload failed:", error);
		}
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
		};
	},

	// Força refresh manual
	forceRefresh: () => {
		queryClient.invalidateQueries();
		queryClient.refetchQueries();
		console.log("🔄 Force refresh triggered");
	},

	// Salvar cache manualmente
	persist: () => {
		try {
			const featuredPosts = queryClient.getQueryData([
				"public",
				"posts",
				"featured",
			]);
			const allPosts = queryClient.getQueryData(["public", "posts"]);
			const categories = queryClient.getQueryData(["public", "categories"]);

			if (featuredPosts) persistCache.save("featured-posts", featuredPosts);
			if (allPosts) persistCache.save("all-posts", allPosts);
			if (categories) persistCache.save("categories", categories);

			console.log("💾 Cache persisted manually");
		} catch (error) {
			console.warn("⚠️ Manual persist failed:", error);
		}
	},
};

export default ModernQueryProvider;
