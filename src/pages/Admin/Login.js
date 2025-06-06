import React, { useState } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useForm } from "react-hook-form";
import { Mail, Lock, LogIn } from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";

const Login = () => {
	const { signIn, user, loading } = useAuth();
	const location = useLocation();
	const from = location.state?.from?.pathname || "/admin/dashboard";

	const {
		register,
		handleSubmit,
		formState: { errors },
	} = useForm();

	if (user) {
		return <Navigate to={from} replace />;
	}

	const onSubmit = async (data) => {
		await signIn(data.email, data.password);
	};

	return (
		<div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-black flex items-center justify-center px-4">
			<div className="max-w-md w-full">
				<div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-3xl p-8 border border-gray-700/50 backdrop-blur-sm">
					{/* Logo */}
					<div className="text-center mb-8">
						<div className="w-16 h-16 bg-gradient-to-r from-red-600 to-red-500 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
							<LogIn className="w-8 h-8 text-white" />
						</div>
						<h1 className="text-3xl font-black text-white mb-2">Admin Login</h1>
						<p className="text-gray-400">Acesse o painel administrativo</p>
					</div>

					{/* Form */}
					<form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
						<div>
							<label className="block text-white font-semibold mb-3">
								Email
							</label>
							<div className="relative">
								<Mail className="absolute left-4 top-4 w-5 h-5 text-gray-400" />
								<input
									type="email"
									{...register("email", {
										required: "Email é obrigatório",
										pattern: {
											value: /^\S+@\S+$/i,
											message: "Email inválido",
										},
									})}
									className="w-full pl-12 pr-4 py-4 bg-gray-800/50 border border-gray-600/50 rounded-2xl text-white placeholder-gray-500 focus:outline-none focus:border-red-500/50 focus:bg-gray-800 transition-all duration-300"
									placeholder="admin@torqueforged.com"
								/>
							</div>
							{errors.email && (
								<p className="text-red-400 text-sm mt-2">
									{errors.email.message}
								</p>
							)}
						</div>

						<div>
							<label className="block text-white font-semibold mb-3">
								Senha
							</label>
							<div className="relative">
								<Lock className="absolute left-4 top-4 w-5 h-5 text-gray-400" />
								<input
									type="password"
									{...register("password", {
										required: "Senha é obrigatória",
										minLength: {
											value: 6,
											message: "Senha deve ter pelo menos 6 caracteres",
										},
									})}
									className="w-full pl-12 pr-4 py-4 bg-gray-800/50 border border-gray-600/50 rounded-2xl text-white placeholder-gray-500 focus:outline-none focus:border-red-500/50 focus:bg-gray-800 transition-all duration-300"
									placeholder="••••••••"
								/>
							</div>
							{errors.password && (
								<p className="text-red-400 text-sm mt-2">
									{errors.password.message}
								</p>
							)}
						</div>

						<button
							type="submit"
							disabled={loading}
							className="w-full bg-gradient-to-r from-red-600 to-red-500 hover:from-red-500 hover:to-red-400 text-white py-4 rounded-2xl font-semibold text-lg transition-all duration-300 shadow-lg hover:shadow-red-500/25 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-3"
						>
							{loading ? (
								<div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
							) : (
								<>
									<LogIn className="w-5 h-5" />
									<span>Entrar</span>
								</>
							)}
						</button>
					</form>
				</div>
			</div>
		</div>
	);
};

export default Login;
