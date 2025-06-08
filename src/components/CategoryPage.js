import React, { Suspense, useMemo } from "react";
import { Link } from "react-router-dom";
import {
	Calendar,
	User,
	Clock,
	ArrowRight,
	TrendingUp,
	Tag,
} from "lucide-react";
import { usePostsByCategory, usePrefetch } from "../hooks/useUltraFastPosts";
import { ErrorBoundary } from "react-error-boundary";

// Validador de post RIGOROSO
const isValidPost = (post) => {
	return (
		post &&
		typeof post === "object" &&
		post.id &&
		post.title &&
		typeof post.title === "string" &&
		post.title.length > 0 &&
		post.excerpt &&
		typeof post.excerpt === "string" &&
		post.image_url &&
		typeof post.image_url === "string" &&
		post.category &&
		post.category_name &&
		post.author &&
		post.read_time &&
		post.created_at
	);
};

// Filtrar e validar posts
const validateAndFilterPosts = (posts, context = "unknown") => {
	if (!Array.isArray(posts)) {
		console.warn(`🔧 CategoryPage validatePosts: ${context} - não é array`, {
			type: typeof posts,
			value: posts,
		});
		return [];
	}

	const validPosts = posts.filter(isValidPost);

	if (validPosts.length !== posts.length) {
		console.warn(
			`🔧 CategoryPage: ${context} - removidos ${
				posts.length - validPosts.length
			} posts inválidos`
		);
	}

	return validPosts;
};

// Loading skeleton otimizado
const CategoryPostsSkeleton = () => (
	<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
		{Array.from({ length: 6 }).map((_, i) => (
			<div key={`skeleton-${i}`} className="animate-pulse">
				<div className="bg-gray-800 rounded-2xl overflow-hidden">
					<div className="h-48 md:h-56 bg-gray-700"></div>
					<div className="p-6">
						<div className="h-4 bg-gray-700 rounded mb-2"></div>
						<div className="h-4 bg-gray-700 rounded w-3/4 mb-4"></div>
						<div className="space-y-2">
							<div className="h-3 bg-gray-700 rounded"></div>
							<div className="h-3 bg-gray-700 rounded w-2/3"></div>
						</div>
						<div className="mt-4 pt-4 border-t border-gray-700">
							<div className="h-3 bg-gray-700 rounded w-1/2"></div>
						</div>
					</div>
				</div>
			</div>
		))}
	</div>
);

// Error fallback para seção de posts
const PostsErrorFallback = ({ error, resetErrorBoundary, categoryName }) => (
	<div className="text-center py-12">
		<div className="w-16 h-16 md:w-24 md:h-24 bg-gradient-to-r from-red-600 to-red-500 rounded-2xl md:rounded-3xl flex items-center justify-center mx-auto mb-4 md:mb-6">
			<Tag className="w-8 h-8 md:w-12 md:h-12 text-white" />
		</div>
		<h3 className="text-xl md:text-2xl font-bold text-white mb-4">
			Erro ao carregar posts
		</h3>
		<p className="text-red-400 mb-4 text-sm md:text-base">
			{error?.message || "Algo deu errado"}
		</p>
		<p className="text-gray-400 mb-6 md:mb-8 max-w-md mx-auto text-sm md:text-base">
			Não foi possível carregar os posts
			{categoryName ? ` de ${categoryName.toLowerCase()}` : ""}.
		</p>
		<div className="space-y-3 sm:space-y-0 sm:space-x-4 sm:flex sm:justify-center">
			<button
				onClick={resetErrorBoundary}
				className="w-full sm:w-auto bg-gradient-to-r from-red-600 to-red-500 hover:from-red-500 hover:to-red-400 text-white px-6 py-3 rounded-xl font-semibold transition-all duration-300 shadow-lg hover:shadow-red-500/25 hover:scale-105"
			>
				Tentar Novamente
			</button>
			<Link
				to="/"
				className="w-full sm:w-auto inline-flex items-center justify-center space-x-2 border border-gray-600 hover:border-red-500 text-gray-300 hover:text-white px-6 py-3 rounded-xl font-semibold transition-all duration-300"
			>
				<ArrowRight className="w-4 h-4 rotate-180" />
				<span>Voltar ao início</span>
			</Link>
		</div>
	</div>
);

