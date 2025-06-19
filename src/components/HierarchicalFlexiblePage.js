import { useParams, Link } from "react-router-dom";
import { ArrowLeft, AlertCircle, Folder, Grid } from "lucide-react";
import {
	useCategoryBySlug,
	useCategoryChildren,
	usePostsByCategory,
	usePrefetch,
} from "../hooks/usePostsQuery";
import CategoryBreadcrumb from "./CategoryBreadcrumb";
import PostCard from "./PostCard"; // Componente existente
import { ErrorBoundary } from "react-error-boundary";

const HierarchicalFlexiblePage = ({ pageKey, section }) => {
	const params = useParams();

	// Determinar slug da categoria
	const categorySlug =
		pageKey || params.category || params.brand || params.section || section;

	// Buscar dados da categoria
	const {
		data: currentCategory,
		isLoading: categoryLoading,
		error: categoryError,
	} = useCategoryBySlug(categorySlug, {
		enabled: !!categorySlug,
	});

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

	const { prefetchCategory } = usePrefetch();

	// Loading state
	if (categoryLoading) {
		return <CategorySkeleton />;
	}

	// Error state
	if (categoryError || !currentCategory) {
		return (
			<CategoryNotFoundError
				categorySlug={categorySlug}
				error={categoryError}
			/>
		);
	}

	return (
		<div className="min-h-screen pt-20 bg-gradient-to-br from-black via-gray-900 to-black">
			{/* Hero Section */}
			<div
				className={`relative py-24 bg-gradient-to-r ${currentCategory.color} overflow-hidden`}
			>
				<div className="absolute inset-0 bg-black/40"></div>
				<div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent"></div>

				{/* Floating elements */}
				<div className="absolute inset-0">
					<div className="absolute top-1/4 left-1/4 w-96 h-96 bg-white/5 rounded-full blur-3xl animate-pulse"></div>
					<div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-white/5 rounded-full blur-3xl animate-pulse delay-1000"></div>
				</div>

				<div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
					{/* Breadcrumb */}
					<CategoryBreadcrumb
						categoryId={currentCategory.id}
						currentCategory={currentCategory}
					/>

					{/* Header Content */}
					<div className="text-center">
						<div className="flex items-center justify-center mb-6">
							<div className="text-6xl mr-4">{currentCategory.icon}</div>
							<div>
								<h1 className="text-5xl md:text-6xl font-black text-white mb-4 leading-tight">
									{currentCategory.name}
								</h1>
								<p className="text-xl md:text-2xl text-white/90 max-w-3xl mx-auto leading-relaxed">
									{currentCategory.description}
								</p>
							</div>
						</div>

						{/* Stats */}
						<div className="flex flex-wrap items-center justify-center gap-4 mt-8">
							<div className="bg-white/10 backdrop-blur-sm px-6 py-3 rounded-full border border-white/20">
								<span className="text-white font-bold">
									Nível {currentCategory.level}
								</span>
							</div>
							<div className="bg-white/10 backdrop-blur-sm px-6 py-3 rounded-full border border-white/20">
								<span className="text-white font-bold">
									{posts.length} {posts.length === 1 ? "Post" : "Posts"}
								</span>
							</div>
							{subcategories.length > 0 && (
								<div className="bg-white/10 backdrop-blur-sm px-6 py-3 rounded-full border border-white/20">
									<span className="text-white font-bold">
										{subcategories.length} Subcategorias
									</span>
								</div>
							)}
						</div>
					</div>
				</div>
			</div>

			{/* Content Section */}
			<div className="py-16">
				<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
					{/* Subcategorias */}
					{subcategories.length > 0 && (
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
										onMouseEnter={() => prefetchCategory(subcategory.id)}
										className="group"
									>
										<div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl p-6 border border-gray-700/50 hover:border-red-500/50 transition-all duration-300 hover:scale-105 hover:shadow-xl hover:shadow-red-500/10">
											<div className="flex items-center space-x-3 mb-4">
												<div
													className={`w-12 h-12 rounded-xl bg-gradient-to-r ${
														subcategory.color || currentCategory.color
													} flex items-center justify-center shadow-lg`}
												>
													<span className="text-xl">
														{subcategory.icon || "📁"}
													</span>
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
					)}

					{/* Posts Section */}
					<ErrorBoundary
						FallbackComponent={(props) => (
							<PostsErrorFallback {...props} category={currentCategory.name} />
						)}
						onReset={() => window.location.reload()}
					>
						{postsLoading ? (
							<PostsLoadingSkeleton />
						) : postsError ? (
							<PostsErrorFallback
								error={postsError}
								category={currentCategory.name}
								resetErrorBoundary={() => window.location.reload()}
							/>
						) : posts.length === 0 ? (
							<EmptyPostsState category={currentCategory} />
						) : (
							<PostsGrid posts={posts} category={currentCategory} />
						)}
					</ErrorBoundary>
				</div>
			</div>
		</div>
	);
};

