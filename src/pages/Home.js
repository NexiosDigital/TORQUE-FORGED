import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
	ChevronRight,
	TrendingUp,
	ArrowRight,
	Calendar,
	User,
	Clock,
	Tag,
	Youtube,
	Instagram,
	Zap,
	Play,
	Settings,
	Loader,
} from "lucide-react";

const Home = () => {
	const [posts, setPosts] = useState([]);
	const [categories, setCategories] = useState([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState(null);

	// Dados estáticos garantidos para todos os navegadores
	const staticPosts = [
		{
			id: 1,
			title: "GP de Mônaco 2025: Verstappen Domina nas Ruas Principescas",
			slug: "gp-monaco-2025-verstappen-domina",
			category: "f1",
			category_name: "Fórmula 1",
			image_url:
				"https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800",
			excerpt:
				"Max Verstappen conquista mais uma vitória em Mônaco com uma performance impecável que deixou os fãs extasiados.",
			content:
				"Max Verstappen mais uma vez demonstrou sua maestria nas ruas estreitas de Monte Carlo.",
			author: "Equipe TF",
			read_time: "5 min",
			published: true,
			trending: true,
			tags: ["f1", "verstappen", "monaco"],
			created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
		},
		{
			id: 2,
			title: "Novo Motor V8 Biturbo: A Revolução dos 1000HP",
			slug: "novo-motor-v8-biturbo-1000hp",
			category: "engines",
			category_name: "Motores",
			image_url:
				"https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?w=800",
			excerpt:
				"Análise completa do novo propulsor que está mudando o cenário do tuning com tecnologia de ponta.",
			content:
				"A indústria automotiva testemunha mais uma revolução com o lançamento do novo motor V8 biturbo.",
			author: "Tech Team",
			read_time: "8 min",
			published: true,
			trending: false,
			tags: ["motores", "v8", "biturbo"],
			created_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
		},
		{
			id: 3,
			title: "Daytona 500: A Batalha Épica que Definiu a Temporada",
			slug: "daytona-500-batalha-epica-temporada",
			category: "nascar",
			category_name: "NASCAR",
			image_url:
				"https://images.unsplash.com/photo-1566473965997-3de9c817e938?w=800",
			excerpt:
				"Relato completo da corrida mais emocionante do ano com ultrapassagens incríveis e estratégias audaciosas.",
			content:
				"A Daytona 500 de 2025 entrou para a história como uma das corridas mais emocionantes.",
			author: "Race Team",
			read_time: "6 min",
			published: true,
			trending: true,
			tags: ["nascar", "daytona", "500"],
			created_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
		},
	];

	const staticCategories = [
		{
			id: "f1",
			name: "Fórmula 1",
			description: "A elite do automobilismo mundial",
			color: "from-red-500 to-orange-500",
			count: 12,
		},
		{
			id: "nascar",
			name: "NASCAR",
			description: "A categoria mais popular dos EUA",
			color: "from-blue-500 to-cyan-500",
			count: 8,
		},
		{
			id: "endurance",
			name: "Endurance",
			description: "Corridas de resistência épicas",
			color: "from-green-500 to-emerald-500",
			count: 6,
		},
		{
			id: "drift",
			name: "Formula Drift",
			description: "A arte de deslizar com estilo",
			color: "from-purple-500 to-pink-500",
			count: 10,
		},
		{
			id: "tuning",
			name: "Tuning & Custom",
			description: "Personalização e modificações",
			color: "from-yellow-500 to-orange-500",
			count: 15,
		},
		{
			id: "engines",
			name: "Motores",
			description: "Tecnologia e performance",
			color: "from-indigo-500 to-purple-500",
			count: 9,
		},
	];

	// Detectar navegador para logs
	const getBrowser = () => {
		const userAgent = navigator.userAgent;
		if (userAgent.includes("Chrome")) return "Chrome";
		if (userAgent.includes("Safari")) return "Safari";
		if (userAgent.includes("Firefox")) return "Firefox";
		return "Unknown";
	};

	// Carregamento compatível com todos os navegadores
	useEffect(() => {
		const loadData = async () => {
			try {
				console.log(`🌐 [${getBrowser()}] Iniciando carregamento de dados...`);
				setLoading(true);
				setError(null);

				// Simular carregamento (compatível com todos os navegadores)
				await new Promise((resolve) => setTimeout(resolve, 1500));

				// Definir dados (forçar mesmo estado em todos os navegadores)
				setPosts(staticPosts);
				setCategories(staticCategories);

				console.log(`✅ [${getBrowser()}] Dados carregados:`, {
					posts: staticPosts.length,
					categories: staticCategories.length,
				});
			} catch (error) {
				console.error(`❌ [${getBrowser()}] Erro ao carregar dados:`, error);
				setError(error.message);
			} finally {
				setLoading(false);
			}
		};

		loadData();
	}, []); // Array vazio - executa apenas uma vez

	const formatDate = (dateString) => {
		try {
			return new Date(dateString).toLocaleDateString("pt-BR");
		} catch (error) {
			return "Data inválida";
		}
	};

	const featuredPosts = posts.filter((post) => post.trending);

	const renderHero = () => (
		<div className="relative min-h-screen flex items-center justify-center overflow-hidden">
			<div className="absolute inset-0 bg-gradient-to-br from-black via-gray-900 to-black"></div>
			<div className="absolute inset-0 bg-gradient-to-r from-red-900/20 via-transparent to-red-900/20"></div>

			<div className="absolute inset-0">
				<div className="absolute top-1/4 left-1/4 w-96 h-96 bg-red-500/10 rounded-full blur-3xl animate-pulse"></div>
				<div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-orange-500/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
			</div>

			<div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
				<div className="animate-fade-in">
					<div className="mb-8">
						<div className="inline-flex items-center px-6 py-3 rounded-full bg-red-500/10 border border-red-500/20 backdrop-blur-sm mb-6">
							<span className="text-red-400 text-sm font-semibold">
								🏁 Bem-vindo ao futuro do motorsport
							</span>
						</div>
					</div>

					<h1 className="text-5xl md:text-7xl lg:text-8xl font-black text-white mb-8 leading-none">
						<span className="bg-gradient-to-r from-white via-gray-100 to-gray-300 bg-clip-text text-transparent">
							TORQUE
						</span>
						<br />
						<span className="bg-gradient-to-r from-red-500 via-red-400 to-orange-400 bg-clip-text text-transparent">
							FORGED
						</span>
						<br />
						<span className="text-2xl md:text-3xl lg:text-4xl font-medium tracking-wider text-gray-400">
							MOTORSPORT
						</span>
					</h1>

					<p className="text-xl md:text-2xl text-gray-300 mb-12 max-w-4xl mx-auto leading-relaxed">
						Sua fonte definitiva para tudo sobre corridas, tuning e o mundo
						automotivo.
						<br className="hidden md:block" />
						Das pistas de F1 aos motores customizados, cobrimos toda a
						adrenalina do motorsport.
					</p>

					<div className="flex flex-col sm:flex-row gap-6 justify-center">
						<Link
							to="/f1"
							className="group bg-gradient-to-r from-red-600 to-red-500 hover:from-red-500 hover:to-red-400 text-white px-10 py-4 rounded-2xl font-semibold text-lg transition-all duration-300 shadow-2xl hover:shadow-red-500/25 hover:scale-105"
						>
							<span className="flex items-center space-x-3">
								<span>Últimas Notícias</span>
								<ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform duration-300" />
							</span>
						</Link>
						<a
							href="#"
							className="group border-2 border-white/20 hover:border-red-500/50 text-white hover:text-red-400 px-10 py-4 rounded-2xl font-semibold text-lg transition-all duration-300 backdrop-blur-sm hover:bg-red-500/10"
						>
							<span className="flex items-center space-x-3">
								<Youtube className="w-5 h-5" />
								<span>Assista no YouTube</span>
							</span>
						</a>
					</div>
				</div>
			</div>

			<div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 animate-bounce">
				<ChevronRight className="w-6 h-6 text-gray-400 rotate-90" />
			</div>
		</div>
	);

	const PostCard = ({ post }) => (
		<article className="group relative bg-gradient-to-br from-gray-900 to-gray-800 rounded-3xl overflow-hidden shadow-2xl hover:shadow-red-500/10 transition-all duration-500 hover:scale-105">
			<div className="relative overflow-hidden">
				<img
					src={post.image_url}
					alt={post.title}
					className="w-full h-56 object-cover transition-transform duration-700 group-hover:scale-110"
				/>
				<div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent"></div>

				<div className="absolute top-4 left-4 flex items-center space-x-2">
					<Link
						to={`/${post.category}`}
						className="bg-gradient-to-r from-red-600 to-red-500 text-white px-4 py-2 rounded-full text-sm font-semibold shadow-lg hover:shadow-red-500/25 transition-all duration-300"
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
	);

	const renderSidebar = () => (
		<div className="lg:col-span-1">
			<div className="space-y-8">
				{/* Debug Info para navegador */}
				<div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-3xl p-4 border border-gray-700/50 lg:hidden xl:block">
					<div className="text-xs text-gray-500">
						Browser: {getBrowser()} | Categories: {categories.length} | Posts:{" "}
						{posts.length}
					</div>
				</div>

				{/* Categorias */}
				<div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-3xl p-8 border border-gray-700/50 backdrop-blur-sm">
					<h3 className="text-2xl font-bold text-white mb-6 flex items-center space-x-3">
						<div className="w-2 h-8 bg-gradient-to-b from-red-500 to-orange-500 rounded-full"></div>
						<span>Categorias</span>
					</h3>
					<div className="space-y-4">
						{categories.length > 0 ? (
							categories.map((category) => (
								<Link
									key={category.id}
									to={`/${category.id}`}
									className="group relative p-4 rounded-2xl hover:bg-gray-800/50 cursor-pointer transition-all duration-300 overflow-hidden block"
								>
									<div
										className={`absolute inset-0 bg-gradient-to-r ${category.color} opacity-0 group-hover:opacity-10 transition-opacity duration-300 rounded-2xl`}
									></div>
									<div className="relative flex items-center justify-between">
										<div className="flex items-center space-x-4">
											<div
												className={`p-2 rounded-xl bg-gradient-to-r ${category.color} shadow-lg`}
											>
												<div className="text-white">
													{category.id === "f1" && <Zap className="w-5 h-5" />}
													{category.id === "nascar" && (
														<Play className="w-5 h-5" />
													)}
													{(category.id === "endurance" ||
														category.id === "drift" ||
														category.id === "tuning" ||
														category.id === "engines") && (
														<Settings className="w-5 h-5" />
													)}
												</div>
											</div>
											<div className="flex flex-col">
												<span className="text-gray-300 font-medium group-hover:text-white transition-colors duration-300">
													{category.name}
												</span>
												<span className="text-xs text-gray-500">
													{category.count} posts
												</span>
											</div>
										</div>
										<ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-red-400 group-hover:translate-x-1 transition-all duration-300" />
									</div>
								</Link>
							))
						) : (
							<div className="text-center py-4">
								<div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-500 mx-auto mb-2"></div>
								<p className="text-gray-400 text-sm">
									Carregando categorias...
								</p>
							</div>
						)}
					</div>
				</div>

				{/* Siga-nos */}
				<div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-3xl p-8 border border-gray-700/50 backdrop-blur-sm">
					<h3 className="text-2xl font-bold text-white mb-6 flex items-center space-x-3">
						<div className="w-2 h-8 bg-gradient-to-b from-purple-500 to-pink-500 rounded-full"></div>
						<span>Siga-nos</span>
					</h3>
					<div className="space-y-4">
						<a
							href="#"
							className="group flex items-center space-x-4 p-4 rounded-2xl bg-gradient-to-r from-red-600 to-red-500 hover:from-red-500 hover:to-red-400 transition-all duration-300 shadow-lg hover:shadow-red-500/25 hover:scale-105"
						>
							<Youtube className="w-6 h-6 text-white" />
							<div className="flex-1">
								<span className="text-white font-semibold block">YouTube</span>
								<span className="text-red-100 text-sm">
									Assista nossos vídeos
								</span>
							</div>
							<ArrowRight className="w-5 h-5 text-white group-hover:translate-x-1 transition-transform duration-300" />
						</a>

						<a
							href="#"
							className="group flex items-center space-x-4 p-4 rounded-2xl bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 transition-all duration-300 shadow-lg hover:shadow-purple-500/25 hover:scale-105"
						>
							<Instagram className="w-6 h-6 text-white" />
							<div className="flex-1">
								<span className="text-white font-semibold block">
									Instagram
								</span>
								<span className="text-purple-100 text-sm">
									Fotos exclusivas
								</span>
							</div>
							<ArrowRight className="w-5 h-5 text-white group-hover:translate-x-1 transition-transform duration-300" />
						</a>
					</div>
				</div>

				{/* Newsletter */}
				<div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-3xl p-8 border border-gray-700/50 backdrop-blur-sm">
					<h3 className="text-2xl font-bold text-white mb-6 flex items-center space-x-3">
						<div className="w-2 h-8 bg-gradient-to-b from-green-500 to-emerald-500 rounded-full"></div>
						<span>Newsletter</span>
					</h3>
					<p className="text-gray-400 mb-6 leading-relaxed">
						Receba as últimas notícias do motorsport direto no seu email.
					</p>
					<div className="space-y-4">
						<input
							type="email"
							placeholder="Seu melhor email"
							className="w-full px-6 py-4 bg-gray-800/50 border border-gray-600/50 rounded-2xl text-white placeholder-gray-500 focus:outline-none focus:border-red-500/50 focus:bg-gray-800 transition-all duration-300 backdrop-blur-sm"
						/>
						<button className="w-full bg-gradient-to-r from-red-600 to-red-500 hover:from-red-500 hover:to-red-400 text-white py-4 rounded-2xl font-semibold transition-all duration-300 shadow-lg hover:shadow-red-500/25 hover:scale-105">
							Inscrever-se Agora
						</button>
					</div>
				</div>
			</div>
		</div>
	);

	return (
		<>
			{renderHero()}

			{/* Posts em Destaque */}
			<div className="py-24 bg-gradient-to-b from-black to-gray-900">
				<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
					<div className="text-center mb-16">
						<div className="inline-flex items-center px-4 py-2 rounded-full bg-red-500/10 border border-red-500/20 backdrop-blur-sm mb-6">
							<TrendingUp className="w-4 h-4 text-red-400 mr-2" />
							<span className="text-red-400 text-sm font-semibold">
								Em Destaque
							</span>
						</div>
						<h2 className="text-4xl md:text-5xl font-black text-white mb-6 bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
							Posts em Destaque
						</h2>
						<p className="text-xl text-gray-400 max-w-2xl mx-auto">
							As últimas novidades do mundo do motorsport direto da nossa
							redação
						</p>
					</div>

					{loading ? (
						<div className="flex flex-col items-center justify-center py-12">
							<Loader className="w-12 h-12 text-red-400 animate-spin mb-4" />
							<span className="text-gray-400 text-lg">Carregando posts...</span>
							<span className="text-gray-500 text-sm mt-2">{getBrowser()}</span>
						</div>
					) : error ? (
						<div className="text-center py-12">
							<p className="text-red-400 text-lg mb-2">Erro: {error}</p>
							<p className="text-gray-500 text-sm">Navegador: {getBrowser()}</p>
						</div>
					) : featuredPosts.length > 0 ? (
						<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
							{featuredPosts.map((post) => (
								<PostCard key={post.id} post={post} />
							))}
						</div>
					) : (
						<div className="text-center py-12">
							<p className="text-gray-400 text-lg">
								Nenhum post em destaque no momento.
							</p>
						</div>
					)}
				</div>
			</div>

			{/* Últimos Artigos */}
			<div className="py-24 bg-gradient-to-b from-gray-900 to-black">
				<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
					<div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
						<div className="lg:col-span-2 space-y-8">
							<div className="flex items-center justify-between mb-12">
								<h2 className="text-3xl md:text-4xl font-black text-white bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
									Últimos Artigos
								</h2>
								<Link
									to="/f1"
									className="text-red-400 hover:text-red-300 font-semibold flex items-center space-x-2 group"
								>
									<span>Ver todos</span>
									<ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-300" />
								</Link>
							</div>

							{loading ? (
								<div className="flex flex-col items-center justify-center py-12">
									<Loader className="w-12 h-12 text-red-400 animate-spin mb-4" />
									<span className="text-gray-400 text-lg">
										Carregando artigos...
									</span>
									<span className="text-gray-500 text-sm mt-2">
										{getBrowser()}
									</span>
								</div>
							) : posts.length > 0 ? (
								<div className="space-y-8">
									{posts.map((post) => (
										<article
											key={post.id}
											className="group bg-gradient-to-br from-gray-900 to-gray-800 rounded-3xl p-8 border border-gray-700/50 hover:border-red-500/30 transition-all duration-500 hover:scale-[1.02]"
										>
											<div className="flex flex-col md:flex-row gap-8">
												<div className="relative overflow-hidden rounded-2xl">
													<img
														src={post.image_url}
														alt={post.title}
														className="w-full md:w-64 h-48 object-cover transition-transform duration-700 group-hover:scale-110"
													/>
													<div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
												</div>
												<div className="flex-1 space-y-4">
													<div className="flex items-center space-x-3">
														<Tag className="w-4 h-4 text-red-400" />
														<Link
															to={`/${post.category}`}
															className="text-red-400 text-sm font-semibold hover:text-red-300 transition-colors duration-300"
														>
															{post.category_name}
														</Link>
														{post.trending && (
															<>
																<span className="text-gray-600">•</span>
																<span className="text-orange-400 text-sm font-semibold flex items-center space-x-1">
																	<TrendingUp className="w-3 h-3" />
																	<span>Trending</span>
																</span>
															</>
														)}
													</div>
													<Link to={`/post/${post.id}`}>
														<h3 className="text-2xl font-bold text-white group-hover:text-red-400 transition-colors duration-300 leading-tight">
															{post.title}
														</h3>
													</Link>
													<p className="text-gray-400 leading-relaxed">
														{post.excerpt}
													</p>
													<div className="flex items-center justify-between pt-4">
														<div className="flex items-center space-x-6 text-sm text-gray-500">
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
																<span>{formatDate(post.created_at)}</span>
															</div>
														</div>
														<Link
															to={`/post/${post.id}`}
															className="text-red-400 hover:text-red-300 font-semibold text-sm flex items-center space-x-2 group-hover:space-x-3 transition-all duration-300"
														>
															<span>Leia mais</span>
															<ArrowRight className="w-4 h-4" />
														</Link>
													</div>
												</div>
											</div>
										</article>
									))}
								</div>
							) : (
								<div className="text-center py-12">
									<p className="text-gray-400 text-lg">
										Nenhum artigo encontrado.
									</p>
								</div>
							)}
						</div>

						{renderSidebar()}
					</div>
				</div>
			</div>
		</>
	);
};

export default Home;
