import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import "./index.css";
import App from "./App";

/**
 * INICIALIZAÇÃO ULTRA OTIMIZADA
 * - Preload de recursos críticos
 * - Renderização imediata
 * - Cache preemptivo
 * - Service Worker automático
 */

// Performance monitoring
const perfStart = performance.now();

// Preload crítico de serviços em background
const preloadCriticalServices = () => {
	// Preload assíncrono após initial render
	setTimeout(async () => {
		try {
			// Importar serviços críticos em paralelo
			const [{ dataAPIService }, { PostService }] = await Promise.all([
				import("./services/DataAPIService"),
				import("./services/PostService"),
			]);

			// Warmup cache silencioso
			Promise.allSettled([
				dataAPIService.warmupCache(),
				PostService.preloadCriticalData(),
			]).then(() => {
				const loadTime = performance.now() - perfStart;
				console.log(
					`🚀 Critical services preloaded in ${loadTime.toFixed(2)}ms`
				);
			});
		} catch (error) {
			console.warn("⚠️ Critical services preload failed:", error);
		}
	}, 100); // Executar após 100ms do initial render
};

// Preload de chunks críticos
const preloadCriticalChunks = () => {
	// Preload do chunk da homepage
	import(
		/* webpackChunkName: "home", webpackPreload: true */ "./pages/OptimizedHome"
	);

	// Preload de componentes frequentemente usados após 1s
	setTimeout(() => {
		Promise.all([
			import(
				/* webpackChunkName: "post-detail" */ "./pages/OptimizedPostDetail"
			),
			import(/* webpackChunkName: "categories" */ "./pages/Formula1"),
		]);
	}, 1000);
};

// Configuração de performance observers
const setupPerformanceMonitoring = () => {
	if (
		"PerformanceObserver" in window &&
		process.env.NODE_ENV === "development"
	) {
		// Monitor de Web Vitals
		const observer = new PerformanceObserver((list) => {
			for (const entry of list.getEntries()) {
				if (entry.entryType === "navigation") {
					console.log(`📊 Navigation timing: ${entry.duration.toFixed(2)}ms`);
				}
				if (entry.entryType === "largest-contentful-paint") {
					console.log(`📊 LCP: ${entry.startTime.toFixed(2)}ms`);
				}
			}
		});

		try {
			observer.observe({
				entryTypes: ["navigation", "largest-contentful-paint"],
			});
		} catch (error) {
			// Ignorar se não suportado
		}
	}
};

// Otimização de fonts
const optimizeFonts = () => {
	// Preload de fontes críticas se houver
	const fontPreloads = [
		// Adicionar URLs de fontes aqui se necessário
	];

	fontPreloads.forEach((fontUrl) => {
		const link = document.createElement("link");
		link.rel = "preload";
		link.href = fontUrl;
		link.as = "font";
		link.type = "font/woff2";
		link.crossOrigin = "";
		document.head.appendChild(link);
	});
};

// Configuração de meta tags para performance
const setupMetaTags = () => {
	// DNS prefetch para recursos externos
	const dnsPrefetches = [
		"https://fonts.googleapis.com",
		"https://fonts.gstatic.com",
		"https://images.unsplash.com",
	];

	dnsPrefetches.forEach((domain) => {
		const link = document.createElement("link");
		link.rel = "dns-prefetch";
		link.href = domain;
		document.head.appendChild(link);
	});

	// Preconnect para recursos críticos
	const preconnects = [process.env.REACT_APP_SUPABASE_URL];

	preconnects.forEach((url) => {
		if (url) {
			const link = document.createElement("link");
			link.rel = "preconnect";
			link.href = url;
			link.crossOrigin = "";
			document.head.appendChild(link);
		}
	});
};

