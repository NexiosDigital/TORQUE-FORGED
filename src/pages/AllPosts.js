import React, { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import {
	Calendar,
	User,
	Clock,
	ArrowRight,
	TrendingUp,
	Search,
	Grid,
	List,
	ChevronDown,
	Tag,
} from "lucide-react";
import {
	useAllPosts,
	useCategories,
	usePrefetch,
} from "../hooks/usePostsQuery";

// Loading skeleton para posts
const PostsGridSkeleton = () => (
	<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
		{Array.from({ length: 9 }).map((_, i) => (
			<div key={i} className="animate-pulse">
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

const PostsListSkeleton = () => (
	<div className="space-y-8">
		{Array.from({ length: 6 }).map((_, i) => (
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

// Componente de post em grid
const PostCardGrid = React.memo(({ post, index }) => {
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

			<div className="p-6">
				<Link
					to={`/post/${post.id}`}
					onMouseEnter={() => prefetchPost(post.id)}
				>
					<h3 className="text-lg font-bold text-white mb-4 group-hover:text-red-400 transition-colors duration-300 leading-tight line-clamp-2">
						{post.title}
					</h3>
				</Link>
				<p className="text-gray-400 mb-6 leading-relaxed line-clamp-3 text-sm">
					{post.excerpt}
				</p>

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
					<div className="flex items-center justify-between pt-2 border-t border-gray-700">
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

// Componente de post em lista
const PostCardList = React.memo(({ post, index }) => {
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
		<article className="group bg-gradient-to-br from-gray-900 to-gray-800 rounded-3xl p-8 border border-gray-700/50 hover:border-red-500/30 transition-all duration-500 hover:scale-[1.02]">
			<div className="flex flex-col md:flex-row gap-8">
				<div className="relative overflow-hidden rounded-2xl">
					<img
						src={post.image_url}
						alt={post.title}
						className="w-full md:w-64 h-48 object-cover transition-transform duration-700 group-hover:scale-110"
						loading={index < 6 ? "eager" : "lazy"}
						onError={(e) => {
							e.target.src =
								"https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&h=600&fit=crop";
						}}
					/>
					<div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
				</div>

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
					<p className="text-gray-400 leading-relaxed">{post.excerpt}</p>
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
});

// Componente principal
const AllPosts = () => {
	const { data: allPosts = [], isLoading, error } = useAllPosts();
	const { data: categories = [] } = useCategories();
	const [selectedCategory, setSelectedCategory] = useState("all");
	const [searchTerm, setSearchTerm] = useState("");
	const [viewMode, setViewMode] = useState("grid");
	const [sortBy, setSortBy] = useState("newest");

	// Filtrar e ordenar posts
	const filteredAndSortedPosts = useMemo(() => {
		let filtered = [...allPosts];

		// Filtrar por categoria
		if (selectedCategory !== "all") {
			filtered = filtered.filter((post) => post.category === selectedCategory);
		}

		// Filtrar por busca
		if (searchTerm) {
			const search = searchTerm.toLowerCase();
			filtered = filtered.filter(
				(post) =>
					post.title.toLowerCase().includes(search) ||
					post.excerpt.toLowerCase().includes(search) ||
					post.category_name.toLowerCase().includes(search)
			);
		}

		// Ordenar
		switch (sortBy) {
			case "newest":
				filtered.sort(
					(a, b) => new Date(b.created_at) - new Date(a.created_at)
				);
				break;
			case "oldest":
				filtered.sort(
					(a, b) => new Date(a.created_at) - new Date(b.created_at)
				);
				break;
			case "trending":
				filtered.sort((a, b) => {
					if (a.trending && !b.trending) return -1;
					if (!a.trending && b.trending) return 1;
					return new Date(b.created_at) - new Date(a.created_at);
				});
				break;
			default:
				break;
		}

		return filtered;
	}, [allPosts, selectedCategory, searchTerm, sortBy]);

	if (error) {
		return (
			<div className="min-h-screen pt-20 bg-gradient-to-br from-black via-gray-900 to-black flex items-center justify-center">
				<div className="text-center p-8 max-w-md mx-auto">
					<div className="w-20 h-20 bg-red-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
						<Tag className="w-10 h-10 text-white" />
					</div>
					<h1 className="text-3xl font-bold text-white mb-4">
						Erro ao carregar posts
					</h1>
					<p className="text-gray-400 mb-8">{error.message}</p>
					<button
						onClick={() => window.location.reload()}
						className="bg-gradient-to-r from-red-600 to-red-500 hover:from-red-500 hover:to-red-400 text-white px-8 py-4 rounded-2xl font-bold transition-all duration-300"
					>
						Tentar Novamente
					</button>
				</div>
			</div>
		);
	}

	return (
		<div className="min-h-screen pt-20 bg-gradient-to-br from-black via-gray-900 to-black">
			{/* Header */}
			<div className="py-16 bg-gradient-to-r from-red-600/20 to-orange-600/20">
				<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
					<div className="text-center">
						<h1 className="text-5xl md:text-6xl font-black text-white mb-6 bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
							Todos os Posts
						</h1>
						<p className="text-xl text-gray-400 max-w-2xl mx-auto">
							Explore todo o nosso conteúdo sobre motorsport, tuning e cultura
							automotiva
						</p>
					</div>
				</div>
			</div>

			{/* Filters and Controls */}
			<div className="py-8 bg-gradient-to-b from-gray-900/50 to-transparent">
				<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
					<div className="flex flex-col lg:flex-row gap-6 items-center justify-between">
						{/* Search */}
						<div className="relative flex-1 max-w-md">
							<Search className="absolute left-4 top-4 w-5 h-5 text-gray-400" />
							<input
								type="text"
								placeholder="Buscar posts..."
								value={searchTerm}
								onChange={(e) => setSearchTerm(e.target.value)}
								className="w-full pl-12 pr-4 py-4 bg-gray-800/50 border border-gray-600/50 rounded-2xl text-white placeholder-gray-500 focus:outline-none focus:border-red-500/50 focus:bg-gray-800 transition-all duration-300"
							/>
						</div>

						{/* Filters */}
						<div className="flex flex-wrap items-center gap-4">
							{/* Category Filter */}
							<div className="relative">
								<select
									value={selectedCategory}
									onChange={(e) => setSelectedCategory(e.target.value)}
									className="appearance-none bg-gray-800/50 border border-gray-600/50 rounded-2xl text-white px-6 py-4 pr-12 focus:outline-none focus:border-red-500/50 focus:bg-gray-800 transition-all duration-300"
								>
									<option value="all">Todas as categorias</option>
									{categories.map((category) => (
										<option key={category.id} value={category.id}>
											{category.name}
										</option>
									))}
								</select>
								<ChevronDown className="absolute right-4 top-4 w-5 h-5 text-gray-400 pointer-events-none" />
							</div>

							{/* Sort Filter */}
							<div className="relative">
								<select
									value={sortBy}
									onChange={(e) => setSortBy(e.target.value)}
									className="appearance-none bg-gray-800/50 border border-gray-600/50 rounded-2xl text-white px-6 py-4 pr-12 focus:outline-none focus:border-red-500/50 focus:bg-gray-800 transition-all duration-300"
								>
									<option value="newest">Mais recentes</option>
									<option value="oldest">Mais antigos</option>
									<option value="trending">Em alta</option>
								</select>
								<ChevronDown className="absolute right-4 top-4 w-5 h-5 text-gray-400 pointer-events-none" />
							</div>

							{/* View Mode */}
							<div className="flex items-center bg-gray-800/50 border border-gray-600/50 rounded-2xl p-1">
								<button
									onClick={() => setViewMode("grid")}
									className={`p-3 rounded-xl transition-all duration-300 ${
										viewMode === "grid"
											? "bg-red-600 text-white"
											: "text-gray-400 hover:text-white"
									}`}
								>
									<Grid className="w-5 h-5" />
								</button>
								<button
									onClick={() => setViewMode("list")}
									className={`p-3 rounded-xl transition-all duration-300 ${
										viewMode === "list"
											? "bg-red-600 text-white"
											: "text-gray-400 hover:text-white"
									}`}
								>
									<List className="w-5 h-5" />
								</button>
							</div>
						</div>
					</div>

					{/* Results Info */}
					<div className="mt-6 flex items-center justify-between">
						<p className="text-gray-400">
							{filteredAndSortedPosts.length} post
							{filteredAndSortedPosts.length !== 1 ? "s" : ""} encontrado
							{filteredAndSortedPosts.length !== 1 ? "s" : ""}
							{selectedCategory !== "all" &&
								` em ${
									categories.find((c) => c.id === selectedCategory)?.name ||
									"categoria"
								}`}
						</p>
					</div>
				</div>
			</div>

			{/* Posts Content */}
			<div className="py-8">
				<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
					{isLoading ? (
						viewMode === "grid" ? (
							<PostsGridSkeleton />
						) : (
							<PostsListSkeleton />
						)
					) : filteredAndSortedPosts.length === 0 ? (
						<div className="text-center py-16">
							<div className="w-20 h-20 bg-gradient-to-r from-gray-600 to-gray-500 rounded-3xl flex items-center justify-center mx-auto mb-6">
								<Search className="w-10 h-10 text-gray-400" />
							</div>
							<h3 className="text-2xl font-bold text-white mb-4">
								Nenhum post encontrado
							</h3>
							<p className="text-gray-400 mb-8">
								{searchTerm || selectedCategory !== "all"
									? "Tente ajustar os filtros ou busca"
									: "Não há posts publicados no momento"}
							</p>
							{(searchTerm || selectedCategory !== "all") && (
								<button
									onClick={() => {
										setSearchTerm("");
										setSelectedCategory("all");
									}}
									className="bg-gradient-to-r from-red-600 to-red-500 hover:from-red-500 hover:to-red-400 text-white px-8 py-4 rounded-2xl font-bold transition-all duration-300"
								>
									Limpar Filtros
								</button>
							)}
						</div>
					) : (
						<>
							{viewMode === "grid" ? (
								<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
									{filteredAndSortedPosts.map((post, index) => (
										<PostCardGrid
											key={`grid-${post.id}`}
											post={post}
											index={index}
										/>
									))}
								</div>
							) : (
								<div className="space-y-8">
									{filteredAndSortedPosts.map((post, index) => (
										<PostCardList
											key={`list-${post.id}`}
											post={post}
											index={index}
										/>
									))}
								</div>
							)}
						</>
					)}
				</div>
			</div>

			{/* Back to Home */}
			<div className="py-16 text-center">
				<Link
					to="/"
					className="inline-flex items-center space-x-2 border-2 border-gray-600 hover:border-red-500 text-gray-300 hover:text-white px-8 py-4 rounded-2xl font-bold transition-all duration-300"
				>
					<ArrowRight className="w-4 h-4 rotate-180" />
					<span>Voltar ao início</span>
				</Link>
			</div>
		</div>
	);
};

export default AllPosts;
