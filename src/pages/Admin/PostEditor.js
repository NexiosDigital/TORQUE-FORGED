import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import { Save, ArrowLeft, Eye, EyeOff, TrendingUp } from "lucide-react";
import ReactQuill from "react-quill";
import "react-quill/dist/quill.snow.css";
import {
	useCreatePost,
	useUpdatePost,
	usePostByIdAdmin, // Hook admin para buscar post incluindo rascunhos
	useCategories,
} from "../../hooks/usePostsQuery";
import toast from "react-hot-toast";

/**
 * PostEditor Corrigido - Usando hooks administrativos
 * - usePostByIdAdmin para edição (inclui rascunhos)
 * - Separado da visualização pública
 * - Cache específico para admin
 */

const PostEditor = () => {
	const navigate = useNavigate();
	const { id } = useParams();
	const isEditing = !!id;

	const createPostMutation = useCreatePost();
	const updatePostMutation = useUpdatePost();

	// USANDO HOOK ADMIN para buscar post (inclui rascunhos)
	const { data: existingPost, isLoading: loadingPost } = usePostByIdAdmin(id, {
		enabled: isEditing,
	});

	// Hook público para categorias
	const { data: categories = [] } = useCategories();

	const {
		register,
		handleSubmit,
		setValue,
		watch,
		formState: { errors },
	} = useForm();

	const [content, setContent] = useState("");
	const [loading, setLoading] = useState(false);

	const watchTitle = watch("title");
	const watchPublished = watch("published");
	const watchTrending = watch("trending");

	// Carregar post para edição
	useEffect(() => {
		if (isEditing && existingPost) {
			setValue("title", existingPost.title);
			setValue("slug", existingPost.slug);
			setValue("category", existingPost.category);
			setValue("image_url", existingPost.image_url);
			setValue("excerpt", existingPost.excerpt);
			setValue("author", existingPost.author);
			setValue("read_time", existingPost.read_time);
			setValue("published", existingPost.published);
			setValue("trending", existingPost.trending);
			setValue("tags", existingPost.tags?.join(", ") || "");
			setContent(existingPost.content);
		}
	}, [existingPost, isEditing, setValue]);

	// Gerar slug automaticamente (otimizado)
	useEffect(() => {
		if (watchTitle && !isEditing) {
			const slug = watchTitle
				.toLowerCase()
				.normalize("NFD")
				.replace(/[\u0300-\u036f]/g, "")
				.replace(/[^a-z0-9\s-]/g, "")
				.replace(/\s+/g, "-")
				.replace(/-+/g, "-")
				.trim();
			setValue("slug", slug);
		}
	}, [watchTitle, setValue, isEditing]);

	const onSubmit = async (data) => {
		try {
			setLoading(true);

			const postData = {
				...data,
				content,
				category_name:
					categories.find((cat) => cat.id === data.category)?.name || "",
				tags: data.tags ? data.tags.split(",").map((tag) => tag.trim()) : [],
				published: data.published || false,
				trending: data.trending || false,
			};

			if (isEditing) {
				await updatePostMutation.mutateAsync({
					id,
					...postData,
				});
			} else {
				await createPostMutation.mutateAsync(postData);
			}

			navigate("/admin/dashboard");
		} catch (error) {
			console.error(`❌ PostEditor: Erro no onSubmit:`, error);
			toast.error(
				`Erro ao ${isEditing ? "atualizar" : "criar"} post: ${error.message}`
			);
		} finally {
			setLoading(false);
		}
	};

	const modules = {
		toolbar: [
			[{ header: [1, 2, 3, false] }],
			["bold", "italic", "underline", "strike"],
			[{ list: "ordered" }, { list: "bullet" }],
			["blockquote", "code-block"],
			["link", "image"],
			["clean"],
		],
	};

	// Loading state
	if (loadingPost) {
		return (
			<div className="min-h-screen bg-black flex items-center justify-center">
				<div className="text-center">
					<div className="animate-spin rounded-full h-32 w-32 border-b-2 border-red-500 mb-4"></div>
					<p className="text-gray-400 text-lg">
						Carregando post para edição...
					</p>
					<p className="text-gray-500 text-sm">Sistema Admin | ID: {id}</p>
				</div>
			</div>
		);
	}

	// Error state se não conseguir carregar o post
	if (isEditing && !loadingPost && !existingPost) {
		return (
			<div className="min-h-screen bg-black flex items-center justify-center">
				<div className="text-center">
					<div className="w-20 h-20 bg-red-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
						<ArrowLeft className="w-10 h-10 text-white" />
					</div>
					<h1 className="text-3xl font-bold text-white mb-4">
						Post não encontrado
					</h1>
					<p className="text-gray-400 mb-8">
						O post que você está tentando editar não foi encontrado ou você não
						tem permissão para acessá-lo.
					</p>
					<div className="space-y-4">
						<button
							onClick={() => navigate("/admin/dashboard")}
							className="bg-gradient-to-r from-red-600 to-red-500 hover:from-red-500 hover:to-red-400 text-white px-8 py-4 rounded-2xl font-bold transition-all duration-300 shadow-xl hover:shadow-red-500/25 hover:scale-105"
						>
							Voltar ao Dashboard
						</button>
					</div>
				</div>
			</div>
		);
	}

	return (
		<div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-black pt-20">
			<div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
				{/* Header otimizado */}
				<div className="flex items-center justify-between mb-8">
					<div className="flex items-center space-x-4">
						<button
							onClick={() => navigate("/admin/dashboard")}
							className="p-3 bg-gray-800 hover:bg-gray-700 rounded-xl transition-colors duration-300"
						>
							<ArrowLeft className="w-5 h-5 text-white" />
						</button>
						<div>
							<h1 className="text-3xl font-black text-white">
								{isEditing ? "Editar Post" : "Novo Post"}
							</h1>
							<p className="text-gray-400">
								{isEditing
									? `Editando: ${existingPost?.title || "Carregando..."}`
									: "Crie um novo post para o blog"}
							</p>
							{process.env.NODE_ENV === "development" && (
								<p className="text-xs text-gray-500 mt-1">
									🔧 Admin Editor | {isEditing ? `ID: ${id}` : "Novo post"}
								</p>
							)}
						</div>
					</div>

					<div className="flex items-center space-x-3">
						<span
							className={`flex items-center space-x-2 px-4 py-2 rounded-xl ${
								watchPublished
									? "bg-green-500/20 text-green-400"
									: "bg-yellow-500/20 text-yellow-400"
							}`}
						>
							{watchPublished ? (
								<Eye className="w-4 h-4" />
							) : (
								<EyeOff className="w-4 h-4" />
							)}
							<span className="text-sm font-semibold">
								{watchPublished ? "Publicado" : "Rascunho"}
							</span>
						</span>

						{watchTrending && (
							<span className="flex items-center space-x-2 px-4 py-2 rounded-xl bg-orange-500/20 text-orange-400">
								<TrendingUp className="w-4 h-4" />
								<span className="text-sm font-semibold">Trending</span>
							</span>
						)}
					</div>
				</div>

				{/* Form otimizado */}
				<form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
					<div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
						{/* Main Content */}
						<div className="lg:col-span-2 space-y-6">
							{/* Title */}
							<div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-3xl p-6 border border-gray-700/50">
								<label className="block text-white font-semibold mb-3">
									Título *
								</label>
								<input
									{...register("title", { required: "Título é obrigatório" })}
									className="w-full px-6 py-4 bg-gray-800/50 border border-gray-600/50 rounded-2xl text-white placeholder-gray-500 focus:outline-none focus:border-red-500/50 focus:bg-gray-800 transition-all duration-300"
									placeholder="Digite o título do post..."
								/>
								{errors.title && (
									<p className="text-red-400 text-sm mt-2">
										{errors.title.message}
									</p>
								)}
							</div>

							{/* Slug */}
							<div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-3xl p-6 border border-gray-700/50">
								<label className="block text-white font-semibold mb-3">
									Slug *
								</label>
								<input
									{...register("slug", { required: "Slug é obrigatório" })}
									className="w-full px-6 py-4 bg-gray-800/50 border border-gray-600/50 rounded-2xl text-white placeholder-gray-500 focus:outline-none focus:border-red-500/50 focus:bg-gray-800 transition-all duration-300"
									placeholder="url-amigavel-do-post"
								/>
								{errors.slug && (
									<p className="text-red-400 text-sm mt-2">
										{errors.slug.message}
									</p>
								)}
							</div>

							{/* Excerpt */}
							<div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-3xl p-6 border border-gray-700/50">
								<label className="block text-white font-semibold mb-3">
									Resumo *
								</label>
								<textarea
									{...register("excerpt", { required: "Resumo é obrigatório" })}
									rows={3}
									className="w-full px-6 py-4 bg-gray-800/50 border border-gray-600/50 rounded-2xl text-white placeholder-gray-500 focus:outline-none focus:border-red-500/50 focus:bg-gray-800 transition-all duration-300 resize-none"
									placeholder="Escreva um resumo atrativo do post..."
								/>
								{errors.excerpt && (
									<p className="text-red-400 text-sm mt-2">
										{errors.excerpt.message}
									</p>
								)}
							</div>

							{/* Content */}
							<div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-3xl p-6 border border-gray-700/50">
								<label className="block text-white font-semibold mb-3">
									Conteúdo *
								</label>
								<div className="bg-white rounded-2xl overflow-hidden">
									<ReactQuill
										theme="snow"
										value={content}
										onChange={setContent}
										modules={modules}
										style={{ minHeight: "400px" }}
									/>
								</div>
							</div>
						</div>

						{/* Sidebar otimizada */}
						<div className="lg:col-span-1 space-y-6">
							{/* Publish Settings */}
							<div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-3xl p-6 border border-gray-700/50">
								<h3 className="text-xl font-bold text-white mb-4">
									Configurações
								</h3>

								<div className="space-y-4">
									<label className="flex items-center space-x-3">
										<input
											type="checkbox"
											{...register("published")}
											className="w-5 h-5 bg-gray-700 border-gray-600 rounded focus:ring-red-500 focus:ring-2"
										/>
										<span className="text-white font-medium">
											Publicar post
										</span>
									</label>

									<label className="flex items-center space-x-3">
										<input
											type="checkbox"
											{...register("trending")}
											className="w-5 h-5 bg-gray-700 border-gray-600 rounded focus:ring-red-500 focus:ring-2"
										/>
										<span className="text-white font-medium">
											Marcar como trending
										</span>
									</label>
								</div>
							</div>

							{/* Category */}
							<div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-3xl p-6 border border-gray-700/50">
								<label className="block text-white font-semibold mb-3">
									Categoria *
								</label>
								<select
									{...register("category", {
										required: "Categoria é obrigatória",
									})}
									className="w-full px-6 py-4 bg-gray-800/50 border border-gray-600/50 rounded-2xl text-white focus:outline-none focus:border-red-500/50 focus:bg-gray-800 transition-all duration-300"
								>
									<option value="">Selecione uma categoria</option>
									{categories.map((category) => (
										<option key={category.id} value={category.id}>
											{category.name}
										</option>
									))}
								</select>
								{errors.category && (
									<p className="text-red-400 text-sm mt-2">
										{errors.category.message}
									</p>
								)}
							</div>

							{/* Image */}
							<div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-3xl p-6 border border-gray-700/50">
								<label className="block text-white font-semibold mb-3">
									URL da Imagem
								</label>
								<input
									{...register("image_url")}
									className="w-full px-6 py-4 bg-gray-800/50 border border-gray-600/50 rounded-2xl text-white placeholder-gray-500 focus:outline-none focus:border-red-500/50 focus:bg-gray-800 transition-all duration-300"
									placeholder="https://exemplo.com/imagem.jpg"
								/>
							</div>

							{/* Meta */}
							<div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-3xl p-6 border border-gray-700/50">
								<h3 className="text-xl font-bold text-white mb-4">
									Meta Informações
								</h3>

								<div className="space-y-4">
									<div>
										<label className="block text-white font-medium mb-2">
											Autor
										</label>
										<input
											{...register("author")}
											defaultValue="Equipe TF"
											className="w-full px-4 py-3 bg-gray-800/50 border border-gray-600/50 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-red-500/50 focus:bg-gray-800 transition-all duration-300"
											placeholder="Nome do autor"
										/>
									</div>

									<div>
										<label className="block text-white font-medium mb-2">
											Tempo de Leitura
										</label>
										<input
											{...register("read_time")}
											defaultValue="5 min"
											className="w-full px-4 py-3 bg-gray-800/50 border border-gray-600/50 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-red-500/50 focus:bg-gray-800 transition-all duration-300"
											placeholder="5 min"
										/>
									</div>
								</div>
							</div>

							{/* Tags */}
							<div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-3xl p-6 border border-gray-700/50">
								<label className="block text-white font-semibold mb-3">
									Tags
								</label>
								<input
									{...register("tags")}
									className="w-full px-6 py-4 bg-gray-800/50 border border-gray-600/50 rounded-2xl text-white placeholder-gray-500 focus:outline-none focus:border-red-500/50 focus:bg-gray-800 transition-all duration-300"
									placeholder="f1, verstappen, corrida"
								/>
								<p className="text-gray-400 text-sm mt-2">
									Separe as tags com vírgulas
								</p>
							</div>

							{/* Save Button */}
							<button
								type="submit"
								disabled={
									loading ||
									createPostMutation.isLoading ||
									updatePostMutation.isLoading
								}
								className="w-full bg-gradient-to-r from-red-600 to-red-500 hover:from-red-500 hover:to-red-400 text-white py-4 rounded-2xl font-semibold text-lg transition-all duration-300 shadow-lg hover:shadow-red-500/25 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-3"
							>
								{loading ||
								createPostMutation.isLoading ||
								updatePostMutation.isLoading ? (
									<div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
								) : (
									<>
										<Save className="w-5 h-5" />
										<span>{isEditing ? "Atualizar Post" : "Salvar Post"}</span>
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

export default PostEditor;
