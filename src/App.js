// =====================================================
// CONFIGURAÇÃO DE ROTAS HIERÁRQUICAS - App.js CORRIGIDO
// =====================================================

import React, { Suspense, lazy, useEffect, useMemo } from "react";
import { Routes, Route } from "react-router-dom";
import { ErrorBoundary } from "react-error-boundary";

// Imports dos componentes principais
import Layout from "./components/Layout/Layout";
import ProtectedRoute from "./components/ProtectedRoute";
import AuthProvider from "./contexts/AuthContext";
import { ModernQueryProvider, cacheUtils } from "./providers/QueryProvider";
import { useCategories } from "./hooks/usePostsQuery";

// Lazy imports para otimização
const Home = lazy(() =>
	import(/* webpackChunkName: "home" */ "./pages/OptimizedHome")
);
const AllPosts = lazy(() =>
	import(/* webpackChunkName: "all-posts" */ "./pages/AllPosts")
);
const PostDetail = lazy(() =>
	import(/* webpackChunkName: "post-detail" */ "./pages/OptimizedPostDetail")
);
const Category = lazy(() =>
	import(/* webpackChunkName: "category" */ "./pages/Category")
);
const About = lazy(() =>
	import(/* webpackChunkName: "about" */ "./pages/About")
);
const Contact = lazy(() =>
	import(/* webpackChunkName: "contact" */ "./pages/Contact")
);
const Profile = lazy(() =>
	import(/* webpackChunkName: "profile" */ "./pages/Profile")
);
const AdminLogin = lazy(() =>
	import(/* webpackChunkName: "admin-login" */ "./pages/Admin/Login")
);
const AdminDashboard = lazy(() =>
	import(/* webpackChunkName: "admin-dashboard" */ "./pages/Admin/Dashboard")
);
const PostEditor = lazy(() =>
	import(/* webpackChunkName: "post-editor" */ "./pages/Admin/PostEditor")
);
const CategoryManager = lazy(() =>
	import(
		/* webpackChunkName: "admin-categories" */ "./pages/Admin/CategoryManager"
	)
);
const CategoryEditor = lazy(() =>
	import(
		/* webpackChunkName: "admin-categories" */ "./pages/Admin/CategoryEditor"
	)
);

// Componente de Loading Ultra-Rápido
const UltraFastLoader = ({ page }) => (
	<div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-black flex items-center justify-center">
		<div className="text-center">
			<div className="relative mb-8">
				<div className="w-16 h-16 bg-gradient-to-r from-red-600 to-red-500 rounded-2xl flex items-center justify-center mx-auto shadow-2xl">
					<svg
						className="w-8 h-8 text-white animate-spin"
						fill="none"
						stroke="currentColor"
						viewBox="0 0 24 24"
					>
						<path
							strokeLinecap="round"
							strokeLinejoin="round"
							strokeWidth={2}
							d="M12 2v4m0 0l2.5-2.5M12 6l-2.5-2.5M18 12h-4m0 0l2.5 2.5M14 12l2.5-2.5M12 18v-4m0 0l-2.5 2.5M12 14l2.5 2.5M6 12h4m0 0L7.5 9.5M10 12L7.5 14.5"
						/>
					</svg>
				</div>
				<div className="absolute inset-0 w-16 h-16 bg-gradient-to-r from-red-600 to-red-500 rounded-2xl mx-auto animate-ping opacity-20"></div>
			</div>
			<h2 className="text-xl font-bold text-white mb-2">Carregando {page}</h2>
			<p className="text-gray-400">Aguarde um momento...</p>
		</div>
	</div>
);

