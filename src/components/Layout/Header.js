import React, { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { Menu, X, Youtube, Instagram, Search, Settings } from "lucide-react";

const Header = () => {
	const [isMenuOpen, setIsMenuOpen] = useState(false);
	const [scrollY, setScrollY] = useState(0);
	const location = useLocation();

	useEffect(() => {
		const handleScroll = () => setScrollY(window.scrollY);
		window.addEventListener("scroll", handleScroll);
		return () => window.removeEventListener("scroll", handleScroll);
	}, []);

	const navigation = [
		{ name: "Home", href: "/" },
		{ name: "Fórmula 1", href: "/f1" },
		{ name: "NASCAR", href: "/nascar" },
		{ name: "Endurance", href: "/endurance" },
		{ name: "Formula Drift", href: "/drift" },
		{ name: "Tuning & Custom", href: "/tuning" },
		{ name: "Motores", href: "/engines" },
		{ name: "Sobre", href: "/about" },
		{ name: "Contato", href: "/contact" },
	];

	return (
		<nav
			className={`fixed w-full z-50 transition-all duration-300 ${
				scrollY > 50
					? "bg-black/90 backdrop-blur-md border-b border-red-500/20"
					: "bg-transparent"
			}`}
		>
			<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
				<div className="flex items-center justify-between h-20">
					<div className="flex items-center">
						<div className="flex-shrink-0">
							<Link to="/" className="flex items-center space-x-4">
								<div className="relative group">
									<div className="w-12 h-12 bg-gradient-to-r from-red-600 to-red-500 rounded-xl flex items-center justify-center shadow-lg group-hover:shadow-red-500/25 transition-all duration-300">
										<Settings className="w-7 h-7 text-white group-hover:rotate-45 transition-transform duration-300" />
									</div>
								</div>
								<div>
									<h1 className="text-2xl font-black text-white tracking-tight">
										TORQUE FORGED
									</h1>
									<p className="text-sm text-red-400 font-medium tracking-widest">
										MOTORSPORT
									</p>
								</div>
							</Link>
						</div>
					</div>

					<div className="hidden md:block">
						<div className="ml-10 flex items-baseline space-x-1">
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

					<div className="hidden md:flex items-center space-x-6">
						<a
							href="#"
							className="text-gray-400 hover:text-red-400 transition-all duration-300 hover:scale-110"
						>
							<Youtube className="w-6 h-6" />
						</a>
						<a
							href="#"
							className="text-gray-400 hover:text-red-400 transition-all duration-300 hover:scale-110"
						>
							<Instagram className="w-6 h-6" />
						</a>
						<button className="bg-gradient-to-r from-red-600 to-red-500 hover:from-red-500 hover:to-red-400 text-white px-6 py-2.5 rounded-xl text-sm font-semibold transition-all duration-300 shadow-lg hover:shadow-red-500/25 hover:scale-105">
							<Search className="w-4 h-4" />
						</button>
					</div>

					<div className="md:hidden">
						<button
							onClick={() => setIsMenuOpen(!isMenuOpen)}
							className="text-gray-400 hover:text-white transition-colors duration-300"
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

			{isMenuOpen && (
				<div className="md:hidden">
					<div className="px-2 pt-2 pb-3 space-y-1 sm:px-3 bg-black/95 backdrop-blur-md border-t border-red-500/20">
						{navigation.map((item) => (
							<Link
								key={item.name}
								to={item.href}
								onClick={() => setIsMenuOpen(false)}
								className={`block px-3 py-2 rounded-md text-base font-medium w-full text-left transition-all duration-300 ${
									location.pathname === item.href
										? "bg-gradient-to-r from-red-600 to-red-500 text-white"
										: "text-gray-300 hover:bg-gray-800/50 hover:text-white"
								}`}
							>
								{item.name}
							</Link>
						))}
					</div>
				</div>
			)}
		</nav>
	);
};

export default Header;
