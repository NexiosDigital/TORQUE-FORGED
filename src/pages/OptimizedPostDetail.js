import React, { Suspense, useMemo } from "react";
import { useParams, Link } from "react-router-dom";
import {
	Calendar,
	User,
	Clock,
	ArrowLeft,
	Tag,
	Share2,
	AlertCircle,
} from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import {
	usePostByIdSuspense,
	usePostsByCategory,
	usePrefetch,
} from "../hooks/usePostsQuery";
import { ErrorBoundary } from "react-error-boundary";

/**
 * OptimizedPostDetail com Suporte a Markdown
 * - Renderização otimizada de Markdown
 * - Sintaxe highlighting
 * - Componentes customizados para elementos Markdown
 */

// Loading skeleton para post
const PostDetailSkeleton = () => (
	<div className="min-h-screen pt-20 bg-gradient-to-br from-black via-gray-900 to-black">
		{/* Hero skeleton */}
		<div className="relative h-96 md:h-[60vh] bg-gradient-to-br from-gray-800 to-gray-700 animate-pulse">
			<div className="absolute bottom-8 left-0 right-0">
				<div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
					<div className="w-32 h-6 bg-gray-600 rounded-full mb-4"></div>
					<div className="w-3/4 h-12 bg-gray-600 rounded-2xl mb-2"></div>
					<div className="w-1/2 h-8 bg-gray-600 rounded-xl"></div>
				</div>
			</div>
		</div>

		{/* Content skeleton */}
		<div className="py-16">
			<div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
				<div className="w-20 h-4 bg-gray-700 rounded-full mb-8"></div>

				<div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-3xl p-6 mb-12 animate-pulse border border-gray-700/50">
					<div className="flex justify-between items-center">
						<div className="flex space-x-6">
							<div className="w-24 h-4 bg-gray-700 rounded-full"></div>
							<div className="w-24 h-4 bg-gray-700 rounded-full"></div>
						</div>
						<div className="w-32 h-10 bg-gray-700 rounded-2xl"></div>
					</div>
				</div>

				<div className="space-y-4">
					{Array.from({ length: 8 }).map((_, i) => (
						<div
							key={`skeleton-${i}`}
							className="w-full h-4 bg-gray-700 rounded-full"
						></div>
					))}
				</div>
			</div>
		</div>
	</div>
);

// Error fallback para post não encontrado
const PostNotFoundFallback = ({ error, resetErrorBoundary, postId }) => (
	<div className="min-h-screen pt-20 bg-gradient-to-br from-black via-gray-900 to-black flex items-center justify-center">
		<div className="text-center p-8 max-w-lg mx-auto">
			<div className="w-24 h-24 bg-gradient-to-r from-red-600 to-red-500 rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-2xl">
				<AlertCircle className="w-12 h-12 text-white" />
			</div>
			<h1 className="text-4xl font-black text-white mb-4">
				Post não encontrado
			</h1>
			<p className="text-gray-400 mb-2">
				{error?.message === "Post não encontrado" ||
				error?.message?.includes("não encontrado")
					? "O post que você está procurando não existe ou foi removido."
					: "Ocorreu um erro ao carregar o post."}
			</p>
			<p className="text-gray-500 text-sm mb-8">
				Verifique se o link está correto ou escolha outro post para ler.
			</p>

			<div className="space-y-4">
				<Link
					to="/"
					className="w-full inline-flex items-center justify-center space-x-2 bg-gradient-to-r from-red-600 to-red-500 hover:from-red-500 hover:to-red-400 text-white px-8 py-4 rounded-2xl font-bold transition-all duration-300 shadow-xl hover:shadow-red-500/25 hover:scale-105"
				>
					<ArrowLeft className="w-4 h-4" />
					<span>Voltar ao início</span>
				</Link>
				<button
					onClick={resetErrorBoundary}
					className="w-full border-2 border-gray-600 hover:border-red-500 text-gray-300 hover:text-white px-8 py-4 rounded-2xl font-bold transition-all duration-300"
				>
					Tentar Novamente
				</button>
			</div>
		</div>
	</div>
);

