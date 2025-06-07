import React, { Suspense, useMemo } from "react";
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
	Play,
	Settings,
} from "lucide-react";
import {
	useFeaturedPosts,
	useAllPosts,
	usePrefetch,
	useCacheStats,
} from "../hooks/useUltraFastPosts";
import { ErrorBoundary } from "react-error-boundary";

/**
 * Componente Home Ultra-Otimizado
 * - Suspense boundaries para carregamento progressivo
 * - Prefetching inteligente
 * - Memoização de componentes pesados
 * - Error boundaries granulares
 * - Loading states otimizados
 */

// Loading skeletons otimizados
const FeaturedPostsSkeleton = () => (
	<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
		{[1, 2, 3].map((i) => (
			<div key={i} className="animate-pulse">
				<div className="bg-gray-800 rounded-2xl overflow-hidden">
					<div className="h-48 md:h-56 bg-gray-700"></div>
					<div className="p-6">
						<div className="h-4 bg-gray-700 rounded mb-2"></div>
						<div className="h-4 bg-gray-700 rounded w-3/4 mb-4"></div>
						<div className="h-3 bg-gray-700 rounded w-1/2"></div>
					</div>
				</div>
			</div>
		))}
	</div>
);

const PostListSkeleton = () => (
	<div className="space-y-6 md:space-y-8">
		{[1, 2, 3].map((i) => (
			<div key={i} className="animate-pulse">
				<div className="bg-gray-800 rounded-2xl p-6 flex gap-6">
					<div className="w-64 h-48 bg-gray-700 rounded-xl flex-shrink-0"></div>
					<div className="flex-1">
						<div className="h-4 bg-gray-700 rounded mb-2 w-1/4"></div>
						<div className="h-6 bg-gray-700 rounded mb-3"></div>
						<div className="h-4 bg-gray-700 rounded mb-2"></div>
						<div className="h-4 bg-gray-700 rounded w-3/4 mb-4"></div>
						<div className="h-3 bg-gray-700 rounded w-1/2"></div>
					</div>
				</div>
			</div>
		))}
	</div>
);

// Error fallback component
const ErrorFallback = ({ error, resetErrorBoundary, section }) => (
	<div className="text-center py-12">
		<div className="w-16 h-16 bg-red-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
			<Zap className="w-8 h-8 text-white" />
		</div>
		<h3 className="text-xl font-bold text-white mb-2">
			Erro ao carregar {section}
		</h3>
		<p className="text-gray-400 mb-4 text-sm">
			{error?.message || "Algo deu errado"}
		</p>
		<button
			onClick={resetErrorBoundary}
			className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition-colors text-sm"
		>
			Tentar Novamente
		</button>
	</div>
);

