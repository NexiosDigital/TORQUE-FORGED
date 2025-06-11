import React, { Suspense, useMemo } from "react";
import { Link } from "react-router-dom";
import {
	Plus,
	Edit,
	Trash2,
	Eye,
	EyeOff,
	TrendingUp,
	FileText,
	Shield,
	RefreshCw,
	BarChart3,
	ArrowLeft,
} from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";
import {
	useAllPostsAdmin,
	useUpdatePost,
	useDeletePost,
} from "../../hooks/usePostsQuery";
import { ErrorBoundary } from "react-error-boundary";

/**
 * Dashboard Admin - Limpo e Sem Debug
 * - Usa hooks administrativos separados
 * - Cache específico para admin
 * - Interface clean e funcional
 */

// Loading skeleton para dashboard
const DashboardSkeleton = () => (
	<div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-black pt-20">
		<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
			{/* Header skeleton */}
			<div className="mb-8 animate-pulse">
				<div className="h-8 bg-gray-700 rounded w-64 mb-2"></div>
				<div className="h-4 bg-gray-700 rounded w-48"></div>
			</div>

			{/* Stats skeleton */}
			<div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
				{[1, 2, 3, 4].map((i) => (
					<div key={i} className="bg-gray-800 rounded-3xl p-6 animate-pulse">
						<div className="h-4 bg-gray-700 rounded mb-2"></div>
						<div className="h-8 bg-gray-700 rounded w-16 mb-2"></div>
						<div className="h-3 bg-gray-700 rounded w-12"></div>
					</div>
				))}
			</div>

			{/* Table skeleton */}
			<div className="bg-gray-800 rounded-3xl p-6 animate-pulse">
				<div className="h-6 bg-gray-700 rounded w-32 mb-6"></div>
				<div className="space-y-4">
					{[1, 2, 3, 4, 5].map((i) => (
						<div key={i} className="flex items-center space-x-4">
							<div className="h-4 bg-gray-700 rounded flex-1"></div>
							<div className="h-4 bg-gray-700 rounded w-24"></div>
							<div className="h-4 bg-gray-700 rounded w-20"></div>
							<div className="h-4 bg-gray-700 rounded w-16"></div>
						</div>
					))}
				</div>
			</div>
		</div>
	</div>
);

// Error fallback para dashboard
const DashboardErrorFallback = ({ resetErrorBoundary }) => (
	<div className="min-h-screen bg-black flex items-center justify-center">
		<div className="text-center p-8 max-w-md mx-auto">
			<div className="w-20 h-20 bg-red-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
				<Shield className="w-10 h-10 text-white" />
			</div>
			<h1 className="text-3xl font-bold text-white mb-4">Erro no Dashboard</h1>
			<p className="text-gray-400 mb-6 leading-relaxed">
				Ocorreu um erro ao carregar o dashboard administrativo.
			</p>
			<div className="space-y-3">
				<button
					onClick={resetErrorBoundary}
					className="w-full bg-gradient-to-r from-red-600 to-red-500 hover:from-red-500 hover:to-red-400 text-white px-6 py-3 rounded-xl font-semibold transition-all duration-300 shadow-lg hover:shadow-red-500/25 hover:scale-105"
				>
					Tentar Novamente
				</button>
				<Link
					to="/"
					className="w-full inline-block border border-gray-600 hover:border-red-500 text-gray-300 hover:text-white px-6 py-3 rounded-xl font-semibold transition-all duration-300 text-center"
				>
					Voltar ao Site
				</Link>
			</div>
		</div>
	</div>
);

