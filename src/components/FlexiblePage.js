import React, { useMemo } from "react";
import { useParams, Link } from "react-router-dom";
import {
	ArrowLeft,
	Calendar,
	User,
	Clock,
	TrendingUp,
	ChevronRight,
	Zap,
	AlertCircle,
	RefreshCw,
	Database,
} from "lucide-react";
import {
	usePostsByCategory,
	usePrefetch,
	useCategories,
	useCacheUtils,
} from "../hooks/usePostsQuery";
import { ErrorBoundary } from "react-error-boundary";

// PostCard otimizado
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
		<article className="group bg-gradient-to-br from-gray-900 to-gray-800 rounded-3xl overflow-hidden shadow-2xl hover:shadow-xl transition-all duration-500 hover:scale-[1.02] border border-gray-700/50">
			{/* Image */}
			<div className="relative overflow-hidden">
				<img
					src={post.image_url}
					alt={post.title}
					className="w-full h-56 object-cover transition-transform duration-700 group-hover:scale-110"
					loading={index < 6 ? "eager" : "lazy"}
					onError={(e) => {
						e.target.src =
							"https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&h=600&fit=crop";
					}}
				/>
				<div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent"></div>

				{/* Badge */}
				<div className="absolute top-4 left-4 flex items-center space-x-2">
					<span className="bg-gradient-to-r from-red-600 to-red-500 text-white px-4 py-2 rounded-full text-sm font-bold shadow-lg">
						{post.category_name}
					</span>
					{post.trending && (
						<span className="bg-gradient-to-r from-orange-500 to-yellow-500 text-white px-3 py-1 rounded-full text-xs font-bold flex items-center space-x-1">
							<TrendingUp className="w-3 h-3" />
							<span>TREND</span>
						</span>
					)}
				</div>
			</div>

			{/* Content */}
			<div className="p-6">
				<Link
					to={`/post/${post.id}`}
					onMouseEnter={() => prefetchPost(post.id)}
				>
					<h3 className="text-xl font-bold text-white mb-3 group-hover:text-red-400 transition-colors duration-300 leading-tight line-clamp-2">
						{post.title}
					</h3>
				</Link>
				<p className="text-gray-400 mb-4 leading-relaxed line-clamp-3 text-sm">
					{post.excerpt}
				</p>

				{/* Meta */}
				<div className="flex items-center justify-between text-xs text-gray-500 mb-4">
					<div className="flex items-center space-x-3">
						<div className="flex items-center space-x-1">
							<User className="w-3 h-3" />
							<span>{post.author}</span>
						</div>
						<div className="flex items-center space-x-1">
							<Clock className="w-3 h-3" />
							<span>{post.read_time}</span>
						</div>
					</div>
					<div className="flex items-center space-x-1">
						<Calendar className="w-3 h-3" />
						<span>{formatDate}</span>
					</div>
				</div>

				{/* Read more */}
				<Link
					to={`/post/${post.id}`}
					onMouseEnter={() => prefetchPost(post.id)}
					className="text-red-400 hover:text-red-300 font-bold text-sm flex items-center space-x-2 group-hover:space-x-3 transition-all duration-300"
				>
					<span>Leia mais</span>
					<ChevronRight className="w-4 h-4" />
				</Link>
			</div>
		</article>
	);
});

// Error fallback com opção de refresh de categorias
const ErrorFallback = ({ error, resetErrorBoundary, section }) => {
	const { refreshCategories } = useCacheUtils();

	const handleRefreshCategories = async () => {
		try {
			await refreshCategories();
			resetErrorBoundary();
		} catch (error) {
			console.error("Erro ao atualizar categorias:", error);
		}
	};

	return (
		<div className="text-center py-16">
			<div className="w-20 h-20 bg-gradient-to-r from-red-600 to-red-500 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-2xl">
				<AlertCircle className="w-10 h-10 text-white" />
			</div>
			<h3 className="text-2xl font-bold text-white mb-4">
				Erro ao carregar {section}
			</h3>
			<p className="text-gray-400 mb-4">
				{error?.message?.includes("categoria")
					? "Esta categoria pode não existir no banco de dados."
					: "Algo deu errado. Tente novamente."}
			</p>
			<div className="space-y-3">
				<button
					onClick={resetErrorBoundary}
					className="bg-gradient-to-r from-red-600 to-red-500 hover:from-red-500 hover:to-red-400 text-white px-8 py-3 rounded-2xl font-bold transition-all duration-300 shadow-xl hover:shadow-red-500/25 hover:scale-105 flex items-center space-x-2 mx-auto"
				>
					<RefreshCw className="w-4 h-4" />
					<span>Tentar Novamente</span>
				</button>

				{section?.includes("categoria") && (
					<button
						onClick={handleRefreshCategories}
						className="bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white px-6 py-2 rounded-xl font-semibold transition-all duration-300 flex items-center space-x-2 mx-auto text-sm"
					>
						<Database className="w-4 h-4" />
						<span>Atualizar Categorias</span>
					</button>
				)}
			</div>
		</div>
	);
};

