import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";
import toast from "react-hot-toast";

export const usePosts = () => {
	const [posts, setPosts] = useState([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState(null);

	const fetchPosts = async (published = true) => {
		try {
			setLoading(true);
			setError(null);

			let query = supabase
				.from("posts")
				.select("*")
				.order("created_at", { ascending: false });

			if (published !== null) {
				query = query.eq("published", published);
			}

			const { data, error } = await query;

			if (error) {
				console.error("Error fetching posts:", error);
				throw error;
			}

			console.log("Fetched posts:", data?.length || 0);
			setPosts(data || []);
		} catch (error) {
			console.error("Error in fetchPosts:", error);
			setError(error.message);
			toast.error("Erro ao carregar posts");
		} finally {
			setLoading(false);
		}
	};

	const fetchPostsByCategory = async (category, published = true) => {
		try {
			setLoading(true);
			setError(null);

			let query = supabase
				.from("posts")
				.select("*")
				.eq("category", category)
				.order("created_at", { ascending: false });

			if (published !== null) {
				query = query.eq("published", published);
			}

			const { data, error } = await query;

			if (error) {
				console.error("Error fetching posts by category:", error);
				throw error;
			}

			console.log(`Fetched posts for category ${category}:`, data?.length || 0);
			return data || [];
		} catch (error) {
			console.error("Error in fetchPostsByCategory:", error);
			setError(error.message);
			toast.error(`Erro ao carregar posts da categoria ${category}`);
			return [];
		} finally {
			setLoading(false);
		}
	};

	const fetchFeaturedPosts = async (limit = 3) => {
		try {
			setLoading(true);
			setError(null);

			const { data, error } = await supabase
				.from("posts")
				.select("*")
				.eq("published", true)
				.eq("trending", true)
				.order("created_at", { ascending: false })
				.limit(limit);

			if (error) {
				console.error("Error fetching featured posts:", error);
				throw error;
			}

			console.log("Fetched featured posts:", data?.length || 0);
			return data || [];
		} catch (error) {
			console.error("Error in fetchFeaturedPosts:", error);
			// Se não há posts trending, buscar os mais recentes
			try {
				const { data, error } = await supabase
					.from("posts")
					.select("*")
					.eq("published", true)
					.order("created_at", { ascending: false })
					.limit(limit);

				if (error) throw error;
				return data || [];
			} catch (fallbackError) {
				console.error("Error in fallback featured posts:", fallbackError);
				setError(fallbackError.message);
				return [];
			}
		} finally {
			setLoading(false);
		}
	};

	const createPost = async (postData) => {
		try {
			setLoading(true);
			const { data, error } = await supabase
				.from("posts")
				.insert([postData])
				.select()
				.single();

			if (error) {
				console.error("Error creating post:", error);
				throw error;
			}

			setPosts((prev) => [data, ...prev]);
			toast.success("Post criado com sucesso!");
			return { data, error: null };
		} catch (error) {
			console.error("Error in createPost:", error);
			toast.error("Erro ao criar post: " + error.message);
			return { data: null, error };
		} finally {
			setLoading(false);
		}
	};

	const updatePost = async (id, postData) => {
		try {
			setLoading(true);
			const { data, error } = await supabase
				.from("posts")
				.update({
					...postData,
					updated_at: new Date().toISOString(),
				})
				.eq("id", id)
				.select()
				.single();

			if (error) {
				console.error("Error updating post:", error);
				throw error;
			}

			setPosts((prev) => prev.map((post) => (post.id === id ? data : post)));
			toast.success("Post atualizado com sucesso!");
			return { data, error: null };
		} catch (error) {
			console.error("Error in updatePost:", error);
			toast.error("Erro ao atualizar post: " + error.message);
			return { data: null, error };
		} finally {
			setLoading(false);
		}
	};

	const deletePost = async (id) => {
		try {
			setLoading(true);
			const { error } = await supabase.from("posts").delete().eq("id", id);

			if (error) {
				console.error("Error deleting post:", error);
				throw error;
			}

			setPosts((prev) => prev.filter((post) => post.id !== id));
			toast.success("Post deletado com sucesso!");
			return { error: null };
		} catch (error) {
			console.error("Error in deletePost:", error);
			toast.error("Erro ao deletar post: " + error.message);
			return { error };
		} finally {
			setLoading(false);
		}
	};

	const getPostById = async (id) => {
		try {
			const { data, error } = await supabase
				.from("posts")
				.select("*")
				.eq("id", id)
				.single();

			if (error) {
				console.error("Error fetching post by ID:", error);
				throw error;
			}

			return { data, error: null };
		} catch (error) {
			console.error("Error in getPostById:", error);
			return { data: null, error };
		}
	};

	const getPostBySlug = async (slug) => {
		try {
			const { data, error } = await supabase
				.from("posts")
				.select("*")
				.eq("slug", slug)
				.eq("published", true)
				.single();

			if (error) {
				console.error("Error fetching post by slug:", error);
				throw error;
			}

			return { data, error: null };
		} catch (error) {
			console.error("Error in getPostBySlug:", error);
			return { data: null, error };
		}
	};

	useEffect(() => {
		fetchPosts();
	}, []);

	return {
		posts,
		loading,
		error,
		fetchPosts,
		fetchPostsByCategory,
		fetchFeaturedPosts,
		createPost,
		updatePost,
		deletePost,
		getPostById,
		getPostBySlug,
	};
};

// Hook específico para categorias
export const useCategories = () => {
	const [categories, setCategories] = useState([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState(null);

	const fetchCategories = async () => {
		try {
			setLoading(true);
			setError(null);

			const { data, error } = await supabase
				.from("categories")
				.select("*")
				.order("name");

			if (error) {
				console.error("Error fetching categories:", error);
				throw error;
			}

			console.log("Fetched categories:", data?.length || 0);
			setCategories(data || []);
		} catch (error) {
			console.error("Error in fetchCategories:", error);
			setError(error.message);
			toast.error("Erro ao carregar categorias");
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		fetchCategories();
	}, []);

	return {
		categories,
		loading,
		error,
		fetchCategories,
	};
};
