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

/**
 * AuthProvider INSTANTÂNEO - NUNCA BLOQUEIA DADOS PÚBLICOS
 * - sessionChecked = true IMEDIATAMENTE
 * - Dados públicos NUNCA dependem de auth
 * - Loading assíncrono em background
 * - Zero impacto na UI inicial
 */

export const AuthProvider = ({ children }) => {
	const [user, setUser] = useState(null);
	const [profile, setProfile] = useState(null);
	const [loading, setLoading] = useState(false); // NUNCA true no início
	const [sessionChecked, setSessionChecked] = useState(true); // SEMPRE true imediatamente
	const [profileLoading, setProfileLoading] = useState(false);

	// Refs para controle interno
	const isLoadingProfile = useRef(false);
	const currentUserId = useRef(null);
	const initializationCount = useRef(0);
	const authInitialized = useRef(false);

	// CRÍTICO: Função para limpar caches
	const forceClearAllCaches = () => {
		try {
			if (window.queryClient) {
				window.queryClient.clear();
				window.queryClient.invalidateQueries();
				window.queryClient.removeQueries();
			}

			Object.keys(localStorage).forEach((key) => {
				if (key.startsWith("sb-") || key.startsWith("tf-cache-")) {
					localStorage.removeItem(key);
				}
			});

			Object.keys(sessionStorage).forEach((key) => {
				if (key.startsWith("sb-")) {
					sessionStorage.removeItem(key);
				}
			});
		} catch (error) {
			console.warn("Erro ao limpar cache:", error);
		}
	};

	// Função para buscar perfil (não bloqueia UI)
	const fetchUserProfile = async (userId, userEmail, retryCount = 0) => {
		if (isLoadingProfile.current && currentUserId.current === userId) {
			return null;
		}

		if (retryCount >= 2) {
			console.warn("🚫 Max retries reached for profile:", userId);
			setProfileLoading(false);
			return null;
		}

		try {
			isLoadingProfile.current = true;
			currentUserId.current = userId;
			setProfileLoading(true);

			const { data, error } = await supabase
				.from("user_profiles")
				.select("*")
				.eq("id", userId)
				.single();

			if (error && error.code !== "PGRST116") {
				console.warn("⚠️ Erro ao buscar perfil:", error);

				if (retryCount < 1) {
					setTimeout(() => {
						fetchUserProfile(userId, userEmail, retryCount + 1);
					}, 1000);
					return null;
				}

				setProfileLoading(false);
				return null;
			}

			if (data) {
				setProfile(data);
				setProfileLoading(false);
				isLoadingProfile.current = false;
				currentUserId.current = null;
				return data;
			} else {
				// Criar perfil se não existir
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
					setProfile(newProfile);
					setProfileLoading(false);
					isLoadingProfile.current = false;
					currentUserId.current = null;
					return newProfile;
				} else {
					console.warn("⚠️ Erro ao criar perfil:", createError);
					setProfileLoading(false);
					isLoadingProfile.current = false;
					currentUserId.current = null;
					return null;
				}
			}
		} catch (error) {
			console.warn("⚠️ Erro no fetchUserProfile:", error);
			setProfileLoading(false);
			isLoadingProfile.current = false;
			currentUserId.current = null;
			return null;
		}
	};

	// Limpar estado auth
	const clearAuthState = () => {
		isLoadingProfile.current = false;
		currentUserId.current = null;
		authInitialized.current = false;

		setUser(null);
		setProfile(null);
		setLoading(false);
		setProfileLoading(false);

		// Não limpar cache aqui - deixar dados públicos funcionando
	};

	// INICIALIZAÇÃO EM BACKGROUND - NUNCA BLOQUEIA UI
	useEffect(() => {
		let mounted = true;
		let timeoutId;

		const initializeAuth = async () => {
			if (authInitialized.current) return;

			initializationCount.current += 1;
			const currentInit = initializationCount.current;

			try {
				// CRÍTICO: Não afetar sessionChecked que já é true

				// DELAY para não bloquear render inicial
				await new Promise((resolve) => setTimeout(resolve, 100));

				if (!mounted || currentInit !== initializationCount.current) {
					return;
				}

				const {
					data: { session },
					error: sessionError,
				} = await supabase.auth.getSession();

				if (!mounted || currentInit !== initializationCount.current) return;

				if (sessionError) {
					console.warn("⚠️ Erro ao obter sessão:", sessionError);
					clearAuthState();
					authInitialized.current = true;
					return;
				}

				if (session?.user) {
					setUser(session.user);

					if (mounted && currentInit === initializationCount.current) {
						// Carregar perfil em background sem bloquear
						fetchUserProfile(session.user.id, session.user.email).then(() => {
							if (mounted && currentInit === initializationCount.current) {
								authInitialized.current = true;
							}
						});
					}
				} else {
					// Usuário não autenticado
					setUser(null);
					setProfile(null);
					setLoading(false);
					setProfileLoading(false);
					authInitialized.current = true;
				}
			} catch (error) {
				console.warn("⚠️ Erro na inicialização de auth:", error);
				if (mounted && currentInit === initializationCount.current) {
					clearAuthState();
					authInitialized.current = true;
				}
			}
		};

		// DELAY mínimo para não bloquear initial render
		timeoutId = setTimeout(initializeAuth, 200);

		return () => {
			mounted = false;
			if (timeoutId) clearTimeout(timeoutId);
		};
	}, []);

	// Listener para mudanças de autenticação
	useEffect(() => {
		let mounted = true;
		let debounceTimeout;

		const handleAuthChange = async (event, session) => {
			if (!mounted) return;

			// Debounce
			if (debounceTimeout) clearTimeout(debounceTimeout);

			debounceTimeout = setTimeout(async () => {
				if (!mounted) return;

				switch (event) {
					case "SIGNED_OUT":
						clearAuthState();
						authInitialized.current = true;
						break;

					case "SIGNED_IN":
						if (session?.user && mounted) {
							setUser(session.user);
							authInitialized.current = true;
						}
						break;

					case "TOKEN_REFRESHED":
						if (session?.user && user?.id !== session.user.id && mounted) {
							setUser(session.user);
						}
						break;

					default:
						if (session?.user && mounted) {
							setUser(session.user);
						} else if (mounted) {
							clearAuthState();
							authInitialized.current = true;
						}
						break;
				}
			}, 100);
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

	// SignIn
	const signIn = async (email, password) => {
		try {
			setLoading(true);

			const { data, error } = await supabase.auth.signInWithPassword({
				email,
				password,
			});

			if (error) {
				throw error;
			}

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

	// SignOut OTIMIZADO
	const signOut = async () => {
		try {
			// Reset refs imediatamente
			isLoadingProfile.current = false;
			currentUserId.current = null;
			authInitialized.current = false;

			// 1. Limpar estado local PRIMEIRO
			clearAuthState();

			// 2. Logout no Supabase (não importa se falhar)
			try {
				await supabase.auth.signOut();
			} catch (error) {
				console.warn("⚠️ Supabase logout falhou:", error);
			}

			// 3. Limpar apenas cache de auth (não cache público)
			try {
				Object.keys(localStorage).forEach((key) => {
					if (key.startsWith("sb-")) {
						localStorage.removeItem(key);
					}
				});
			} catch (error) {
				console.warn("⚠️ Cache cleanup falhou:", error);
			}

			toast.success("Logout realizado com sucesso!");

			// 4. Redirecionar
			setTimeout(() => {
				window.location.href = "/";
			}, 100);

			return { error: null };
		} catch (error) {
			console.error("❌ Erro no logout:", error);
			toast.error("Erro ao fazer logout");

			// Forçar navegação mesmo com erro
			setTimeout(() => {
				window.location.href = "/";
			}, 200);

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

			// Recarregar perfil
			await fetchUserProfile(user.id, user.email);

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

	// Helper para obter nome
	const getDisplayName = () => {
		if (profile?.full_name && profile.full_name.trim()) {
			return profile.full_name;
		}
		if (user?.email) {
			return user.email.split("@")[0];
		}
		return "Usuário";
	};

	// Verificar se é admin
	const isAdmin =
		profile?.role === "admin" && !profileLoading && !isLoadingProfile.current;

	// CRÍTICO: sessionChecked SEMPRE true para não bloquear dados públicos
	const value = {
		user,
		profile,
		loading,
		profileLoading,
		sessionChecked: true, // SEMPRE true - nunca bloquear dados públicos
		signIn,
		signOut,
		signUp,
		updateProfile,
		updatePassword,
		getDisplayName,
		isAdmin,
		isAuthenticated: !!user,

		// Método para forçar liberação (emergência)
		forceReleaseUI: () => {
			setLoading(false);
			setProfileLoading(false);
			authInitialized.current = true;
		},

		// Debug apenas em desenvolvimento
		debugState:
			process.env.NODE_ENV === "development"
				? {
						isLoadingProfile: isLoadingProfile.current,
						currentUserId: currentUserId.current,
						initCount: initializationCount.current,
						authInitialized: authInitialized.current,
				  }
				: undefined,
	};

	return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
