import React, { useState, useEffect, useRef } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
	Menu,
	X,
	Settings,
	User,
	LogOut,
	ChevronDown,
	Shield,
	Search,
	Youtube,
	Instagram,
	ArrowRight,
	Calendar,
	Clock,
	TrendingUp,
} from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";
import { useSearchPosts, usePrefetch } from "../../hooks/usePostsQuery";

// Componente do Modal de Busca (mantido igual)
const SearchModal = ({ isOpen, onClose }) => {
	const [searchTerm, setSearchTerm] = useState("");
	const [selectedIndex, setSelectedIndex] = useState(-1);
	const searchInputRef = useRef(null);
	const resultsRef = useRef(null);
	const navigate = useNavigate();
	const { prefetchPost } = usePrefetch();

	const { data: searchResults = [], isLoading } = useSearchPosts(searchTerm, {
		enabled: searchTerm.length >= 2,
	});

	useEffect(() => {
		if (isOpen && searchInputRef.current) {
			setTimeout(() => {
				searchInputRef.current.focus();
			}, 100);
		}
	}, [isOpen]);

	useEffect(() => {
		if (!isOpen) {
			setSearchTerm("");
			setSelectedIndex(-1);
		}
	}, [isOpen]);

	useEffect(() => {
		const handleKeyDown = (e) => {
			if (!isOpen) return;

			switch (e.key) {
				case "Escape":
					onClose();
					break;
				case "ArrowDown":
					e.preventDefault();
					setSelectedIndex((prev) =>
						prev < searchResults.length - 1 ? prev + 1 : prev
					);
					break;
				case "ArrowUp":
					e.preventDefault();
					setSelectedIndex((prev) => (prev > 0 ? prev - 1 : -1));
					break;
				case "Enter":
					e.preventDefault();
					if (selectedIndex >= 0 && searchResults[selectedIndex]) {
						handleSelectPost(searchResults[selectedIndex]);
					} else if (searchTerm.length >= 2) {
						handleViewAllResults();
					}
					break;
			}
		};

		document.addEventListener("keydown", handleKeyDown);
		return () => document.removeEventListener("keydown", handleKeyDown);
	}, [isOpen, selectedIndex, searchResults, searchTerm]);

	useEffect(() => {
		if (selectedIndex >= 0 && resultsRef.current) {
			const selectedElement = resultsRef.current.children[selectedIndex];
			if (selectedElement) {
				selectedElement.scrollIntoView({
					behavior: "smooth",
					block: "nearest",
				});
			}
		}
	}, [selectedIndex]);

	const handleSelectPost = (post) => {
		onClose();
		navigate(`/post/${post.id}`);
	};

	const handleViewAllResults = () => {
		onClose();
		navigate(`/posts?search=${encodeURIComponent(searchTerm)}`);
	};

	const formatDate = (dateString) => {
		try {
			return new Date(dateString).toLocaleDateString("pt-BR");
		} catch (error) {
			return "Data inválida";
		}
	};

	if (!isOpen) return null;

	return (
		<div className="fixed inset-0 z-[100] overflow-hidden">
			<div
				className="absolute inset-0 bg-black/70 backdrop-blur-sm transition-opacity duration-300"
				onClick={onClose}
			></div>

			<div className="relative flex min-h-full items-start justify-center p-4 pt-16 sm:pt-24">
				<div className="w-full max-w-2xl transform overflow-hidden rounded-3xl bg-gradient-to-br from-gray-900 to-gray-800 border border-gray-700/50 shadow-2xl transition-all duration-300">
					<div className="border-b border-gray-700/50 p-6">
						<div className="flex items-center space-x-4">
							<div className="relative flex-1">
								<Search className="absolute left-4 top-4 w-5 h-5 text-gray-400" />
								<input
									ref={searchInputRef}
									type="text"
									placeholder="Buscar posts, categorias, conteúdo..."
									value={searchTerm}
									onChange={(e) => setSearchTerm(e.target.value)}
									className="w-full pl-12 pr-4 py-4 bg-gray-800/50 border border-gray-600/50 rounded-2xl text-white placeholder-gray-500 focus:outline-none focus:border-red-500/50 focus:bg-gray-800 transition-all duration-300 text-lg"
								/>
							</div>
							<button
								onClick={onClose}
								className="p-3 rounded-xl bg-gray-800 hover:bg-gray-700 text-gray-400 hover:text-white transition-colors duration-300"
							>
								<X className="w-5 h-5" />
							</button>
						</div>

						{searchTerm.length === 0 && (
							<div className="mt-4 flex flex-wrap gap-2">
								<span className="text-gray-400 text-sm">Tente buscar:</span>
								{["F1", "Verstappen", "NASCAR", "Tuning", "Motor"].map(
									(suggestion) => (
										<button
											key={suggestion}
											onClick={() => setSearchTerm(suggestion)}
											className="px-3 py-1 bg-gray-700/50 hover:bg-gray-600/50 text-gray-300 hover:text-white rounded-full text-sm transition-colors duration-300"
										>
											{suggestion}
										</button>
									)
								)}
							</div>
						)}

						{searchTerm.length > 0 && searchTerm.length < 2 && (
							<p className="mt-4 text-gray-400 text-sm">
								Digite pelo menos 2 caracteres para buscar
							</p>
						)}
					</div>

					<div className="max-h-96 overflow-y-auto">
						{isLoading && searchTerm.length >= 2 && (
							<div className="p-8 text-center">
								<div className="w-8 h-8 border-2 border-red-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
								<p className="text-gray-400">Buscando...</p>
							</div>
						)}

						{!isLoading &&
							searchTerm.length >= 2 &&
							searchResults.length === 0 && (
								<div className="p-8 text-center">
									<Search className="w-12 h-12 text-gray-600 mx-auto mb-4" />
									<h3 className="text-xl font-bold text-white mb-2">
										Nenhum resultado encontrado
									</h3>
									<p className="text-gray-400 mb-6">
										Tente usar palavras-chave diferentes ou mais gerais
									</p>
								</div>
							)}

						{!isLoading && searchResults.length > 0 && (
							<div ref={resultsRef} className="divide-y divide-gray-700/30">
								{searchResults.slice(0, 8).map((post, index) => (
									<div
										key={post.id}
										className={`p-4 hover:bg-gray-800/50 cursor-pointer transition-colors duration-300 ${
											selectedIndex === index ? "bg-gray-800/50" : ""
										}`}
										onClick={() => handleSelectPost(post)}
										onMouseEnter={() => {
											setSelectedIndex(index);
											prefetchPost(post.id);
										}}
									>
										<div className="flex space-x-4">
											<img
												src={post.image_url}
												alt={post.title}
												className="w-16 h-16 rounded-xl object-cover flex-shrink-0"
												onError={(e) => {
													e.target.src =
														"https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=300&h=300&fit=crop";
												}}
											/>
											<div className="flex-1 min-w-0">
												<div className="flex items-center space-x-2 mb-1">
													<span className="bg-gradient-to-r from-red-600 to-red-500 text-white px-2 py-1 rounded-md text-xs font-bold">
														{post.category_name}
													</span>
													{post.trending && (
														<span className="bg-gradient-to-r from-orange-500 to-yellow-500 text-white px-2 py-1 rounded-md text-xs font-bold flex items-center space-x-1">
															<TrendingUp className="w-3 h-3" />
															<span>TREND</span>
														</span>
													)}
												</div>
												<h4 className="text-white font-semibold line-clamp-1 mb-1">
													{post.title}
												</h4>
												<p className="text-gray-400 text-sm line-clamp-1 mb-2">
													{post.excerpt}
												</p>
												<div className="flex items-center space-x-4 text-xs text-gray-500">
													<div className="flex items-center space-x-1">
														<User className="w-3 h-3" />
														<span>{post.author}</span>
													</div>
													<div className="flex items-center space-x-1">
														<Calendar className="w-3 h-3" />
														<span>{formatDate(post.created_at)}</span>
													</div>
													<div className="flex items-center space-x-1">
														<Clock className="w-3 h-3" />
														<span>{post.read_time}</span>
													</div>
												</div>
											</div>
											<ArrowRight className="w-4 h-4 text-gray-400 flex-shrink-0 mt-2" />
										</div>
									</div>
								))}

								{searchResults.length > 8 && (
									<div className="p-4">
										<button
											onClick={handleViewAllResults}
											className="w-full bg-gradient-to-r from-red-600 to-red-500 hover:from-red-500 hover:to-red-400 text-white py-3 rounded-xl font-semibold transition-all duration-300 shadow-lg hover:shadow-red-500/25 hover:scale-105"
										>
											Ver todos os {searchResults.length} resultados
										</button>
									</div>
								)}
							</div>
						)}
					</div>

					<div className="border-t border-gray-700/50 p-4 bg-gray-800/30">
						<div className="flex flex-wrap gap-4 text-xs text-gray-500">
							<div className="flex items-center space-x-2">
								<kbd className="px-2 py-1 bg-gray-700 rounded text-xs">↑↓</kbd>
								<span>Navegar</span>
							</div>
							<div className="flex items-center space-x-2">
								<kbd className="px-2 py-1 bg-gray-700 rounded text-xs">
									Enter
								</kbd>
								<span>Selecionar</span>
							</div>
							<div className="flex items-center space-x-2">
								<kbd className="px-2 py-1 bg-gray-700 rounded text-xs">Esc</kbd>
								<span>Fechar</span>
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
};

const Header = () => {
	const [isMenuOpen, setIsMenuOpen] = useState(false);
	const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
	const [isSearchOpen, setIsSearchOpen] = useState(false);
	const [scrollY, setScrollY] = useState(0);
	const [isLoggingOut, setIsLoggingOut] = useState(false);
	const location = useLocation();

	// Estrutura do mega menu com categorias e subcategorias CORRIGIDA
	const megaMenuData = {
		corridas: {
			name: "Corridas",
			color: "from-red-500 to-orange-500",
			icon: "🏁",
			subcategories: {
				"formula-1": {
					name: "Fórmula 1",
					href: "/f1",
					items: [
						{ name: "Equipes", href: "/f1/equipes" },
						{ name: "Pilotos", href: "/f1/pilotos" },
						{ name: "Calendário", href: "/f1/calendario" },
						{ name: "Notícias", href: "/f1" },
						{ name: "Análises Técnicas", href: "/f1/analises" },
						{ name: "Regulamentos", href: "/f1/regulamentos" },
					],
				},
				nascar: {
					name: "NASCAR",
					href: "/nascar",
					items: [
						{ name: "Cup Series", href: "/nascar/cup-series" },
						{ name: "Pilotos", href: "/nascar/pilotos" },
						{ name: "Corridas", href: "/nascar/corridas" },
						{ name: "Notícias", href: "/nascar" },
						{ name: "Histórico", href: "/nascar/historia" },
					],
				},
				endurance: {
					name: "Endurance",
					href: "/endurance",
					items: [
						{ name: "Le Mans 24h", href: "/endurance/le-mans" },
						{ name: "IMSA", href: "/endurance/imsa" },
						{ name: "WEC", href: "/endurance/wec" },
						{ name: "Equipas", href: "/endurance/equipas" },
						{ name: "Notícias", href: "/endurance" },
					],
				},
				drift: {
					name: "Formula Drift",
					href: "/drift",
					items: [
						{ name: "Pilotos", href: "/drift/pilotos" },
						{ name: "Carros", href: "/drift/carros" },
						{ name: "Eventos", href: "/drift/eventos" },
						{ name: "Técnicas", href: "/drift/tecnicas" },
						{ name: "Notícias", href: "/drift" },
					],
				},
			},
		},
		marcas: {
			name: "Marcas",
			color: "from-blue-500 to-cyan-500",
			icon: "🏎️",
			subcategories: {
				ferrari: {
					name: "Ferrari",
					href: "/marcas/ferrari",
					items: [
						{ name: "História", href: "/marcas/ferrari/historia" },
						{ name: "Modelos", href: "/marcas/ferrari/modelos" },
						{ name: "Scuderia F1", href: "/marcas/ferrari/f1" },
						{ name: "Notícias", href: "/marcas/ferrari" },
						{ name: "Tecnologia", href: "/marcas/ferrari/tecnologia" },
					],
				},
				mclaren: {
					name: "McLaren",
					href: "/marcas/mclaren",
					items: [
						{ name: "História", href: "/marcas/mclaren/historia" },
						{ name: "Modelos", href: "/marcas/mclaren/modelos" },
						{ name: "F1 Team", href: "/marcas/mclaren/f1" },
						{ name: "Tecnologia", href: "/marcas/mclaren/tecnologia" },
						{ name: "Notícias", href: "/marcas/mclaren" },
					],
				},
				"red-bull": {
					name: "Red Bull",
					href: "/marcas/red-bull",
					items: [
						{ name: "Red Bull Racing", href: "/marcas/red-bull/f1" },
						{ name: "Extreme Sports", href: "/marcas/red-bull/extreme" },
						{ name: "Atletas", href: "/marcas/red-bull/atletas" },
						{ name: "Eventos", href: "/marcas/red-bull/eventos" },
						{ name: "Notícias", href: "/marcas/red-bull" },
					],
				},
				mercedes: {
					name: "Mercedes",
					href: "/marcas/mercedes",
					items: [
						{ name: "Mercedes F1", href: "/marcas/mercedes/f1" },
						{ name: "Mercedes-AMG", href: "/marcas/mercedes/amg" },
						{ name: "História", href: "/marcas/mercedes/historia" },
						{ name: "Inovação", href: "/marcas/mercedes/inovacao" },
						{ name: "Notícias", href: "/marcas/mercedes" },
					],
				},
				lamborghini: {
					name: "Lamborghini",
					href: "/marcas/lamborghini",
					items: [
						{ name: "Supercarros", href: "/marcas/lamborghini/modelos" },
						{ name: "História", href: "/marcas/lamborghini/historia" },
						{ name: "Motorsport", href: "/marcas/lamborghini/motorsport" },
						{ name: "Super Trofeo", href: "/marcas/lamborghini/trofeo" },
						{ name: "Notícias", href: "/marcas/lamborghini" },
					],
				},
				porsche: {
					name: "Porsche",
					href: "/marcas/porsche",
					items: [
						{ name: "911", href: "/marcas/porsche/911" },
						{ name: "Motorsport", href: "/marcas/porsche/motorsport" },
						{ name: "História", href: "/marcas/porsche/historia" },
						{ name: "Tecnologia", href: "/marcas/porsche/tecnologia" },
						{ name: "Notícias", href: "/marcas/porsche" },
					],
				},
			},
		},
		preparacao: {
			name: "Preparação",
			color: "from-green-500 to-emerald-500",
			icon: "🔧",
			subcategories: {
				tuning: {
					name: "Tuning",
					href: "/tuning",
					items: [
						{ name: "Preparação de Motor", href: "/tuning/motor" },
						{ name: "Suspensão", href: "/tuning/suspensao" },
						{ name: "Aerodinâmica", href: "/tuning/aero" },
						{ name: "Visual", href: "/tuning/visual" },
						{ name: "Notícias", href: "/tuning" },
					],
				},
				motores: {
					name: "Motores",
					href: "/engines",
					items: [
						{ name: "Motores Aspirados", href: "/engines/aspirados" },
						{ name: "Turbo", href: "/engines/turbo" },
						{ name: "Híbridos", href: "/engines/hibridos" },
						{ name: "Elétricos", href: "/engines/eletricos" },
						{ name: "Notícias", href: "/engines" },
					],
				},
				performance: {
					name: "Performance",
					href: "/performance",
					items: [
						{ name: "Sistema de Freios", href: "/performance/freios" },
						{ name: "Pneus", href: "/performance/pneus" },
						{ name: "Aerodinâmica", href: "/performance/aero" },
						{ name: "Eletrônica", href: "/performance/eletronica" },
						{ name: "Setup", href: "/performance/setup" },
					],
				},
				custom: {
					name: "Custom",
					href: "/custom",
					items: [
						{ name: "Paint Jobs", href: "/custom/paint" },
						{ name: "Interior", href: "/custom/interior" },
						{ name: "Audio", href: "/custom/audio" },
						{ name: "Rodas", href: "/custom/rodas" },
						{ name: "Iluminação", href: "/custom/led" },
					],
				},
			},
		},
		tecnologia: {
			name: "Tecnologia",
			color: "from-purple-500 to-pink-500",
			icon: "⚙️",
			subcategories: {
				"motores-tech": {
					name: "Motores",
					href: "/tecnologia/motores",
					items: [
						{ name: "V8 & V10", href: "/tecnologia/motores/v8-v10" },
						{ name: "V12", href: "/tecnologia/motores/v12" },
						{ name: "Híbridos", href: "/tecnologia/motores/hibridos" },
						{ name: "Elétricos", href: "/tecnologia/motores/eletricos" },
						{ name: "Inovações", href: "/tecnologia/motores/inovacoes" },
					],
				},
				aerodinamica: {
					name: "Aerodinâmica",
					href: "/tecnologia/aerodinamica",
					items: [
						{ name: "Fórmula 1", href: "/tecnologia/aero/f1" },
						{ name: "GT & LMP", href: "/tecnologia/aero/gt" },
						{ name: "Drift", href: "/tecnologia/aero/drift" },
						{ name: "CFD", href: "/tecnologia/aero/cfd" },
						{ name: "Túnel de Vento", href: "/tecnologia/aero/tunel" },
					],
				},
				eletronica: {
					name: "Eletrônica",
					href: "/tecnologia/eletronica",
					items: [
						{ name: "ECU", href: "/tecnologia/eletronica/ecu" },
						{ name: "Telemetria", href: "/tecnologia/eletronica/telemetria" },
						{ name: "Simuladores", href: "/tecnologia/eletronica/sim" },
						{ name: "Data Logger", href: "/tecnologia/eletronica/data" },
						{ name: "Sensores", href: "/tecnologia/eletronica/sensores" },
					],
				},
				materiais: {
					name: "Materiais",
					href: "/tecnologia/materiais",
					items: [
						{ name: "Fibra de Carbono", href: "/tecnologia/materiais/carbono" },
						{ name: "Titânio", href: "/tecnologia/materiais/titanio" },
						{ name: "Cerâmica", href: "/tecnologia/materiais/ceramica" },
						{ name: "Kevlar", href: "/tecnologia/materiais/kevlar" },
						{ name: "Composites", href: "/tecnologia/materiais/composites" },
					],
				},
			},
		},
	};

	// Estado para controlar o mega menu
	const [activeMegaMenu, setActiveMegaMenu] = useState(null);
	const [activeSubcategory, setActiveSubcategory] = useState(null);
	const megaMenuTimeoutRef = useRef(null);

	const {
		user,
		profile,
		signOut,
		isAdmin,
		getDisplayName,
		loading: authLoading,
		profileLoading,
		sessionChecked,
		debugState,
	} = useAuth();

	const userMenuRef = useRef(null);

	useEffect(() => {
		const handleScroll = () => setScrollY(window.scrollY);
		window.addEventListener("scroll", handleScroll);
		return () => window.removeEventListener("scroll", handleScroll);
	}, []);

	// Limpar timeout quando componente desmonta
	useEffect(() => {
		return () => {
			if (megaMenuTimeoutRef.current) {
				clearTimeout(megaMenuTimeoutRef.current);
			}
		};
	}, []);

	useEffect(() => {
		const handleClickOutside = (event) => {
			if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
				setIsUserMenuOpen(false);
			}
		};

		const handleMegaMenuClickOutside = (event) => {
			// Fechar mega menu se clicar fora dele
			if (activeMegaMenu && !event.target.closest(".mega-menu-container")) {
				setActiveMegaMenu(null);
				setActiveSubcategory(null);
			}
		};

		document.addEventListener("mousedown", handleClickOutside);
		document.addEventListener("click", handleMegaMenuClickOutside);

		return () => {
			document.removeEventListener("mousedown", handleClickOutside);
			document.removeEventListener("click", handleMegaMenuClickOutside);
		};
	}, [activeMegaMenu]);

	useEffect(() => {
		const handleKeyDown = (e) => {
			if ((e.ctrlKey || e.metaKey) && e.key === "k") {
				e.preventDefault();
				setIsSearchOpen(true);
			}
		};

		document.addEventListener("keydown", handleKeyDown);
		return () => document.removeEventListener("keydown", handleKeyDown);
	}, []);

	// Funções para controlar o mega menu
	const handleMegaMenuEnter = (menuKey) => {
		if (megaMenuTimeoutRef.current) {
			clearTimeout(megaMenuTimeoutRef.current);
		}
		setActiveMegaMenu(menuKey);

		// Auto-selecionar a primeira subcategoria
		const firstSubcategory = Object.keys(
			megaMenuData[menuKey].subcategories
		)[0];
		setActiveSubcategory(firstSubcategory);
	};

	const handleMegaMenuLeave = () => {
		megaMenuTimeoutRef.current = setTimeout(() => {
			setActiveMegaMenu(null);
			setActiveSubcategory(null);
		}, 150);
	};

	const handleSubcategoryEnter = (subcategoryKey) => {
		setActiveSubcategory(subcategoryKey);
	};

	const secondaryNav = [
		{ name: "Sobre", href: "/about" },
		{ name: "Contato", href: "/contact" },
	];

	const handleSignOut = async () => {
		if (isLoggingOut) return;

		try {
			setIsLoggingOut(true);
			setIsUserMenuOpen(false);
			await signOut();
		} catch (error) {
			console.error("Header: Erro no logout:", error);
			setIsLoggingOut(false);
		}
	};

	// UserAvatar MELHORADO
	const UserAvatar = React.memo(() => {
		const [imageError, setImageError] = useState(false);
		const avatarUrl = profile?.avatar_url;

		useEffect(() => {
			setImageError(false);
		}, [avatarUrl]);

		if (avatarUrl && !imageError) {
			return (
				<img
					src={avatarUrl}
					alt={getDisplayName()}
					className="w-8 h-8 rounded-lg object-cover"
					onError={() => {
						console.warn("Header: Erro ao carregar avatar, usando fallback");
						setImageError(true);
					}}
				/>
			);
		}

		return (
			<div className="w-8 h-8 bg-gradient-to-r from-red-600 to-red-500 rounded-lg flex items-center justify-center">
				<User className="w-4 h-4 text-white" />
			</div>
		);
	});

	// UserMenu COM ESTADOS CORRIGIDOS
	const UserMenu = () => {
		if (!sessionChecked) {
			return (
				<div className="flex items-center space-x-2 p-2 rounded-xl bg-gray-800/50">
					<div className="w-8 h-8 bg-gray-700 rounded-lg animate-pulse"></div>
					<span className="text-gray-400 text-sm hidden md:block">
						Verificando...
					</span>
				</div>
			);
		}

		if (sessionChecked && !user) {
			return null;
		}

		if (user && (authLoading || profileLoading)) {
			return (
				<div className="flex items-center space-x-2 p-2 rounded-xl bg-gray-800/50">
					<div className="w-8 h-8 bg-gray-700 rounded-lg animate-pulse"></div>
					<span className="text-gray-400 text-sm hidden md:block">
						Carregando...
					</span>
				</div>
			);
		}

		if (!user) return null;

		return (
			<div ref={userMenuRef} className="relative navbar-user-section">
				<button
					onClick={(e) => {
						e.preventDefault();
						e.stopPropagation();
						setIsUserMenuOpen(!isUserMenuOpen);
					}}
					disabled={isLoggingOut}
					className="user-menu-button flex items-center space-x-2 p-2 rounded-xl bg-gray-800/50 hover:bg-gray-700/50 transition-all duration-300 border border-gray-600/30 cursor-pointer disabled:opacity-50"
					style={{ pointerEvents: "auto", zIndex: 10 }}
				>
					<UserAvatar />
					<span className="text-white text-sm font-medium hidden md:block">
						{isLoggingOut ? "Saindo..." : getDisplayName()}
					</span>
					<ChevronDown
						className={`w-4 h-4 text-gray-400 transition-transform duration-300 ${
							isUserMenuOpen ? "rotate-180" : ""
						}`}
					/>
				</button>

				{isUserMenuOpen && !isLoggingOut && (
					<div className="user-menu-dropdown absolute right-0 top-full mt-2 w-64 bg-gray-900/95 backdrop-blur-md rounded-2xl border border-gray-700/50 shadow-2xl z-[100]">
						<div className="p-4 border-b border-gray-700/50">
							<div className="flex items-center space-x-3">
								<div className="w-12 h-12 flex-shrink-0">
									<UserAvatar />
								</div>
								<div className="flex-1 min-w-0">
									<p className="text-white font-semibold truncate">
										{getDisplayName()}
									</p>
									<p className="text-gray-400 text-sm truncate">
										{user?.email}
									</p>
									{isAdmin && (
										<span className="inline-flex items-center space-x-1 text-xs text-orange-400 bg-orange-500/20 px-2 py-1 rounded-full mt-1">
											<Shield className="w-3 h-3" />
											<span>Admin</span>
										</span>
									)}
								</div>
							</div>
						</div>

						<div className="p-2">
							<Link
								to="/profile"
								onClick={() => setIsUserMenuOpen(false)}
								className="flex items-center space-x-3 p-3 rounded-xl hover:bg-gray-800/50 transition-colors duration-300 w-full text-left"
							>
								<User className="w-5 h-5 text-gray-400" />
								<span className="text-gray-300">Meu Perfil</span>
							</Link>

							{isAdmin && (
								<Link
									to="/admin/dashboard"
									onClick={() => setIsUserMenuOpen(false)}
									className="flex items-center space-x-3 p-3 rounded-xl hover:bg-gray-800/50 transition-colors duration-300 w-full text-left"
								>
									<Shield className="w-5 h-5 text-red-400" />
									<span className="text-gray-300">Dashboard Admin</span>
								</Link>
							)}

							<button
								onClick={handleSignOut}
								disabled={isLoggingOut}
								className="flex items-center space-x-3 p-3 rounded-xl hover:bg-red-500/20 transition-colors duration-300 w-full text-left disabled:opacity-50 disabled:cursor-not-allowed"
							>
								{isLoggingOut ? (
									<div className="w-5 h-5 border-2 border-red-400 border-t-transparent rounded-full animate-spin" />
								) : (
									<LogOut className="w-5 h-5 text-red-400" />
								)}
								<span className="text-gray-300">
									{isLoggingOut ? "Saindo..." : "Sair"}
								</span>
							</button>
						</div>
					</div>
				)}
			</div>
		);
	};

	return (
		<>
			<nav
				className={`fixed w-full z-50 transition-all duration-300 ${
					scrollY > 50
						? "bg-black/90 backdrop-blur-md border-b border-red-500/20 shadow-lg"
						: "bg-transparent"
				}`}
			>
				<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
					<div className="flex items-center justify-between h-20">
						{/* Logo */}
						<div className="flex-shrink-0">
							<Link to="/" className="flex items-center space-x-4">
								<div className="relative group">
									<div className="w-12 h-12 bg-gradient-to-r from-red-600 to-red-500 rounded-xl flex items-center justify-center shadow-lg group-hover:shadow-red-500/25 transition-all duration-300">
										<Settings className="w-7 h-7 text-white group-hover:rotate-45 transition-transform duration-300" />
									</div>
								</div>
								<div className="hidden sm:block">
									<h1 className="text-2xl font-black text-white tracking-tight">
										TORQUE FORGED
									</h1>
									<p className="text-sm text-red-400 font-medium tracking-widest">
										MOTORSPORT
									</p>
								</div>
							</Link>
						</div>

						{/* Desktop Mega Menu Navigation - CORRIGIDO */}
						<div className="hidden lg:block flex-1 max-w-4xl mx-4">
							<div className="flex items-center justify-center space-x-2">
								{Object.entries(megaMenuData).map(([menuKey, menuData]) => (
									<div
										key={menuKey}
										className="relative mega-menu-container"
										onMouseEnter={() => handleMegaMenuEnter(menuKey)}
										onMouseLeave={handleMegaMenuLeave}
									>
										<button
											className={`relative px-4 py-3 rounded-xl text-lg font-semibold transition-all duration-300 flex items-center space-x-2 ${
												activeMegaMenu === menuKey
													? "text-white bg-gradient-to-r from-red-600 to-red-500 shadow-lg"
													: "text-gray-300 hover:text-white hover:bg-gray-800/50"
											}`}
										>
											<span className="text-sm">{menuData.icon}</span>
											<span className="whitespace-nowrap">{menuData.name}</span>
											<ChevronDown
												className={`w-4 h-4 transition-transform duration-300 ${
													activeMegaMenu === menuKey ? "rotate-180" : ""
												}`}
											/>
										</button>

										{/* Mega Menu Dropdown - POSICIONAMENTO CORRIGIDO */}
										{activeMegaMenu === menuKey && (
											<div
												className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 w-screen max-w-6xl bg-black/95 backdrop-blur-md border border-gray-700/50 rounded-3xl shadow-2xl z-[60] overflow-hidden"
												style={{
													position: "absolute",
													zIndex: 60,
													left: "50%",
													transform: "translateX(-50%)",
													maxWidth: "min(90vw, 1200px)",
													width: "max-content",
													minWidth: "800px",
												}}
												onMouseEnter={() => handleMegaMenuEnter(menuKey)}
												onMouseLeave={handleMegaMenuLeave}
											>
												<div className="grid grid-cols-12 min-h-[400px]">
													{/* Left Sidebar - Subcategorias */}
													<div className="col-span-3 bg-gradient-to-br from-gray-900 to-gray-800 border-r border-gray-700/50 p-6">
														<div className="mb-6">
															<div
																className={`inline-flex items-center px-4 py-2 rounded-full bg-gradient-to-r ${menuData.color} text-white text-sm font-bold shadow-lg`}
															>
																<span className="mr-2">{menuData.icon}</span>
																<span className="whitespace-nowrap">
																	{menuData.name}
																</span>
															</div>
														</div>
														<div className="space-y-2">
															{Object.entries(menuData.subcategories).map(
																([subKey, subData]) => (
																	<div
																		key={subKey}
																		onMouseEnter={() =>
																			handleSubcategoryEnter(subKey)
																		}
																		className={`block w-full p-3 rounded-xl text-left transition-all duration-300 cursor-pointer ${
																			activeSubcategory === subKey
																				? `bg-gradient-to-r ${menuData.color} text-white shadow-lg`
																				: "text-gray-300 hover:text-white hover:bg-gray-800/50"
																		}`}
																	>
																		<div className="font-semibold whitespace-nowrap">
																			{subData.name}
																		</div>
																		<div className="text-xs opacity-75 mt-1">
																			{subData.items.length} itens
																		</div>
																	</div>
																)
															)}
														</div>
													</div>

													{/* Right Content - Items da subcategoria ativa */}
													<div className="col-span-9 p-8 bg-gradient-to-br from-gray-800 to-gray-900 overflow-y-auto max-h-[500px]">
														{activeSubcategory &&
														megaMenuData[menuKey].subcategories[
															activeSubcategory
														] ? (
															<div className="animate-in slide-in-from-right-5 duration-200">
																<div className="mb-8">
																	<h3 className="text-2xl font-black text-white mb-2">
																		{
																			megaMenuData[menuKey].subcategories[
																				activeSubcategory
																			].name
																		}
																	</h3>
																	<p className="text-gray-400">
																		Explore todo o conteúdo sobre{" "}
																		{megaMenuData[menuKey].subcategories[
																			activeSubcategory
																		].name.toLowerCase()}
																	</p>
																</div>

																<div className="grid grid-cols-2 gap-6">
																	{megaMenuData[menuKey].subcategories[
																		activeSubcategory
																	].items.map((item, index) => (
																		<Link
																			key={`${activeSubcategory}-${index}`}
																			to={item.href}
																			onClick={() => {
																				setActiveMegaMenu(null);
																				setActiveSubcategory(null);
																			}}
																			className="group flex items-center space-x-4 p-4 rounded-xl hover:bg-gray-700/50 transition-all duration-300 border border-transparent hover:border-gray-600/50"
																		>
																			<div
																				className={`w-3 h-3 rounded-full bg-gradient-to-r ${menuData.color} shadow-lg group-hover:scale-125 transition-transform duration-300`}
																			></div>
																			<div className="flex-1">
																				<h4 className="text-white font-semibold group-hover:text-gray-100 transition-colors duration-300 whitespace-nowrap">
																					{item.name}
																				</h4>
																			</div>
																			<ArrowRight className="w-4 h-4 text-gray-500 group-hover:text-white group-hover:translate-x-1 transition-all duration-300" />
																		</Link>
																	))}
																</div>

																{/* Ver todos link */}
																<div className="mt-8 pt-6 border-t border-gray-700/50">
																	<Link
																		to={
																			megaMenuData[menuKey].subcategories[
																				activeSubcategory
																			].href
																		}
																		onClick={() => {
																			setActiveMegaMenu(null);
																			setActiveSubcategory(null);
																		}}
																		className={`inline-flex items-center space-x-2 bg-gradient-to-r ${menuData.color} hover:shadow-lg hover:scale-105 text-white px-6 py-3 rounded-xl font-bold transition-all duration-300 shadow-md`}
																	>
																		<span className="whitespace-nowrap">
																			Ver tudo sobre{" "}
																			{
																				megaMenuData[menuKey].subcategories[
																					activeSubcategory
																				].name
																			}
																		</span>
																		<ArrowRight className="w-4 h-4" />
																	</Link>
																</div>
															</div>
														) : (
															<div className="text-center py-16 animate-in fade-in duration-200">
																<div
																	className={`w-20 h-20 bg-gradient-to-r ${menuData.color} rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-xl`}
																>
																	<span className="text-3xl">
																		{menuData.icon}
																	</span>
																</div>
																<h3 className="text-2xl font-bold text-white mb-4">
																	{menuData.name}
																</h3>
																<p className="text-gray-400 mb-8 max-w-md mx-auto">
																	Passe o mouse sobre uma categoria à esquerda
																	para ver o conteúdo disponível
																</p>
																<div className="flex flex-wrap gap-3 justify-center max-w-lg mx-auto">
																	{Object.entries(menuData.subcategories).map(
																		([subKey, subData]) => (
																			<button
																				key={subKey}
																				onMouseEnter={() =>
																					handleSubcategoryEnter(subKey)
																				}
																				className={`px-4 py-2 rounded-xl text-sm font-medium transition-all duration-300 bg-gradient-to-r ${menuData.color}/20 text-white hover:${menuData.color} hover:shadow-lg hover:scale-105 whitespace-nowrap`}
																			>
																				{subData.name}
																			</button>
																		)
																	)}
																</div>
															</div>
														)}
													</div>
												</div>
											</div>
										)}
									</div>
								))}
							</div>
						</div>

						{/* Right Side Actions */}
						<div className="flex items-center space-x-3">
							{/* Social Media - Hidden on mobile */}
							<div className="hidden xl:flex items-center space-x-3">
								<a
									href="https://www.youtube.com/channel/UCTk9ewLwz0tx80SeKxxPpVQ"
									target="_blank"
									rel="noopener noreferrer"
									className="text-gray-400 hover:text-red-400 transition-all duration-300 hover:scale-110"
									title="YouTube"
								>
									<Youtube className="w-5 h-5" />
								</a>
								<a
									href="https://instagram.com/torqueforgedmotorsport"
									target="_blank"
									rel="noopener noreferrer"
									className="text-gray-400 hover:text-red-400 transition-all duration-300 hover:scale-110"
									title="Instagram"
								>
									<Instagram className="w-5 h-5" />
								</a>
							</div>

							{/* Search Button */}
							<button
								onClick={() => setIsSearchOpen(true)}
								className="flex items-center space-x-2 bg-gray-800/50 hover:bg-gray-700/50 text-gray-300 hover:text-white px-3 py-2 rounded-xl text-sm transition-all duration-300 border border-gray-600/30 group"
								title="Buscar (Ctrl+K)"
							>
								<Search className="w-4 h-4" />
								<span className="hidden sm:block xl:block">Buscar</span>
							</button>

							{/* User Menu or Login */}
							{sessionChecked && !user ? (
								<Link
									to="/login"
									className="bg-gradient-to-r from-red-600 to-red-500 hover:from-red-500 hover:to-red-400 text-white px-4 py-2.5 rounded-xl text-sm font-semibold transition-all duration-300 shadow-lg hover:shadow-red-500/25 hover:scale-105"
								>
									Login
								</Link>
							) : (
								<UserMenu />
							)}

							{/* Mobile Menu Button */}
							<button
								onClick={() => setIsMenuOpen(!isMenuOpen)}
								className="lg:hidden text-gray-400 hover:text-white transition-colors duration-300 p-2"
							>
								{isMenuOpen ? (
									<X className="w-6 h-6" />
								) : (
									<Menu className="w-6 h-6" />
								)}
							</button>
						</div>
					</div>
				</div>

				{/* Mobile Menu */}
				{isMenuOpen && (
					<div className="lg:hidden bg-black/95 backdrop-blur-md border-t border-red-500/20">
						<div className="px-4 pt-4 pb-6 space-y-3 max-h-[80vh] overflow-y-auto">
							{/* Mega Menu categories for mobile */}
							{Object.entries(megaMenuData).map(([menuKey, menuData]) => (
								<div key={`mobile-${menuKey}`} className="space-y-2">
									{/* Category Header */}
									<div
										className={`flex items-center px-4 py-3 rounded-xl bg-gradient-to-r ${menuData.color} shadow-lg`}
									>
										<span className="mr-3">{menuData.icon}</span>
										<span className="text-white font-bold text-lg">
											{menuData.name}
										</span>
									</div>

									{/* Subcategories */}
									<div className="ml-4 space-y-1">
										{Object.entries(menuData.subcategories).map(
											([subKey, subData]) => (
												<div key={`mobile-sub-${subKey}`} className="space-y-1">
													<Link
														to={subData.href}
														onClick={() => setIsMenuOpen(false)}
														className="block px-4 py-2 text-gray-300 hover:text-white hover:bg-gray-800/50 rounded-xl transition-all duration-300 font-medium"
													>
														{subData.name}
													</Link>
													{/* Sub-items (optional, can be expandable) */}
													<div className="ml-4 space-y-1">
														{subData.items.slice(0, 3).map((item, index) => (
															<Link
																key={`mobile-item-${index}`}
																to={item.href}
																onClick={() => setIsMenuOpen(false)}
																className="block px-3 py-1 text-sm text-gray-400 hover:text-gray-300 transition-colors duration-300"
															>
																• {item.name}
															</Link>
														))}
														{subData.items.length > 3 && (
															<Link
																to={subData.href}
																onClick={() => setIsMenuOpen(false)}
																className="block px-3 py-1 text-sm text-red-400 hover:text-red-300 transition-colors duration-300"
															>
																+ Ver mais {subData.items.length - 3}
															</Link>
														)}
													</div>
												</div>
											)
										)}
									</div>
								</div>
							))}

							{/* Divider */}
							<div className="border-t border-gray-700/50 my-4"></div>

							{/* Secondary Navigation */}
							{secondaryNav.map((item) => (
								<Link
									key={item.name}
									to={item.href}
									onClick={() => setIsMenuOpen(false)}
									className="block px-4 py-3 rounded-xl text-base font-medium text-gray-300 hover:bg-gray-800/50 hover:text-white transition-all duration-300"
								>
									{item.name}
								</Link>
							))}

							{/* Social Media and Search */}
							<div className="flex items-center space-x-6 px-4 pt-4">
								<a
									href="https://www.youtube.com/channel/UCTk9ewLwz0tx80SeKxxPpVQ"
									target="_blank"
									rel="noopener noreferrer"
									className="text-gray-400 hover:text-red-400 transition-colors duration-300"
								>
									<Youtube className="w-6 h-6" />
								</a>
								<a
									href="https://instagram.com/torqueforgedmotorsport"
									target="_blank"
									rel="noopener noreferrer"
									className="text-gray-400 hover:text-red-400 transition-colors duration-300"
								>
									<Instagram className="w-6 h-6" />
								</a>
								<button
									onClick={() => {
										setIsMenuOpen(false);
										setIsSearchOpen(true);
									}}
									className="flex items-center space-x-2 text-gray-400 hover:text-white transition-colors duration-300"
								>
									<Search className="w-5 h-5" />
									<span>Buscar</span>
								</button>
							</div>
						</div>
					</div>
				)}
			</nav>

			{/* Search Modal */}
			<SearchModal
				isOpen={isSearchOpen}
				onClose={() => setIsSearchOpen(false)}
			/>
		</>
	);
};

export default Header;
