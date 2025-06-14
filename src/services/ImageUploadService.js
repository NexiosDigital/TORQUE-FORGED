import { supabase } from "../lib/supabase";

/**
 * ImageUploadService - Gerenciamento de imagens de posts
 * - Upload com validação e compressão
 * - Operações atômicas com rollback
 * - URLs otimizadas com transformações
 * - Limpeza automática de arquivos antigos
 */

export class ImageUploadService {
	static BUCKET_NAME = "image-posts";
	static MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB para imagens de posts
	static ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];
	static MIN_DIMENSIONS = { width: 800, height: 600 };
	static MAX_DIMENSIONS = { width: 1920, height: 1080 };

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
			errors.push("Arquivo muito grande. Tamanho máximo: 10MB.");
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

			if (dimensions.width > 8000 || dimensions.height > 8000) {
				errors.push("Imagem muito grande. Máximo: 8000x8000px.");
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
	static async compressImage(file, quality = 0.85) {
		return new Promise((resolve) => {
			const canvas = document.createElement("canvas");
			const ctx = canvas.getContext("2d");
			const img = new Image();

			img.onload = () => {
				// Calcular dimensões respeitando aspect ratio
				const maxWidth = this.MAX_DIMENSIONS.width;
				const maxHeight = this.MAX_DIMENSIONS.height;
				let { width, height } = img;

				// Redimensionar se necessário
				if (width > maxWidth || height > maxHeight) {
					const aspectRatio = width / height;

					if (width > maxWidth) {
						width = maxWidth;
						height = width / aspectRatio;
					}

					if (height > maxHeight) {
						height = maxHeight;
						width = height * aspectRatio;
					}
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
	 * Upload atômico de imagem do post
	 */
	static async uploadPostImage(file, postSlug = null) {
		let uploadedPath = null;

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
			const randomId = Math.random().toString(36).substring(2, 8);
			const fileExt = "jpg"; // Sempre JPG após compressão

			// Se temos slug do post, usar como prefixo
			const fileName = postSlug
				? `${postSlug}-${timestamp}-${randomId}.${fileExt}`
				: `post-${timestamp}-${randomId}.${fileExt}`;

			const filePath = `posts/${fileName}`;

			// 4. Upload do arquivo
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

			// 5. Obter URL pública
			const {
				data: { publicUrl },
			} = supabase.storage.from(this.BUCKET_NAME).getPublicUrl(filePath);

			return {
				success: true,
				image_url: publicUrl,
				image_path: filePath,
			};
		} catch (error) {
			// Rollback em caso de erro
			if (uploadedPath) {
				try {
					await supabase.storage.from(this.BUCKET_NAME).remove([uploadedPath]);
				} catch (rollbackError) {
					console.error("❌ Rollback error:", rollbackError);
				}
			}

			console.error("❌ Post image upload error:", error);
			throw error;
		}
	}

	/**
	 * Remover imagem do post
	 */
	static async removePostImage(imagePath) {
		try {
			if (!imagePath) return { success: true };

			const { error } = await supabase.storage
				.from(this.BUCKET_NAME)
				.remove([imagePath]);

			if (error) {
				console.warn("⚠️ Erro ao remover imagem:", error);
				// Não é crítico, apenas aviso
			}

			return { success: true };
		} catch (error) {
			console.error("❌ Remove post image error:", error);
			// Não é crítico, retorna sucesso
			return { success: true };
		}
	}

	/**
	 * Obter URL otimizada da imagem
	 */
	static getOptimizedImageUrl(imagePath, size = "800x600") {
		if (!imagePath) return null;

		// Parse do tamanho
		const [width, height] = size.split("x").map(Number);

		const { data } = supabase.storage
			.from(this.BUCKET_NAME)
			.getPublicUrl(imagePath, {
				transform: {
					width: width || 800,
					height: height || 600,
					quality: 85,
					resize: "cover",
				},
			});

		return data.publicUrl;
	}

	/**
	 * Obter URL original (sem transformação)
	 */
	static getOriginalImageUrl(imagePath) {
		if (!imagePath) return null;

		const { data } = supabase.storage
			.from(this.BUCKET_NAME)
			.getPublicUrl(imagePath);

		return data.publicUrl;
	}

	/**
	 * Listar arquivos órfãos (sem referência no banco)
	 */
	static async findOrphanedFiles() {
		try {
			// Buscar todas as imagens no storage
			const { data: files, error: listError } = await supabase.storage
				.from(this.BUCKET_NAME)
				.list("posts", {
					limit: 1000,
					sortBy: { column: "created_at", order: "desc" },
				});

			if (listError) throw listError;

			// Buscar todos os image_paths no banco
			const { data: posts, error: dbError } = await supabase
				.from("posts")
				.select("image_path")
				.not("image_path", "is", null);

			if (dbError) throw dbError;

			const dbPaths = new Set(posts?.map((p) => p.image_path) || []);

			// Identificar arquivos órfãos
			const orphanedFiles = [];

			for (const file of files || []) {
				const fullPath = `posts/${file.name}`;
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
				.list("posts", { limit: 1000 });

			const { data: posts } = await supabase
				.from("posts")
				.select("image_path")
				.not("image_path", "is", null);

			return {
				totalFiles: files?.length || 0,
				postsWithImage: posts?.length || 0,
				orphanedFiles: await this.findOrphanedFiles(),
				bucketName: this.BUCKET_NAME,
			};
		} catch (error) {
			console.error("❌ Error getting storage stats:", error);
			return null;
		}
	}
}
