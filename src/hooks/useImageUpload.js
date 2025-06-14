import { useState, useCallback } from "react";
import { ImageUploadService } from "../services/ImageUploadService";
import toast from "react-hot-toast";

/**
 * Hook personalizado para gerenciar upload de imagens
 * - Facilita uso do ImageUploadService
 * - Estados unificados
 * - Callbacks automatizados
 */

export const useImageUpload = () => {
	// Estados do hook
	const [isUploading, setIsUploading] = useState(false);
	const [uploadProgress, setUploadProgress] = useState(0);
	const [validationErrors, setValidationErrors] = useState([]);
	const [isValidating, setIsValidating] = useState(false);

	/**
	 * Validar arquivo
	 */
	const validateFile = useCallback(async (file) => {
		setIsValidating(true);
		setValidationErrors([]);

		try {
			const validation = await ImageUploadService.validateFile(file);

			if (!validation.valid) {
				setValidationErrors(validation.errors);
				return { valid: false, errors: validation.errors };
			}

			return { valid: true, errors: [] };
		} catch (error) {
			const errors = ["Erro ao validar arquivo"];
			setValidationErrors(errors);
			return { valid: false, errors };
		} finally {
			setIsValidating(false);
		}
	}, []);

	/**
	 * Upload de imagem
	 */
	const uploadImage = useCallback(
		async (file, postSlug = null, options = {}) => {
			if (!file) {
				throw new Error("Nenhum arquivo fornecido");
			}

			try {
				setIsUploading(true);
				setUploadProgress(0);
				setValidationErrors([]);

				// Callback de progresso se fornecido
				const onProgress = options.onProgress || setUploadProgress;

				// Simular progresso visual
				let progress = 0;
				const progressInterval = setInterval(() => {
					progress += Math.random() * 15;
					if (progress >= 90) {
						onProgress(90);
						clearInterval(progressInterval);
					} else {
						onProgress(Math.min(progress, 90));
					}
				}, 200);

				// Upload real
				const result = await ImageUploadService.uploadPostImage(file, postSlug);

				// Finalizar progresso
				clearInterval(progressInterval);
				onProgress(100);

				// Callback de sucesso
				if (options.onSuccess) {
					options.onSuccess(result);
				}

				toast.success("Imagem carregada com sucesso!");

				return result;
			} catch (error) {
				console.error("❌ useImageUpload upload error:", error);

				// Callback de erro
				if (options.onError) {
					options.onError(error);
				}

				toast.error(error.message || "Erro ao fazer upload da imagem");
				throw error;
			} finally {
				setIsUploading(false);
				setUploadProgress(0);
			}
		},
		[]
	);

	/**
	 * Remover imagem
	 */
	const removeImage = useCallback(async (imagePath, options = {}) => {
		try {
			setIsUploading(true);

			await ImageUploadService.removePostImage(imagePath);

			// Callback de sucesso
			if (options.onSuccess) {
				options.onSuccess();
			}

			toast.success("Imagem removida com sucesso!");
		} catch (error) {
			console.error("❌ useImageUpload remove error:", error);

			// Callback de erro
			if (options.onError) {
				options.onError(error);
			}

			toast.error(error.message || "Erro ao remover imagem");
			throw error;
		} finally {
			setIsUploading(false);
		}
	}, []);

	/**
	 * Obter URL otimizada
	 */
	const getOptimizedUrl = useCallback((imagePath, size = "800x600") => {
		return ImageUploadService.getOptimizedImageUrl(imagePath, size);
	}, []);

	/**
	 * Obter URL original
	 */
	const getOriginalUrl = useCallback((imagePath) => {
		return ImageUploadService.getOriginalImageUrl(imagePath);
	}, []);

	/**
	 * Comprimir imagem (utilitário)
	 */
	const compressImage = useCallback(async (file, quality = 0.85) => {
		return ImageUploadService.compressImage(file, quality);
	}, []);

	/**
	 * Resetar estados
	 */
	const resetStates = useCallback(() => {
		setIsUploading(false);
		setUploadProgress(0);
		setValidationErrors([]);
		setIsValidating(false);
	}, []);

	return {
		// Estados
		isUploading,
		uploadProgress,
		validationErrors,
		isValidating,

		// Métodos principais
		validateFile,
		uploadImage,
		removeImage,

		// Utilitários
		getOptimizedUrl,
		getOriginalUrl,
		compressImage,
		resetStates,

		// Constantes úteis
		constants: {
			BUCKET_NAME: ImageUploadService.BUCKET_NAME,
			MAX_FILE_SIZE: ImageUploadService.MAX_FILE_SIZE,
			ALLOWED_TYPES: ImageUploadService.ALLOWED_TYPES,
			MIN_DIMENSIONS: ImageUploadService.MIN_DIMENSIONS,
			MAX_DIMENSIONS: ImageUploadService.MAX_DIMENSIONS,
		},
	};
};

/**
 * Hook para administradores - funcionalidades extras
 */
export const useImageUploadAdmin = () => {
	const [isLoading, setIsLoading] = useState(false);
	const [stats, setStats] = useState(null);

	/**
	 * Obter estatísticas do storage
	 */
	const getStorageStats = useCallback(async () => {
		try {
			setIsLoading(true);
			const result = await ImageUploadService.getStorageStats();
			setStats(result);
			return result;
		} catch (error) {
			console.error("❌ Error getting storage stats:", error);
			toast.error("Erro ao obter estatísticas");
			throw error;
		} finally {
			setIsLoading(false);
		}
	}, []);

	/**
	 * Limpeza de arquivos órfãos
	 */
	const cleanupOrphanedFiles = useCallback(async () => {
		try {
			setIsLoading(true);
			const result = await ImageUploadService.cleanupOrphanedFiles();

			toast.success(`${result.removed} arquivos órfãos removidos`);

			// Atualizar stats após limpeza
			await getStorageStats();

			return result;
		} catch (error) {
			console.error("❌ Error cleaning orphaned files:", error);
			toast.error("Erro na limpeza de arquivos");
			throw error;
		} finally {
			setIsLoading(false);
		}
	}, [getStorageStats]);

	/**
	 * Encontrar arquivos órfãos
	 */
	const findOrphanedFiles = useCallback(async () => {
		try {
			setIsLoading(true);
			return await ImageUploadService.findOrphanedFiles();
		} catch (error) {
			console.error("❌ Error finding orphaned files:", error);
			toast.error("Erro ao buscar arquivos órfãos");
			throw error;
		} finally {
			setIsLoading(false);
		}
	}, []);

	return {
		// Estados
		isLoading,
		stats,

		// Métodos admin
		getStorageStats,
		cleanupOrphanedFiles,
		findOrphanedFiles,

		// Resetar
		resetStats: () => setStats(null),
	};
};

export default useImageUpload;
