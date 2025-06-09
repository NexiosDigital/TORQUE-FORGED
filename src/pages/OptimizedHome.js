import React, { useMemo } from "react";
import { Link } from "react-router-dom";
import {
	ChevronRight,
	TrendingUp,
	ArrowRight,
	Calendar,
	User,
	Clock,
	Youtube,
	Instagram,
	Zap,
	Settings,
	AlertCircle,
	Bug,
} from "lucide-react";
import {
	useFeaturedPosts,
	useAllPosts,
	useCategories,
	usePrefetch,
	useAutoDebug,
	useCacheUtils,
} from "../hooks/usePostsQuery";
import { ErrorBoundary } from "react-error-boundary";

/**
 * OptimizedHome com Debug Automático
 * - Debug automático em desenvolvimento
 * - Logs detalhados no console
 * - Botão de debug manual
 * - Cliente público forçado
 */

// Debug Panel para desenvolvimento
const DebugPanel = () => {
	const { data: debugData } = useAutoDebug();
	const { debugConnection, getCacheStats, forceRefreshAll, clearCache } =
		useCacheUtils();
	const [showPanel, setShowPanel] = React.useState(false);

	if (process.env.NODE_ENV !== "development") return null;

	return (
		<div className="fixed bottom-4 right-4 z-50">
			<button
				onClick={() => setShowPanel(!showPanel)}
				className="bg-yellow-600 hover:bg-yellow-500 text-white p-3 rounded-full shadow-xl transition-all duration-300"
				title="Debug Panel"
			>
				<Bug className="w-5 h-5" />
			</button>

			{showPanel && (
				<div className="absolute bottom-16 right-0 w-80 bg-gray-900 border border-gray-700 rounded-2xl p-4 shadow-2xl">
					<h3 className="text-white font-bold mb-3 flex items-center space-x-2">
						<Bug className="w-4 h-4" />
						<span>Debug Panel</span>
					</h3>

					<div className="space-y-3 text-sm">
						{/* Status atual */}
						{debugData && (
							<div className="bg-gray-800 p-3 rounded-lg">
								<p className="text-gray-300 mb-2">
									<strong>Auth:</strong>{" "}
									{debugData.authentication?.isLoggedIn
										? "Logado"
										: "Não logado"}
								</p>
								<p className="text-gray-300 mb-2">
									<strong>Posts Públicos:</strong>{" "}
									{debugData.database?.public?.count || 0}
								</p>
								<p className="text-gray-300">
									<strong>Posts Admin:</strong>{" "}
									{debugData.database?.admin?.count || 0}
								</p>
							</div>
						)}

						{/* Botões de ação */}
						<div className="grid grid-cols-2 gap-2">
							<button
								onClick={debugConnection}
								className="bg-blue-600 hover:bg-blue-500 text-white px-3 py-2 rounded text-xs font-semibold"
							>
								Debug
							</button>
							<button
								onClick={getCacheStats}
								className="bg-green-600 hover:bg-green-500 text-white px-3 py-2 rounded text-xs font-semibold"
							>
								Cache
							</button>
							<button
								onClick={forceRefreshAll}
								className="bg-orange-600 hover:bg-orange-500 text-white px-3 py-2 rounded text-xs font-semibold"
							>
								Refresh
							</button>
							<button
								onClick={clearCache}
								className="bg-red-600 hover:bg-red-500 text-white px-3 py-2 rounded text-xs font-semibold"
							>
								Clear
							</button>
						</div>

						{/* Instruções */}
						<div className="bg-yellow-900/30 p-2 rounded text-xs text-yellow-300">
							<p>📊 Verifique o console para logs detalhados</p>
						</div>
					</div>
				</div>
			)}
		</div>
	);
};

// Loading skeletons modernos
const FeaturedPostsSkeleton = () => (
	<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
		{Array.from({ length: 3 }).map((_, i) => (
			<div key={i} className="animate-pulse">
				<div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-3xl overflow-hidden border border-gray-700/50">
					<div className="h-56 bg-gradient-to-br from-gray-700 to-gray-800"></div>
					<div className="p-8">
						<div className="h-4 bg-gray-700 rounded-full mb-3 w-24"></div>
						<div className="h-6 bg-gray-700 rounded-full mb-2"></div>
						<div className="h-6 bg-gray-700 rounded-full w-3/4 mb-4"></div>
						<div className="space-y-2">
							<div className="h-3 bg-gray-700 rounded-full"></div>
							<div className="h-3 bg-gray-700 rounded-full w-2/3"></div>
						</div>
						<div className="mt-4 pt-4 border-t border-gray-700">
							<div className="h-3 bg-gray-700 rounded-full w-1/2"></div>
						</div>
					</div>
				</div>
			</div>
		))}
	</div>
);

