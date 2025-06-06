import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
	Calendar,
	User,
	Clock,
	ArrowRight,
	TrendingUp,
	Tag,
	Loader,
} from "lucide-react";
import { usePosts } from "../hooks/usePosts";

const CategoryPage = ({ categoryId, title, description, gradient }) => {
	const { fetchPostsByCategory } = usePosts();
	const [categoryPosts, setCategoryPosts] = useState([]);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		const loadCategoryPosts = async () => {
			if (categoryId) {
				try {
					setLoading(true);
					const posts = await fetchPostsByCategory(categoryId, true);
					setCategoryPosts(posts);
				} catch (error) {
					console.error("Error loading category posts:", error);
				} finally {
					setLoading(false);
				}
			}
		};

		loadCategoryPosts();
	}, [categoryId, fetchPostsByCategory]);

	const formatDate = (dateString) => {
		try {
			return new Date(dateString).toLocaleDateString("pt-BR");
		} catch (error) {
			return "Data inválida";
		}
	};

	return (
		<div className="min-h-screen pt-20">
			{/* Hero Section */}
			<div className={`relative py-24 bg-gradient-to-r ${gradient}`}>
				<div className="absolute inset-0 bg-black/60"></div>
				<div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
					<h1 className="text-5xl md:text-6xl font-black text-white mb-6">
						{title}
					</h1>
					<p className="text-xl text-white/90 max-w-2xl mx-auto">
						{description}
					</p>
				</div>
			</div>

			{/* Posts Grid */}
			<div className="py-16 bg-gradient-to-b from-gray-900 to-black">
				<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
					{loading ? (
						<div className="flex justify-center items-center py-12">
							<Loader className="w-8 h-8 text-red-400 animate-spin" />
							<span className="ml-3 text-gray-400">Carregando posts...</span>
						</div>
					) : categoryPosts.length > 0 ? (
						<>
							<div className="mb-8">
								<h2 className="text-2xl font-bold text-white mb-2">
									{categoryPosts.length}{" "}
									{categoryPosts.length === 1
										? "post encontrado"
										: "posts encontrados"}
								</h2>
								<p className="text-gray-400">
									Últimas publicações sobre {title.toLowerCase()}
								</p>
							</div>

							<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
								{categoryPosts.map((post) => (
									<article
										key={post.id}
										className="group bg-gradient-to-br from-gray-900 to-gray-800 rounded-3xl overflow-hidden shadow-2xl hover:shadow-red-500/10 transition-all duration-500 hover:scale-105"
									>
										<div className="relative overflow-hidden">
											<img
												src={
													post.image_url ||
													"https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800"
												}
												alt={post.title}
												className="w-full h-56 object-cover transition-transform duration-700 group-hover:scale-110"
											/>
											<div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent"></div>

											<div className="absolute top-4 left-4 flex items-center space-x-2">
												<span
													className={`bg-gradient-to-r ${gradient} text-white px-4 py-2 rounded-full text-sm font-semibold shadow-lg`}
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
											<Link to={`/post/${post.id}`}>
												<h3 className="text-xl font-bold text-white mb-4 group-hover:text-red-400 transition-colors duration-300 leading-tight">
													{post.title}
												</h3>
											</Link>
											<p className="text-gray-400 mb-6 leading-relaxed line-clamp-3">
												{post.excerpt}
											</p>

											<div className="flex items-center justify-between">
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
													<span>{formatDate(post.created_at)}</span>
												</div>
											</div>

											<div className="mt-6 pt-6 border-t border-gray-700">
												<Link
													to={`/post/${post.id}`}
													className="text-red-400 hover:text-red-300 font-semibold text-sm flex items-center space-x-2 group-hover:space-x-3 transition-all duration-300"
												>
													<span>Leia mais</span>
													<ArrowRight className="w-4 h-4" />
												</Link>
											</div>
										</div>
									</article>
								))}
							</div>
						</>
					) : (
						<div className="text-center py-16">
							<div className="w-24 h-24 bg-gradient-to-r from-gray-800 to-gray-700 rounded-3xl flex items-center justify-center mx-auto mb-6">
								<Tag className="w-12 h-12 text-gray-500" />
							</div>
							<h3 className="text-2xl font-bold text-white mb-4">
								Nenhum post encontrado
							</h3>
							<p className="text-gray-400 mb-8 max-w-md mx-auto">
								Ainda não há posts publicados nesta categoria. Volte em breve
								para ver novos conteúdos sobre {title.toLowerCase()}!
							</p>
							<Link
								to="/"
								className="inline-flex items-center space-x-2 bg-gradient-to-r from-red-600 to-red-500 hover:from-red-500 hover:to-red-400 text-white px-6 py-3 rounded-xl font-semibold transition-all duration-300 shadow-lg hover:shadow-red-500/25 hover:scale-105"
							>
								<ArrowRight className="w-4 h-4 rotate-180" />
								<span>Voltar ao início</span>
							</Link>
						</div>
					)}
				</div>
			</div>
		</div>
	);
};

export default CategoryPage;
