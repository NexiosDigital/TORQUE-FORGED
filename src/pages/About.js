import React from "react";
import { Users, Target, Award, Heart } from "lucide-react";

const About = () => {
	return (
		<div className="min-h-screen pt-20">
			{/* Hero Section */}
			<div className="relative py-24 bg-gradient-to-r from-red-600 to-orange-500">
				<div className="absolute inset-0 bg-black/40"></div>
				<div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
					<h1 className="text-5xl md:text-6xl font-black text-white mb-6">
						Sobre Nós
					</h1>
					<p className="text-xl text-white/90 max-w-3xl mx-auto">
						Somos apaixonados por motorsport e compartilhamos essa paixão
						através do melhor conteúdo automotivo do Brasil.
					</p>
				</div>
			</div>

			{/* Content */}
			<div className="py-16 bg-gradient-to-b from-gray-900 to-black">
				<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
					<div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
						<div>
							<h2 className="text-4xl font-black text-white mb-6">
								Nossa História
							</h2>
							<div className="space-y-6 text-gray-300 text-lg leading-relaxed">
								<p>
									O Torque Forged Motorsport nasceu da paixão genuína por tudo
									que envolve o mundo automotivo. Começamos como entusiastas que
									queriam compartilhar conhecimento e experiências sobre
									corridas, tuning e tecnologia automotiva.
								</p>
								<p>
									Hoje, somos uma equipe dedicada de especialistas que cobre
									desde a Fórmula 1 até as modificações mais extremas de
									motores. Nossa missão é trazer conteúdo de qualidade, análises
									técnicas profundas e as últimas novidades do motorsport
									mundial.
								</p>
								<p>
									Acreditamos que a paixão por carros une pessoas de todos os
									cantos do mundo, e é isso que nos motiva a continuar criando
									conteúdo que inspire e eduque nossa comunidade.
								</p>
							</div>
						</div>

						<div className="grid grid-cols-2 gap-8">
							<div className="bg-gradient-to-br from-gray-900 to-gray-800 p-8 rounded-3xl text-center border border-gray-700/50">
								<Users className="w-12 h-12 text-red-400 mx-auto mb-4" />
								<h3 className="text-2xl font-bold text-white mb-2">10k+</h3>
								<p className="text-gray-400">Seguidores</p>
							</div>
							<div className="bg-gradient-to-br from-gray-900 to-gray-800 p-8 rounded-3xl text-center border border-gray-700/50">
								<Target className="w-12 h-12 text-red-400 mx-auto mb-4" />
								<h3 className="text-2xl font-bold text-white mb-2">500+</h3>
								<p className="text-gray-400">Artigos</p>
							</div>
							<div className="bg-gradient-to-br from-gray-900 to-gray-800 p-8 rounded-3xl text-center border border-gray-700/50">
								<Award className="w-12 h-12 text-red-400 mx-auto mb-4" />
								<h3 className="text-2xl font-bold text-white mb-2">5</h3>
								<p className="text-gray-400">Anos</p>
							</div>
							<div className="bg-gradient-to-br from-gray-900 to-gray-800 p-8 rounded-3xl text-center border border-gray-700/50">
								<Heart className="w-12 h-12 text-red-400 mx-auto mb-4" />
								<h3 className="text-2xl font-bold text-white mb-2">100%</h3>
								<p className="text-gray-400">Paixão</p>
							</div>
						</div>
					</div>

					{/* Values */}
					<div className="mt-24">
						<h2 className="text-4xl font-black text-white text-center mb-16">
							Nossos Valores
						</h2>
						<div className="grid grid-cols-1 md:grid-cols-3 gap-8">
							<div className="bg-gradient-to-br from-gray-900 to-gray-800 p-8 rounded-3xl border border-gray-700/50 text-center">
								<div className="w-16 h-16 bg-gradient-to-r from-red-600 to-red-500 rounded-2xl flex items-center justify-center mx-auto mb-6">
									<Target className="w-8 h-8 text-white" />
								</div>
								<h3 className="text-xl font-bold text-white mb-4">Precisão</h3>
								<p className="text-gray-400">
									Comprometidos com informações precisas e análises técnicas
									detalhadas.
								</p>
							</div>
							<div className="bg-gradient-to-br from-gray-900 to-gray-800 p-8 rounded-3xl border border-gray-700/50 text-center">
								<div className="w-16 h-16 bg-gradient-to-r from-red-600 to-red-500 rounded-2xl flex items-center justify-center mx-auto mb-6">
									<Heart className="w-8 h-8 text-white" />
								</div>
								<h3 className="text-xl font-bold text-white mb-4">Paixão</h3>
								<p className="text-gray-400">
									Movidos pela paixão genuína por motorsport e cultura
									automotiva.
								</p>
							</div>
							<div className="bg-gradient-to-br from-gray-900 to-gray-800 p-8 rounded-3xl border border-gray-700/50 text-center">
								<div className="w-16 h-16 bg-gradient-to-r from-red-600 to-red-500 rounded-2xl flex items-center justify-center mx-auto mb-6">
									<Users className="w-8 h-8 text-white" />
								</div>
								<h3 className="text-xl font-bold text-white mb-4">
									Comunidade
								</h3>
								<p className="text-gray-400">
									Construindo uma comunidade forte de entusiastas automotivos.
								</p>
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
};

export default About;
