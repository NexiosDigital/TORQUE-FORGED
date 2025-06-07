import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
	Plus,
	Edit,
	Trash2,
	Eye,
	EyeOff,
	TrendingUp,
	FileText,
	Users,
	Calendar,
	RefreshCw,
} from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";
import { useFastPosts } from "../../hooks/useFastPosts";

const Dashboard = () => {
	const { user, signOut } = useAuth();
	const {
		posts,
		loading,
		error,
		deletePost,
		updatePost,
		fetchPosts,
		clearCache,
		cacheStats,
	} = useFastPosts();
	const [filter, setFilter] = useState("all"); // all, published, draft

	// Carregar posts com carregamento ultra-rápido
	useEffect(() => {
		console.log("🚀 Dashboard: Carregamento RÁPIDO iniciando...");
		fetchPosts(); // Buscar todos os posts para admin
	}, [fetchPosts]);

	const filteredPosts = posts.filter((post) => {
		if (filter === "published") return post.published;
		if (filter === "draft") return !post.published;
		return true;
	});

	const handleDelete = async (id) => {
		if (window.confirm("Tem certeza que deseja deletar este post?")) {
			console.log("🗑️ Dashboard: Deletando post RÁPIDO ID:", id);
			await deletePost(id);
		}
	};

	const togglePublished = async (post) => {
		console.log("👁️ Dashboard: Alterando status RÁPIDO:", post.id);
		await updatePost(post.id, { published: !post.published });
	};

	const handleRefresh = async () => {
		console.log("🔄 Dashboard: Refresh ULTRA-RÁPIDO...");
		clearCache();
		await fetchPosts();
	};

	const stats = {
		total: posts.length,
		published: posts.filter((p) => p.published).length,
		drafts: posts.filter((p) => !p.published).length,
		trending: posts.filter((p) => p.trending).length,
	};

	if (loading && posts.length === 0) {
		return (
			<div className="min-h-screen bg-black flex items-center justify-center">
				<div className="text-center">
					<div className="animate-spin rounded-full h-32 w-32 border-b-2 border-red-500 mb-4"></div>
					<p className="text-gray-400 text-lg">Carregamento ultra-rápido...</p>
					<p className="text-gray-500 text-sm">⚡ Sistema Fast ≤3s</p>
				</div>
			</div>
		);
	}

	return (
		<div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-black pt-20">
			<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
				{/* Header */}
				<div className="flex flex-col md:flex-row md:justify-between md:items-center mb-8 space-y-4 md:space-y-0">
					<div>
						<h1 className="text-4xl font-black text-white mb-2">
							Dashboard Admin
						</h1>
						<p className="text-gray-400">Bem-vindo, {user?.email}</p>
						{process.env.NODE_ENV === "development" && (
							<div className="mt-2 text-xs text-gray-500 space-y-1">
								<div>
									⚡ Sistema Ultra-Rápido | Cache: {cacheStats.entries} entradas
								</div>
								<div>Performance: ≤3s carregamento | ≤6s operações CRUD</div>
								{error && <div className="text-red-400">Erro: {error}</div>}
							</div>
						)}
					</div>
					<div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-4">
						<button
							onClick={handleRefresh}
							disabled={loading}
							className="flex items-center justify-center space-x-2 border border-gray-600 hover:border-red-500 text-gray-300 hover:text-white px-4 py-2 rounded-xl font-semibold transition-all duration-300"
						>
							<RefreshCw
								className={`w-4 h-4 ${loading ? "animate-spin" : ""}`}
							/>
							<span>Refresh Rápido</span>
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

				{/* Stats - Atualização em tempo real */}
				<div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
					<div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-3xl p-6 border border-gray-700/50">
						<div className="flex items-center justify-between">
							<div>
								<p className="text-gray-400 text-sm">Total de Posts</p>
								<p className="text-3xl font-bold text-white">{stats.total}</p>
								<p className="text-xs text-gray-500 mt-1">Tempo real</p>
							</div>
							<FileText className="w-8 h-8 text-red-400" />
						</div>
					</div>

					<div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-3xl p-6 border border-gray-700/50">
						<div className="flex items-center justify-between">
							<div>
								<p className="text-gray-400 text-sm">Publicados</p>
								<p className="text-3xl font-bold text-green-400">
									{stats.published}
								</p>
								<p className="text-xs text-gray-500 mt-1">Ativos</p>
							</div>
							<Eye className="w-8 h-8 text-green-400" />
						</div>
					</div>

					<div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-3xl p-6 border border-gray-700/50">
						<div className="flex items-center justify-between">
							<div>
								<p className="text-gray-400 text-sm">Rascunhos</p>
								<p className="text-3xl font-bold text-yellow-400">
									{stats.drafts}
								</p>
								<p className="text-xs text-gray-500 mt-1">Pendentes</p>
							</div>
							<EyeOff className="w-8 h-8 text-yellow-400" />
						</div>
					</div>

					<div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-3xl p-6 border border-gray-700/50">
						<div className="flex items-center justify-between">
							<div>
								<p className="text-gray-400 text-sm">Em Alta</p>
								<p className="text-3xl font-bold text-orange-400">
									{stats.trending}
								</p>
								<p className="text-xs text-gray-500 mt-1">Trending</p>
							</div>
							<TrendingUp className="w-8 h-8 text-orange-400" />
						</div>
					</div>
				</div>

				{/* Error Display otimizado */}
				{error && (
					<div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl">
						<p className="text-red-400 font-semibold">
							⚡ Erro no sistema rápido: {error}
						</p>
						<button
							onClick={handleRefresh}
							className="mt-2 text-red-300 hover:text-red-200 text-sm underline"
						>
							Retry ultra-rápido
						</button>
					</div>
				)}

				{/* Filters - Design otimizado */}
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
										? "bg-gradient-to-r from-red-600 to-red-500 text-white"
										: "bg-gray-800 text-gray-300 hover:bg-gray-700"
								}`}
							>
								{label} ({count})
							</button>
						))}
					</div>
				</div>

				{/* Posts Table - Performance otimizada */}
				<div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-3xl border border-gray-700/50 overflow-hidden">
					<div className="p-6 border-b border-gray-700/50">
						<div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-2 sm:space-y-0">
							<h2 className="text-2xl font-bold text-white">
								Posts ({filteredPosts.length})
							</h2>
							{loading && (
								<div className="flex items-center space-x-2 text-gray-400">
									<RefreshCw className="w-4 h-4 animate-spin" />
									<span className="text-sm">Carregamento rápido...</span>
								</div>
							)}
						</div>
					</div>

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
									<tr
										key={post.id}
										className="border-b border-gray-700/30 hover:bg-gray-800/30 transition-colors duration-300"
									>
										<td className="py-4 px-6">
											<div>
												<h3 className="text-white font-semibold">
													{post.title}
												</h3>
												<p className="text-gray-400 text-sm">
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
													className={`px-3 py-1 rounded-full text-sm font-semibold ${
														post.published
															? "bg-green-500/20 text-green-400"
															: "bg-yellow-500/20 text-yellow-400"
													}`}
												>
													{post.published ? "Publicado" : "Rascunho"}
												</span>
												{post.trending && (
													<span className="px-2 py-1 rounded-full text-xs font-semibold bg-orange-500/20 text-orange-400">
														Trending
													</span>
												)}
											</div>
										</td>
										<td className="py-4 px-6 text-gray-400">
											{new Date(post.created_at).toLocaleDateString("pt-BR")}
										</td>
										<td className="py-4 px-6">
											<div className="flex items-center justify-end space-x-2">
												<button
													onClick={() => togglePublished(post)}
													disabled={loading}
													className={`p-2 rounded-lg transition-colors duration-300 ${
														post.published
															? "text-green-400 hover:bg-green-500/20"
															: "text-gray-400 hover:bg-gray-700"
													} disabled:opacity-50`}
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
													onClick={() => handleDelete(post.id)}
													disabled={loading}
													className="p-2 rounded-lg text-red-400 hover:bg-red-500/20 transition-colors duration-300 disabled:opacity-50"
													title="Deletar"
												>
													<Trash2 className="w-4 h-4" />
												</button>
											</div>
										</td>
									</tr>
								))}
							</tbody>
						</table>
					</div>

					{filteredPosts.length === 0 && !loading && (
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
					)}
				</div>
			</div>
		</div>
	);
};

export default Dashboard;
