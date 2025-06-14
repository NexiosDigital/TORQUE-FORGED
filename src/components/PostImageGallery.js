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
} from "lucide-react";
import { ContentImageService } from "../services/ContentImageService";
import toast from "react-hot-toast";

/**
 * PostImageGallery - Galeria de imagens do post atual
 * - Lista todas as imagens já enviadas para o post
 * - Preview em grid responsivo
 * - Ações: inserir no editor, remover, visualizar
 * - Gerenciamento de imagens não utilizadas
 * - Integração com ContentImageService
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
	const handleRemoveImage = async (image) => {
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
	const handleCopyUrl = async (image) => {
		try {
			await navigator.clipboard.writeText(image.url);
			toast.success("URL copiada!");
		} catch (error) {
			toast.error("Erro ao copiar URL");
		}
	};

	// Preview modal
	const ImagePreviewModal = ({ image, isOpen, onClose }) => {
		if (!isOpen || !image) return null;

		return (
			<div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
				<div className="relative max-w-4xl max-h-[90vh] w-full">
					<button
						onClick={onClose}
						className="absolute -top-12 right-0 p-2 rounded-full bg-gray-800 hover:bg-gray-700 text-white transition-colors duration-300"
					>
						<X className="w-5 h-5" />
					</button>

					<div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-3xl overflow-hidden border border-gray-700/50">
						<div className="p-4 border-b border-gray-700/50">
							<h3 className="text-white font-semibold">{image.name}</h3>
							<p className="text-gray-400 text-sm">
								{image.size
									? `${(image.size / 1024).toFixed(1)} KB`
									: "Tamanho não disponível"}
							</p>
						</div>

						<div className="max-h-[70vh] overflow-auto">
							<img
								src={image.url}
								alt={image.name}
								className="w-full h-auto"
								loading="lazy"
							/>
						</div>

						<div className="p-4 flex justify-center space-x-3">
							<button
								onClick={() => handleInsertImage(image)}
								className="flex items-center space-x-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white px-4 py-2 rounded-xl font-semibold transition-all duration-300"
							>
								<Plus className="w-4 h-4" />
								<span>Inserir no Editor</span>
							</button>
							<button
								onClick={() => handleCopyUrl(image)}
								className="flex items-center space-x-2 bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-xl font-semibold transition-colors duration-300"
							>
								<Copy className="w-4 h-4" />
								<span>Copiar URL</span>
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
			<div className={`space-y-4 ${className}`}>
				<div className="flex items-center justify-between">
					<h3 className="text-xl font-bold text-white">Galeria de Imagens</h3>
				</div>

				<div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
					{Array.from({ length: 6 }).map((_, i) => (
						<div key={i} className="animate-pulse">
							<div className="aspect-square bg-gray-700 rounded-xl"></div>
						</div>
					))}
				</div>
			</div>
		);
	}

	// Empty state
	if (!postSlug) {
		return (
			<div className={`text-center py-8 ${className}`}>
				<Folder className="w-12 h-12 text-gray-500 mx-auto mb-4" />
				<h3 className="text-gray-400 font-semibold mb-2">
					Galeria não disponível
				</h3>
				<p className="text-gray-500 text-sm">
					Salve o post primeiro para usar a galeria de imagens
				</p>
			</div>
		);
	}

	return (
		<div className={`space-y-6 ${className}`}>
			{/* Header */}
			<div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0">
				<div>
					<h3 className="text-xl font-bold text-white">Galeria de Imagens</h3>
					<p className="text-gray-400 text-sm">
						{images.length === 0
							? "Nenhuma imagem enviada ainda"
							: `${images.length} imagem(ns) • ${unusedImages.length} não utilizada(s)`}
					</p>
				</div>

				<div className="flex items-center space-x-3">
					{unusedImages.length > 0 && (
						<button
							onClick={handleCleanupUnused}
							disabled={loadingCleanup}
							className="flex items-center space-x-2 bg-orange-600 hover:bg-orange-700 text-white px-3 py-2 rounded-xl text-sm font-semibold transition-colors duration-300 disabled:opacity-50"
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
						className="flex items-center space-x-2 bg-gray-700 hover:bg-gray-600 text-white px-3 py-2 rounded-xl text-sm font-semibold transition-colors duration-300"
					>
						<RotateCcw className="w-4 h-4" />
						<span>Atualizar</span>
					</button>

					{onUploadNewImage && (
						<button
							onClick={onUploadNewImage}
							className="flex items-center space-x-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white px-3 py-2 rounded-xl text-sm font-semibold transition-all duration-300 shadow-lg hover:shadow-blue-500/25"
						>
							<Plus className="w-4 h-4" />
							<span>Nova Imagem</span>
						</button>
					)}
				</div>
			</div>

			{/* Gallery Grid */}
			{images.length === 0 ? (
				<div className="text-center py-12 bg-gray-800/30 rounded-2xl border-2 border-dashed border-gray-600">
					<ImageIcon className="w-16 h-16 text-gray-500 mx-auto mb-4" />
					<h4 className="text-gray-400 font-semibold mb-2">
						Nenhuma imagem na galeria
					</h4>
					<p className="text-gray-500 text-sm mb-6">
						Use o botão "Imagem" na toolbar para fazer upload
					</p>
					{onUploadNewImage && (
						<button
							onClick={onUploadNewImage}
							className="inline-flex items-center space-x-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white px-6 py-3 rounded-xl font-semibold transition-all duration-300 shadow-lg hover:shadow-blue-500/25"
						>
							<Plus className="w-4 h-4" />
							<span>Adicionar Primeira Imagem</span>
						</button>
					)}
				</div>
			) : (
				<div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
					{images.map((image, index) => {
						const isUnused = unusedImages.some(
							(unused) => unused.path === image.path
						);

						return (
							<div
								key={`${image.path}-${index}`}
								className={`group relative rounded-2xl overflow-hidden border-2 transition-all duration-300 ${
									isUnused
										? "border-orange-500/30 bg-orange-500/5"
										: "border-gray-700/50 hover:border-blue-500/50"
								}`}
							>
								{/* Image */}
								<div className="aspect-square relative overflow-hidden bg-gray-800">
									<img
										src={image.url}
										alt={image.name}
										className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
										loading="lazy"
										onError={(e) => {
											e.target.style.display = "none";
											e.target.nextSibling.style.display = "flex";
										}}
									/>

									{/* Fallback quando imagem falha */}
									<div className="hidden w-full h-full flex items-center justify-center bg-gray-700">
										<ImageIcon className="w-8 h-8 text-gray-500" />
									</div>
								</div>

								{/* Overlay */}
								<div className="absolute inset-0 bg-black/0 group-hover:bg-black/60 transition-all duration-300 flex items-center justify-center opacity-0 group-hover:opacity-100">
									<div className="flex items-center space-x-2">
										<button
											onClick={() => handleInsertImage(image)}
											className="p-2 bg-blue-600 hover:bg-blue-700 text-white rounded-full transition-colors duration-300"
											title="Inserir no editor"
										>
											<Plus className="w-4 h-4" />
										</button>

										<button
											onClick={() => {
												setSelectedImage(image);
												setShowPreview(true);
											}}
											className="p-2 bg-gray-600 hover:bg-gray-700 text-white rounded-full transition-colors duration-300"
											title="Visualizar"
										>
											<Eye className="w-4 h-4" />
										</button>

										<button
											onClick={() => handleRemoveImage(image)}
											className="p-2 bg-red-600 hover:bg-red-700 text-white rounded-full transition-colors duration-300"
											title="Remover"
										>
											<Trash2 className="w-4 h-4" />
										</button>
									</div>
								</div>

								{/* Labels */}
								<div className="absolute top-2 left-2 flex items-center space-x-1">
									{isUnused && (
										<span className="px-2 py-1 bg-orange-600 text-white text-xs font-bold rounded-full">
											Não usada
										</span>
									)}
								</div>

								{/* Info */}
								<div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-3">
									<p className="text-white text-xs font-medium truncate">
										{image.name}
									</p>
									{image.size && (
										<p className="text-gray-300 text-xs">
											{(image.size / 1024).toFixed(1)} KB
										</p>
									)}
								</div>
							</div>
						);
					})}
				</div>
			)}

			{/* Alerta sobre imagens não utilizadas */}
			{unusedImages.length > 0 && (
				<div className="bg-orange-500/10 border border-orange-500/20 rounded-xl p-4">
					<div className="flex items-start space-x-3">
						<AlertCircle className="w-5 h-5 text-orange-400 flex-shrink-0 mt-0.5" />
						<div className="flex-1">
							<h4 className="text-orange-400 font-semibold mb-2">
								{unusedImages.length} imagem(ns) não utilizada(s)
							</h4>
							<p className="text-orange-300 text-sm mb-3">
								Estas imagens foram enviadas mas não estão sendo usadas no
								conteúdo do post. Você pode removê-las para economizar espaço.
							</p>
							<div className="flex flex-wrap gap-2">
								{unusedImages.slice(0, 5).map((image, index) => (
									<span
										key={index}
										className="text-orange-200 text-xs bg-orange-500/20 px-2 py-1 rounded"
									>
										{image.name}
									</span>
								))}
								{unusedImages.length > 5 && (
									<span className="text-orange-200 text-xs">
										+{unusedImages.length - 5} mais
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
