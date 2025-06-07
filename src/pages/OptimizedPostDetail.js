import React, { Suspense, useMemo } from "react";
import { useParams, Link } from "react-router-dom";
import { Calendar, User, Clock, ArrowLeft, Tag, Share2 } from "lucide-react";
import {
	usePostByIdSuspense,
	usePostsByCategory,
	usePrefetch,
} from "../hooks/useUltraFastPosts";
import { ErrorBoundary } from "react-error-boundary";

/**
 * PostDetail Ultra-Otimizado
 * - Usa Suspense Query para carregamento instantâneo
 * - Posts relacionados com prefetching
 * - Sharing nativo otimizado
 * - SEO otimizado
 * - Error boundaries granulares
 */

// Loading skeleton para post
const PostDetailSkeleton = () => (
	<div className="min-h-screen pt-20 bg-gradient-to-br from-black via-gray-900 to-black">
		{/* Hero skeleton */}
		<div className="relative h-96 md:h-[60vh] bg-gray-800 animate-pulse">
			<div className="absolute bottom-8 left-0 right-0">
				<div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
					<div className="w-32 h-6 bg-gray-700 rounded-full mb-4"></div>
					<div className="w-3/4 h-12 bg-gray-700 rounded mb-2"></div>
					<div className="w-1/2 h-8 bg-gray-700 rounded"></div>
				</div>
			</div>
		</div>

		{/* Content skeleton */}
		<div className="py-16">
			<div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
				<div className="w-20 h-4 bg-gray-700 rounded mb-8"></div>

				<div className="bg-gray-800 rounded-2xl p-6 mb-12">
					<div className="flex justify-between items-center">
						<div className="flex space-x-6">
							<div className="w-24 h-4 bg-gray-700 rounded"></div>
							<div className="w-24 h-4 bg-gray-700 rounded"></div>
						</div>
						<div className="w-24 h-8 bg-gray-700 rounded"></div>
					</div>
				</div>

				<div className="space-y-4">
					{Array.from({ length: 8 }).map((_, i) => (
						<div key={i} className="w-full h-4 bg-gray-700 rounded"></div>
					))}
				</div>
			</div>
		</div>
	</div>
);

// Error fallback para post não encontrado
const PostNotFoundFallback = ({ error, resetErrorBoundary }) => (
	<div className="min-h-screen pt-20 bg-gradient-to-br from-black via-gray-900 to-black flex items-center justify-center">
		<div className="text-center p-8 max-w-md mx-auto">
			<div className="w-20 h-20 bg-red-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
				<Tag className="w-10 h-10 text-white" />
			</div>
			<h1 className="text-3xl font-bold text-white mb-4">
				Post não encontrado
			</h1>
			<p className="text-gray-400 mb-6 leading-relaxed">
				{error?.message === "Post not found"
					? "O post que você está procurando não existe ou foi removido."
					: "Ocorreu um erro ao carregar o post."}
			</p>
			<div className="space-y-3 sm:space-y-0 sm:space-x-4 sm:flex">
				<Link
					to="/"
					className="w-full sm:w-auto inline-flex items-center justify-center space-x-2 bg-gradient-to-r from-red-600 to-red-500 hover:from-red-500 hover:to-red-400 text-white px-6 py-3 rounded-xl font-semibold transition-all duration-300 shadow-lg hover:shadow-red-500/25 hover:scale-105"
				>
					<ArrowLeft className="w-4 h-4" />
					<span>Voltar ao início</span>
				</Link>
				<button
					onClick={resetErrorBoundary}
					className="w-full sm:w-auto border border-gray-600 hover:border-red-500 text-gray-300 hover:text-white px-6 py-3 rounded-xl font-semibold transition-all duration-300"
				>
					Tentar Novamente
				</button>
			</div>
		</div>
	</div>
);

