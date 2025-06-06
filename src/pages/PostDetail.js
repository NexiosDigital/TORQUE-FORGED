import React from "react";
import { useParams, Link } from "react-router-dom";
import { Calendar, User, Clock, ArrowLeft, Tag, Share2 } from "lucide-react";
import { posts } from "../data/posts";

const PostDetail = () => {
	const { id } = useParams();
	const post = posts.find((p) => p.id === parseInt(id));

	if (!post) {
		return (
			<div className="min-h-screen pt-20 flex items-center justify-center">
				<div className="text-center">
					<h1 className="text-4xl font-bold text-white mb-4">
						Post não encontrado
					</h1>
					<Link to="/" className="text-red-400 hover:text-red-300">
						Voltar para o início
					</Link>
				</div>
			</div>
		);
	}

	return (
		<div className="min-h-screen pt-20">
			{/* Hero Image */}
			<div className="relative h-96 md:h-[60vh] overflow-hidden">
				<img
					src={post.image}
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
							{post.categoryName}
						</Link>
						<h1 className="text-3xl md:text-5xl font-black text-white leading-tight">
							{post.title}
						</h1>
					</div>
				</div>
			</div>

			{/* Article Content */}
			<div className="py-16 bg-gradient-to-b from-gray-900 to-black">
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
								<span>{new Date(post.date).toLocaleDateString("pt-BR")}</span>
							</div>
							<div className="flex items-center space-x-2">
								<Clock className="w-5 h-5" />
								<span>{post.readTime} de leitura</span>
							</div>
						</div>
						<button className="flex items-center space-x-2 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition-colors duration-300">
							<Share2 className="w-4 h-4" />
							<span>Compartilhar</span>
						</button>
					</div>

					{/* Article Body */}
					<div className="prose prose-invert prose-lg max-w-none">
						<div className="text-gray-300 leading-relaxed space-y-6">
							{post.content.split("\n\n").map((paragraph, index) => (
								<p key={index} className="text-lg leading-relaxed">
									{paragraph}
								</p>
							))}
						</div>
					</div>

					{/* Tags */}
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

					{/* Related Posts */}
					<div className="mt-16">
						<h3 className="text-2xl font-bold text-white mb-8">
							Posts Relacionados
						</h3>
						<div className="grid grid-cols-1 md:grid-cols-2 gap-8">
							{posts
								.filter((p) => p.category === post.category && p.id !== post.id)
								.slice(0, 2)
								.map((relatedPost) => (
									<Link
										key={relatedPost.id}
										to={`/post/${relatedPost.id}`}
										className="group"
									>
										<article className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl overflow-hidden hover:scale-105 transition-all duration-300">
											<img
												src={relatedPost.image}
												alt={relatedPost.title}
												className="w-full h-48 object-cover"
											/>
											<div className="p-6">
												<h4 className="text-lg font-bold text-white group-hover:text-red-400 transition-colors duration-300">
													{relatedPost.title}
												</h4>
												<p className="text-gray-400 mt-2 text-sm">
													{relatedPost.excerpt.substring(0, 100)}...
												</p>
											</div>
										</article>
									</Link>
								))}
						</div>
					</div>
				</div>
			</div>
		</div>
	);
};

export default PostDetail;
