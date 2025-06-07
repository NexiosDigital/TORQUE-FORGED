import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import {
	Calendar,
	User,
	Clock,
	ArrowLeft,
	Tag,
	Share2,
	Loader,
} from "lucide-react";
import { FastDataService } from "../services/FastDataService";

const PostDetail = () => {
	const { id } = useParams();
	const [post, setPost] = useState(null);
	const [relatedPosts, setRelatedPosts] = useState([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState(null);

	useEffect(() => {
		let isMounted = true;

		const loadPost = async () => {
			if (!id) {
				setError("ID do post não fornecido");
				setLoading(false);
				return;
			}

			try {
				setLoading(true);
				setError(null);

				console.log(`🔄 PostDetail: Carregando post ID: ${id}`);

				// Buscar o post principal
				const postData = await FastDataService.getPostById(id);

				if (!isMounted) return;

				if (!postData) {
					setError("Post não encontrado");
					return;
				}

				setPost(postData);
				console.log(`✅ PostDetail: Post carregado:`, postData.title);

				// Buscar posts relacionados da mesma categoria
				if (postData.category) {
					try {
						const categoryPosts = await FastDataService.getPostsByCategory(
							postData.category
						);

						if (isMounted) {
							// Filtrar o post atual e limitar a 2 posts relacionados
							const filteredRelated = categoryPosts
								.filter((p) => p.id !== postData.id)
								.slice(0, 2);

							setRelatedPosts(filteredRelated);
							console.log(
								`✅ PostDetail: Posts relacionados carregados:`,
								filteredRelated.length
							);
						}
					} catch (relatedError) {
						console.error(
							"❌ PostDetail: Erro ao carregar posts relacionados:",
							relatedError
						);
						// Não é um erro crítico, continue sem posts relacionados
					}
				}
			} catch (error) {
				console.error("❌ PostDetail: Erro ao carregar post:", error);
				if (isMounted) {
					setError("Erro ao carregar o post");
				}
			} finally {
				if (isMounted) {
					setLoading(false);
				}
			}
		};

		loadPost();

		return () => {
			isMounted = false;
		};
	}, [id]);

	const formatDate = (dateString) => {
		try {
			return new Date(dateString).toLocaleDateString("pt-BR");
		} catch (error) {
			return "Data inválida";
		}
	};

	const handleShare = async () => {
		if (navigator.share) {
			try {
				await navigator.share({
					title: post.title,
					text: post.excerpt,
					url: window.location.href,
				});
			} catch (error) {
				console.log("Error sharing:", error);
			}
		} else {
			// Fallback: copiar URL para clipboard
			try {
				await navigator.clipboard.writeText(window.location.href);
				console.log("URL copiada para clipboard");
			} catch (error) {
				console.log("Error copying to clipboard:", error);
			}
		}
	};

	const renderContent = (content) => {
		// Dividir o conteúdo em parágrafos
		const paragraphs = content.split("\n\n").filter((p) => p.trim());

		return paragraphs.map((paragraph, index) => (
			<p key={index} className="text-lg leading-relaxed mb-6">
				{paragraph}
			</p>
		));
	};

	if (loading) {
		return (
			<div className="min-h-screen pt-20 bg-gradient-to-br from-black via-gray-900 to-black flex items-center justify-center">
				<div className="text-center">
					<Loader className="w-12 h-12 text-red-400 animate-spin mx-auto mb-4" />
					<p className="text-gray-400 text-lg">Carregando post...</p>
					<p className="text-gray-500 text-sm mt-2">Sistema Unificado</p>
				</div>
			</div>
		);
	}

	if (error || !post) {
		return (
			<div className="min-h-screen pt-20 bg-gradient-to-br from-black via-gray-900 to-black flex items-center justify-center">
				<div className="text-center">
					<h1 className="text-4xl font-bold text-white mb-4">
						{error || "Post não encontrado"}
					</h1>
					<p className="text-gray-400 mb-8">
						O post que você está procurando não existe ou foi removido.
					</p>
					<div className="space-y-3 md:space-x-4 md:space-y-0 md:flex md:justify-center">
						<Link
							to="/"
							className="inline-flex items-center space-x-2 bg-gradient-to-r from-red-600 to-red-500 hover:from-red-500 hover:to-red-400 text-white px-6 py-3 rounded-xl font-semibold transition-all duration-300 shadow-lg hover:shadow-red-500/25 hover:scale-105"
						>
							<ArrowLeft className="w-4 h-4" />
							<span>Voltar ao início</span>
						</Link>
						<button
							onClick={() => window.location.reload()}
							className="inline-flex items-center space-x-2 border border-gray-600 hover:border-red-500 text-gray-300 hover:text-white px-6 py-3 rounded-xl font-semibold transition-all duration-300"
						>
							<span>Tentar Novamente</span>
						</button>
					</div>
				</div>
			</div>
		);
	}

	return (
		<div className="min-h-screen pt-20 bg-gradient-to-br from-black via-gray-900 to-black">
			{/* Hero Image */}
			<div className="relative h-96 md:h-[60vh] overflow-hidden">
				<img
					src={
						post.image_url ||
						"https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800"
					}
					alt={post.title}
					className="w-full h-full object-cover"
				/>
				<div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent"></div>

				<div className="absolute bottom-8 left-0 right-0">
					<div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
						<Link
							to={`/${post.category}`}
							className="inline-flex items-center px-4 py-2 rounded-full bg-gradient-to-r from-red-600 to-red-500 text-white text-sm font-semibold mb-4 hover:shadow-lg transition-all duration-300"
						>
							<Tag className="w-4 h-4 mr-2" />
							{post.category_name}
						</Link>
						<h1 className="text-3xl md:text-5xl font-black text-white leading-tight">
							{post.title}
						</h1>
					</div>
				</div>
			</div>

			{/* Article Content */}
			<div className="py-16">
				<div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
					{/* Back Button */}
					<Link
						to="/"
						className="inline-flex items-center text-red-400 hover:text-red-300 mb-8 transition-colors duration-300"
					>
						<ArrowLeft className="w-4 h-4 mr-2" />
						Voltar
					</Link>

					{/* Article Meta */}
					<div className="flex flex-wrap items-center justify-between mb-12 p-6 bg-gradient-to-r from-gray-900 to-gray-800 rounded-2xl border border-gray-700/50">
						<div className="flex flex-wrap items-center space-x-6 text-gray-400">
							<div className="flex items-center space-x-2">
								<User className="w-5 h-5" />
								<span className="font-medium">{post.author}</span>
							</div>
							<div className="flex items-center space-x-2">
								<Calendar className="w-5 h-5" />
								<span>{formatDate(post.created_at)}</span>
							</div>
							<div className="flex items-center space-x-2">
								<Clock className="w-5 h-5" />
								<span>{post.read_time} de leitura</span>
							</div>
						</div>
						<button
							onClick={handleShare}
							className="flex items-center space-x-2 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition-colors duration-300"
						>
							<Share2 className="w-4 h-4" />
							<span>Compartilhar</span>
						</button>
					</div>

					{/* Article Body */}
					<div className="prose prose-invert prose-lg max-w-none">
						<div className="text-gray-300 leading-relaxed">
							{renderContent(post.content)}
						</div>
					</div>

					{/* Tags */}
					{post.tags && post.tags.length > 0 && (
						<div className="mt-12 pt-8 border-t border-gray-700">
							<h3 className="text-white font-bold mb-4">Tags:</h3>
							<div className="flex flex-wrap gap-3">
								{post.tags.map((tag, index) => (
									<span
										key={index}
										className="bg-gray-800 text-gray-300 px-4 py-2 rounded-full text-sm hover:bg-gray-700 transition-colors duration-300"
									>
										#{tag}
									</span>
								))}
							</div>
						</div>
					)}

					{/* Related Posts */}
					{relatedPosts.length > 0 && (
						<div className="mt-16">
							<h3 className="text-2xl font-bold text-white mb-8">
								Posts Relacionados
							</h3>
							<div className="grid grid-cols-1 md:grid-cols-2 gap-8">
								{relatedPosts.map((relatedPost) => (
									<Link
										key={relatedPost.id}
										to={`/post/${relatedPost.id}`}
										className="group"
									>
										<article className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl overflow-hidden hover:scale-105 transition-all duration-300 border border-gray-700/50">
											<img
												src={
													relatedPost.image_url ||
													"https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800"
												}
												alt={relatedPost.title}
												className="w-full h-48 object-cover"
											/>
											<div className="p-6">
												<h4 className="text-lg font-bold text-white group-hover:text-red-400 transition-colors duration-300 mb-2">
													{relatedPost.title}
												</h4>
												<p className="text-gray-400 text-sm line-clamp-2">
													{relatedPost.excerpt}
												</p>
												<div className="flex items-center justify-between mt-4 text-xs text-gray-500">
													<span>{relatedPost.author}</span>
													<span>{formatDate(relatedPost.created_at)}</span>
												</div>
											</div>
										</article>
									</Link>
								))}
							</div>
						</div>
					)}

					{/* Debug Info */}
					{process.env.NODE_ENV === "development" && (
						<div className="mt-8 p-4 bg-gray-800/30 rounded-lg border border-gray-700/30">
							<h4 className="text-white font-semibold mb-2">Debug Info</h4>
							<div className="text-xs text-gray-400 space-y-1">
								<div>Post ID: {post.id}</div>
								<div>Category: {post.category}</div>
								<div>Published: {post.published ? "Yes" : "No"}</div>
								<div>Trending: {post.trending ? "Yes" : "No"}</div>
								<div>Related Posts: {relatedPosts.length}</div>
								<div>Sistema: Unificado</div>
							</div>
						</div>
					)}
				</div>
			</div>
		</div>
	);
};

export default PostDetail;
