import React, { useState, useEffect } from "react";
import {
	Image as ImageIcon,
	Plus,
	Trash2,
	Eye,
	RotateCcw,
	Copy,
	X,
	AlertCircle,
	Folder,
	Download,
	ZoomIn,
	Check,
} from "lucide-react";
import { ContentImageService } from "../services/ContentImageService";
import toast from "react-hot-toast";

/**
 * PostImageGallery - Galeria de imagens do post atual (VERSÃO FINAL)
 * - Botões de ação posicionados abaixo da imagem
 * - Sem sobreposição na área da imagem
 * - Modal corrigido para não disparar eventos externos
 * - Layout limpo e organizado
 */

const PostImageGallery = ({
	postSlug,
	onImageInserted,
	onUploadNewImage,
	postContent = "",
	className = "",
}) => {
	// Estados do componente
	const [images, setImages] = useState([]);
	const [loading, setLoading] = useState(true);
	const [selectedImage, setSelectedImage] = useState(null);
	const [showPreview, setShowPreview] = useState(false);
	const [unusedImages, setUnusedImages] = useState([]);
	const [loadingCleanup, setLoadingCleanup] = useState(false);
	const [copiedUrl, setCopiedUrl] = useState(null);

	// Carregar imagens do post
	const loadPostImages = async () => {
		if (!postSlug) {
			setLoading(false);
			return;
		}

		try {
			setLoading(true);
			const postImages = await ContentImageService.getPostImages(postSlug);
			setImages(postImages);

			// Identificar imagens não utilizadas
			if (postContent) {
				const imageReferences =
					ContentImageService.extractImageReferences(postContent);
				const unused = postImages.filter(
					(img) => !imageReferences.some((ref) => ref.includes(img.name))
				);
				setUnusedImages(unused);
			}
		} catch (error) {
			console.error("❌ Erro ao carregar imagens do post:", error);
			toast.error("Erro ao carregar galeria de imagens");
		} finally {
			setLoading(false);
		}
	};

	// Recarregar quando postSlug ou conteúdo mudar
	useEffect(() => {
		loadPostImages();
	}, [postSlug, postContent]);

	// Inserir imagem no editor
	const handleInsertImage = (image, description = "") => {
		if (!onImageInserted) return;

		const alt =
			description || image.name.replace(/\.[^/.]+$/, "").replace(/[-_]/g, " ");
		const markdown = `![${alt}](${image.url})`;

		onImageInserted({
			markdown,
			imageUrl: image.url,
			imagePath: image.path,
			description: alt,
		});

		toast.success("Imagem inserida no editor!");
	};

	// Remover imagem específica
	const handleRemoveImage = async (image, event) => {
		event?.stopPropagation();

		if (!window.confirm(`Tem certeza que deseja remover "${image.name}"?`)) {
			return;
		}

		try {
			await ContentImageService.removeContentImage(image.path);
			await loadPostImages(); // Recarregar lista
			toast.success("Imagem removida com sucesso!");
		} catch (error) {
			console.error("❌ Erro ao remover imagem:", error);
			toast.error("Erro ao remover imagem");
		}
	};

	// Limpar imagens não utilizadas
	const handleCleanupUnused = async () => {
		if (unusedImages.length === 0) {
			toast.info("Não há imagens não utilizadas para remover");
			return;
		}

		if (
			!window.confirm(
				`Remover ${unusedImages.length} imagem(ns) não utilizada(s)?`
			)
		) {
			return;
		}

		try {
			setLoadingCleanup(true);
			const result = await ContentImageService.cleanupUnusedImages(
				postSlug,
				postContent
			);

			if (result.removed > 0) {
				toast.success(`${result.removed} imagens não utilizadas removidas!`);
				await loadPostImages();
			} else {
				toast.info("Nenhuma imagem foi removida");
			}
		} catch (error) {
			console.error("❌ Erro na limpeza:", error);
			toast.error("Erro ao limpar imagens");
		} finally {
			setLoadingCleanup(false);
		}
	};

	// Copiar URL da imagem
	const handleCopyUrl = async (image, event) => {
		event?.stopPropagation();

		try {
			await navigator.clipboard.writeText(image.url);
			setCopiedUrl(image.path);
			toast.success("URL copiada!");

			// Reset do ícone após 2s
			setTimeout(() => setCopiedUrl(null), 2000);
		} catch (error) {
			toast.error("Erro ao copiar URL");
		}
	};

	// Fazer download da imagem
	const handleDownloadImage = async (image, event) => {
		event?.stopPropagation();

		try {
			const response = await fetch(image.url);
			const blob = await response.blob();
			const url = window.URL.createObjectURL(blob);
			const a = document.createElement("a");
			a.href = url;
			a.download = image.name;
			document.body.appendChild(a);
			a.click();
			document.body.removeChild(a);
			window.URL.revokeObjectURL(url);
			toast.success("Download iniciado!");
		} catch (error) {
			toast.error("Erro ao fazer download");
		}
	};

	// Abrir preview
	const handleOpenPreview = (image, event) => {
		event?.stopPropagation();
		setSelectedImage(image);
		setShowPreview(true);
	};

	// Preview modal melhorado
	const ImagePreviewModal = ({ image, isOpen, onClose }) => {
		if (!isOpen || !image) return null;

		// Fechar modal sem propagar eventos
		const handleClose = (event) => {
			event?.stopPropagation();
			onClose();
		};

		return (
			<div
				className="fixed inset-0 bg-black/90 backdrop-blur-md z-50 flex items-center justify-center p-4"
				onClick={handleClose}
			>
				<div
					className="relative max-w-6xl max-h-[95vh] w-full"
					onClick={(e) => e.stopPropagation()}
				>
					{/* Botão fechar */}
					<button
						onClick={handleClose}
						className="absolute -top-16 right-0 p-3 rounded-full bg-gradient-to-r from-gray-800 to-gray-700 hover:from-gray-700 hover:to-gray-600 text-white transition-all duration-300 shadow-xl border border-gray-600/50 z-10"
					>
						<X className="w-6 h-6" />
					</button>

					{/* Modal content */}
					<div className="bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 rounded-3xl overflow-hidden border border-gray-600/50 shadow-2xl">
						{/* Header */}
						<div className="p-6 border-b border-gray-700/50 bg-gradient-to-r from-gray-800/50 to-gray-700/50">
							<div className="flex items-center justify-between">
								<div>
									<h3 className="text-xl font-bold text-white mb-1">
										{image.name}
									</h3>
									<div className="flex items-center space-x-4 text-sm text-gray-400">
										<span>
											{image.size
												? `${(image.size / 1024).toFixed(1)} KB`
												: "Tamanho não disponível"}
										</span>
										<span>•</span>
										<span>Clique para ampliar</span>
									</div>
								</div>
							</div>
						</div>

						{/* Image container */}
						<div className="relative max-h-[70vh] overflow-auto bg-gray-950/30">
							<img
								src={image.url}
								alt={image.name}
								className="w-full h-auto cursor-zoom-in hover:scale-105 transition-transform duration-500"
								loading="lazy"
								onClick={(e) => {
									e.stopPropagation();
									window.open(image.url, "_blank");
								}}
							/>

							{/* Zoom hint overlay */}
							<div className="absolute top-4 left-4 bg-black/60 backdrop-blur-sm text-white px-3 py-2 rounded-lg text-sm flex items-center space-x-2">
								<ZoomIn className="w-4 h-4" />
								<span>Clique para ampliar</span>
							</div>
						</div>

						{/* Actions */}
						<div className="p-6 bg-gradient-to-r from-gray-800/30 to-gray-700/30 flex flex-wrap justify-center gap-3">
							<button
								onClick={(e) => {
									e.stopPropagation();
									handleInsertImage(image);
									handleClose(e);
								}}
								className="flex items-center space-x-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white px-6 py-3 rounded-xl font-semibold transition-all duration-300 shadow-lg hover:shadow-blue-500/25 hover:scale-105"
							>
								<Plus className="w-5 h-5" />
								<span>Inserir no Editor</span>
							</button>

							<button
								onClick={(e) => handleCopyUrl(image, e)}
								className="flex items-center space-x-2 bg-gradient-to-r from-gray-700 to-gray-600 hover:from-gray-600 hover:to-gray-500 text-white px-6 py-3 rounded-xl font-semibold transition-all duration-300 shadow-lg hover:scale-105"
							>
								{copiedUrl === image.path ? (
									<Check className="w-5 h-5" />
								) : (
									<Copy className="w-5 h-5" />
								)}
								<span>
									{copiedUrl === image.path ? "Copiado!" : "Copiar URL"}
								</span>
							</button>

							<button
								onClick={(e) => handleDownloadImage(image, e)}
								className="flex items-center space-x-2 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 text-white px-6 py-3 rounded-xl font-semibold transition-all duration-300 shadow-lg hover:shadow-green-500/25 hover:scale-105"
							>
								<Download className="w-5 h-5" />
								<span>Download</span>
							</button>
						</div>
					</div>
				</div>
			</div>
		);
	};

	// Loading state
	if (loading) {
		return (
			<div className={`space-y-8 ${className}`}>
				<div className="flex items-center justify-between">
					<h3 className="text-xl font-bold text-white">Galeria de Imagens</h3>
				</div>

				<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
					{Array.from({ length: 4 }).map((_, i) => (
						<div key={i} className="animate-pulse">
							<div className="aspect-[4/3] bg-gradient-to-br from-gray-700 to-gray-800 rounded-2xl border border-gray-600/30 mb-4"></div>
							<div className="h-16 bg-gray-700/50 rounded-xl"></div>
						</div>
					))}
				</div>
			</div>
		);
	}

	// Empty state
	if (!postSlug) {
		return (
			<div className={`text-center py-12 ${className}`}>
				<div className="w-20 h-20 bg-gradient-to-br from-gray-700 to-gray-800 rounded-3xl flex items-center justify-center mx-auto mb-6 border border-gray-600/30">
					<Folder className="w-10 h-10 text-gray-400" />
				</div>
				<h3 className="text-gray-300 font-bold text-lg mb-2">
					Galeria não disponível
				</h3>
				<p className="text-gray-500 text-sm">
					Salve o post primeiro para usar a galeria de imagens
				</p>
			</div>
		);
	}

	return (
		<div className={`space-y-8 ${className}`}>
			{/* Header */}
			<div className="space-y-6">
				<div>
					<h3 className="text-2xl font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent mb-2">
						Galeria de Imagens
					</h3>
					<p className="text-gray-400 text-sm">
						{images.length === 0
							? "Nenhuma imagem enviada ainda"
							: `${images.length} imagem(ns) disponível(eis)`}
						{unusedImages.length > 0 && (
							<span className="text-orange-400 ml-2">
								• {unusedImages.length} não utilizada(s)
							</span>
						)}
					</p>
				</div>

				{/* Botões de controle */}
				<div className="flex flex-wrap items-center gap-3">
					{unusedImages.length > 0 && (
						<button
							onClick={handleCleanupUnused}
							disabled={loadingCleanup}
							className="flex items-center space-x-2 bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-500 hover:to-red-500 text-white px-4 py-2.5 rounded-xl text-sm font-semibold transition-all duration-300 shadow-lg hover:shadow-orange-500/25 disabled:opacity-50 hover:scale-105 disabled:hover:scale-100"
						>
							{loadingCleanup ? (
								<div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
							) : (
								<Trash2 className="w-4 h-4" />
							)}
							<span>Limpar {unusedImages.length}</span>
						</button>
					)}

					<button
						onClick={loadPostImages}
						className="flex items-center space-x-2 bg-gradient-to-r from-gray-700 to-gray-600 hover:from-gray-600 hover:to-gray-500 text-white px-4 py-2.5 rounded-xl text-sm font-semibold transition-all duration-300 shadow-lg hover:scale-105"
					>
						<RotateCcw className="w-4 h-4" />
						<span>Atualizar</span>
					</button>

					{onUploadNewImage && (
						<button
							onClick={onUploadNewImage}
							className="flex items-center space-x-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white px-4 py-2.5 rounded-xl text-sm font-semibold transition-all duration-300 shadow-lg hover:shadow-blue-500/25 hover:scale-105"
						>
							<Plus className="w-4 h-4" />
							<span>Nova Imagem</span>
						</button>
					)}
				</div>
			</div>

			{/* Gallery Grid - LAYOUT CORRIGIDO */}
			{images.length === 0 ? (
				<div className="text-center py-16 bg-gradient-to-br from-gray-800/20 to-gray-900/20 rounded-3xl border-2 border-dashed border-gray-600/50 backdrop-blur-sm">
					<div className="w-24 h-24 bg-gradient-to-br from-gray-700 to-gray-800 rounded-3xl flex items-center justify-center mx-auto mb-6 border border-gray-600/30">
						<ImageIcon className="w-12 h-12 text-gray-400" />
					</div>
					<h4 className="text-gray-300 font-bold text-lg mb-3">
						Nenhuma imagem na galeria
					</h4>
					<p className="text-gray-500 text-sm mb-8 max-w-md mx-auto">
						Use o botão "Imagem" na toolbar para fazer upload da primeira imagem
						para este post
					</p>
					{onUploadNewImage && (
						<button
							onClick={onUploadNewImage}
							className="inline-flex items-center space-x-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white px-8 py-4 rounded-2xl font-bold transition-all duration-300 shadow-lg hover:shadow-blue-500/25 hover:scale-105"
						>
							<Plus className="w-5 h-5" />
							<span>Adicionar Primeira Imagem</span>
						</button>
					)}
				</div>
			) : (
				<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
					{images.map((image, index) => {
						const isUnused = unusedImages.some(
							(unused) => unused.path === image.path
						);

						return (
							<div
								key={`${image.path}-${index}`}
								className={`group bg-gradient-to-br from-gray-800/30 to-gray-900/30 rounded-3xl border-2 transition-all duration-500 hover:scale-[1.05] overflow-hidden ${
									isUnused
										? "border-orange-500/40 shadow-lg shadow-orange-500/10"
										: "border-gray-600/30 hover:border-blue-500/50 hover:shadow-xl hover:shadow-blue-500/10"
								}`}
							>
								{/* Container da imagem - SEM BOTÕES SOBREPOSTOS */}
								<div className="aspect-[3/2] relative overflow-hidden bg-gradient-to-br from-gray-800 to-gray-900 cursor-pointer">
									<img
										src={image.url}
										alt={image.name}
										className="w-full h-full object-cover transition-all duration-500 group-hover:scale-105"
										loading="lazy"
										onClick={(e) => handleOpenPreview(image, e)}
										onError={(e) => {
											e.target.style.display = "none";
											e.target.nextSibling.style.display = "flex";
										}}
									/>

									{/* Fallback quando imagem falha */}
									<div className="hidden w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-700 to-gray-800">
										<ImageIcon className="w-12 h-12 text-gray-500" />
									</div>

									{/* Status badge */}
									{isUnused && (
										<div className="absolute top-4 left-4 z-10">
											<span className="px-3 py-1.5 bg-gradient-to-r from-orange-600 to-red-600 text-white text-xs font-bold rounded-full shadow-lg border border-orange-400/30">
												Não usada
											</span>
										</div>
									)}
								</div>

								{/* Info e botões SEPARADOS - Abaixo da imagem */}
								<div className="p-3 space-y-3">
									{/* Nome e tamanho */}
									<div>
										<h4 className="text-white font-semibold text-sm mb-1 truncate">
											{image.name}
										</h4>
									</div>

									{/* Botões de ação - Em linha horizontal */}
									<div className="flex items-center gap-1">
										<button
											onClick={(e) => {
												e.stopPropagation();
												handleInsertImage(image);
											}}
											className="flex-1 flex items-center justify-center space-x-1 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white px-3 py-2 rounded-lg text-xs font-semibold transition-all duration-300 shadow-lg hover:shadow-blue-500/25 hover:scale-105"
											title="Inserir no editor"
										>
											<Plus className="w-2 h-3" />
										</button>

										<button
											onClick={(e) => handleOpenPreview(image, e)}
											className="p-2 bg-gradient-to-r from-gray-600 to-gray-700 hover:from-gray-500 hover:to-gray-600 text-white rounded-lg transition-all duration-300 shadow-lg hover:scale-105"
											title="Visualizar"
										>
											<Eye className="w-3 h-3" />
										</button>

										<button
											onClick={(e) => handleCopyUrl(image, e)}
											className="p-2 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 text-white rounded-lg transition-all duration-300 shadow-lg hover:shadow-green-500/25 hover:scale-105"
											title="Copiar URL"
										>
											{copiedUrl === image.path ? (
												<Check className="w-3 h-3" />
											) : (
												<Copy className="w-3 h-3" />
											)}
										</button>

										<button
											onClick={(e) => handleRemoveImage(image, e)}
											className="p-2 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white rounded-lg transition-all duration-300 shadow-lg hover:shadow-red-500/25 hover:scale-105"
											title="Remover"
										>
											<Trash2 className="w-3 h-3" />
										</button>
									</div>
								</div>
							</div>
						);
					})}
				</div>
			)}

			{/* Alerta sobre imagens não utilizadas */}
			{unusedImages.length > 0 && (
				<div className="bg-gradient-to-r from-orange-500/10 via-red-500/10 to-orange-500/10 border border-orange-500/30 rounded-2xl p-6 backdrop-blur-sm">
					<div className="flex items-start space-x-4">
						<div className="w-12 h-12 bg-gradient-to-r from-orange-600 to-red-600 rounded-2xl flex items-center justify-center flex-shrink-0">
							<AlertCircle className="w-6 h-6 text-white" />
						</div>
						<div className="flex-1">
							<h4 className="text-orange-300 font-bold text-lg mb-2">
								{unusedImages.length} imagem(ns) não utilizada(s)
							</h4>
							<p className="text-orange-200 text-sm mb-4 leading-relaxed">
								Estas imagens foram enviadas mas não estão sendo usadas no
								conteúdo do post. Você pode removê-las para economizar espaço de
								armazenamento.
							</p>
							<div className="flex flex-wrap gap-2 mb-4">
								{unusedImages.slice(0, 5).map((image, index) => (
									<span
										key={index}
										className="text-orange-100 text-xs bg-orange-600/30 backdrop-blur-sm px-3 py-1 rounded-full border border-orange-500/30"
									>
										{image.name}
									</span>
								))}
								{unusedImages.length > 5 && (
									<span className="text-orange-200 text-xs bg-orange-600/20 px-3 py-1 rounded-full">
										+{unusedImages.length - 5} mais...
									</span>
								)}
							</div>
						</div>
					</div>
				</div>
			)}

			{/* Preview Modal */}
			<ImagePreviewModal
				image={selectedImage}
				isOpen={showPreview}
				onClose={() => {
					setShowPreview(false);
					setSelectedImage(null);
				}}
			/>
		</div>
	);
};

export default PostImageGallery;
