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
				} = await supabase.auth.getSession();

				if (session?.user) {
					setUser(session.user);
					await fetchUserProfile(session.user.id);
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
			console.log("Auth state changed:", event, session?.user?.email);

			if (session?.user) {
				setUser(session.user);
				await fetchUserProfile(session.user.id);
			} else {
				setUser(null);
				setProfile(null);
			}
			setLoading(false);
		});

		return () => subscription?.unsubscribe();
	}, []);

	const fetchUserProfile = async (userId) => {
		try {
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
				setProfile(data);
			} else {
				// Criar perfil se não existir
				const userEmail = user?.email || "";
				const userName = userEmail.split("@")[0]; // Usar parte do email como nome inicial

				const { data: newProfile, error: createError } = await supabase
					.from("user_profiles")
					.insert([
						{
							id: userId,
							email: userEmail,
							full_name: userName,
							role: "admin", // Por padrão, usuários criados serão admin
						},
					])
					.select()
					.single();

				if (!createError && newProfile) {
					setProfile(newProfile);
				} else {
					console.error("Error creating profile:", createError);
				}
			}
		} catch (error) {
			console.error("Error in fetchUserProfile:", error);
		}
	};

	const signIn = async (email, password) => {
		try {
			setLoading(true);
			const { data, error } = await supabase.auth.signInWithPassword({
				email,
				password,
			});

			if (error) throw error;

			toast.success("Login realizado com sucesso!");
			return { data, error: null };
		} catch (error) {
			console.error("Sign in error:", error);
			toast.error(error.message);
			return { data: null, error };
		} finally {
			setLoading(false);
		}
	};

	const signOut = async () => {
		try {
			setLoading(true);
			console.log("Attempting to sign out...");

			const { error } = await supabase.auth.signOut();
			if (error) {
				console.error("Supabase signOut error:", error);
				throw error;
			}

			// Force clear state
			setUser(null);
			setProfile(null);

			toast.success("Logout realizado com sucesso!");

			// Force page reload to ensure clean state
			setTimeout(() => {
				window.location.href = "/";
			}, 1000);
		} catch (error) {
			console.error("Sign out error:", error);
			toast.error("Erro ao fazer logout: " + error.message);
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
			toast.error(error.message);
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

			if (error) throw error;

			await fetchUserProfile(user.id);
			toast.success("Perfil atualizado com sucesso!");
			return { error: null };
		} catch (error) {
			console.error("Update profile error:", error);
			toast.error("Erro ao atualizar perfil");
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

			if (error) throw error;

			toast.success("Senha alterada com sucesso!");
			return { error: null };
		} catch (error) {
			console.error("Update password error:", error);
			toast.error("Erro ao alterar senha");
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
