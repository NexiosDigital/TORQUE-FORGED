import React, { useMemo } from "react";
import { useParams, Link } from "react-router-dom";
import {
	ArrowLeft,
	Calendar,
	User,
	Clock,
	TrendingUp,
	ChevronRight,
	Zap,
	AlertCircle,
} from "lucide-react";
import { usePostsByCategory, usePrefetch } from "../hooks/usePostsQuery";
import { ErrorBoundary } from "react-error-boundary";

// Mapeamento de todas as páginas/seções possíveis
const PAGE_CONFIG = {
	// Corridas - Categorias principais
	f1: {
		title: "Fórmula 1",
		description: "A elite do automobilismo mundial",
		gradient: "from-red-500 to-orange-500",
		icon: "🏁",
		type: "category",
		categoryId: "f1",
		breadcrumb: [{ name: "Corridas", href: "/f1" }],
	},
	nascar: {
		title: "NASCAR",
		description: "A categoria mais popular dos EUA",
		gradient: "from-blue-500 to-cyan-500",
		icon: "🏁",
		type: "category",
		categoryId: "nascar",
		breadcrumb: [{ name: "Corridas", href: "/nascar" }],
	},
	endurance: {
		title: "Endurance",
		description: "Corridas de resistência épicas como Le Mans",
		gradient: "from-green-500 to-emerald-500",
		icon: "🏁",
		type: "category",
		categoryId: "endurance",
		breadcrumb: [{ name: "Corridas", href: "/endurance" }],
	},
	drift: {
		title: "Formula Drift",
		description: "A arte de deslizar com estilo",
		gradient: "from-purple-500 to-pink-500",
		icon: "🏁",
		type: "category",
		categoryId: "drift",
		breadcrumb: [{ name: "Corridas", href: "/drift" }],
	},

	// Marcas
	ferrari: {
		title: "Ferrari",
		description: "A lenda italiana do motorsport",
		gradient: "from-red-600 to-red-500",
		icon: "🏎️",
		type: "brand",
		categoryId: "ferrari",
		breadcrumb: [
			{ name: "Marcas", href: "/marcas" },
			{ name: "Ferrari", href: "/marcas/ferrari" },
		],
	},
	mclaren: {
		title: "McLaren",
		description: "Inovação e performance britânica",
		gradient: "from-orange-500 to-yellow-500",
		icon: "🏎️",
		type: "brand",
		categoryId: "mclaren",
		breadcrumb: [
			{ name: "Marcas", href: "/marcas" },
			{ name: "McLaren", href: "/marcas/mclaren" },
		],
	},
	"red-bull": {
		title: "Red Bull",
		description: "Velocidade e adrenalina extrema",
		gradient: "from-blue-600 to-red-500",
		icon: "🏎️",
		type: "brand",
		categoryId: "red-bull",
		breadcrumb: [
			{ name: "Marcas", href: "/marcas" },
			{ name: "Red Bull", href: "/marcas/red-bull" },
		],
	},
	mercedes: {
		title: "Mercedes",
		description: "Engenharia alemã e excelência",
		gradient: "from-gray-400 to-gray-600",
		icon: "🏎️",
		type: "brand",
		categoryId: "mercedes",
		breadcrumb: [
			{ name: "Marcas", href: "/marcas" },
			{ name: "Mercedes", href: "/marcas/mercedes" },
		],
	},
	lamborghini: {
		title: "Lamborghini",
		description: "Supercarros italianos selvagens",
		gradient: "from-yellow-400 to-orange-500",
		icon: "🏎️",
		type: "brand",
		categoryId: "lamborghini",
		breadcrumb: [
			{ name: "Marcas", href: "/marcas" },
			{ name: "Lamborghini", href: "/marcas/lamborghini" },
		],
	},
	porsche: {
		title: "Porsche",
		description: "Precisão alemã em movimento",
		gradient: "from-gray-700 to-yellow-500",
		icon: "🏎️",
		type: "brand",
		categoryId: "porsche",
		breadcrumb: [
			{ name: "Marcas", href: "/marcas" },
			{ name: "Porsche", href: "/marcas/porsche" },
		],
	},

	// Preparação
	tuning: {
		title: "Tuning",
		description: "Personalização e modificações automotivas",
		gradient: "from-yellow-500 to-orange-500",
		icon: "🔧",
		type: "category",
		categoryId: "tuning",
		breadcrumb: [{ name: "Preparação", href: "/tuning" }],
	},
	engines: {
		title: "Motores",
		description: "Tecnologia e performance sob o capô",
		gradient: "from-indigo-500 to-purple-500",
		icon: "⚙️",
		type: "category",
		categoryId: "engines",
		breadcrumb: [{ name: "Preparação", href: "/engines" }],
	},
	performance: {
		title: "Performance",
		description: "Componentes para máxima performance",
		gradient: "from-red-500 to-pink-500",
		icon: "⚡",
		type: "tech",
		categoryId: "performance",
		breadcrumb: [{ name: "Preparação", href: "/performance" }],
	},
	custom: {
		title: "Custom",
		description: "Modificações visuais e estéticas",
		gradient: "from-purple-500 to-blue-500",
		icon: "🎨",
		type: "tech",
		categoryId: "custom",
		breadcrumb: [{ name: "Preparação", href: "/custom" }],
	},

	// Tecnologia
	"motores-tech": {
		title: "Tecnologia de Motores",
		description: "Inovações e tecnologias de motores",
		gradient: "from-red-500 to-orange-500",
		icon: "⚙️",
		type: "tech",
		categoryId: "motores-tech",
		breadcrumb: [
			{ name: "Tecnologia", href: "/tecnologia" },
			{ name: "Motores", href: "/tecnologia/motores" },
		],
	},
	aerodinamica: {
		title: "Aerodinâmica",
		description: "Ciência do fluxo de ar e downforce",
		gradient: "from-blue-500 to-cyan-500",
		icon: "💨",
		type: "tech",
		categoryId: "aerodinamica",
		breadcrumb: [
			{ name: "Tecnologia", href: "/tecnologia" },
			{ name: "Aerodinâmica", href: "/tecnologia/aerodinamica" },
		],
	},
	eletronica: {
		title: "Eletrônica",
		description: "Sistemas eletrônicos e telemetria",
		gradient: "from-green-500 to-blue-500",
		icon: "🔌",
		type: "tech",
		categoryId: "eletronica",
		breadcrumb: [
			{ name: "Tecnologia", href: "/tecnologia" },
			{ name: "Eletrônica", href: "/tecnologia/eletronica" },
		],
	},
	materiais: {
		title: "Materiais",
		description: "Materiais avançados e composites",
		gradient: "from-purple-500 to-pink-500",
		icon: "🧪",
		type: "tech",
		categoryId: "materiais",
		breadcrumb: [
			{ name: "Tecnologia", href: "/tecnologia" },
			{ name: "Materiais", href: "/tecnologia/materiais" },
		],
	},
};