// Componente de estatísticas em tempo real
const RealTimeStats = React.memo(({ posts }) => {
	const stats = useMemo(() => {
		if (!posts || !Array.isArray(posts)) {
			return { total: 0, published: 0, drafts: 0, trending: 0 };
		}

		return {
			total: posts.length,
			published: posts.filter((p) => p.published).length,
			drafts: posts.filter((p) => !p.published).length,
			trending: posts.filter((p) => p.trending).length,
		};
	}, [posts]);

	const statCards = [
		{
			title: "Total de Posts",
			value: stats.total,
			subtitle: "Todos os posts",
			icon: FileText,
			color: "text-blue-400",
			bgColor: "from-blue-900 to-blue-800",
		},
		{
			title: "Publicados",
			value: stats.published,
			subtitle: "Posts ativos",
			icon: Eye,
			color: "text-green-400",
			bgColor: "from-green-900 to-green-800",
		},
		{
			title: "Rascunhos",
			value: stats.drafts,
			subtitle: "Posts pendentes",
			icon: EyeOff,
			color: "text-yellow-400",
			bgColor: "from-yellow-900 to-yellow-800",
		},
		{
			title: "Em Alta",
			value: stats.trending,
			subtitle: "Posts trending",
			icon: TrendingUp,
			color: "text-orange-400",
			bgColor: "from-orange-900 to-orange-800",
		},
	];

	return (
		<div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
			{statCards.map((stat) => {
				const Icon = stat.icon;
				return (
					<div
						key={stat.title}
						className={`bg-gradient-to-br ${stat.bgColor} rounded-3xl p-6 border border-gray-700/50 relative overflow-hidden`}
					>
						{/* Background decoration */}
						<div className="absolute top-0 right-0 w-20 h-20 bg-white/5 rounded-full -translate-y-10 translate-x-10"></div>

						<div className="flex items-center justify-between">
							<div>
								<p className="text-gray-400 text-sm font-medium">
									{stat.title}
								</p>
								<p className={`text-3xl font-bold ${stat.color} mb-1`}>
									{stat.value.toLocaleString()}
								</p>
								<p className="text-xs text-gray-500">{stat.subtitle}</p>
							</div>
							<Icon className={`w-8 h-8 ${stat.color} opacity-80`} />
						</div>
					</div>
				);
			})}
		</div>
	);
});

// Componente de linha da tabela memoizado
const PostTableRow = React.memo(({ post, onTogglePublished, onDelete }) => {
	const formatDate = useMemo(() => {
		try {
			return new Date(post.created_at).toLocaleDateString("pt-BR");
		} catch (error) {
			return "Data inválida";
		}
	}, [post.created_at]);

	return (
		<tr className="border-b border-gray-700/30 hover:bg-gray-800/30 transition-colors duration-300">
			<td className="py-4 px-6">
				<div>
					<h3 className="text-white font-semibold line-clamp-1">
						{post.title}
					</h3>
					<p className="text-gray-400 text-sm line-clamp-1">
						{post.excerpt?.substring(0, 80)}...
					</p>
				</div>
			</td>
			<td className="py-4 px-6">
				<span className="bg-gradient-to-r from-red-600 to-red-500 text-white px-3 py-1 rounded-full text-sm font-semibold">
					{post.category_name}
				</span>
			</td>
			<td className="py-4 px-6">
				<div className="flex flex-col space-y-1">
					<span
						className={`px-3 py-1 rounded-full text-sm font-semibold w-fit ${
							post.published
								? "bg-green-500/20 text-green-400"
								: "bg-yellow-500/20 text-yellow-400"
						}`}
					>
						{post.published ? "Publicado" : "Rascunho"}
					</span>
					{post.trending && (
						<span className="px-2 py-1 rounded-full text-xs font-semibold bg-orange-500/20 text-orange-400 w-fit">
							Trending
						</span>
					)}
				</div>
			</td>
			<td className="py-4 px-6 text-gray-400 text-sm">{formatDate}</td>
			<td className="py-4 px-6">
				<div className="flex items-center justify-end space-x-2">
					<button
						onClick={() => onTogglePublished(post)}
						className={`p-2 rounded-lg transition-colors duration-300 ${
							post.published
								? "text-green-400 hover:bg-green-500/20"
								: "text-gray-400 hover:bg-gray-700"
						}`}
						title={post.published ? "Despublicar" : "Publicar"}
					>
						{post.published ? (
							<Eye className="w-4 h-4" />
						) : (
							<EyeOff className="w-4 h-4" />
						)}
					</button>
					<Link
						to={`/admin/posts/edit/${post.id}`}
						className="p-2 rounded-lg text-blue-400 hover:bg-blue-500/20 transition-colors duration-300"
						title="Editar"
					>
						<Edit className="w-4 h-4" />
					</Link>
					<button
						onClick={() => onDelete(post.id)}
						className="p-2 rounded-lg text-red-400 hover:bg-red-500/20 transition-colors duration-300"
						title="Deletar"
					>
						<Trash2 className="w-4 h-4" />
					</button>
				</div>
			</td>
		</tr>
	);
});

