import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import "./index.css";
import App from "./App";

/**
 * INICIALIZAÇÃO INSTANTÂNEA - ZERO BLOQUEIO
 * - Renderização imediata sem aguardar nada
 * - Bootstrap data já carregado no HTML
 * - Preloads em background após render
 * - Service Worker seguro
 */

// Performance monitoring
const perfStart = performance.now();

// Verificar se bootstrap está pronto
const isBootstrapReady = () => {
	return window.TORQUE_FORGED_BOOTSTRAP?.ready || false;
};

// RENDERIZAÇÃO IMEDIATA - PRIORIDADE MÁXIMA
const root = ReactDOM.createRoot(document.getElementById("root"));

// Esconder loading HTML assim que React inicia
const hideHtmlLoader = () => {
	const loader = document.querySelector(".react-loading");
	if (loader) {
		loader.style.opacity = "0";
		setTimeout(() => {
			loader.style.display = "none";
		}, 300);
	}
};

// Render instantâneo - não aguardar NADA
root.render(
	<React.StrictMode>
		<BrowserRouter>
			<App />
		</BrowserRouter>
	</React.StrictMode>
);

// Esconder loader imediatamente após render
hideHtmlLoader();

/**
 * OTIMIZAÇÕES EM BACKGROUND - APÓS RENDER
 * Executar apenas após React ter renderizado
 */

// Service Worker seguro (apenas em produção)
const registerServiceWorker = () => {
	if ("serviceWorker" in navigator && process.env.NODE_ENV === "production") {
		// Delay para não impactar carregamento inicial
		setTimeout(async () => {
			try {
				const registration = await navigator.serviceWorker.register("/sw.js", {
					scope: "/",
				});

				// Verificar atualizações
				registration.addEventListener("updatefound", () => {
					const newWorker = registration.installing;
					newWorker.addEventListener("statechange", () => {
						if (
							newWorker.state === "installed" &&
							navigator.serviceWorker.controller
						) {
							// Notificar usuário sobre atualização se necessário
						}
					});
				});
			} catch (error) {
				console.warn("⚠️ ServiceWorker registration failed:", error);
			}
		}, 3000); // 3 segundos após carregamento
	}
};

// Preload de chunks críticos em background
const preloadCriticalChunks = () => {
	setTimeout(() => {
		// Preload apenas se usuário não navegou ainda
		if (window.location.pathname === "/") {
			Promise.allSettled([
				import(
					/* webpackChunkName: "post-detail" */ "./pages/OptimizedPostDetail"
				),
				import(/* webpackChunkName: "all-posts" */ "./pages/AllPosts"),
			]).then(() => {});
		}
	}, 1000); // 1 segundo após render
};

// Configuração de meta tags dinâmicas
const setupDynamicMeta = () => {
	// DNS prefetch para recursos externos
	const dnsPrefetches = [
		"https://fonts.googleapis.com",
		"https://fonts.gstatic.com",
		"https://images.unsplash.com",
	];

	dnsPrefetches.forEach((domain) => {
		if (!document.querySelector(`link[href="${domain}"]`)) {
			const link = document.createElement("link");
			link.rel = "dns-prefetch";
			link.href = domain;
			document.head.appendChild(link);
		}
	});

	// Preconnect para Supabase se disponível
	const supabaseUrl = window.REACT_APP_SUPABASE_URL;
	if (supabaseUrl && !document.querySelector(`link[href="${supabaseUrl}"]`)) {
		const link = document.createElement("link");
		link.rel = "preconnect";
		link.href = supabaseUrl;
		link.crossOrigin = "";
		document.head.appendChild(link);
	}
};

// Error handling global otimizado
const setupGlobalErrorHandling = () => {
	// Capturar erros não tratados
	window.addEventListener("error", (event) => {
		console.error("🔴 Global error:", event.error);

		// Em produção, enviar para serviço de monitoramento
		if (process.env.NODE_ENV === "production") {
			// Implementar envio para Sentry, LogRocket, etc.
		}
	});

	// Capturar promise rejections não tratadas
	window.addEventListener("unhandledrejection", (event) => {
		console.error("🔴 Unhandled promise rejection:", event.reason);

		// Prevenir erro no console em produção
		if (process.env.NODE_ENV === "production") {
			event.preventDefault();
		}
	});
};

// Cache preemptivo de recursos
const setupResourceCache = () => {
	// Cache de imagens críticas
	const criticalImages = [
		"https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&h=600&fit=crop", // Fallback image
	];

	// Preload de imagens críticas após delay
	setTimeout(() => {
		criticalImages.forEach((src) => {
			const img = new Image();
			img.src = src;
		});
	}, 2000);
};

// Warm-up de dados em background
const warmupDataCache = () => {
	// Refresh bootstrap data se necessário
	setTimeout(async () => {
		if (window.TORQUE_FORGED_BOOTSTRAP?.utils?.refresh) {
			try {
				await window.TORQUE_FORGED_BOOTSTRAP.utils.refresh();
			} catch (error) {
				console.warn("⚠️ Bootstrap refresh failed:", error);
			}
		}
	}, 5000); // 5 segundos após carregamento
};

