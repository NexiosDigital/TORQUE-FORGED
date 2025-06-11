import { useState, useCallback } from "react";
import { AvatarService } from "../services/AvatarService";
import { useAuth } from "../contexts/AuthContext";
import toast from "react-hot-toast";

/**
 * Hook personalizado para gerenciar avatares
 * - Facilita uso do AvatarService
 * - Estados unificados
 * - Callbacks automatizados
 * - Integração com AuthContext
 */

export const useAvatar = () => {
	const { user, updateProfile } = useAuth();

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
			const validation = await AvatarService.validateFile(file);

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
	 * Upload de avatar
	 */
	const uploadAvatar = useCallback(
		async (file, options = {}) => {
			if (!user?.id) {
				throw new Error("Usuário não autenticado");
			}

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
				const result = await AvatarService.uploadAvatarAtomic(file, user.id);

				// Finalizar progresso
				clearInterval(progressInterval);
				onProgress(100);

				// Atualizar contexto se possível
				if (updateProfile) {
					await updateProfile({
						avatar_url: result.avatar_url,
						avatar_path: result.avatar_path,
					});
				}

				// Callback de sucesso
				if (options.onSuccess) {
					options.onSuccess(result);
				}

				toast.success("Avatar atualizado com sucesso!");

				return result;
			} catch (error) {
				console.error("❌ useAvatar upload error:", error);

				// Callback de erro
				if (options.onError) {
					options.onError(error);
				}

				toast.error(error.message || "Erro ao fazer upload do avatar");
				throw error;
			} finally {
				setIsUploading(false);
				setUploadProgress(0);
			}
		},
		[user?.id, updateProfile]
	);

	/**
	 * Remover avatar
	 */
	const removeAvatar = useCallback(
		async (options = {}) => {
			if (!user?.id) {
				throw new Error("Usuário não autenticado");
			}

			try {
				setIsUploading(true);

				await AvatarService.removeAvatar(user.id);

				// Atualizar contexto se possível
				if (updateProfile) {
					await updateProfile({
						avatar_url: null,
						avatar_path: null,
					});
				}

				// Callback de sucesso
				if (options.onSuccess) {
					options.onSuccess();
				}

				toast.success("Avatar removido com sucesso!");
			} catch (error) {
				console.error("❌ useAvatar remove error:", error);

				// Callback de erro
				if (options.onError) {
					options.onError(error);
				}

				toast.error(error.message || "Erro ao remover avatar");
				throw error;
			} finally {
				setIsUploading(false);
			}
		},
		[user?.id, updateProfile]
	);

	/**
	 * Obter URL otimizada
	 */
	const getOptimizedUrl = useCallback((avatarPath, size = 200) => {
		return AvatarService.getOptimizedAvatarUrl(avatarPath, size);
	}, []);

	/**
	 * Comprimir imagem (utilitário)
	 */
	const compressImage = useCallback(async (file, quality = 0.8) => {
		return AvatarService.compressImage(file, quality);
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
		uploadAvatar,
		removeAvatar,

		// Utilitários
		getOptimizedUrl,
		compressImage,
		resetStates,

		// Constantes úteis
		constants: {
			BUCKET_NAME: AvatarService.BUCKET_NAME,
			MAX_FILE_SIZE: AvatarService.MAX_FILE_SIZE,
			ALLOWED_TYPES: AvatarService.ALLOWED_TYPES,
			MIN_DIMENSIONS: AvatarService.MIN_DIMENSIONS,
			MAX_DIMENSIONS: AvatarService.MAX_DIMENSIONS,
		},
	};
};

/**
 * Hook para administradores - funcionalidades extras
 */
export const useAvatarAdmin = () => {
	const [isLoading, setIsLoading] = useState(false);
	const [stats, setStats] = useState(null);

	/**
	 * Obter estatísticas do storage
	 */
	const getStorageStats = useCallback(async () => {
		try {
			setIsLoading(true);
			const result = await AvatarService.getStorageStats();
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
			const result = await AvatarService.cleanupOrphanedFiles();

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
			return await AvatarService.findOrphanedFiles();
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

export default useAvatar;