const PostListSkeleton = () => (
	<div className="space-y-8">
		{Array.from({ length: 4 }).map((_, i) => (
			<div key={i} className="animate-pulse">
				<div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-3xl p-8 flex gap-8 border border-gray-700/50">
					<div className="w-64 h-48 bg-gradient-to-br from-gray-700 to-gray-800 rounded-2xl flex-shrink-0"></div>
					<div className="flex-1 space-y-4">
						<div className="h-4 bg-gray-700 rounded-full w-24"></div>
						<div className="h-8 bg-gray-700 rounded-full"></div>
						<div className="space-y-2">
							<div className="h-4 bg-gray-700 rounded-full"></div>
							<div className="h-4 bg-gray-700 rounded-full w-3/4"></div>
						</div>
						<div className="pt-4">
							<div className="h-3 bg-gray-700 rounded-full w-1/3"></div>
						</div>
					</div>
				</div>
			</div>
		))}
	</div>
);

// Error fallbacks específicos com debug
const ErrorFallback = ({ error, resetErrorBoundary, section }) => (
	<div className="text-center py-16">
		<div className="w-20 h-20 bg-gradient-to-r from-red-600 to-red-500 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-2xl">
			<AlertCircle className="w-10 h-10 text-white" />
		</div>
		<h3 className="text-2xl font-bold text-white mb-4">
			Erro ao carregar {section}
		</h3>
		<p className="text-gray-400 mb-2">
			{error?.message || "Algo deu errado ao carregar os dados"}
		</p>
		<p className="text-gray-500 text-sm mb-8">
			Verifique o console para mais detalhes
		</p>

		{/* Debug info em desenvolvimento */}
		{process.env.NODE_ENV === "development" && (
			<div className="bg-gray-900/50 rounded-xl p-4 mb-6 text-left max-w-md mx-auto">
				<h4 className="text-yellow-400 font-bold mb-2">Debug Info:</h4>
				<p className="text-xs text-gray-300 font-mono break-all">
					Error: {error?.message}
				</p>
				<p className="text-xs text-gray-400 mt-2">Section: {section}</p>
			</div>
		)}

		<div className="space-y-4">
			<button
				onClick={resetErrorBoundary}
				className="bg-gradient-to-r from-red-600 to-red-500 hover:from-red-500 hover:to-red-400 text-white px-8 py-3 rounded-2xl font-bold transition-all duration-300 shadow-xl hover:shadow-red-500/25 hover:scale-105"
			>
				Tentar Novamente
			</button>
			<button
				onClick={() => window.location.reload()}
				className="block mx-auto border-2 border-gray-600 hover:border-red-500 text-gray-300 hover:text-white px-6 py-2 rounded-xl font-semibold transition-all duration-300"
			>
				Recarregar Página
			</button>
		</div>
	</div>
);

