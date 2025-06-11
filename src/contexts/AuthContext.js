import React, {
	createContext,
	useContext,
	useEffect,
	useState,
	useRef,
} from "react";
import { supabase } from "../lib/supabase";
import toast from "react-hot-toast";

const AuthContext = createContext({});

export const useAuth = () => {
	const context = useContext(AuthContext);
	if (!context) {
		throw new Error("useAuth must be used within an AuthProvider");
	}
	return context;
};

export const AuthProvider = ({ children }) => {
	const [user, setUser] = useState(null);
	const [profile, setProfile] = useState(null);
	const [loading, setLoading] = useState(true);
	const [sessionChecked, setSessionChecked] = useState(false);
	const [profileLoading, setProfileLoading] = useState(false);

	// Refs para evitar race conditions
	const isLoadingProfile = useRef(false);
	const currentUserId = useRef(null);
	const initializationCount = useRef(0);

	// Função para FORÇAR limpeza do cache - SOLUÇÃO PARA "old caches cleaner"
	const forceClearAllCaches = () => {
		try {
			console.log("🗑️ FORÇA limpeza de todos os caches");

			// 1. Limpar React Query
			if (window.queryClient) {
				window.queryClient.clear();
				window.queryClient.invalidateQueries();
				window.queryClient.removeQueries();
			}

			// 2. Limpar localStorage específico do Supabase
			Object.keys(localStorage).forEach((key) => {
				if (key.startsWith("sb-")) {
					localStorage.removeItem(key);
				}
			});

			// 3. Limpar sessionStorage
			Object.keys(sessionStorage).forEach((key) => {
				if (key.startsWith("sb-")) {
					sessionStorage.removeItem(key);
				}
			});

			console.log("✅ Cache completamente limpo");
		} catch (error) {
			console.warn("Erro ao limpar cache:", error);
		}
	};

	// Função para buscar perfil com CIRCUIT BREAKER
	const fetchUserProfile = async (userId, userEmail, retryCount = 0) => {
		// Evitar múltiplas chamadas simultâneas
		if (isLoadingProfile.current && currentUserId.current === userId) {
			console.log("🔄 Profile fetch já em andamento para:", userId);
			return null;
		}

		// Circuit breaker - máximo 3 tentativas
		if (retryCount >= 3) {
			console.error(
				"🚫 Circuit breaker: Máximo de tentativas atingido para profile:",
				userId
			);
			setProfileLoading(false);
			return null;
		}

		try {
			isLoadingProfile.current = true;
			currentUserId.current = userId;
			setProfileLoading(true);

			console.log(
				`🔍 Buscando perfil para usuário: ${userId} (tentativa ${
					retryCount + 1
				})`
			);

			const { data, error } = await supabase
				.from("user_profiles")
				.select("*")
				.eq("id", userId)
				.single();

			if (error && error.code !== "PGRST116") {
				console.error("❌ Erro ao buscar perfil:", error);

				// Retry com delay exponencial
				if (retryCount < 2) {
					const delay = Math.pow(2, retryCount) * 1000; // 1s, 2s, 4s
					console.log(`🔄 Retry em ${delay}ms...`);
					setTimeout(() => {
						fetchUserProfile(userId, userEmail, retryCount + 1);
					}, delay);
					return null;
				}

				setProfileLoading(false);
				return null;
			}

			if (data) {
				console.log("✅ Perfil encontrado:", data);
				setProfile(data);
				setProfileLoading(false);
				isLoadingProfile.current = false;
				currentUserId.current = null;
				return data;
			} else {
				// Criar perfil se não existir
				console.log("📝 Criando novo perfil para usuário:", userId);

				const userEmailFallback = userEmail || "";
				const userName = userEmailFallback.split("@")[0] || "Usuário";

				const { data: newProfile, error: createError } = await supabase
					.from("user_profiles")
					.insert([
						{
							id: userId,
							email: userEmailFallback,
							full_name: userName,
							role: "admin", // Por padrão admin
							created_at: new Date().toISOString(),
						},
					])
					.select()
					.single();

				if (!createError && newProfile) {
					console.log("✅ Novo perfil criado:", newProfile);
					setProfile(newProfile);
					setProfileLoading(false);
					isLoadingProfile.current = false;
					currentUserId.current = null;
					return newProfile;
				} else {
					console.error("❌ Erro ao criar perfil:", createError);
					setProfileLoading(false);
					isLoadingProfile.current = false;
					currentUserId.current = null;
					return null;
				}
			}
		} catch (error) {
			console.error("❌ Erro no fetchUserProfile:", error);
			setProfileLoading(false);
			isLoadingProfile.current = false;
			currentUserId.current = null;
			return null;
		}
	};

	// Função para limpar estado - MELHORADA
	const clearAuthState = () => {
		console.log("🧹 Limpando estado de autenticação");

		// Reset refs
		isLoadingProfile.current = false;
		currentUserId.current = null;

		// Reset states
		setUser(null);
		setProfile(null);
		setLoading(false);
		setProfileLoading(false);

		// Força limpeza de cache
		forceClearAllCaches();
	};

	// Inicialização da sessão - COM DEBOUNCE
	useEffect(() => {
		let mounted = true;
		let timeoutId;

		const initializeAuth = async () => {
			// Evitar múltiplas inicializações
			initializationCount.current += 1;
			const currentInit = initializationCount.current;

			try {
				console.log(`🚀 Inicializando autenticação... (#${currentInit})`);
				setLoading(true);

				// Delay para evitar race conditions
				await new Promise((resolve) => setTimeout(resolve, 100));

				// Verificar se ainda é a inicialização atual
				if (!mounted || currentInit !== initializationCount.current) {
					console.log("🚫 Inicialização cancelada (nova tentativa iniciada)");
					return;
				}

				const {
					data: { session },
					error: sessionError,
				} = await supabase.auth.getSession();

				if (!mounted || currentInit !== initializationCount.current) return;

				if (sessionError) {
					console.error("❌ Erro ao obter sessão:", sessionError);
					clearAuthState();
					setSessionChecked(true);
					return;
				}

				if (session?.user) {
					console.log("✅ Sessão encontrada:", session.user.email);
					setUser(session.user);

					// Buscar perfil com debounce
					if (mounted && currentInit === initializationCount.current) {
						const profileData = await fetchUserProfile(
							session.user.id,
							session.user.email
						);

						if (mounted && currentInit === initializationCount.current) {
							setLoading(false);
							setSessionChecked(true);

							console.log("📊 Estado final da inicialização:", {
								user: !!session.user,
								profile: !!profileData,
								isAdmin: profileData?.role === "admin",
								initCount: currentInit,
							});
						}
					}
				} else {
					console.log("ℹ️ Nenhuma sessão encontrada");
					clearAuthState();
					setSessionChecked(true);
				}
			} catch (error) {
				console.error("❌ Erro na inicialização:", error);
				if (mounted && currentInit === initializationCount.current) {
					clearAuthState();
					setSessionChecked(true);
				}
			}
		};

		// Debounce para evitar múltiplas inicializações
		timeoutId = setTimeout(initializeAuth, 50);

		return () => {
			mounted = false;
			if (timeoutId) clearTimeout(timeoutId);
		};
	}, []);

	// Listener para mudanças de autenticação - COM DEBOUNCE
	useEffect(() => {
		let mounted = true;
		let debounceTimeout;

		const handleAuthChange = async (event, session) => {
			if (!mounted) return;

			// Debounce para evitar múltiplos eventos simultâneos
			if (debounceTimeout) clearTimeout(debounceTimeout);

			debounceTimeout = setTimeout(async () => {
				if (!mounted) return;

				console.log(
					"🔄 Auth state change:",
					event,
					session?.user?.email || "no user"
				);

				switch (event) {
					case "SIGNED_OUT":
						console.log("👋 Usuário deslogado");
						clearAuthState();
						setSessionChecked(true);
						break;

					case "SIGNED_IN":
						console.log("👤 Usuário logado");
						if (session?.user && mounted) {
							setUser(session.user);
							setLoading(true);

							const profileData = await fetchUserProfile(
								session.user.id,
								session.user.email
							);

							if (mounted) {
								setLoading(false);
								setSessionChecked(true);

								console.log("📊 Estado após login:", {
									user: !!session.user,
									profile: !!profileData,
									isAdmin: profileData?.role === "admin",
								});
							}
						}
						break;

					case "TOKEN_REFRESHED":
						console.log("🔄 Token renovado");
						if (session?.user && user?.id !== session.user.id && mounted) {
							setUser(session.user);
							const profileData = await fetchUserProfile(
								session.user.id,
								session.user.email
							);

							if (mounted) {
								console.log("📊 Estado após refresh:", {
									user: !!session.user,
									profile: !!profileData,
									isAdmin: profileData?.role === "admin",
								});
							}
						}
						break;

					default:
						if (session?.user && mounted) {
							setUser(session.user);
						} else if (mounted) {
							clearAuthState();
							setSessionChecked(true);
						}
						break;
				}
			}, 100); // 100ms debounce
		};

		const {
			data: { subscription },
		} = supabase.auth.onAuthStateChange(handleAuthChange);

		return () => {
			mounted = false;
			if (debounceTimeout) clearTimeout(debounceTimeout);
			subscription?.unsubscribe();
		};
	}, [user?.id]);

	// SignIn - MELHORADO
	const signIn = async (email, password) => {
		try {
			setLoading(true);
			console.log("🔐 Tentando fazer login...");

			const { data, error } = await supabase.auth.signInWithPassword({
				email,
				password,
			});

			if (error) {
				throw error;
			}

			console.log("✅ Login realizado com sucesso!");
			toast.success("Login realizado com sucesso!");
			return { data, error: null };
		} catch (error) {
			console.error("❌ Erro no login:", error);
			toast.error(error.message || "Erro ao fazer login");
			return { data: null, error };
		} finally {
			setLoading(false);
		}
	};

	// SignOut - VERSÃO FINAL
	const signOut = async () => {
		try {
			console.log("🚪 Iniciando logout...");
			setLoading(true);

			// Reset refs imediatamente
			isLoadingProfile.current = false;
			currentUserId.current = null;

			// 1. Limpar estado local PRIMEIRO
			clearAuthState();

			// 2. Logout no Supabase (não importa se falhar)
			try {
				await supabase.auth.signOut();
				console.log("✅ Supabase logout OK");
			} catch (error) {
				console.warn("⚠️ Supabase logout falhou, mas continuando:", error);
			}

			// 3. Força limpeza total
			forceClearAllCaches();

			console.log("✅ Logout realizado com sucesso");
			toast.success("Logout realizado com sucesso!");

			// 4. Redirecionar com delay mínimo para garantir limpeza
			setTimeout(() => {
				window.location.href = "/";
			}, 100);

			return { error: null };
		} catch (error) {
			console.error("❌ Erro no logout:", error);
			toast.error("Erro ao fazer logout");

			// Forçar limpeza mesmo com erro
			forceClearAllCaches();
			setTimeout(() => {
				window.location.href = "/";
			}, 500);

			return { error };
		}
	};

	const signUp = async (email, password, userData = {}) => {
		try {
			setLoading(true);

			const { data, error } = await supabase.auth.signUp({
				email,
				password,
				options: {
					data: userData,
				},
			});

			if (error) throw error;

			toast.success("Usuário criado com sucesso!");
			return { data, error: null };
		} catch (error) {
			console.error("❌ Erro no signup:", error);
			toast.error(error.message || "Erro ao criar usuário");
			return { data: null, error };
		} finally {
			setLoading(false);
		}
	};

	const updateProfile = async (updates) => {
		try {
			setLoading(true);
			console.log("📝 Atualizando perfil...", updates);

			if (!user) {
				throw new Error("Usuário não autenticado");
			}

			const { error } = await supabase.from("user_profiles").upsert({
				id: user.id,
				...updates,
				updated_at: new Date().toISOString(),
			});

			if (error) {
				console.error("❌ Erro ao atualizar perfil:", error);
				throw error;
			}

			// Recarregar perfil imediatamente
			await fetchUserProfile(user.id, user.email);

			console.log("✅ Perfil atualizado com sucesso!");
			toast.success("Perfil atualizado com sucesso!");
			return { error: null };
		} catch (error) {
			console.error("❌ Erro no updateProfile:", error);
			toast.error("Erro ao atualizar perfil: " + error.message);
			return { error };
		} finally {
			setLoading(false);
		}
	};

	const updatePassword = async (newPassword) => {
		try {
			setLoading(true);

			const { error } = await supabase.auth.updateUser({
				password: newPassword,
			});

			if (error) {
				console.error("❌ Erro ao alterar senha:", error);
				throw error;
			}

			toast.success("Senha alterada com sucesso!");
			return { error: null };
		} catch (error) {
			console.error("❌ Erro no updatePassword:", error);
			toast.error("Erro ao alterar senha: " + error.message);
			return { error };
		} finally {
			setLoading(false);
		}
	};

	// Helper para obter nome de exibição
	const getDisplayName = () => {
		if (profile?.full_name && profile.full_name.trim()) {
			return profile.full_name;
		}
		if (user?.email) {
			return user.email.split("@")[0];
		}
		return "Usuário";
	};

	// Verificar se é admin - COM VALIDAÇÃO EXTRA
	const isAdmin =
		profile?.role === "admin" && !profileLoading && !isLoadingProfile.current;

	// Debug em desenvolvimento
	if (process.env.NODE_ENV === "development") {
		console.log("🎭 Auth State Debug:", {
			user: !!user,
			profile: !!profile,
			profileRole: profile?.role,
			isAdmin,
			loading,
			profileLoading,
			sessionChecked,
			isLoadingProfileRef: isLoadingProfile.current,
			currentUserIdRef: currentUserId.current,
		});
	}

	const value = {
		user,
		profile,
		loading,
		profileLoading,
		sessionChecked,
		signIn,
		signOut,
		signUp,
		updateProfile,
		updatePassword,
		getDisplayName,
		isAdmin,
		isAuthenticated: !!user,
		// Debug helper
		debugState:
			process.env.NODE_ENV === "development"
				? {
						isLoadingProfile: isLoadingProfile.current,
						currentUserId: currentUserId.current,
						initCount: initializationCount.current,
				  }
				: undefined,
	};

	return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
