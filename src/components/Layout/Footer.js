import React from "react";
import { Link } from "react-router-dom";
import { Youtube, Instagram, Settings, ChevronRight } from "lucide-react";

const Footer = () => {
	// Estrutura organizada das categorias do mega menu
	const footerCategories = {
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
				{ name: "Ferrari", href: "/marcas/ferrari" },
				{ name: "McLaren", href: "/marcas/mclaren" },
				{ name: "Red Bull", href: "/marcas/red-bull" },
				{ name: "Mercedes", href: "/marcas/mercedes" },
				{ name: "Lamborghini", href: "/marcas/lamborghini" },
				{ name: "Porsche", href: "/marcas/porsche" },
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

					{/* Dynamic Category Sections */}
					{Object.entries(footerCategories).map(([key, category]) => (
						<div key={key} className="col-span-1">
							<div className="flex items-center space-x-2 mb-6">
								<span className="text-lg">{category.icon}</span>
								<h4 className="text-white font-bold text-lg">
									{category.title}
								</h4>
							</div>
							<ul className="space-y-3">
								{category.links.map((link, index) => (
									<li key={index}>
										<Link
											to={link.href}
											className="text-gray-400 hover:text-red-400 transition-colors duration-300 flex items-center space-x-2 group"
										>
											<ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-300" />
											<span>{link.name}</span>
										</Link>
									</li>
								))}
							</ul>
						</div>
					))}
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
							<Link
								to="/privacy"
								className="text-gray-400 hover:text-red-400 transition-colors duration-300 text-sm"
							>
								Política de Privacidade
							</Link>
							<Link
								to="/terms"
								className="text-gray-400 hover:text-red-400 transition-colors duration-300 text-sm"
							>
								Termos de Uso
							</Link>
							<Link
								to="/cookies"
								className="text-gray-400 hover:text-red-400 transition-colors duration-300 text-sm"
							>
								Política de Cookies
							</Link>
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
						</p>
					</div>
				</div>
			</div>
		</footer>
	);
};

export default Footer;