/**
 * EXECUTAR OTIMIZAÇÕES EM BACKGROUND
 * Tudo executado após React render para não bloquear UI
 */
setTimeout(() => {
	setupDynamicMeta();
	setupGlobalErrorHandling();
	setupResourceCache();
	registerServiceWorker();
	preloadCriticalChunks();
	warmupDataCache();
}, 100); // 100ms após render

// Performance logging em desenvolvimento
if (process.env.NODE_ENV === "development") {
	// Log inicial
	setTimeout(() => {
		const initTime = performance.now() - perfStart;
		console.log(`🎯 App initialized in ${initTime.toFixed(2)}ms`);

		// Verificar bootstrap stats
		if (window.TORQUE_FORGED_BOOTSTRAP?.utils?.getStats) {
			console.log(
				"📊 Bootstrap stats:",
				window.TORQUE_FORGED_BOOTSTRAP.utils.getStats()
			);
		}
	}, 500);

	// Web Vitals monitoring
	setTimeout(() => {
		try {
			const navigation = performance.getEntriesByType("navigation")[0];
			if (navigation) {
				console.log("📊 Performance Metrics:", {
					DOMContentLoaded: `${navigation.domContentLoadedEventEnd.toFixed(
						2
					)}ms`,
					LoadComplete: `${navigation.loadEventEnd.toFixed(2)}ms`,
					FirstPaint: `${
						performance
							.getEntriesByType("paint")
							.find((p) => p.name === "first-paint")
							?.startTime?.toFixed(2) || "N/A"
					}ms`,
					FirstContentfulPaint: `${
						performance
							.getEntriesByType("paint")
							.find((p) => p.name === "first-contentful-paint")
							?.startTime?.toFixed(2) || "N/A"
					}ms`,
				});
			}
		} catch (error) {
			// Ignore performance API errors
		}
	}, 1000);

	// Expor utilitários para debug
	window.TorqueForgedUtils = {
		// Limpar todos os caches
		clearAllCache: () => {
			localStorage.clear();
			sessionStorage.clear();
			if ("caches" in window) {
				caches.keys().then((names) => {
					names.forEach((name) => caches.delete(name));
				});
			}
			if (window.queryClient) {
				window.queryClient.clear();
			}
			if (window.TORQUE_FORGED_BOOTSTRAP?.utils?.clearCache) {
				window.TORQUE_FORGED_BOOTSTRAP.utils.clearCache();
			}
			console.log("🗑️ All caches cleared");
		},

		// Forçar refresh do bootstrap
		refreshBootstrap: async () => {
			if (window.TORQUE_FORGED_BOOTSTRAP?.utils?.refresh) {
				await window.TORQUE_FORGED_BOOTSTRAP.utils.refresh();
				console.log("🔄 Bootstrap refreshed manually");
			}
		},

		// Preload manual
		preloadCritical: () => {
			preloadCriticalChunks();
			console.log("🚀 Critical chunks preload triggered");
		},

		// Métricas de performance
		getPerformanceMetrics: () => {
			const navigation = performance.getEntriesByType("navigation")[0];
			const paint = performance.getEntriesByType("paint");

			return {
				navigation: navigation ? `${navigation.duration.toFixed(2)}ms` : "N/A",
				firstPaint:
					paint.find((p) => p.name === "first-paint")?.startTime.toFixed(2) +
						"ms" || "N/A",
				firstContentfulPaint:
					paint
						.find((p) => p.name === "first-contentful-paint")
						?.startTime.toFixed(2) + "ms" || "N/A",
				bootstrap: window.TORQUE_FORGED_BOOTSTRAP?.utils?.getStats() || "N/A",
				queryCache: window.queryClient
					? window.queryClient.getQueryCache().getAll().length
					: "N/A",
			};
		},

		// Status geral
		getSystemStatus: () => {
			return {
				reactReady: !!document.getElementById("root").children.length,
				bootstrapReady: isBootstrapReady(),
				serviceWorkerReady:
					"serviceWorker" in navigator && navigator.serviceWorker.controller,
				queryClientReady: !!window.queryClient,
				cacheStats: window.queryClient
					? {
							total: window.queryClient.getQueryCache().getAll().length,
							success: window.queryClient
								.getQueryCache()
								.getAll()
								.filter((q) => q.state.status === "success").length,
							error: window.queryClient
								.getQueryCache()
								.getAll()
								.filter((q) => q.state.status === "error").length,
					  }
					: null,
			};
		},
	};
}

// Warm-up automático para primeira visita
if (!localStorage.getItem("tf-visited")) {
	localStorage.setItem("tf-visited", Date.now().toString());

	// Preload extra para primeira visita
	setTimeout(() => {
		preloadCriticalChunks();
	}, 500);
}

// Disponibilizar versão para debug
if (process.env.NODE_ENV === "development") {
	console.log("🔧 Development utils available at window.TorqueForgedUtils");
}