// Componente Hero memoizado
const HeroSection = React.memo(() => {
	const { prefetchCategory } = usePrefetch();

	return (
		<div className="relative min-h-screen flex items-center justify-center overflow-hidden">
			{/* Background gradients */}
			<div className="absolute inset-0 bg-gradient-to-br from-black via-gray-900 to-black"></div>
			<div className="absolute inset-0 bg-gradient-to-r from-red-900/20 via-transparent to-red-900/20"></div>

			{/* Floating elements */}
			<div className="absolute inset-0">
				<div className="absolute top-1/4 left-1/4 w-96 h-96 bg-red-500/10 rounded-full blur-3xl animate-pulse"></div>
				<div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-orange-500/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
			</div>

			{/* Content */}
			<div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
				<div className="animate-fade-in">
					{/* Main title */}
					<h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl xl:text-8xl font-black text-white mb-8 leading-none">
						<span className="bg-gradient-to-r from-white via-gray-100 to-gray-300 bg-clip-text text-transparent">
							TORQUE
						</span>
						<br />
						<span className="bg-gradient-to-r from-red-500 via-red-400 to-orange-400 bg-clip-text text-transparent">
							FORGED
						</span>
						<br />
						<span className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-medium tracking-wider text-gray-400">
							MOTORSPORT
						</span>
					</h1>

					{/* Subtitle */}
					<p className="text-xl md:text-2xl lg:text-3xl text-gray-300 mb-12 max-w-4xl mx-auto leading-relaxed">
						Sua fonte definitiva para tudo sobre corridas, tuning e o mundo
						automotivo.
						<br className="hidden md:block" />
						Das pistas de F1 aos motores customizados, cobrimos toda a
						adrenalina do motorsport.
					</p>

					{/* CTA Buttons */}
					<div className="flex flex-col sm:flex-row gap-6 justify-center">
						<Link
							to="/f1"
							onMouseEnter={() => prefetchCategory("f1")}
							className="group bg-gradient-to-r from-red-600 to-red-500 hover:from-red-500 hover:to-red-400 text-white px-10 py-4 rounded-2xl font-bold text-lg transition-all duration-300 shadow-2xl hover:shadow-red-500/25 hover:scale-105"
						>
							<span className="flex items-center justify-center space-x-3">
								<span>Últimas Notícias</span>
								<ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform duration-300" />
							</span>
						</Link>
						<a
							href="https://www.youtube.com/channel/UCTk9ewLwz0tx80SeKxxPpVQ"
							target="_blank"
							rel="noopener noreferrer"
							className="group border-2 border-white/20 hover:border-red-500/50 text-white hover:text-red-400 px-10 py-4 rounded-2xl font-bold text-lg transition-all duration-300 backdrop-blur-sm hover:bg-red-500/10"
						>
							<span className="flex items-center justify-center space-x-3">
								<Youtube className="w-5 h-5" />
								<span>Assista no YouTube</span>
							</span>
						</a>
					</div>
				</div>
			</div>

			{/* Scroll indicator */}
			<div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 animate-bounce">
				<ChevronRight className="w-6 h-6 text-gray-400 rotate-90" />
			</div>
		</div>
	);
});

// Featured Posts Section com debug
const FeaturedPostsSection = () => {
	const { data: featuredPosts = [], isLoading, error } = useFeaturedPosts();

	// Debug log
	React.useEffect(() => {
		console.log("🎯 FeaturedPostsSection render:", {
			isLoading,
			error: error?.message,
			postsCount: featuredPosts?.length || 0,
			posts:
				featuredPosts
					?.slice(0, 2)
					?.map((p) => ({ id: p.id, title: p.title })) || [],
		});
	}, [isLoading, error, featuredPosts]);

	if (error) {
		return (
			<div className="py-24 bg-gradient-to-b from-black to-gray-900">
				<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
					<ErrorFallback
						error={error}
						resetErrorBoundary={() => window.location.reload()}
						section="posts em destaque"
					/>
				</div>
			</div>
		);
	}

	return (
		<div className="py-24 bg-gradient-to-b from-black to-gray-900">
			<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
				{/* Header */}
				<div className="text-center mb-16">
					<div className="inline-flex items-center px-4 py-2 rounded-full bg-red-500/10 border border-red-500/20 backdrop-blur-sm mb-6">
						<TrendingUp className="w-4 h-4 text-red-400 mr-2" />
						<span className="text-red-400 text-sm font-bold">Em Destaque</span>
					</div>
					<h2 className="text-5xl font-black text-white mb-6 bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
						Posts em Destaque
					</h2>
					<p className="text-xl text-gray-400 max-w-2xl mx-auto">
						As últimas novidades do mundo do motorsport direto da nossa redação
					</p>

					{/* Debug info em desenvolvimento */}
					{process.env.NODE_ENV === "development" && (
						<div className="mt-4 text-xs text-gray-500 font-mono">
							📊 Featured:{" "}
							{isLoading ? "Loading..." : `${featuredPosts.length} posts`}
							{error && ` | Error: ${error.message}`}
						</div>
					)}
				</div>

				{/* Content */}
				{isLoading ? (
					<FeaturedPostsSkeleton />
				) : featuredPosts.length === 0 ? (
					<div className="text-center py-16">
						<div className="w-20 h-20 bg-gradient-to-r from-gray-600 to-gray-500 rounded-3xl flex items-center justify-center mx-auto mb-6">
							<TrendingUp className="w-10 h-10 text-gray-400" />
						</div>
						<h3 className="text-2xl font-bold text-white mb-4">
							Nenhum post em destaque
						</h3>
						<p className="text-gray-400 mb-8">
							Os posts em destaque aparecerão aqui assim que forem publicados.
						</p>

						{/* Debug em desenvolvimento */}
						{process.env.NODE_ENV === "development" && (
							<div className="bg-yellow-900/20 border border-yellow-700 rounded-xl p-4 max-w-md mx-auto mb-8">
								<p className="text-yellow-300 text-sm">
									🔧 Debug: Verifique se há posts com trending=true no banco
								</p>
							</div>
						)}

						<Link
							to="/f1"
							className="inline-flex items-center space-x-2 bg-gradient-to-r from-red-600 to-red-500 hover:from-red-500 hover:to-red-400 text-white px-8 py-4 rounded-2xl font-bold transition-all duration-300 shadow-xl hover:shadow-red-500/25 hover:scale-105"
						>
							<span>Ver todos os posts</span>
							<ArrowRight className="w-4 h-4" />
						</Link>
					</div>
				) : (
					<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
						{featuredPosts.map((post, index) => (
							<PostCard key={`featured-${post.id}`} post={post} index={index} />
						))}
					</div>
				)}
			</div>
		</div>
	);
};