// Tabela de posts otimizada
const PostsTable = React.memo(({ posts, filter }) => {
	const updatePostMutation = useUpdatePost();
	const deletePostMutation = useDeletePost();

	const filteredPosts = useMemo(() => {
		if (!posts || !Array.isArray(posts)) return [];

		switch (filter) {
			case "published":
				return posts.filter((post) => post.published);
			case "draft":
				return posts.filter((post) => !post.published);
			default:
				return posts;
		}
	}, [posts, filter]);

	const handleTogglePublished = (post) => {
		updatePostMutation.mutate({
			id: post.id,
			published: !post.published,
		});
	};

	const handleDelete = (id) => {
		if (window.confirm("Tem certeza que deseja deletar este post?")) {
			deletePostMutation.mutate(id);
		}
	};

	if (filteredPosts.length === 0) {
		return (
			<div className="text-center py-12">
				<FileText className="w-16 h-16 text-gray-600 mx-auto mb-4" />
				<h3 className="text-xl font-semibold text-gray-400 mb-2">
					Nenhum post encontrado
				</h3>
				<p className="text-gray-500 mb-6">
					{filter === "all"
						? "Comece criando seu primeiro post!"
						: `Nenhum post ${
								filter === "published" ? "publicado" : "em rascunho"
						  } encontrado.`}
				</p>
				<Link
					to="/admin/posts/new"
					className="inline-flex items-center space-x-2 bg-gradient-to-r from-red-600 to-red-500 hover:from-red-500 hover:to-red-400 text-white px-6 py-3 rounded-xl font-semibold transition-all duration-300 shadow-lg hover:shadow-red-500/25 hover:scale-105"
				>
					<Plus className="w-4 h-4" />
					<span>Criar Primeiro Post</span>
				</Link>
			</div>
		);
	}

	return (
		<div className="overflow-x-auto">
			<table className="w-full">
				<thead className="bg-gray-800/50">
					<tr>
						<th className="text-left py-4 px-6 text-gray-300 font-semibold">
							Título
						</th>
						<th className="text-left py-4 px-6 text-gray-300 font-semibold">
							Categoria
						</th>
						<th className="text-left py-4 px-6 text-gray-300 font-semibold">
							Status
						</th>
						<th className="text-left py-4 px-6 text-gray-300 font-semibold">
							Data
						</th>
						<th className="text-right py-4 px-6 text-gray-300 font-semibold">
							Ações
						</th>
					</tr>
				</thead>
				<tbody>
					{filteredPosts.map((post) => (
						<PostTableRow
							key={post.id}
							post={post}
							onTogglePublished={handleTogglePublished}
							onDelete={handleDelete}
						/>
					))}
				</tbody>
			</table>
		</div>
	);
});