// Componente Hero memoizado
const HeroSection = React.memo(() => {
	const { prefetchCategory } = usePrefetch();

	return (
		<div className="relative min-h-screen flex items-center justify-center overflow-hidden">
			<div className="absolute inset-0 bg-gradient-to-br from-black via-gray-900 to-black"></div>
			<div className="absolute inset-0 bg-gradient-to-r from-red-900/20 via-transparent to-red-900/20"></div>

			<div className="absolute inset-0">
				<div className="absolute top-1/4 left-1/4 w-96 h-96 bg-red-500/10 rounded-full blur-3xl animate-pulse"></div>
				<div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-orange-500/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
			</div>

			<div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
				<div className="animate-fade-in">
					<div className="mb-6 md:mb-8">
						<div className="inline-flex items-center px-4 md:px-6 py-2 md:py-3 rounded-full bg-red-500/10 border border-red-500/20 backdrop-blur-sm mb-4 md:mb-6">
							<span className="text-red-400 text-xs md:text-sm font-semibold">
								🏁 Carregamento Ultra-Rápido - Menos de 1s
							</span>
						</div>
					</div>

					<h1 className="text-3xl sm:text-4xl md:text-6xl lg:text-7xl xl:text-8xl font-black text-white mb-6 md:mb-8 leading-none">
						<span className="bg-gradient-to-r from-white via-gray-100 to-gray-300 bg-clip-text text-transparent">
							TORQUE
						</span>
						<br />
						<span className="bg-gradient-to-r from-red-500 via-red-400 to-orange-400 bg-clip-text text-transparent">
							FORGED
						</span>
						<br />
						<span className="text-lg sm:text-xl md:text-2xl lg:text-3xl xl:text-4xl font-medium tracking-wider text-gray-400">
							MOTORSPORT
						</span>
					</h1>

					<p className="text-base md:text-xl lg:text-2xl text-gray-300 mb-8 md:mb-12 max-w-4xl mx-auto leading-relaxed px-4">
						Sua fonte definitiva para tudo sobre corridas, tuning e o mundo
						automotivo.
						<br className="hidden md:block" />
						Das pistas de F1 aos motores customizados, cobrimos toda a
						adrenalina do motorsport.
					</p>

					<div className="flex flex-col sm:flex-row gap-4 md:gap-6 justify-center px-4">
						<Link
							to="/f1"
							onMouseEnter={() => prefetchCategory("f1")}
							className="group bg-gradient-to-r from-red-600 to-red-500 hover:from-red-500 hover:to-red-400 text-white px-6 md:px-10 py-3 md:py-4 rounded-2xl font-semibold text-base md:text-lg transition-all duration-300 shadow-2xl hover:shadow-red-500/25 hover:scale-105"
						>
							<span className="flex items-center justify-center space-x-3">
								<span>Últimas Notícias</span>
								<ArrowRight className="w-4 h-4 md:w-5 md:h-5 group-hover:translate-x-1 transition-transform duration-300" />
							</span>
						</Link>
						<a
							href="https://www.youtube.com/channel/UCTk9ewLwz0tx80SeKxxPpVQ"
							target="_blank"
							rel="noopener noreferrer"
							className="group border-2 border-white/20 hover:border-red-500/50 text-white hover:text-red-400 px-6 md:px-10 py-3 md:py-4 rounded-2xl font-semibold text-base md:text-lg transition-all duration-300 backdrop-blur-sm hover:bg-red-500/10"
						>
							<span className="flex items-center justify-center space-x-3">
								<Youtube className="w-4 h-4 md:w-5 md:h-5" />
								<span>Assista no YouTube</span>
							</span>
						</a>
					</div>
				</div>
			</div>

			<div className="absolute bottom-4 md:bottom-8 left-1/2 transform -translate-x-1/2 animate-bounce">
				<ChevronRight className="w-5 h-5 md:w-6 md:h-6 text-gray-400 rotate-90" />
			</div>
		</div>
	);
});

