import React, { Suspense, lazy, useEffect } from "react";
import { Routes, Route } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { AuthProvider } from "./contexts/AuthContext";
import { ModernQueryProvider, cacheUtils } from "./providers/QueryProvider";
import Layout from "./components/Layout/Layout";
import ProtectedRoute from "./components/ProtectedRoute";
import { ErrorBoundary } from "react-error-boundary";

// Lazy load pages com prefetching ULTRA otimizado
const Home = lazy(() =>
	import(
		/* webpackChunkName: "home", webpackPreload: true */ "./pages/OptimizedHome"
	)
);

const AllPosts = lazy(() =>
	import(/* webpackChunkName: "all-posts" */ "./pages/AllPosts")
);

const Formula1 = lazy(() =>
	import(/* webpackChunkName: "categories" */ "./pages/Formula1")
);

const NASCAR = lazy(() =>
	import(/* webpackChunkName: "categories" */ "./pages/NASCAR")
);

const Endurance = lazy(() =>
	import(/* webpackChunkName: "categories" */ "./pages/Endurance")
);

const Drift = lazy(() =>
	import(/* webpackChunkName: "categories" */ "./pages/Drift")
);

const Tuning = lazy(() =>
	import(/* webpackChunkName: "categories" */ "./pages/Tuning")
);

const Engines = lazy(() =>
	import(/* webpackChunkName: "categories" */ "./pages/Engines")
);

const About = lazy(() =>
	import(/* webpackChunkName: "static" */ "./pages/About")
);

const Contact = lazy(() =>
	import(/* webpackChunkName: "static" */ "./pages/Contact")
);

const PostDetail = lazy(() =>
	import(/* webpackChunkName: "post-detail" */ "./pages/OptimizedPostDetail")
);

const Category = lazy(() =>
	import(/* webpackChunkName: "categories" */ "./pages/Category")
);

const Profile = lazy(() =>
	import(/* webpackChunkName: "user" */ "./pages/Profile")
);

const AdminLogin = lazy(() =>
	import(/* webpackChunkName: "admin" */ "./pages/Admin/Login")
);

const AdminDashboard = lazy(() =>
	import(/* webpackChunkName: "admin" */ "./pages/Admin/Dashboard")
);

const PostEditor = lazy(() =>
	import(/* webpackChunkName: "admin" */ "./pages/Admin/PostEditor")
);

// Componente de loading ULTRA RÁPIDO
const UltraFastLoader = ({ page = "página" }) => (
	<div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-black flex items-center justify-center">
		<div className="text-center">
			{/* Logo animado minimalista */}
			<div className="relative mb-8">
				<div className="w-20 h-20 bg-gradient-to-r from-red-600 to-red-500 rounded-2xl flex items-center justify-center mx-auto shadow-2xl">
					<div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
				</div>
				<div className="absolute inset-0 w-20 h-20 bg-gradient-to-r from-red-600 to-red-500 rounded-2xl mx-auto animate-ping opacity-20"></div>
			</div>

			{/* Texto minimalista */}
			<h2 className="text-2xl font-bold text-white mb-2">Carregando {page}</h2>
			<p className="text-gray-400 mb-4">Sistema ultrarrápido carregando...</p>

			{/* Barra de progresso animada */}
			<div className="w-64 h-2 bg-gray-800 rounded-full mx-auto overflow-hidden">
				<div className="h-full bg-gradient-to-r from-red-600 to-red-500 rounded-full animate-pulse"></div>
			</div>
		</div>
	</div>
);

// Error boundary OTIMIZADO
const AppErrorBoundary = ({ error, resetErrorBoundary }) => (
	<div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-black flex items-center justify-center">
		<div className="text-center p-8 max-w-lg mx-auto">
			{/* Ícone de erro */}
			<div className="w-24 h-24 bg-gradient-to-r from-red-600 to-red-500 rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-2xl">
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
						d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
					/>
				</svg>
			</div>

			{/* Título e descrição */}
			<h1 className="text-4xl font-black text-white mb-4">
				Ops! Algo deu errado
			</h1>
			<p className="text-gray-400 mb-8 leading-relaxed text-lg">
				Ocorreu um erro inesperado na aplicação. Nossa equipe foi notificada e
				está trabalhando para resolver.
			</p>

			{/* Ações */}
			<div className="space-y-4">
				<button
					onClick={resetErrorBoundary}
					className="w-full bg-gradient-to-r from-red-600 to-red-500 hover:from-red-500 hover:to-red-400 text-white px-8 py-4 rounded-2xl font-bold text-lg transition-all duration-300 shadow-xl hover:shadow-red-500/25 hover:scale-105"
				>
					Tentar Novamente
				</button>

				<button
					onClick={() => (window.location.href = "/")}
					className="w-full border-2 border-gray-600 hover:border-red-500 text-gray-300 hover:text-white px-8 py-4 rounded-2xl font-bold text-lg transition-all duration-300"
				>
					Voltar ao Início
				</button>
			</div>
		</div>
	</div>
);