// Componentes auxiliares
const CategorySkeleton = () => (
	<div className="min-h-screen pt-20 bg-gradient-to-br from-black via-gray-900 to-black">
		<div className="relative py-24 bg-gradient-to-r from-gray-800 to-gray-700 animate-pulse">
			<div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
				<div className="w-48 h-8 bg-gray-600 rounded-full mx-auto mb-6"></div>
				<div className="w-96 h-16 bg-gray-600 rounded-2xl mx-auto mb-6"></div>
				<div className="w-64 h-6 bg-gray-600 rounded-full mx-auto"></div>
			</div>
		</div>
	</div>
);

const CategoryNotFoundError = ({ categorySlug, error }) => (
	<div className="min-h-screen pt-20 bg-gradient-to-br from-black via-gray-900 to-black flex items-center justify-center">
		<div className="text-center p-8 max-w-lg mx-auto">
			<div className="w-24 h-24 bg-gradient-to-r from-red-600 to-red-500 rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-2xl">
				<AlertCircle className="w-12 h-12 text-white" />
			</div>
			<h1 className="text-4xl font-black text-white mb-4">
				Categoria não encontrada
			</h1>
			<p className="text-gray-400 mb-2">
				A categoria "{categorySlug}" não existe ou não está disponível.
			</p>
			<p className="text-gray-500 text-sm mb-8">
				{error?.message || "Verifique se o link está correto."}
			</p>
			<div className="space-y-4">
				<Link
					to="/"
					className="w-full inline-flex items-center justify-center space-x-2 bg-gradient-to-r from-red-600 to-red-500 hover:from-red-500 hover:to-red-400 text-white px-8 py-4 rounded-2xl font-bold transition-all duration-300 shadow-xl hover:shadow-red-500/25 hover:scale-105"
				>
					<ArrowLeft className="w-4 h-4" />
					<span>Voltar ao início</span>
				</Link>
			</div>
		</div>
	</div>
);

const PostsLoadingSkeleton = () => (
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
);

const PostsErrorFallback = ({ error, resetErrorBoundary, category }) => (
	<div className="text-center py-16">
		<div className="w-20 h-20 bg-gradient-to-r from-red-600 to-red-500 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-2xl">
			<AlertCircle className="w-10 h-10 text-white" />
		</div>
		<h3 className="text-2xl font-bold text-white mb-4">
			Erro ao carregar posts de {category}
		</h3>
		<p className="text-gray-400 mb-8">
			Algo deu errado ao carregar o conteúdo. Tente novamente.
		</p>
		<button
			onClick={resetErrorBoundary}
			className="bg-gradient-to-r from-red-600 to-red-500 hover:from-red-500 hover:to-red-400 text-white px-8 py-3 rounded-2xl font-bold transition-all duration-300 shadow-xl hover:shadow-red-500/25 hover:scale-105"
		>
			Tentar Novamente
		</button>
	</div>
);

const EmptyPostsState = ({ category }) => (
	<div className="text-center py-16">
		<div
			className={`w-20 h-20 bg-gradient-to-r ${category.color} rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-xl`}
		>
			<span className="text-3xl">{category.icon}</span>
		</div>
		<h3 className="text-2xl font-bold text-white mb-4">
			Posts chegando em breve
		</h3>
		<p className="text-gray-400 mb-8 max-w-md mx-auto">
			Novos posts sobre {category.name.toLowerCase()} serão publicados em breve.
			Volte em breve!
		</p>
		<Link
			to="/"
			className="inline-flex items-center space-x-2 bg-gradient-to-r from-red-600 to-red-500 hover:from-red-500 hover:to-red-400 text-white px-8 py-4 rounded-2xl font-bold transition-all duration-300 shadow-xl hover:shadow-red-500/25 hover:scale-105"
		>
			<ArrowLeft className="w-4 h-4" />
			<span>Voltar ao início</span>
		</Link>
	</div>
);

const PostsGrid = ({ posts, category }) => {
	const { prefetchPost } = usePrefetch();

	return (
		<div>
			<div className="flex items-center space-x-3 mb-8">
				<Grid className="w-6 h-6 text-red-400" />
				<h2 className="text-3xl font-black text-white">
					Últimas sobre {category.name}
				</h2>
			</div>

			<p className="text-xl text-gray-400 max-w-2xl mb-12">
				Fique por dentro de tudo que acontece no mundo{" "}
				{category.name.toLowerCase()}
			</p>

			<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
				{posts.map((post, index) => (
					<PostCard
						key={`post-${post.id}-${index}`}
						post={post}
						index={index}
						onMouseEnter={() => prefetchPost(post.id)}
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
		</div>
	);
};

export default HierarchicalFlexiblePage;