// PostCard sem fallbacks
const PostCard = React.memo(({ post, index }) => {
	const { prefetchPost } = usePrefetch();

	const formatDate = useMemo(() => {
		if (!post?.created_at) return "Data não disponível";
		try {
			return new Date(post.created_at).toLocaleDateString("pt-BR");
		} catch (error) {
			return "Data inválida";
		}
	}, [post?.created_at]);

	if (!post) return null;

	return (
		<article className="group relative bg-gradient-to-br from-gray-900 to-gray-800 rounded-3xl overflow-hidden shadow-2xl hover:shadow-red-500/10 transition-all duration-500 hover:scale-105 border border-gray-700/50">
			{/* Image */}
			<div className="relative overflow-hidden">
				<img
					src={post.image_url}
					alt={post.title}
					className="w-full h-56 object-cover transition-transform duration-700 group-hover:scale-110"
					loading={index < 3 ? "eager" : "lazy"}
					onError={(e) => {
						e.target.src =
							"https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&h=600&fit=crop";
					}}
				/>
				<div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent"></div>

				{/* Badges */}
				<div className="absolute top-4 left-4 flex items-center space-x-2">
					<Link
						to={`/${post.category}`}
						className="bg-gradient-to-r from-red-600 to-red-500 text-white px-4 py-2 rounded-full text-sm font-bold shadow-lg hover:shadow-red-500/25 transition-all duration-300"
					>
						{post.category_name}
					</Link>
					{post.trending && (
						<span className="bg-gradient-to-r from-orange-500 to-yellow-500 text-white px-3 py-1 rounded-full text-xs font-bold flex items-center space-x-1">
							<TrendingUp className="w-3 h-3" />
							<span>TREND</span>
						</span>
					)}
				</div>
			</div>

			{/* Content */}
			<div className="p-8">
				<Link
					to={`/post/${post.id}`}
					onMouseEnter={() => prefetchPost(post.id)}
				>
					<h3 className="text-xl font-bold text-white mb-4 group-hover:text-red-400 transition-colors duration-300 leading-tight line-clamp-2">
						{post.title}
					</h3>
				</Link>
				<p className="text-gray-400 mb-6 leading-relaxed line-clamp-3">
					{post.excerpt}
				</p>

				{/* Meta */}
				<div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-3 md:space-y-0">
					<div className="flex items-center space-x-4 text-sm text-gray-500">
						<div className="flex items-center space-x-2">
							<User className="w-4 h-4" />
							<span>{post.author}</span>
						</div>
						<div className="flex items-center space-x-2">
							<Clock className="w-4 h-4" />
							<span>{post.read_time}</span>
						</div>
					</div>
					<div className="flex items-center space-x-2 text-sm text-gray-500">
						<Calendar className="w-4 h-4" />
						<span>{formatDate}</span>
					</div>
				</div>

				{/* Read more */}
				<div className="mt-6 pt-6 border-t border-gray-700">
					<Link
						to={`/post/${post.id}`}
						onMouseEnter={() => prefetchPost(post.id)}
						className="text-red-400 hover:text-red-300 font-bold text-sm flex items-center space-x-2 group-hover:space-x-3 transition-all duration-300"
					>
						<span>Leia mais</span>
						<ArrowRight className="w-4 h-4" />
					</Link>
				</div>
			</div>
		</article>
	);
});

