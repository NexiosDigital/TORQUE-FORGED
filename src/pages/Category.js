import { Suspense } from "react";
import { useParams, Link } from "react-router-dom";
import { ArrowRight, Tag } from "lucide-react";
import CategoryPage from "../components/CategoryPage";
import { useCategories } from "../hooks/usePostsQuery";
import { ErrorBoundary } from "react-error-boundary";

/**
 * Category - 100% Dinâmica do Banco
 * - SEM dados estáticos hardcoded
 * - Busca categorias do Supabase
 * - Error handling robusto
 * - Loading states modernos
 */

// Loading skeleton para categoria
const CategorySkeleton = () => (
	<div className="min-h-screen pt-20">
		{/* Hero skeleton */}
		<div className="relative py-24 bg-gradient-to-r from-gray-800 to-gray-700 animate-pulse">
			<div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
				<div className="w-48 h-8 bg-gray-600 rounded-full mx-auto mb-6"></div>
				<div className="w-96 h-16 bg-gray-600 rounded-2xl mx-auto mb-6"></div>
				<div className="w-64 h-6 bg-gray-600 rounded-full mx-auto"></div>
			</div>
		</div>

		{/* Content skeleton */}
		<div className="py-16 bg-gradient-to-b from-gray-900 to-black">
			<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
				<div className="mb-8">
					<div className="w-48 h-6 bg-gray-700 rounded-full mb-2"></div>
					<div className="w-64 h-4 bg-gray-700 rounded-full"></div>
				</div>

				<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
					{Array.from({ length: 6 }).map((_, i) => (
						<div key={i} className="animate-pulse">
							<div className="bg-gray-800 rounded-3xl overflow-hidden">
								<div className="h-56 bg-gray-700"></div>
								<div className="p-8">
									<div className="h-6 bg-gray-700 rounded-full mb-4"></div>
									<div className="h-4 bg-gray-700 rounded-full mb-2"></div>
									<div className="h-4 bg-gray-700 rounded-full w-3/4"></div>
								</div>
							</div>
						</div>
					))}
				</div>
			</div>
		</div>
	</div>
);

// Error fallback específico para categoria não encontrada
const CategoryNotFoundFallback = ({
	error,
	resetErrorBoundary,
	categorySlug,
}) => (
	<div className="min-h-screen pt-20 flex items-center justify-center">
		<div className="text-center p-8 max-w-md mx-auto">
			<div className="w-24 h-24 bg-gradient-to-r from-red-600 to-red-500 rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-2xl">
				<Tag className="w-12 h-12 text-white" />
			</div>

			<h1 className="text-4xl font-black text-white mb-4">
				Categoria não encontrada
			</h1>

			<p className="text-gray-400 mb-2">
				A categoria "{categorySlug}" não existe ou não está disponível.
			</p>

			<p className="text-gray-500 text-sm mb-8">
				{error?.message ||
					"Verifique se o link está correto ou escolha uma categoria disponível."}
			</p>

			<div className="space-y-4">
				<button
					onClick={resetErrorBoundary}
					className="w-full bg-gradient-to-r from-red-600 to-red-500 hover:from-red-500 hover:to-red-400 text-white px-8 py-4 rounded-2xl font-bold transition-all duration-300 shadow-xl hover:shadow-red-500/25 hover:scale-105"
				>
					Tentar Novamente
				</button>

				<Link
					to="/"
					className="w-full inline-flex items-center justify-center space-x-2 border-2 border-gray-600 hover:border-red-500 text-gray-300 hover:text-white px-8 py-4 rounded-2xl font-bold transition-all duration-300"
				>
					<ArrowRight className="w-4 h-4 rotate-180" />
					<span>Voltar ao início</span>
				</Link>
			</div>

			{process.env.NODE_ENV === "development" && (
				<details className="mt-8 text-left">
					<summary className="text-red-400 cursor-pointer text-sm mb-2">
						Debug Info
					</summary>
					<div className="bg-gray-900 p-4 rounded-lg text-xs text-gray-300">
						<p>
							<strong>Category Slug:</strong> {categorySlug}
						</p>
						<p>
							<strong>Error:</strong> {error?.message}
						</p>
						{error?.stack && (
							<pre className="mt-2 overflow-auto max-h-32">{error.stack}</pre>
						)}
					</div>
				</details>
			)}
		</div>
	</div>
);

// Componente principal de categoria dinâmica
const DynamicCategoryContent = () => {
	const { category: categorySlug } = useParams();
	const { data: categories = [], isLoading, error } = useCategories();

	// Loading state
	if (isLoading) {
		return <CategorySkeleton />;
	}

	// Error state
	if (error) {
		console.error("❌ Category: Erro ao carregar categorias:", error);
		throw error;
	}

	// Buscar categoria específica
	const categoryData = categories.find((cat) => cat.id === categorySlug);

	// Categoria não encontrada
	if (!categoryData) {
		console.warn(`⚠️ Category: Categoria "${categorySlug}" não encontrada`);
		const notFoundError = new Error(
			`Categoria "${categorySlug}" não encontrada`
		);
		throw notFoundError;
	}

	// Renderizar CategoryPage com dados dinâmicos
	return (
		<CategoryPage
			categoryId={categoryData.id}
			title={categoryData.name}
			description={categoryData.description}
			gradient={categoryData.color}
		/>
	);
};

// Componente principal com Error Boundary
const Category = () => {
	const { category: categorySlug } = useParams();

	return (
		<ErrorBoundary
			FallbackComponent={(props) => (
				<CategoryNotFoundFallback {...props} categorySlug={categorySlug} />
			)}
			onReset={() => {
				// Tentar recarregar ou redirecionar
				window.location.reload();
			}}
			onError={(error, errorInfo) => {
				console.error("🔴 Category Error Boundary:", error, errorInfo);
			}}
			// Reset quando a categoria mudar
			resetKeys={[categorySlug]}
		>
			<Suspense fallback={<CategorySkeleton />}>
				<DynamicCategoryContent />
			</Suspense>
		</ErrorBoundary>
	);
};

export default Category;