// Loading skeleton para categoria
const CategorySkeleton = () => (
	<div className="min-h-screen pt-20 bg-gradient-to-br from-black via-gray-900 to-black">
		{/* Hero skeleton */}
		<div className="relative py-24 bg-gradient-to-r from-gray-800 to-gray-700 animate-pulse">
			<div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
				<div className="w-48 h-8 bg-gray-600 rounded-full mx-auto mb-6"></div>
				<div className="w-96 h-16 bg-gray-600 rounded-2xl mx-auto mb-6"></div>
				<div className="w-64 h-6 bg-gray-600 rounded-full mx-auto"></div>
			</div>
		</div>

		{/* Content skeleton */}
		<div className="py-16">
			<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
				<div className="mb-8">
					<div className="w-48 h-6 bg-gray-700 rounded-full mb-2"></div>
					<div className="w-64 h-4 bg-gray-700 rounded-full"></div>
				</div>

				<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
					{Array.from({ length: 6 }).map((_, i) => (
						<div key={`skeleton-${i}`} className="animate-pulse">
							<div className="bg-gray-800 rounded-3xl overflow-hidden">
								<div className="h-56 bg-gray-700"></div>
								<div className="p-6">
									<div className="h-4 bg-gray-700 rounded-full mb-3"></div>
									<div className="h-4 bg-gray-700 rounded-full w-3/4 mb-3"></div>
									<div className="h-3 bg-gray-700 rounded-full w-1/2"></div>
								</div>
							</div>
						</div>
					))}
				</div>
			</div>
		</div>
	</div>
);

