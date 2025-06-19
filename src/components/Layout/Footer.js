import React, { useMemo } from "react";
import { Link } from "react-router-dom";
import { Youtube, Instagram, Settings, ChevronRight } from "lucide-react";
import { useCategoriesHierarchy } from "../../hooks/usePostsQuery";

const Footer = () => {
	const { data: categoriesHierarchy = [], isLoading } =
		useCategoriesHierarchy();

	// Transformar hierarquia do banco em estrutura do footer
	const footerCategories = useMemo(() => {
		if (!categoriesHierarchy.length) {
			// Fallback estático se não conseguir carregar do banco
			return {
				corridas: {
					title: "Corridas",
					icon: "🏁",
					color: "from-red-500 to-orange-500",
					links: [
						{ name: "Fórmula 1", href: "/f1" },
						{ name: "NASCAR", href: "/nascar" },
						{ name: "Endurance", href: "/endurance" },
						{ name: "Formula Drift", href: "/drift" },
					],
				},
				marcas: {
					title: "Marcas",
					icon: "🏎️",
					color: "from-blue-500 to-cyan-500",
					links: [
						{ name: "Ferrari", href: "/ferrari" },
						{ name: "McLaren", href: "/mclaren" },
						{ name: "Red Bull", href: "/red-bull" },
						{ name: "Mercedes", href: "/mercedes" },
						{ name: "Lamborghini", href: "/lamborghini" },
						{ name: "Porsche", href: "/porsche" },
					],
				},
				preparacao: {
					title: "Preparação",
					icon: "🔧",
					color: "from-green-500 to-emerald-500",
					links: [
						{ name: "Tuning", href: "/tuning" },
						{ name: "Motores", href: "/engines" },
						{ name: "Performance", href: "/performance" },
						{ name: "Custom", href: "/custom" },
					],
				},
				tecnologia: {
					title: "Tecnologia",
					icon: "⚙️",
					color: "from-purple-500 to-pink-500",
					links: [
						{ name: "Motores Tech", href: "/tecnologia/motores" },
						{ name: "Aerodinâmica", href: "/tecnologia/aerodinamica" },
						{ name: "Eletrônica", href: "/tecnologia/eletronica" },
						{ name: "Materiais", href: "/tecnologia/materiais" },
					],
				},
			};
		}

		// Transformar dados do banco em estrutura do footer
		const result = {};

		// Primeiro, criar as categorias principais (nível 1)
		categoriesHierarchy
			.filter((cat) => cat.level === 1)
			.forEach((category) => {
				result[category.id] = {
					title: category.name,
					icon: category.icon || "📁",
					color: category.color || "from-gray-500 to-gray-400",
					links: [],
				};
			});

		// Depois, adicionar as subcategorias (nível 2) como links
		categoriesHierarchy
			.filter((cat) => cat.level === 2)
			.forEach((subcategory) => {
				const parentCategory = result[subcategory.parent_id];
				if (parentCategory) {
					parentCategory.links.push({
						name: subcategory.name,
						href: `/${subcategory.slug}`,
						postCount: subcategory.post_count || 0,
					});
				}
			});

		// Limitar a 6 links por categoria para o footer
		Object.values(result).forEach((category) => {
			category.links = category.links
				.sort((a, b) => (b.postCount || 0) - (a.postCount || 0)) // Ordenar por popularidade
				.slice(0, 6);
		});

		return result;
	}, [categoriesHierarchy]);

	// Links legais e institucionais
	const legalLinks = [
		{ name: "Política de Privacidade", href: "/privacy" },
		{ name: "Termos de Uso", href: "/terms" },
		{ name: "Política de Cookies", href: "/cookies" },
	];

	// Links de navegação secundária
	const secondaryLinks = [
		{ name: "Sobre", href: "/about" },
		{ name: "Contato", href: "/contact" },
		{ name: "Todos os Posts", href: "/posts" },
		{ name: "Arquivo", href: "/archive" },
	];

	return (
		<footer className="bg-gradient-to-t from-black to-gray-900 border-t border-gray-800/50 py-16">
			<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
				<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-12">
					{/* Brand Section */}
					<div className="col-span-1 md:col-span-2 lg:col-span-2">
						<Link to="/" className="flex items-center space-x-4 mb-8">
							<div className="w-14 h-14 bg-gradient-to-r from-red-600 to-red-500 rounded-2xl flex items-center justify-center shadow-lg">
								<Settings className="w-8 h-8 text-white" />
							</div>
							<div>
								<h3 className="text-2xl font-black text-white">
									TORQUE FORGED
								</h3>
								<p className="text-sm text-red-400 font-medium tracking-wider">
									MOTORSPORT
								</p>
							</div>
						</Link>

						<p className="text-gray-400 mb-8 leading-relaxed text-lg">
							Sua fonte definitiva para tudo sobre corridas, tuning e o mundo
							automotivo. Conectando paixão e velocidade em cada história.
						</p>

						{/* Stats dinâmicas */}
						{!isLoading && categoriesHierarchy.length > 0 && (
							<div className="grid grid-cols-2 gap-4 mb-8">
								<div className="bg-gray-800/30 rounded-xl p-4 text-center">
									<div className="text-2xl font-black text-white mb-1">
										{categoriesHierarchy.filter((c) => c.level === 1).length}
									</div>
									<div className="text-xs text-gray-400">Categorias</div>
								</div>
								<div className="bg-gray-800/30 rounded-xl p-4 text-center">
									<div className="text-2xl font-black text-white mb-1">
										{categoriesHierarchy.reduce(
											(sum, c) => sum + (c.post_count || 0),
											0
										)}
									</div>
									<div className="text-xs text-gray-400">Posts</div>
								</div>
							</div>
						)}

						<div className="flex space-x-6">
							<a
								href="https://www.youtube.com/channel/UCTk9ewLwz0tx80SeKxxPpVQ"
								target="_blank"
								rel="noopener noreferrer"
								className="group text-gray-400 hover:text-red-400 transition-all duration-300"
							>
								<Youtube className="w-8 h-8 group-hover:scale-110 transition-transform duration-300" />
							</a>
							<a
								href="https://instagram.com/torqueforgedmotorsport"
								target="_blank"
								rel="noopener noreferrer"
								className="group text-gray-400 hover:text-red-400 transition-all duration-300"
							>
								<Instagram className="w-8 h-8 group-hover:scale-110 transition-transform duration-300" />
							</a>
						</div>
					</div>

					{/* Dynamic Category Sections from Database */}
					{Object.entries(footerCategories).map(([key, category]) => (
						<div key={key} className="col-span-1">
							<div className="flex items-center space-x-2 mb-6">
								<span className="text-lg">{category.icon}</span>
								<h4 className="text-white font-bold text-lg">
									{category.title}
								</h4>
							</div>

							{isLoading ? (
								// Loading skeleton
								<div className="space-y-3 animate-pulse">
									{Array.from({ length: 4 }).map((_, i) => (
										<div key={i} className="h-4 bg-gray-700 rounded"></div>
									))}
								</div>
							) : (
								<ul className="space-y-3">
									{category.links.map((link, index) => (
										<li key={index}>
											<Link
												to={link.href}
												className="text-gray-400 hover:text-red-400 transition-colors duration-300 flex items-center space-x-2 group"
											>
												<ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-300" />
												<span>{link.name}</span>
												{link.postCount > 0 && (
													<span className="text-xs text-gray-600 bg-gray-800 px-2 py-1 rounded-full">
														{link.postCount}
													</span>
												)}
											</Link>
										</li>
									))}

									{/* Link "Ver mais" se a categoria tiver muitas subcategorias */}
									{categoriesHierarchy.filter(
										(c) => c.level === 2 && c.parent_id === key
									).length > 6 && (
										<li>
											<Link
												to={`/${key}`}
												className="text-red-400 hover:text-red-300 transition-colors duration-300 flex items-center space-x-2 group font-semibold"
											>
												<ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-300" />
												<span>Ver todas</span>
											</Link>
										</li>
									)}
								</ul>
							)}
						</div>
					))}
				</div>

				{/* Secondary Navigation */}
				<div className="border-t border-gray-800/50 mt-12 pt-8">
					<div className="grid grid-cols-1 md:grid-cols-3 gap-8">
						{/* Navegação Secundária */}
						<div>
							<h5 className="text-white font-bold text-lg mb-4">Navegação</h5>
							<ul className="space-y-2">
								{secondaryLinks.map((link, index) => (
									<li key={index}>
										<Link
											to={link.href}
											className="text-gray-400 hover:text-red-400 transition-colors duration-300 flex items-center space-x-2"
										>
											<ChevronRight className="w-3 h-3" />
											<span>{link.name}</span>
										</Link>
									</li>
								))}
							</ul>
						</div>

						{/* Newsletter */}
						<div>
							<h5 className="text-white font-bold text-lg mb-4">Newsletter</h5>
							<p className="text-gray-400 text-sm mb-4">
								Receba as últimas notícias do motorsport diretamente no seu
								email.
							</p>
							<div className="flex space-x-2">
								<input
									type="email"
									placeholder="Seu email"
									className="flex-1 px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-red-500 text-sm"
								/>
								<button className="bg-gradient-to-r from-red-600 to-red-500 hover:from-red-500 hover:to-red-400 text-white px-4 py-2 rounded-lg font-semibold transition-all duration-300 text-sm">
									Assinar
								</button>
							</div>
						</div>

						{/* Links Rápidos */}
						<div>
							<h5 className="text-white font-bold text-lg mb-4">
								Mais Populares
							</h5>
							<ul className="space-y-2">
								{categoriesHierarchy
									.filter((c) => c.level === 2)
									.sort((a, b) => (b.post_count || 0) - (a.post_count || 0))
									.slice(0, 4)
									.map((category, index) => (
										<li key={category.id}>
											<Link
												to={`/${category.slug}`}
												className="text-gray-400 hover:text-red-400 transition-colors duration-300 flex items-center justify-between"
											>
												<div className="flex items-center space-x-2">
													<span className="text-xs">{category.icon}</span>
													<span className="text-sm">{category.name}</span>
												</div>
												<span className="text-xs text-gray-600">
													{category.post_count || 0}
												</span>
											</Link>
										</li>
									))}
							</ul>
						</div>
					</div>
				</div>

				{/* Bottom Section */}
				<div className="border-t border-gray-800/50 mt-12 pt-8">
					<div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
						{/* Copyright */}
						<div className="text-center md:text-left">
							<p className="text-gray-400 text-lg">
								&copy; 2025 Torque Forged Motorsport. Todos os direitos
								reservados.
							</p>
						</div>

						{/* Links Legais */}
						<div className="flex flex-col md:flex-row items-center md:justify-end space-y-3 md:space-y-0 md:space-x-6">
							{legalLinks.map((link, index) => (
								<Link
									key={index}
									to={link.href}
									className="text-gray-400 hover:text-red-400 transition-colors duration-300 text-sm"
								>
									{link.name}
								</Link>
							))}
						</div>
					</div>

					{/* Extra Bottom Info */}
					<div className="mt-8 pt-6 border-t border-gray-800/30 text-center">
						<p className="text-gray-500 text-sm">
							Desenvolvido com ❤️ para entusiastas do motorsport |
							<span className="mx-2">•</span>
							Conteúdo atualizado diariamente
							<span className="mx-2">•</span>
							<Link
								to="/contact"
								className="hover:text-red-400 transition-colors duration-300"
							>
								Entre em contato
							</Link>
							{!isLoading && categoriesHierarchy.length > 0 && (
								<>
									<span className="mx-2">•</span>
									<span>{categoriesHierarchy.length} categorias ativas</span>
								</>
							)}
						</p>

						{/* Indicador de Sistema Hierárquico */}
						{!isLoading && categoriesHierarchy.length > 0 && (
							<div className="mt-4 flex items-center justify-center space-x-4 text-xs text-gray-600">
								<div className="flex items-center space-x-1">
									<div className="w-2 h-2 bg-red-500 rounded-full"></div>
									<span>Sistema Hierárquico Ativo</span>
								</div>
								<div className="flex items-center space-x-1">
									<div className="w-2 h-2 bg-green-500 rounded-full"></div>
									<span>Dados Dinâmicos do Banco</span>
								</div>
								<div className="flex items-center space-x-1">
									<div className="w-2 h-2 bg-blue-500 rounded-full"></div>
									<span>
										{categoriesHierarchy.filter((c) => c.level === 1).length}→
										{categoriesHierarchy.filter((c) => c.level === 2).length}→
										{categoriesHierarchy.filter((c) => c.level === 3).length}{" "}
										Níveis
									</span>
								</div>
							</div>
						)}
					</div>
				</div>
			</div>
		</footer>
	);
};

export default Footer;