// Componente de compartilhamento otimizado
const ShareButton = React.memo(({ post }) => {
	const handleShare = async () => {
		// Verificar se o navegador suporta Web Share API
		if (navigator.share) {
			try {
				await navigator.share({
					title: post.title,
					text: post.excerpt,
					url: window.location.href,
				});
			} catch (error) {
				// Usuário cancelou ou erro - silenciar
				console.log("Share cancelled or failed:", error);
			}
		} else {
			// Fallback: copiar URL para clipboard
			try {
				await navigator.clipboard.writeText(window.location.href);
				// Mostrar feedback visual temporário
				const button = document.querySelector("[data-share-button]");
				const originalText = button?.textContent;
				if (button) {
					button.textContent = "URL Copiada!";
					setTimeout(() => {
						button.textContent = originalText;
					}, 2000);
				}
			} catch (error) {
				console.error("Failed to copy URL:", error);
			}
		}
	};

	return (
		<button
			onClick={handleShare}
			data-share-button
			className="flex items-center space-x-2 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition-colors duration-300 text-sm md:text-base"
		>
			<Share2 className="w-4 h-4" />
			<span>Compartilhar</span>
		</button>
	);
});

// Componente de conteúdo renderizado otimizado
const PostContent = React.memo(({ content }) => {
	const renderedContent = useMemo(() => {
		// Dividir o conteúdo em parágrafos e renderizar
		const paragraphs = content.split("\n\n").filter((p) => p.trim());

		return paragraphs.map((paragraph, index) => (
			<p key={index} className="text-lg leading-relaxed mb-6 text-gray-300">
				{paragraph}
			</p>
		));
	}, [content]);

	return (
		<div className="prose prose-invert prose-lg max-w-none">
			<div className="text-gray-300 leading-relaxed">{renderedContent}</div>
		</div>
	);
});

// Componente de posts relacionados
const RelatedPosts = React.memo(({ currentPost }) => {
	const { data: relatedPosts = [] } = usePostsByCategory(currentPost.category);
	const { prefetchPost } = usePrefetch();

	// Filtrar post atual e limitar a 2 posts
	const filteredRelated = useMemo(() => {
		return relatedPosts
			.filter((post) => post.id !== currentPost.id)
			.slice(0, 2);
	}, [relatedPosts, currentPost.id]);

	const formatDate = (dateString) => {
		try {
			return new Date(dateString).toLocaleDateString("pt-BR");
		} catch (error) {
			return "Data inválida";
		}
	};

	if (filteredRelated.length === 0) {
		return null;
	}

	return (
		<div className="mt-16">
			<h3 className="text-2xl font-bold text-white mb-8">Posts Relacionados</h3>
			<div className="grid grid-cols-1 md:grid-cols-2 gap-8">
				{filteredRelated.map((relatedPost) => (
					<Link
						key={relatedPost.id}
						to={`/post/${relatedPost.id}`}
						onMouseEnter={() => prefetchPost(relatedPost.id)}
						className="group"
					>
						<article className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl overflow-hidden hover:scale-105 transition-all duration-300 border border-gray-700/50">
							<img
								src={relatedPost.image_url}
								alt={relatedPost.title}
								className="w-full h-48 object-cover transition-transform duration-700 group-hover:scale-110"
								loading="lazy"
							/>
							<div className="p-6">
								<h4 className="text-lg font-bold text-white group-hover:text-red-400 transition-colors duration-300 mb-2 line-clamp-2">
									{relatedPost.title}
								</h4>
								<p className="text-gray-400 text-sm line-clamp-2 mb-4">
									{relatedPost.excerpt}
								</p>
								<div className="flex items-center justify-between text-xs text-gray-500">
									<span>{relatedPost.author}</span>
									<span>{formatDate(relatedPost.created_at)}</span>
								</div>
							</div>
						</article>
					</Link>
				))}
			</div>
		</div>
	);
});