// Subseções específicas
const SUBSECTION_CONFIG = {
	// F1 subseções
	"f1-equipes": {
		title: "Equipes de Fórmula 1",
		description: "Todas as equipes da temporada atual",
		gradient: "from-red-500 to-orange-500",
		parentConfig: PAGE_CONFIG.f1,
	},
	"f1-pilotos": {
		title: "Pilotos de Fórmula 1",
		description: "Os melhores pilotos do mundo",
		gradient: "from-red-500 to-orange-500",
		parentConfig: PAGE_CONFIG.f1,
	},
	"f1-calendario": {
		title: "Calendário F1",
		description: "Todas as corridas da temporada",
		gradient: "from-red-500 to-orange-500",
		parentConfig: PAGE_CONFIG.f1,
	},

	// NASCAR subseções
	"nascar-cup-series": {
		title: "NASCAR Cup Series",
		description: "A principal categoria do NASCAR",
		gradient: "from-blue-500 to-cyan-500",
		parentConfig: PAGE_CONFIG.nascar,
	},
	"nascar-pilotos": {
		title: "Pilotos NASCAR",
		description: "Os astros dos ovais americanos",
		gradient: "from-blue-500 to-cyan-500",
		parentConfig: PAGE_CONFIG.nascar,
	},

	// Ferrari subseções
	"ferrari-historia": {
		title: "História da Ferrari",
		description: "A jornada da marca mais icônica do motorsport",
		gradient: "from-red-600 to-red-500",
		parentConfig: PAGE_CONFIG.ferrari,
	},
	"ferrari-modelos": {
		title: "Modelos Ferrari",
		description: "Todos os supercarros da marca italiana",
		gradient: "from-red-600 to-red-500",
		parentConfig: PAGE_CONFIG.ferrari,
	},
	"ferrari-f1": {
		title: "Scuderia Ferrari F1",
		description: "A equipe mais vitoriosa da Fórmula 1",
		gradient: "from-red-600 to-red-500",
		parentConfig: PAGE_CONFIG.ferrari,
	},
};

