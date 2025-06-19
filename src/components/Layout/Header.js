import React, { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
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
} from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";
import { useMegaMenuStructure } from "../../hooks/usePostsQuery";

const Header = () => {
	const [isMenuOpen, setIsMenuOpen] = useState(false);
	const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
	const [setIsSearchOpen] = useState(false);
	const [scrollY, setScrollY] = useState(0);
	const [isLoggingOut, setIsLoggingOut] = useState(false);

	// Usar nova estrutura hierárquica do banco
	const { data: megaMenuData = {}, isLoading: megaMenuLoading } =
		useMegaMenuStructure();

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

	// Funções para controlar o mega menu hierárquico
	const handleMegaMenuEnter = (menuKey) => {
		if (megaMenuTimeoutRef.current) {
			clearTimeout(megaMenuTimeoutRef.current);
		}
		setActiveMegaMenu(menuKey);

		// Auto-selecionar a primeira subcategoria
		const menuData = megaMenuData[menuKey];
		if (menuData && menuData.subcategories) {
			const firstSubcategory = Object.keys(menuData.subcategories)[0];
			setActiveSubcategory(firstSubcategory);
		}
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

	// UserAvatar component (mantido igual)
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

	// UserMenu component (mantido igual)
	const UserMenu = () => {
		if (!sessionChecked) {
			return (
				<div className="flex items-center space-x-4 p-2 rounded-xl bg-gray-800/50">
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
				<div className="flex items-center space-x-4 p-2 rounded-xl bg-gray-800/50">
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
					className="user-menu-button flex items-center space-x-4 p-2 rounded-xl bg-gray-800/50 hover:bg-gray-700/50 transition-all duration-300 border border-gray-600/30 cursor-pointer disabled:opacity-50"
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
								<>
									<Link
										to="/admin/dashboard"
										onClick={() => setIsUserMenuOpen(false)}
										className="flex items-center space-x-3 p-3 rounded-xl hover:bg-gray-800/50 transition-colors duration-300 w-full text-left"
									>
										<Shield className="w-5 h-5 text-red-400" />
										<span className="text-gray-300">Dashboard Admin</span>
									</Link>

									<Link
										to="/admin/categories"
										onClick={() => setIsUserMenuOpen(false)}
										className="flex items-center space-x-3 p-3 rounded-xl hover:bg-gray-800/50 transition-colors duration-300 w-full text-left"
									>
										<Settings className="w-5 h-5 text-blue-400" />
										<span className="text-gray-300">Gerenciar Categorias</span>
									</Link>
								</>
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

						{/* Desktop Mega Menu Navigation - NOVO SISTEMA HIERÁRQUICO */}
						<div className="hidden lg:block flex-1 max-w-4xl mx-4">
							{megaMenuLoading ? (
								<div className="flex items-center justify-center space-x-4 animate-pulse">
									{Array.from({ length: 4 }).map((_, i) => (
										<div
											key={i}
											className="w-24 h-8 bg-gray-700 rounded-xl"
										></div>
									))}
								</div>
							) : (
								<div className="flex items-center justify-center 4">
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
												<span className="whitespace-nowrap">
													{menuData.name}
												</span>
												<ChevronDown
													className={`w-4 h-4 transition-transform duration-300 ${
														activeMegaMenu === menuKey ? "rotate-180" : ""
													}`}
												/>
											</button>

											{/* Mega Menu Dropdown - ESTRUTURA HIERÁRQUICA */}
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
																{Object.entries(
																	menuData.subcategories || {}
																).map(([subKey, subData]) => (
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
																			{subData.items?.length || 0} itens
																		</div>
																	</div>
																))}
															</div>
														</div>

														{/* Right Content - Items da subcategoria ativa */}
														<div className="col-span-9 p-8 bg-gradient-to-br from-gray-800 to-gray-900 overflow-y-auto max-h-[500px]">
															{activeSubcategory &&
															menuData.subcategories?.[activeSubcategory] ? (
																<div className="animate-in slide-in-from-right-5 duration-200">
																	<div className="mb-8">
																		<h3 className="text-2xl font-black text-white mb-2">
																			{
																				menuData.subcategories[
																					activeSubcategory
																				].name
																			}
																		</h3>
																		<p className="text-gray-400">
																			Explore todo o conteúdo sobre{" "}
																			{menuData.subcategories[
																				activeSubcategory
																			].name.toLowerCase()}
																		</p>
																	</div>

																	<div className="grid grid-cols-2 gap-6">
																		{(
																			menuData.subcategories[activeSubcategory]
																				.items || []
																		).map((item, index) => (
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
																				menuData.subcategories[
																					activeSubcategory
																				].href
																			}
																			onClick={() => {
																				setActiveMegaMenu(null);
																				setActiveSubcategory(null);
																			}}
																			className={`inline-flex items-center space-x-4 bg-gradient-to-r ${menuData.color} hover:shadow-lg hover:scale-105 text-white px-6 py-3 rounded-xl font-bold transition-all duration-300 shadow-md`}
																		>
																			<span className="whitespace-nowrap">
																				Ver tudo sobre{" "}
																				{
																					menuData.subcategories[
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
																		{Object.entries(
																			menuData.subcategories || {}
																		).map(([subKey, subData]) => (
																			<button
																				key={subKey}
																				onMouseEnter={() =>
																					handleSubcategoryEnter(subKey)
																				}
																				className={`px-4 py-2 rounded-xl text-sm font-medium transition-all duration-300 bg-gradient-to-r ${menuData.color}/20 text-white hover:shadow-lg hover:scale-105 whitespace-nowrap`}
																			>
																				{subData.name}
																			</button>
																		))}
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
							)}
						</div>

						{/* Right Side Actions */}
						<div className="flex items-center space-x-3">
							{/* Social Media */}
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

				{/* Mobile Menu - ATUALIZADO PARA HIERARQUIA */}
				{isMenuOpen && (
					<div className="lg:hidden bg-black/95 backdrop-blur-md border-t border-red-500/20">
						<div className="px-4 pt-4 pb-6 space-y-3 max-h-[80vh] overflow-y-auto">
							{/* Mega Menu categories for mobile */}
							{Object.entries(megaMenuData).map(([menuKey, menuData]) => (
								<MobileCategorySection
									key={`mobile-${menuKey}`}
									menuKey={menuKey}
									menuData={menuData}
									onLinkClick={() => setIsMenuOpen(false)}
								/>
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
									className="flex items-center space-x-4 text-gray-400 hover:text-white transition-colors duration-300"
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
		</>
	);
};

// Componente para seção de categoria mobile
const MobileCategorySection = ({ menuKey, menuData, onLinkClick }) => {
	const [isExpanded, setIsExpanded] = useState(false);

	return (
		<div className="space-y-2">
			{/* Category Header */}
			<button
				onClick={() => setIsExpanded(!isExpanded)}
				className={`w-full flex items-center justify-between px-4 py-3 rounded-xl bg-gradient-to-r ${menuData.color} shadow-lg`}
			>
				<div className="flex items-center space-x-3">
					<span>{menuData.icon}</span>
					<span className="text-white font-bold text-lg">{menuData.name}</span>
				</div>
				<ChevronDown
					className={`w-5 h-5 text-white transition-transform duration-300 ${
						isExpanded ? "rotate-180" : ""
					}`}
				/>
			</button>

			{/* Subcategories */}
			{isExpanded && (
				<div className="ml-4 space-y-1">
					{Object.entries(menuData.subcategories || {}).map(
						([subKey, subData]) => (
							<MobileSubcategorySection
								key={`mobile-sub-${subKey}`}
								subKey={subKey}
								subData={subData}
								parentColor={menuData.color}
								onLinkClick={onLinkClick}
							/>
						)
					)}
				</div>
			)}
		</div>
	);
};

// Componente para subcategoria mobile
const MobileSubcategorySection = ({
	subKey,
	subData,
	parentColor,
	onLinkClick,
}) => {
	const [isExpanded, setIsExpanded] = useState(false);

	return (
		<div className="space-y-1">
			<div className="flex items-center">
				<Link
					to={subData.href}
					onClick={onLinkClick}
					className="flex-1 px-4 py-2 text-gray-300 hover:text-white hover:bg-gray-800/50 rounded-xl transition-all duration-300 font-medium"
				>
					{subData.name}
				</Link>
				{subData.items && subData.items.length > 0 && (
					<button
						onClick={() => setIsExpanded(!isExpanded)}
						className="p-2 text-gray-400 hover:text-white"
					>
						<ChevronDown
							className={`w-4 h-4 transition-transform duration-300 ${
								isExpanded ? "rotate-180" : ""
							}`}
						/>
					</button>
				)}
			</div>

			{/* Sub-items */}
			{isExpanded && subData.items && (
				<div className="ml-4 space-y-1">
					{subData.items.map((item, index) => (
						<Link
							key={`mobile-item-${index}`}
							to={item.href}
							onClick={onLinkClick}
							className="block px-3 py-1 text-sm text-gray-400 hover:text-gray-300 transition-colors duration-300"
						>
							• {item.name}
						</Link>
					))}
				</div>
			)}
		</div>
	);
};

export default Header;
