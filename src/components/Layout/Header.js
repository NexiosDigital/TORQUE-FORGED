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

// Componente do Modal de Busca
const SearchModal = ({ isOpen, onClose }) => {
	const [searchTerm, setSearchTerm] = useState("");
	const [selectedIndex, setSelectedIndex] = useState(-1);
	const searchInputRef = useRef(null);
	const resultsRef = useRef(null);
	const navigate = useNavigate();
	const { prefetchPost } = usePrefetch();

	// Hook de busca com debounce
	const { data: searchResults = [], isLoading } = useSearchPosts(searchTerm, {
		enabled: searchTerm.length >= 2,
	});

	// Focus no input quando modal abre
	useEffect(() => {
		if (isOpen && searchInputRef.current) {
			setTimeout(() => {
				searchInputRef.current.focus();
			}, 100);
		}
	}, [isOpen]);

	// Reset quando modal fecha
	useEffect(() => {
		if (!isOpen) {
			setSearchTerm("");
			setSelectedIndex(-1);
		}
	}, [isOpen]);

	// Navegação por teclado
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

	// Scroll para item selecionado
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
		<div className="fixed inset-0 z-50 overflow-hidden">
			{/* Backdrop */}
			<div
				className="absolute inset-0 bg-black/70 backdrop-blur-sm transition-opacity duration-300"
				onClick={onClose}
			></div>

			{/* Modal */}
			<div className="relative flex min-h-full items-start justify-center p-4 pt-16 sm:pt-24">
				<div className="w-full max-w-2xl transform overflow-hidden rounded-3xl bg-gradient-to-br from-gray-900 to-gray-800 border border-gray-700/50 shadow-2xl transition-all duration-300">
					{/* Header */}
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

						{/* Dicas de busca */}
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

						{/* Status da busca */}
						{searchTerm.length > 0 && searchTerm.length < 2 && (
							<p className="mt-4 text-gray-400 text-sm">
								Digite pelo menos 2 caracteres para buscar
							</p>
						)}
					</div>

					{/* Resultados */}
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

								{/* Ver todos os resultados */}
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

					{/* Footer com dicas de teclado */}
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
	const location = useLocation();
	const { user, profile, signOut, isAdmin, getDisplayName } = useAuth();
	const userMenuRef = useRef(null);

	useEffect(() => {
		const handleScroll = () => setScrollY(window.scrollY);
		window.addEventListener("scroll", handleScroll);
		return () => window.removeEventListener("scroll", handleScroll);
	}, []);

	useEffect(() => {
		const handleClickOutside = (event) => {
			if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
				setIsUserMenuOpen(false);
			}
		};
		document.addEventListener("mousedown", handleClickOutside);
		return () => document.removeEventListener("mousedown", handleClickOutside);
	}, []);

	// Atalho de teclado para busca
	useEffect(() => {
		const handleKeyDown = (e) => {
			// Ctrl/Cmd + K para abrir busca
			if ((e.ctrlKey || e.metaKey) && e.key === "k") {
				e.preventDefault();
				setIsSearchOpen(true);
			}
		};

		document.addEventListener("keydown", handleKeyDown);
		return () => document.removeEventListener("keydown", handleKeyDown);
	}, []);

	const navigation = [
		{ name: "F1", href: "/f1" },
		{ name: "NASCAR", href: "/nascar" },
		{ name: "Endurance", href: "/endurance" },
		{ name: "Drift", href: "/drift" },
		{ name: "Tuning", href: "/tuning" },
		{ name: "Motores", href: "/engines" },
	];

	const secondaryNav = [
		{ name: "Sobre", href: "/about" },
		{ name: "Contato", href: "/contact" },
	];

	const handleSignOut = async () => {
		setIsUserMenuOpen(false);
		await signOut();
	};

	const UserAvatar = () => {
		if (profile?.avatar_url) {
			return (
				<img
					src={profile.avatar_url}
					alt={getDisplayName()}
					className="w-8 h-8 rounded-lg object-cover"
				/>
			);
		}

		return (
			<div className="w-8 h-8 bg-gradient-to-r from-red-600 to-red-500 rounded-lg flex items-center justify-center">
				<User className="w-4 h-4 text-white" />
			</div>
		);
	};

	const UserMenu = () => (
		<div ref={userMenuRef} className="relative">
			<button
				onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
				className="flex items-center space-x-2 p-2 rounded-xl bg-gray-800/50 hover:bg-gray-700/50 transition-all duration-300 border border-gray-600/30"
			>
				<UserAvatar />
				<span className="text-white text-sm font-medium hidden md:block">
					{getDisplayName()}
				</span>
				<ChevronDown
					className={`w-4 h-4 text-gray-400 transition-transform duration-300 ${
						isUserMenuOpen ? "rotate-180" : ""
					}`}
				/>
			</button>

			{isUserMenuOpen && (
				<div className="absolute right-0 top-full mt-2 w-64 bg-gray-900/95 backdrop-blur-md rounded-2xl border border-gray-700/50 shadow-2xl z-50">
					<div className="p-4 border-b border-gray-700/50">
						<div className="flex items-center space-x-3">
							<div className="w-12 h-12 flex-shrink-0">
								{profile?.avatar_url ? (
									<img
										src={profile.avatar_url}
										alt={getDisplayName()}
										className="w-12 h-12 rounded-xl object-cover"
									/>
								) : (
									<div className="w-12 h-12 bg-gradient-to-r from-red-600 to-red-500 rounded-xl flex items-center justify-center">
										<User className="w-6 h-6 text-white" />
									</div>
								)}
							</div>
							<div className="flex-1 min-w-0">
								<p className="text-white font-semibold truncate">
									{getDisplayName()}
								</p>
								<p className="text-gray-400 text-sm truncate">{user?.email}</p>
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
							className="flex items-center space-x-3 p-3 rounded-xl hover:bg-red-500/20 transition-colors duration-300 w-full text-left"
						>
							<LogOut className="w-5 h-5 text-red-400" />
							<span className="text-gray-300">Sair</span>
						</button>
					</div>
				</div>
			)}
		</div>
	);

	return (
		<>
			<nav
				className={`fixed w-full z-50 transition-all duration-300 ${
					scrollY > 50
						? "bg-black/90 backdrop-blur-md border-b border-red-500/20 shadow-lg"
						: "bg-transparent"
				}`}
			>
				{/* Main Navigation */}
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

						{/* Desktop Navigation */}
						<div className="hidden lg:block flex-1 max-w-4xl mx-8">
							<div className="flex items-center justify-center space-x-1">
								{navigation.map((item) => (
									<Link
										key={item.name}
										to={item.href}
										className={`relative px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-300 ${
											location.pathname === item.href
												? "text-white"
												: "text-gray-300 hover:text-white"
										}`}
									>
										{location.pathname === item.href && (
											<div className="absolute inset-0 bg-gradient-to-r from-red-600 to-red-500 rounded-xl shadow-lg"></div>
										)}
										<span className="relative z-10">{item.name}</span>
									</Link>
								))}
							</div>
						</div>

						{/* Right Side Actions */}
						<div className="flex items-center space-x-4">
							{/* Social Media - Hidden on mobile */}
							<div className="hidden md:flex items-center space-x-3">
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
								className="flex items-center space-x-2 bg-gray-800/50 hover:bg-gray-700/50 text-gray-300 hover:text-white px-4 py-2 rounded-xl text-sm transition-all duration-300 border border-gray-600/30 group"
								title="Buscar (Ctrl+K)"
							>
								<Search className="w-4 h-4" />
								<span className="hidden sm:block">Buscar</span>
							</button>

							{/* User Menu or Login */}
							{user ? (
								<UserMenu />
							) : (
								<Link
									to="/admin/login"
									className="bg-gradient-to-r from-red-600 to-red-500 hover:from-red-500 hover:to-red-400 text-white px-6 py-2.5 rounded-xl text-sm font-semibold transition-all duration-300 shadow-lg hover:shadow-red-500/25 hover:scale-105"
								>
									Login
								</Link>
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
						<div className="px-4 pt-4 pb-6 space-y-2">
							{/* Main Navigation */}
							{navigation.map((item) => (
								<Link
									key={item.name}
									to={item.href}
									onClick={() => setIsMenuOpen(false)}
									className={`block px-4 py-3 rounded-xl text-base font-medium transition-all duration-300 ${
										location.pathname === item.href
											? "bg-gradient-to-r from-red-600 to-red-500 text-white"
											: "text-gray-300 hover:bg-gray-800/50 hover:text-white"
									}`}
								>
									{item.name}
								</Link>
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
