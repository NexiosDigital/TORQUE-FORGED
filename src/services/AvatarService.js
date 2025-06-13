import { supabase } from "../lib/supabase";

/**
 * AvatarService - Gerenciamento completo de avatares
 * - Upload com validação e compressão
 * - Operações atômicas com rollback
 * - Limpeza automática de arquivos antigos
 * - URLs otimizadas com transformações
 */

export class AvatarService {
	static BUCKET_NAME = "torque-forged-avatar";
	static MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
	static ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];
	static MIN_DIMENSIONS = { width: 100, height: 100 };
	static MAX_DIMENSIONS = { width: 800, height: 800 };

	/**
	 * Validação completa de arquivo
	 */
	static async validateFile(file) {
		const errors = [];

		// Validar tipo
		if (!this.ALLOWED_TYPES.includes(file.type)) {
			errors.push("Tipo de arquivo inválido. Use JPEG, PNG, WebP ou GIF.");
		}

		// Validar tamanho
		if (file.size > this.MAX_FILE_SIZE) {
			errors.push("Arquivo muito grande. Tamanho máximo: 5MB.");
		}

		// Validar dimensões
		try {
			const dimensions = await this.getImageDimensions(file);

			if (
				dimensions.width < this.MIN_DIMENSIONS.width ||
				dimensions.height < this.MIN_DIMENSIONS.height
			) {
				errors.push(
					`Imagem muito pequena. Mínimo: ${this.MIN_DIMENSIONS.width}x${this.MIN_DIMENSIONS.height}px.`
				);
			}

			if (dimensions.width > 5000 || dimensions.height > 5000) {
				errors.push("Imagem muito grande. Máximo: 5000x5000px.");
			}
		} catch (error) {
			errors.push("Erro ao validar dimensões da imagem.");
		}

		return {
			valid: errors.length === 0,
			errors,
		};
	}

	/**
	 * Obter dimensões da imagem
	 */
	static getImageDimensions(file) {
		return new Promise((resolve, reject) => {
			const img = new Image();
			img.onload = () => {
				resolve({
					width: img.width,
					height: img.height,
				});
				URL.revokeObjectURL(img.src);
			};
			img.onerror = () => {
				URL.revokeObjectURL(img.src);
				reject(new Error("Erro ao carregar imagem"));
			};
			img.src = URL.createObjectURL(file);
		});
	}

	/**
	 * Comprimir imagem mantendo qualidade
	 */
	static async compressImage(file, quality = 0.8) {
		return new Promise((resolve) => {
			const canvas = document.createElement("canvas");
			const ctx = canvas.getContext("2d");
			const img = new Image();

			img.onload = () => {
				// Calcular dimensões respeitando aspect ratio
				const maxSize = this.MAX_DIMENSIONS.width;
				let { width, height } = img;

				if (width > height && width > maxSize) {
					height = (height * maxSize) / width;
					width = maxSize;
				} else if (height > maxSize) {
					width = (width * maxSize) / height;
					height = maxSize;
				}

				canvas.width = width;
				canvas.height = height;

				// Desenhar com suavização
				ctx.imageSmoothingEnabled = true;
				ctx.imageSmoothingQuality = "high";
				ctx.drawImage(img, 0, 0, width, height);

				// Converter para blob
				canvas.toBlob(
					(blob) => {
						const compressedFile = new File(
							[blob],
							file.name.replace(/\.[^/.]+$/, ".jpg"), // Sempre salvar como JPG
							{
								type: "image/jpeg",
								lastModified: Date.now(),
							}
						);
						resolve(compressedFile);
						URL.revokeObjectURL(img.src);
					},
					"image/jpeg",
					quality
				);
			};

			img.onerror = () => {
				URL.revokeObjectURL(img.src);
				resolve(file); // Fallback para arquivo original
			};

			img.src = URL.createObjectURL(file);
		});
	}

	/**
	 * Upload atômico de avatar
	 */
	static async uploadAvatarAtomic(file, userId) {
		let uploadedPath = null;
		let rollbackFunctions = [];

		try {
			// 1. Validar arquivo
			const validation = await this.validateFile(file);
			if (!validation.valid) {
				throw new Error(validation.errors.join(" "));
			}

			// 2. Comprimir imagem
			const compressedFile = await this.compressImage(file);

			// 3. Gerar nome único
			const timestamp = Date.now();
			const fileExt = "jpg"; // Sempre JPG após compressão
			const fileName = `avatar-${timestamp}.${fileExt}`;
			const filePath = `${userId}/${fileName}`;

			// 4. Buscar avatar atual para limpeza posterior
			const { data: currentProfile } = await supabase
				.from("user_profiles")
				.select("avatar_path")
				.eq("id", userId)
				.single();

			// 5. Upload do arquivo
			const { error: uploadError } = await supabase.storage
				.from(this.BUCKET_NAME)
				.upload(filePath, compressedFile, {
					cacheControl: "3600",
					upsert: false, // Não sobrescrever
				});

			if (uploadError) {
				throw new Error(`Upload falhou: ${uploadError.message}`);
			}

			uploadedPath = filePath;

			// Adicionar rollback para o upload
			rollbackFunctions.push(async () => {
				await supabase.storage.from(this.BUCKET_NAME).remove([filePath]);
			});

			// 6. Obter URL pública
			const {
				data: { publicUrl },
			} = supabase.storage.from(this.BUCKET_NAME).getPublicUrl(filePath);

			// 7. Atualizar banco de dados atomicamente
			const { error: updateError } = await supabase
				.from("user_profiles")
				.update({
					avatar_url: publicUrl,
					avatar_path: filePath,
					updated_at: new Date().toISOString(),
				})
				.eq("id", userId);

			if (updateError) {
				throw new Error(`Atualização do banco falhou: ${updateError.message}`);
			}

			// 8. Agendar limpeza do avatar antigo (não crítico)
			if (
				currentProfile?.avatar_path &&
				currentProfile.avatar_path !== filePath
			) {
				this.scheduleCleanup(currentProfile.avatar_path);
			}

			return {
				success: true,
				avatar_url: publicUrl,
				avatar_path: filePath,
			};
		} catch (error) {
			// Rollback em caso de erro
			console.error("❌ Avatar upload error, iniciando rollback:", error);

			for (const rollbackFn of rollbackFunctions.reverse()) {
				try {
					await rollbackFn();
				} catch (rollbackError) {
					console.error("❌ Rollback error:", rollbackError);
				}
			}

			throw error;
		}
	}

	/**
	 * Remover avatar atual
	 */
	static async removeAvatar(userId) {
		try {
			// 1. Buscar avatar atual
			const { data: currentProfile } = await supabase
				.from("user_profiles")
				.select("avatar_path")
				.eq("id", userId)
				.single();

			// 2. Atualizar banco removendo avatar
			const { error: updateError } = await supabase
				.from("user_profiles")
				.update({
					avatar_url: null,
					avatar_path: null,
					updated_at: new Date().toISOString(),
				})
				.eq("id", userId);

			if (updateError) {
				throw updateError;
			}

			// 3. Agendar remoção do arquivo (não crítico)
			if (currentProfile?.avatar_path) {
				this.scheduleCleanup(currentProfile.avatar_path);
			}

			return { success: true };
		} catch (error) {
			console.error("❌ Remove avatar error:", error);
			throw new Error(`Erro ao remover avatar: ${error.message}`);
		}
	}

	/**
	 * Obter URL otimizada do avatar
	 */
	static getOptimizedAvatarUrl(avatarPath, size = 200) {
		if (!avatarPath) return null;

		const { data } = supabase.storage
			.from(this.BUCKET_NAME)
			.getPublicUrl(avatarPath, {
				transform: {
					width: size,
					height: size,
					quality: 80,
					resize: "cover",
				},
			});

		return data.publicUrl;
	}

	/**
	 * Agendar limpeza de arquivo antigo
	 */
	static scheduleCleanup(filePath) {
		// Agendar limpeza com delay para evitar problemas de cache
		setTimeout(async () => {
			try {
				await supabase.storage.from(this.BUCKET_NAME).remove([filePath]);
			} catch (error) {
				console.warn("⚠️ Erro ao remover avatar antigo:", error);
			}
		}, 5 * 60 * 1000); // 5 minutos de delay
	}

	/**
	 * Listar arquivos órfãos (sem referência no banco)
	 */
	static async findOrphanedFiles() {
		try {
			// Buscar todos os avatars no storage
			const { data: files, error: listError } = await supabase.storage
				.from(this.BUCKET_NAME)
				.list("", {
					limit: 1000,
					sortBy: { column: "created_at", order: "desc" },
				});

			if (listError) throw listError;

			// Buscar todos os avatar_paths no banco
			const { data: profiles, error: dbError } = await supabase
				.from("user_profiles")
				.select("avatar_path")
				.not("avatar_path", "is", null);

			if (dbError) throw dbError;

			const dbPaths = new Set(profiles?.map((p) => p.avatar_path) || []);

			// Identificar arquivos órfãos
			const orphanedFiles = [];

			for (const file of files || []) {
				const fullPath = file.name;
				if (!dbPaths.has(fullPath)) {
					orphanedFiles.push(fullPath);
				}
			}

			return orphanedFiles;
		} catch (error) {
			console.error("❌ Error finding orphaned files:", error);
			return [];
		}
	}

	/**
	 * Limpeza manual de arquivos órfãos
	 */
	static async cleanupOrphanedFiles() {
		try {
			const orphanedFiles = await this.findOrphanedFiles();

			if (orphanedFiles.length === 0) {
				return { removed: 0 };
			}

			const { error } = await supabase.storage
				.from(this.BUCKET_NAME)
				.remove(orphanedFiles);

			if (error) throw error;

			return {
				removed: orphanedFiles.length,
				files: orphanedFiles,
			};
		} catch (error) {
			console.error("❌ Error cleaning orphaned files:", error);
			throw new Error(`Erro na limpeza: ${error.message}`);
		}
	}

	/**
	 * Estatísticas do storage
	 */
	static async getStorageStats() {
		try {
			const { data: files } = await supabase.storage
				.from(this.BUCKET_NAME)
				.list("", { limit: 1000 });

			const { data: profiles } = await supabase
				.from("user_profiles")
				.select("avatar_path")
				.not("avatar_path", "is", null);

			return {
				totalFiles: files?.length || 0,
				profilesWithAvatar: profiles?.length || 0,
				orphanedFiles: await this.findOrphanedFiles(),
				bucketName: this.BUCKET_NAME,
			};
		} catch (error) {
			console.error("❌ Error getting storage stats:", error);
			return null;
		}
	}
}
