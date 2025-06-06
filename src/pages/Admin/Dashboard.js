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
} from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";
import { usePosts } from "../../hooks/usePosts";

const Dashboard = () => {
	const { user, signOut } = useAuth();
	const { posts, loading, deletePost, updatePost, fetchPosts } = usePosts();
	const [filter, setFilter] = useState("all"); // all, published, draft

	useEffect(() => {
		fetchPosts(null); // Buscar todos os posts para admin
	}, []);

	const filteredPosts = posts.filter((post) => {
		if (filter === "published") return post.published;
		if (filter === "draft") return !post.published;
		return true;
	});

	const handleDelete = async (id) => {
		if (window.confirm("Tem certeza que deseja deletar este post?")) {
			await deletePost(id);
		}
	};

	const togglePublished = async (post) => {
		await updatePost(post.id, { published: !post.published });
	};

	const stats = {
		total: posts.length,
		published: posts.filter((p) => p.published).length,
		drafts: posts.filter((p) => !p.published).length,
		trending: posts.filter((p) => p.trending).length,
	};

	if (loading) {
		return (
			<div className="min-h-screen bg-black flex items-center justify-center">
				<div className="animate-spin rounded-full h-32 w-32 border-b-2 border-red-500"></div>
			</div>
		);
	}

	return (
		<div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-black pt-20">
			<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
				{/* Header */}
				<div className="flex justify-between items-center mb-8">
					<div>
						<h1 className="text-4xl font-black text-white mb-2">
							Dashboard Admin
						</h1>
						<p className="text-gray-400">Bem-vindo, {user?.email}</p>
					</div>
					<div className="flex space-x-4">
						<Link
							to="/admin/posts/new"
							className="bg-gradient-to-r from-red-600 to-red-500 hover:from-red-500 hover:to-red-400 text-white px-6 py-3 rounded-xl font-semibold transition-all duration-300 shadow-lg hover:shadow-red-500/25 hover:scale-105 flex items-center space-x-2"
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

				{/* Stats */}
				<div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
					<div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-3xl p-6 border border-gray-700/50">
						<div className="flex items-center justify-between">
							<div>
								<p className="text-gray-400 text-sm">Total de Posts</p>
								<p className="text-3xl font-bold text-white">{stats.total}</p>
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
							</div>
							<TrendingUp className="w-8 h-8 text-orange-400" />
						</div>
					</div>
				</div>

				{/* Filters */}
				<div className="mb-6">
					<div className="flex space-x-4">
						{[
							{ key: "all", label: "Todos" },
							{ key: "published", label: "Publicados" },
							{ key: "draft", label: "Rascunhos" },
						].map(({ key, label }) => (
							<button
								key={key}
								onClick={() => setFilter(key)}
								className={`px-6 py-2 rounded-xl font-semibold transition-all duration-300 ${
									filter === key
										? "bg-gradient-to-r from-red-600 to-red-500 text-white"
										: "bg-gray-800 text-gray-300 hover:bg-gray-700"
								}`}
							>
								{label}
							</button>
						))}
					</div>
				</div>

				{/* Posts Table */}
				<div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-3xl border border-gray-700/50 overflow-hidden">
					<div className="p-6 border-b border-gray-700/50">
						<h2 className="text-2xl font-bold text-white">
							Posts ({filteredPosts.length})
						</h2>
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
											<span
												className={`px-3 py-1 rounded-full text-sm font-semibold ${
													post.published
														? "bg-green-500/20 text-green-400"
														: "bg-yellow-500/20 text-yellow-400"
												}`}
											>
												{post.published ? "Publicado" : "Rascunho"}
											</span>
										</td>
										<td className="py-4 px-6 text-gray-400">
											{new Date(post.created_at).toLocaleDateString("pt-BR")}
										</td>
										<td className="py-4 px-6">
											<div className="flex items-center justify-end space-x-2">
												<button
													onClick={() => togglePublished(post)}
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
													onClick={() => handleDelete(post.id)}
													className="p-2 rounded-lg text-red-400 hover:bg-red-500/20 transition-colors duration-300"
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

					{filteredPosts.length === 0 && (
						<div className="text-center py-12">
							<FileText className="w-16 h-16 text-gray-600 mx-auto mb-4" />
							<h3 className="text-xl font-semibold text-gray-400 mb-2">
								Nenhum post encontrado
							</h3>
							<p className="text-gray-500">
								{filter === "all"
									? "Comece criando seu primeiro post!"
									: `Nenhum post ${
											filter === "published" ? "publicado" : "em rascunho"
									  } encontrado.`}
							</p>
						</div>
					)}
				</div>
			</div>
		</div>
	);
};

export default Dashboard;
