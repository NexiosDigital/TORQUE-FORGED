import React, { useState, useRef, useEffect } from "react";
import {
	Camera,
	X,
	Image as ImageIcon,
	AlertCircle,
	Check,
	Upload,
	ArrowLeft,
} from "lucide-react";
import { ImageUploadService } from "../services/ImageUploadService";
import toast from "react-hot-toast";

/**
 * ImageUpload - VERSÃO CORRIGIDA PARA EDIÇÃO DE POSTS
 * - Preview em tempo real
 * - Validação visual
 * - Progresso de upload
 * - Estados de loading e erro
 * - Sincronização correta para edição
 * - Prevenção de reversão após upload
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
	const [uploadStatus, setUploadStatus] = useState(null); // 'success' | 'error' | null

	// Estado para controlar se uma nova imagem foi carregada
	const [hasNewImage, setHasNewImage] = useState(false);

	// Referência para a URL original (para evitar reversão)
	const originalUrlRef = useRef(value);

	// Atualizar preview quando value mudar - APENAS SE NÃO HÁ NOVA IMAGEM
	useEffect(() => {
		if (!hasNewImage) {
			setPreviewUrl(value);
			originalUrlRef.current = value;
		}
	}, [value, hasNewImage]);

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
		setUploadStatus(null);

		try {
			const validation = await ImageUploadService.validateFile(file);

			if (!validation.valid) {
				setValidationErrors(validation.errors);
				setSelectedFile(null);
				// Manter preview atual (não reverter)
				return false;
			}

			// Arquivo válido - criar preview
			const reader = new FileReader();
			reader.onload = (e) => {
				setPreviewUrl(e.target.result);
				setHasNewImage(true); // Marcar que há nova imagem
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
	 * Lidar com seleção de arquivo - SEM UPLOAD AUTOMÁTICO
	 */
	const handleFileSelect = async (event) => {
		const file = event.target.files[0];
		if (!file) return;

		setSelectedFile(file);
		setUploadStatus(null);

		const isValid = await validateSelectedFile(file);

		if (isValid) {
		}
	};

	/**
	 * Realizar upload da imagem - VERSÃO CORRIGIDA PARA EDIÇÃO
	 */
	const handleUpload = async () => {
		if (!selectedFile) {
			toast.error("Nenhum arquivo selecionado");
			return;
		}

		try {
			setIsUploading(true);
			setUploadProgress(0);
			setValidationErrors([]);
			setUploadStatus(null);

			if (onUploadStart) onUploadStart();

			// Simular progresso visual
			const progressPromise = simulateProgress();

			// Upload real
			const uploadPromise = ImageUploadService.uploadPostImage(
				selectedFile,
				postSlug
			);

			// Aguardar ambos
			const [_, uploadResult] = await Promise.all([
				progressPromise,
				uploadPromise,
			]);

			// Finalizar progresso
			setUploadProgress(100);

			// Atualizar estado local - MANTER A NOVA IMAGEM
			setPreviewUrl(uploadResult.image_url);
			setSelectedFile(null);
			setUploadStatus("success");
			setHasNewImage(true); // Garantir que não reverta

			// Reset input
			if (fileInputRef.current) {
				fileInputRef.current.value = "";
			}

			// IMPORTANTE: Callback para o componente pai
			if (onChange) {
				onChange({
					image_url: uploadResult.image_url,
					image_path: uploadResult.image_path,
				});
			}

			toast.success("Nova imagem carregada com sucesso!");
		} catch (error) {
			console.error("❌ Erro no upload da imagem (edição):", error);

			setUploadStatus("error");
			toast.error(error.message || "Erro ao fazer upload da imagem");

			// Em caso de erro, voltar para estado anterior
			setPreviewUrl(originalUrlRef.current || value);
			setSelectedFile(null);
			setHasNewImage(false);

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
		setUploadStatus(null);
		setHasNewImage(true); // Marcar como alterado

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
		setValidationErrors([]);
		setUploadStatus(null);

		// Voltar para imagem atual (original ou já alterada)
		if (hasNewImage) {
			// Se já tinha nova imagem, manter
			// setPreviewUrl permanece como está
		} else {
			// Se não tinha nova imagem, voltar para original
			setPreviewUrl(value);
		}

		if (fileInputRef.current) {
			fileInputRef.current.value = "";
		}
	};

	/**
	 * Reverter para imagem original (para edição)
	 */
	const handleRevertToOriginal = () => {
		if (originalUrlRef.current) {
			setPreviewUrl(originalUrlRef.current);
			setSelectedFile(null);
			setValidationErrors([]);
			setUploadStatus(null);
			setHasNewImage(false);

			if (fileInputRef.current) {
				fileInputRef.current.value = "";
			}

			// Callback para restaurar imagem original
			if (onChange) {
				onChange({
					image_url: originalUrlRef.current,
					image_path: null, // Path original não temos aqui
				});
			}

			toast.success("Imagem original restaurada");
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

						{/* Indicador de status */}
						{uploadStatus === "success" && !isUploading && (
							<div className="absolute top-4 right-4">
								<div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center shadow-lg">
									<Check className="w-5 h-5 text-white" />
								</div>
							</div>
						)}

						{uploadStatus === "error" && !isUploading && (
							<div className="absolute top-4 right-4">
								<div className="w-8 h-8 bg-red-500 rounded-full flex items-center justify-center shadow-lg">
									<X className="w-5 h-5 text-white" />
								</div>
							</div>
						)}

						{/* Indicador de arquivo selecionado (pronto para upload) */}
						{selectedFile && !isUploading && !uploadStatus && (
							<div className="absolute top-4 right-4">
								<div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center shadow-lg animate-pulse">
									<Upload className="w-5 h-5 text-white" />
								</div>
							</div>
						)}

						{/* Indicador de nova imagem (para edição) */}
						{hasNewImage &&
							!selectedFile &&
							!isUploading &&
							uploadStatus === "success" && (
								<div className="absolute top-4 left-4">
									<div className="px-3 py-1 bg-blue-500 rounded-full text-white text-xs font-semibold">
										Nova
									</div>
								</div>
							)}

						{/* Botão de remover (se há imagem) */}
						{previewUrl && !isUploading && !disabled && !selectedFile && (
							<button
								type="button"
								onClick={handleRemoveImage}
								className="absolute bottom-4 left-4 w-8 h-8 bg-red-500 hover:bg-red-600 rounded-full flex items-center justify-center shadow-lg transition-colors duration-300"
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
							<span>
								{previewUrl && !selectedFile
									? "Trocar Imagem"
									: "Escolher Imagem"}
							</span>
						</button>

						{/* Botão de Upload Manual */}
						{selectedFile && !isUploading && (
							<button
								type="button"
								onClick={handleUpload}
								disabled={disabled}
								className="flex items-center space-x-2 bg-gradient-to-r from-green-600 to-green-500 hover:from-green-500 hover:to-green-400 text-white px-4 py-2 rounded-xl transition-all duration-300 shadow-lg hover:shadow-green-500/25"
							>
								<Upload className="w-4 h-4" />
								<span>Fazer Upload</span>
							</button>
						)}

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

						{/* Botão para reverter à imagem original (apenas em edição) */}
						{hasNewImage &&
							originalUrlRef.current &&
							!selectedFile &&
							!isUploading && (
								<button
									type="button"
									onClick={handleRevertToOriginal}
									className="flex items-center space-x-2 bg-yellow-600 hover:bg-yellow-700 text-white px-4 py-2 rounded-xl transition-colors duration-300"
									title="Reverter para imagem original"
								>
									<ArrowLeft className="w-4 h-4" />
									<span>Original</span>
								</button>
							)}
					</div>

					{/* Status da Imagem */}
					{uploadStatus === "success" && (
						<div className="bg-green-500/10 border border-green-500/20 rounded-xl p-3">
							<div className="flex items-center space-x-2">
								<Check className="w-4 h-4 text-green-400" />
								<span className="text-green-400 text-sm font-semibold">
									{hasNewImage
										? "Nova imagem carregada! Pronto para salvar o post."
										: "Imagem carregada com sucesso!"}
								</span>
							</div>
						</div>
					)}

					{/* Indicador de nova imagem para edição */}
					{hasNewImage && !selectedFile && uploadStatus === "success" && (
						<div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-3">
							<div className="flex items-center space-x-2">
								<AlertCircle className="w-4 h-4 text-blue-400" />
								<span className="text-blue-400 text-sm font-semibold">
									Imagem atualizada - será salva quando você atualizar o post
								</span>
							</div>
						</div>
					)}

					{/* Informações sobre o arquivo */}
					<div className="text-sm text-gray-400 space-y-1">
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
							<div className="mt-3 p-2 bg-blue-500/10 border border-blue-500/20 rounded-lg">
								<p className="text-blue-400 text-xs">
									⚡ Clique em "Fazer Upload" para enviar a nova imagem
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