// PostCard otimizado
const PostCard = React.memo(({ post, index }) => {
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

	return (
		<article className="group bg-gradient-to-br from-gray-900 to-gray-800 rounded-3xl overflow-hidden shadow-2xl hover:shadow-xl transition-all duration-500 hover:scale-[1.02] border border-gray-700/50">
			{/* Image */}
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

				{/* Badge */}
				<div className="absolute top-4 left-4 flex items-center space-x-2">
					<span className="bg-gradient-to-r from-red-600 to-red-500 text-white px-4 py-2 rounded-full text-sm font-bold shadow-lg">
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

			{/* Content */}
			<div className="p-6">
				<Link
					to={`/post/${post.id}`}
					onMouseEnter={() => prefetchPost(post.id)}
				>
					<h3 className="text-xl font-bold text-white mb-3 group-hover:text-red-400 transition-colors duration-300 leading-tight line-clamp-2">
						{post.title}
					</h3>
				</Link>
				<p className="text-gray-400 mb-4 leading-relaxed line-clamp-3 text-sm">
					{post.excerpt}
				</p>

				{/* Meta */}
				<div className="flex items-center justify-between text-xs text-gray-500 mb-4">
					<div className="flex items-center space-x-3">
						<div className="flex items-center space-x-1">
							<User className="w-3 h-3" />
							<span>{post.author}</span>
						</div>
						<div className="flex items-center space-x-1">
							<Clock className="w-3 h-3" />
							<span>{post.read_time}</span>
						</div>
					</div>
					<div className="flex items-center space-x-1">
						<Calendar className="w-3 h-3" />
						<span>{formatDate}</span>
					</div>
				</div>

				{/* Read more */}
				<Link
					to={`/post/${post.id}`}
					onMouseEnter={() => prefetchPost(post.id)}
					className="text-red-400 hover:text-red-300 font-bold text-sm flex items-center space-x-2 group-hover:space-x-3 transition-all duration-300"
				>
					<span>Leia mais</span>
					<ChevronRight className="w-4 h-4" />
				</Link>
			</div>
		</article>
	);
});

// Error fallback
const ErrorFallback = ({ error, resetErrorBoundary, section }) => (
	<div className="text-center py-16">
		<div className="w-20 h-20 bg-gradient-to-r from-red-600 to-red-500 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-2xl">
			<AlertCircle className="w-10 h-10 text-white" />
		</div>
		<h3 className="text-2xl font-bold text-white mb-4">
			Erro ao carregar {section}
		</h3>
		<p className="text-gray-400 mb-8">Algo deu errado. Tente novamente.</p>
		<button
			onClick={resetErrorBoundary}
			className="bg-gradient-to-r from-red-600 to-red-500 hover:from-red-500 hover:to-red-400 text-white px-8 py-3 rounded-2xl font-bold transition-all duration-300 shadow-xl hover:shadow-red-500/25 hover:scale-105"
		>
			Tentar Novamente
		</button>
	</div>
);

