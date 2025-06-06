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
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		// Get initial session
		const getSession = async () => {
			const {
				data: { session },
			} = await supabase.auth.getSession();
			setUser(session?.user || null);
			setLoading(false);
		};

		getSession();

		// Listen for auth changes
		const {
			data: { subscription },
		} = supabase.auth.onAuthStateChange(async (event, session) => {
			setUser(session?.user || null);
			setLoading(false);
		});

		return () => subscription?.unsubscribe();
	}, []);

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
			toast.error(error.message);
			return { data: null, error };
		} finally {
			setLoading(false);
		}
	};

	const signOut = async () => {
		try {
			setLoading(true);
			const { error } = await supabase.auth.signOut();
			if (error) throw error;

			toast.success("Logout realizado com sucesso!");
		} catch (error) {
			toast.error(error.message);
		} finally {
			setLoading(false);
		}
	};

	const value = {
		user,
		loading,
		signIn,
		signOut,
		isAdmin: !!user, // Por simplicidade, qualquer usuário logado é admin
	};

	return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
