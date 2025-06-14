import React, { useState, useRef } from "react";
import {
	X,
	Upload,
	Image as ImageIcon,
	AlertCircle,
	Check,
	Camera,
} from "lucide-react";
import { ContentImageService } from "../services/ContentImageService";
import toast from "react-hot-toast";

/**
 * ImageUploadModal - Modal para upload inline de imagens durante a escrita
 * - Upload rápido e intuitivo
 * - Preview em tempo real
 * - Inserção automática de markdown
 * - Validação visual
 */

const ImageUploadModal = ({
	isOpen,
	onClose,
	onImageUploaded,
	postSlug = "temp-post",
}) => {
	const fileInputRef = useRef(null);

	// Estados do modal
	const [selectedFile, setSelectedFile] = useState(null);
	const [previewUrl, setPreviewUrl] = useState(null);
	const [description, setDescription] = useState("");
	const [isUploading, setIsUploading] = useState(false);
	const [uploadProgress, setUploadProgress] = useState(0);
	const [validationErrors, setValidationErrors] = useState([]);
	const [isValidating, setIsValidating] = useState(false);

	// Reset do modal
	const resetModal = () => {
		setSelectedFile(null);
		setPreviewUrl(null);
		setDescription("");
		setIsUploading(false);
		setUploadProgress(0);
		setValidationErrors([]);
		setIsValidating(false);
		if (fileInputRef.current) {
			fileInputRef.current.value = "";
		}
	};

	// Fechar modal
	const handleClose = () => {
		if (!isUploading) {
			resetModal();
			onClose();
		}
	};

	// Seleção de arquivo
	const handleFileSelect = async (event) => {
		const file = event.target.files[0];
		if (!file) return;

		setIsValidating(true);
		setValidationErrors([]);

		try {
			// Validar arquivo
			const validation = await ContentImageService.validateFile(file);

			if (!validation.valid) {
				setValidationErrors(validation.errors);
				setSelectedFile(null);
				setPreviewUrl(null);
				return;
			}

			// Arquivo válido - criar preview
			setSelectedFile(file);
			const reader = new FileReader();
			reader.onload = (e) => {
				setPreviewUrl(e.target.result);
			};
			reader.readAsDataURL(file);

			// Auto-gerar descrição baseada no nome do arquivo
			const autoDescription = file.name
				.replace(/\.[^/.]+$/, "")
				.replace(/[-_]/g, " ")
				.replace(/\b\w/g, (l) => l.toUpperCase());
			setDescription(autoDescription);
		} catch (error) {
			setValidationErrors(["Erro ao processar arquivo"]);
		} finally {
			setIsValidating(false);
		}
	};

	// Simular progresso de upload
	const simulateProgress = () => {
		return new Promise((resolve) => {
			let progress = 0;
			const interval = setInterval(() => {
				progress += Math.random() * 20;
				if (progress >= 90) {
					setUploadProgress(90);
					clearInterval(interval);
					resolve();
				} else {
					setUploadProgress(Math.min(progress, 90));
				}
			}, 150);
		});
	};

	// Upload da imagem
	const handleUpload = async () => {
		if (!selectedFile) {
			toast.error("Selecione uma imagem primeiro");
			return;
		}

		try {
			setIsUploading(true);
			setValidationErrors([]);

			// Simular progresso visual
			const progressPromise = simulateProgress();

			// Upload real
			const uploadPromise = ContentImageService.uploadContentImage(
				selectedFile,
				postSlug,
				description
			);

			// Aguardar ambos
			const [_, uploadResult] = await Promise.all([
				progressPromise,
				uploadPromise,
			]);

			// Finalizar progresso
			setUploadProgress(100);

			// Gerar markdown
			const markdown = ContentImageService.generateImageMarkdown(
				uploadResult,
				description
			);

			// Callback para inserir no editor
			if (onImageUploaded) {
				onImageUploaded({
					markdown,
					imageUrl: uploadResult.image_url,
					imagePath: uploadResult.image_path,
					description,
				});
			}

			toast.success("Imagem inserida no editor!");

			// Fechar modal após sucesso
			setTimeout(() => {
				handleClose();
			}, 500);
		} catch (error) {
			console.error("❌ Upload error:", error);
			toast.error(error.message || "Erro ao fazer upload da imagem");
		} finally {
			setIsUploading(false);
			setUploadProgress(0);
		}
	};

	// Não renderizar se não estiver aberto
	if (!isOpen) return null;

	return (
		<div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
			<div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-3xl border border-gray-700/50 max-w-lg w-full max-h-[90vh] overflow-y-auto">
				{/* Header */}
				<div className="flex items-center justify-between p-6 border-b border-gray-700/50">
					<div className="flex items-center space-x-3">
						<div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl flex items-center justify-center">
							<ImageIcon className="w-5 h-5 text-white" />
						</div>
						<div>
							<h2 className="text-xl font-bold text-white">Inserir Imagem</h2>
							<p className="text-gray-400 text-sm">
								Upload de imagem para o conteúdo
							</p>
						</div>
					</div>
					<button
						onClick={handleClose}
						disabled={isUploading}
						className="p-2 rounded-xl text-gray-400 hover:text-white hover:bg-gray-700/50 transition-colors duration-300 disabled:opacity-50"
					>
						<X className="w-5 h-5" />
					</button>
				</div>

				{/* Content */}
				<div className="p-6 space-y-6">
					{/* Upload Area */}
					<div>
						<input
							ref={fileInputRef}
							type="file"
							accept="image/*"
							onChange={handleFileSelect}
							className="hidden"
							disabled={isUploading}
						/>

						{!previewUrl ? (
							/* Upload Zone */
							<div
								onClick={() => fileInputRef.current?.click()}
								className="relative w-full h-48 border-2 border-dashed border-gray-600 hover:border-blue-500 rounded-2xl cursor-pointer transition-colors duration-300 flex flex-col items-center justify-center bg-gray-800/30 hover:bg-gray-800/50"
							>
								{isValidating ? (
									<div className="text-center">
										<div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
										<p className="text-blue-400 font-medium">Validando...</p>
									</div>
								) : (
									<div className="text-center">
										<Camera className="w-12 h-12 text-gray-500 mx-auto mb-4" />
										<p className="text-white font-semibold mb-2">
											Clique para selecionar imagem
										</p>
										<p className="text-gray-400 text-sm">
											JPG, PNG, WebP ou GIF até 8MB
										</p>
										<p className="text-gray-500 text-xs mt-1">
											Mínimo: 400x300px
										</p>
									</div>
								)}
							</div>
						) : (
							/* Preview Area */
							<div className="space-y-4">
								<div className="relative rounded-2xl overflow-hidden">
									<img
										src={previewUrl}
										alt="Preview"
										className="w-full h-48 object-cover"
									/>
									{isUploading && (
										<div className="absolute inset-0 bg-black/70 flex flex-col items-center justify-center">
											<div className="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin mb-3"></div>
											<span className="text-white text-sm font-semibold mb-1">
												Fazendo upload...
											</span>
											<span className="text-white text-xs">
												{uploadProgress}%
											</span>
										</div>
									)}
								</div>

								{/* Informações do arquivo */}
								{selectedFile && (
									<div className="bg-gray-800/30 rounded-xl p-4 border border-gray-700/30">
										<div className="text-sm text-gray-400 space-y-1">
											<p>
												<strong>Arquivo:</strong> {selectedFile.name}
											</p>
											<p>
												<strong>Tamanho:</strong>{" "}
												{(selectedFile.size / 1024 / 1024).toFixed(2)} MB
											</p>
										</div>
									</div>
								)}

								{/* Botão para trocar imagem */}
								{!isUploading && (
									<button
										onClick={() => fileInputRef.current?.click()}
										className="w-full text-blue-400 hover:text-blue-300 text-sm font-medium py-2 border border-blue-500/30 hover:border-blue-500/50 rounded-xl transition-colors duration-300"
									>
										Trocar Imagem
									</button>
								)}
							</div>
						)}
					</div>

					{/* Campo de Descrição */}
					{previewUrl && (
						<div>
							<label className="block text-white font-semibold mb-3">
								Descrição da Imagem
							</label>
							<input
								type="text"
								value={description}
								onChange={(e) => setDescription(e.target.value)}
								disabled={isUploading}
								className="w-full px-4 py-3 bg-gray-800/50 border border-gray-600/50 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-blue-500/50 focus:bg-gray-800 transition-all duration-300 disabled:opacity-50"
								placeholder="Ex: Aston Martin Valkyrie LM na pista"
								maxLength={100}
							/>
							<p className="text-gray-500 text-xs mt-2">
								Será usado como texto alternativo (alt) da imagem
							</p>
						</div>
					)}

					{/* Barra de progresso */}
					{isUploading && (
						<div className="space-y-2">
							<div className="flex justify-between text-sm">
								<span className="text-gray-400">Progresso do upload</span>
								<span className="text-blue-400">{uploadProgress}%</span>
							</div>
							<div className="w-full h-2 bg-gray-700 rounded-full overflow-hidden">
								<div
									className="h-full bg-gradient-to-r from-blue-600 to-purple-600 transition-all duration-300 rounded-full"
									style={{ width: `${uploadProgress}%` }}
								></div>
							</div>
						</div>
					)}

					{/* Erros de validação */}
					{validationErrors.length > 0 && (
						<div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4">
							<div className="flex items-start space-x-3">
								<AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
								<div>
									<h4 className="text-red-400 font-semibold mb-2">
										Arquivo Inválido
									</h4>
									<ul className="text-red-300 text-sm space-y-1">
										{validationErrors.map((error, index) => (
											<li key={index}>• {error}</li>
										))}
									</ul>
								</div>
							</div>
						</div>
					)}

					{/* Dicas */}
					{!selectedFile && validationErrors.length === 0 && (
						<div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4">
							<h4 className="text-blue-400 font-semibold mb-2">💡 Dicas</h4>
							<ul className="text-blue-300 text-sm space-y-1">
								<li>• Use imagens em alta resolução para melhor qualidade</li>
								<li>• Adicione uma descrição clara para acessibilidade</li>
								<li>• A imagem será otimizada automaticamente</li>
							</ul>
						</div>
					)}
				</div>

				{/* Footer */}
				<div className="flex items-center justify-end space-x-3 p-6 border-t border-gray-700/50">
					<button
						onClick={handleClose}
						disabled={isUploading}
						className="px-6 py-3 text-gray-300 hover:text-white border border-gray-600 hover:border-gray-500 rounded-xl font-semibold transition-colors duration-300 disabled:opacity-50"
					>
						Cancelar
					</button>
					<button
						onClick={handleUpload}
						disabled={!selectedFile || isUploading}
						className="flex items-center space-x-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white px-6 py-3 rounded-xl font-semibold transition-all duration-300 shadow-lg hover:shadow-blue-500/25 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
					>
						{isUploading ? (
							<>
								<div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
								<span>Inserindo...</span>
							</>
						) : (
							<>
								<Upload className="w-4 h-4" />
								<span>Inserir no Editor</span>
							</>
						)}
					</button>
				</div>
			</div>
		</div>
	);
};

export default ImageUploadModal;
