import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "../lib/supabase";
import { QUERY_KEYS } from "./usePostsQuery";

/**
 * Hook para sincronização em tempo real
 * - Conecta Supabase Realtime com React Query
 * - Atualiza cache automaticamente quando dados mudam no banco
 * - Gerencia conexão e reconexão automática
 */

export const useRealtimeSync = () => {
	const queryClient = useQueryClient();
	const [connectionStatus, setConnectionStatus] = useState("connecting");
	const [lastUpdate, setLastUpdate] = useState(null);

	useEffect(() => {
		console.log("🔄 RealtimeSync: Iniciando conexão...");

		// Canal para posts
		const postsChannel = supabase
			.channel("posts_realtime")
			.on(
				"postgres_changes",
				{
					event: "*", // INSERT, UPDATE, DELETE
					schema: "public",
					table: "posts",
				},
				(payload) => {
					console.log("📡 RealtimeSync: Mudança detectada:", payload);

					const { eventType, new: newRecord, old: oldRecord } = payload;
					setLastUpdate(new Date());

					switch (eventType) {
						case "INSERT":
							handlePostInsert(newRecord);
							break;
						case "UPDATE":
							handlePostUpdate(newRecord, oldRecord);
							break;
						case "DELETE":
							handlePostDelete(oldRecord);
							break;
					}
				}
			)
			.subscribe((status, err) => {
				console.log("📡 RealtimeSync: Status mudou para:", status);
				setConnectionStatus(status);

				if (err) {
					console.error("❌ RealtimeSync: Erro na conexão:", err);
				}
			});

		// Canal para categorias
		const categoriesChannel = supabase
			.channel("categories_realtime")
			.on(
				"postgres_changes",
				{
					event: "*",
					schema: "public",
					table: "categories",
				},
				(payload) => {
					console.log("📡 RealtimeSync: Categoria modificada:", payload);

					// Invalidar cache de categorias
					queryClient.invalidateQueries({
						queryKey: QUERY_KEYS.categories.all,
					});
				}
			)
			.subscribe();

		// Cleanup na desmontagem
		return () => {
			console.log("🔌 RealtimeSync: Desconectando...");
			postsChannel.unsubscribe();
			categoriesChannel.unsubscribe();
		};
	}, [queryClient]);

	// Handler para inserção de post
	const handlePostInsert = (newPost) => {
		console.log("➕ RealtimeSync: Post inserido:", newPost.title);

		// Só processar se for publicado
		if (!newPost.published) return;

		// Invalidar queries principais
		queryClient.invalidateQueries({ queryKey: QUERY_KEYS.posts.all });

		// Se for trending, invalidar featured
		if (newPost.trending) {
			queryClient.invalidateQueries({ queryKey: QUERY_KEYS.posts.featured });
		}

		// Invalidar categoria específica
		if (newPost.category) {
			queryClient.invalidateQueries({
				queryKey: QUERY_KEYS.posts.byCategory(newPost.category),
			});
		}

		// Update otimista nas listas (opcional)
		updatePostsListCache(newPost, "insert");
	};

	// Handler para atualização de post
	const handlePostUpdate = (newPost, oldPost) => {
		console.log("✏️ RealtimeSync: Post atualizado:", newPost.title);

		// Update direto no cache do post individual
		queryClient.setQueryData(
			QUERY_KEYS.posts.byId(newPost.id),
			newPost.published ? newPost : null
		);

		// Se mudou status de publicação
		if (newPost.published !== oldPost.published) {
			invalidateAllPostLists();
		}
		// Se mudou trending
		else if (newPost.trending !== oldPost.trending) {
			queryClient.invalidateQueries({ queryKey: QUERY_KEYS.posts.featured });
			updatePostsListCache(newPost, "update");
		}
		// Se mudou categoria
		else if (newPost.category !== oldPost.category) {
			queryClient.invalidateQueries({
				queryKey: QUERY_KEYS.posts.byCategory(oldPost.category),
			});
			queryClient.invalidateQueries({
				queryKey: QUERY_KEYS.posts.byCategory(newPost.category),
			});
			updatePostsListCache(newPost, "update");
		}
		// Mudanças menores (título, conteúdo, etc)
		else {
			updatePostsListCache(newPost, "update");
		}
	};

	// Handler para deleção de post
	const handlePostDelete = (deletedPost) => {
		console.log("🗑️ RealtimeSync: Post deletado:", deletedPost.title);

		// Remover do cache individual
		queryClient.removeQueries({
			queryKey: QUERY_KEYS.posts.byId(deletedPost.id),
		});

		// Invalidar todas as listas
		invalidateAllPostLists();

		// Invalidar categoria específica
		if (deletedPost.category) {
			queryClient.invalidateQueries({
				queryKey: QUERY_KEYS.posts.byCategory(deletedPost.category),
			});
		}
	};

	// Helper para atualizar listas de posts no cache
	const updatePostsListCache = (post, operation) => {
		// Update lista geral
		queryClient.setQueryData(QUERY_KEYS.posts.all, (oldPosts) => {
			if (!oldPosts) return oldPosts;

			switch (operation) {
				case "insert":
					return [post, ...oldPosts];
				case "update":
					return oldPosts.map((p) => (p.id === post.id ? post : p));
				default:
					return oldPosts;
			}
		});

		// Update featured se aplicável
		if (post.trending) {
			queryClient.setQueryData(QUERY_KEYS.posts.featured, (oldFeatured) => {
				if (!oldFeatured) return oldFeatured;

				switch (operation) {
					case "insert":
						return [post, ...oldFeatured.slice(0, 2)]; // Manter só 3
					case "update":
						return oldFeatured.map((p) => (p.id === post.id ? post : p));
					default:
						return oldFeatured;
				}
			});
		}

		// Update categoria específica
		if (post.category) {
			queryClient.setQueryData(
				QUERY_KEYS.posts.byCategory(post.category),
				(oldCategoryPosts) => {
					if (!oldCategoryPosts) return oldCategoryPosts;

					switch (operation) {
						case "insert":
							return [post, ...oldCategoryPosts];
						case "update":
							return oldCategoryPosts.map((p) => (p.id === post.id ? post : p));
						default:
							return oldCategoryPosts;
					}
				}
			);
		}
	};

	// Helper para invalidar todas as listas
	const invalidateAllPostLists = () => {
		queryClient.invalidateQueries({ queryKey: QUERY_KEYS.posts.all });
		queryClient.invalidateQueries({ queryKey: QUERY_KEYS.posts.featured });
		// Invalidar todas as categorias
		queryClient.invalidateQueries({
			queryKey: ["posts", "category"],
			type: "all",
		});
	};

	return {
		connectionStatus,
		lastUpdate,
		isConnected: connectionStatus === "SUBSCRIBED",
	};
};