// Componente principal flexível
const FlexiblePage = ({ pageKey, section }) => {
	const params = useParams();

	// Determinar configuração da página
	const config = useMemo(() => {
		// Primeiro tentar pegar da URL params
		const mainPage =
			pageKey || params.brand || params.section || params.category;
		const subSection = section || params.subsection;

		// Se tem subseção, buscar na configuração de subseções
		if (subSection) {
			const subsectionKey = `${mainPage}-${subSection}`;
			return SUBSECTION_CONFIG[subsectionKey] || PAGE_CONFIG[mainPage];
		}

		// Senão, buscar na configuração principal
		return PAGE_CONFIG[mainPage];
	}, [pageKey, section, params]);

	// Hook de posts baseado no tipo de página
	const {
		data: posts = [],
		isLoading,
		error,
	} = usePostsByCategory(config?.categoryId || "general", {
		enabled: !!config?.categoryId,
	});

	// Fallback se configuração não encontrada
	if (!config) {
		return (
			<div className="min-h-screen pt-20 bg-gradient-to-br from-black via-gray-900 to-black">
				<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
					<ErrorFallback
						error={{ message: "Página não encontrada" }}
						resetErrorBoundary={() => window.history.back()}
						section="página"
					/>
				</div>
			</div>
		);
	}

	return (
		<div className="min-h-screen pt-20 bg-gradient-to-br from-black via-gray-900 to-black">
			{/* Hero Section */}
			<div
				className={`relative py-24 bg-gradient-to-r ${config.gradient} overflow-hidden`}
			>
				<div className="absolute inset-0 bg-black/40"></div>
				<div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent"></div>

				{/* Floating elements */}
				<div className="absolute inset-0">
					<div className="absolute top-1/4 left-1/4 w-96 h-96 bg-white/5 rounded-full blur-3xl animate-pulse"></div>
					<div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-white/5 rounded-full blur-3xl animate-pulse delay-1000"></div>
				</div>

				<div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
					{/* Breadcrumb */}
					{config.breadcrumb && config.breadcrumb.length > 0 && (
						<nav className="mb-8">
							<div className="flex items-center space-x-2 text-white/80">
								<Link
									to="/"
									className="hover:text-white transition-colors duration-300"
								>
									Home
								</Link>
								{config.breadcrumb.map((item, index) => (
									<React.Fragment key={index}>
										<ChevronRight className="w-4 h-4" />
										<Link
											to={item.href}
											className="hover:text-white transition-colors duration-300"
										>
											{item.name}
										</Link>
									</React.Fragment>
								))}
							</div>
						</nav>
					)}

					{/* Header Content */}
					<div className="text-center">
						<div className="flex items-center justify-center mb-6">
							<div className="text-6xl mr-4">{config.icon}</div>
							<div>
								<h1 className="text-5xl md:text-6xl font-black text-white mb-4 leading-tight">
									{config.title}
								</h1>
								<p className="text-xl md:text-2xl text-white/90 max-w-3xl mx-auto leading-relaxed">
									{config.description}
								</p>
							</div>
						</div>

						{/* Stats ou badges */}
						<div className="flex flex-wrap items-center justify-center gap-4 mt-8">
							<div className="bg-white/10 backdrop-blur-sm px-6 py-3 rounded-full border border-white/20">
								<span className="text-white font-bold">
									{posts.length} {posts.length === 1 ? "Post" : "Posts"}
								</span>
							</div>
							{config.type === "brand" && (
								<div className="bg-white/10 backdrop-blur-sm px-6 py-3 rounded-full border border-white/20">
									<span className="text-white font-bold">Marca Premium</span>
								</div>
							)}
							{config.type === "tech" && (
								<div className="bg-white/10 backdrop-blur-sm px-6 py-3 rounded-full border border-white/20">
									<span className="text-white font-bold">Tecnologia</span>
								</div>
							)}
						</div>
					</div>
				</div>
			</div>

			{/* Posts Section */}
			<div className="py-16">
				<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
					<ErrorBoundary
						FallbackComponent={(props) => (
							<ErrorFallback {...props} section="posts" />
						)}
						onReset={() => window.location.reload()}
					>
						{isLoading ? (
							<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
								{Array.from({ length: 6 }).map((_, i) => (
									<div
										key={i}
										className="bg-gray-800 rounded-3xl overflow-hidden animate-pulse"
									>
										<div className="h-56 bg-gray-700"></div>
										<div className="p-6">
											<div className="h-4 bg-gray-700 rounded-full mb-3"></div>
											<div className="h-4 bg-gray-700 rounded-full w-3/4 mb-3"></div>
											<div className="h-3 bg-gray-700 rounded-full w-1/2"></div>
										</div>
									</div>
								))}
							</div>
						) : error ? (
							<ErrorFallback
								error={error}
								resetErrorBoundary={() => window.location.reload()}
								section="posts"
							/>
						) : posts.length === 0 ? (
							<div className="text-center py-16">
								<div
									className={`w-20 h-20 bg-gradient-to-r ${config.gradient} rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-xl`}
								>
									<Zap className="w-10 h-10 text-white" />
								</div>
								<h3 className="text-2xl font-bold text-white mb-4">
									Posts chegando em breve
								</h3>
								<p className="text-gray-400 mb-8 max-w-md mx-auto">
									Novos posts sobre {config.title.toLowerCase()} serão
									publicados em breve. Volte em breve!
								</p>
								<Link
									to="/"
									className="inline-flex items-center space-x-2 bg-gradient-to-r from-red-600 to-red-500 hover:from-red-500 hover:to-red-400 text-white px-8 py-4 rounded-2xl font-bold transition-all duration-300 shadow-xl hover:shadow-red-500/25 hover:scale-105"
								>
									<ArrowLeft className="w-4 h-4" />
									<span>Voltar ao início</span>
								</Link>
							</div>
						) : (
							<>
								<div className="text-center mb-16">
									<h2 className="text-4xl font-black text-white mb-6 bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
										Últimas sobre {config.title}
									</h2>
									<p className="text-xl text-gray-400 max-w-2xl mx-auto">
										Fique por dentro de tudo que acontece no mundo{" "}
										{config.title.toLowerCase()}
									</p>
								</div>

								<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
									{posts.map((post, index) => (
										<PostCard key={post.id} post={post} index={index} />
									))}
								</div>

								{posts.length > 9 && (
									<div className="text-center mt-16">
										<button className="bg-gradient-to-r from-red-600 to-red-500 hover:from-red-500 hover:to-red-400 text-white px-8 py-4 rounded-2xl font-bold transition-all duration-300 shadow-xl hover:shadow-red-500/25 hover:scale-105">
											Carregar mais posts
										</button>
									</div>
								)}
							</>
						)}
					</ErrorBoundary>
				</div>
			</div>
		</div>
	);
};

export default FlexiblePage;
