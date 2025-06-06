import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "../lib/supabase";
import toast from "react-hot-toast";

export const usePosts = () => {
	const [posts, setPosts] = useState([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState(null);
	const [initialized, setInitialized] = useState(false);
	const fetchingRef = useRef(false);

	const fetchPosts = useCallback(
		async (published = true) => {
			// Evitar múltiplas chamadas simultâneas
			if (fetchingRef.current) {
				console.log("🔄 usePosts: Fetch já em andamento, pulando...");
				return posts;
			}

			try {
				fetchingRef.current = true;
				setLoading(true);
				setError(null);

				console.log("📡 usePosts: Buscando posts com published:", published);

				let query = supabase
					.from("posts")
					.select("*")
					.order("created_at", { ascending: false });

				if (published !== null) {
					query = query.eq("published", published);
				}

				const { data, error } = await query;

				if (error) {
					console.error("❌ usePosts: Erro ao buscar posts:", error);
					throw error;
				}

				console.log(
					"✅ usePosts: Posts buscados com sucesso:",
					data?.length || 0
				);
				setPosts(data || []);
				setInitialized(true);
				return data || [];
			} catch (error) {
				console.error("❌ usePosts: Erro em fetchPosts:", error);
				setError(error.message);

				// Fallback: usar dados estáticos se der erro
				const fallbackPosts = [
					{
						id: 1,
						title: "GP de Mônaco 2025: Verstappen Domina nas Ruas Principescas",
						slug: "gp-monaco-2025-verstappen-domina",
						category: "f1",
						category_name: "Fórmula 1",
						image_url:
							"https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800",
						excerpt:
							"Max Verstappen conquista mais uma vitória em Mônaco com uma performance impecável.",
						content:
							"Max Verstappen mais uma vez demonstrou sua maestria nas ruas estreitas de Monte Carlo.",
						author: "Equipe TF",
						read_time: "5 min",
						published: true,
						trending: true,
						tags: ["f1", "verstappen", "monaco"],
						created_at: new Date(
							Date.now() - 2 * 24 * 60 * 60 * 1000
						).toISOString(),
					},
					{
						id: 2,
						title: "Novo Motor V8 Biturbo: A Revolução dos 1000HP",
						slug: "novo-motor-v8-biturbo-1000hp",
						category: "engines",
						category_name: "Motores",
						image_url:
							"https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?w=800",
						excerpt:
							"Análise completa do novo propulsor que está mudando o cenário do tuning.",
						content:
							"A indústria automotiva testemunha mais uma revolução com o lançamento do novo motor V8 biturbo.",
						author: "Tech Team",
						read_time: "8 min",
						published: true,
						trending: false,
						tags: ["motores", "v8", "biturbo"],
						created_at: new Date(
							Date.now() - 3 * 24 * 60 * 60 * 1000
						).toISOString(),
					},
					{
						id: 3,
						title: "Daytona 500: A Batalha Épica que Definiu a Temporada",
						slug: "daytona-500-batalha-epica-temporada",
						category: "nascar",
						category_name: "NASCAR",
						image_url:
							"https://images.unsplash.com/photo-1566473965997-3de9c817e938?w=800",
						excerpt: "Relato completo da corrida mais emocionante do ano.",
						content:
							"A Daytona 500 de 2025 entrou para a história como uma das corridas mais emocionantes.",
						author: "Race Team",
						read_time: "6 min",
						published: true,
						trending: true,
						tags: ["nascar", "daytona", "500"],
						created_at: new Date(
							Date.now() - 1 * 24 * 60 * 60 * 1000
						).toISOString(),
					},
				];

				console.log("🔄 usePosts: Usando dados fallback");
				setPosts(fallbackPosts);
				setInitialized(true);
				return fallbackPosts;
			} finally {
				setLoading(false);
				fetchingRef.current = false;
			}
		},
		[posts]
	);

	const fetchFeaturedPosts = useCallback(
		async (limit = 3) => {
			try {
				console.log("🌟 usePosts: Buscando posts em destaque, limit:", limit);

				// Se já temos posts, filtrar dos existentes
				if (posts.length > 0) {
					const featured = posts.filter((p) => p.trending).slice(0, limit);
					if (featured.length > 0) {
						console.log(
							"✅ usePosts: Posts em destaque dos dados existentes:",
							featured.length
						);
						return featured;
					}
				}

				// Buscar do banco
				const { data: trendingData, error: trendingError } = await supabase
					.from("posts")
					.select("*")
					.eq("published", true)
					.eq("trending", true)
					.order("created_at", { ascending: false })
					.limit(limit);

				if (!trendingError && trendingData && trendingData.length > 0) {
					console.log(
						"✅ usePosts: Posts trending encontrados:",
						trendingData.length
					);
					return trendingData;
				}

				// Fallback: buscar posts mais recentes
				const { data: recentData, error: recentError } = await supabase
					.from("posts")
					.select("*")
					.eq("published", true)
					.order("created_at", { ascending: false })
					.limit(limit);

				if (!recentError && recentData) {
					console.log(
						"✅ usePosts: Posts recentes encontrados:",
						recentData.length
					);
					return recentData;
				}

				console.log("🔄 usePosts: Usando fallback para featured posts");
				return posts.slice(0, limit);
			} catch (error) {
				console.error("❌ usePosts: Erro em fetchFeaturedPosts:", error);
				return posts.filter((p) => p.trending).slice(0, limit);
			}
		},
		[posts]
	);

	// Inicializar apenas uma vez
	useEffect(() => {
		if (!initialized && !fetchingRef.current) {
			console.log("🚀 usePosts: Inicializando hook...");
			fetchPosts();
		}
	}, [initialized, fetchPosts]);

	// Resto das funções sem alterações, mas com melhor controle de estado
	const createPost = async (postData) => {
		try {
			setLoading(true);
			console.log("➕ usePosts: Criando post:", postData.title);

			const postToCreate = { ...postData };
			delete postToCreate.id;

			const now = new Date().toISOString();
			postToCreate.created_at = now;
			postToCreate.updated_at = now;

			const { data, error } = await supabase
				.from("posts")
				.insert([postToCreate])
				.select()
				.single();

			if (error) throw error;

			setPosts((prev) => [data, ...prev]);
			toast.success("Post criado com sucesso!");
			return { data, error: null };
		} catch (error) {
			console.error("❌ usePosts: Erro ao criar post:", error);
			toast.error("Erro ao criar post: " + error.message);
			return { data: null, error };
		} finally {
			setLoading(false);
		}
	};

	const updatePost = async (id, postData) => {
		try {
			setLoading(true);
			const postId = typeof id === "string" ? parseInt(id, 10) : id;

			const { data, error } = await supabase
				.from("posts")
				.update({
					...postData,
					updated_at: new Date().toISOString(),
				})
				.eq("id", postId)
				.select()
				.single();

			if (error) throw error;

			setPosts((prev) =>
				prev.map((post) => (post.id === postId ? data : post))
			);
			toast.success("Post atualizado com sucesso!");
			return { data, error: null };
		} catch (error) {
			console.error("❌ usePosts: Erro ao atualizar post:", error);
			toast.error("Erro ao atualizar post: " + error.message);
			return { data: null, error };
		} finally {
			setLoading(false);
		}
	};

	const deletePost = async (id) => {
		try {
			setLoading(true);
			const postId = typeof id === "string" ? parseInt(id, 10) : id;

			const { error } = await supabase.from("posts").delete().eq("id", postId);
			if (error) throw error;

			setPosts((prev) => prev.filter((post) => post.id !== postId));
			toast.success("Post deletado com sucesso!");
			return { error: null };
		} catch (error) {
			console.error("❌ usePosts: Erro ao deletar post:", error);
			toast.error("Erro ao deletar post: " + error.message);
			return { error };
		} finally {
			setLoading(false);
		}
	};

	const getPostById = async (id) => {
		try {
			const postId = typeof id === "string" ? parseInt(id, 10) : id;

			const { data, error } = await supabase
				.from("posts")
				.select("*")
				.eq("id", postId)
				.single();

			if (error) throw error;
			return { data, error: null };
		} catch (error) {
			console.error("❌ usePosts: Erro ao buscar post por ID:", error);
			return { data: null, error };
		}
	};

	return {
		posts,
		loading,
		error,
		initialized,
		fetchPosts,
		fetchFeaturedPosts,
		createPost,
		updatePost,
		deletePost,
		getPostById,
	};
};

// Hook para categorias (simplificado e estável)
export const useCategories = () => {
	const [categories, setCategories] = useState([]);
	const [loading, setLoading] = useState(true);
	const [initialized, setInitialized] = useState(false);

	useEffect(() => {
		if (initialized) return;

		const fetchCategories = async () => {
			try {
				console.log("📁 useCategories: Buscando categorias...");

				const { data, error } = await supabase
					.from("categories")
					.select("*")
					.order("name");

				if (error) throw error;

				console.log(
					"✅ useCategories: Categorias encontradas:",
					data?.length || 0
				);
				setCategories(data || []);
			} catch (error) {
				console.error("❌ useCategories: Erro ao buscar categorias:", error);

				// Fallback: categorias estáticas
				const fallbackCategories = [
					{
						id: "f1",
						name: "Fórmula 1",
						description: "A elite do automobilismo mundial",
						color: "from-red-500 to-orange-500",
					},
					{
						id: "nascar",
						name: "NASCAR",
						description: "A categoria mais popular dos EUA",
						color: "from-blue-500 to-cyan-500",
					},
					{
						id: "endurance",
						name: "Endurance",
						description: "Corridas de resistência épicas",
						color: "from-green-500 to-emerald-500",
					},
					{
						id: "drift",
						name: "Formula Drift",
						description: "A arte de deslizar com estilo",
						color: "from-purple-500 to-pink-500",
					},
					{
						id: "tuning",
						name: "Tuning & Custom",
						description: "Personalização e modificações",
						color: "from-yellow-500 to-orange-500",
					},
					{
						id: "engines",
						name: "Motores",
						description: "Tecnologia e performance",
						color: "from-indigo-500 to-purple-500",
					},
				];

				console.log("🔄 useCategories: Usando categorias fallback");
				setCategories(fallbackCategories);
			} finally {
				setLoading(false);
				setInitialized(true);
			}
		};

		fetchCategories();
	}, [initialized]);

	return { categories, loading };
};