// Componente de Error Boundary para a aplicação
const AppErrorBoundary = ({ error, resetErrorBoundary }) => (
	<div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-black flex items-center justify-center">
		<div className="text-center p-8 max-w-md mx-auto">
			<div className="w-20 h-20 bg-gradient-to-r from-red-600 to-red-500 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-2xl">
				<svg
					className="w-10 h-10 text-white"
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
			<h1 className="text-3xl font-black text-white mb-4">
				Oops! Algo deu errado
			</h1>
			<p className="text-gray-400 mb-8">
				Ocorreu um erro inesperado na aplicação.
			</p>
			<div className="space-y-4">
				<button
					onClick={resetErrorBoundary}
					className="w-full bg-gradient-to-r from-red-600 to-red-500 hover:from-red-500 hover:to-red-400 text-white px-6 py-3 rounded-2xl font-bold transition-all duration-300 shadow-xl hover:shadow-red-500/25 hover:scale-105"
				>
					Tentar Novamente
				</button>
				<button
					onClick={() => (window.location.href = "/")}
					className="w-full border-2 border-gray-600 hover:border-red-500 text-gray-300 hover:text-white px-6 py-3 rounded-2xl font-bold transition-all duration-300"
				>
					Ir para Home
				</button>
			</div>
		</div>
	</div>
);

// Componente para preload de dados críticos
const CriticalDataPreloader = () => {
	useEffect(() => {
		const timer = setTimeout(() => {
			cacheUtils.preloadCritical();
		}, 50);
		return () => clearTimeout(timer);
	}, []);

	return null;
};

// Componente para carregar Service Worker
const ServiceWorkerLoader = () => {
	useEffect(() => {
		if ("serviceWorker" in navigator && process.env.NODE_ENV === "production") {
			const timer = setTimeout(async () => {
				try {
					await navigator.serviceWorker.register("/sw.js");
				} catch (error) {
					console.warn("ServiceWorker registration failed:", error);
				}
			}, 3000);
			return () => clearTimeout(timer);
		}
	}, []);

	return null;
};

// Configuração do Toaster
const toasterConfig = {
	position: "top-right",
	toastOptions: {
		duration: 4000,
		style: {
			background: "rgb(31 41 55)",
			color: "rgb(243 244 246)",
			border: "1px solid rgb(75 85 99)",
		},
		success: {
			iconTheme: {
				primary: "rgb(34 197 94)",
				secondary: "rgb(31 41 55)",
			},
		},
		error: {
			iconTheme: {
				primary: "rgb(239 68 68)",
				secondary: "rgb(31 41 55)",
			},
		},
	},
};

// Componente de rota dinâmica hierárquica
const HierarchicalRoute = ({ categoryData }) => {
	return (
		<Route
			key={categoryData.id}
			path={`/${categoryData.slug}`}
			element={
				<Layout>
					<Suspense fallback={<UltraFastLoader page={categoryData.name} />}>
						<Category />
					</Suspense>
				</Layout>
			}
		/>
	);
};

// Gerador de rotas baseado na hierarquia do banco
const HierarchicalRouteGenerator = () => {
	const { data: categories = [], isLoading } = useCategories();

	if (isLoading) {
		return null; // Rotas serão criadas quando dados carregarem
	}

	// Gerar rotas para todas as categorias de todos os níveis
	return categories.map((category) => (
		<HierarchicalRoute key={category.id} categoryData={category} />
	));
};

