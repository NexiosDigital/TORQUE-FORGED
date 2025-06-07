import React, { Suspense, lazy } from "react";
import { Routes, Route } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { AuthProvider } from "./contexts/AuthContext";
import { OptimizedQueryProvider } from "./providers/QueryClientProvider";
import Layout from "./components/Layout/Layout";
import ProtectedRoute from "./components/ProtectedRoute";
import { ErrorBoundary } from "react-error-boundary";

// Lazy load pages com prefetching inteligente
const Home = lazy(() =>
	import(/* webpackChunkName: "home" */ "./pages/OptimizedHome")
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

// Componente de loading unificado
const PageLoader = ({ page = "página" }) => (
	<div className="min-h-screen bg-black flex items-center justify-center">
		<div className="text-center">
			<div className="w-16 h-16 bg-gradient-to-r from-red-600 to-red-500 rounded-2xl flex items-center justify-center mx-auto mb-4 animate-pulse">
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
			<p className="text-gray-400 text-lg">Carregando {page}...</p>
			<p className="text-gray-500 text-sm mt-1">⚡ Sistema Ultra-Rápido</p>
		</div>
	</div>
);

// Error boundary global
const AppErrorBoundary = ({ error, resetErrorBoundary }) => (
	<div className="min-h-screen bg-black flex items-center justify-center">
		<div className="text-center p-8 max-w-md mx-auto">
			<div className="w-20 h-20 bg-red-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
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
			<h1 className="text-3xl font-bold text-white mb-4">
				Ops! Algo deu errado
			</h1>
			<p className="text-gray-400 mb-6 leading-relaxed">
				Ocorreu um erro inesperado na aplicação. Nossa equipe foi notificada e
				está trabalhando para resolver.
			</p>
			<div className="space-y-3">
				<button
					onClick={resetErrorBoundary}
					className="w-full bg-gradient-to-r from-red-600 to-red-500 hover:from-red-500 hover:to-red-400 text-white px-6 py-3 rounded-xl font-semibold transition-all duration-300 shadow-lg hover:shadow-red-500/25 hover:scale-105"
				>
					Tentar Novamente
				</button>
				<button
					onClick={() => (window.location.href = "/")}
					className="w-full border border-gray-600 hover:border-red-500 text-gray-300 hover:text-white px-6 py-3 rounded-xl font-semibold transition-all duration-300"
				>
					Voltar ao Início
				</button>
			</div>

			{process.env.NODE_ENV === "development" && error && (
				<details className="mt-6 text-left">
					<summary className="text-red-400 cursor-pointer mb-2 text-sm">
						Detalhes do erro (desenvolvimento)
					</summary>
					<pre className="bg-gray-900 p-3 rounded-lg text-xs text-gray-300 overflow-auto max-h-40">
						{error.stack}
					</pre>
				</details>
			)}
		</div>
	</div>
);

function App() {
	return (
		<ErrorBoundary
			FallbackComponent={AppErrorBoundary}
			onError={(error, errorInfo) => {
				console.error("App Error Boundary:", error, errorInfo);

				// Log para serviços de monitoramento em produção
				if (process.env.NODE_ENV === "production") {
					// analytics.track('app_error_boundary', {
					//   error: error.message,
					//   stack: error.stack,
					//   componentStack: errorInfo.componentStack,
					// });
				}
			}}
			onReset={() => {
				// Limpar estados/cache se necessário
				window.location.reload();
			}}
		>
			<AuthProvider>
				<OptimizedQueryProvider>
					<div className="App">
						{/* Toast notifications otimizadas */}
						<Toaster
							position="top-right"
							toastOptions={{
								duration: 4000,
								style: {
									background: "#1f2937",
									color: "#ffffff",
									border: "1px solid #374151",
									borderRadius: "12px",
									fontSize: "14px",
									fontWeight: "500",
									boxShadow:
										"0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)",
								},
								success: {
									style: {
										border: "1px solid #10b981",
										backgroundColor: "#064e3b",
									},
									iconTheme: {
										primary: "#10b981",
										secondary: "#ffffff",
									},
								},
								error: {
									style: {
										border: "1px solid #ef4444",
										backgroundColor: "#7f1d1d",
									},
									iconTheme: {
										primary: "#ef4444",
										secondary: "#ffffff",
									},
								},
								loading: {
									style: {
										border: "1px solid #3b82f6",
										backgroundColor: "#1e3a8a",
									},
								},
							}}
						/>

						<Routes>
							{/* Public Routes com Suspense otimizado */}
							<Route
								path="/"
								element={
									<Layout>
										<Suspense fallback={<PageLoader page="homepage" />}>
											<Home />
										</Suspense>
									</Layout>
								}
							/>

							<Route
								path="/f1"
								element={
									<Layout>
										<Suspense fallback={<PageLoader page="Fórmula 1" />}>
											<Formula1 />
										</Suspense>
									</Layout>
								}
							/>

							<Route
								path="/nascar"
								element={
									<Layout>
										<Suspense fallback={<PageLoader page="NASCAR" />}>
											<NASCAR />
										</Suspense>
									</Layout>
								}
							/>

							<Route
								path="/endurance"
								element={
									<Layout>
										<Suspense fallback={<PageLoader page="Endurance" />}>
											<Endurance />
										</Suspense>
									</Layout>
								}
							/>

							<Route
								path="/drift"
								element={
									<Layout>
										<Suspense fallback={<PageLoader page="Formula Drift" />}>
											<Drift />
										</Suspense>
									</Layout>
								}
							/>

							<Route
								path="/tuning"
								element={
									<Layout>
										<Suspense fallback={<PageLoader page="Tuning" />}>
											<Tuning />
										</Suspense>
									</Layout>
								}
							/>

							<Route
								path="/engines"
								element={
									<Layout>
										<Suspense fallback={<PageLoader page="Motores" />}>
											<Engines />
										</Suspense>
									</Layout>
								}
							/>

							<Route
								path="/about"
								element={
									<Layout>
										<Suspense fallback={<PageLoader page="sobre nós" />}>
											<About />
										</Suspense>
									</Layout>
								}
							/>

							<Route
								path="/contact"
								element={
									<Layout>
										<Suspense fallback={<PageLoader page="contato" />}>
											<Contact />
										</Suspense>
									</Layout>
								}
							/>

							<Route
								path="/post/:id"
								element={
									<Layout>
										<Suspense fallback={<PageLoader page="post" />}>
											<PostDetail />
										</Suspense>
									</Layout>
								}
							/>

							<Route
								path="/category/:category"
								element={
									<Layout>
										<Suspense fallback={<PageLoader page="categoria" />}>
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
											<Suspense fallback={<PageLoader page="perfil" />}>
												<Profile />
											</Suspense>
										</Layout>
									</ProtectedRoute>
								}
							/>

							{/* Admin Routes */}
							<Route
								path="/admin/login"
								element={
									<Suspense fallback={<PageLoader page="login admin" />}>
										<AdminLogin />
									</Suspense>
								}
							/>

							<Route
								path="/admin/dashboard"
								element={
									<ProtectedRoute>
										<Suspense fallback={<PageLoader page="dashboard admin" />}>
											<AdminDashboard />
										</Suspense>
									</ProtectedRoute>
								}
							/>

							<Route
								path="/admin/posts/new"
								element={
									<ProtectedRoute>
										<Suspense fallback={<PageLoader page="editor de post" />}>
											<PostEditor />
										</Suspense>
									</ProtectedRoute>
								}
							/>

							<Route
								path="/admin/posts/edit/:id"
								element={
									<ProtectedRoute>
										<Suspense fallback={<PageLoader page="editor de post" />}>
											<PostEditor />
										</Suspense>
									</ProtectedRoute>
								}
							/>

							{/* 404 Route */}
							<Route
								path="*"
								element={
									<Layout>
										<div className="min-h-screen pt-20 flex items-center justify-center">
											<div className="text-center">
												<div className="w-20 h-20 bg-gradient-to-r from-gray-600 to-gray-500 rounded-2xl flex items-center justify-center mx-auto mb-6">
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
															d="M9.172 16.172a4 4 0 015.656 0M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
														/>
													</svg>
												</div>
												<h1 className="text-4xl font-bold text-white mb-4">
													Página não encontrada
												</h1>
												<p className="text-gray-400 mb-8 max-w-md mx-auto">
													A página que você está procurando não existe ou foi
													removida.
												</p>
												<div className="space-y-3 sm:space-y-0 sm:space-x-4 sm:flex sm:justify-center">
													<button
														onClick={() => window.history.back()}
														className="w-full sm:w-auto border border-gray-600 hover:border-red-500 text-gray-300 hover:text-white px-6 py-3 rounded-xl font-semibold transition-all duration-300"
													>
														Voltar
													</button>
													<button
														onClick={() => (window.location.href = "/")}
														className="w-full sm:w-auto bg-gradient-to-r from-red-600 to-red-500 hover:from-red-500 hover:to-red-400 text-white px-6 py-3 rounded-xl font-semibold transition-all duration-300 shadow-lg hover:shadow-red-500/25 hover:scale-105"
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
				</OptimizedQueryProvider>
			</AuthProvider>
		</ErrorBoundary>
	);
}

export default App;
