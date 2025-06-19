import React from "react";
import { Link } from "react-router-dom";
import { ChevronRight, Home } from "lucide-react";
import { useCategoryBreadcrumb } from "../hooks/usePostsQuery";

const CategoryBreadcrumb = ({ categoryId, currentCategory }) => {
	const { data: breadcrumb = [], isLoading } = useCategoryBreadcrumb(
		categoryId,
		{
			enabled: !!categoryId,
		}
	);

	// Se está carregando, mostrar skeleton
	if (isLoading) {
		return (
			<nav className="flex items-center space-x-2 text-sm mb-6 animate-pulse">
				<div className="w-12 h-4 bg-gray-700 rounded"></div>
				<div className="w-4 h-4 bg-gray-700 rounded"></div>
				<div className="w-20 h-4 bg-gray-700 rounded"></div>
				<div className="w-4 h-4 bg-gray-700 rounded"></div>
				<div className="w-16 h-4 bg-gray-700 rounded"></div>
			</nav>
		);
	}

	// Se não tem breadcrumb, mostrar só Home
	if (!breadcrumb.length && !currentCategory) {
		return (
			<nav className="flex items-center space-x-2 text-sm text-gray-400 mb-6">
				<Link
					to="/"
					className="flex items-center space-x-1 hover:text-white transition-colors duration-300"
				>
					<Home className="w-4 h-4" />
					<span>Home</span>
				</Link>
			</nav>
		);
	}

	return (
		<nav className="flex items-center space-x-2 text-sm text-gray-400 mb-6">
			{/* Home sempre primeiro */}
			<Link
				to="/"
				className="flex items-center space-x-1 hover:text-white transition-colors duration-300"
			>
				<Home className="w-4 h-4" />
				<span>Home</span>
			</Link>

			{/* Breadcrumb hierárquico */}
			{breadcrumb.map((item, index) => {
				const isLast = index === breadcrumb.length - 1;

				return (
					<React.Fragment key={item.id}>
						<ChevronRight className="w-4 h-4 text-gray-600" />
						{isLast ? (
							<span className="text-white font-semibold">{item.name}</span>
						) : (
							<Link
								to={`/${item.slug}`}
								className="hover:text-white transition-colors duration-300"
							>
								{item.name}
							</Link>
						)}
					</React.Fragment>
				);
			})}

			{/* Categoria atual se não estiver no breadcrumb */}
			{currentCategory &&
				!breadcrumb.find((item) => item.id === currentCategory.id) && (
					<>
						<ChevronRight className="w-4 h-4 text-gray-600" />
						<span className="text-white font-semibold">
							{currentCategory.name}
						</span>
					</>
				)}
		</nav>
	);
};

export default CategoryBreadcrumb;
