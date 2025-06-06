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
			let query = supabase
				.from("posts")
				.select("*")
				.order("created_at", { ascending: false });

			if (published !== null) {
				query = query.eq("published", published);
			}

			const { data, error } = await query;

			if (error) throw error;
			setPosts(data || []);
		} catch (error) {
			setError(error.message);
			toast.error("Erro ao carregar posts");
		} finally {
			setLoading(false);
		}
	};

	const createPost = async (postData) => {
		try {
			const { data, error } = await supabase
				.from("posts")
				.insert([postData])
				.select()
				.single();

			if (error) throw error;

			setPosts((prev) => [data, ...prev]);
			toast.success("Post criado com sucesso!");
			return { data, error: null };
		} catch (error) {
			toast.error("Erro ao criar post");
			return { data: null, error };
		}
	};

	const updatePost = async (id, postData) => {
		try {
			const { data, error } = await supabase
				.from("posts")
				.update(postData)
				.eq("id", id)
				.select()
				.single();

			if (error) throw error;

			setPosts((prev) => prev.map((post) => (post.id === id ? data : post)));
			toast.success("Post atualizado com sucesso!");
			return { data, error: null };
		} catch (error) {
			toast.error("Erro ao atualizar post");
			return { data: null, error };
		}
	};

	const deletePost = async (id) => {
		try {
			const { error } = await supabase.from("posts").delete().eq("id", id);

			if (error) throw error;

			setPosts((prev) => prev.filter((post) => post.id !== id));
			toast.success("Post deletado com sucesso!");
			return { error: null };
		} catch (error) {
			toast.error("Erro ao deletar post");
			return { error };
		}
	};

	const getPostById = async (id) => {
		try {
			const { data, error } = await supabase
				.from("posts")
				.select("*")
				.eq("id", id)
				.single();

			if (error) throw error;
			return { data, error: null };
		} catch (error) {
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

			if (error) throw error;
			return { data, error: null };
		} catch (error) {
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
		createPost,
		updatePost,
		deletePost,
		getPostById,
		getPostBySlug,
	};
};
