import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import {
	User,
	Mail,
	Lock,
	Save,
	Shield,
	ArrowLeft,
	Eye,
	EyeOff,
} from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { supabase } from "../lib/supabase";
import toast from "react-hot-toast";
import { Link, Navigate } from "react-router-dom";
import AvatarUpload from "../components/AvatarUpload";

const Profile = () => {
	const {
		user,
		profile,
		isAdmin,
		updateProfile,
		getDisplayName,
		loading: authLoading,
		profileLoading,
		sessionChecked,
	} = useAuth();

	const [loading, setLoading] = useState(false);
	const [showPassword, setShowPassword] = useState(false);
	const [showConfirmPassword, setShowConfirmPassword] = useState(false);
	const [activeTab, setActiveTab] = useState("profile");
	const [formInitialized, setFormInitialized] = useState(false);

	const {
		register,
		handleSubmit,
		setValue,
		formState: { errors },
	} = useForm();

	const passwordForm = useForm();

	// Debug logs em desenvolvimento
	useEffect(() => {
		if (process.env.NODE_ENV === "development") {
			console.log("🏠 Profile Component State:", {
				sessionChecked,
				user: !!user,
				profile: !!profile,
				authLoading,
				profileLoading,
				formInitialized,
				isAdmin,
			});
		}
	}, [
		sessionChecked,
		user,
		profile,
		authLoading,
		profileLoading,
		formInitialized,
		isAdmin,
	]);

	// Preencher formulário quando dados estiverem COMPLETAMENTE disponíveis
	useEffect(() => {
		if (
			sessionChecked &&
			user &&
			!authLoading &&
			!profileLoading &&
			!formInitialized
		) {
			console.log("📝 Inicializando formulário com dados disponíveis");

			const name = profile?.full_name || user.email?.split("@")[0] || "";
			const email = profile?.email || user.email || "";

			setValue("full_name", name);
			setValue("email", email);

			setFormInitialized(true);
			console.log("✅ Formulário inicializado:", { name, email });
		}
	}, [
		sessionChecked,
		user,
		profile,
		authLoading,
		profileLoading,
		formInitialized,
		setValue,
	]);

	const onSubmitProfile = async (data) => {
		try {
			setLoading(true);
			console.log("💾 Salvando perfil:", data);

			const updateData = {
				email: data.email,
				full_name: data.full_name,
			};

			console.log("📤 Enviando dados:", updateData);

			const { error } = await updateProfile(updateData);

			if (!error) {
				console.log("✅ Perfil atualizado com sucesso");
			}
		} catch (error) {
			console.error("Error updating profile:", error);
			toast.error("Erro ao atualizar perfil");
		} finally {
			setLoading(false);
		}
	};

	const onSubmitPassword = async (data) => {
		try {
			setLoading(true);

			if (data.newPassword !== data.confirmPassword) {
				toast.error("Senhas não coincidem");
				return;
			}

			const { error } = await supabase.auth.updateUser({
				password: data.newPassword,
			});

			if (error) throw error;

			toast.success("Senha alterada com sucesso!");
			passwordForm.reset();
		} catch (error) {
			console.error("Error updating password:", error);
			toast.error("Erro ao alterar senha: " + error.message);
		} finally {
			setLoading(false);
		}
	};

	// Callback para sucesso no upload do avatar
	const handleAvatarUploadSuccess = (result) => {
		console.log("✅ Avatar upload success:", result);
		// O componente AvatarUpload já chama updateProfile automaticamente
		// Não precisamos fazer nada aqui, apenas log para debug
	};

	// Callback para erro no upload do avatar
	const handleAvatarUploadError = (error) => {
		console.error("❌ Avatar upload error:", error);
		// Toast já é mostrado pelo componente AvatarUpload
	};

	const tabs = [
		{ id: "profile", name: "Perfil", icon: User },
		{ id: "security", name: "Segurança", icon: Lock },
	];

	// Aguardar verificação da sessão PRIMEIRO
	if (!sessionChecked) {
		return (
			<div className="min-h-screen pt-20 bg-gradient-to-br from-black via-gray-900 to-black flex items-center justify-center">
				<div className="text-center">
					<div className="relative mb-8">
						<div className="w-20 h-20 bg-gradient-to-r from-red-600 to-red-500 rounded-2xl flex items-center justify-center mx-auto shadow-2xl">
							<User className="w-10 h-10 text-white" />
						</div>
						<div className="absolute inset-0 w-20 h-20 bg-gradient-to-r from-red-600 to-red-500 rounded-2xl mx-auto animate-ping opacity-20"></div>
					</div>
					<h2 className="text-2xl font-bold text-white mb-2">
						Verificando sessão
					</h2>
					<p className="text-gray-400 mb-4">
						Aguarde enquanto verificamos sua autenticação...
					</p>
					{process.env.NODE_ENV === "development" && (
						<p className="text-xs text-gray-500">
							🔧 Dev: sessionChecked = {sessionChecked.toString()}
						</p>
					)}
				</div>
			</div>
		);
	}

	// SE sessão verificada E não há usuário = redirecionar
	if (sessionChecked && !user) {
		console.log(
			"🔒 Profile: Usuário não autenticado, redirecionando para login"
		);
		return (
			<Navigate
				to="/admin/login"
				state={{ from: { pathname: "/profile" } }}
				replace
			/>
		);
	}

	// SE há usuário MAS ainda está carregando auth ou profile = mostrar loading
	if (user && (authLoading || profileLoading)) {
		return (
			<div className="min-h-screen pt-20 bg-gradient-to-br from-black via-gray-900 to-black flex items-center justify-center">
				<div className="text-center">
					<div className="relative mb-8">
						<div className="w-20 h-20 bg-gradient-to-r from-red-600 to-red-500 rounded-2xl flex items-center justify-center mx-auto shadow-2xl">
							<User className="w-10 h-10 text-white animate-pulse" />
						</div>
					</div>
					<h2 className="text-2xl font-bold text-white mb-2">
						Carregando perfil
					</h2>
					<p className="text-gray-400">
						{authLoading
							? "Verificando autenticação..."
							: "Carregando dados do perfil..."}
					</p>
					{process.env.NODE_ENV === "development" && (
						<div className="text-xs text-gray-500 mt-4 space-y-1">
							<p>🔧 Dev Debug:</p>
							<p>authLoading: {authLoading.toString()}</p>
							<p>profileLoading: {profileLoading.toString()}</p>
							<p>user: {user ? "present" : "null"}</p>
							<p>profile: {profile ? "present" : "null"}</p>
						</div>
					)}
				</div>
			</div>
		);
	}

	// Se chegou até aqui, usuário está autenticado e dados carregados
	return (
		<div className="min-h-screen pt-20 bg-gradient-to-br from-black via-gray-900 to-black">
			<div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
				{/* Header */}
				<div className="mb-8">
					<Link
						to="/"
						className="inline-flex items-center text-red-400 hover:text-red-300 mb-6 transition-colors duration-300"
					>
						<ArrowLeft className="w-4 h-4 mr-2" />
						Voltar ao início
					</Link>

					<div className="flex items-center space-x-6">
						{/* Avatar usando AvatarService (otimizado) */}
						<div className="relative w-20 h-20">
							{profile?.avatar_url ? (
								<img
									src={profile.avatar_url}
									alt={getDisplayName()}
									className="w-20 h-20 rounded-2xl object-cover shadow-lg"
									onError={(e) => {
										console.warn("Erro ao carregar avatar:", e);
										e.target.style.display = "none";
										e.target.nextSibling.style.display = "flex";
									}}
								/>
							) : null}
							{!profile?.avatar_url && (
								<div className="w-20 h-20 bg-gradient-to-r from-red-600 to-red-500 rounded-2xl flex items-center justify-center shadow-lg">
									<User className="w-10 h-10 text-white" />
								</div>
							)}
						</div>
						<div>
							<h1 className="text-3xl font-black text-white mb-2">
								Meu Perfil
							</h1>
							<p className="text-gray-400">
								Gerencie suas informações pessoais e configurações de conta
							</p>
							{isAdmin && (
								<span className="inline-flex items-center space-x-1 text-sm text-orange-400 bg-orange-500/20 px-3 py-1 rounded-full mt-2">
									<Shield className="w-4 h-4" />
									<span>Administrador</span>
								</span>
							)}
						</div>
					</div>
				</div>

				{/* Tabs */}
				<div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-3xl border border-gray-700/50 overflow-hidden">
					<div className="border-b border-gray-700/50">
						<nav className="flex space-x-8 px-8">
							{tabs.map((tab) => {
								const Icon = tab.icon;
								return (
									<button
										key={tab.id}
										onClick={() => setActiveTab(tab.id)}
										className={`flex items-center space-x-2 py-6 border-b-2 transition-all duration-300 ${
											activeTab === tab.id
												? "border-red-500 text-red-400"
												: "border-transparent text-gray-400 hover:text-gray-300"
										}`}
									>
										<Icon className="w-5 h-5" />
										<span className="font-semibold">{tab.name}</span>
									</button>
								);
							})}
						</nav>
					</div>

					<div className="p-8">
						{activeTab === "profile" && (
							<div className="space-y-8">
								{/* Avatar Upload Section */}
								<div>
									<h3 className="text-xl font-bold text-white mb-6">
										Foto de Perfil
									</h3>
									<AvatarUpload
										size={150}
										onUploadSuccess={handleAvatarUploadSuccess}
										onUploadError={handleAvatarUploadError}
										showRemoveButton={true}
									/>
								</div>

								{/* Profile Form */}
								<form
									onSubmit={handleSubmit(onSubmitProfile)}
									className="space-y-6"
								>
									<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
										<div>
											<label className="block text-white font-semibold mb-3">
												Nome Completo
											</label>
											<div className="relative">
												<User className="absolute left-4 top-4 w-5 h-5 text-gray-400" />
												<input
													type="text"
													{...register("full_name")}
													className="w-full pl-12 pr-4 py-4 bg-gray-800/50 border border-gray-600/50 rounded-2xl text-white placeholder-gray-500 focus:outline-none focus:border-red-500/50 focus:bg-gray-800 transition-all duration-300"
													placeholder="Seu nome completo"
												/>
											</div>
										</div>

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
													placeholder="seu@email.com"
												/>
											</div>
											{errors.email && (
												<p className="text-red-400 text-sm mt-2">
													{errors.email.message}
												</p>
											)}
										</div>
									</div>

									{/* Role Info */}
									<div className="bg-gray-800/30 rounded-2xl p-6 border border-gray-700/30">
										<h3 className="text-white font-semibold mb-2">
											Informações da Conta
										</h3>
										<div className="space-y-2 text-gray-400">
											<p>
												<strong>Cadastrado em:</strong>{" "}
												{user?.created_at
													? new Date(user.created_at).toLocaleDateString(
															"pt-BR"
													  )
													: "N/A"}
											</p>
											<p>
												<strong>Último acesso:</strong>{" "}
												{user?.last_sign_in_at
													? new Date(user.last_sign_in_at).toLocaleDateString(
															"pt-BR"
													  )
													: "N/A"}
											</p>
											<p>
												<strong>Função:</strong>{" "}
												<span
													className={
														isAdmin
															? "text-orange-400 font-semibold"
															: "text-gray-400"
													}
												>
													{isAdmin ? "Administrador" : "Usuário"}
												</span>
											</p>
										</div>
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
												<Save className="w-5 h-5" />
												<span>Salvar Alterações</span>
											</>
										)}
									</button>
								</form>
							</div>
						)}

						{activeTab === "security" && (
							<form
								onSubmit={passwordForm.handleSubmit(onSubmitPassword)}
								className="space-y-6"
							>
								<div className="space-y-6">
									<div>
										<label className="block text-white font-semibold mb-3">
											Nova Senha
										</label>
										<div className="relative">
											<Lock className="absolute left-4 top-4 w-5 h-5 text-gray-400" />
											<input
												type={showPassword ? "text" : "password"}
												{...passwordForm.register("newPassword", {
													required: "Nova senha é obrigatória",
													minLength: {
														value: 6,
														message: "Senha deve ter pelo menos 6 caracteres",
													},
												})}
												className="w-full pl-12 pr-12 py-4 bg-gray-800/50 border border-gray-600/50 rounded-2xl text-white placeholder-gray-500 focus:outline-none focus:border-red-500/50 focus:bg-gray-800 transition-all duration-300"
												placeholder="Digite sua nova senha"
											/>
											<button
												type="button"
												onClick={() => setShowPassword(!showPassword)}
												className="absolute right-4 top-4 text-gray-400 hover:text-gray-300"
											>
												{showPassword ? (
													<EyeOff className="w-5 h-5" />
												) : (
													<Eye className="w-5 h-5" />
												)}
											</button>
										</div>
										{passwordForm.formState.errors.newPassword && (
											<p className="text-red-400 text-sm mt-2">
												{passwordForm.formState.errors.newPassword.message}
											</p>
										)}
									</div>

									<div>
										<label className="block text-white font-semibold mb-3">
											Confirmar Nova Senha
										</label>
										<div className="relative">
											<Lock className="absolute left-4 top-4 w-5 h-5 text-gray-400" />
											<input
												type={showConfirmPassword ? "text" : "password"}
												{...passwordForm.register("confirmPassword", {
													required: "Confirmação de senha é obrigatória",
												})}
												className="w-full pl-12 pr-12 py-4 bg-gray-800/50 border border-gray-600/50 rounded-2xl text-white placeholder-gray-500 focus:outline-none focus:border-red-500/50 focus:bg-gray-800 transition-all duration-300"
												placeholder="Confirme sua nova senha"
											/>
											<button
												type="button"
												onClick={() =>
													setShowConfirmPassword(!showConfirmPassword)
												}
												className="absolute right-4 top-4 text-gray-400 hover:text-gray-300"
											>
												{showConfirmPassword ? (
													<EyeOff className="w-5 h-5" />
												) : (
													<Eye className="w-5 h-5" />
												)}
											</button>
										</div>
										{passwordForm.formState.errors.confirmPassword && (
											<p className="text-red-400 text-sm mt-2">
												{passwordForm.formState.errors.confirmPassword.message}
											</p>
										)}
									</div>
								</div>

								<div className="bg-yellow-500/10 border border-yellow-500/20 rounded-2xl p-4">
									<p className="text-yellow-400 text-sm">
										<strong>Dica de Segurança:</strong> Use uma senha forte com
										pelo menos 8 caracteres, incluindo letras maiúsculas,
										minúsculas, números e símbolos.
									</p>
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
											<Lock className="w-5 h-5" />
											<span>Alterar Senha</span>
										</>
									)}
								</button>
							</form>
						)}
					</div>
				</div>
			</div>
		</div>
	);
};

export default Profile;
