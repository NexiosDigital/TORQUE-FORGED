import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import {
	Save,
	ArrowLeft,
	Eye,
	EyeOff,
	TrendingUp,
	FileText,
	AlertCircle,
} from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import {
	useCreatePost,
	useUpdatePost,
	usePostByIdAdmin,
	useCategories,
} from "../../hooks/usePostsQuery";
import ImageUpload from "../../components/ImageUpload";
import toast from "react-hot-toast";

/**
 * PostEditor - VERSÃO CORRIGIDA PARA EDIÇÃO DE POSTS
 * - Correção específica para atualização de imagens em posts existentes
 * - Estado da imagem mantido durante edição
 * - Prevenção de reversão após upload
 */

const PostEditor = () => {
	const navigate = useNavigate();
	const { id } = useParams();
	const isEditing = !!id;

	const createPostMutation = useCreatePost();
	const updatePostMutation = useUpdatePost();

	const { data: existingPost, isLoading: loadingPost } = usePostByIdAdmin(id, {
		enabled: isEditing,
	});

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
	const [showPreview, setShowPreview] = useState(false);

	// Estado da imagem - CORRIGIDO PARA EDIÇÃO
	const [imageData, setImageData] = useState({
		image_url: null,
		image_path: null,
	});

	// Estado para controlar se a imagem foi alterada durante edição
	const [imageChanged, setImageChanged] = useState(false);

	// Estado para debug (pode remover depois)
	const [debugInfo, setDebugInfo] = useState({
		lastImageUpdate: null,
		imageStatus: "waiting",
		originalImageUrl: null,
		isEditing: isEditing,
	});

	const watchTitle = watch("title");
	const watchPublished = watch("published");
	const watchTrending = watch("trending");

	// Carregar post para edição - VERSÃO CORRIGIDA
	useEffect(() => {
		if (isEditing && existingPost) {
			setValue("title", existingPost.title);
			setValue("slug", existingPost.slug);
			setValue("category", existingPost.category);
			setValue("excerpt", existingPost.excerpt);
			setValue("author", existingPost.author);
			setValue("read_time", existingPost.read_time);
			setValue("published", existingPost.published);
			setValue("trending", existingPost.trending);
			setValue("tags", existingPost.tags?.join(", ") || "");
			setContent(existingPost.content || "");

			// Configurar dados da imagem existente - APENAS SE NÃO FOI ALTERADA
			if (existingPost.image_url && !imageChanged) {
				const imageState = {
					image_url: existingPost.image_url,
					image_path: existingPost.image_path || null,
				};
				setImageData(imageState);
				setDebugInfo((prev) => ({
					...prev,
					lastImageUpdate: new Date().toISOString(),
					imageStatus: "loaded_existing",
					originalImageUrl: existingPost.image_url,
				}));
			}
		}
	}, [existingPost, isEditing, setValue, imageChanged]);

	// Gerar slug automaticamente - APENAS PARA POSTS NOVOS
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

	// Handler para mudança na imagem - VERSÃO CORRIGIDA PARA EDIÇÃO
	const handleImageChange = (newImageData) => {
		// Marcar que a imagem foi alterada (importante para edição)
		setImageChanged(true);

		// Atualizar estado da imagem
		setImageData(newImageData);

		setDebugInfo((prev) => ({
			...prev,
			lastImageUpdate: new Date().toISOString(),
			imageStatus: newImageData.image_url ? "uploaded_new" : "removed",
		}));
	};

	// Validação antes do submit
	const validateBeforeSubmit = () => {
		const errors = [];

		// Validar imagem obrigatória
		if (!imageData.image_url) {
			errors.push("É obrigatório ter uma imagem de capa");
		}

		// Validar conteúdo
		if (!content.trim()) {
			errors.push("O conteúdo do post não pode estar vazio");
		}

		return errors;
	};

	const onSubmit = async (data) => {
		try {
			setLoading(true);

			// Validações
			const validationErrors = validateBeforeSubmit();
			if (validationErrors.length > 0) {
				validationErrors.forEach((error) => toast.error(error));
				return;
			}

			// Montar dados do post - INCLUINDO CAMPOS DE IMAGEM
			const postData = {
				...data,
				content: content.trim(),

				// CAMPOS DE IMAGEM - USAR ESTADO ATUAL
				image_url: imageData.image_url,
				image_path: imageData.image_path,

				// Outros dados processados
				category_name:
					categories.find((cat) => cat.id === data.category)?.name || "",
				tags: data.tags
					? data.tags
							.split(",")
							.map((tag) => tag.trim())
							.filter(Boolean)
					: [],
				published: data.published || false,
				trending: data.trending || false,
			};

			// Verificação final da imagem
			if (!postData.image_url) {
				throw new Error(
					"Dados da imagem não encontrados. Faça o upload da imagem novamente."
				);
			}

			// Salvar post
			let result;
			if (isEditing) {
				result = await updatePostMutation.mutateAsync({
					id,
					...postData,
				});
			} else {
				//result = await createPostMutation.mutateAsync(postData);
				//console.log("✅ Post criado:", result);
			}

			toast.success(`Post ${isEditing ? "atualizado" : "criado"} com sucesso!`);
			navigate("/admin/dashboard");
		} catch (error) {
			console.error(`❌ PostEditor: Erro no onSubmit:`, error);

			// Mensagens de erro específicas
			if (error.message.includes("image_url")) {
				toast.error(
					"Erro relacionado à imagem. Verifique se a imagem foi carregada corretamente."
				);
			} else if (
				error.message.includes("permission") ||
				error.message.includes("RLS")
			) {
				toast.error(
					"Erro de permissão. Verifique se você tem acesso para salvar posts."
				);
			} else {
				toast.error(
					`Erro ao ${isEditing ? "atualizar" : "criar"} post: ${error.message}`
				);
			}
		} finally {
			setLoading(false);
		}
	};

	// Inserir texto na posição do cursor
	const insertText = (textToInsert, wrapSelection = false) => {
		const textarea = document.getElementById("markdown-editor");
		if (!textarea) return;

		const start = textarea.selectionStart;
		const end = textarea.selectionEnd;
		const selectedText = textarea.value.substring(start, end);

		let newText;
		if (wrapSelection && selectedText) {
			newText = textToInsert.replace("{text}", selectedText);
		} else {
			newText = textToInsert;
		}

		const newContent =
			content.substring(0, start) + newText + content.substring(end);

		setContent(newContent);

		// Focar no textarea após inserção
		setTimeout(() => {
			textarea.focus();
			const newPosition = start + newText.length;
			textarea.setSelectionRange(newPosition, newPosition);
		}, 10);
	};

	// Toolbar com atalhos Markdown
	const MarkdownToolbar = () => (
		<div className="flex flex-wrap items-center gap-2 p-4 bg-gray-800/30 border-b border-gray-700/30">
			<button
				type="button"
				onClick={() => insertText("**{text}**", true)}
				className="px-3 py-1 bg-gray-700 hover:bg-gray-600 text-white rounded-lg text-sm transition-colors duration-300"
				title="Negrito"
			>
				<strong>B</strong>
			</button>
			<button
				type="button"
				onClick={() => insertText("*{text}*", true)}
				className="px-3 py-1 bg-gray-700 hover:bg-gray-600 text-white rounded-lg text-sm italic transition-colors duration-300"
				title="Itálico"
			>
				I
			</button>
			<button
				type="button"
				onClick={() => insertText("## {text}", true)}
				className="px-3 py-1 bg-gray-700 hover:bg-gray-600 text-white rounded-lg text-sm transition-colors duration-300"
				title="Título"
			>
				H2
			</button>
			<button
				type="button"
				onClick={() => insertText("[{text}](url)", true)}
				className="px-3 py-1 bg-gray-700 hover:bg-gray-600 text-white rounded-lg text-sm transition-colors duration-300"
				title="Link"
			>
				Link
			</button>
			<button
				type="button"
				onClick={() => insertText("![alt]({text})", true)}
				className="px-3 py-1 bg-gray-700 hover:bg-gray-600 text-white rounded-lg text-sm transition-colors duration-300"
				title="Imagem"
			>
				Img
			</button>
			<button
				type="button"
				onClick={() => insertText("```\n{text}\n```", true)}
				className="px-3 py-1 bg-gray-700 hover:bg-gray-600 text-white rounded-lg text-sm transition-colors duration-300"
				title="Código"
			>
				Code
			</button>
			<button
				type="button"
				onClick={() => insertText("> {text}", true)}
				className="px-3 py-1 bg-gray-700 hover:bg-gray-600 text-white rounded-lg text-sm transition-colors duration-300"
				title="Citação"
			>
				Quote
			</button>
			<button
				type="button"
				onClick={() => insertText("- {text}", true)}
				className="px-3 py-1 bg-gray-700 hover:bg-gray-600 text-white rounded-lg text-sm transition-colors duration-300"
				title="Lista"
			>
				List
			</button>

			<div className="ml-auto flex items-center space-x-2">
				<button
					type="button"
					onClick={() => setShowPreview(!showPreview)}
					className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors duration-300 ${
						showPreview
							? "bg-red-600 hover:bg-red-700 text-white"
							: "bg-gray-700 hover:bg-gray-600 text-white"
					}`}
				>
					{showPreview ? (
						<EyeOff className="w-4 h-4" />
					) : (
						<Eye className="w-4 h-4" />
					)}
					<span>{showPreview ? "Ocultar Preview" : "Mostrar Preview"}</span>
				</button>
			</div>
		</div>
	);

	// Guia de sintaxe Markdown
	const MarkdownGuide = () => (
		<div className="bg-gray-800/30 rounded-2xl p-6 border border-gray-700/30">
			<h4 className="text-white font-semibold mb-4 flex items-center space-x-2">
				<FileText className="w-4 h-4" />
				<span>Guia Markdown</span>
			</h4>
			<div className="space-y-2 text-sm text-gray-400">
				<div>
					<code className="text-red-400">**texto**</code> -{" "}
					<strong>Negrito</strong>
				</div>
				<div>
					<code className="text-red-400">*texto*</code> - <em>Itálico</em>
				</div>
				<div>
					<code className="text-red-400"># Título</code> - Título principal
				</div>
				<div>
					<code className="text-red-400">## Subtítulo</code> - Subtítulo
				</div>
				<div>
					<code className="text-red-400">[link](url)</code> - Link
				</div>
				<div>
					<code className="text-red-400">![alt](img)</code> - Imagem
				</div>
				<div>
					<code className="text-red-400">`código`</code> - Código inline
				</div>
				<div>
					<code className="text-red-400">```código```</code> - Bloco de código
				</div>
				<div>
					<code className="text-red-400">&gt; citação</code> - Citação
				</div>
				<div>
					<code className="text-red-400">- item</code> - Lista
				</div>
			</div>
		</div>
	);

	// Loading state
	if (loadingPost) {
		return (
			<div className="min-h-screen bg-black flex items-center justify-center">
				<div className="text-center">
					<div className="animate-spin rounded-full h-32 w-32 border-b-2 border-red-500 mb-4"></div>
					<p className="text-gray-400 text-lg">
						Carregando post para edição...
					</p>
				</div>
			</div>
		);
	}

	// Error state
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
						O post que você está tentando editar não foi encontrado.
					</p>
					<button
						onClick={() => navigate("/admin/dashboard")}
						className="bg-gradient-to-r from-red-600 to-red-500 hover:from-red-500 hover:to-red-400 text-white px-8 py-4 rounded-2xl font-bold transition-all duration-300"
					>
						Voltar ao Dashboard
					</button>
				</div>
			</div>
		);
	}

	return (
		<div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-black pt-20">
			<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
				{/* Header */}
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
									: "Crie um novo post em Markdown"}
							</p>
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

				{/* Form */}
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

							{/* Markdown Editor */}
							<div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-3xl border border-gray-700/50 overflow-hidden">
								<div className="p-6 border-b border-gray-700/50">
									<label className="block text-white font-semibold mb-0">
										Conteúdo em Markdown *
									</label>
								</div>

								<MarkdownToolbar />

								<div
									className={`grid ${
										showPreview ? "grid-cols-2" : "grid-cols-1"
									} min-h-[500px]`}
								>
									{/* Editor */}
									<div
										className={`${
											showPreview ? "border-r border-gray-700/30" : ""
										}`}
									>
										<textarea
											id="markdown-editor"
											value={content}
											onChange={(e) => setContent(e.target.value)}
											className="w-full h-full min-h-[500px] p-6 bg-transparent border-none text-white placeholder-gray-500 focus:outline-none resize-none font-mono text-sm leading-relaxed"
											placeholder="Digite seu conteúdo em Markdown aqui..."
										/>
									</div>

									{/* Preview */}
									{showPreview && (
										<div className="overflow-auto">
											<div className="p-6 prose prose-invert prose-lg max-w-none">
												<ReactMarkdown
													remarkPlugins={[remarkGfm]}
													components={{
														h1: ({ node, ...props }) => (
															<h1
																className="text-3xl font-bold text-white mb-4"
																{...props}
															/>
														),
														h2: ({ node, ...props }) => (
															<h2
																className="text-2xl font-bold text-white mb-3 mt-6"
																{...props}
															/>
														),
														h3: ({ node, ...props }) => (
															<h3
																className="text-xl font-bold text-white mb-2 mt-5"
																{...props}
															/>
														),
														p: ({ node, ...props }) => (
															<p
																className="text-gray-300 mb-4 leading-relaxed"
																{...props}
															/>
														),
														strong: ({ node, ...props }) => (
															<strong
																className="text-white font-bold"
																{...props}
															/>
														),
														em: ({ node, ...props }) => (
															<em className="text-gray-300 italic" {...props} />
														),
														a: ({ node, ...props }) => (
															<a
																className="text-red-400 hover:text-red-300 underline"
																{...props}
															/>
														),
														code: ({ node, ...props }) => (
															<code
																className="bg-gray-800 text-red-400 px-2 py-1 rounded text-sm"
																{...props}
															/>
														),
														pre: ({ node, ...props }) => (
															<pre
																className="bg-gray-800 p-4 rounded-lg overflow-x-auto mb-4"
																{...props}
															/>
														),
														blockquote: ({ node, ...props }) => (
															<blockquote
																className="border-l-4 border-red-500 pl-4 italic text-gray-400 my-4"
																{...props}
															/>
														),
														ul: ({ node, ...props }) => (
															<ul
																className="list-disc list-inside text-gray-300 mb-4 space-y-1"
																{...props}
															/>
														),
														ol: ({ node, ...props }) => (
															<ol
																className="list-decimal list-inside text-gray-300 mb-4 space-y-1"
																{...props}
															/>
														),
														li: ({ node, ...props }) => (
															<li className="text-gray-300" {...props} />
														),
														img: ({ node, ...props }) => (
															<img
																className="rounded-lg max-w-full h-auto mb-4"
																{...props}
															/>
														),
													}}
												>
													{content ||
														"*Preview aparecerá aqui conforme você digita...*"}
												</ReactMarkdown>
											</div>
										</div>
									)}
								</div>
							</div>
						</div>

						{/* Sidebar */}
						<div className="lg:col-span-1 space-y-6">
							{/* Upload de Imagem - VERSÃO CORRIGIDA PARA EDIÇÃO */}
							<div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-3xl p-6 border border-gray-700/50">
								<h3 className="text-xl font-bold text-white mb-4">
									Imagem de Capa *
								</h3>

								{/* Status específico para edição */}
								{isEditing && imageChanged && (
									<div className="mb-4 p-3 bg-blue-500/10 border border-blue-500/20 rounded-xl">
										<div className="flex items-center space-x-2">
											<AlertCircle className="w-4 h-4 text-blue-400" />
											<span className="text-blue-400 text-sm font-semibold">
												Nova imagem carregada - será atualizada ao salvar
											</span>
										</div>
									</div>
								)}

								{!imageData.image_url && (
									<div className="mb-4 p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-xl">
										<div className="flex items-center space-x-2">
											<AlertCircle className="w-4 h-4 text-yellow-400" />
											<span className="text-yellow-400 text-sm font-semibold">
												Imagem de capa é obrigatória
											</span>
										</div>
									</div>
								)}

								<ImageUpload
									value={imageData.image_url}
									onChange={handleImageChange}
									postSlug={watch("slug")}
									disabled={loading}
								/>
							</div>

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

							{/* Meta Info */}
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

							{/* Markdown Guide */}
							<MarkdownGuide />

							{/* Save Button */}
							<button
								type="submit"
								disabled={
									loading ||
									createPostMutation.isLoading ||
									updatePostMutation.isLoading ||
									!imageData.image_url // Desabilitar se não há imagem
								}
								className="w-full bg-gradient-to-r from-red-600 to-red-500 hover:from-red-500 hover:to-red-400 text-white py-4 rounded-2xl font-semibold text-lg transition-all duration-300 shadow-lg hover:shadow-red-500/25 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center justify-center space-x-3"
							>
								{loading ||
								createPostMutation.isLoading ||
								updatePostMutation.isLoading ? (
									<>
										<div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
										<span>Salvando...</span>
									</>
								) : (
									<>
										<Save className="w-5 h-5" />
										<span>{isEditing ? "Atualizar Post" : "Salvar Post"}</span>
									</>
								)}
							</button>

							{/* Aviso sobre imagem obrigatória */}
							{!imageData.image_url && (
								<div className="text-center text-gray-400 text-sm">
									⚠️{" "}
									{isEditing
										? "Selecione uma nova imagem ou mantenha a atual"
										: "Faça o upload da imagem de capa para habilitar o salvamento"}
								</div>
							)}
						</div>
					</div>
				</form>
			</div>
		</div>
	);
};

export default PostEditor;
