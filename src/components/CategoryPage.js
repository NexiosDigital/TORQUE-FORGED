import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
	Calendar,
	User,
	Clock,
	ArrowRight,
	TrendingUp,
	Tag,
	Loader,
} from "lucide-react";
import {
	detectBrowser,
	isMobile,
	getConnectionType,
	logger,
	robustFetch,
	appCache,
	fallbackData,
} from "../utils/crossBrowserUtils";

const CategoryPage = ({ categoryId, title, description, gradient }) => {
	const [categoryPosts, setCategoryPosts] = useState([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState(null);
	const [deviceInfo, setDeviceInfo] = useState({});

	// Detectar informações do dispositivo
	useEffect(() => {
		const browser = detectBrowser();
		const mobile = isMobile();
		const connection = getConnectionType();

		const info = {
			browser,
			mobile,
			connection: connection.effectiveType,
			viewport: {
				width: window.innerWidth,
				height: window.innerHeight,
			},
		};

		setDeviceInfo(info);
		logger.info("CategoryPage - Device Info:", info);
	}, []);

	useEffect(() => {
		let isMounted = true;
		let loadTimeout;

		const loadCategoryPosts = async () => {
			if (!categoryId) {
				logger.error("CategoryPage: categoryId não fornecido");
				setLoading(false);
				return;
			}

			try {
				setLoading(true);
				setError(null);
				logger.info(
					`CategoryPage: Carregando posts para categoria: ${categoryId}`
				);

				// Estratégia otimizada por dispositivo
				if (deviceInfo.mobile) {
					await loadMobileStrategy();
				} else {
					await loadDesktopStrategy();
				}
			} catch (error) {
				logger.error(
					`CategoryPage: Erro ao carregar categoria '${categoryId}':`,
					error
				);

				if (!isMounted) return;

				setError(error.message);

				// Fallback robusto por categoria
				const fallbackPosts = fallbackData.categoriesMap[categoryId] || [];
				setCategoryPosts(fallbackPosts);
			} finally {
				if (isMounted) {
					setLoading(false);
					if (loadTimeout) clearTimeout(loadTimeout);
				}
			}
		};

		const loadMobileStrategy = async () => {
			logger.info(`Mobile strategy para categoria: ${categoryId}`);

			// 1. Cache primeiro
			const cacheKey = `category-${categoryId}`;
			const cached = appCache.get(cacheKey);

			if (cached && isMounted) {
				logger.info(`Cache hit para categoria ${categoryId}`);
				setCategoryPosts(cached);
				setLoading(false);
				return;
			}

			// 2. Fetch com timeout maior para mobile
			const posts = await robustFetch.getPostsByCategory(categoryId, true);

			if (!isMounted) return;

			// 3. Cache e atualizar
			appCache.set(cacheKey, posts);
			setCategoryPosts(posts);

			logger.success(`Mobile strategy concluída para ${categoryId}`, {
				posts: posts.length,
			});
		};

		const loadDesktopStrategy = async () => {
			logger.info(`Desktop strategy para categoria: ${categoryId}`);

			// Carregamento mais direto para desktop
			const posts = await robustFetch.getPostsByCategory(categoryId, true);

			if (!isMounted) return;

			setCategoryPosts(posts);

			logger.success(`Desktop strategy concluída para ${categoryId}`, {
				posts: posts.length,
			});
		};

		// Timeout de segurança baseado no dispositivo
		loadTimeout = setTimeout(
			() => {
				if (loading && isMounted) {
					logger.error(
						`Timeout para categoria ${categoryId} - forçando fallback`
					);
					setError("Timeout de carregamento");

					const fallbackPosts = fallbackData.categoriesMap[categoryId] || [];
					setCategoryPosts(fallbackPosts);
					setLoading(false);
				}
			},
			deviceInfo.mobile ? 20000 : 15000
		);

		// Só carrega se tiver info do dispositivo e categoryId
		if (deviceInfo.browser && categoryId) {
			loadCategoryPosts();
		}

		// Cleanup
		return () => {
			isMounted = false;
			if (loadTimeout) clearTimeout(loadTimeout);
		};
	}, [categoryId, deviceInfo.browser]);

	const formatDate = (dateString) => {
		try {
			const date = new Date(dateString);
			if (isNaN(date.getTime())) return "Data inválida";
			return date.toLocaleDateString("pt-BR");
		} catch (error) {
			return "Data inválida";
		}
	};

	const PostCard = ({ post, index }) => (
		<article className="group bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl md:rounded-3xl overflow-hidden shadow-2xl hover:shadow-red-500/10 transition-all duration-500 hover:scale-105">
			<div className="relative overflow-hidden">
				<img
					src={post.image_url}
					alt={post.title}
					className="w-full h-48 md:h-56 object-cover transition-transform duration-700 group-hover:scale-110"
					loading={index < 6 ? "eager" : "lazy"} // Primeiros 6 com prioridade
				/>
				<div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent"></div>

				<div className="absolute top-3 md:top-4 left-3 md:left-4 flex items-center space-x-2">
					<span
						className={`bg-gradient-to-r ${gradient} text-white px-3 md:px-4 py-1.5 md:py-2 rounded-full text-xs md:text-sm font-semibold shadow-lg`}
					>
						{post.category_name}
					</span>
					{post.trending && (
						<span className="bg-gradient-to-r from-orange-500 to-yellow-500 text-white px-2 md:px-3 py-1 rounded-full text-xs font-bold flex items-center space-x-1">
							<TrendingUp className="w-2.5 h-2.5 md:w-3 md:h-3" />
							<span>TREND</span>
						</span>
					)}
				</div>
			</div>

			<div className="p-4 md:p-8">
				<Link to={`/post/${post.id}`}>
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
						<span>{formatDate(post.created_at)}</span>
					</div>
				</div>

				<div className="mt-4 md:mt-6 pt-4 md:pt-6 border-t border-gray-700">
					<Link
						to={`/post/${post.id}`}
						className="text-red-400 hover:text-red-300 font-semibold text-sm flex items-center space-x-2 group-hover:space-x-3 transition-all duration-300"
					>
						<span>Leia mais</span>
						<ArrowRight className="w-3 h-3 md:w-4 md:h-4" />
					</Link>
				</div>
			</div>
		</article>
	);

	return (
		<div className="min-h-screen pt-20">
			{/* Hero Section - Otimizado para mobile */}
			<div className={`relative py-16 md:py-24 bg-gradient-to-r ${gradient}`}>
				<div className="absolute inset-0 bg-black/60"></div>
				<div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
					<h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black text-white mb-4 md:mb-6">
						{title}
					</h1>
					<p className="text-base md:text-xl text-white/90 max-w-2xl mx-auto">
						{description}
					</p>
				</div>
			</div>

			{/* Posts Grid - Layout responsivo melhorado */}
			<div className="py-12 md:py-16 bg-gradient-to-b from-gray-900 to-black">
				<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
					{loading ? (
						<div className="flex justify-center items-center py-12">
							<Loader className="w-6 h-6 md:w-8 md:h-8 text-red-400 animate-spin" />
							<span className="ml-3 text-gray-400 text-sm md:text-base">
								Carregando posts de {title}...
							</span>
						</div>
					) : error ? (
						<div className="text-center py-12">
							<div className="w-16 h-16 md:w-24 md:h-24 bg-gradient-to-r from-red-600 to-red-500 rounded-2xl md:rounded-3xl flex items-center justify-center mx-auto mb-4 md:mb-6">
								<Tag className="w-8 h-8 md:w-12 md:h-12 text-white" />
							</div>
							<h3 className="text-xl md:text-2xl font-bold text-white mb-4">
								Erro ao carregar posts
							</h3>
							<p className="text-red-400 mb-4 text-sm md:text-base">{error}</p>
							<p className="text-gray-400 mb-6 md:mb-8 max-w-md mx-auto text-sm md:text-base">
								Não foi possível carregar os posts de {title.toLowerCase()}.
								Tente recarregar a página.
							</p>
							<div className="space-y-3 md:space-y-0 md:space-x-4 md:flex md:justify-center">
								<button
									onClick={() => window.location.reload()}
									className="w-full md:w-auto inline-flex items-center justify-center space-x-2 bg-gradient-to-r from-red-600 to-red-500 hover:from-red-500 hover:to-red-400 text-white px-6 py-3 rounded-xl font-semibold transition-all duration-300 shadow-lg hover:shadow-red-500/25 hover:scale-105"
								>
									<span>Tentar Novamente</span>
								</button>
								<Link
									to="/"
									className="w-full md:w-auto inline-flex items-center justify-center space-x-2 border border-gray-600 hover:border-red-500 text-gray-300 hover:text-white px-6 py-3 rounded-xl font-semibold transition-all duration-300"
								>
									<ArrowRight className="w-4 h-4 rotate-180" />
									<span>Voltar ao início</span>
								</Link>
							</div>

							{/* Debug info para mobile */}
							<div className="mt-6 text-xs text-gray-500 font-mono">
								{deviceInfo.browser} |{" "}
								{deviceInfo.mobile ? "Mobile" : "Desktop"} |{" "}
								{deviceInfo.connection}
							</div>
						</div>
					) : categoryPosts.length > 0 ? (
						<>
							<div className="mb-6 md:mb-8">
								<h2 className="text-xl md:text-2xl font-bold text-white mb-2">
									{categoryPosts.length}{" "}
									{categoryPosts.length === 1
										? "post encontrado"
										: "posts encontrados"}
								</h2>
								<p className="text-gray-400 text-sm md:text-base">
									Últimas publicações sobre {title.toLowerCase()}
								</p>

								{/* Debug info para desenvolvimento */}
								{process.env.NODE_ENV === "development" && (
									<div className="mt-2 text-xs text-gray-500 font-mono">
										{deviceInfo.browser} |{" "}
										{deviceInfo.mobile ? "Mobile" : "Desktop"} |{" "}
										{deviceInfo.connection}
									</div>
								)}
							</div>

							{/* Grid responsivo otimizado */}
							<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
								{categoryPosts.map((post, index) => (
									<PostCard key={post.id} post={post} index={index} />
								))}
							</div>

							{/* Load more button para mobile se muitos posts */}
							{categoryPosts.length > 6 && deviceInfo.mobile && (
								<div className="text-center mt-8">
									<button className="bg-gradient-to-r from-gray-800 to-gray-700 hover:from-gray-700 hover:to-gray-600 text-white px-6 py-3 rounded-xl font-semibold transition-all duration-300">
										Carregar Mais Posts
									</button>
								</div>
							)}
						</>
					) : (
						<div className="text-center py-12 md:py-16">
							<div className="w-16 h-16 md:w-24 md:h-24 bg-gradient-to-r from-gray-800 to-gray-700 rounded-2xl md:rounded-3xl flex items-center justify-center mx-auto mb-4 md:mb-6">
								<Tag className="w-8 h-8 md:w-12 md:h-12 text-gray-500" />
							</div>
							<h3 className="text-xl md:text-2xl font-bold text-white mb-4">
								Nenhum post encontrado
							</h3>
							<p className="text-gray-400 mb-6 md:mb-8 max-w-md mx-auto text-sm md:text-base">
								Ainda não há posts publicados na categoria {title.toLowerCase()}
								. Volte em breve para ver novos conteúdos!
							</p>
							<div className="space-y-3 md:space-y-0 md:space-x-4 md:flex md:justify-center">
								<Link
									to="/"
									className="w-full md:w-auto inline-flex items-center justify-center space-x-2 bg-gradient-to-r from-red-600 to-red-500 hover:from-red-500 hover:to-red-400 text-white px-6 py-3 rounded-xl font-semibold transition-all duration-300 shadow-lg hover:shadow-red-500/25 hover:scale-105"
								>
									<ArrowRight className="w-4 h-4 rotate-180" />
									<span>Voltar ao início</span>
								</Link>
								<Link
									to="/f1"
									className="w-full md:w-auto inline-flex items-center justify-center space-x-2 border border-gray-600 hover:border-red-500 text-gray-300 hover:text-white px-6 py-3 rounded-xl font-semibold transition-all duration-300"
								>
									<span>Ver Fórmula 1</span>
									<ArrowRight className="w-4 h-4" />
								</Link>
							</div>

							{/* Debug info */}
							<div className="mt-6 text-xs text-gray-500 font-mono">
								{deviceInfo.browser} |{" "}
								{deviceInfo.mobile ? "Mobile" : "Desktop"} | Category:{" "}
								{categoryId}
							</div>
						</div>
					)}
				</div>
			</div>
		</div>
	);
};

export default CategoryPage;