// Componente principal da aplicação
function App() {
	// Preload de cache crítico no app startup
	useEffect(() => {
		const timer = setTimeout(() => {
			cacheUtils.preloadCritical();
		}, 50);
		return () => clearTimeout(timer);
	}, []);

	return (
		<ErrorBoundary
			FallbackComponent={AppErrorBoundary}
			onError={(error, errorInfo) => {
				console.error("🔴 App Error Boundary:", error, errorInfo);
			}}
			onReset={() => {
				cacheUtils.clear();
				window.location.reload();
			}}
		>
			<AuthProvider>
				<ModernQueryProvider>
					<div className="App">
						{/* Preloaders em background */}
						<CriticalDataPreloader />
						<ServiceWorkerLoader />

						{/* Sistema de rotas HIERÁRQUICO */}
						<Routes>
							{/* ===== ROTAS PRINCIPAIS ===== */}
							<Route
								path="/"
								element={
									<Layout>
										<Suspense fallback={<UltraFastLoader page="homepage" />}>
											<Home />
										</Suspense>
									</Layout>
								}
							/>

							<Route
								path="/posts"
								element={
									<Layout>
										<Suspense
											fallback={<UltraFastLoader page="todos os posts" />}
										>
											<AllPosts />
										</Suspense>
									</Layout>
								}
							/>

							<Route
								path="/post/:id"
								element={
									<Layout>
										<Suspense fallback={<UltraFastLoader page="post" />}>
											<PostDetail />
										</Suspense>
									</Layout>
								}
							/>

							{/* ===== ROTA GENÉRICA PARA CATEGORIAS ===== */}
							<Route
								path="/category/:category"
								element={
									<Layout>
										<Suspense fallback={<UltraFastLoader page="categoria" />}>
											<Category />
										</Suspense>
									</Layout>
								}
							/>

							{/* ===== PÁGINAS ESTÁTICAS ===== */}
							<Route
								path="/about"
								element={
									<Layout>
										<Suspense fallback={<UltraFastLoader page="sobre nós" />}>
											<About />
										</Suspense>
									</Layout>
								}
							/>

							<Route
								path="/contact"
								element={
									<Layout>
										<Suspense fallback={<UltraFastLoader page="contato" />}>
											<Contact />
										</Suspense>
									</Layout>
								}
							/>

							{/* ===== ROTAS HIERÁRQUICAS DINÂMICAS ===== */}
							<HierarchicalRouteGenerator />

							{/* ===== ROTAS DE USUÁRIO ===== */}
							<Route
								path="/profile"
								element={
									<ProtectedRoute>
										<Layout>
											<Suspense fallback={<UltraFastLoader page="perfil" />}>
												<Profile />
											</Suspense>
										</Layout>
									</ProtectedRoute>
								}
							/>

							{/* ===== ROTAS DE AUTENTICAÇÃO ===== */}
							<Route
								path="/login"
								element={
									<Suspense fallback={<UltraFastLoader page="login admin" />}>
										<AdminLogin />
									</Suspense>
								}
							/>

							{/* ===== ROTAS DE ADMIN ===== */}
							<Route
								path="/admin/dashboard"
								element={
									<ProtectedRoute requireAdmin={true}>
										<Layout>
											<Suspense
												fallback={<UltraFastLoader page="dashboard admin" />}
											>
												<AdminDashboard />
											</Suspense>
										</Layout>
									</ProtectedRoute>
								}
							/>

							<Route
								path="/admin/posts/new"
								element={
									<ProtectedRoute requireAdmin={true}>
										<Layout>
											<Suspense
												fallback={<UltraFastLoader page="editor de post" />}
											>
												<PostEditor />
											</Suspense>
										</Layout>
									</ProtectedRoute>
								}
							/>

							<Route
								path="/admin/posts/edit/:id"
								element={
									<ProtectedRoute requireAdmin={true}>
										<Layout>
											<Suspense
												fallback={<UltraFastLoader page="editor de post" />}
											>
												<PostEditor />
											</Suspense>
										</Layout>
									</ProtectedRoute>
								}
							/>

							{/* ===== ROTAS DE CATEGORIAS ADMIN ===== */}
							<Route
								path="/admin/categories"
								element={
									<ProtectedRoute requireAdmin={true}>
										<Layout>
											<Suspense
												fallback={
													<UltraFastLoader page="gerenciar categorias" />
												}
											>
												<CategoryManager />
											</Suspense>
										</Layout>
									</ProtectedRoute>
								}
							/>

							<Route
								path="/admin/categories/new"
								element={
									<ProtectedRoute requireAdmin={true}>
										<Layout>
											<Suspense
												fallback={<UltraFastLoader page="nova categoria" />}
											>
												<CategoryEditor />
											</Suspense>
										</Layout>
									</ProtectedRoute>
								}
							/>

							<Route
								path="/admin/categories/edit/:id"
								element={
									<ProtectedRoute requireAdmin={true}>
										<Layout>
											<Suspense
												fallback={<UltraFastLoader page="editar categoria" />}
											>
												<CategoryEditor />
											</Suspense>
										</Layout>
									</ProtectedRoute>
								}
							/>

							{/* ===== 404 ROUTE ===== */}
							<Route
								path="*"
								element={
									<Layout>
										<div className="min-h-screen pt-20 flex items-center justify-center">
											<div className="text-center p-8 max-w-md mx-auto">
												<div className="w-24 h-24 bg-gradient-to-r from-gray-600 to-gray-500 rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-2xl">
													<svg
														className="w-12 h-12 text-white"
														fill="none"
														stroke="currentColor"
														viewBox="0 0 24 24"
													>
														<path
															strokeLinecap="round"
															strokeLinejoin="round"
															strokeWidth={2}
															d="M9.172 16.172a4 4 0 015.656 0M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
														/>
													</svg>
												</div>
												<h1 className="text-4xl font-black text-white mb-4">
													Página não encontrada
												</h1>
												<p className="text-gray-400 mb-8 leading-relaxed">
													A página que você está procurando não existe ou foi
													removida.
												</p>
												<div className="space-y-4">
													<button
														onClick={() => window.history.back()}
														className="w-full border-2 border-gray-600 hover:border-red-500 text-gray-300 hover:text-white px-6 py-3 rounded-2xl font-bold transition-all duration-300"
													>
														Voltar
													</button>
													<button
														onClick={() => (window.location.href = "/")}
														className="w-full bg-gradient-to-r from-red-600 to-red-500 hover:from-red-500 hover:to-red-400 text-white px-6 py-3 rounded-2xl font-bold transition-all duration-300 shadow-xl hover:shadow-red-500/25 hover:scale-105"
													>
														Ir para Home
													</button>
												</div>
											</div>
										</div>
									</Layout>
								}
							/>
						</Routes>
					</div>
				</ModernQueryProvider>
			</AuthProvider>
		</ErrorBoundary>
	);
}