// Posts List Section com debug
const PostListSection = () => {
	const { data: allPosts = [], isLoading, error } = useAllPosts();
	const { prefetchPost } = usePrefetch();

	// Debug log
	React.useEffect(() => {
		console.log("📝 PostListSection render:", {
			isLoading,
			error: error?.message,
			postsCount: allPosts?.length || 0,
			posts:
				allPosts?.slice(0, 2)?.map((p) => ({ id: p.id, title: p.title })) || [],
		});
	}, [isLoading, error, allPosts]);

	if (isLoading) {
		return (
			<div className="lg:col-span-2">
				<div className="flex items-center justify-between mb-12">
					<h2 className="text-4xl font-black text-white bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
						Últimos Artigos
					</h2>
				</div>
				<PostListSkeleton />
			</div>
		);
	}

	if (error) {
		return (
			<div className="lg:col-span-2">
				<ErrorFallback
					error={error}
					resetErrorBoundary={() => window.location.reload()}
					section="últimos artigos"
				/>
			</div>
		);
	}

	if (allPosts.length === 0) {
		return (
			<div className="lg:col-span-2 text-center py-16">
				<div className="w-20 h-20 bg-gradient-to-r from-gray-600 to-gray-500 rounded-3xl flex items-center justify-center mx-auto mb-6">
					<Zap className="w-10 h-10 text-gray-400" />
				</div>
				<h3 className="text-2xl font-bold text-white mb-4">
					Nenhum post encontrado
				</h3>
				<p className="text-gray-400 mb-8">
					Não há posts publicados no momento. Volte em breve!
				</p>

				{/* Debug em desenvolvimento */}
				{process.env.NODE_ENV === "development" && (
					<div className="bg-yellow-900/20 border border-yellow-700 rounded-xl p-4 max-w-md mx-auto">
						<p className="text-yellow-300 text-sm">
							🔧 Debug: Verifique se há posts com published=true no banco
						</p>
					</div>
				)}
			</div>
		);
	}

	return (
		<div className="lg:col-span-2 space-y-8">
			<div className="flex items-center justify-between mb-12">
				<h2 className="text-4xl font-black text-white bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
					Últimos Artigos
				</h2>
				<Link
					to="/f1"
					className="text-red-400 hover:text-red-300 font-bold flex items-center space-x-2 group"
				>
					<span>Ver todos</span>
					<ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-300" />
				</Link>
			</div>

			{/* Debug info em desenvolvimento */}
			{process.env.NODE_ENV === "development" && (
				<div className="mb-4 text-xs text-gray-500 font-mono">
					📊 All Posts: {allPosts.length} carregados
				</div>
			)}

			<div className="space-y-8">
				{allPosts.map((post, index) => {
					const formatDate = (dateString) => {
						try {
							return new Date(dateString).toLocaleDateString("pt-BR");
						} catch (error) {
							return "Data inválida";
						}
					};

					return (
						<article
							key={`post-${post.id}`}
							className="group bg-gradient-to-br from-gray-900 to-gray-800 rounded-3xl p-8 border border-gray-700/50 hover:border-red-500/30 transition-all duration-500 hover:scale-[1.02]"
						>
							<div className="flex flex-col md:flex-row gap-8">
								{/* Image */}
								<div className="relative overflow-hidden rounded-2xl">
									<img
										src={post.image_url}
										alt={post.title}
										className="w-full md:w-64 h-48 object-cover transition-transform duration-700 group-hover:scale-110"
										loading={index < 3 ? "eager" : "lazy"}
										onError={(e) => {
											e.target.src =
												"https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&h=600&fit=crop";
										}}
									/>
									<div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
								</div>

								{/* Content */}
								<div className="flex-1 space-y-4">
									<div className="flex items-center gap-3">
										<Link
											to={`/${post.category}`}
											className="text-red-400 text-sm font-bold hover:text-red-300 transition-colors duration-300"
										>
											{post.category_name}
										</Link>
										{post.trending && (
											<>
												<span className="text-gray-600">•</span>
												<span className="text-orange-400 text-sm font-bold flex items-center space-x-1">
													<TrendingUp className="w-3 h-3" />
													<span>Trending</span>
												</span>
											</>
										)}
									</div>
									<Link
										to={`/post/${post.id}`}
										onMouseEnter={() => prefetchPost(post.id)}
									>
										<h3 className="text-2xl font-bold text-white group-hover:text-red-400 transition-colors duration-300 leading-tight">
											{post.title}
										</h3>
									</Link>
									<p className="text-gray-400 leading-relaxed">
										{post.excerpt}
									</p>
									<div className="flex flex-col md:flex-row md:items-center md:justify-between pt-4 space-y-3 md:space-y-0">
										<div className="flex items-center gap-6 text-sm text-gray-500">
											<div className="flex items-center space-x-2">
												<User className="w-4 h-4" />
												<span>{post.author}</span>
											</div>
											<div className="flex items-center space-x-2">
												<Clock className="w-4 h-4" />
												<span>{post.read_time}</span>
											</div>
											<div className="flex items-center space-x-2">
												<Calendar className="w-4 h-4" />
												<span>{formatDate(post.created_at)}</span>
											</div>
										</div>
										<Link
											to={`/post/${post.id}`}
											onMouseEnter={() => prefetchPost(post.id)}
											className="text-red-400 hover:text-red-300 font-bold text-sm flex items-center space-x-2 group-hover:space-x-3 transition-all duration-300"
										>
											<span>Leia mais</span>
											<ArrowRight className="w-4 h-4" />
										</Link>
									</div>
								</div>
							</div>
						</article>
					);
				})}
			</div>
		</div>
	);
};

