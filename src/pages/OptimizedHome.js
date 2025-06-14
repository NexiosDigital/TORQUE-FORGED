import React, { useMemo, useEffect } from "react";
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
} from "lucide-react";
import {
	useFeaturedPosts,
	useAllPosts,
	useCategories,
	usePrefetch,
	usePreloadCriticalData,
} from "../hooks/usePostsQuery";
import { ErrorBoundary } from "react-error-boundary";

/**
 * OptimizedHome - CARREGAMENTO INSTANTÂNEO
 * - Preload automático de dados críticos
 * - Carregamento paralelo otimizado
 * - Cache ultra agressivo
 * - Zero dependência de auth para dados públicos
 * - Fallbacks inteligentes
 */

// Loading skeletons MINIMALISTAS para velocidade
const FastSkeleton = ({ count = 3, type = "card" }) => (
	<div
		className={`grid ${
			type === "card"
				? "grid-cols-1 md:grid-cols-2 lg:grid-cols-3"
				: "grid-cols-1"
		} gap-6 md:gap-8`}
	>
		{Array.from({ length: count }).map((_, i) => (
			<div key={`skeleton-${i}`} className="animate-pulse">
				<div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-3xl overflow-hidden border border-gray-700/50">
					<div className="h-56 bg-gradient-to-br from-gray-700 to-gray-800"></div>
					<div className="p-6">
						<div className="h-4 bg-gray-700 rounded-full mb-3 w-24"></div>
						<div className="h-6 bg-gray-700 rounded-full mb-2"></div>
						<div className="h-6 bg-gray-700 rounded-full w-3/4 mb-4"></div>
						<div className="h-3 bg-gray-700 rounded-full w-1/2"></div>
					</div>
				</div>
			</div>
		))}
	</div>
);

// Error fallback MINIMALISTA
const FastErrorFallback = ({ error, resetErrorBoundary, section }) => (
	<div className="text-center py-16">
		<div className="w-20 h-20 bg-gradient-to-r from-red-600 to-red-500 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-2xl">
			<AlertCircle className="w-10 h-10 text-white" />
		</div>
		<h3 className="text-2xl font-bold text-white mb-4">
			Erro ao carregar {section}
		</h3>
		<p className="text-gray-400 mb-8">Algo deu errado. Tente novamente.</p>
		<button
			onClick={resetErrorBoundary}
			className="bg-gradient-to-r from-red-600 to-red-500 hover:from-red-500 hover:to-red-400 text-white px-8 py-3 rounded-2xl font-bold transition-all duration-300 shadow-xl hover:shadow-red-500/25 hover:scale-105"
		>
			Tentar Novamente
		</button>
	</div>
);

// Hero Section OTIMIZADO
const HeroSection = React.memo(() => {
	const { prefetchCategory } = usePrefetch();

	return (
		<div className="relative min-h-screen flex items-center justify-center overflow-hidden">
			{/* Background otimizado */}
			<div className="absolute inset-0 bg-gradient-to-br from-black via-gray-900 to-black"></div>
			<div className="absolute inset-0 bg-gradient-to-r from-red-900/20 via-transparent to-red-900/20"></div>

			{/* Floating elements otimizados */}
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
							to="/posts"
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

// PostCard ULTRA OTIMIZADO
const PostCard = React.memo(({ post, index }) => {
	const { prefetchPost } = usePrefetch();

	const formatDate = useMemo(() => {
		if (!post?.created_at) return "Data não disponível";
		try {
			return new Date(post.created_at).toLocaleDateString("pt-BR");
		} catch (error) {
			return "Data não disponível";
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

// Featured Posts Section ULTRA OTIMIZADO
const FeaturedPostsSection = () => {
	const { data: featuredPosts = [], isLoading, error } = useFeaturedPosts();

	if (error) {
		return (
			<div className="py-24 bg-gradient-to-b from-black to-gray-900">
				<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
					<FastErrorFallback
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
				</div>

				{/* Content */}
				{isLoading ? (
					<FastSkeleton count={3} type="card" />
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

// Posts List Section ULTRA OTIMIZADO
const PostListSection = () => {
	const { data: allPosts = [], isLoading, error } = useAllPosts();
	const { prefetchPost } = usePrefetch();

	// Limitar para apenas 4 posts na home
	const limitedPosts = useMemo(() => {
		return allPosts.slice(0, 4);
	}, [allPosts]);

	if (isLoading) {
		return (
			<div className="lg:col-span-2">
				<div className="flex items-center justify-between mb-12">
					<h2 className="text-4xl font-black text-white bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
						Últimos Artigos
					</h2>
				</div>
				<FastSkeleton count={4} type="list" />
			</div>
		);
	}

	if (error) {
		return (
			<div className="lg:col-span-2">
				<FastErrorFallback
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
					to="/posts"
					className="text-red-400 hover:text-red-300 font-bold flex items-center space-x-2 group"
				>
					<span>Ver todos</span>
					<ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-300" />
				</Link>
			</div>

			<div className="space-y-8">
				{limitedPosts.map((post, index) => {
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

			{/* Ver mais posts */}
			{allPosts.length > 4 && (
				<div className="text-center pt-8">
					<Link
						to="/posts"
						className="inline-flex items-center space-x-2 bg-gradient-to-r from-red-600 to-red-500 hover:from-red-500 hover:to-red-400 text-white px-8 py-4 rounded-2xl font-bold transition-all duration-300 shadow-xl hover:shadow-red-500/25 hover:scale-105"
					>
						<span>Ver todos os {allPosts.length} posts</span>
						<ArrowRight className="w-4 h-4" />
					</Link>
				</div>
			)}
		</div>
	);
};

// Sidebar ULTRA OTIMIZADO
const Sidebar = React.memo(() => {
	const { data: categories = [], isLoading: loadingCategories } =
		useCategories();
	const { prefetchCategory } = usePrefetch();

	return (
		<div className="lg:col-span-1">
			<div className="space-y-8">
				{/* Categorias */}
				<div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-3xl p-8 border border-gray-700/50 backdrop-blur-sm">
					<h3 className="text-2xl font-bold text-white mb-6 flex items-center space-x-3">
						<div className="w-2 h-8 bg-gradient-to-b from-red-500 to-orange-500 rounded-full"></div>
						<span>Categorias</span>
					</h3>

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

// Componente principal ULTRA OTIMIZADO
const OptimizedHome = () => {
	const { preloadAll } = usePreloadCriticalData();

	// Preload automático de dados críticos no mount
	useEffect(() => {
		const timer = setTimeout(() => {
			preloadAll();
		}, 50); // Preload após 50ms

		return () => clearTimeout(timer);
	}, [preloadAll]);

	return (
		<>
			{/* Hero Section */}
			<HeroSection />

			{/* Posts em Destaque */}
			<ErrorBoundary
				FallbackComponent={(props) => (
					<div className="py-24 bg-gradient-to-b from-black to-gray-900">
						<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
							<FastErrorFallback {...props} section="posts em destaque" />
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
					<div className="grid grid-cols-1 lg:grid-cols-3 gap-12 items-start">
						{/* Lista de Posts */}
						<ErrorBoundary
							FallbackComponent={(props) => (
								<div className="lg:col-span-2">
									<FastErrorFallback {...props} section="últimos artigos" />
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
