import React, { Suspense, useMemo } from "react";
import { Link } from "react-router-dom";
import {
	Calendar,
	User,
	Clock,
	ArrowRight,
	TrendingUp,
	Tag,
	AlertCircle,
} from "lucide-react";
import { usePostsByCategory, usePrefetch } from "../hooks/usePostsQuery";
import { ErrorBoundary } from "react-error-boundary";

/**
 * CategoryPage - 100% Dinâmica do Banco
 * - SEM fallbacks estáticos
 * - Limpa e sem debug
 * - Error handling robusto
 */

// Loading skeleton para categoria
const CategoryPostsSkeleton = () => (
	<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
		{Array.from({ length: 6 }).map((_, i) => (
			<div key={`skeleton-${i}`} className="animate-pulse">
				<div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-3xl overflow-hidden border border-gray-700/50">
					<div className="h-56 bg-gradient-to-br from-gray-700 to-gray-800"></div>
					<div className="p-6">
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

// Error fallback para posts da categoria
const PostsErrorFallback = ({ error, resetErrorBoundary, categoryName }) => (
	<div className="text-center py-16">
		<div className="w-20 h-20 bg-gradient-to-r from-red-600 to-red-500 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-2xl">
			<AlertCircle className="w-10 h-10 text-white" />
		</div>
		<h3 className="text-2xl font-bold text-white mb-4">
			Erro ao carregar posts
		</h3>
		<p className="text-red-400 mb-4">{error?.message || "Algo deu errado"}</p>
		<p className="text-gray-400 mb-8 max-w-md mx-auto">
			Não foi possível carregar os posts
			{categoryName ? ` de ${categoryName.toLowerCase()}` : ""}.
		</p>
		<div className="space-y-4">
			<button
				onClick={resetErrorBoundary}
				className="bg-gradient-to-r from-red-600 to-red-500 hover:from-red-500 hover:to-red-400 text-white px-8 py-3 rounded-2xl font-bold transition-all duration-300 shadow-xl hover:shadow-red-500/25 hover:scale-105"
			>
				Tentar Novamente
			</button>
			<Link
				to="/"
				className="inline-flex items-center space-x-2 border-2 border-gray-600 hover:border-red-500 text-gray-300 hover:text-white px-6 py-2 rounded-xl font-semibold transition-all duration-300"
			>
				<ArrowRight className="w-4 h-4 rotate-180" />
				<span>Voltar ao início</span>
			</Link>
		</div>
	</div>
);

// Componente de post memoizado
const PostCard = React.memo(({ post, index, gradient }) => {
	const { prefetchPost } = usePrefetch();

	const formatDate = useMemo(() => {
		if (!post?.created_at) return "Data não disponível";
		try {
			return new Date(post.created_at).toLocaleDateString("pt-BR");
		} catch (error) {
			return "Data não disponível";
		}
	}, [post]);

	if (!post) {
		return null;
	}

	// Gradiente seguro
	const safeGradient = gradient || "from-red-600 to-red-500";

	return (
		<article className="group bg-gradient-to-br from-gray-900 to-gray-800 rounded-3xl overflow-hidden shadow-2xl hover:shadow-red-500/10 transition-all duration-500 hover:scale-105 border border-gray-700/50">
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

				<div className="absolute top-4 left-4 flex items-center space-x-2">
					<span
						className={`bg-gradient-to-r ${safeGradient} text-white px-4 py-2 rounded-full text-sm font-bold shadow-lg`}
					>
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

// Componente principal de posts com Suspense
const CategoryPostsGrid = ({ categoryId, title, gradient }) => {
	const {
		data: categoryPosts = [],
		isLoading,
		error,
	} = usePostsByCategory(categoryId);

	if (isLoading) {
		return <CategoryPostsSkeleton />;
	}

	if (error) {
		throw error;
	}

	if (categoryPosts.length === 0) {
		return (
			<div className="text-center py-16">
				<div className="w-20 h-20 bg-gradient-to-r from-gray-800 to-gray-700 rounded-3xl flex items-center justify-center mx-auto mb-6">
					<Tag className="w-10 h-10 text-gray-500" />
				</div>
				<h3 className="text-2xl font-bold text-white mb-4">
					Nenhum post encontrado
				</h3>
				<p className="text-gray-400 mb-8 max-w-md mx-auto">
					Ainda não há posts publicados na categoria{" "}
					{title ? title.toLowerCase() : "selecionada"}.
				</p>
				<Link
					to="/"
					className="inline-flex items-center space-x-2 bg-gradient-to-r from-red-600 to-red-500 hover:from-red-500 hover:to-red-400 text-white px-8 py-4 rounded-2xl font-bold transition-all duration-300 shadow-xl hover:shadow-red-500/25 hover:scale-105"
				>
					<ArrowRight className="w-4 h-4 rotate-180" />
					<span>Voltar ao início</span>
				</Link>
			</div>
		);
	}

	return (
		<>
			<div className="mb-8">
				<h2 className="text-2xl font-bold text-white mb-2">
					{categoryPosts.length}{" "}
					{categoryPosts.length === 1 ? "post encontrado" : "posts encontrados"}
				</h2>
				<p className="text-gray-400">
					Últimas publicações sobre{" "}
					{title ? title.toLowerCase() : "a categoria selecionada"}
				</p>
			</div>

			<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
				{categoryPosts.map((post, index) => (
					<PostCard
						key={`category-${categoryId}-post-${post.id}-${index}`}
						post={post}
						index={index}
						gradient={gradient}
					/>
				))}
			</div>
		</>
	);
};

// Componente principal CategoryPage
const CategoryPage = ({ categoryId, title, description, gradient }) => {
	const safeProps = useMemo(() => {
		const sanitized = {
			categoryId:
				categoryId && typeof categoryId === "string" ? categoryId : null,
			title: title && typeof title === "string" ? title : "Categoria",
			description:
				description && typeof description === "string"
					? description
					: "Conteúdo da categoria",
			gradient:
				gradient && typeof gradient === "string"
					? gradient
					: "from-red-600 to-red-500",
		};

		if (!sanitized.categoryId) {
			console.error("CategoryPage: categoryId inválido ou não fornecido", {
				categoryId,
			});
		}

		return sanitized;
	}, [categoryId, title, description, gradient]);

	if (!safeProps.categoryId) {
		return (
			<div className="min-h-screen pt-20 flex items-center justify-center">
				<div className="text-center">
					<div className="w-24 h-24 bg-gradient-to-r from-red-600 to-red-500 rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-2xl">
						<Tag className="w-12 h-12 text-white" />
					</div>
					<h1 className="text-4xl font-black text-white mb-4">
						Categoria não especificada
					</h1>
					<p className="text-gray-400 mb-8">
						A categoria solicitada não foi encontrada ou é inválida.
					</p>
					<Link
						to="/"
						className="inline-flex items-center space-x-2 bg-gradient-to-r from-red-600 to-red-500 hover:from-red-500 hover:to-red-400 text-white px-8 py-4 rounded-2xl font-bold transition-all duration-300 shadow-xl hover:shadow-red-500/25 hover:scale-105"
					>
						<ArrowRight className="w-4 h-4 rotate-180" />
						<span>Voltar para o início</span>
					</Link>
				</div>
			</div>
		);
	}

	return (
		<div className="min-h-screen pt-20">
			{/* Hero Section */}
			<div className={`relative py-24 bg-gradient-to-r ${safeProps.gradient}`}>
				<div className="absolute inset-0 bg-black/60"></div>
				<div className="absolute inset-0 overflow-hidden">
					<div className="absolute top-1/4 left-1/4 w-64 h-64 bg-white/5 rounded-full blur-3xl animate-pulse"></div>
					<div className="absolute bottom-1/4 right-1/4 w-48 h-48 bg-white/5 rounded-full blur-3xl animate-pulse delay-1000"></div>
				</div>

				<div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
					<div className="animate-fade-in">
						<div className="inline-flex items-center px-6 py-3 rounded-full bg-white/10 border border-white/20 backdrop-blur-sm mb-6">
							<span className="text-white text-sm font-bold">
								📚 Categoria Especializada
							</span>
						</div>

						<h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-black text-white mb-6 leading-tight">
							{safeProps.title}
						</h1>
						<p className="text-xl md:text-2xl text-white/90 max-w-2xl mx-auto leading-relaxed">
							{safeProps.description}
						</p>
					</div>
				</div>
			</div>

			{/* Posts Section */}
			<div className="py-16 bg-gradient-to-b from-gray-900 to-black">
				<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
					<ErrorBoundary
						FallbackComponent={(props) => (
							<PostsErrorFallback {...props} categoryName={safeProps.title} />
						)}
						onReset={() => {
							window.location.reload();
						}}
						resetKeys={[safeProps.categoryId]}
					>
						<Suspense fallback={<CategoryPostsSkeleton />}>
							<CategoryPostsGrid
								categoryId={safeProps.categoryId}
								title={safeProps.title}
								gradient={safeProps.gradient}
							/>
						</Suspense>
					</ErrorBoundary>
				</div>
			</div>
		</div>
	);
};

export default CategoryPage;