// Sidebar dinâmica
const Sidebar = React.memo(() => {
	const { data: categories = [], isLoading: loadingCategories } =
		useCategories();
	const { prefetchCategory } = usePrefetch();

	return (
		<div className="lg:col-span-1">
			<div className="space-y-8">
				{/* Categorias dinâmicas */}
				<div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-3xl p-8 border border-gray-700/50 backdrop-blur-sm">
					<h3 className="text-2xl font-bold text-white mb-6 flex items-center space-x-3">
						<div className="w-2 h-8 bg-gradient-to-b from-red-500 to-orange-500 rounded-full"></div>
						<span>Categorias</span>
					</h3>

					{/* Debug em desenvolvimento */}
					{process.env.NODE_ENV === "development" && (
						<div className="mb-4 text-xs text-gray-500 font-mono">
							📂 Categories:{" "}
							{loadingCategories ? "Loading..." : categories.length}
						</div>
					)}

					{loadingCategories ? (
						<div className="space-y-4">
							{Array.from({ length: 6 }).map((_, i) => (
								<div
									key={i}
									className="animate-pulse p-4 rounded-2xl bg-gray-800/50"
								>
									<div className="flex items-center space-x-4">
										<div className="w-10 h-10 bg-gray-700 rounded-xl"></div>
										<div className="flex-1">
											<div className="h-4 bg-gray-700 rounded-full mb-2"></div>
											<div className="h-3 bg-gray-700 rounded-full w-16"></div>
										</div>
									</div>
								</div>
							))}
						</div>
					) : categories.length === 0 ? (
						<div className="text-center py-8">
							<p className="text-gray-400">Nenhuma categoria encontrada</p>
							{process.env.NODE_ENV === "development" && (
								<p className="text-yellow-400 text-xs mt-2">
									🔧 Verifique a tabela 'categories' no banco
								</p>
							)}
						</div>
					) : (
						<div className="space-y-4">
							{categories.map((category) => (
								<Link
									key={category.id}
									to={`/${category.id}`}
									onMouseEnter={() => prefetchCategory(category.id)}
									className="group relative p-4 rounded-2xl hover:bg-gray-800/50 cursor-pointer transition-all duration-300 overflow-hidden block"
								>
									<div
										className={`absolute inset-0 bg-gradient-to-r ${
											category.color || "from-red-500 to-orange-500"
										} opacity-0 group-hover:opacity-10 transition-opacity duration-300 rounded-2xl`}
									></div>
									<div className="relative flex items-center justify-between">
										<div className="flex items-center space-x-4">
											<div
												className={`p-2 rounded-xl bg-gradient-to-r ${
													category.color || "from-red-500 to-orange-500"
												} shadow-lg`}
											>
												<Settings className="w-5 h-5 text-white" />
											</div>
											<div className="flex flex-col">
												<span className="text-gray-300 font-medium group-hover:text-white transition-colors duration-300">
													{category.name}
												</span>
												<span className="text-xs text-gray-500">
													{category.description}
												</span>
											</div>
										</div>
										<ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-red-400 group-hover:translate-x-1 transition-all duration-300" />
									</div>
								</Link>
							))}
						</div>
					)}
				</div>

				{/* Social Media */}
				<div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-3xl p-8 border border-gray-700/50 backdrop-blur-sm">
					<h3 className="text-2xl font-bold text-white mb-6 flex items-center space-x-3">
						<div className="w-2 h-8 bg-gradient-to-b from-purple-500 to-pink-500 rounded-full"></div>
						<span>Siga-nos</span>
					</h3>
					<div className="space-y-4">
						<a
							href="https://www.youtube.com/channel/UCTk9ewLwz0tx80SeKxxPpVQ"
							target="_blank"
							rel="noopener noreferrer"
							className="group flex items-center space-x-4 p-4 rounded-2xl bg-gradient-to-r from-red-600 to-red-500 hover:from-red-500 hover:to-red-400 transition-all duration-300 shadow-xl hover:shadow-red-500/25 hover:scale-105"
						>
							<Youtube className="w-6 h-6 text-white" />
							<div className="flex-1">
								<span className="text-white font-bold block">YouTube</span>
								<span className="text-red-100 text-sm">
									Assista nossos vídeos
								</span>
							</div>
							<ArrowRight className="w-5 h-5 text-white group-hover:translate-x-1 transition-transform duration-300" />
						</a>

						<a
							href="https://instagram.com/torqueforgedmotorsport"
							target="_blank"
							rel="noopener noreferrer"
							className="group flex items-center space-x-4 p-4 rounded-2xl bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 transition-all duration-300 shadow-xl hover:shadow-purple-500/25 hover:scale-105"
						>
							<Instagram className="w-6 h-6 text-white" />
							<div className="flex-1">
								<span className="text-white font-bold block">Instagram</span>
								<span className="text-purple-100 text-sm">
									Fotos exclusivas
								</span>
							</div>
							<ArrowRight className="w-5 h-5 text-white group-hover:translate-x-1 transition-transform duration-300" />
						</a>
					</div>
				</div>
			</div>
		</div>
	);
});