// Componente principal do post
const PostDetailContent = () => {
	const { id } = useParams();

	// Usar Suspense Query para carregamento instantâneo
	const { data: post } = usePostByIdSuspense(id);

	const formatDate = useMemo(() => {
		try {
			return new Date(post.created_at).toLocaleDateString("pt-BR");
		} catch (error) {
			return "Data inválida";
		}
	}, [post.created_at]);

	// SEO optimization - definir meta tags dinamicamente
	React.useEffect(() => {
		if (post) {
			document.title = `${post.title} | Torque Forged Motorsport`;

			// Meta description
			const metaDescription = document.querySelector(
				'meta[name="description"]'
			);
			if (metaDescription) {
				metaDescription.setAttribute("content", post.excerpt);
			}

			// Open Graph
			const ogTitle = document.querySelector('meta[property="og:title"]');
			const ogDescription = document.querySelector(
				'meta[property="og:description"]'
			);
			const ogImage = document.querySelector('meta[property="og:image"]');

			if (ogTitle) ogTitle.setAttribute("content", post.title);
			if (ogDescription) ogDescription.setAttribute("content", post.excerpt);
			if (ogImage && post.image_url)
				ogImage.setAttribute("content", post.image_url);
		}

		// Cleanup ao desmontar
		return () => {
			document.title = "Torque Forged Motorsport";
		};
	}, [post]);

	return (
		<div className="min-h-screen pt-20 bg-gradient-to-br from-black via-gray-900 to-black">
			{/* Hero Image */}
			<div className="relative h-96 md:h-[60vh] overflow-hidden">
				<img
					src={post.image_url}
					alt={post.title}
					className="w-full h-full object-cover"
					loading="eager"
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
					<div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-12 p-6 bg-gradient-to-r from-gray-900 to-gray-800 rounded-2xl border border-gray-700/50">
						<div className="flex flex-wrap items-center space-x-6 text-gray-400 mb-4 sm:mb-0">
							<div className="flex items-center space-x-2">
								<User className="w-5 h-5" />
								<span className="font-medium">{post.author}</span>
							</div>
							<div className="flex items-center space-x-2">
								<Calendar className="w-5 h-5" />
								<span>{formatDate}</span>
							</div>
							<div className="flex items-center space-x-2">
								<Clock className="w-5 h-5" />
								<span>{post.read_time} de leitura</span>
							</div>
						</div>
						<ShareButton post={post} />
					</div>

					{/* Article Body */}
					<PostContent content={post.content} />

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

					{/* Posts Relacionados */}
					<Suspense
						fallback={
							<div className="mt-16">
								<h3 className="text-2xl font-bold text-white mb-8">
									Posts Relacionados
								</h3>
								<div className="grid grid-cols-1 md:grid-cols-2 gap-8">
									{[1, 2].map((i) => (
										<div
											key={i}
											className="bg-gray-800 rounded-2xl overflow-hidden animate-pulse"
										>
											<div className="h-48 bg-gray-700"></div>
											<div className="p-6">
												<div className="h-4 bg-gray-700 rounded mb-2"></div>
												<div className="h-4 bg-gray-700 rounded w-3/4"></div>
											</div>
										</div>
									))}
								</div>
							</div>
						}
					>
						<RelatedPosts currentPost={post} />
					</Suspense>

					{/* Debug Info - apenas desenvolvimento */}
					{process.env.NODE_ENV === "development" && (
						<div className="mt-8 p-4 bg-gray-800/30 rounded-lg border border-gray-700/30">
							<h4 className="text-white font-semibold mb-2">Debug Info</h4>
							<div className="text-xs text-gray-400 space-y-1">
								<div>Post ID: {post.id}</div>
								<div>Category: {post.category}</div>
								<div>Published: {post.published ? "Yes" : "No"}</div>
								<div>Trending: {post.trending ? "Yes" : "No"}</div>
								<div>Sistema: TanStack Query + Suspense</div>
							</div>
						</div>
					)}
				</div>
			</div>
		</div>
	);
};

// Componente principal com Error Boundary
const OptimizedPostDetail = () => {
	return (
		<ErrorBoundary
			FallbackComponent={PostNotFoundFallback}
			onReset={() => {
				// Tentar recarregar a página
				window.location.reload();
			}}
		>
			<Suspense fallback={<PostDetailSkeleton />}>
				<PostDetailContent />
			</Suspense>
		</ErrorBoundary>
	);
};

export default OptimizedPostDetail;
