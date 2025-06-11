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

	useEffect(() => {
		// Get initial session
		const getSession = async () => {
			try {
				const {
					data: { session },
					error: sessionError,
				} = await supabase.auth.getSession();

				if (sessionError) {
					console.error("Error getting session:", sessionError);
					setLoading(false);
					return;
				}

				if (session?.user) {
					setUser(session.user);
					await fetchUserProfile(session.user.id, session.user.email);
				}
			} catch (error) {
				console.error("Error getting session:", error);
			} finally {
				setLoading(false);
			}
		};

		getSession();

		// Listen for auth changes
		const {
			data: { subscription },
		} = supabase.auth.onAuthStateChange(async (event, session) => {
			console.log("Auth state change:", event, session?.user?.email);

			if (event === "SIGNED_OUT") {
				setUser(null);
				setProfile(null);
				setLoading(false);
				return;
			}

			if (session?.user) {
				setUser(session.user);
				await fetchUserProfile(session.user.id, session.user.email);
			} else {
				setUser(null);
				setProfile(null);
			}
			setLoading(false);
		});

		return () => {
			subscription?.unsubscribe();
		};
	}, []);

	const fetchUserProfile = async (userId, userEmail) => {
		try {
			console.log("Fetching profile for user:", userId);

			const { data, error } = await supabase
				.from("user_profiles")
				.select("*")
				.eq("id", userId)
				.single();

			if (error && error.code !== "PGRST116") {
				console.error("Error fetching profile:", error);
				return;
			}

			if (data) {
				console.log("Profile found:", data);
				setProfile(data);
			} else {
				// Criar perfil se não existir
				console.log("Creating new profile for user:", userId);

				const userEmailFallback = userEmail || "";
				const userName = userEmailFallback.split("@")[0] || "Usuário";

				const { data: newProfile, error: createError } = await supabase
					.from("user_profiles")
					.insert([
						{
							id: userId,
							email: userEmailFallback,
							full_name: userName,
							role: "admin", // Por padrão, usuários criados serão admin
							created_at: new Date().toISOString(),
						},
					])
					.select()
					.single();

				if (!createError && newProfile) {
					console.log("New profile created:", newProfile);
					setProfile(newProfile);
				} else {
					console.error("Error creating profile:", createError);
				}
			}
		} catch (error) {
			console.error("Fetch user profile error:", error);
		}
	};

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
			console.error("Sign in error:", error);
			toast.error(error.message || "Erro ao fazer login");
			return { data: null, error };
		} finally {
			setLoading(false);
		}
	};

	const signOut = async () => {
		try {
			console.log("🚪 Iniciando logout...");
			setLoading(true);

			// Primeiro, chamar o signOut do Supabase
			const { error } = await supabase.auth.signOut();

			if (error) {
				console.error("Supabase signOut error:", error);
				throw error;
			}

			// Limpar estado local imediatamente
			setUser(null);
			setProfile(null);

			console.log("✅ Logout realizado com sucesso");

			// Mostrar toast de sucesso
			toast.success("Logout realizado com sucesso!");

			// Redirecionar para home após um delay
			setTimeout(() => {
				window.location.href = "/";
			}, 1000);

			return { error: null };
		} catch (error) {
			console.error("Sign out error:", error);
			toast.error("Erro ao fazer logout: " + error.message);
			return { error };
		} finally {
			setLoading(false);
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
			console.error("Sign up error:", error);
			toast.error(error.message || "Erro ao criar usuário");
			return { data: null, error };
		} finally {
			setLoading(false);
		}
	};

	const updateProfile = async (updates) => {
		try {
			setLoading(true);

			const { error } = await supabase.from("user_profiles").upsert({
				id: user.id,
				...updates,
				updated_at: new Date().toISOString(),
			});

			if (error) {
				console.error("Update profile error:", error);
				throw error;
			}

			await fetchUserProfile(user.id, user.email);
			toast.success("Perfil atualizado com sucesso!");
			return { error: null };
		} catch (error) {
			console.error("Update profile error:", error);
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
				console.error("Update password error:", error);
				throw error;
			}

			toast.success("Senha alterada com sucesso!");
			return { error: null };
		} catch (error) {
			console.error("Update password error:", error);
			toast.error("Erro ao alterar senha: " + error.message);
			return { error };
		} finally {
			setLoading(false);
		}
	};

	// Helper function to get display name
	const getDisplayName = () => {
		if (profile?.full_name && profile.full_name.trim()) {
			return profile.full_name;
		}
		if (user?.email) {
			return user.email.split("@")[0];
		}
		return "Usuário";
	};

	const value = {
		user,
		profile,
		loading,
		signIn,
		signOut,
		signUp,
		updateProfile,
		updatePassword,
		getDisplayName,
		isAdmin: profile?.role === "admin",
		isAuthenticated: !!user,
	};

	return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
