import React, { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import {
	Plus,
	Edit3,
	Trash2,
	Eye,
	EyeOff,
	Search,
	ChevronDown,
	ChevronRight,
	Folder,
} from "lucide-react";
import {
	useCategoriesHierarchy,
	useUpdateCategory,
	useDeleteCategory,
} from "../../hooks/usePostsQuery";
import toast from "react-hot-toast";

const CategoryManager = () => {
	const { data: categories = [], isLoading, error } = useCategoriesHierarchy();
	const updateCategoryMutation = useUpdateCategory();
	const deleteCategoryMutation = useDeleteCategory();

	const [searchTerm, setSearchTerm] = useState("");
	const [levelFilter, setLevelFilter] = useState("all");
	const [statusFilter, setStatusFilter] = useState("all");
	const [expandedCategories, setExpandedCategories] = useState(new Set());
	const [selectedCategories, setSelectedCategories] = useState(new Set());

	// Filtrar e organizar categorias
	const filteredCategories = useMemo(() => {
		let filtered = categories.filter((category) => {
			const matchesSearch =
				category.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
				category.slug.toLowerCase().includes(searchTerm.toLowerCase());
			const matchesLevel =
				levelFilter === "all" || category.level.toString() === levelFilter;
			const matchesStatus =
				statusFilter === "all" ||
				(statusFilter === "active" && category.is_active) ||
				(statusFilter === "inactive" && !category.is_active);

			return matchesSearch && matchesLevel && matchesStatus;
		});

		return filtered;
	}, [categories, searchTerm, levelFilter, statusFilter]);

	// Organizar em estrutura hierárquica
	const hierarchicalCategories = useMemo(() => {
		const categoryMap = new Map();
		const rootCategories = [];

		// Primeiro, criar map de todas as categorias
		filteredCategories.forEach((category) => {
			categoryMap.set(category.id, { ...category, children: [] });
		});

		// Depois, organizar hierarquia
		filteredCategories.forEach((category) => {
			if (category.parent_id && categoryMap.has(category.parent_id)) {
				categoryMap
					.get(category.parent_id)
					.children.push(categoryMap.get(category.id));
			} else if (!category.parent_id) {
				rootCategories.push(categoryMap.get(category.id));
			}
		});

		return rootCategories;
	}, [filteredCategories]);

	// Handlers
	const handleToggleExpand = (categoryId) => {
		const newExpanded = new Set(expandedCategories);
		if (newExpanded.has(categoryId)) {
			newExpanded.delete(categoryId);
		} else {
			newExpanded.add(categoryId);
		}
		setExpandedCategories(newExpanded);
	};

	const handleToggleActive = async (category) => {
		try {
			await updateCategoryMutation.mutateAsync({
				id: category.id,
				is_active: !category.is_active,
			});
			toast.success(
				`Categoria ${
					category.is_active ? "desativada" : "ativada"
				} com sucesso!`
			);
		} catch (error) {
			toast.error(
				`Erro ao ${category.is_active ? "desativar" : "ativar"} categoria: ${
					error.message
				}`
			);
		}
	};

	const handleDeleteCategory = async (category) => {
		if (
			!window.confirm(
				`Tem certeza que deseja deletar a categoria "${category.name}"?`
			)
		) {
			return;
		}

		try {
			await deleteCategoryMutation.mutateAsync(category.id);
			toast.success("Categoria deletada com sucesso!");
		} catch (error) {
			toast.error(`Erro ao deletar categoria: ${error.message}`);
		}
	};

	const handleBulkAction = async (action) => {
		if (selectedCategories.size === 0) {
			toast.error("Selecione pelo menos uma categoria");
			return;
		}

		const confirmMessage = `Tem certeza que deseja ${action} ${selectedCategories.size} categoria(s)?`;
		if (!window.confirm(confirmMessage)) return;

		try {
			const promises = Array.from(selectedCategories)
				.map((categoryId) => {
					const category = categories.find((c) => c.id === categoryId);
					if (!category) return null;

					switch (action) {
						case "ativar":
							return updateCategoryMutation.mutateAsync({
								id: categoryId,
								is_active: true,
							});
						case "desativar":
							return updateCategoryMutation.mutateAsync({
								id: categoryId,
								is_active: false,
							});
						case "deletar":
							return deleteCategoryMutation.mutateAsync(categoryId);
						default:
							return null;
					}
				})
				.filter(Boolean);

			await Promise.all(promises);
			setSelectedCategories(new Set());
			toast.success(
				`${selectedCategories.size} categoria(s) ${
					action === "deletar"
						? "deletada(s)"
						: action === "ativar"
						? "ativada(s)"
						: "desativada(s)"
				} com sucesso!`
			);
		} catch (error) {
			toast.error(`Erro na ação em lote: ${error.message}`);
		}
	};

	if (isLoading) {
		return (
			<div className="min-h-screen bg-black p-8">
				<div className="max-w-7xl mx-auto">
					<div className="animate-pulse">
						<div className="h-8 bg-gray-700 rounded w-64 mb-8"></div>
						<div className="space-y-4">
							{Array.from({ length: 10 }).map((_, i) => (
								<div key={i} className="h-16 bg-gray-800 rounded-xl"></div>
							))}
						</div>
					</div>
				</div>
			</div>
		);
	}

	if (error) {
		return (
			<div className="min-h-screen bg-black p-8 flex items-center justify-center">
				<div className="text-center">
					<h2 className="text-2xl font-bold text-white mb-4">
						Erro ao carregar categorias
					</h2>
					<p className="text-gray-400 mb-8">{error.message}</p>
					<button
						onClick={() => window.location.reload()}
						className="bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-xl font-semibold"
					>
						Tentar Novamente
					</button>
				</div>
			</div>
		);
	}

	return (
		<div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-black pt-20">
			<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
				{/* Header */}
				<div className="flex items-center justify-between mb-8">
					<div>
						<h1 className="text-4xl font-black text-white mb-2">
							Gerenciar Categorias
						</h1>
						<p className="text-gray-400">
							Gerencie a estrutura hierárquica de categorias do site
						</p>
					</div>
					<Link
						to="/admin/categories/new"
						className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 text-white px-6 py-3 rounded-xl font-semibold transition-all duration-300 shadow-lg hover:shadow-green-500/25 hover:scale-105 flex items-center space-x-2"
					>
						<Plus className="w-5 h-5" />
						<span>Nova Categoria</span>
					</Link>
				</div>

				{/* Filters */}
				<div className="bg-gradient-to-r from-gray-900 to-gray-800 rounded-2xl p-6 mb-8 border border-gray-700/50">
					<div className="grid grid-cols-1 md:grid-cols-4 gap-4">
						{/* Search */}
						<div className="relative">
							<Search className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
							<input
								type="text"
								placeholder="Buscar categorias..."
								value={searchTerm}
								onChange={(e) => setSearchTerm(e.target.value)}
								className="w-full pl-10 pr-4 py-3 bg-gray-800/50 border border-gray-600/50 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-red-500/50"
							/>
						</div>

						{/* Level Filter */}
						<select
							value={levelFilter}
							onChange={(e) => setLevelFilter(e.target.value)}
							className="px-4 py-3 bg-gray-800/50 border border-gray-600/50 rounded-xl text-white focus:outline-none focus:border-red-500/50"
						>
							<option value="all">Todos os níveis</option>
							<option value="1">Nível 1 (Principal)</option>
							<option value="2">Nível 2 (Sub)</option>
							<option value="3">Nível 3 (Sub-sub)</option>
						</select>

						{/* Status Filter */}
						<select
							value={statusFilter}
							onChange={(e) => setStatusFilter(e.target.value)}
							className="px-4 py-3 bg-gray-800/50 border border-gray-600/50 rounded-xl text-white focus:outline-none focus:border-red-500/50"
						>
							<option value="all">Todos os status</option>
							<option value="active">Ativas</option>
							<option value="inactive">Inativas</option>
						</select>

						{/* Bulk Actions */}
						<div className="flex space-x-2">
							<button
								onClick={() => handleBulkAction("ativar")}
								disabled={selectedCategories.size === 0}
								className="flex-1 bg-green-600/20 hover:bg-green-600/30 text-green-400 px-4 py-3 rounded-xl font-semibold transition-colors duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
							>
								Ativar
							</button>
							<button
								onClick={() => handleBulkAction("desativar")}
								disabled={selectedCategories.size === 0}
								className="flex-1 bg-yellow-600/20 hover:bg-yellow-600/30 text-yellow-400 px-4 py-3 rounded-xl font-semibold transition-colors duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
							>
								Desativar
							</button>
						</div>
					</div>

					{/* Stats */}
					<div className="flex flex-wrap gap-4 mt-4 pt-4 border-t border-gray-700/50">
						<div className="text-sm text-gray-400">
							<span className="font-semibold text-white">
								{categories.length}
							</span>{" "}
							categorias totais
						</div>
						<div className="text-sm text-gray-400">
							<span className="font-semibold text-white">
								{categories.filter((c) => c.level === 1).length}
							</span>{" "}
							principais
						</div>
						<div className="text-sm text-gray-400">
							<span className="font-semibold text-white">
								{categories.filter((c) => c.level === 2).length}
							</span>{" "}
							subcategorias
						</div>
						<div className="text-sm text-gray-400">
							<span className="font-semibold text-white">
								{categories.filter((c) => c.level === 3).length}
							</span>{" "}
							sub-subcategorias
						</div>
						<div className="text-sm text-gray-400">
							<span className="font-semibold text-white">
								{categories.filter((c) => c.is_active).length}
							</span>{" "}
							ativas
						</div>
					</div>
				</div>

				{/* Categories List */}
				<div className="bg-gradient-to-r from-gray-900 to-gray-800 rounded-2xl border border-gray-700/50 overflow-hidden">
					{hierarchicalCategories.length === 0 ? (
						<div className="p-12 text-center">
							<Folder className="w-16 h-16 text-gray-600 mx-auto mb-4" />
							<h3 className="text-xl font-bold text-white mb-2">
								Nenhuma categoria encontrada
							</h3>
							<p className="text-gray-400 mb-6">
								{searchTerm || levelFilter !== "all" || statusFilter !== "all"
									? "Tente ajustar os filtros para ver mais resultados"
									: "Comece criando sua primeira categoria"}
							</p>
							<Link
								to="/admin/categories/new"
								className="inline-flex items-center space-x-2 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 text-white px-6 py-3 rounded-xl font-semibold transition-all duration-300"
							>
								<Plus className="w-4 h-4" />
								<span>Criar Primeira Categoria</span>
							</Link>
						</div>
					) : (
						<div className="divide-y divide-gray-700/50">
							{hierarchicalCategories.map((category) => (
								<CategoryRow
									key={category.id}
									category={category}
									level={0}
									expandedCategories={expandedCategories}
									selectedCategories={selectedCategories}
									onToggleExpand={handleToggleExpand}
									onToggleSelect={(categoryId) => {
										const newSelected = new Set(selectedCategories);
										if (newSelected.has(categoryId)) {
											newSelected.delete(categoryId);
										} else {
											newSelected.add(categoryId);
										}
										setSelectedCategories(newSelected);
									}}
									onToggleActive={handleToggleActive}
									onDelete={handleDeleteCategory}
									updateMutation={updateCategoryMutation}
									deleteMutation={deleteCategoryMutation}
								/>
							))}
						</div>
					)}
				</div>
			</div>
		</div>
	);
};

// Componente para cada linha da categoria
const CategoryRow = ({
	category,
	level,
	expandedCategories,
	selectedCategories,
	onToggleExpand,
	onToggleSelect,
	onToggleActive,
	onDelete,
	updateMutation,
	deleteMutation,
}) => {
	const hasChildren = category.children && category.children.length > 0;
	const isExpanded = expandedCategories.has(category.id);
	const isSelected = selectedCategories.has(category.id);
	const indent = level * 40;

	return (
		<>
			<div className="p-4 hover:bg-gray-800/30 transition-colors duration-300">
				<div
					className="flex items-center space-x-4"
					style={{ paddingLeft: `${indent}px` }}
				>
					{/* Expand/Collapse */}
					<div className="w-6 flex justify-center">
						{hasChildren ? (
							<button
								onClick={() => onToggleExpand(category.id)}
								className="text-gray-400 hover:text-white transition-colors duration-300"
							>
								{isExpanded ? (
									<ChevronDown className="w-4 h-4" />
								) : (
									<ChevronRight className="w-4 h-4" />
								)}
							</button>
						) : (
							<div className="w-4 h-4"></div>
						)}
					</div>

					{/* Checkbox */}
					<input
						type="checkbox"
						checked={isSelected}
						onChange={() => onToggleSelect(category.id)}
						className="w-4 h-4 bg-gray-700 border-gray-600 rounded focus:ring-red-500 focus:ring-2"
					/>

					{/* Icon and Info */}
					<div className="flex items-center space-x-3 flex-1">
						<div
							className={`w-10 h-10 rounded-xl bg-gradient-to-r ${category.color} flex items-center justify-center shadow-lg`}
						>
							<span className="text-lg">{category.icon}</span>
						</div>

						<div className="flex-1">
							<div className="flex items-center space-x-3">
								<h3 className="text-white font-semibold text-lg">
									{category.name}
								</h3>
								<span
									className={`px-2 py-1 rounded-full text-xs font-bold ${
										category.level === 1
											? "bg-blue-500/20 text-blue-400"
											: category.level === 2
											? "bg-green-500/20 text-green-400"
											: "bg-purple-500/20 text-purple-400"
									}`}
								>
									Nível {category.level}
								</span>
								{!category.is_active && (
									<span className="px-2 py-1 bg-gray-500/20 text-gray-400 rounded-full text-xs font-bold">
										Inativa
									</span>
								)}
							</div>

							<div className="flex items-center space-x-4 mt-1">
								<span className="text-gray-400 text-sm">/{category.slug}</span>
								<span className="text-gray-500 text-sm">
									{category.post_count || 0} posts
								</span>
								{hasChildren && (
									<span className="text-gray-500 text-sm">
										{category.children.length} subcategorias
									</span>
								)}
							</div>
						</div>
					</div>

					{/* Actions */}
					<div className="flex items-center space-x-2">
						<button
							onClick={() => onToggleActive(category)}
							disabled={updateMutation.isLoading}
							className={`p-2 rounded-lg transition-colors duration-300 ${
								category.is_active
									? "text-green-400 hover:bg-green-500/20"
									: "text-gray-400 hover:bg-gray-500/20"
							}`}
							title={
								category.is_active ? "Desativar categoria" : "Ativar categoria"
							}
						>
							{category.is_active ? (
								<Eye className="w-4 h-4" />
							) : (
								<EyeOff className="w-4 h-4" />
							)}
						</button>

						<Link
							to={`/admin/categories/edit/${category.id}`}
							className="p-2 text-blue-400 hover:bg-blue-500/20 rounded-lg transition-colors duration-300"
							title="Editar categoria"
						>
							<Edit3 className="w-4 h-4" />
						</Link>

						<button
							onClick={() => onDelete(category)}
							disabled={deleteMutation.isLoading || hasChildren}
							className="p-2 text-red-400 hover:bg-red-500/20 rounded-lg transition-colors duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
							title={
								hasChildren
									? "Remova as subcategorias primeiro"
									: "Deletar categoria"
							}
						>
							<Trash2 className="w-4 h-4" />
						</button>
					</div>
				</div>
			</div>

			{/* Render children */}
			{hasChildren && isExpanded && (
				<>
					{category.children.map((child) => (
						<CategoryRow
							key={child.id}
							category={child}
							level={level + 1}
							expandedCategories={expandedCategories}
							selectedCategories={selectedCategories}
							onToggleExpand={onToggleExpand}
							onToggleSelect={onToggleSelect}
							onToggleActive={onToggleActive}
							onDelete={onDelete}
							updateMutation={updateMutation}
							deleteMutation={deleteMutation}
						/>
					))}
				</>
			)}
		</>
	);
};

export default CategoryManager;