// Componente de post memoizado
const PostCard = React.memo(({ post, index }) => {
	const { prefetchPost } = usePrefetch();

	const formatDate = useMemo(() => {
		try {
			const date = new Date(post.created_at);
			return isNaN(date.getTime())
				? "Data inválida"
				: date.toLocaleDateString("pt-BR");
		} catch (error) {
			return "Data inválida";
		}
	}, [post.created_at]);

	return (
		<article className="group relative bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl md:rounded-3xl overflow-hidden shadow-2xl hover:shadow-red-500/10 transition-all duration-500 hover:scale-105">
			<div className="relative overflow-hidden">
				<img
					src={post.image_url}
					alt={post.title}
					className="w-full h-48 md:h-56 object-cover transition-transform duration-700 group-hover:scale-110"
					loading={index < 3 ? "eager" : "lazy"}
				/>
				<div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent"></div>

				<div className="absolute top-3 md:top-4 left-3 md:left-4 flex items-center space-x-2">
					<Link
						to={`/${post.category}`}
						className="bg-gradient-to-r from-red-600 to-red-500 text-white px-3 md:px-4 py-1.5 md:py-2 rounded-full text-xs md:text-sm font-semibold shadow-lg hover:shadow-red-500/25 transition-all duration-300"
					>
						{post.category_name}
					</Link>
					{post.trending && (
						<span className="bg-gradient-to-r from-orange-500 to-yellow-500 text-white px-2 md:px-3 py-1 rounded-full text-xs font-bold flex items-center space-x-1">
							<TrendingUp className="w-2.5 h-2.5 md:w-3 md:h-3" />
							<span>TREND</span>
						</span>
					)}
				</div>
			</div>

			<div className="p-4 md:p-8">
				<Link
					to={`/post/${post.id}`}
					onMouseEnter={() => prefetchPost(post.id)}
				>
					<h3 className="text-lg md:text-xl font-bold text-white mb-3 md:mb-4 group-hover:text-red-400 transition-colors duration-300 leading-tight line-clamp-2">
						{post.title}
					</h3>
				</Link>
				<p className="text-gray-400 mb-4 md:mb-6 leading-relaxed line-clamp-3 text-sm md:text-base">
					{post.excerpt}
				</p>

				<div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-3 md:space-y-0">
					<div className="flex items-center space-x-3 md:space-x-4 text-xs md:text-sm text-gray-500">
						<div className="flex items-center space-x-1.5 md:space-x-2">
							<User className="w-3 h-3 md:w-4 md:h-4" />
							<span>{post.author}</span>
						</div>
						<div className="flex items-center space-x-1.5 md:space-x-2">
							<Clock className="w-3 h-3 md:w-4 md:h-4" />
							<span>{post.read_time}</span>
						</div>
					</div>
					<div className="flex items-center space-x-1.5 md:space-x-2 text-xs md:text-sm text-gray-500">
						<Calendar className="w-3 h-3 md:w-4 md:h-4" />
						<span>{formatDate}</span>
					</div>
				</div>

				<div className="mt-4 md:mt-6 pt-4 md:pt-6 border-t border-gray-700">
					<Link
						to={`/post/${post.id}`}
						onMouseEnter={() => prefetchPost(post.id)}
						className="text-red-400 hover:text-red-300 font-semibold text-sm flex items-center space-x-2 group-hover:space-x-3 transition-all duration-300"
					>
						<span>Leia mais</span>
						<ArrowRight className="w-3 h-3 md:w-4 md:h-4" />
					</Link>
				</div>
			</div>
		</article>
	);
});

// Componente de posts em destaque com Suspense
const FeaturedPostsSection = () => {
	const { data: featuredPosts } = useFeaturedPosts();

	return (
		<div className="py-16 md:py-24 bg-gradient-to-b from-black to-gray-900">
			<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
				<div className="text-center mb-12 md:mb-16">
					<div className="inline-flex items-center px-3 md:px-4 py-1.5 md:py-2 rounded-full bg-red-500/10 border border-red-500/20 backdrop-blur-sm mb-4 md:mb-6">
						<TrendingUp className="w-3 h-3 md:w-4 md:h-4 text-red-400 mr-2" />
						<span className="text-red-400 text-xs md:text-sm font-semibold">
							Em Destaque
						</span>
					</div>
					<h2 className="text-3xl md:text-4xl lg:text-5xl font-black text-white mb-4 md:mb-6 bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
						Posts em Destaque
					</h2>
					<p className="text-base md:text-xl text-gray-400 max-w-2xl mx-auto">
						As últimas novidades do mundo do motorsport direto da nossa redação
					</p>
				</div>

				<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
					{featuredPosts.map((post, index) => (
						<PostCard key={post.id} post={post} index={index} />
					))}
				</div>
			</div>
		</div>
	);
};

