import React, { useState, useMemo, useEffect } from "react";
import { Link, useSearchParams } from "react-router-dom";
import {
	Calendar,
	User,
	Clock,
	TrendingUp,
	ArrowRight,
	Search,
	Filter,
	Grid,
	List,
	ChevronDown,
	Tag,
	AlertCircle,
} from "lucide-react";
import {
	useAllPosts,
	useCategories,
	useSearchPosts,
	usePrefetch,
} from "../hooks/usePostsQuery";
import { ErrorBoundary } from "react-error-boundary";

/**
 * AllPosts - Página completa de listagem de posts
 * - Busca avançada
 * - Filtros por categoria
 * - Paginação
 * - Layout em grid/lista
 * - Suporte completo ao novo sistema de imagens
 */

// Loading skeleton para lista de posts
const PostsListSkeleton = ({ viewMode = "grid" }) => {
	const skeletonCount = viewMode === "grid" ? 9 : 6;

	if (viewMode === "list") {
		return (
			<div className="space-y-6">
				{Array.from({ length: skeletonCount }).map((_, i) => (
					<div key={`skeleton-${i}`} className="animate-pulse">
						<div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-3xl p-6 flex gap-6 border border-gray-700/50">
							<div className="w-48 h-32 bg-gradient-to-br from-gray-700 to-gray-800 rounded-2xl flex-shrink-0"></div>
							<div className="flex-1 space-y-4">
								<div className="h-4 bg-gray-700 rounded-full w-24"></div>
								<div className="h-6 bg-gray-700 rounded-full"></div>
								<div className="space-y-2">
									<div className="h-4 bg-gray-700 rounded-full"></div>
									<div className="h-4 bg-gray-700 rounded-full w-3/4"></div>
								</div>
								<div className="h-3 bg-gray-700 rounded-full w-1/3"></div>
							</div>
						</div>
					</div>
				))}
			</div>
		);
	}

	return (
		<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
			{Array.from({ length: skeletonCount }).map((_, i) => (
				<div key={`skeleton-${i}`} className="animate-pulse">
					<div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-3xl overflow-hidden border border-gray-700/50">
						<div className="h-48 bg-gradient-to-br from-gray-700 to-gray-800"></div>
						<div className="p-6">
							<div className="h-4 bg-gray-700 rounded-full mb-3 w-24"></div>
							<div className="h-5 bg-gray-700 rounded-full mb-2"></div>
							<div className="h-5 bg-gray-700 rounded-full w-3/4 mb-4"></div>
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
};

// Error fallback
const PostsErrorFallback = ({ error, resetErrorBoundary }) => (
	<div className="text-center py-16">
		<div className="w-20 h-20 bg-gradient-to-r from-red-600 to-red-500 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-2xl">
			<AlertCircle className="w-10 h-10 text-white" />
		</div>
		<h3 className="text-2xl font-bold text-white mb-4">
			Erro ao carregar posts
		</h3>
		<p className="text-gray-400 mb-8">
			{error?.message || "Algo deu errado ao carregar os posts"}
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
				className="block border-2 border-gray-600 hover:border-red-500 text-gray-300 hover:text-white px-6 py-2 rounded-xl font-semibold transition-all duration-300"
			>
				Voltar ao Início
			</Link>
		</div>
	</div>
);

// Componente de post individual
const PostCard = React.memo(({ post, viewMode = "grid" }) => {
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

	if (viewMode === "list") {
		return (
			<article className="group bg-gradient-to-br from-gray-900 to-gray-800 rounded-3xl p-6 border border-gray-700/50 hover:border-red-500/30 transition-all duration-500 hover:scale-[1.02]">
				<div className="flex flex-col md:flex-row gap-6">
					{/* Imagem */}
					<div className="relative overflow-hidden rounded-2xl">
						<img
							src={post.image_url}
							alt={post.title}
							className="w-full md:w-48 h-32 object-cover transition-transform duration-700 group-hover:scale-110"
							loading="lazy"
							onError={(e) => {
								e.target.src =
									"https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&h=600&fit=crop";
							}}
						/>
						<div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
					</div>

					{/* Conteúdo */}
					<div className="flex-1 space-y-3">
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
							<h3 className="text-xl font-bold text-white group-hover:text-red-400 transition-colors duration-300 leading-tight">
								{post.title}
							</h3>
						</Link>
						<p className="text-gray-400 leading-relaxed line-clamp-2">
							{post.excerpt}
						</p>
						<div className="flex flex-col md:flex-row md:items-center md:justify-between pt-2 space-y-2 md:space-y-0">
							<div className="flex items-center gap-4 text-sm text-gray-500">
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
									<span>{formatDate}</span>
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
	}

	return (
		<article className="group relative bg-gradient-to-br from-gray-900 to-gray-800 rounded-3xl overflow-hidden shadow-2xl hover:shadow-red-500/10 transition-all duration-500 hover:scale-105 border border-gray-700/50">
			{/* Imagem */}
			<div className="relative overflow-hidden">
				<img
					src={post.image_url}
					alt={post.title}
					className="w-full h-48 object-cover transition-transform duration-700 group-hover:scale-110"
					loading="lazy"
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
						className="bg-gradient-to-r from-red-600 to-red-500 text-white px-3 py-1 rounded-full text-sm font-bold shadow-lg hover:shadow-red-500/25 transition-all duration-300"
					>
						{post.category_name}
					</Link>
					{post.trending && (
						<span className="bg-gradient-to-r from-orange-500 to-yellow-500 text-white px-2 py-1 rounded-full text-xs font-bold flex items-center space-x-1">
							<TrendingUp className="w-3 h-3" />
							<span>TREND</span>
						</span>
					)}
				</div>
			</div>

			{/* Conteúdo */}
			<div className="p-6">
				<Link
					to={`/post/${post.id}`}
					onMouseEnter={() => prefetchPost(post.id)}
				>
					<h3 className="text-lg font-bold text-white mb-3 group-hover:text-red-400 transition-colors duration-300 leading-tight line-clamp-2">
						{post.title}
					</h3>
				</Link>
				<p className="text-gray-400 mb-4 leading-relaxed line-clamp-3">
					{post.excerpt}
				</p>

				{/* Meta */}
				<div className="flex flex-col space-y-3">
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
					<div className="flex items-center justify-between">
						<div className="flex items-center space-x-2 text-sm text-gray-500">
							<Calendar className="w-4 h-4" />
							<span>{formatDate}</span>
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
});

// Componente principal
const AllPosts = () => {
	const [searchParams, setSearchParams] = useSearchParams();
	const [viewMode, setViewMode] = useState("grid");
	const [selectedCategory, setSelectedCategory] = useState("");
	const [sortBy, setSortBy] = useState("newest");
	const [searchTerm, setSearchTerm] = useState(
		searchParams.get("search") || ""
	);
	const [showFilters, setShowFilters] = useState(false);

	// Hooks de dados
	const {
		data: allPosts = [],
		isLoading: loadingPosts,
		error: postsError,
	} = useAllPosts();
	const { data: categories = [] } = useCategories();
	const { data: searchResults = [] } = useSearchPosts(searchTerm, {
		enabled: searchTerm.length >= 2,
	});

	// Posts filtrados e ordenados
	const filteredPosts = useMemo(() => {
		let posts = searchTerm.length >= 2 ? searchResults : allPosts;

		// Filtrar por categoria
		if (selectedCategory) {
			posts = posts.filter((post) => post.category === selectedCategory);
		}

		// Ordenar
		switch (sortBy) {
			case "oldest":
				return [...posts].sort(
					(a, b) => new Date(a.created_at) - new Date(b.created_at)
				);
			case "trending":
				return [...posts].sort(
					(a, b) => (b.trending ? 1 : 0) - (a.trending ? 1 : 0)
				);
			case "title":
				return [...posts].sort((a, b) => a.title.localeCompare(b.title));
			default: // newest
				return [...posts].sort(
					(a, b) => new Date(b.created_at) - new Date(a.created_at)
				);
		}
	}, [allPosts, searchResults, searchTerm, selectedCategory, sortBy]);

	// Atualizar URL com parâmetros de busca
	useEffect(() => {
		const params = new URLSearchParams();
		if (searchTerm) params.set("search", searchTerm);
		if (selectedCategory) params.set("category", selectedCategory);
		if (sortBy !== "newest") params.set("sort", sortBy);
		if (viewMode !== "grid") params.set("view", viewMode);

		setSearchParams(params, { replace: true });
	}, [searchTerm, selectedCategory, sortBy, viewMode, setSearchParams]);

	// Limpar filtros
	const clearFilters = () => {
		setSearchTerm("");
		setSelectedCategory("");
		setSortBy("newest");
		setSearchParams({}, { replace: true });
	};

	const activeFiltersCount = [
		searchTerm,
		selectedCategory,
		sortBy !== "newest",
	].filter(Boolean).length;

	if (postsError) {
		return (
			<div className="min-h-screen pt-20 bg-gradient-to-br from-black via-gray-900 to-black">
				<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
					<PostsErrorFallback
						error={postsError}
						resetErrorBoundary={() => window.location.reload()}
					/>
				</div>
			</div>
		);
	}

	return (
		<div className="min-h-screen pt-20 bg-gradient-to-br from-black via-gray-900 to-black">
			<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
				{/* Header */}
				<div className="mb-8">
					<div className="text-center mb-8">
						<h1 className="text-4xl md:text-5xl font-black text-white mb-4 bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
							Todos os Posts
						</h1>
						<p className="text-xl text-gray-400 max-w-2xl mx-auto">
							Explore todo nosso conteúdo sobre automobilismo e motorsport
						</p>
					</div>

					{/* Barra de busca e filtros */}
					<div className="bg-gradient-to-r from-gray-900 to-gray-800 rounded-3xl p-6 border border-gray-700/50">
						{/* Busca principal */}
						<div className="flex flex-col lg:flex-row gap-4 mb-4">
							<div className="flex-1 relative">
								<Search className="absolute left-4 top-4 w-5 h-5 text-gray-400" />
								<input
									type="text"
									placeholder="Buscar posts, categorias, autores..."
									value={searchTerm}
									onChange={(e) => setSearchTerm(e.target.value)}
									className="w-full pl-12 pr-4 py-4 bg-gray-800/50 border border-gray-600/50 rounded-2xl text-white placeholder-gray-500 focus:outline-none focus:border-red-500/50 focus:bg-gray-800 transition-all duration-300"
								/>
							</div>
							<button
								onClick={() => setShowFilters(!showFilters)}
								className={`flex items-center space-x-2 px-6 py-4 rounded-2xl font-semibold transition-all duration-300 ${
									showFilters || activeFiltersCount > 0
										? "bg-red-600 hover:bg-red-700 text-white"
										: "bg-gray-700 hover:bg-gray-600 text-gray-300"
								}`}
							>
								<Filter className="w-5 h-5" />
								<span>Filtros</span>
								{activeFiltersCount > 0 && (
									<span className="bg-white/20 text-xs px-2 py-1 rounded-full">
										{activeFiltersCount}
									</span>
								)}
								<ChevronDown
									className={`w-4 h-4 transition-transform duration-300 ${
										showFilters ? "rotate-180" : ""
									}`}
								/>
							</button>
						</div>

						{/* Painel de filtros */}
						{showFilters && (
							<div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t border-gray-700/50">
								{/* Categoria */}
								<div>
									<label className="block text-white font-medium mb-2">
										Categoria
									</label>
									<select
										value={selectedCategory}
										onChange={(e) => setSelectedCategory(e.target.value)}
										className="w-full px-4 py-3 bg-gray-800/50 border border-gray-600/50 rounded-xl text-white focus:outline-none focus:border-red-500/50"
									>
										<option value="">Todas as categorias</option>
										{categories.map((category) => (
											<option key={category.id} value={category.id}>
												{category.name}
											</option>
										))}
									</select>
								</div>

								{/* Ordenação */}
								<div>
									<label className="block text-white font-medium mb-2">
										Ordenar por
									</label>
									<select
										value={sortBy}
										onChange={(e) => setSortBy(e.target.value)}
										className="w-full px-4 py-3 bg-gray-800/50 border border-gray-600/50 rounded-xl text-white focus:outline-none focus:border-red-500/50"
									>
										<option value="newest">Mais recentes</option>
										<option value="oldest">Mais antigos</option>
										<option value="trending">Em alta</option>
										<option value="title">Título (A-Z)</option>
									</select>
								</div>

								{/* Layout */}
								<div>
									<label className="block text-white font-medium mb-2">
										Layout
									</label>
									<div className="flex rounded-xl overflow-hidden border border-gray-600/50">
										<button
											onClick={() => setViewMode("grid")}
											className={`flex-1 flex items-center justify-center space-x-2 py-3 px-4 transition-colors duration-300 ${
												viewMode === "grid"
													? "bg-red-600 text-white"
													: "bg-gray-800/50 text-gray-400 hover:text-white"
											}`}
										>
											<Grid className="w-4 h-4" />
											<span>Grid</span>
										</button>
										<button
											onClick={() => setViewMode("list")}
											className={`flex-1 flex items-center justify-center space-x-2 py-3 px-4 transition-colors duration-300 ${
												viewMode === "list"
													? "bg-red-600 text-white"
													: "bg-gray-800/50 text-gray-400 hover:text-white"
											}`}
										>
											<List className="w-4 h-4" />
											<span>Lista</span>
										</button>
									</div>
								</div>
							</div>
						)}

						{/* Filtros ativos */}
						{activeFiltersCount > 0 && (
							<div className="flex items-center justify-between pt-4 border-t border-gray-700/50">
								<div className="flex items-center space-x-2 text-sm text-gray-400">
									<span>{filteredPosts.length} posts encontrados</span>
									{searchTerm && (
										<span className="bg-gray-700 px-2 py-1 rounded">
											Busca: "{searchTerm}"
										</span>
									)}
									{selectedCategory && (
										<span className="bg-gray-700 px-2 py-1 rounded">
											{categories.find((c) => c.id === selectedCategory)?.name}
										</span>
									)}
								</div>
								<button
									onClick={clearFilters}
									className="text-red-400 hover:text-red-300 text-sm font-semibold transition-colors duration-300"
								>
									Limpar filtros
								</button>
							</div>
						)}
					</div>
				</div>

				{/* Lista de posts */}
				<ErrorBoundary
					FallbackComponent={PostsErrorFallback}
					onReset={() => window.location.reload()}
				>
					{loadingPosts ? (
						<PostsListSkeleton viewMode={viewMode} />
					) : filteredPosts.length === 0 ? (
						<div className="text-center py-16">
							<div className="w-20 h-20 bg-gradient-to-r from-gray-600 to-gray-500 rounded-3xl flex items-center justify-center mx-auto mb-6">
								<Search className="w-10 h-10 text-gray-400" />
							</div>
							<h3 className="text-2xl font-bold text-white mb-4">
								Nenhum post encontrado
							</h3>
							<p className="text-gray-400 mb-8">
								{searchTerm
									? `Não encontramos posts para "${searchTerm}"`
									: "Não há posts publicados no momento"}
							</p>
							{activeFiltersCount > 0 && (
								<button
									onClick={clearFilters}
									className="bg-gradient-to-r from-red-600 to-red-500 hover:from-red-500 hover:to-red-400 text-white px-8 py-4 rounded-2xl font-bold transition-all duration-300 shadow-xl hover:shadow-red-500/25 hover:scale-105"
								>
									Limpar filtros
								</button>
							)}
						</div>
					) : (
						<div
							className={
								viewMode === "grid"
									? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
									: "space-y-6"
							}
						>
							{filteredPosts.map((post, index) => (
								<PostCard
									key={`post-${post.id}-${index}`}
									post={post}
									viewMode={viewMode}
								/>
							))}
						</div>
					)}
				</ErrorBoundary>

				{/* Estatísticas */}
				{filteredPosts.length > 0 && !loadingPosts && (
					<div className="mt-12 text-center">
						<div className="inline-flex items-center space-x-4 bg-gray-800/50 px-6 py-3 rounded-full border border-gray-700/50">
							<span className="text-gray-400">
								Mostrando {filteredPosts.length} de {allPosts.length} posts
							</span>
							{searchTerm && (
								<span className="text-red-400">• Resultados da busca</span>
							)}
						</div>
					</div>
				)}
			</div>
		</div>
	);
};

export default AllPosts;
