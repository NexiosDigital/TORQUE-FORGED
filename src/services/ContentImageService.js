import { supabase } from "../lib/supabase";

/**
 * ContentImageService - Gerenciamento de imagens para conteúdo de posts
 * - Upload de imagens inline durante a escrita
 * - Organização por slug do post
 * - URLs otimizadas para performance
 * - Limpeza automática de imagens não utilizadas
 */

export class ContentImageService {
	static BUCKET_NAME = "content-images";
	static MAX_FILE_SIZE = 8 * 1024 * 1024; // 8MB para imagens de conteúdo
	static ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];
	static MIN_DIMENSIONS = { width: 400, height: 300 };
	static MAX_DIMENSIONS = { width: 1920, height: 1080 };

	/**
	 * Validação de arquivo para imagens de conteúdo
	 */
	static async validateFile(file) {
		const errors = [];

		// Validar tipo
		if (!this.ALLOWED_TYPES.includes(file.type)) {
			errors.push("Tipo de arquivo inválido. Use JPEG, PNG, WebP ou GIF.");
		}

		// Validar tamanho
		if (file.size > this.MAX_FILE_SIZE) {
			errors.push("Arquivo muito grande. Tamanho máximo: 8MB.");
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

			if (dimensions.width > 6000 || dimensions.height > 6000) {
				errors.push("Imagem muito grande. Máximo: 6000x6000px.");
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
	 * Comprimir imagem para conteúdo
	 */
	static async compressImage(file, quality = 0.88) {
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

				// Desenhar com alta qualidade
				ctx.imageSmoothingEnabled = true;
				ctx.imageSmoothingQuality = "high";
				ctx.drawImage(img, 0, 0, width, height);

				// Converter para blob
				canvas.toBlob(
					(blob) => {
						const compressedFile = new File(
							[blob],
							file.name.replace(/\.[^/.]+$/, ".jpg"), // Converter para JPG
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
	 * Upload de imagem para conteúdo do post
	 */
	static async uploadContentImage(file, postSlug, description = "") {
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
			const sanitizedDescription = description
				.toLowerCase()
				.replace(/[^a-z0-9]/g, "-")
				.replace(/-+/g, "-")
				.substring(0, 30);

			const fileName = sanitizedDescription
				? `${sanitizedDescription}-${timestamp}.jpg`
				: `content-${timestamp}-${randomId}.jpg`;

			// 4. Estrutura de pastas: content-images/post-slug/filename
			const filePath = `${postSlug}/${fileName}`;

			// 5. Upload do arquivo
			const { error: uploadError } = await supabase.storage
				.from(this.BUCKET_NAME)
				.upload(filePath, compressedFile, {
					cacheControl: "3600",
					upsert: false,
				});

			if (uploadError) {
				throw new Error(`Upload falhou: ${uploadError.message}`);
			}

			// 6. Obter URL pública
			const {
				data: { publicUrl },
			} = supabase.storage.from(this.BUCKET_NAME).getPublicUrl(filePath);

			return {
				success: true,
				image_url: publicUrl,
				image_path: filePath,
				filename: fileName,
				description: description,
			};
		} catch (error) {
			console.error("❌ ContentImageService upload error:", error);
			throw error;
		}
	}

	/**
	 * Obter URL otimizada para imagens de conteúdo
	 */
	static getOptimizedContentImageUrl(imagePath, size = "1200x800") {
		if (!imagePath) return null;

		// Parse do tamanho
		const [width, height] = size.split("x").map(Number);

		const { data } = supabase.storage
			.from(this.BUCKET_NAME)
			.getPublicUrl(imagePath, {
				transform: {
					width: width || 1200,
					height: height || 800,
					quality: 88,
					resize: "cover",
				},
			});

		return data.publicUrl;
	}

	/**
	 * Listar imagens de um post específico
	 */
	static async getPostImages(postSlug) {
		try {
			const { data: files, error } = await supabase.storage
				.from(this.BUCKET_NAME)
				.list(postSlug, {
					limit: 100,
					sortBy: { column: "created_at", order: "desc" },
				});

			if (error) throw error;

			return (files || []).map((file) => ({
				name: file.name,
				path: `${postSlug}/${file.name}`,
				url: this.getOptimizedContentImageUrl(`${postSlug}/${file.name}`),
				size: file.metadata?.size,
				created_at: file.created_at,
			}));
		} catch (error) {
			console.error("❌ Error getting post images:", error);
			return [];
		}
	}

	/**
	 * Remover imagem específica
	 */
	static async removeContentImage(imagePath) {
		try {
			if (!imagePath) return { success: true };

			const { error } = await supabase.storage
				.from(this.BUCKET_NAME)
				.remove([imagePath]);

			if (error) {
				console.warn("⚠️ Erro ao remover imagem de conteúdo:", error);
			}

			return { success: true };
		} catch (error) {
			console.error("❌ Remove content image error:", error);
			return { success: false, error };
		}
	}

	/**
	 * Limpeza de imagens não utilizadas
	 * Compara imagens no storage com referências no conteúdo do post
	 */
	static async cleanupUnusedImages(postSlug, postContent) {
		try {
			if (!postSlug || !postContent) return { removed: 0 };

			// Listar todas as imagens do post
			const postImages = await this.getPostImages(postSlug);

			// Encontrar referências no conteúdo markdown
			const imageReferences = this.extractImageReferences(postContent);

			// Identificar imagens órfãs
			const unusedImages = postImages.filter((img) => {
				return !imageReferences.some((ref) => ref.includes(img.name));
			});

			if (unusedImages.length === 0) {
				return { removed: 0 };
			}

			// Remover imagens não utilizadas
			const pathsToRemove = unusedImages.map((img) => img.path);

			const { error } = await supabase.storage
				.from(this.BUCKET_NAME)
				.remove(pathsToRemove);

			if (error) {
				console.warn("⚠️ Erro na limpeza de imagens:", error);
				return { removed: 0, error };
			}

			return {
				removed: unusedImages.length,
				files: unusedImages,
			};
		} catch (error) {
			console.error("❌ Error cleaning unused images:", error);
			return { removed: 0, error };
		}
	}

	/**
	 * Extrair referências de imagens do conteúdo markdown
	 */
	static extractImageReferences(content) {
		if (!content) return [];

		// Regex para encontrar imagens markdown: ![alt](url)
		const markdownImageRegex = /!\[.*?\]\((.*?)\)/g;
		const references = [];

		let match;
		while ((match = markdownImageRegex.exec(content)) !== null) {
			references.push(match[1]);
		}

		return references;
	}

	/**
	 * Gerar markdown para imagem
	 */
	static generateImageMarkdown(imageResult, description = "") {
		const alt = description || "Imagem do conteúdo";
		return `![${alt}](${imageResult.image_url})`;
	}

	/**
	 * Mover imagens temporárias para pasta definitiva do post
	 * Útil quando o slug do post muda ou é criado depois
	 */
	static async moveImagesToPostFolder(tempSlug, finalSlug) {
		try {
			if (!tempSlug || !finalSlug || tempSlug === finalSlug) {
				return { success: true };
			}

			// Listar imagens da pasta temporária
			const tempImages = await this.getPostImages(tempSlug);

			if (tempImages.length === 0) {
				return { success: true };
			}

			// Mover cada imagem
			const movePromises = tempImages.map(async (img) => {
				const oldPath = img.path;
				const newPath = img.path.replace(tempSlug, finalSlug);

				// Baixar arquivo
				const { data: fileData } = await supabase.storage
					.from(this.BUCKET_NAME)
					.download(oldPath);

				if (fileData) {
					// Upload na nova localização
					await supabase.storage
						.from(this.BUCKET_NAME)
						.upload(newPath, fileData, { upsert: true });

					// Remover arquivo antigo
					await supabase.storage.from(this.BUCKET_NAME).remove([oldPath]);
				}

				return {
					oldPath,
					newPath: newPath,
					newUrl: this.getOptimizedContentImageUrl(newPath),
				};
			});

			const results = await Promise.all(movePromises);

			return {
				success: true,
				moved: results.length,
				mappings: results,
			};
		} catch (error) {
			console.error("❌ Error moving images:", error);
			return { success: false, error };
		}
	}

	/**
	 * Estatísticas de imagens de conteúdo
	 */
	static async getContentImageStats() {
		try {
			const { data: folders } = await supabase.storage
				.from(this.BUCKET_NAME)
				.list("", { limit: 1000 });

			let totalImages = 0;
			const postCounts = {};

			for (const folder of folders || []) {
				if (folder.name) {
					const images = await this.getPostImages(folder.name);
					postCounts[folder.name] = images.length;
					totalImages += images.length;
				}
			}

			return {
				totalImages,
				totalPosts: Object.keys(postCounts).length,
				postCounts,
				bucketName: this.BUCKET_NAME,
			};
		} catch (error) {
			console.error("❌ Error getting content image stats:", error);
			return null;
		}
	}
}