// Componente de post memoizado ULTRA PROTEGIDO
const PostCard = React.memo(({ post, index, gradient }) => {
	const { prefetchPost } = usePrefetch();

	// MOVIDO PARA TOP LEVEL - HOOKS SEMPRE NO TOPO
	const formatDate = useMemo(() => {
		if (!post || !post.created_at) return "Data não disponível";
		try {
			const date = new Date(post.created_at);
			return isNaN(date.getTime())
				? "Data inválida"
				: date.toLocaleDateString("pt-BR");
		} catch (error) {
			console.warn("CategoryPage PostCard: Erro ao formatar data", {
				error,
				post,
			});
			return "Data não disponível";
		}
	}, [post]);

	// VALIDAÇÃO APÓS HOOKS
	if (!isValidPost(post)) {
		console.warn("CategoryPage PostCard: Post inválido recebido", post);
		return null;
	}

	// Post "sanitizado" com valores seguros
	const safePost = {
		id: post.id || 0,
		title: post.title || "Título não disponível",
		excerpt: post.excerpt || "Descrição não disponível",
		image_url:
			post.image_url ||
			"https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&h=600&fit=crop",
		category: post.category || "geral",
		category_name: post.category_name || "Geral",
		author: post.author || "Equipe TF",
		read_time: post.read_time || "5 min",
		trending: post.trending || false,
	};

	// Gradiente seguro
	const safeGradient = gradient || "from-red-600 to-red-500";

	return (
		<article className="group bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl md:rounded-3xl overflow-hidden shadow-2xl hover:shadow-red-500/10 transition-all duration-500 hover:scale-105">
			<div className="relative overflow-hidden">
				<img
					src={safePost.image_url}
					alt={safePost.title}
					className="w-full h-48 md:h-56 object-cover transition-transform duration-700 group-hover:scale-110"
					loading={index < 6 ? "eager" : "lazy"}
					onError={(e) => {
						e.target.src =
							"https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&h=600&fit=crop";
					}}
				/>
				<div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent"></div>

				<div className="absolute top-3 md:top-4 left-3 md:left-4 flex items-center space-x-2">
					<span
						className={`bg-gradient-to-r ${safeGradient} text-white px-3 md:px-4 py-1.5 md:py-2 rounded-full text-xs md:text-sm font-semibold shadow-lg`}
					>
						{safePost.category_name}
					</span>
					{safePost.trending && (
						<span className="bg-gradient-to-r from-orange-500 to-yellow-500 text-white px-2 md:px-3 py-1 rounded-full text-xs font-bold flex items-center space-x-1">
							<TrendingUp className="w-2.5 h-2.5 md:w-3 md:h-3" />
							<span>TREND</span>
						</span>
					)}
				</div>
			</div>

			<div className="p-4 md:p-8">
				<Link
					to={`/post/${safePost.id}`}
					onMouseEnter={() => prefetchPost(safePost.id)}
				>
					<h3 className="text-lg md:text-xl font-bold text-white mb-3 md:mb-4 group-hover:text-red-400 transition-colors duration-300 leading-tight line-clamp-2">
						{safePost.title}
					</h3>
				</Link>
				<p className="text-gray-400 mb-4 md:mb-6 leading-relaxed line-clamp-3 text-sm md:text-base">
					{safePost.excerpt}
				</p>

				<div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-3 md:space-y-0">
					<div className="flex items-center space-x-3 md:space-x-4 text-xs md:text-sm text-gray-500">
						<div className="flex items-center space-x-1.5 md:space-x-2">
							<User className="w-3 h-3 md:w-4 md:h-4" />
							<span>{safePost.author}</span>
						</div>
						<div className="flex items-center space-x-1.5 md:space-x-2">
							<Clock className="w-3 h-3 md:w-4 md:h-4" />
							<span>{safePost.read_time}</span>
						</div>
					</div>
					<div className="flex items-center space-x-1.5 md:space-x-2 text-xs md:text-sm text-gray-500">
						<Calendar className="w-3 h-3 md:w-4 md:h-4" />
						<span>{formatDate}</span>
					</div>
				</div>

				<div className="mt-4 md:mt-6 pt-4 md:pt-6 border-t border-gray-700">
					<Link
						to={`/post/${safePost.id}`}
						onMouseEnter={() => prefetchPost(safePost.id)}
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

// Componente principal de posts com Suspense PROTEGIDO
const CategoryPostsGrid = ({ categoryId, title, gradient }) => {
	const {
		data: categoryPosts = [],
		isLoading,
		error,
	} = usePostsByCategory(categoryId);

	// HOOKS SEMPRE NO TOP LEVEL
	const safeCategoryPosts = useMemo(() => {
		console.log(`🔍 CategoryPostsGrid ${categoryId}: Validando posts`, {
			isArray: Array.isArray(categoryPosts),
			length: categoryPosts?.length,
			type: typeof categoryPosts,
		});

		return validateAndFilterPosts(categoryPosts, `category-${categoryId}`);
	}, [categoryPosts, categoryId]);

	if (isLoading) {
		return <CategoryPostsSkeleton />;
	}

	if (error) {
		console.error(`CategoryPostsGrid ${categoryId} error:`, error);
		throw error;
	}

	if (safeCategoryPosts.length === 0) {
		return (
			<div className="text-center py-12 md:py-16">
				<div className="w-16 h-16 md:w-24 md:h-24 bg-gradient-to-r from-gray-800 to-gray-700 rounded-2xl md:rounded-3xl flex items-center justify-center mx-auto mb-4 md:mb-6">
					<Tag className="w-8 h-8 md:w-12 md:h-12 text-gray-500" />
				</div>
				<h3 className="text-xl md:text-2xl font-bold text-white mb-4">
					Nenhum post encontrado
				</h3>
				<p className="text-gray-400 mb-6 md:mb-8 max-w-md mx-auto text-sm md:text-base">
					Ainda não há posts publicados na categoria{" "}
					{title ? title.toLowerCase() : "selecionada"}.
				</p>
				<Link
					to="/"
					className="inline-flex items-center space-x-2 bg-gradient-to-r from-red-600 to-red-500 hover:from-red-500 hover:to-red-400 text-white px-6 py-3 rounded-xl font-semibold transition-all duration-300 shadow-lg hover:shadow-red-500/25 hover:scale-105"
				>
					<ArrowRight className="w-4 h-4 rotate-180" />
					<span>Voltar ao início</span>
				</Link>
			</div>
		);
	}

	return (
		<>
			<div className="mb-6 md:mb-8">
				<h2 className="text-xl md:text-2xl font-bold text-white mb-2">
					{safeCategoryPosts.length}{" "}
					{safeCategoryPosts.length === 1
						? "post encontrado"
						: "posts encontrados"}
				</h2>
				<p className="text-gray-400 text-sm md:text-base">
					Últimas publicações sobre{" "}
					{title ? title.toLowerCase() : "a categoria selecionada"}
				</p>

				{process.env.NODE_ENV === "development" && (
					<div className="mt-2 text-xs text-gray-500 font-mono">
						⚡ TanStack Query | {categoryId} | Cache:{" "}
						{safeCategoryPosts.length > 0 ? "HIT" : "MISS"} | Valid:{" "}
						{safeCategoryPosts.length}
					</div>
				)}
			</div>

			<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
				{safeCategoryPosts.map((post, index) => (
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
	// HOOK SEMPRE NO TOP LEVEL
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
					<div className="w-20 h-20 bg-red-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
						<Tag className="w-10 h-10 text-white" />
					</div>
					<h1 className="text-4xl font-bold text-white mb-4">
						Categoria não especificada
					</h1>
					<p className="text-gray-400 mb-6">
						A categoria solicitada não foi encontrada ou é inválida.
					</p>
					<Link
						to="/"
						className="inline-flex items-center space-x-2 bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-xl font-semibold transition-colors"
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
			<div
				className={`relative py-16 md:py-24 bg-gradient-to-r ${safeProps.gradient}`}
			>
				<div className="absolute inset-0 bg-black/60"></div>
				<div className="absolute inset-0 overflow-hidden">
					<div className="absolute top-1/4 left-1/4 w-64 h-64 bg-white/5 rounded-full blur-3xl animate-pulse"></div>
					<div className="absolute bottom-1/4 right-1/4 w-48 h-48 bg-white/5 rounded-full blur-3xl animate-pulse delay-1000"></div>
				</div>

				<div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
					<div className="animate-fade-in">
						<div className="inline-flex items-center px-4 md:px-6 py-2 md:py-3 rounded-full bg-white/10 border border-white/20 backdrop-blur-sm mb-4 md:mb-6">
							<span className="text-white text-xs md:text-sm font-semibold">
								📚 Categoria Especializada
							</span>
						</div>

						<h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black text-white mb-4 md:mb-6 leading-tight">
							{safeProps.title}
						</h1>
						<p className="text-base md:text-xl text-white/90 max-w-2xl mx-auto leading-relaxed">
							{safeProps.description}
						</p>
					</div>
				</div>
			</div>

			<div className="py-12 md:py-16 bg-gradient-to-b from-gray-900 to-black">
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
