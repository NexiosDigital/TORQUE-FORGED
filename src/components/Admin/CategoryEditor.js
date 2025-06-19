import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import {
	Save,
	ArrowLeft,
	Eye,
	EyeOff,
	Hash,
	Palette,
	Folder,
	Type,
} from "lucide-react";
import {
	useCategoriesHierarchy,
	useCategoriesByLevel,
	useCreateCategory,
	useUpdateCategory,
} from "../../hooks/usePostsQuery";
import toast from "react-hot-toast";

const CategoryEditor = () => {
	const navigate = useNavigate();
	const { id } = useParams();
	const isEditing = !!id;

	const { data: allCategories = [] } = useCategoriesHierarchy();
	const createCategoryMutation = useCreateCategory();
	const updateCategoryMutation = useUpdateCategory();

	const [level, setLevel] = useState(1);
	const [parentId, setParentId] = useState("");

	const { data: parentOptions = [] } = useCategoriesByLevel(level - 1, null, {
		enabled: level > 1,
	});

	const {
		register,
		handleSubmit,
		setValue,
		watch,
		formState: { errors },
	} = useForm({
		defaultValues: {
			name: "",
			description: "",
			slug: "",
			color: "from-gray-500 to-gray-400",
			icon: "📁",
			is_active: true,
			meta_title: "",
			meta_description: "",
			sort_order: 0,
		},
	});

	const watchName = watch("name");
	const watchSlug = watch("slug");
	const watchIsActive = watch("is_active");
	const watchColor = watch("color");
	const watchIcon = watch("icon");

	// Carregar dados para edição
	useEffect(() => {
		if (isEditing && allCategories.length > 0) {
			const category = allCategories.find((c) => c.id === id);
			if (category) {
				setValue("name", category.name);
				setValue("description", category.description || "");
				setValue("slug", category.slug);
				setValue("color", category.color || "from-gray-500 to-gray-400");
				setValue("icon", category.icon || "📁");
				setValue("is_active", category.is_active);
				setValue("meta_title", category.meta_title || "");
				setValue("meta_description", category.meta_description || "");
				setValue("sort_order", category.sort_order || 0);
				setLevel(category.level);
				setParentId(category.parent_id || "");
			}
		}
	}, [isEditing, id, allCategories, setValue]);

	// Gerar slug automaticamente
	useEffect(() => {
		if (watchName && !isEditing) {
			const slug = watchName
				.toLowerCase()
				.normalize("NFD")
				.replace(/[\u0300-\u036f]/g, "")
				.replace(/[^a-z0-9\s-]/g, "")
				.replace(/\s+/g, "-")
				.replace(/-+/g, "-")
				.trim();
			setValue("slug", slug);
		}
	}, [watchName, setValue, isEditing]);

	// Opções de cor pré-definidas
	const colorOptions = [
		{ name: "Vermelho", value: "from-red-500 to-orange-500" },
		{ name: "Azul", value: "from-blue-500 to-cyan-500" },
		{ name: "Verde", value: "from-green-500 to-emerald-500" },
		{ name: "Roxo", value: "from-purple-500 to-pink-500" },
		{ name: "Amarelo", value: "from-yellow-500 to-orange-500" },
		{ name: "Índigo", value: "from-indigo-500 to-purple-500" },
		{ name: "Cinza", value: "from-gray-500 to-gray-400" },
		{ name: "Vermelho Escuro", value: "from-red-700 to-red-600" },
		{ name: "Azul Escuro", value: "from-blue-700 to-blue-600" },
		{ name: "Verde Escuro", value: "from-green-700 to-green-600" },
	];

	// Opções de ícones
	const iconOptions = [
		"📁",
		"🏁",
		"🏎️",
		"🔧",
		"⚙️",
		"🚗",
		"🏆",
		"🎯",
		"💨",
		"⚡",
		"🔥",
		"💡",
		"📊",
		"📈",
		"🎨",
		"🔬",
		"🧪",
		"⭐",
		"💎",
		"🚀",
		"🎪",
		"🎮",
		"📱",
		"💻",
		"🖥️",
		"📡",
		"🛑",
		"⚫",
		"🔵",
		"🟡",
	];

	const onSubmit = async (data) => {
		try {
			const categoryData = {
				...data,
				level,
				parent_id: level === 1 ? null : parentId || null,
			};

			if (isEditing) {
				await updateCategoryMutation.mutateAsync({
					id,
					...categoryData,
				});
				toast.success("Categoria atualizada com sucesso!");
			} else {
				await createCategoryMutation.mutateAsync(categoryData);
				toast.success("Categoria criada com sucesso!");
			}

			navigate("/admin/categories");
		} catch (error) {
			console.error("Erro ao salvar categoria:", error);
			toast.error(
				`Erro ao ${isEditing ? "atualizar" : "criar"} categoria: ${
					error.message
				}`
			);
		}
	};

	const handleGoBack = () => {
		navigate("/admin/categories");
	};

	return (
		<div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-black p-8">
			<div className="max-w-4xl mx-auto">
				{/* Header */}
				<div className="flex items-center space-x-4 mb-8">
					<button
						onClick={handleGoBack}
						className="p-3 bg-gray-800 hover:bg-gray-700 rounded-xl transition-colors duration-300"
					>
						<ArrowLeft className="w-5 h-5 text-white" />
					</button>
					<div>
						<h1 className="text-3xl font-black text-white">
							{isEditing ? "Editar Categoria" : "Nova Categoria"}
						</h1>
						<p className="text-gray-400">
							{isEditing
								? "Modifique as informações da categoria"
								: "Crie uma nova categoria para organizar o conteúdo"}
						</p>
					</div>
				</div>

				<form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
					<div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
						{/* Main Content */}
						<div className="lg:col-span-2 space-y-6">
							{/* Basic Info */}
							<div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl p-6 border border-gray-700/50">
								<h2 className="text-xl font-bold text-white mb-6 flex items-center space-x-2">
									<Type className="w-5 h-5" />
									<span>Informações Básicas</span>
								</h2>

								<div className="space-y-4">
									{/* Name */}
									<div>
										<label className="block text-white font-semibold mb-2">
											Nome *
										</label>
										<input
											{...register("name", { required: "Nome é obrigatório" })}
											className="w-full px-4 py-3 bg-gray-800/50 border border-gray-600/50 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-red-500/50"
											placeholder="Digite o nome da categoria..."
										/>
										{errors.name && (
											<p className="text-red-400 text-sm mt-1">
												{errors.name.message}
											</p>
										)}
									</div>

									{/* Slug */}
									<div>
										<label className="block text-white font-semibold mb-2">
											Slug (URL) *
										</label>
										<div className="relative">
											<Hash className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
											<input
												{...register("slug", {
													required: "Slug é obrigatório",
												})}
												className="w-full pl-10 pr-4 py-3 bg-gray-800/50 border border-gray-600/50 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-red-500/50"
												placeholder="url-amigavel-da-categoria"
											/>
										</div>
										{errors.slug && (
											<p className="text-red-400 text-sm mt-1">
												{errors.slug.message}
											</p>
										)}
									</div>

									{/* Description */}
									<div>
										<label className="block text-white font-semibold mb-2">
											Descrição
										</label>
										<textarea
											{...register("description")}
											rows={3}
											className="w-full px-4 py-3 bg-gray-800/50 border border-gray-600/50 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-red-500/50 resize-none"
											placeholder="Descreva do que se trata esta categoria..."
										/>
									</div>
								</div>
							</div>

							{/* Hierarchy */}
							<div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl p-6 border border-gray-700/50">
								<h2 className="text-xl font-bold text-white mb-6 flex items-center space-x-2">
									<Folder className="w-5 h-5" />
									<span>Hierarquia</span>
								</h2>

								<div className="space-y-4">
									{/* Level */}
									<div>
										<label className="block text-white font-semibold mb-2">
											Nível Hierárquico
										</label>
										<select
											value={level}
											onChange={(e) => {
												setLevel(parseInt(e.target.value));
												setParentId("");
											}}
											disabled={isEditing} // Não permitir mudança de nível ao editar
											className="w-full px-4 py-3 bg-gray-800/50 border border-gray-600/50 rounded-xl text-white focus:outline-none focus:border-red-500/50 disabled:opacity-50"
										>
											<option value={1}>Nível 1 - Categoria Principal</option>
											<option value={2}>Nível 2 - Subcategoria</option>
											<option value={3}>Nível 3 - Sub-subcategoria</option>
										</select>
										{isEditing && (
											<p className="text-yellow-400 text-sm mt-1">
												O nível hierárquico não pode ser alterado durante a
												edição
											</p>
										)}
									</div>

									{/* Parent Category */}
									{level > 1 && (
										<div>
											<label className="block text-white font-semibold mb-2">
												Categoria Pai
											</label>
											<select
												value={parentId}
												onChange={(e) => setParentId(e.target.value)}
												className="w-full px-4 py-3 bg-gray-800/50 border border-gray-600/50 rounded-xl text-white focus:outline-none focus:border-red-500/50"
											>
												<option value="">Selecione a categoria pai</option>
												{parentOptions.map((parent) => (
													<option key={parent.id} value={parent.id}>
														{parent.name}
													</option>
												))}
											</select>
										</div>
									)}
								</div>
							</div>

							{/* SEO */}
							<div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl p-6 border border-gray-700/50">
								<h2 className="text-xl font-bold text-white mb-6">
									SEO & Meta Tags
								</h2>

								<div className="space-y-4">
									<div>
										<label className="block text-white font-semibold mb-2">
											Meta Título
										</label>
										<input
											{...register("meta_title")}
											className="w-full px-4 py-3 bg-gray-800/50 border border-gray-600/50 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-red-500/50"
											placeholder="Título para SEO (deixe vazio para usar o nome)"
										/>
									</div>

									<div>
										<label className="block text-white font-semibold mb-2">
											Meta Descrição
										</label>
										<textarea
											{...register("meta_description")}
											rows={2}
											className="w-full px-4 py-3 bg-gray-800/50 border border-gray-600/50 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-red-500/50 resize-none"
											placeholder="Descrição para mecanismos de busca"
										/>
									</div>
								</div>
							</div>
						</div>

						{/* Sidebar */}
						<div className="lg:col-span-1 space-y-6">
							{/* Preview */}
							<div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl p-6 border border-gray-700/50">
								<h3 className="text-lg font-bold text-white mb-4">Preview</h3>

								<div
									className={`bg-gradient-to-r ${watchColor} rounded-xl p-4 mb-4`}
								>
									<div className="flex items-center space-x-3">
										<span className="text-2xl">{watchIcon}</span>
										<div>
											<h4 className="text-white font-bold">
												{watchName || "Nome da Categoria"}
											</h4>
											<p className="text-white/80 text-sm">
												/{watchSlug || "slug-da-categoria"}
											</p>
										</div>
									</div>
								</div>

								<div className="flex items-center space-x-2 text-sm">
									{watchIsActive ? (
										<>
											<Eye className="w-4 h-4 text-green-400" />
											<span className="text-green-400">Ativa</span>
										</>
									) : (
										<>
											<EyeOff className="w-4 h-4 text-gray-400" />
											<span className="text-gray-400">Inativa</span>
										</>
									)}
								</div>
							</div>

							{/* Appearance */}
							<div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl p-6 border border-gray-700/50">
								<h3 className="text-lg font-bold text-white mb-4 flex items-center space-x-2">
									<Palette className="w-5 h-5" />
									<span>Aparência</span>
								</h3>

								{/* Color */}
								<div className="mb-6">
									<label className="block text-white font-semibold mb-3">
										Cor do Gradiente
									</label>
									<div className="grid grid-cols-2 gap-2">
										{colorOptions.map((color) => (
											<button
												key={color.value}
												type="button"
												onClick={() => setValue("color", color.value)}
												className={`p-3 rounded-xl bg-gradient-to-r ${
													color.value
												} transition-all duration-300 ${
													watchColor === color.value
														? "ring-2 ring-white ring-offset-2 ring-offset-gray-800"
														: "hover:scale-105"
												}`}
												title={color.name}
											>
												<div className="h-4"></div>
											</button>
										))}
									</div>
								</div>

								{/* Icon */}
								<div>
									<label className="block text-white font-semibold mb-3">
										Ícone
									</label>
									<div className="grid grid-cols-5 gap-2 mb-4">
										{iconOptions.map((icon) => (
											<button
												key={icon}
												type="button"
												onClick={() => setValue("icon", icon)}
												className={`p-2 rounded-lg text-xl transition-all duration-300 ${
													watchIcon === icon
														? "bg-red-600 scale-110"
														: "bg-gray-700 hover:bg-gray-600"
												}`}
											>
												{icon}
											</button>
										))}
									</div>
									<input
										{...register("icon")}
										className="w-full px-3 py-2 bg-gray-800/50 border border-gray-600/50 rounded-lg text-white text-center text-xl focus:outline-none focus:border-red-500/50"
										placeholder="🔧"
									/>
								</div>
							</div>

							{/* Settings */}
							<div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl p-6 border border-gray-700/50">
								<h3 className="text-lg font-bold text-white mb-4">
									Configurações
								</h3>

								<div className="space-y-4">
									<label className="flex items-center space-x-3">
										<input
											type="checkbox"
											{...register("is_active")}
											className="w-5 h-5 bg-gray-700 border-gray-600 rounded focus:ring-red-500 focus:ring-2"
										/>
										<span className="text-white font-medium">
											Categoria ativa
										</span>
									</label>

									<div>
										<label className="block text-white font-semibold mb-2">
											Ordem de Exibição
										</label>
										<input
											type="number"
											{...register("sort_order", { valueAsNumber: true })}
											className="w-full px-3 py-2 bg-gray-800/50 border border-gray-600/50 rounded-lg text-white focus:outline-none focus:border-red-500/50"
											placeholder="0"
										/>
										<p className="text-gray-400 text-sm mt-1">
											Menor número = maior prioridade
										</p>
									</div>
								</div>
							</div>

							{/* Save Button */}
							<button
								type="submit"
								disabled={
									createCategoryMutation.isLoading ||
									updateCategoryMutation.isLoading
								}
								className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 text-white py-4 rounded-xl font-semibold text-lg transition-all duration-300 shadow-lg hover:shadow-green-500/25 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center justify-center space-x-3"
							>
								{createCategoryMutation.isLoading ||
								updateCategoryMutation.isLoading ? (
									<>
										<div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
										<span>Salvando...</span>
									</>
								) : (
									<>
										<Save className="w-5 h-5" />
										<span>{isEditing ? "Atualizar" : "Criar"} Categoria</span>
									</>
								)}
							</button>
						</div>
					</div>
				</form>
			</div>
		</div>
	);
};

export default CategoryEditor;