// Componente de lista de posts com Suspense
const PostListSection = () => {
	const { data: allPosts } = useAllPosts();
	const { prefetchPost } = usePrefetch();

	const formatDate = (dateString) => {
		try {
			return new Date(dateString).toLocaleDateString("pt-BR");
		} catch (error) {
			return "Data inválida";
		}
	};

	return (
		<div className="lg:col-span-2 space-y-6 md:space-y-8">
			<div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8 md:mb-12 space-y-4 md:space-y-0">
				<h2 className="text-2xl md:text-3xl lg:text-4xl font-black text-white bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
					Últimos Artigos
				</h2>
				<Link
					to="/f1"
					className="text-red-400 hover:text-red-300 font-semibold flex items-center space-x-2 group self-start md:self-auto"
				>
					<span>Ver todos</span>
					<ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-300" />
				</Link>
			</div>

			<div className="space-y-6 md:space-y-8">
				{allPosts.map((post, index) => (
					<article
						key={post.id}
						className="group bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl md:rounded-3xl p-6 md:p-8 border border-gray-700/50 hover:border-red-500/30 transition-all duration-500 hover:scale-[1.02]"
					>
						<div className="flex flex-col md:flex-row gap-6 md:gap-8">
							<div className="relative overflow-hidden rounded-xl md:rounded-2xl">
								<img
									src={post.image_url}
									alt={post.title}
									className="w-full md:w-64 h-48 object-cover transition-transform duration-700 group-hover:scale-110"
									loading={index < 3 ? "eager" : "lazy"}
								/>
								<div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
							</div>
							<div className="flex-1 space-y-3 md:space-y-4">
								<div className="flex flex-wrap items-center gap-2 md:gap-3">
									<Link
										to={`/${post.category}`}
										className="text-red-400 text-sm font-semibold hover:text-red-300 transition-colors duration-300"
									>
										{post.category_name}
									</Link>
									{post.trending && (
										<>
											<span className="text-gray-600">•</span>
											<span className="text-orange-400 text-sm font-semibold flex items-center space-x-1">
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
									<h3 className="text-xl md:text-2xl font-bold text-white group-hover:text-red-400 transition-colors duration-300 leading-tight">
										{post.title}
									</h3>
								</Link>
								<p className="text-gray-400 leading-relaxed text-sm md:text-base">
									{post.excerpt}
								</p>
								<div className="flex flex-col md:flex-row md:items-center md:justify-between pt-4 space-y-3 md:space-y-0">
									<div className="flex flex-wrap items-center gap-4 md:gap-6 text-xs md:text-sm text-gray-500">
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
										className="text-red-400 hover:text-red-300 font-semibold text-sm flex items-center space-x-2 group-hover:space-x-3 transition-all duration-300 self-start md:self-auto"
									>
										<span>Leia mais</span>
										<ArrowRight className="w-4 h-4" />
									</Link>
								</div>
							</div>
						</div>
					</article>
				))}
			</div>
		</div>
	);
};

// Sidebar memoizada
const Sidebar = React.memo(() => {
	const { prefetchCategory } = usePrefetch();
	const { getStats } = useCacheStats();

	const staticCategories = useMemo(
		() => [
			{
				id: "f1",
				name: "Fórmula 1",
				description: "A elite do automobilismo mundial",
				color: "from-red-500 to-orange-500",
				count: 12,
			},
			{
				id: "nascar",
				name: "NASCAR",
				description: "A categoria mais popular dos EUA",
				color: "from-blue-500 to-cyan-500",
				count: 8,
			},
			{
				id: "endurance",
				name: "Endurance",
				description: "Corridas de resistência épicas",
				color: "from-green-500 to-emerald-500",
				count: 6,
			},
			{
				id: "drift",
				name: "Formula Drift",
				description: "A arte de deslizar com estilo",
				color: "from-purple-500 to-pink-500",
				count: 10,
			},
			{
				id: "tuning",
				name: "Tuning & Custom",
				description: "Personalização e modificações",
				color: "from-yellow-500 to-orange-500",
				count: 15,
			},
			{
				id: "engines",
				name: "Motores",
				description: "Tecnologia e performance",
				color: "from-indigo-500 to-purple-500",
				count: 9,
			},
		],
		[]
	);

	return (
		<div className="lg:col-span-1">
			<div className="space-y-6 md:space-y-8">
				{/* Debug info apenas em desenvolvimento */}
				{process.env.NODE_ENV === "development" && (
					<div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl md:rounded-3xl p-3 md:p-4 border border-gray-700/50">
						<div className="text-xs text-gray-500">
							⚡ Sistema Ultra-Rápido | Cache Stats:{" "}
							{JSON.stringify(getStats(), null, 2)}
						</div>
					</div>
				)}

				{/* Categorias */}
				<div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl md:rounded-3xl p-6 md:p-8 border border-gray-700/50 backdrop-blur-sm">
					<h3 className="text-xl md:text-2xl font-bold text-white mb-4 md:mb-6 flex items-center space-x-3">
						<div className="w-2 h-6 md:h-8 bg-gradient-to-b from-red-500 to-orange-500 rounded-full"></div>
						<span>Categorias</span>
					</h3>
					<div className="space-y-3 md:space-y-4">
						{staticCategories.map((category) => (
							<Link
								key={category.id}
								to={`/${category.id}`}
								onMouseEnter={() => prefetchCategory(category.id)}
								className="group relative p-3 md:p-4 rounded-xl md:rounded-2xl hover:bg-gray-800/50 cursor-pointer transition-all duration-300 overflow-hidden block"
							>
								<div
									className={`absolute inset-0 bg-gradient-to-r ${category.color} opacity-0 group-hover:opacity-10 transition-opacity duration-300 rounded-xl md:rounded-2xl`}
								></div>
								<div className="relative flex items-center justify-between">
									<div className="flex items-center space-x-3 md:space-x-4">
										<div
											className={`p-1.5 md:p-2 rounded-lg md:rounded-xl bg-gradient-to-r ${category.color} shadow-lg`}
										>
											<div className="text-white">
												{category.id === "f1" && (
													<Zap className="w-4 h-4 md:w-5 md:h-5" />
												)}
												{category.id === "nascar" && (
													<Play className="w-4 h-4 md:w-5 md:h-5" />
												)}
												{(category.id === "endurance" ||
													category.id === "drift" ||
													category.id === "tuning" ||
													category.id === "engines") && (
													<Settings className="w-4 h-4 md:w-5 md:h-5" />
												)}
											</div>
										</div>
										<div className="flex flex-col">
											<span className="text-gray-300 font-medium group-hover:text-white transition-colors duration-300 text-sm md:text-base">
												{category.name}
											</span>
											<span className="text-xs text-gray-500">
												{category.count} posts
											</span>
										</div>
									</div>
									<ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-red-400 group-hover:translate-x-1 transition-all duration-300" />
								</div>
							</Link>
						))}
					</div>
				</div>

				{/* Redes Sociais */}
				<div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl md:rounded-3xl p-6 md:p-8 border border-gray-700/50 backdrop-blur-sm">
					<h3 className="text-xl md:text-2xl font-bold text-white mb-4 md:mb-6 flex items-center space-x-3">
						<div className="w-2 h-6 md:h-8 bg-gradient-to-b from-purple-500 to-pink-500 rounded-full"></div>
						<span>Siga-nos</span>
					</h3>
					<div className="space-y-3 md:space-y-4">
						<a
							href="https://www.youtube.com/channel/UCTk9ewLwz0tx80SeKxxPpVQ"
							target="_blank"
							rel="noopener noreferrer"
							className="group flex items-center space-x-3 md:space-x-4 p-3 md:p-4 rounded-xl md:rounded-2xl bg-gradient-to-r from-red-600 to-red-500 hover:from-red-500 hover:to-red-400 transition-all duration-300 shadow-lg hover:shadow-red-500/25 hover:scale-105"
						>
							<Youtube className="w-5 h-5 md:w-6 md:h-6 text-white" />
							<div className="flex-1">
								<span className="text-white font-semibold block text-sm md:text-base">
									YouTube
								</span>
								<span className="text-red-100 text-xs md:text-sm">
									Assista nossos vídeos
								</span>
							</div>
							<ArrowRight className="w-4 h-4 md:w-5 md:h-5 text-white group-hover:translate-x-1 transition-transform duration-300" />
						</a>

						<a
							href="https://instagram.com/torqueforgedmotorsport"
							target="_blank"
							rel="noopener noreferrer"
							className="group flex items-center space-x-3 md:space-x-4 p-3 md:p-4 rounded-xl md:rounded-2xl bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 transition-all duration-300 shadow-lg hover:shadow-purple-500/25 hover:scale-105"
						>
							<Instagram className="w-5 h-5 md:w-6 md:h-6 text-white" />
							<div className="flex-1">
								<span className="text-white font-semibold block text-sm md:text-base">
									Instagram
								</span>
								<span className="text-purple-100 text-xs md:text-sm">
									Fotos exclusivas
								</span>
							</div>
							<ArrowRight className="w-4 h-4 md:w-5 md:h-5 text-white group-hover:translate-x-1 transition-transform duration-300" />
						</a>
					</div>
				</div>

				{/* Newsletter */}
				<div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl md:rounded-3xl p-6 md:p-8 border border-gray-700/50 backdrop-blur-sm">
					<h3 className="text-xl md:text-2xl font-bold text-white mb-4 md:mb-6 flex items-center space-x-3">
						<div className="w-2 h-6 md:h-8 bg-gradient-to-b from-green-500 to-emerald-500 rounded-full"></div>
						<span>Newsletter</span>
					</h3>
					<p className="text-gray-400 mb-4 md:mb-6 leading-relaxed text-sm md:text-base">
						Receba as últimas notícias do motorsport direto no seu email.
					</p>
					<div className="space-y-3 md:space-y-4">
						<input
							type="email"
							placeholder="Seu melhor email"
							className="w-full px-4 md:px-6 py-3 md:py-4 bg-gray-800/50 border border-gray-600/50 rounded-xl md:rounded-2xl text-white placeholder-gray-500 focus:outline-none focus:border-red-500/50 focus:bg-gray-800 transition-all duration-300 backdrop-blur-sm text-sm md:text-base"
						/>
						<button className="w-full bg-gradient-to-r from-red-600 to-red-500 hover:from-red-500 hover:to-red-400 text-white py-3 md:py-4 rounded-xl md:rounded-2xl font-semibold transition-all duration-300 shadow-lg hover:shadow-red-500/25 hover:scale-105 text-sm md:text-base">
							Inscrever-se Agora
						</button>
					</div>
				</div>
			</div>
		</div>
	);
});

// Componente principal Home otimizado
const OptimizedHome = () => {
	return (
		<>
			{/* Hero Section */}
			<HeroSection />

			{/* Posts em Destaque com Suspense */}
			<ErrorBoundary
				FallbackComponent={(props) => (
					<ErrorFallback {...props} section="posts em destaque" />
				)}
				onReset={() => window.location.reload()}
			>
				<Suspense
					fallback={
						<div className="py-16 md:py-24 bg-gradient-to-b from-black to-gray-900">
							<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
								<FeaturedPostsSkeleton />
							</div>
						</div>
					}
				>
					<FeaturedPostsSection />
				</Suspense>
			</ErrorBoundary>

			{/* Últimos Artigos com Sidebar */}
			<div className="py-16 md:py-24 bg-gradient-to-b from-gray-900 to-black">
				<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
					<div className="grid grid-cols-1 lg:grid-cols-3 gap-8 md:gap-12">
						{/* Lista de Posts com Suspense */}
						<ErrorBoundary
							FallbackComponent={(props) => (
								<ErrorFallback {...props} section="últimos artigos" />
							)}
							onReset={() => window.location.reload()}
						>
							<Suspense fallback={<PostListSkeleton />}>
								<PostListSection />
							</Suspense>
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