// =====================================================
// HELPERS PARA MIGRAÇÃO GRADUAL
// =====================================================

// Hook para verificar se uma rota existe na hierarquia
export const useRouteExists = (slug) => {
	const { data: categories = [] } = useCategories();

	return useMemo(() => {
		return categories.some((cat) => cat.slug === slug);
	}, [categories, slug]);
};

// Componente para redirects de URLs antigas
const LegacyRouteRedirect = ({ from, to }) => {
	useEffect(() => {
		const currentPath = window.location.pathname;
		if (currentPath === from) {
			window.history.replaceState(null, null, to);
		}
	}, [from, to]);

	return null;
};

// =====================================================
// CONFIGURAÇÃO DE REDIRECTS PARA MANTER COMPATIBILIDADE
// =====================================================

// Adicionar no App.js se necessário manter URLs antigas
const LegacyRedirects = () => (
	<>
		{/* Exemplos de redirects se URLs mudarem */}
		<LegacyRouteRedirect from="/formula-1" to="/f1" />
		<LegacyRouteRedirect from="/motores" to="/engines" />
		<LegacyRouteRedirect from="/tecnologia/motors" to="/tecnologia/motores" />
		{/* Adicionar mais redirects conforme necessário */}
	</>
);

// =====================================================
// METADATA MANAGER PARA SEO HIERÁRQUICO
// =====================================================

const CategoryMetadataManager = () => {
	const { data: categories = [] } = useCategories();

	useEffect(() => {
		// Preload metadata para categorias principais
		categories
			.filter((cat) => cat.level === 1)
			.forEach((category) => {
				// Preload crítico de SEO data
				if (category.meta_title) {
					const link = document.createElement("link");
					link.rel = "prefetch";
					link.href = `/${category.slug}`;
					document.head.appendChild(link);
				}
			});
	}, [categories]);

	return null;
};

// =====================================================
// SITEMAP GENERATOR AUTOMÁTICO
// =====================================================

const SitemapManager = () => {
	const { data: categories = [] } = useCategories();

	useEffect(() => {
		// Gerar sitemap dinâmico para todas as categorias
		const generateSitemap = () => {
			const urls = categories.map((cat) => ({
				url: `/${cat.slug}`,
				lastmod: cat.updated_at,
				priority: cat.level === 1 ? "0.9" : cat.level === 2 ? "0.7" : "0.5",
				changefreq: cat.level === 1 ? "weekly" : "monthly",
			}));

			// Enviar para API de sitemap se necessário
			if (process.env.NODE_ENV === "production") {
				console.log("📄 Sitemap gerado com", urls.length, "URLs");
			}
		};

		if (categories.length > 0) {
			generateSitemap();
		}
	}, [categories]);

	return null;
};

export default App;