// Componente principal do dashboard
const DashboardContent = () => {
	const { signOut, isAdmin, getDisplayName } = useAuth();

	// Hook admin específico
	const { data: posts = [], isLoading, error, refetch } = useAllPostsAdmin();

	const [filter, setFilter] = React.useState("all");

	// Redirect se não for admin
	React.useEffect(() => {
		if (!isAdmin && !isLoading) {
			window.location.href = "/";
		}
	}, [isAdmin, isLoading]);

	const stats = useMemo(() => {
		return {
			total: posts.length,
			published: posts.filter((p) => p.published).length,
			drafts: posts.filter((p) => !p.published).length,
		};
	}, [posts]);

	const handleRefresh = () => {
		refetch();
	};

	if (error) {
		throw error; // Será capturado pelo Error Boundary
	}

	return (
		<div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-black pt-20">
			<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
				{/* Header */}
				<div className="flex flex-col md:flex-row md:justify-between md:items-center mb-8 space-y-4 md:space-y-0">
					<div>
						<h1 className="text-4xl font-black text-white mb-2 bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
							Dashboard Admin
						</h1>
						<p className="text-gray-400">
							Bem-vindo,{" "}
							<span className="text-red-400 font-medium">
								{getDisplayName()}
							</span>
						</p>
					</div>

					<div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-4">
						<Link
							to="/"
							className="flex items-center justify-center space-x-2 border border-gray-600 hover:border-red-500 text-gray-300 hover:text-white px-4 py-2 rounded-xl font-semibold transition-all duration-300"
						>
							<ArrowLeft className="w-4 h-4" />
							<span>Voltar ao Início</span>
						</Link>

						<button
							onClick={handleRefresh}
							disabled={isLoading}
							className="flex items-center justify-center space-x-2 border border-gray-600 hover:border-red-500 text-gray-300 hover:text-white px-4 py-2 rounded-xl font-semibold transition-all duration-300"
						>
							<RefreshCw
								className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`}
							/>
							<span>Atualizar</span>
						</button>

						<Link
							to="/admin/posts/new"
							className="bg-gradient-to-r from-red-600 to-red-500 hover:from-red-500 hover:to-red-400 text-white px-6 py-3 rounded-xl font-semibold transition-all duration-300 shadow-lg hover:shadow-red-500/25 hover:scale-105 flex items-center justify-center space-x-2"
						>
							<Plus className="w-5 h-5" />
							<span>Novo Post</span>
						</Link>

						<button
							onClick={signOut}
							className="border border-gray-600 hover:border-red-500 text-gray-300 hover:text-white px-6 py-3 rounded-xl font-semibold transition-all duration-300"
						>
							Sair
						</button>
					</div>
				</div>

				{/* Real-time Stats */}
				<RealTimeStats posts={posts} />

				{/* Filters */}
				<div className="mb-6">
					<div className="flex flex-wrap space-x-2 space-y-2 sm:space-y-0">
						{[
							{ key: "all", label: "Todos", count: stats.total },
							{ key: "published", label: "Publicados", count: stats.published },
							{ key: "draft", label: "Rascunhos", count: stats.drafts },
						].map(({ key, label, count }) => (
							<button
								key={key}
								onClick={() => setFilter(key)}
								className={`px-6 py-2 rounded-xl font-semibold transition-all duration-300 ${
									filter === key
										? "bg-gradient-to-r from-red-600 to-red-500 text-white shadow-lg"
										: "bg-gray-800 text-gray-300 hover:bg-gray-700"
								}`}
							>
								{label} ({count})
							</button>
						))}
					</div>
				</div>

				{/* Posts Table */}
				<div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-3xl border border-gray-700/50 overflow-hidden">
					<div className="p-6 border-b border-gray-700/50">
						<div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-2 sm:space-y-0">
							<h2 className="text-2xl font-bold text-white flex items-center space-x-3">
								<BarChart3 className="w-6 h-6 text-red-400" />
								<span>Gerenciar Posts</span>
							</h2>
							{isLoading && (
								<div className="flex items-center space-x-2 text-gray-400">
									<RefreshCw className="w-4 h-4 animate-spin" />
									<span className="text-sm">Carregando posts admin...</span>
								</div>
							)}
						</div>
					</div>

					<PostsTable posts={posts} filter={filter} />
				</div>
			</div>
		</div>
	);
};

// Componente principal com Error Boundary
const OptimizedAdminDashboard = () => {
	return (
		<ErrorBoundary
			FallbackComponent={DashboardErrorFallback}
			onReset={() => {
				window.location.reload();
			}}
		>
			<Suspense fallback={<DashboardSkeleton />}>
				<DashboardContent />
			</Suspense>
		</ErrorBoundary>
	);
};

export default OptimizedAdminDashboard;
