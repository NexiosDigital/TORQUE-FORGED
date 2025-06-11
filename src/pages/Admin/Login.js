import { Navigate, useLocation } from "react-router-dom";
import { useForm } from "react-hook-form";
import { Mail, Lock, LogIn, AlertCircle } from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";
import { useState, useEffect } from "react";

const Login = () => {
	const { signIn, user, profile, loading, profileLoading, sessionChecked } =
		useAuth();
	const location = useLocation();
	const from = location.state?.from?.pathname || "/";

	const [isSubmitting, setIsSubmitting] = useState(false);
	const [loginError, setLoginError] = useState(null);
	const [loginSuccess, setLoginSuccess] = useState(false);

	const {
		register,
		handleSubmit,
		formState: { errors },
	} = useForm();

	// Aguardar TANTO user QUANTO profile estarem prontos
	useEffect(() => {
		if (user && profile && loginSuccess && !loading && !profileLoading) {
			// Usar window.location em vez de navigate()
			const redirectTimer = setTimeout(() => {
				window.location.href = from;
			}, 500);

			return () => clearTimeout(redirectTimer);
		}
	}, [user, profile, loginSuccess, loading, profileLoading, from]);

	// Timeout de fallback após 1.5 segundos
	useEffect(() => {
		if (isSubmitting && loginSuccess) {
			const fallbackTimer = setTimeout(() => {
				window.location.href = from;
			}, 1500); // 1.5 segundos de fallback

			return () => clearTimeout(fallbackTimer);
		}
	}, [isSubmitting, loginSuccess, from]);

	// Redirecionar se já estiver logado (sem login)
	if (sessionChecked && user && !loginSuccess) {
		return <Navigate to={from} replace />;
	}

	const onSubmit = async (data) => {
		if (isSubmitting) return;

		try {
			setIsSubmitting(true);
			setLoginError(null);
			setLoginSuccess(false);

			// Login normal - sem aguardar estados
			const result = await signIn(data.email, data.password);

			if (result.error) {
				setLoginError(result.error.message);
				setIsSubmitting(false);
				return;
			}

			setLoginSuccess(true);
			// isSubmitting permanece true até o redirect
		} catch (error) {
			console.error("❌ Erro no login:", error);
			setLoginError(error.message || "Erro inesperado no login");
			setIsSubmitting(false);
			setLoginSuccess(false);
		}
	};

	// Loading screen durante o processo
	if (isSubmitting && loginSuccess) {
		return (
			<div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-black flex items-center justify-center px-4">
				<div className="text-center">
					<div className="relative mb-8">
						<div className="w-20 h-20 bg-gradient-to-r from-red-600 to-red-500 rounded-2xl flex items-center justify-center mx-auto shadow-2xl">
							<LogIn className="w-10 h-10 text-white animate-spin" />
						</div>
						<div className="absolute inset-0 w-20 h-20 bg-gradient-to-r from-red-600 to-red-500 rounded-2xl mx-auto animate-ping opacity-20"></div>
					</div>

					<h2 className="text-2xl font-bold text-white mb-2">
						Login realizado!
					</h2>
					<p className="text-gray-400 mb-4">Aguardando dados carregarem...</p>

					{/* Status detalhado */}
					<div className="text-sm text-gray-500 space-y-1 mb-4">
						<p>
							{user ? "✅" : "⏳"} Usuário: {user ? "OK" : "Carregando..."}
						</p>
					</div>

					<div className="w-64 h-2 bg-gray-800 rounded-full mx-auto overflow-hidden">
						<div className="h-full bg-gradient-to-r from-red-600 to-red-500 rounded-full animate-pulse"></div>
					</div>

					<p className="text-xs text-gray-500 mt-4">Carregando dados...</p>
				</div>
			</div>
		);
	}

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

					{/* Error Alert */}
					{loginError && (
						<div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-2xl">
							<div className="flex items-center space-x-3">
								<AlertCircle className="w-5 h-5 text-red-400" />
								<div>
									<p className="text-red-400 font-semibold">Erro no login</p>
									<p className="text-red-300 text-sm">{loginError}</p>
								</div>
							</div>
						</div>
					)}

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
									disabled={isSubmitting}
									className="w-full pl-12 pr-4 py-4 bg-gray-800/50 border border-gray-600/50 rounded-2xl text-white placeholder-gray-500 focus:outline-none focus:border-red-500/50 focus:bg-gray-800 transition-all duration-300 disabled:opacity-50"
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
									disabled={isSubmitting}
									className="w-full pl-12 pr-4 py-4 bg-gray-800/50 border border-gray-600/50 rounded-2xl text-white placeholder-gray-500 focus:outline-none focus:border-red-500/50 focus:bg-gray-800 transition-all duration-300 disabled:opacity-50"
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
							disabled={isSubmitting || loading}
							className="w-full bg-gradient-to-r from-red-600 to-red-500 hover:from-red-500 hover:to-red-400 text-white py-4 rounded-2xl font-semibold text-lg transition-all duration-300 shadow-lg hover:shadow-red-500/25 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center justify-center space-x-3"
						>
							{isSubmitting ? (
								<>
									<div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
									<span>Entrando...</span>
								</>
							) : (
								<>
									<LogIn className="w-5 h-5" />
									<span>Entrar</span>
								</>
							)}
						</button>
					</form>

					{/* Info adicional */}
					<div className="mt-6 pt-6 border-t border-gray-700/50">
						<p className="text-center text-sm text-gray-500">
							Problemas para entrar?{" "}
							<a
								href="#"
								className="text-red-400 hover:text-red-300 transition-colors duration-300"
							>
								Entre em contato
							</a>
						</p>
					</div>
				</div>
			</div>
		</div>
	);
};

export default Login;
