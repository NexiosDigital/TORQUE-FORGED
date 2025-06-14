import React, { useState, useRef, useEffect } from "react";
import {
	Camera,
	X,
	Image as ImageIcon,
	AlertCircle,
	Check,
} from "lucide-react";
import { ImageUploadService } from "../services/ImageUploadService";
import toast from "react-hot-toast";

/**
 * ImageUpload - Componente de upload de imagem para posts
 * - Preview em tempo real
 * - Validação visual
 * - Progresso de upload
 * - Estados de loading e erro
 */

const ImageUpload = ({
	value = null, // URL atual da imagem
	onChange, // Callback quando imagem mudar
	onUploadStart,
	onUploadEnd,
	postSlug = null,
	className = "",
	disabled = false,
}) => {
	const fileInputRef = useRef(null);

	// Estados do componente
	const [isUploading, setIsUploading] = useState(false);
	const [uploadProgress, setUploadProgress] = useState(0);
	const [previewUrl, setPreviewUrl] = useState(value);
	const [selectedFile, setSelectedFile] = useState(null);
	const [validationErrors, setValidationErrors] = useState([]);
	const [isValidating, setIsValidating] = useState(false);

	// Atualizar preview quando value mudar
	useEffect(() => {
		setPreviewUrl(value);
	}, [value]);

	/**
	 * Simular progresso de upload realista
	 */
	const simulateProgress = () => {
		return new Promise((resolve) => {
			let progress = 0;
			const interval = setInterval(() => {
				progress += Math.random() * 15;
				if (progress >= 90) {
					setUploadProgress(90);
					clearInterval(interval);
					resolve();
				} else {
					setUploadProgress(Math.min(progress, 90));
				}
			}, 200);
		});
	};

	/**
	 * Validar arquivo selecionado
	 */
	const validateSelectedFile = async (file) => {
		setIsValidating(true);
		setValidationErrors([]);

		try {
			const validation = await ImageUploadService.validateFile(file);

			if (!validation.valid) {
				setValidationErrors(validation.errors);
				setSelectedFile(null);
				setPreviewUrl(value); // Voltar para a imagem anterior
				return false;
			}

			// Arquivo válido - criar preview
			const reader = new FileReader();
			reader.onload = (e) => {
				setPreviewUrl(e.target.result);
			};
			reader.readAsDataURL(file);

			return true;
		} catch (error) {
			setValidationErrors(["Erro ao validar arquivo"]);
			return false;
		} finally {
			setIsValidating(false);
		}
	};

	/**
	 * Lidar com seleção de arquivo
	 */
	const handleFileSelect = async (event) => {
		const file = event.target.files[0];
		if (!file) return;

		setSelectedFile(file);
		const isValid = await validateSelectedFile(file);

		if (isValid) {
			// Fazer upload automaticamente
			handleUpload(file);
		}
	};

	/**
	 * Realizar upload da imagem
	 */
	const handleUpload = async (file = selectedFile) => {
		if (!file) {
			toast.error("Nenhum arquivo selecionado");
			return;
		}

		try {
			setIsUploading(true);
			setUploadProgress(0);

			if (onUploadStart) onUploadStart();

			// Simular progresso visual
			const progressPromise = simulateProgress();

			// Upload real
			const uploadPromise = ImageUploadService.uploadPostImage(file, postSlug);

			// Aguardar ambos
			const [_, uploadResult] = await Promise.all([
				progressPromise,
				uploadPromise,
			]);

			// Finalizar progresso
			setUploadProgress(100);

			// Atualizar estado
			setPreviewUrl(uploadResult.image_url);
			setSelectedFile(null);

			// Reset input
			if (fileInputRef.current) {
				fileInputRef.current.value = "";
			}

			// Callback de sucesso
			if (onChange) {
				onChange({
					image_url: uploadResult.image_url,
					image_path: uploadResult.image_path,
				});
			}

			toast.success("Imagem carregada com sucesso!");
		} catch (error) {
			console.error("❌ Image upload error:", error);
			toast.error(error.message || "Erro ao fazer upload da imagem");

			// Voltar para estado anterior em caso de erro
			setPreviewUrl(value);
			setSelectedFile(null);

			if (fileInputRef.current) {
				fileInputRef.current.value = "";
			}
		} finally {
			setIsUploading(false);
			setUploadProgress(0);
			if (onUploadEnd) onUploadEnd();
		}
	};

	/**
	 * Remover imagem atual
	 */
	const handleRemoveImage = () => {
		setPreviewUrl(null);
		setSelectedFile(null);
		setValidationErrors([]);

		if (fileInputRef.current) {
			fileInputRef.current.value = "";
		}

		// Callback para remover
		if (onChange) {
			onChange({
				image_url: null,
				image_path: null,
			});
		}

		toast.success("Imagem removida");
	};

	/**
	 * Cancelar seleção atual
	 */
	const handleCancelSelection = () => {
		setSelectedFile(null);
		setPreviewUrl(value);
		setValidationErrors([]);

		if (fileInputRef.current) {
			fileInputRef.current.value = "";
		}
	};

	return (
		<div className={`image-upload-container ${className}`}>
			{/* Input de arquivo oculto */}
			<input
				ref={fileInputRef}
				type="file"
				accept="image/*"
				onChange={handleFileSelect}
				className="hidden"
				disabled={disabled || isUploading}
			/>

			{/* Preview da Imagem */}
			<div className="space-y-4">
				{/* Container da imagem */}
				<div className="relative">
					<div className="relative w-full h-64 bg-gradient-to-br from-gray-800 to-gray-700 rounded-2xl overflow-hidden border-2 border-gray-600 hover:border-gray-500 transition-colors duration-300">
						{previewUrl ? (
							<>
								<img
									src={previewUrl}
									alt="Preview da imagem"
									className="w-full h-full object-cover"
									onError={(e) => {
										e.target.style.display = "none";
										e.target.nextSibling.style.display = "flex";
									}}
								/>
								{/* Fallback quando imagem falha */}
								<div className="hidden w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-800 to-gray-700">
									<ImageIcon className="w-16 h-16 text-gray-500" />
								</div>
							</>
						) : (
							/* Placeholder quando não há imagem */
							<div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-gray-800 to-gray-700">
								<ImageIcon className="w-16 h-16 text-gray-500 mb-4" />
								<p className="text-gray-400 text-lg font-medium">
									Nenhuma imagem selecionada
								</p>
								<p className="text-gray-500 text-sm">
									Clique em "Escolher Imagem" para fazer upload
								</p>
							</div>
						)}

						{/* Overlay de loading */}
						{isUploading && (
							<div className="absolute inset-0 bg-black/70 flex flex-col items-center justify-center">
								<div className="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin mb-4"></div>
								<span className="text-white text-sm font-semibold mb-2">
									Fazendo upload...
								</span>
								<span className="text-white text-xs">{uploadProgress}%</span>
							</div>
						)}

						{/* Overlay de validação */}
						{isValidating && (
							<div className="absolute inset-0 bg-black/70 flex flex-col items-center justify-center">
								<div className="w-6 h-6 border-2 border-yellow-400 border-t-transparent rounded-full animate-spin mb-2"></div>
								<span className="text-yellow-400 text-sm">Validando...</span>
							</div>
						)}

						{/* Indicador de arquivo novo */}
						{selectedFile && !isUploading && (
							<div className="absolute top-4 right-4">
								<div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center shadow-lg">
									<Check className="w-5 h-5 text-white" />
								</div>
							</div>
						)}

						{/* Botão de remover (se há imagem) */}
						{previewUrl && !isUploading && !disabled && (
							<button
								type="button"
								onClick={handleRemoveImage}
								className="absolute top-4 left-4 w-8 h-8 bg-red-500 hover:bg-red-600 rounded-full flex items-center justify-center shadow-lg transition-colors duration-300"
								title="Remover imagem"
							>
								<X className="w-5 h-5 text-white" />
							</button>
						)}
					</div>

					{/* Barra de progresso */}
					{isUploading && (
						<div className="absolute -bottom-2 left-0 right-0">
							<div className="w-full h-2 bg-gray-700 rounded-full overflow-hidden">
								<div
									className="h-full bg-gradient-to-r from-red-600 to-red-500 transition-all duration-300 rounded-full"
									style={{ width: `${uploadProgress}%` }}
								></div>
							</div>
						</div>
					)}
				</div>

				{/* Controles */}
				<div className="space-y-4">
					{/* Botões de ação */}
					<div className="flex flex-wrap gap-3">
						<button
							type="button"
							onClick={() => fileInputRef.current?.click()}
							disabled={disabled || isUploading}
							className="flex items-center space-x-2 bg-gray-700 hover:bg-gray-600 disabled:opacity-50 text-white px-4 py-2 rounded-xl transition-colors duration-300"
						>
							<Camera className="w-4 h-4" />
							<span>{previewUrl ? "Trocar Imagem" : "Escolher Imagem"}</span>
						</button>

						{selectedFile && !isUploading && (
							<button
								type="button"
								onClick={handleCancelSelection}
								className="flex items-center space-x-2 bg-gray-600 hover:bg-gray-500 text-white px-4 py-2 rounded-xl transition-colors duration-300"
							>
								<X className="w-4 h-4" />
								<span>Cancelar</span>
							</button>
						)}
					</div>

					{/* Informações sobre o arquivo */}
					<div className="text-sm text-gray-400 space-y-1">
						<p>• Formatos aceitos: JPG, PNG, WebP, GIF</p>
						<p>• Tamanho máximo: 10MB</p>
						<p>• Dimensões mínimas: 800x600px</p>
						<p>• Recomendado: 1920x1080px para melhor qualidade</p>
					</div>

					{/* Arquivo selecionado */}
					{selectedFile && (
						<div className="bg-gray-800/30 rounded-xl p-3 border border-gray-700/30">
							<h4 className="text-white font-medium mb-2">
								Arquivo Selecionado:
							</h4>
							<div className="text-sm text-gray-400">
								<p>
									<strong>Nome:</strong> {selectedFile.name}
								</p>
								<p>
									<strong>Tamanho:</strong>{" "}
									{(selectedFile.size / 1024 / 1024).toFixed(2)} MB
								</p>
								<p>
									<strong>Tipo:</strong> {selectedFile.type}
								</p>
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
				</div>
			</div>
		</div>
	);
};

export default ImageUpload;