// Componente principal Home com debug
const OptimizedHome = () => {
	// Auto debug em desenvolvimento
	const {} = useAutoDebug();

	React.useEffect(() => {
		console.log("🏠 OptimizedHome: Componente montado");

		if (process.env.NODE_ENV === "development") {
			console.log(
				"🔧 Modo desenvolvimento ativo - Debug automático habilitado"
			);
		}
	}, []);

	return (
		<>
			{/* Debug Panel em desenvolvimento */}
			<DebugPanel />

			{/* Hero Section */}
			<HeroSection />

			{/* Posts em Destaque */}
			<ErrorBoundary
				FallbackComponent={(props) => (
					<div className="py-24 bg-gradient-to-b from-black to-gray-900">
						<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
							<ErrorFallback {...props} section="posts em destaque" />
						</div>
					</div>
				)}
				onReset={() => window.location.reload()}
			>
				<FeaturedPostsSection />
			</ErrorBoundary>

			{/* Últimos Artigos com Sidebar */}
			<div className="py-24 bg-gradient-to-b from-gray-900 to-black">
				<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
					<div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
						{/* Lista de Posts */}
						<ErrorBoundary
							FallbackComponent={(props) => (
								<div className="lg:col-span-2">
									<ErrorFallback {...props} section="últimos artigos" />
								</div>
							)}
							onReset={() => window.location.reload()}
						>
							<PostListSection />
						</ErrorBoundary>

						{/* Sidebar */}
						<Sidebar />
					</div>
				</div>
			</div>
		</>
	);
};

export default OptimizedHome;