// Componente de compartilhamento
const ShareButton = React.memo(({ post }) => {
	const handleShare = async () => {
		try {
			if (navigator.share) {
				await navigator.share({
					title: post.title,
					text: post.excerpt,
					url: window.location.href,
				});
			} else {
				await navigator.clipboard.writeText(window.location.href);

				// Feedback visual simples
				const button = document.querySelector("[data-share-button]");
				if (button) {
					const originalText = button.textContent;
					button.textContent = "URL Copiada!";
					setTimeout(() => {
						button.textContent = originalText;
					}, 2000);
				}
			}
		} catch (error) {
			try {
				const textArea = document.createElement("textarea");
				textArea.value = window.location.href;
				document.body.appendChild(textArea);
				textArea.select();
				document.execCommand("copy");
				document.body.removeChild(textArea);
				alert("URL copiada para a área de transferência!");
			} catch (fallbackError) {
				console.error("Falha ao compartilhar:", fallbackError);
			}
		}
	};

	return (
		<button
			onClick={handleShare}
			data-share-button
			className="flex items-center space-x-2 bg-gradient-to-r from-red-600 to-red-500 hover:from-red-500 hover:to-red-400 text-white px-6 py-3 rounded-2xl transition-all duration-300 shadow-lg hover:shadow-red-500/25 hover:scale-105"
		>
			<Share2 className="w-4 h-4" />
			<span>Compartilhar</span>
		</button>
	);
});

// Componente de conteúdo Markdown renderizado
const MarkdownContent = React.memo(({ content }) => {
	const markdownComponents = useMemo(
		() => ({
			// Títulos
			h1: ({ node, ...props }) => (
				<h1
					className="text-4xl font-black text-white mb-6 mt-8 first:mt-0 leading-tight"
					{...props}
				/>
			),
			h2: ({ node, ...props }) => (
				<h2
					className="text-3xl font-bold text-white mb-5 mt-8 first:mt-0 leading-tight"
					{...props}
				/>
			),
			h3: ({ node, ...props }) => (
				<h3
					className="text-2xl font-bold text-white mb-4 mt-6 first:mt-0 leading-tight"
					{...props}
				/>
			),
			h4: ({ node, ...props }) => (
				<h4
					className="text-xl font-bold text-white mb-3 mt-5 first:mt-0 leading-tight"
					{...props}
				/>
			),
			h5: ({ node, ...props }) => (
				<h5
					className="text-lg font-bold text-white mb-3 mt-4 first:mt-0 leading-tight"
					{...props}
				/>
			),
			h6: ({ node, ...props }) => (
				<h6
					className="text-base font-bold text-white mb-2 mt-4 first:mt-0 leading-tight"
					{...props}
				/>
			),

			// Parágrafos
			p: ({ node, ...props }) => (
				<p className="text-lg leading-relaxed mb-6 text-gray-300" {...props} />
			),

			// Texto formatado
			strong: ({ node, ...props }) => (
				<strong className="text-white font-bold" {...props} />
			),
			em: ({ node, ...props }) => (
				<em className="text-gray-300 italic" {...props} />
			),

			// Links
			a: ({ node, ...props }) => (
				<a
					className="text-red-400 hover:text-red-300 underline decoration-red-400/50 hover:decoration-red-300 transition-colors duration-300 font-medium"
					target={props.href?.startsWith("http") ? "_blank" : undefined}
					rel={
						props.href?.startsWith("http") ? "noopener noreferrer" : undefined
					}
					{...props}
				/>
			),

			// Código
			code: ({ node, inline, ...props }) => {
				if (inline) {
					return (
						<code
							className="bg-gray-800 text-red-400 px-2 py-1 rounded-md text-sm font-mono border border-gray-700/50"
							{...props}
						/>
					);
				}
				return <code className="text-gray-300 font-mono text-sm" {...props} />;
			},
			pre: ({ node, ...props }) => (
				<pre className="bg-gray-900 border border-gray-700/50 p-6 rounded-2xl overflow-x-auto mb-6 shadow-xl">
					<div className="flex items-center justify-between mb-4 pb-2 border-b border-gray-700/50">
						<span className="text-gray-400 text-sm font-medium">Código</span>
						<div className="flex space-x-2">
							<div className="w-3 h-3 bg-red-500 rounded-full"></div>
							<div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
							<div className="w-3 h-3 bg-green-500 rounded-full"></div>
						</div>
					</div>
					{props.children}
				</pre>
			),

			// Citações
			blockquote: ({ node, ...props }) => (
				<blockquote className="border-l-4 border-red-500 bg-gray-900/50 pl-6 pr-4 py-4 rounded-r-2xl my-6 italic">
					<div className="text-gray-400" {...props} />
				</blockquote>
			),

			// Listas
			ul: ({ node, ...props }) => (
				<ul className="list-none space-y-2 mb-6 pl-0" {...props} />
			),
			ol: ({ node, ...props }) => (
				<ol
					className="list-none space-y-2 mb-6 pl-0 counter-reset-[item]"
					{...props}
				/>
			),
			li: ({ node, ordered, ...props }) => {
				if (ordered) {
					return (
						<li
							className="text-gray-300 relative pl-8 counter-increment-[item] before:content-[counter(item)] before:absolute before:left-0 before:bg-red-600 before:text-white before:w-6 before:h-6 before:rounded-full before:flex before:items-center before:justify-center before:text-sm before:font-bold"
							{...props}
						/>
					);
				}
				return (
					<li
						className="text-gray-300 relative pl-8 before:content-['•'] before:absolute before:left-0 before:text-red-500 before:font-bold before:text-xl"
						{...props}
					/>
				);
			},

			// Imagens
			img: ({ node, ...props }) => (
				<div className="my-8">
					<img
						className="rounded-2xl max-w-full h-auto shadow-2xl border border-gray-700/50"
						loading="lazy"
						{...props}
					/>
					{props.alt && (
						<p className="text-center text-gray-500 text-sm mt-3 italic">
							{props.alt}
						</p>
					)}
				</div>
			),

			// Tabelas
			table: ({ node, ...props }) => (
				<div className="overflow-x-auto my-6">
					<table
						className="min-w-full bg-gray-900/50 border border-gray-700/50 rounded-2xl overflow-hidden"
						{...props}
					/>
				</div>
			),
			thead: ({ node, ...props }) => (
				<thead className="bg-gray-800/50" {...props} />
			),
			tbody: ({ node, ...props }) => (
				<tbody className="divide-y divide-gray-700/50" {...props} />
			),
			tr: ({ node, ...props }) => (
				<tr
					className="hover:bg-gray-800/30 transition-colors duration-300"
					{...props}
				/>
			),
			th: ({ node, ...props }) => (
				<th
					className="px-6 py-4 text-left text-sm font-semibold text-white"
					{...props}
				/>
			),
			td: ({ node, ...props }) => (
				<td className="px-6 py-4 text-sm text-gray-300" {...props} />
			),

			// Linha horizontal
			hr: ({ node, ...props }) => (
				<hr
					className="border-0 h-px bg-gradient-to-r from-transparent via-gray-600 to-transparent my-8"
					{...props}
				/>
			),
		}),
		[]
	);

	if (!content || typeof content !== "string") {
		return (
			<div className="text-center py-12">
				<p className="text-gray-400 italic text-lg">Conteúdo não disponível.</p>
			</div>
		);
	}

	if (content.trim() === "") {
		return (
			<div className="text-center py-12">
				<p className="text-gray-400 italic text-lg">Post sem conteúdo.</p>
			</div>
		);
	}

	return (
		<div className="prose prose-invert prose-lg max-w-none">
			<ReactMarkdown
				remarkPlugins={[remarkGfm]}
				components={markdownComponents}
			>
				{content}
			</ReactMarkdown>
		</div>
	);
});