// Service Worker registration otimizada
const registerServiceWorker = () => {
	if ("serviceWorker" in navigator && process.env.NODE_ENV === "production") {
		// Registrar após 3 segundos para não bloquear initial load
		setTimeout(async () => {
			try {
				const registration = await navigator.serviceWorker.register("/sw.js", {
					scope: "/",
				});

				console.log("🔧 ServiceWorker registered successfully");

				// Verificar atualizações
				registration.addEventListener("updatefound", () => {
					const newWorker = registration.installing;
					newWorker.addEventListener("statechange", () => {
						if (
							newWorker.state === "installed" &&
							navigator.serviceWorker.controller
						) {
							console.log("🔄 New content available, refresh to update");
						}
					});
				});
			} catch (error) {
				console.warn("⚠️ ServiceWorker registration failed:", error);
			}
		}, 3000);
	}
};

// Error handling global
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
		event.preventDefault();
	});
};

// Cache preemptivo de recursos
const setupResourceCache = () => {
	// Cache de imagens frequentemente usadas
	const criticalImages = [
		"https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&h=600&fit=crop", // Fallback image
	];

	// Preload de imagens críticas
	setTimeout(() => {
		criticalImages.forEach((src) => {
			const img = new Image();
			img.src = src;
		});
	}, 2000);
};

// RENDERIZAÇÃO IMEDIATA - PRIORIDADE MÁXIMA
const root = ReactDOM.createRoot(document.getElementById("root"));

// Render imediatamente - não esperar nada
root.render(
	<React.StrictMode>
		<BrowserRouter>
			<App />
		</BrowserRouter>
	</React.StrictMode>
);

// Setup de otimizações em background APÓS render
setupMetaTags();
optimizeFonts();
setupPerformanceMonitoring();
setupGlobalErrorHandling();
setupResourceCache();

// Executar preloads após initial render
preloadCriticalServices();
preloadCriticalChunks();
registerServiceWorker();

// Log de performance em desenvolvimento
if (process.env.NODE_ENV === "development") {
	// Monitorar tempo total de inicialização
	setTimeout(() => {
		const totalTime = performance.now() - perfStart;
		console.log(`🎯 Total initialization time: ${totalTime.toFixed(2)}ms`);

		// Verificar Web Vitals
		if ("web-vitals" in window) {
			// Se web-vitals estiver disponível, usar
		} else {
			// Monitoramento básico
			setTimeout(() => {
				const navigation = performance.getEntriesByType("navigation")[0];
				if (navigation) {
					console.log(
						`📊 DOM Content Loaded: ${navigation.domContentLoadedEventEnd.toFixed(
							2
						)}ms`
					);
					console.log(
						`📊 Load Complete: ${navigation.loadEventEnd.toFixed(2)}ms`
					);
				}
			}, 1000);
		}
	}, 1000);
}

// Exportar utilitários para uso em desenvolvimento
if (process.env.NODE_ENV === "development") {
	window.TorqueForgedUtils = {
		clearAllCache: () => {
			localStorage.clear();
			sessionStorage.clear();
			if ("caches" in window) {
				caches.keys().then((names) => {
					names.forEach((name) => caches.delete(name));
				});
			}
			console.log("🗑️ All caches cleared");
		},

		preloadCritical: () => {
			preloadCriticalServices();
			preloadCriticalChunks();
			console.log("🚀 Critical resources preload triggered");
		},

		measurePerformance: () => {
			const navigation = performance.getEntriesByType("navigation")[0];
			const paint = performance.getEntriesByType("paint");

			console.log("📊 Performance Metrics:", {
				navigation: navigation ? `${navigation.duration.toFixed(2)}ms` : "N/A",
				firstPaint:
					paint.find((p) => p.name === "first-paint")?.startTime.toFixed(2) +
						"ms" || "N/A",
				firstContentfulPaint:
					paint
						.find((p) => p.name === "first-contentful-paint")
						?.startTime.toFixed(2) + "ms" || "N/A",
			});
		},
	};
}

// Warm-up automático para primeira visita
if (!localStorage.getItem("tf-visited")) {
	// Primeira visita - setup inicial
	localStorage.setItem("tf-visited", Date.now().toString());

	// Preload extra para primeira visita
	setTimeout(() => {
		preloadCriticalChunks();
	}, 500);
}

console.log("🏁 Torque Forged initialized - Ready for lightning-fast loading!");