/**
 * Hook específico para sincronização de post individual
 */
export const useRealtimePost = (postId) => {
	const queryClient = useQueryClient();
	const [isLive, setIsLive] = useState(false);

	useEffect(() => {
		if (!postId) return;

		console.log(`🔄 RealtimePost: Monitorando post ${postId}...`);

		const channel = supabase
			.channel(`post_${postId}`)
			.on(
				"postgres_changes",
				{
					event: "UPDATE",
					schema: "public",
					table: "posts",
					filter: `id=eq.${postId}`,
				},
				(payload) => {
					console.log(`📡 RealtimePost: Post ${postId} atualizado:`, payload);

					// Update direto no cache
					queryClient.setQueryData(QUERY_KEYS.posts.byId(postId), payload.new);

					// Mostrar indicador de "live"
					setIsLive(true);
					setTimeout(() => setIsLive(false), 3000);
				}
			)
			.subscribe();

		return () => {
			console.log(`🔌 RealtimePost: Parando monitoramento do post ${postId}`);
			channel.unsubscribe();
		};
	}, [postId, queryClient]);

	return { isLive };
};

/**
 * Hook para monitorar estatísticas em tempo real
 */
export const useRealtimeStats = () => {
	const [stats, setStats] = useState({
		totalPosts: 0,
		publishedPosts: 0,
		draftPosts: 0,
		trendingPosts: 0,
	});

	useEffect(() => {
		// Função para calcular estatísticas
		const updateStats = async () => {
			try {
				const { data: allPosts } = await supabase
					.from("posts")
					.select("published, trending")
					.order("created_at", { ascending: false });

				if (allPosts) {
					const newStats = {
						totalPosts: allPosts.length,
						publishedPosts: allPosts.filter((p) => p.published).length,
						draftPosts: allPosts.filter((p) => !p.published).length,
						trendingPosts: allPosts.filter((p) => p.trending && p.published)
							.length,
					};

					setStats(newStats);
				}
			} catch (error) {
				console.error("Erro ao atualizar estatísticas:", error);
			}
		};

		// Atualizar inicialmente
		updateStats();

		// Monitorar mudanças
		const channel = supabase
			.channel("stats_realtime")
			.on(
				"postgres_changes",
				{
					event: "*",
					schema: "public",
					table: "posts",
				},
				() => {
					// Atualizar estatísticas quando houver mudanças
					updateStats();
				}
			)
			.subscribe();

		return () => channel.unsubscribe();
	}, []);

	return stats;
};
