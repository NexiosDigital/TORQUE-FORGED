import React, { useState, useRef, useEffect } from "react";
import { Camera, Upload, X, User, AlertCircle, Check } from "lucide-react";
import { AvatarService } from "../services/AvatarService";
import { useAuth } from "../contexts/AuthContext";
import toast from "react-hot-toast";
import { supabase } from "../lib/supabase";

/**
 * AvatarUpload - Componente completo de upload de avatar
 * - Preview em tempo real
 * - Validação visual
 * - Progresso de upload
 * - Estados de loading e erro
 * - Operações atômicas
 */

const AvatarUpload = ({
	size = 120,
	className = "",
	onUploadSuccess,
	onUploadError,
	showRemoveButton = true,
}) => {
	const { user, profile, updateProfile } = useAuth();
	const fileInputRef = useRef(null);

	// Estados do componente
	const [isUploading, setIsUploading] = useState(false);
	const [uploadProgress, setUploadProgress] = useState(0);
	const [previewUrl, setPreviewUrl] = useState(null);
	const [selectedFile, setSelectedFile] = useState(null);
	const [validationErrors, setValidationErrors] = useState([]);
	const [isValidating, setIsValidating] = useState(false);

	// Estado atual do avatar
	const currentAvatarUrl = previewUrl || profile?.avatar_url;

	// Limpar preview quando profile.avatar_url mudar
	useEffect(() => {
		if (!previewUrl && profile?.avatar_url) {
			// Se não há preview local, usar avatar do profile
			return;
		}
	}, [profile?.avatar_url, previewUrl]);

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
			const validation = await AvatarService.validateFile(file);

			if (!validation.valid) {
				setValidationErrors(validation.errors);
				setSelectedFile(null);
				setPreviewUrl(null);
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
			// Opcionalmente fazer upload automaticamente
			// handleUpload();
		}
	};

	/**
	 * Realizar upload do avatar
	 */
	const handleUpload = async () => {
		if (!selectedFile || !user?.id) {
			toast.error("Nenhum arquivo selecionado");
			return;
		}

		try {
			setIsUploading(true);
			setUploadProgress(0);

			// Simular progresso visual
			const progressPromise = simulateProgress();

			// Upload real
			const uploadPromise = AvatarService.uploadAvatarAtomic(
				selectedFile,
				user.id
			);

			// Aguardar ambos
			const [_, uploadResult] = await Promise.all([
				progressPromise,
				uploadPromise,
			]);

			// Finalizar progresso
			setUploadProgress(100);

			// Atualizar contexto local (o serviço já atualizou o banco)
			if (updateProfile) {
				await updateProfile({
					avatar_url: uploadResult.avatar_url,
					avatar_path: uploadResult.avatar_path,
				});
			}

			// Limpar estado
			setSelectedFile(null);
			setPreviewUrl(null);

			// Reset input
			if (fileInputRef.current) {
				fileInputRef.current.value = "";
			}

			toast.success("Avatar atualizado com sucesso!");

			// Callback de sucesso
			if (onUploadSuccess) {
				onUploadSuccess(uploadResult);
			}
		} catch (error) {
			console.error("❌ Avatar upload error:", error);
			toast.error(error.message || "Erro ao fazer upload do avatar");

			// Callback de erro
			if (onUploadError) {
				onUploadError(error);
			}
		} finally {
			setIsUploading(false);
			setUploadProgress(0);
		}
	};

	/**
	 * Remover avatar atual
	 */
	const handleRemoveAvatar = async () => {
		if (!user?.id) return;

		try {
			setIsUploading(true);

			await AvatarService.removeAvatar(user.id);

			// Atualizar contexto local
			if (updateProfile) {
				await updateProfile({
					avatar_url: null,
					avatar_path: null,
				});
			}

			// Limpar estados
			setPreviewUrl(null);
			setSelectedFile(null);

			if (fileInputRef.current) {
				fileInputRef.current.value = "";
			}

			toast.success("Avatar removido com sucesso!");
		} catch (error) {
			console.error("❌ Remove avatar error:", error);
			toast.error(error.message || "Erro ao remover avatar");
		} finally {
			setIsUploading(false);
		}
	};

	/**
	 * Cancelar seleção atual
	 */
	const handleCancelSelection = () => {
		setSelectedFile(null);
		setPreviewUrl(null);
		setValidationErrors([]);

		if (fileInputRef.current) {
			fileInputRef.current.value = "";
		}
	};

	return (
		<div className={`avatar-upload-container ${className}`}>
			{/* Input de arquivo oculto */}
			<input
				ref={fileInputRef}
				type="file"
				accept="image/*"
				onChange={handleFileSelect}
				className="hidden"
				disabled={isUploading}
			/>

			{/* Preview do Avatar */}
			<div className="flex items-start space-x-6">
				{/* Avatar Display */}
				<div className="relative">
					<div
						className="relative rounded-2xl overflow-hidden border-2 border-gray-600 bg-gradient-to-br from-gray-800 to-gray-700"
						style={{ width: size, height: size }}
					>
						{currentAvatarUrl ? (
							<img
								src={currentAvatarUrl}
								alt="Avatar"
								className="w-full h-full object-cover"
								onError={(e) => {
									e.target.style.display = "none";
									e.target.nextSibling.style.display = "flex";
								}}
							/>
						) : null}

						{/* Fallback quando não há avatar */}
						{!currentAvatarUrl && (
							<div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-red-600 to-red-500">
								<User className="w-1/2 h-1/2 text-white" />
							</div>
						)}

						{/* Overlay de loading */}
						{isUploading && (
							<div className="absolute inset-0 bg-black/70 flex flex-col items-center justify-center">
								<div className="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin mb-2"></div>
								<span className="text-white text-xs font-semibold">
									{uploadProgress}%
								</span>
							</div>
						)}

						{/* Overlay de validação */}
						{isValidating && (
							<div className="absolute inset-0 bg-black/70 flex items-center justify-center">
								<div className="w-6 h-6 border-2 border-yellow-400 border-t-transparent rounded-full animate-spin"></div>
							</div>
						)}

						{/* Indicador de arquivo novo */}
						{selectedFile && !isUploading && (
							<div className="absolute top-2 right-2">
								<div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
									<Check className="w-4 h-4 text-white" />
								</div>
							</div>
						)}
					</div>

					{/* Barra de progresso */}
					{isUploading && (
						<div className="absolute -bottom-3 left-0 right-0">
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
				<div className="flex-1 space-y-4">
					{/* Botões de ação */}
					<div className="flex flex-wrap gap-3">
						<button
							type="button"
							onClick={() => fileInputRef.current?.click()}
							disabled={isUploading}
							className="flex items-center space-x-2 bg-gray-700 hover:bg-gray-600 disabled:opacity-50 text-white px-4 py-2 rounded-xl transition-colors duration-300"
						>
							<Camera className="w-4 h-4" />
							<span>Escolher Foto</span>
						</button>

						{selectedFile && !isUploading && (
							<>
								<button
									type="button"
									onClick={handleUpload}
									className="flex items-center space-x-2 bg-gradient-to-r from-green-600 to-green-500 hover:from-green-500 hover:to-green-400 text-white px-4 py-2 rounded-xl transition-all duration-300"
								>
									<Upload className="w-4 h-4" />
									<span>Fazer Upload</span>
								</button>

								<button
									type="button"
									onClick={handleCancelSelection}
									className="flex items-center space-x-2 bg-gray-600 hover:bg-gray-500 text-white px-4 py-2 rounded-xl transition-colors duration-300"
								>
									<X className="w-4 h-4" />
									<span>Cancelar</span>
								</button>
							</>
						)}

						{currentAvatarUrl && showRemoveButton && !selectedFile && (
							<button
								type="button"
								onClick={handleRemoveAvatar}
								disabled={isUploading}
								className="flex items-center space-x-2 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white px-4 py-2 rounded-xl transition-colors duration-300"
							>
								<X className="w-4 h-4" />
								<span>Remover</span>
							</button>
						)}
					</div>

					{/* Informações sobre o arquivo */}
					<div className="text-sm text-gray-400 space-y-1">
						<p>• Formatos aceitos: JPG, PNG, WebP, GIF</p>
						<p>• Tamanho máximo: 5MB</p>
						<p>• Dimensões mínimas: 100x100px</p>
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

export default AvatarUpload;
