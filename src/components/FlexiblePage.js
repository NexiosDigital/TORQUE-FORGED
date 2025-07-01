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
	Grid,
	Folder,
	Eye,
} from "lucide-react";
import {
	useCategoryBySlug,
	useCategoryChildren,
	usePostsByCategory,
	usePrefetch,
	useCategoryBreadcrumb,
} from "../hooks/usePostsQuery";
import CategoryBreadcrumb from "./CategoryBreadcrumb";
import { ErrorBoundary } from "react-error-boundary";

// PostCard otimizado
const HierarchicalPostCard = React.memo(({ post, index, categoryColor }) => {
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
					<span
						className={`bg-gradient-to-r ${
							categoryColor || "from-red-600 to-red-500"
						} text-white px-4 py-2 rounded-full text-sm font-bold shadow-lg`}
					>
						{post.category_name || post.category}
					</span>
					{post.trending && (
						<span className="bg-gradient-to-r from-orange-500 to-yellow-500 text-white px-3 py-1 rounded-full text-xs font-bold flex items-center space-x-1">
							<TrendingUp className="w-3 h-3" />
							<span>TREND</span>
						</span>
					)}
				</div>

				{/* View count se disponível */}
				{post.view_count && (
					<div className="absolute top-4 right-4">
						<div className="bg-black/50 backdrop-blur-sm text-white px-2 py-1 rounded-full text-xs flex items-center space-x-1">
							<Eye className="w-3 h-3" />
							<span>{post.view_count}</span>
						</div>
					</div>
				)}
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
							<span>{post.author || "Autor"}</span>
						</div>
						<div className="flex items-center space-x-1">
							<Clock className="w-3 h-3" />
							<span>{post.read_time || "5 min"}</span>
						</div>
					</div>
					<div className="flex items-center space-x-1">
						<Calendar className="w-3 h-3" />
						<span>{formatDate}</span>
					</div>
				</div>

				{/* Tags se disponível */}
				{post.tags && Array.isArray(post.tags) && post.tags.length > 0 && (
					<div className="flex flex-wrap gap-1 mb-4">
						{post.tags.slice(0, 3).map((tag, tagIndex) => (
							<span
								key={tagIndex}
								className="bg-gray-700/50 text-gray-400 px-2 py-1 rounded-md text-xs"
							>
								#{tag}
							</span>
						))}
						{post.tags.length > 3 && (
							<span className="text-gray-500 text-xs">
								+{post.tags.length - 3}
							</span>
						)}
					</div>
				)}

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

// Error fallback
const ErrorFallback = ({ error, resetErrorBoundary, section }) => (
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

// Loading skeleton
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

// Componente de subcategorias
const SubcategoriesGrid = ({
	subcategories,
	parentCategory,
	onCategoryHover,
}) => {
	if (!subcategories || subcategories.length === 0) return null;

	return (
		<div className="mb-16">
			<div className="flex items-center space-x-3 mb-8">
				<Folder className="w-6 h-6 text-red-400" />
				<h2 className="text-3xl font-black text-white">
					Explore por Subcategoria
				</h2>
			</div>

			<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
				{subcategories.map((subcategory, index) => (
					<Link
						key={subcategory.id}
						to={`/${subcategory.slug}`}
						onMouseEnter={() =>
							onCategoryHover && onCategoryHover(subcategory.id)
						}
						className="group"
					>
						<div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl p-6 border border-gray-700/50 hover:border-red-500/50 transition-all duration-300 hover:scale-105 hover:shadow-xl hover:shadow-red-500/10">
							<div className="flex items-center space-x-3 mb-4">
								<div
									className={`w-12 h-12 rounded-xl bg-gradient-to-r ${
										subcategory.color ||
										parentCategory?.color ||
										"from-gray-600 to-gray-500"
									} flex items-center justify-center shadow-lg`}
								>
									<span className="text-xl">{subcategory.icon || "📁"}</span>
								</div>
								<div className="flex-1">
									<h3 className="text-lg font-bold text-white group-hover:text-red-400 transition-colors duration-300">
										{subcategory.name}
									</h3>
									<p className="text-gray-400 text-sm">
										{subcategory.post_count || 0} posts
									</p>
								</div>
							</div>

							{subcategory.description && (
								<p className="text-gray-400 text-sm leading-relaxed line-clamp-2">
									{subcategory.description}
								</p>
							)}
						</div>
					</Link>
				))}
			</div>
		</div>
	);
};

// Componente principal - CORRIGIDO para dados reais
const FlexiblePage = ({ pageKey, section }) => {
	const params = useParams();

	// Determinar categorySlug da URL
	const categorySlug = useMemo(() => {
		const slug =
			pageKey ||
			params.brand ||
			params.section ||
			params.category ||
			params.pageKey ||
			params.categorySlug ||
			section;

		console.log("🔍 FlexiblePage: Slug determinado =", slug);
		return slug;
	}, [pageKey, params, section]);

	// Buscar dados da categoria - SEMPRE DO BANCO
	const {
		data: currentCategory,
		isLoading: categoryLoading,
		error: categoryError,
	} = useCategoryBySlug(categorySlug, {
		enabled: !!categorySlug,
		retry: 1,
	});

	// Debug da busca da categoria
	React.useEffect(() => {
		if (categorySlug) {
			console.log(`🔍 FlexiblePage: Buscando categoria "${categorySlug}"`);
		}
		if (currentCategory) {
			console.log("✅ FlexiblePage: Categoria encontrada:", currentCategory);
		}
		if (categoryError) {
			console.error(
				"❌ FlexiblePage: Erro ao buscar categoria:",
				categoryError
			);
		}
	}, [categorySlug, currentCategory, categoryError]);

	// Buscar subcategorias se existirem
	const { data: subcategories = [], isLoading: subcategoriesLoading } =
		useCategoryChildren(currentCategory?.id, {
			enabled: !!currentCategory?.id,
		});

	// Buscar posts da categoria
	const {
		data: posts = [],
		isLoading: postsLoading,
		error: postsError,
	} = usePostsByCategory(currentCategory?.id, {
		enabled: !!currentCategory?.id,
	});

	// Buscar breadcrumb para navegação
	const { data: breadcrumb = [] } = useCategoryBreadcrumb(currentCategory?.id, {
		enabled: !!currentCategory?.id,
	});

	const { prefetchCategory } = usePrefetch();

	// Estatísticas da categoria
	const categoryStats = useMemo(() => {
		if (!currentCategory) return null;

		return {
			level: currentCategory.level,
			totalPosts: posts.length,
			totalSubcategories: subcategories.length,
			isActive: currentCategory.is_active,
			hasContent: posts.length > 0 || subcategories.length > 0,
		};
	}, [currentCategory, posts.length, subcategories.length]);

	// Loading state
	if (categoryLoading) {
		console.log("⏳ FlexiblePage: Carregando categoria...");
		return <CategorySkeleton />;
	}

	// Error state - categoria não encontrada
	if (categoryError || !currentCategory) {
		console.error("❌ FlexiblePage: Categoria não encontrada ou erro", {
			slug: categorySlug,
			error: categoryError?.message,
			category: currentCategory,
		});

		return (
			<div className="min-h-screen pt-20 bg-gradient-to-br from-black via-gray-900 to-black">
				<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
					<div className="text-center py-16">
						<div className="w-20 h-20 bg-gradient-to-r from-gray-600 to-gray-500 rounded-3xl flex items-center justify-center mx-auto mb-6">
							<AlertCircle className="w-10 h-10 text-gray-400" />
						</div>
						<h3 className="text-2xl font-bold text-white mb-4">
							Categoria "{categorySlug}" não encontrada
						</h3>
						<p className="text-gray-400 mb-4">
							Esta categoria não existe no sistema ou não está ativa.
						</p>
						<div className="text-sm text-gray-500 mb-8">
							Erro: {categoryError?.message || "Categoria não existe"}
						</div>
						<Link
							to="/"
							className="inline-flex items-center space-x-2 bg-gradient-to-r from-red-600 to-red-500 hover:from-red-500 hover:to-red-400 text-white px-8 py-4 rounded-2xl font-bold transition-all duration-300 shadow-xl hover:shadow-red-500/25 hover:scale-105"
						>
							<ArrowLeft className="w-4 h-4" />
							<span>Voltar ao início</span>
						</Link>
					</div>
				</div>
			</div>
		);
	}

	console.log("✅ FlexiblePage: Renderizando categoria:", currentCategory.name);

	return (
		<div className="min-h-screen pt-20 bg-gradient-to-br from-black via-gray-900 to-black">
			{/* Hero Section */}
			<div
				className={`relative py-24 bg-gradient-to-r ${
					currentCategory.color || "from-gray-600 to-gray-500"
				} overflow-hidden`}
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
					<CategoryBreadcrumb
						categoryId={currentCategory.id}
						currentCategory={currentCategory}
					/>

					{/* Header Content */}
					<div className="text-center">
						<div className="flex items-center justify-center mb-6">
							<div className="text-6xl mr-4">
								{currentCategory.icon || "📁"}
							</div>
							<div>
								<h1 className="text-5xl md:text-6xl font-black text-white mb-4 leading-tight">
									{currentCategory.name}
								</h1>
								<p className="text-xl md:text-2xl text-white/90 max-w-3xl mx-auto leading-relaxed">
									{currentCategory.description ||
										`Explore todo o conteúdo sobre ${currentCategory.name.toLowerCase()}`}
								</p>
							</div>
						</div>

						{/* Stats dinâmicas */}
						{categoryStats && (
							<div className="flex flex-wrap items-center justify-center gap-4 mt-8">
								<div className="bg-white/10 backdrop-blur-sm px-6 py-3 rounded-full border border-white/20">
									<span className="text-white font-bold">
										Nível {categoryStats.level}
									</span>
								</div>
								<div className="bg-white/10 backdrop-blur-sm px-6 py-3 rounded-full border border-white/20">
									<span className="text-white font-bold">
										{categoryStats.totalPosts}{" "}
										{categoryStats.totalPosts === 1 ? "Post" : "Posts"}
									</span>
								</div>
								{categoryStats.totalSubcategories > 0 && (
									<div className="bg-white/10 backdrop-blur-sm px-6 py-3 rounded-full border border-white/20">
										<span className="text-white font-bold">
											{categoryStats.totalSubcategories} Subcategorias
										</span>
									</div>
								)}
								<div className="bg-white/10 backdrop-blur-sm px-6 py-3 rounded-full border border-white/20">
									<span className="text-white font-bold">
										{categoryStats.isActive
											? "Categoria Ativa"
											: "Categoria Inativa"}
									</span>
								</div>
							</div>
						)}
					</div>
				</div>
			</div>

			{/* Content Section */}
			<div className="py-16">
				<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
					{/* Subcategorias */}
					<SubcategoriesGrid
						subcategories={subcategories}
						parentCategory={currentCategory}
						onCategoryHover={prefetchCategory}
					/>

					{/* Posts Section */}
					<ErrorBoundary
						FallbackComponent={(props) => (
							<ErrorFallback {...props} section="posts" />
						)}
						onReset={() => window.location.reload()}
					>
						{postsLoading ? (
							<div>
								<div className="flex items-center space-x-3 mb-8">
									<Grid className="w-6 h-6 text-red-400" />
									<div className="w-48 h-8 bg-gray-700 rounded-full animate-pulse"></div>
								</div>
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
							</div>
						) : postsError ? (
							<ErrorFallback
								error={postsError}
								resetErrorBoundary={() => window.location.reload()}
								section="posts"
							/>
						) : posts.length === 0 ? (
							<div className="text-center py-16">
								<div
									className={`w-20 h-20 bg-gradient-to-r ${
										currentCategory.color || "from-gray-600 to-gray-500"
									} rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-xl`}
								>
									<Zap className="w-10 h-10 text-white" />
								</div>
								<h3 className="text-2xl font-bold text-white mb-4">
									{subcategories.length > 0
										? "Explore as subcategorias"
										: "Posts chegando em breve"}
								</h3>
								<p className="text-gray-400 mb-8 max-w-md mx-auto">
									{subcategories.length > 0
										? `Esta categoria possui ${subcategories.length} subcategorias com conteúdo específico. Explore acima!`
										: `Novos posts sobre ${currentCategory.name.toLowerCase()} serão publicados em breve. Volte em breve!`}
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
									<div className="flex items-center justify-center space-x-3 mb-6">
										<Grid className="w-6 h-6 text-red-400" />
										<h2 className="text-4xl font-black text-white bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
											Últimas sobre {currentCategory.name}
										</h2>
									</div>
									<p className="text-xl text-gray-400 max-w-2xl mx-auto">
										Fique por dentro de tudo que acontece no mundo{" "}
										{currentCategory.name.toLowerCase()}
									</p>
								</div>

								<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
									{posts.map((post, index) => (
										<HierarchicalPostCard
											key={`post-${post.id}-${index}`}
											post={post}
											index={index}
											categoryColor={currentCategory.color}
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
