import React, { useEffect, useState } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

const ProtectedRoute = ({ children }) => {
	const { user, loading } = useAuth();
	const location = useLocation();
	const [timeoutWarning, setTimeoutWarning] = useState(false);

	// Timeout para mostrar aviso se o loading demorar muito
	useEffect(() => {
		if (loading) {
			const timer = setTimeout(() => {
				setTimeoutWarning(true);
			}, 5000); // 5 segundos

			return () => clearTimeout(timer);
		} else {
			setTimeoutWarning(false);
		}
	}, [loading]);

	// Loading com feedback melhorado
	if (loading) {
		return (
			<div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-black flex items-center justify-center">
				<div className="text-center">
					{/* Logo animado */}
					<div className="relative mb-8">
						<div className="w-20 h-20 bg-gradient-to-r from-red-600 to-red-500 rounded-2xl flex items-center justify-center mx-auto shadow-2xl">
							<svg
								className="w-10 h-10 text-white animate-spin"
								fill="none"
								stroke="currentColor"
								viewBox="0 0 24 24"
							>
								<path
									strokeLinecap="round"
									strokeLinejoin="round"
									strokeWidth={2}
									d="M12 2v4m0 0l2.5-2.5M12 6l-2.5-2.5M18 12h-4m0 0l2.5 2.5M14 12l2.5-2.5M12 18v-4m0 0l-2.5 2.5M12 14l2.5 2.5M6 12h4m0 0L7.5 9.5M10 12L7.5 14.5"
								/>
							</svg>
						</div>
						<div className="absolute inset-0 w-20 h-20 bg-gradient-to-r from-red-600 to-red-500 rounded-2xl mx-auto animate-ping opacity-20"></div>
					</div>

					{/* Texto de carregamento */}
					<h2 className="text-2xl font-bold text-white mb-2">
						Verificando autenticação
					</h2>
					<p className="text-gray-400 mb-4">
						{timeoutWarning
							? "Isto está demorando mais que o esperado..."
							: "Aguarde enquanto verificamos suas credenciais..."}
					</p>

					{/* Barra de progresso animada */}
					<div className="w-64 h-2 bg-gray-800 rounded-full mx-auto overflow-hidden">
						<div className="h-full bg-gradient-to-r from-red-600 to-red-500 rounded-full animate-pulse"></div>
					</div>

					{/* Aviso de timeout */}
					{timeoutWarning && (
						<div className="mt-8 p-4 bg-yellow-900/20 border border-yellow-500/30 rounded-xl max-w-md mx-auto">
							<p className="text-yellow-400 text-sm">
								Se esta tela persistir, tente recarregar a página ou verificar
								sua conexão.
							</p>
							<button
								onClick={() => window.location.reload()}
								className="mt-3 bg-yellow-600 hover:bg-yellow-700 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-colors duration-300"
							>
								Recarregar Página
							</button>
						</div>
					)}

					{/* Debug info apenas em desenvolvimento */}
					{process.env.NODE_ENV === "development" && (
						<div className="mt-8 text-xs text-gray-500">
							<p>🔧 Modo desenvolvimento</p>
							<p>Localização: {location.pathname}</p>
							<p>Loading: {loading ? "true" : "false"}</p>
							<p>User: {user ? "present" : "null"}</p>
						</div>
					)}
				</div>
			</div>
		);
	}

	// Se não há usuário, redirecionar para login
	if (!user) {
		console.log(
			"🔒 ProtectedRoute: Usuário não autenticado, redirecionando para login"
		);
		return <Navigate to="/admin/login" state={{ from: location }} replace />;
	}

	// Se há usuário, renderizar componente protegido
	console.log("✅ ProtectedRoute: Usuário autenticado, renderizando conteúdo");
	return children;
};

export default ProtectedRoute;
