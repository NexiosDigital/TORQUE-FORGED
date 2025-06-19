import React, { useState, useRef, useEffect } from "react";
import { Link } from "react-router-dom";
import { ChevronDown, ArrowRight } from "lucide-react";
import { useMegaMenuStructure, usePrefetch } from "../hooks/usePostsQuery";

const HierarchicalMegaMenu = () => {
	const { data: megaMenuData = {} } = useMegaMenuStructure();
	const { prefetchCategory } = usePrefetch();

	const [activeMegaMenu, setActiveMegaMenu] = useState(null);
	const [activeSubcategory, setActiveSubcategory] = useState(null);
	const megaMenuTimeoutRef = useRef(null);

	// Limpar timeout quando componente desmonta
	useEffect(() => {
		return () => {
			if (megaMenuTimeoutRef.current) {
				clearTimeout(megaMenuTimeoutRef.current);
			}
		};
	}, []);

	// Funções para controlar o mega menu
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

	if (!megaMenuData || Object.keys(megaMenuData).length === 0) {
		return (
			<div className="flex items-center justify-center space-x-4 animate-pulse">
				{Array.from({ length: 4 }).map((_, i) => (
					<div key={i} className="w-24 h-8 bg-gray-700 rounded-xl"></div>
				))}
			</div>
		);
	}

	return (
		<div className="flex items-center justify-center space-x-2">
			{Object.entries(megaMenuData).map(([menuKey, menuData]) => (
				<div
					key={menuKey}
					className="relative mega-menu-container"
					onMouseEnter={() => handleMegaMenuEnter(menuKey)}
					onMouseLeave={handleMegaMenuLeave}
				>
					{/* Botão principal da categoria */}
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

					{/* Mega Menu Dropdown */}
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
											<span className="whitespace-nowrap">{menuData.name}</span>
										</div>
									</div>

									<div className="space-y-2">
										{Object.entries(menuData.subcategories || {}).map(
											([subKey, subData]) => (
												<div
													key={subKey}
													onMouseEnter={() => handleSubcategoryEnter(subKey)}
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
											)
										)}
									</div>
								</div>

								{/* Right Content - Items da subcategoria ativa */}
								<div className="col-span-9 p-8 bg-gradient-to-br from-gray-800 to-gray-900 overflow-y-auto max-h-[500px]">
									{activeSubcategory &&
									menuData.subcategories?.[activeSubcategory] ? (
										<div className="animate-in slide-in-from-right-5 duration-200">
											<div className="mb-8">
												<h3 className="text-2xl font-black text-white mb-2">
													{menuData.subcategories[activeSubcategory].name}
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
													menuData.subcategories[activeSubcategory].items || []
												).map((item, index) => (
													<Link
														key={`${activeSubcategory}-${index}`}
														to={item.href}
														onClick={() => {
															setActiveMegaMenu(null);
															setActiveSubcategory(null);
														}}
														onMouseEnter={() => prefetchCategory(item.slug)}
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
													to={menuData.subcategories[activeSubcategory].href}
													onClick={() => {
														setActiveMegaMenu(null);
														setActiveSubcategory(null);
													}}
													className={`inline-flex items-center space-x-2 bg-gradient-to-r ${menuData.color} hover:shadow-lg hover:scale-105 text-white px-6 py-3 rounded-xl font-bold transition-all duration-300 shadow-md`}
												>
													<span className="whitespace-nowrap">
														Ver tudo sobre{" "}
														{menuData.subcategories[activeSubcategory].name}
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
												<span className="text-3xl">{menuData.icon}</span>
											</div>
											<h3 className="text-2xl font-bold text-white mb-4">
												{menuData.name}
											</h3>
											<p className="text-gray-400 mb-8 max-w-md mx-auto">
												Passe o mouse sobre uma categoria à esquerda para ver o
												conteúdo disponível
											</p>
											<div className="flex flex-wrap gap-3 justify-center max-w-lg mx-auto">
												{Object.entries(menuData.subcategories || {}).map(
													([subKey, subData]) => (
														<button
															key={subKey}
															onMouseEnter={() =>
																handleSubcategoryEnter(subKey)
															}
															className={`px-4 py-2 rounded-xl text-sm font-medium transition-all duration-300 bg-gradient-to-r ${menuData.color}/20 text-white hover:shadow-lg hover:scale-105 whitespace-nowrap`}
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
	);
};

export default HierarchicalMegaMenu;
