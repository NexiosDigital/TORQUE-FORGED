import React, { useState, useEffect, useRef } from "react";
import { Link, useLocation } from "react-router-dom";
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
} from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";

const Header = () => {
	const [isMenuOpen, setIsMenuOpen] = useState(false);
	const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
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

	const navigation = [
		{ name: "Home", href: "/" },
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
		console.log("Sign out button clicked");
		setIsUserMenuOpen(false);
		await signOut();
		// O redirecionamento será feito pelo AuthContext
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
						<button className="hidden md:flex items-center space-x-2 bg-gray-800/50 hover:bg-gray-700/50 text-gray-300 hover:text-white px-4 py-2 rounded-xl text-sm transition-all duration-300 border border-gray-600/30">
							<Search className="w-4 h-4" />
							<span>Buscar</span>
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

						{/* Social Media */}
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
							<button className="flex items-center space-x-2 text-gray-400 hover:text-white transition-colors duration-300">
								<Search className="w-5 h-5" />
								<span>Buscar</span>
							</button>
						</div>
					</div>
				</div>
			)}
		</nav>
	);
};

export default Header;
