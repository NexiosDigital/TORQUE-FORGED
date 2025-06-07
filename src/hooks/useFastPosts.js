import { useState, useCallback } from "react";
import { FastDataService } from "../services/FastDataService";
import toast from "react-hot-toast";

/**
 * Hook ultra-rápido que substitui todos os outros
 * - Carregamento em ≤3s
 * - Cache agressivo
 * - Fallbacks instantâneos
 */
export const useFastPosts = () => {
	const [posts, setPosts] = useState([]);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState(null);

	// Buscar todos os posts
	const fetchPosts = useCallback(async () => {
		try {
			setLoading(true);
			setError(null);

			const allPosts = await FastDataService.getAllPosts();
			setPosts(allPosts);

			return allPosts;
		} catch (error) {
			console.error("❌ useFastPosts: Error in fetchPosts:", error);
			setError(error.message);
			return [];
		} finally {
			setLoading(false);
		}
	}, []);

	// Buscar posts em destaque
	const fetchFeaturedPosts = useCallback(async (limit = 3) => {
		try {
			const featured = await FastDataService.getFeaturedPosts();
			return featured.slice(0, limit);
		} catch (error) {
			console.error("❌ useFastPosts: Error in fetchFeaturedPosts:", error);
			return [];
		}
	}, []);

	// Buscar posts por categoria
	const fetchPostsByCategory = useCallback(async (categoryId) => {
		try {
			return await FastDataService.getPostsByCategory(categoryId);
		} catch (error) {
			console.error("❌ useFastPosts: Error in fetchPostsByCategory:", error);
			return [];
		}
	}, []);

	// Buscar post por ID
	const getPostById = useCallback(async (id) => {
		try {
			const post = await FastDataService.getPostById(id);
			return { data: post, error: null };
		} catch (error) {
			console.error("❌ useFastPosts: Error in getPostById:", error);
			return { data: null, error };
		}
	}, []);

	// Criar post
	const createPost = useCallback(
		async (postData) => {
			try {
				setLoading(true);
				const result = await FastDataService.createPost(postData);

				if (!result.error) {
					toast.success("Post criado com sucesso!");
					// Recarregar posts após criação
					await fetchPosts();
				} else {
					toast.error("Erro ao criar post");
				}

				return result;
			} catch (error) {
				console.error("❌ useFastPosts: Error in createPost:", error);
				toast.error("Erro ao criar post");
				return { data: null, error };
			} finally {
				setLoading(false);
			}
		},
		[fetchPosts]
	);

	// Atualizar post
	const updatePost = useCallback(
		async (id, postData) => {
			try {
				setLoading(true);
				const result = await FastDataService.updatePost(id, postData);

				if (!result.error) {
					toast.success("Post atualizado com sucesso!");
					// Recarregar posts após atualização
					await fetchPosts();
				} else {
					toast.error("Erro ao atualizar post");
				}

				return result;
			} catch (error) {
				console.error("❌ useFastPosts: Error in updatePost:", error);
				toast.error("Erro ao atualizar post");
				return { data: null, error };
			} finally {
				setLoading(false);
			}
		},
		[fetchPosts]
	);

	// Deletar post
	const deletePost = useCallback(async (id) => {
		try {
			setLoading(true);
			const result = await FastDataService.deletePost(id);

			if (!result.error) {
				toast.success("Post deletado com sucesso!");
				// Remover post da lista local
				setPosts((prevPosts) => prevPosts.filter((post) => post.id !== id));
			} else {
				toast.error("Erro ao deletar post");
			}

			return result;
		} catch (error) {
			console.error("❌ useFastPosts: Error in deletePost:", error);
			toast.error("Erro ao deletar post");
			return { error };
		} finally {
			setLoading(false);
		}
	}, []);

	// Limpar cache
	const clearCache = useCallback(() => {
		FastDataService.clearCache();
		toast.success("Cache limpo!");
	}, []);

	return {
		posts,
		loading,
		error,
		fetchPosts,
		fetchFeaturedPosts,
		fetchPostsByCategory,
		getPostById,
		createPost,
		updatePost,
		deletePost,
		clearCache,
		cacheStats: FastDataService.getCacheStats(),
	};
};
