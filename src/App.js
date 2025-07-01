import React, { Suspense, lazy } from "react";
import { Routes, Route } from "react-router-dom";
import { ErrorBoundary } from "react-error-boundary";

// Imports dos componentes principais
import Layout from "./components/Layout/Layout";
import ProtectedRoute from "./components/ProtectedRoute";
import { AuthProvider } from "./contexts/AuthContext";
import { ModernQueryProvider } from "./providers/QueryProvider";
import FlexiblePage from "./components/FlexiblePage";

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

// Componente de Loading simplificado
const SimpleLoader = ({ page }) => (
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
		</div>
	</div>
);

// Error Boundary simplificado
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

// Debug helper
if (process.env.NODE_ENV === "development") {
	// Disponibilizar comandos de debug globalmente
	import("./utils/debugCategories").catch(() => {
		console.log("⚠️ Debug categories não encontrado");
	});
}

// Componente principal da aplicação
function App() {
	return (
		<ErrorBoundary
			FallbackComponent={AppErrorBoundary}
			onError={(error, errorInfo) => {
				console.error("🔴 App Error Boundary:", error, errorInfo);
			}}
			onReset={() => {
				// Limpar cache em caso de erro
				try {
					if (window.queryClient) {
						window.queryClient.clear();
					}
					localStorage.removeItem("tf-cache-categories-db");
				} catch (e) {
					// Ignore
				}
				window.location.reload();
			}}
		>
			<AuthProvider>
				<ModernQueryProvider>
					<div className="App">
						{/* Sistema de rotas CORRIGIDO */}
						<Routes>
							{/* ===== ROTAS PRINCIPAIS ===== */}
							<Route
								path="/"
								element={
									<Layout>
										<Suspense fallback={<SimpleLoader page="homepage" />}>
											<Home />
										</Suspense>
									</Layout>
								}
							/>

							<Route
								path="/posts"
								element={
									<Layout>
										<Suspense fallback={<SimpleLoader page="todos os posts" />}>
											<AllPosts />
										</Suspense>
									</Layout>
								}
							/>

							<Route
								path="/post/:id"
								element={
									<Layout>
										<Suspense fallback={<SimpleLoader page="post" />}>
											<PostDetail />
										</Suspense>
									</Layout>
								}
							/>

							{/* ===== PÁGINAS ESTÁTICAS ===== */}
							<Route
								path="/about"
								element={
									<Layout>
										<Suspense fallback={<SimpleLoader page="sobre nós" />}>
											<About />
										</Suspense>
									</Layout>
								}
							/>

							<Route
								path="/contact"
								element={
									<Layout>
										<Suspense fallback={<SimpleLoader page="contato" />}>
											<Contact />
										</Suspense>
									</Layout>
								}
							/>

							{/* ===== ROTAS DE USUÁRIO ===== */}
							<Route
								path="/profile"
								element={
									<ProtectedRoute>
										<Layout>
											<Suspense fallback={<SimpleLoader page="perfil" />}>
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
									<Suspense fallback={<SimpleLoader page="login admin" />}>
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
												fallback={<SimpleLoader page="dashboard admin" />}
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
												fallback={<SimpleLoader page="editor de post" />}
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
												fallback={<SimpleLoader page="editor de post" />}
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
												fallback={<SimpleLoader page="gerenciar categorias" />}
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
												fallback={<SimpleLoader page="nova categoria" />}
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
												fallback={<SimpleLoader page="editar categoria" />}
											>
												<CategoryEditor />
											</Suspense>
										</Layout>
									</ProtectedRoute>
								}
							/>

							{/* ===== ROTA GENÉRICA PARA CATEGORIAS (CORRIGIDA) ===== */}
							<Route
								path="/:categorySlug"
								element={
									<Layout>
										<Suspense fallback={<SimpleLoader page="categoria" />}>
											<FlexiblePage />
										</Suspense>
									</Layout>
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

												{/* Debug info em desenvolvimento */}
												{process.env.NODE_ENV === "development" && (
													<div className="mt-8 p-4 bg-gray-900/50 rounded-lg text-left">
														<h3 className="text-white font-bold mb-2">
															Debug Info:
														</h3>
														<p className="text-xs text-gray-400">
															URL: {window.location.pathname}
														</p>
														<p className="text-xs text-gray-400">
															Para testar categorias, abra o console e use:
														</p>
														<code className="text-xs text-green-400 block mt-2">
															await debugCategories.diagnosis()
														</code>
													</div>
												)}
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
