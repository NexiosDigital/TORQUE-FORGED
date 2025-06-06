import React, { useState } from "react";
import { Mail, Phone, MapPin, Send, Youtube, Instagram } from "lucide-react";

const Contact = () => {
	const [formData, setFormData] = useState({
		name: "",
		email: "",
		subject: "",
		message: "",
	});

	const handleChange = (e) => {
		setFormData({
			...formData,
			[e.target.name]: e.target.value,
		});
	};

	const handleSubmit = (e) => {
		e.preventDefault();
		// Aqui você implementaria o envio do formulário
		console.log("Form submitted:", formData);
		alert("Mensagem enviada com sucesso!");
		setFormData({ name: "", email: "", subject: "", message: "" });
	};

	return (
		<div className="min-h-screen pt-20">
			{/* Hero Section */}
			<div className="relative py-24 bg-gradient-to-r from-red-600 to-orange-500">
				<div className="absolute inset-0 bg-black/40"></div>
				<div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
					<h1 className="text-5xl md:text-6xl font-black text-white mb-6">
						Contato
					</h1>
					<p className="text-xl text-white/90 max-w-2xl mx-auto">
						Entre em contato conosco. Adoramos ouvir de fellow car enthusiasts!
					</p>
				</div>
			</div>

			{/* Contact Content */}
			<div className="py-16 bg-gradient-to-b from-gray-900 to-black">
				<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
					<div className="grid grid-cols-1 lg:grid-cols-3 gap-16">
						{/* Contact Info */}
						<div className="lg:col-span-1">
							<h2 className="text-3xl font-black text-white mb-8">
								Fale Conosco
							</h2>

							<div className="space-y-8">
								<div className="flex items-start space-x-4">
									<div className="w-12 h-12 bg-gradient-to-r from-red-600 to-red-500 rounded-xl flex items-center justify-center flex-shrink-0">
										<Mail className="w-6 h-6 text-white" />
									</div>
									<div>
										<h3 className="text-white font-semibold mb-2">Email</h3>
										<p className="text-gray-400">contato@torqueforged.com</p>
										<p className="text-gray-400">redacao@torqueforged.com</p>
									</div>
								</div>

								<div className="flex items-start space-x-4">
									<div className="w-12 h-12 bg-gradient-to-r from-red-600 to-red-500 rounded-xl flex items-center justify-center flex-shrink-0">
										<Phone className="w-6 h-6 text-white" />
									</div>
									<div>
										<h3 className="text-white font-semibold mb-2">Telefone</h3>
										<p className="text-gray-400">+55 (11) 99999-9999</p>
									</div>
								</div>

								<div className="flex items-start space-x-4">
									<div className="w-12 h-12 bg-gradient-to-r from-red-600 to-red-500 rounded-xl flex items-center justify-center flex-shrink-0">
										<MapPin className="w-6 h-6 text-white" />
									</div>
									<div>
										<h3 className="text-white font-semibold mb-2">
											Localização
										</h3>
										<p className="text-gray-400">São Paulo - SP, Brasil</p>
									</div>
								</div>
							</div>

							{/* Social Media */}
							<div className="mt-12">
								<h3 className="text-white font-semibold mb-6">Redes Sociais</h3>
								<div className="flex space-x-4">
									<a
										href="#"
										className="w-12 h-12 bg-gradient-to-r from-red-600 to-red-500 rounded-xl flex items-center justify-center hover:scale-110 transition-transform duration-300"
									>
										<Youtube className="w-6 h-6 text-white" />
									</a>
									<a
										href="#"
										className="w-12 h-12 bg-gradient-to-r from-purple-600 to-pink-600 rounded-xl flex items-center justify-center hover:scale-110 transition-transform duration-300"
									>
										<Instagram className="w-6 h-6 text-white" />
									</a>
								</div>
							</div>
						</div>

						{/* Contact Form */}
						<div className="lg:col-span-2">
							<div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-3xl p-8 border border-gray-700/50">
								<h2 className="text-3xl font-black text-white mb-8">
									Envie uma Mensagem
								</h2>

								<form onSubmit={handleSubmit} className="space-y-6">
									<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
										<div>
											<label
												htmlFor="name"
												className="block text-white font-semibold mb-3"
											>
												Nome
											</label>
											<input
												type="text"
												id="name"
												name="name"
												value={formData.name}
												onChange={handleChange}
												required
												className="w-full px-6 py-4 bg-gray-800/50 border border-gray-600/50 rounded-2xl text-white placeholder-gray-500 focus:outline-none focus:border-red-500/50 focus:bg-gray-800 transition-all duration-300"
												placeholder="Seu nome"
											/>
										</div>
										<div>
											<label
												htmlFor="email"
												className="block text-white font-semibold mb-3"
											>
												Email
											</label>
											<input
												type="email"
												id="email"
												name="email"
												value={formData.email}
												onChange={handleChange}
												required
												className="w-full px-6 py-4 bg-gray-800/50 border border-gray-600/50 rounded-2xl text-white placeholder-gray-500 focus:outline-none focus:border-red-500/50 focus:bg-gray-800 transition-all duration-300"
												placeholder="Seu email"
											/>
										</div>
									</div>

									<div>
										<label
											htmlFor="subject"
											className="block text-white font-semibold mb-3"
										>
											Assunto
										</label>
										<input
											type="text"
											id="subject"
											name="subject"
											value={formData.subject}
											onChange={handleChange}
											required
											className="w-full px-6 py-4 bg-gray-800/50 border border-gray-600/50 rounded-2xl text-white placeholder-gray-500 focus:outline-none focus:border-red-500/50 focus:bg-gray-800 transition-all duration-300"
											placeholder="Assunto da mensagem"
										/>
									</div>

									<div>
										<label
											htmlFor="message"
											className="block text-white font-semibold mb-3"
										>
											Mensagem
										</label>
										<textarea
											id="message"
											name="message"
											value={formData.message}
											onChange={handleChange}
											required
											rows={6}
											className="w-full px-6 py-4 bg-gray-800/50 border border-gray-600/50 rounded-2xl text-white placeholder-gray-500 focus:outline-none focus:border-red-500/50 focus:bg-gray-800 transition-all duration-300 resize-none"
											placeholder="Sua mensagem..."
										/>
									</div>

									<button
										type="submit"
										className="w-full bg-gradient-to-r from-red-600 to-red-500 hover:from-red-500 hover:to-red-400 text-white py-4 rounded-2xl font-semibold text-lg transition-all duration-300 shadow-lg hover:shadow-red-500/25 hover:scale-105 flex items-center justify-center space-x-3"
									>
										<Send className="w-5 h-5" />
										<span>Enviar Mensagem</span>
									</button>
								</form>
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
};

export default Contact;