// Componente de posts relacionados
const RelatedPosts = React.memo(({ currentPost }) => {
	const { data: relatedPosts = [] } = usePostsByCategory(currentPost?.category);
	const { prefetchPost } = usePrefetch();

	const filteredRelated = useMemo(() => {
		if (!currentPost || !Array.isArray(relatedPosts)) {
			return [];
		}

		return relatedPosts
			.filter((post) => post && post.id !== currentPost.id)
			.slice(0, 2);
	}, [relatedPosts, currentPost]);

	const formatDate = (dateString) => {
		try {
			if (!dateString) return "Data não disponível";
			return new Date(dateString).toLocaleDateString("pt-BR");
		} catch (error) {
			return "Data não disponível";
		}
	};

	if (!currentPost || filteredRelated.length === 0) {
		return null;
	}

	return (
		<div className="mt-16">
			<h3 className="text-3xl font-black text-white mb-8 bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
				Posts Relacionados
			</h3>
			<div className="grid grid-cols-1 md:grid-cols-2 gap-8">
				{filteredRelated.map((relatedPost, index) => (
					<Link
						key={`related-${relatedPost.id}-${index}`}
						to={`/post/${relatedPost.id}`}
						onMouseEnter={() => prefetchPost(relatedPost.id)}
						className="group"
					>
						<article className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-3xl overflow-hidden hover:scale-105 transition-all duration-300 border border-gray-700/50 shadow-xl hover:shadow-red-500/10">
							<img
								src={relatedPost.image_url}
								alt={relatedPost.title}
								className="w-full h-48 object-cover transition-transform duration-700 group-hover:scale-110"
								loading="lazy"
								onError={(e) => {
									e.target.src =
										"https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&h=600&fit=crop";
								}}
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
	const { data: post } = usePostByIdSuspense(id);

	const formatDate = useMemo(() => {
		if (!post?.created_at) return "Data não disponível";
		try {
			return new Date(post.created_at).toLocaleDateString("pt-BR");
		} catch (error) {
			return "Data não disponível";
		}
	}, [post]);

	// SEO optimization
	React.useEffect(() => {
		if (post?.title && post?.excerpt) {
			document.title = `${post.title} | Torque Forged Motorsport`;

			const metaDescription = document.querySelector(
				'meta[name="description"]'
			);
			if (metaDescription) {
				metaDescription.setAttribute("content", post.excerpt);
			}

			// Open Graph tags
			const setOrCreateMetaTag = (property, content) => {
				let tag = document.querySelector(`meta[property="${property}"]`);
				if (!tag) {
					tag = document.createElement("meta");
					tag.setAttribute("property", property);
					document.head.appendChild(tag);
				}
				tag.setAttribute("content", content);
			};

			setOrCreateMetaTag("og:title", post.title);
			setOrCreateMetaTag("og:description", post.excerpt);
			setOrCreateMetaTag("og:image", post.image_url);
			setOrCreateMetaTag("og:url", window.location.href);
		}

		return () => {
			document.title = "Torque Forged Motorsport";
		};
	}, [post]);

	if (!post) {
		throw new Error("Post não encontrado");
	}

	return (
		<div className="min-h-screen pt-20 bg-gradient-to-br from-black via-gray-900 to-black">
			{/* Hero Image */}
			<div className="relative h-96 md:h-[60vh] overflow-hidden">
				<img
					src={post.image_url}
					alt={post.title}
					className="w-full h-full object-cover"
					loading="eager"
					onError={(e) => {
						e.target.src =
							"https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&h=600&fit=crop";
					}}
				/>
				<div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent"></div>

				<div className="absolute bottom-8 left-0 right-0">
					<div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
						<Link
							to={`/${post.category}`}
							className="inline-flex items-center px-4 py-2 rounded-full bg-gradient-to-r from-red-600 to-red-500 text-white text-sm font-bold mb-4 hover:shadow-xl transition-all duration-300 hover:scale-105"
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
						className="inline-flex items-center text-red-400 hover:text-red-300 mb-8 transition-colors duration-300 font-semibold"
					>
						<ArrowLeft className="w-4 h-4 mr-2" />
						Voltar
					</Link>

					{/* Article Meta */}
					<div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-12 p-8 bg-gradient-to-r from-gray-900 to-gray-800 rounded-3xl border border-gray-700/50 shadow-xl">
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

					{/* Article Body - Renderização Markdown */}
					<MarkdownContent content={post.content} />

					{/* Tags */}
					{post.tags && post.tags.length > 0 && (
						<div className="mt-12 pt-8 border-t border-gray-700">
							<h3 className="text-white font-bold mb-4 text-lg">Tags:</h3>
							<div className="flex flex-wrap gap-3">
								{post.tags.map((tag, index) => (
									<span
										key={`tag-${index}-${tag}`}
										className="bg-gradient-to-r from-gray-800 to-gray-700 text-gray-300 px-4 py-2 rounded-full text-sm hover:from-gray-700 hover:to-gray-600 transition-all duration-300 border border-gray-600/50"
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
								<h3 className="text-3xl font-black text-white mb-8">
									Posts Relacionados
								</h3>
								<div className="grid grid-cols-1 md:grid-cols-2 gap-8">
									{[1, 2].map((i) => (
										<div
											key={`related-skeleton-${i}`}
											className="bg-gray-800 rounded-3xl overflow-hidden animate-pulse"
										>
											<div className="h-48 bg-gray-700"></div>
											<div className="p-6">
												<div className="h-4 bg-gray-700 rounded-full mb-2"></div>
												<div className="h-4 bg-gray-700 rounded-full w-3/4"></div>
											</div>
										</div>
									))}
								</div>
							</div>
						}
					>
						<ErrorBoundary
							FallbackComponent={() => null}
							onError={(error) => {
								console.warn("Related posts error (non-critical):", error);
							}}
						>
							<RelatedPosts currentPost={post} />
						</ErrorBoundary>
					</Suspense>
				</div>
			</div>
		</div>
	);
};

// Componente principal com Error Boundary
const OptimizedPostDetail = () => {
	const { id } = useParams();

	return (
		<ErrorBoundary
			FallbackComponent={(props) => (
				<PostNotFoundFallback {...props} postId={id} />
			)}
			onReset={() => {
				window.location.reload();
			}}
			onError={(error, errorInfo) => {
				console.error("🔴 PostDetail Error Boundary:", error, errorInfo);
			}}
			resetKeys={[id]}
		>
			<Suspense fallback={<PostDetailSkeleton />}>
				<PostDetailContent />
			</Suspense>
		</ErrorBoundary>
	);
};

export default OptimizedPostDetail;