// Preloader de dados críticos
const CriticalDataPreloader = () => {
	useEffect(() => {
		// Preload IMEDIATO de dados críticos em background
		const preloadCritical = async () => {
			try {
				// Importar serviços dinamicamente para não bloquear initial load
				const [{ dataAPIService }] = await Promise.all([
					import("./services/DataAPIService"),
				]);

				// Preload silencioso em background
				setTimeout(async () => {
					await Promise.allSettled([
						dataAPIService.getFeaturedPosts(),
						dataAPIService.getAllPosts(),
						dataAPIService.getCategories(),
					]);
					console.log("🚀 Critical data preloaded in background");
				}, 100);
			} catch (error) {
				console.warn("⚠️ Background preload failed:", error);
			}
		};

		preloadCritical();
	}, []);

	return null;
};

// Service Worker registration para cache persistente
const ServiceWorkerLoader = () => {
	useEffect(() => {
		if ("serviceWorker" in navigator && process.env.NODE_ENV === "production") {
			setTimeout(() => {
				navigator.serviceWorker
					.register("/sw.js")
					.then(() => console.log("🔧 ServiceWorker registered"))
					.catch((error) => console.warn("⚠️ ServiceWorker failed:", error));
			}, 2000);
		}
	}, []);

	return null;
};

// Componente principal da aplicação ULTRA OTIMIZADO
function App() {
	// Preload de cache crítico no app startup
	useEffect(() => {
		// Preload automático do cache após 50ms
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
				// Limpar cache em caso de erro crítico
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

						{/* Toast notifications OTIMIZADAS */}
						<Toaster
							position="top-right"
							gutter={8}
							toastOptions={{
								duration: 3000, // Reduzido para 3s
								style: {
									background:
										"linear-gradient(135deg, #1f2937 0%, #111827 100%)",
									color: "#ffffff",
									border: "1px solid #374151",
									borderRadius: "16px",
									fontSize: "14px",
									fontWeight: "500",
									boxShadow:
										"0 25px 50px -12px rgba(0, 0, 0, 0.25), 0 0 0 1px rgba(255, 255, 255, 0.05)",
									backdropFilter: "blur(8px)",
								},
								success: {
									style: {
										border: "1px solid #10b981",
										background:
											"linear-gradient(135deg, #064e3b 0%, #022c22 100%)",
									},
									iconTheme: {
										primary: "#10b981",
										secondary: "#ffffff",
									},
								},
								error: {
									style: {
										border: "1px solid #ef4444",
										background:
											"linear-gradient(135deg, #7f1d1d 0%, #450a0a 100%)",
									},
									iconTheme: {
										primary: "#ef4444",
										secondary: "#ffffff",
									},
								},
								loading: {
									style: {
										border: "1px solid #3b82f6",
										background:
											"linear-gradient(135deg, #1e3a8a 0%, #0f172a 100%)",
									},
									iconTheme: {
										primary: "#3b82f6",
										secondary: "#ffffff",
									},
								},
							}}
						/>

						{/* Rotas da aplicação OTIMIZADAS */}
						<Routes>
							{/* Public Routes - PRIORIDADE MÁXIMA */}
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

							{/* Posts route - SEGUNDA PRIORIDADE */}
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

							{/* Category routes - ALTA PRIORIDADE */}
							<Route
								path="/f1"
								element={
									<Layout>
										<Suspense fallback={<UltraFastLoader page="Fórmula 1" />}>
											<Formula1 />
										</Suspense>
									</Layout>
								}
							/>

							<Route
								path="/nascar"
								element={
									<Layout>
										<Suspense fallback={<UltraFastLoader page="NASCAR" />}>
											<NASCAR />
										</Suspense>
									</Layout>
								}
							/>

							<Route
								path="/endurance"
								element={
									<Layout>
										<Suspense fallback={<UltraFastLoader page="Endurance" />}>
											<Endurance />
										</Suspense>
									</Layout>
								}
							/>

							<Route
								path="/drift"
								element={
									<Layout>
										<Suspense
											fallback={<UltraFastLoader page="Formula Drift" />}
										>
											<Drift />
										</Suspense>
									</Layout>
								}
							/>

							<Route
								path="/tuning"
								element={
									<Layout>
										<Suspense fallback={<UltraFastLoader page="Tuning" />}>
											<Tuning />
										</Suspense>
									</Layout>
								}
							/>

							<Route
								path="/engines"
								element={
									<Layout>
										<Suspense fallback={<UltraFastLoader page="Motores" />}>
											<Engines />
										</Suspense>
									</Layout>
								}
							/>

							{/* Static pages */}
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

							{/* Post detail - ALTA PRIORIDADE */}
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

							{/* Protected User Routes */}
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

							{/* Admin Routes */}
							<Route
								path="/login"
								element={
									<Suspense fallback={<UltraFastLoader page="login admin" />}>
										<AdminLogin />
									</Suspense>
								}
							/>

							<Route
								path="/admin/dashboard"
								element={
									<ProtectedRoute>
										<Suspense
											fallback={<UltraFastLoader page="dashboard admin" />}
										>
											<AdminDashboard />
										</Suspense>
									</ProtectedRoute>
								}
							/>

							<Route
								path="/admin/posts/new"
								element={
									<ProtectedRoute>
										<Suspense
											fallback={<UltraFastLoader page="editor de post" />}
										>
											<PostEditor />
										</Suspense>
									</ProtectedRoute>
								}
							/>

							<Route
								path="/admin/posts/edit/:id"
								element={
									<ProtectedRoute>
										<Suspense
											fallback={<UltraFastLoader page="editor de post" />}
										>
											<PostEditor />
										</Suspense>
									</ProtectedRoute>
								}
							/>

							{/* 404 Route OTIMIZADA */}
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

export default App;
