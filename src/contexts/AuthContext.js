import React, { createContext, useContext, useEffect, useState } from "react";
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

	// Função para buscar perfil do usuário
	const fetchUserProfile = async (userId, userEmail) => {
		try {
			console.log("🔍 Buscando perfil para usuário:", userId);

			const { data, error } = await supabase
				.from("user_profiles")
				.select("*")
				.eq("id", userId)
				.single();

			if (error && error.code !== "PGRST116") {
				console.error("Erro ao buscar perfil:", error);
				return null;
			}

			if (data) {
				console.log("✅ Perfil encontrado:", data);
				setProfile(data);
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
					return newProfile;
				} else {
					console.error("❌ Erro ao criar perfil:", createError);
					return null;
				}
			}
		} catch (error) {
			console.error("❌ Erro no fetchUserProfile:", error);
			return null;
		}
	};

	// Função para limpar estado
	const clearAuthState = () => {
		console.log("🧹 Limpando estado de autenticação");
		setUser(null);
		setProfile(null);
		setLoading(false);
	};

	// Inicialização da sessão
	useEffect(() => {
		let mounted = true;

		const initializeAuth = async () => {
			try {
				console.log("🚀 Inicializando autenticação...");

				const {
					data: { session },
					error: sessionError,
				} = await supabase.auth.getSession();

				if (!mounted) return;

				if (sessionError) {
					console.error("❌ Erro ao obter sessão:", sessionError);
					clearAuthState();
					setSessionChecked(true);
					return;
				}

				if (session?.user) {
					console.log("✅ Sessão encontrada:", session.user.email);
					setUser(session.user);

					// Buscar perfil
					const profileData = await fetchUserProfile(
						session.user.id,
						session.user.email
					);

					if (mounted) {
						setLoading(false);
						setSessionChecked(true);
					}
				} else {
					console.log("ℹ️ Nenhuma sessão encontrada");
					clearAuthState();
					setSessionChecked(true);
				}
			} catch (error) {
				console.error("❌ Erro na inicialização:", error);
				if (mounted) {
					clearAuthState();
					setSessionChecked(true);
				}
			}
		};

		initializeAuth();

		return () => {
			mounted = false;
		};
	}, []);

	// Listener para mudanças de autenticação
	useEffect(() => {
		let mounted = true;

		const {
			data: { subscription },
		} = supabase.auth.onAuthStateChange(async (event, session) => {
			if (!mounted) return;

			console.log("🔄 Auth state change:", event, session?.user?.email);

			switch (event) {
				case "SIGNED_OUT":
					clearAuthState();
					// Limpar cache do React Query
					if (window.queryClient) {
						window.queryClient.clear();
					}
					break;

				case "SIGNED_IN":
				case "TOKEN_REFRESHED":
					if (session?.user) {
						setUser(session.user);
						setLoading(true);

						const profileData = await fetchUserProfile(
							session.user.id,
							session.user.email
						);

						if (mounted) {
							setLoading(false);
						}
					}
					break;

				default:
					if (session?.user) {
						setUser(session.user);
					} else {
						clearAuthState();
					}
					break;
			}
		});

		return () => {
			mounted = false;
			subscription?.unsubscribe();
		};
	}, []);

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

	const signOut = async () => {
		try {
			console.log("🚪 Iniciando logout...");

			// Não mudar loading aqui para evitar problemas visuais
			const { error } = await supabase.auth.signOut();

			if (error) {
				console.error("❌ Erro no Supabase signOut:", error);
				throw error;
			}

			// Estado será limpo pelo auth listener automaticamente
			console.log("✅ Logout realizado com sucesso");
			toast.success("Logout realizado com sucesso!");

			// Redirecionar após um pequeno delay
			setTimeout(() => {
				window.location.href = "/";
			}, 500);

			return { error: null };
		} catch (error) {
			console.error("❌ Erro no logout:", error);
			toast.error("Erro ao fazer logout: " + error.message);

			// Forçar limpeza mesmo com erro
			clearAuthState();
			setTimeout(() => {
				window.location.href = "/";
			}, 1000);

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

			// Recarregar perfil
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

	// Verificar se é admin
	const isAdmin = profile?.role === "admin";

	const value = {
		user,
		profile,
		loading,
		sessionChecked,
		signIn,
		signOut,
		signUp,
		updateProfile,
		updatePassword,
		getDisplayName,
		isAdmin,
		isAuthenticated: !!user,
	};

	return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