// Componente principal flexível - 100% dinâmico do banco
const FlexiblePage = ({ pageKey, section }) => {
	const params = useParams();

	// Buscar TODAS as categorias do banco de dados - SEMPRE DINÂMICO
	const {
		data: categories = [],
		isLoading: categoriesLoading,
		error: categoriesError,
		refetch: refetchCategories,
	} = useCategories({
		// Configurações específicas para garantir dados atualizados
		staleTime: 30 * 60 * 1000, // 30 min
		refetchOnWindowFocus: false,
		refetchOnMount: false,
		retry: (failureCount, error) => {
			// Permitir retry para categorias (crítico)
			return failureCount < 2;
		},
	});

	// Determinar categoryId baseado nos parâmetros
	const categoryId = useMemo(() => {
		return (
			pageKey ||
			params.brand ||
			params.section ||
			params.category ||
			params.pageKey
		);
	}, [pageKey, params]);

	// Buscar configuração da categoria no banco de dados DINAMICAMENTE
	const categoryConfig = useMemo(() => {
		if (!categories.length || !categoryId) return null;

		// Buscar categoria pelo ID
		const category = categories.find((cat) => cat.id === categoryId);
		if (!category) {
			console.warn(
				`⚠️ Categoria "${categoryId}" não encontrada no banco de dados`
			);
			return null;
		}

		// Converter dados do banco para formato esperado pelo componente
		return {
			id: category.id,
			title: category.name,
			description: category.description,
			gradient: category.color || "from-red-500 to-orange-500",
			icon: category.icon || "🏁", // Ícone do banco ou padrão
			type: "category",
			categoryId: category.id,
			count: category.count || 0,
		};
	}, [categories, categoryId]);

	// Hook de posts baseado no categoryId
	const {
		data: posts = [],
		isLoading: postsLoading,
		error: postsError,
		refetch: refetchPosts,
	} = usePostsByCategory(categoryId, {
		enabled: !!categoryId,
	});

	// Debug em desenvolvimento
	React.useEffect(() => {
		if (process.env.NODE_ENV === "development") {
			console.log("🔍 FlexiblePage Debug:", {
				categoryId,
				categoriesCount: categories.length,
				categoryFound: !!categoryConfig,
				postsCount: posts.length,
				categoriesFromFallback:
					categories.length === 1 && categories[0].id === "geral",
			});
		}
	}, [categoryId, categories, categoryConfig, posts]);

	// Loading states
	if (categoriesLoading) {
		return <CategorySkeleton />;
	}

	// Error states para categorias
	if (categoriesError) {
		return (
			<div className="min-h-screen pt-20 bg-gradient-to-br from-black via-gray-900 to-black">
				<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
					<ErrorFallback
						error={categoriesError}
						resetErrorBoundary={() => {
							refetchCategories();
							window.location.reload();
						}}
						section="categorias"
					/>
				</div>
			</div>
		);
	}

	// Categoria não encontrada no banco
	if (!categoryConfig) {
		return (
			<div className="min-h-screen pt-20 bg-gradient-to-br from-black via-gray-900 to-black">
				<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
					<div className="text-center py-16">
						<div className="w-20 h-20 bg-gradient-to-r from-yellow-600 to-orange-500 rounded-3xl flex items-center justify-center mx-auto mb-6">
							<AlertCircle className="w-10 h-10 text-white" />
						</div>
						<h3 className="text-2xl font-bold text-white mb-4">
							Categoria "{categoryId}" não encontrada
						</h3>
						<p className="text-gray-400 mb-4">
							Esta categoria não existe no banco de dados ou não está ativa.
						</p>

						{/* Mostrar categorias disponíveis */}
						{categories.length > 0 && (
							<div className="mb-8">
								<p className="text-gray-500 mb-4">Categorias disponíveis:</p>
								<div className="flex flex-wrap gap-2 justify-center max-w-2xl mx-auto">
									{categories.map((cat) => (
										<Link
											key={cat.id}
											to={`/${cat.id}`}
											className="bg-gray-800 hover:bg-red-600 text-gray-300 hover:text-white px-4 py-2 rounded-full text-sm transition-all duration-300"
										>
											{cat.name}
										</Link>
									))}
								</div>
							</div>
						)}

						<div className="space-y-4">
							<button
								onClick={() => refetchCategories()}
								className="inline-flex items-center space-x-2 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white px-6 py-3 rounded-2xl font-bold transition-all duration-300 shadow-xl hover:shadow-blue-500/25 hover:scale-105"
							>
								<Database className="w-4 h-4" />
								<span>Atualizar Categorias</span>
							</button>

							<Link
								to="/"
								className="inline-flex items-center space-x-2 border-2 border-gray-600 hover:border-red-500 text-gray-300 hover:text-white px-6 py-3 rounded-2xl font-bold transition-all duration-300 ml-4"
							>
								<ArrowLeft className="w-4 h-4" />
								<span>Voltar ao início</span>
							</Link>
						</div>
					</div>
				</div>
			</div>
		);
	}

	return (
		<div className="min-h-screen pt-20 bg-gradient-to-br from-black via-gray-900 to-black">
			{/* Hero Section - Dados dinâmicos do banco */}
			<div
				className={`relative py-24 bg-gradient-to-r ${categoryConfig.gradient} overflow-hidden`}
			>
				<div className="absolute inset-0 bg-black/40"></div>
				<div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent"></div>

				{/* Floating elements */}
				<div className="absolute inset-0">
					<div className="absolute top-1/4 left-1/4 w-96 h-96 bg-white/5 rounded-full blur-3xl animate-pulse"></div>
					<div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-white/5 rounded-full blur-3xl animate-pulse delay-1000"></div>
				</div>

				<div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
					{/* Breadcrumb dinâmico */}
					<nav className="mb-8">
						<div className="flex items-center space-x-2 text-white/80">
							<Link
								to="/"
								className="hover:text-white transition-colors duration-300"
							>
								Home
							</Link>
							<ChevronRight className="w-4 h-4" />
							<span className="text-white">{categoryConfig.title}</span>
						</div>
					</nav>

					{/* Header Content - Dados do banco */}
					<div className="text-center">
						<div className="flex items-center justify-center mb-6">
							<div className="text-6xl mr-4">{categoryConfig.icon}</div>
							<div>
								<h1 className="text-5xl md:text-6xl font-black text-white mb-4 leading-tight">
									{categoryConfig.title}
								</h1>
								<p className="text-xl md:text-2xl text-white/90 max-w-3xl mx-auto leading-relaxed">
									{categoryConfig.description}
								</p>
							</div>
						</div>

						{/* Stats dinâmicas */}
						<div className="flex flex-wrap items-center justify-center gap-4 mt-8">
							<div className="bg-white/10 backdrop-blur-sm px-6 py-3 rounded-full border border-white/20">
								<span className="text-white font-bold">
									{posts.length} {posts.length === 1 ? "Post" : "Posts"}
								</span>
							</div>
							{categoryConfig.count > 0 && (
								<div className="bg-white/10 backdrop-blur-sm px-6 py-3 rounded-full border border-white/20">
									<span className="text-white font-bold">
										{categoryConfig.count} Total
									</span>
								</div>
							)}
							<div className="bg-white/10 backdrop-blur-sm px-6 py-3 rounded-full border border-white/20">
								<span className="text-white font-bold">
									<Database className="w-4 h-4 inline mr-2" />
									Dinâmico
								</span>
							</div>
						</div>
					</div>
				</div>
			</div>

			{/* Posts Section */}
			<div className="py-16">
				<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
					<ErrorBoundary
						FallbackComponent={(props) => (
							<ErrorFallback {...props} section="posts" />
						)}
						onReset={() => {
							refetchPosts();
							refetchCategories();
						}}
					>
						{postsLoading ? (
							<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
								{Array.from({ length: 6 }).map((_, i) => (
									<div
										key={`loading-${i}`}
										className="bg-gray-800 rounded-3xl overflow-hidden animate-pulse"
									>
										<div className="h-56 bg-gray-700"></div>
										<div className="p-6">
											<div className="h-4 bg-gray-700 rounded-full mb-3"></div>
											<div className="h-4 bg-gray-700 rounded-full w-3/4 mb-3"></div>
											<div className="h-3 bg-gray-700 rounded-full w-1/2"></div>
										</div>
									</div>
								))}
							</div>
						) : postsError ? (
							<ErrorFallback
								error={postsError}
								resetErrorBoundary={() => refetchPosts()}
								section="posts"
							/>
						) : posts.length === 0 ? (
							<div className="text-center py-16">
								<div
									className={`w-20 h-20 bg-gradient-to-r ${categoryConfig.gradient} rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-xl`}
								>
									<Zap className="w-10 h-10 text-white" />
								</div>
								<h3 className="text-2xl font-bold text-white mb-4">
									Posts chegando em breve
								</h3>
								<p className="text-gray-400 mb-8 max-w-md mx-auto">
									Novos posts sobre {categoryConfig.title.toLowerCase()} serão
									publicados em breve. Volte em breve!
								</p>
								<Link
									to="/"
									className="inline-flex items-center space-x-2 bg-gradient-to-r from-red-600 to-red-500 hover:from-red-500 hover:to-red-400 text-white px-8 py-4 rounded-2xl font-bold transition-all duration-300 shadow-xl hover:shadow-red-500/25 hover:scale-105"
								>
									<ArrowLeft className="w-4 h-4" />
									<span>Voltar ao início</span>
								</Link>
							</div>
						) : (
							<>
								<div className="text-center mb-16">
									<h2 className="text-4xl font-black text-white mb-6 bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
										Últimas sobre {categoryConfig.title}
									</h2>
									<p className="text-xl text-gray-400 max-w-2xl mx-auto">
										Fique por dentro de tudo que acontece no mundo{" "}
										{categoryConfig.title.toLowerCase()}
									</p>
								</div>

								<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
									{posts.map((post, index) => (
										<PostCard
											key={`post-${post.id}-${index}`}
											post={post}
											index={index}
										/>
									))}
								</div>

								{posts.length > 9 && (
									<div className="text-center mt-16">
										<button className="bg-gradient-to-r from-red-600 to-red-500 hover:from-red-500 hover:to-red-400 text-white px-8 py-4 rounded-2xl font-bold transition-all duration-300 shadow-xl hover:shadow-red-500/25 hover:scale-105">
											Carregar mais posts
										</button>
									</div>
								)}
							</>
						)}
					</ErrorBoundary>
				</div>
			</div>
		</div>
	);
};

export default FlexiblePage;
