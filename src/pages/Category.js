import React from "react";
import { useParams } from "react-router-dom";
import CategoryPage from "../components/CategoryPage";
import { categories } from "../data/posts";

const Category = () => {
	const { category } = useParams();
	const categoryData = categories.find((cat) => cat.id === category);

	if (!categoryData) {
		return (
			<div className="min-h-screen pt-20 flex items-center justify-center">
				<div className="text-center">
					<h1 className="text-4xl font-bold text-white mb-4">
						Categoria não encontrada
					</h1>
					<Link to="/" className="text-red-400 hover:text-red-300">
						Voltar para o início
					</Link>
				</div>
			</div>
		);
	}

	return (
		<CategoryPage
			categoryId={categoryData.id}
			title={categoryData.name}
			description={categoryData.description}
			gradient={categoryData.color}
		/>
	);
};

export default Category;
