import React from "react";
import { Link } from "react-router-dom";
import { Youtube, Instagram, Settings, ChevronRight } from "lucide-react";

const Footer = () => {
	return (
		<footer className="bg-gradient-to-t from-black to-gray-900 border-t border-gray-800/50 py-16">
			<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
				<div className="grid grid-cols-1 md:grid-cols-4 gap-12">
					<div className="col-span-1 md:col-span-2">
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

					<div>
						<h4 className="text-white font-bold mb-6 text-lg">Categorias</h4>
						<ul className="space-y-3">
							<li>
								<Link
									to="/f1"
									className="text-gray-400 hover:text-red-400 transition-colors duration-300 flex items-center space-x-2"
								>
									<ChevronRight className="w-4 h-4" />
									<span>Fórmula 1</span>
								</Link>
							</li>
							<li>
								<Link
									to="/nascar"
									className="text-gray-400 hover:text-red-400 transition-colors duration-300 flex items-center space-x-2"
								>
									<ChevronRight className="w-4 h-4" />
									<span>NASCAR</span>
								</Link>
							</li>
							<li>
								<Link
									to="/endurance"
									className="text-gray-400 hover:text-red-400 transition-colors duration-300 flex items-center space-x-2"
								>
									<ChevronRight className="w-4 h-4" />
									<span>Endurance</span>
								</Link>
							</li>
							<li>
								<Link
									to="/drift"
									className="text-gray-400 hover:text-red-400 transition-colors duration-300 flex items-center space-x-2"
								>
									<ChevronRight className="w-4 h-4" />
									<span>Formula Drift</span>
								</Link>
							</li>
						</ul>
					</div>

					<div>
						<h4 className="text-white font-bold mb-6 text-lg">Links</h4>
						<ul className="space-y-3">
							<li>
								<Link
									to="/about"
									className="text-gray-400 hover:text-red-400 transition-colors duration-300 flex items-center space-x-2"
								>
									<ChevronRight className="w-4 h-4" />
									<span>Sobre</span>
								</Link>
							</li>
							<li>
								<Link
									to="/contact"
									className="text-gray-400 hover:text-red-400 transition-colors duration-300 flex items-center space-x-2"
								>
									<ChevronRight className="w-4 h-4" />
									<span>Contato</span>
								</Link>
							</li>
							<li>
								<a
									href="#"
									className="text-gray-400 hover:text-red-400 transition-colors duration-300 flex items-center space-x-2"
								>
									<ChevronRight className="w-4 h-4" />
									<span>Política de Privacidade</span>
								</a>
							</li>
							<li>
								<a
									href="#"
									className="text-gray-400 hover:text-red-400 transition-colors duration-300 flex items-center space-x-2"
								>
									<ChevronRight className="w-4 h-4" />
									<span>Termos de Uso</span>
								</a>
							</li>
						</ul>
					</div>
				</div>

				<div className="border-t border-gray-800/50 mt-12 pt-8 text-center">
					<p className="text-gray-400 text-lg">
						&copy; 2025 Torque Forged Motorsport. Todos os direitos reservados.
					</p>
				</div>
			</div>
		</footer>
	);
};

export default Footer;
