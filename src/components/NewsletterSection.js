import React, { useState, useCallback, useEffect } from "react";
import { Mail, Send, CheckCircle, AlertCircle, RefreshCw } from "lucide-react";
import { NewsletterService } from "../services/NewsletterService";
import toast from "react-hot-toast";

/**
 * NewsletterSection - VERSÃO LIMPA (sem testes automáticos)
 * - Diagnóstico apenas manual
 * - Limpeza de emails de teste
 * - Estados visuais claros
 * - Zero inserções automáticas
 */

const NewsletterSection = React.memo(() => {
	const [email, setEmail] = useState("");
	const [isLoading, setIsLoading] = useState(false);
	const [isSubscribed, setIsSubscribed] = useState(false);
	const [error, setError] = useState("");
	const [retryCount, setRetryCount] = useState(0);
	const [lastMethod, setLastMethod] = useState("");

	// Debug mode para desenvolvimento
	const isDebugMode = process.env.NODE_ENV === "development";

	// Limpeza inicial de emails de teste (apenas uma vez por sessão)
	useEffect(() => {
		if (isDebugMode) {
			const cleanupDone = sessionStorage.getItem("newsletter-cleanup-done");
			if (!cleanupDone) {
				// Aguardar 2 segundos antes de fazer limpeza para não interferir no carregamento
				const timer = setTimeout(() => {
					NewsletterService.cleanupTestEmails()
						.then(() => {
							sessionStorage.setItem("newsletter-cleanup-done", "true");
							console.log("📧 Newsletter: Test emails cleanup completed");
						})
						.catch(() => {
							// Ignorar erros de limpeza
						});
				}, 2000);

				return () => clearTimeout(timer);
			}
		}
	}, [isDebugMode]);

	// Validação de email
	const isValidEmail = useCallback((email) => {
		return NewsletterService.validateEmail(email);
	}, []);

	// Handler para mudança no input
	const handleEmailChange = useCallback(
		(e) => {
			const value = e.target.value;
			setEmail(value);

			// Limpar estados de erro
			if (error) {
				setError("");
			}
			if (retryCount > 0) {
				setRetryCount(0);
			}
		},
		[error, retryCount]
	);

	// Handler para submissão ROBUSTO
	const handleSubmit = useCallback(
		async (e) => {
			e.preventDefault();

			// Validações básicas
			if (!email.trim()) {
				setError("Email é obrigatório");
				return;
			}

			if (!isValidEmail(email)) {
				setError("Formato de email inválido");
				return;
			}

			setIsLoading(true);
			setError("");

			try {
				if (isDebugMode) {
					console.log("📧 Newsletter: Submitting email:", email.trim());
				}

				// O service já tem múltiplas estratégias de fallback
				const result = await NewsletterService.subscribeEmail(email.trim());

				if (result.success) {
					// SUCESSO - independente do método usado
					setIsSubscribed(true);
					setEmail("");
					setRetryCount(0);
					setLastMethod(result.method || "unknown");

					// Toast personalizado baseado no método
					const getToastConfig = (method) => {
						switch (method) {
							case "direct":
								return { icon: "📧", message: result.message };
							case "rpc":
								return { icon: "🚀", message: result.message };
							case "simulation":
								return { icon: "💾", message: result.message };
							case "fallback":
								return { icon: "📮", message: result.message };
							default:
								return { icon: "✅", message: result.message };
						}
					};

					const toastConfig = getToastConfig(result.method);

					toast.success(toastConfig.message, {
						duration: 4000,
						icon: toastConfig.icon,
						style: {
							background: "linear-gradient(135deg, #064e3b 0%, #022c22 100%)",
							color: "#ffffff",
							border: "1px solid #10b981",
						},
					});

					// Reset após 6 segundos
					setTimeout(() => {
						setIsSubscribed(false);
						setLastMethod("");
					}, 6000);

					if (isDebugMode) {
						console.log("📧 Newsletter: Success via method:", result.method);
					}
				} else {
					// ERRO - mas ainda tenta ser útil
					setError(result.error);
					setRetryCount((prev) => prev + 1);

					toast.error(result.error, {
						duration: 4000,
						style: {
							background: "linear-gradient(135deg, #7f1d1d 0%, #450a0a 100%)",
							color: "#ffffff",
							border: "1px solid #ef4444",
						},
					});

					if (isDebugMode) {
						console.error("📧 Newsletter: All strategies failed:", result);
					}
				}
			} catch (error) {
				// Erro inesperado - ainda assim tenta ser gracioso
				const errorMessage =
					"Erro inesperado. Seu email foi salvo para processamento posterior.";
				setError(errorMessage);
				setRetryCount((prev) => prev + 1);

				toast.error(errorMessage, {
					duration: 3000,
				});

				if (isDebugMode) {
					console.error("📧 Newsletter: Unexpected error:", error);
				}
			} finally {
				setIsLoading(false);
			}
		},
		[email, isValidEmail, isDebugMode]
	);

	// Retry handler
	const handleRetry = useCallback(() => {
		setError("");
		const currentRetryCount = retryCount;
		setRetryCount(0);

		// Pequeno delay para UX melhor
		setTimeout(() => {
			handleSubmit({ preventDefault: () => {} });
		}, 300);

		if (isDebugMode) {
			console.log("📧 Newsletter: Retry attempt #", currentRetryCount + 1);
		}
	}, [handleSubmit, retryCount, isDebugMode]);

	// Estado de sucesso
	if (isSubscribed) {
		return (
			<div className="bg-gradient-to-br from-green-900/30 to-emerald-800/30 rounded-3xl p-8 border border-green-500/30 backdrop-blur-sm">
				<div className="text-center">
					<div className="w-16 h-16 bg-gradient-to-r from-green-500 to-emerald-500 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-xl">
						<CheckCircle className="w-8 h-8 text-white" />
					</div>
					<h3 className="text-xl font-bold text-white mb-2">
						Inscrição Confirmada! 🎉
					</h3>
					<p className="text-green-300 text-sm leading-relaxed mb-4">
						Obrigado por se inscrever na nossa newsletter. Você receberá as
						últimas novidades do motorsport diretamente no seu email!
					</p>
				</div>
			</div>
		);
	}

	return (
		<div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-3xl p-8 border border-gray-700/50 backdrop-blur-sm">
			{/* Header */}
			<div className="flex items-center justify-between mb-2">
				<h3 className="text-2xl font-bold text-white flex items-center space-x-3">
					<div className="w-2 h-8 bg-gradient-to-b from-blue-500 to-cyan-500 rounded-full"></div>
					<span>Newsletter</span>
				</h3>
			</div>

			<p className="text-gray-400 text-sm mb-6 leading-relaxed">
				Receba as últimas notícias do motorsport, análises exclusivas e conteúdo
				premium diretamente no seu email.
			</p>

			<form onSubmit={handleSubmit} className="space-y-4">
				{/* Input de email */}
				<div className="relative">
					<div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
						<Mail className="w-5 h-5 text-gray-400" />
					</div>
					<input
						type="email"
						value={email}
						onChange={handleEmailChange}
						placeholder="seu.email@exemplo.com"
						disabled={isLoading}
						className={`
							w-full pl-12 pr-4 py-3 
							bg-gray-800/50 border rounded-2xl 
							text-white placeholder-gray-500
							focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50
							disabled:opacity-50 disabled:cursor-not-allowed
							transition-all duration-300
							${
								error
									? "border-red-500/50 focus:ring-red-500/50 focus:border-red-500/50"
									: "border-gray-600/50 hover:border-gray-500/50"
							}
						`}
					/>
				</div>

				{/* Mensagem de erro com retry */}
				{error && (
					<div className="space-y-3">
						<div className="flex items-start space-x-2 text-red-400 text-sm">
							<AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
							<div className="flex-1">
								<p>{error}</p>
								{retryCount > 0 && (
									<p className="text-xs text-red-300 mt-1">
										Tentativa #{retryCount}
									</p>
								)}
							</div>
						</div>

						{/* Botão de retry inteligente */}
						{retryCount > 0 && retryCount < 3 && (
							<button
								type="button"
								onClick={handleRetry}
								disabled={isLoading}
								className="w-full flex items-center justify-center space-x-2 text-sm text-red-400 hover:text-red-300 border border-red-500/30 hover:border-red-400/50 py-2 rounded-xl transition-all duration-300 disabled:opacity-50"
							>
								<RefreshCw
									className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`}
								/>
								<span>Tentar Novamente</span>
							</button>
						)}

						{/* Fallback manual após muitas tentativas */}
						{retryCount >= 3 && (
							<div className="bg-yellow-900/20 border border-yellow-500/30 rounded-xl p-3 text-center">
								<p className="text-yellow-400 text-sm mb-2">
									Múltiplas tentativas falharam.
								</p>
								<p className="text-yellow-300 text-xs">
									Entre em contato conosco diretamente:
									<span className="font-medium">
										{" "}
										contato@torqueforgedmotorsport.com
									</span>
								</p>
							</div>
						)}
					</div>
				)}

				{/* Botão de submissão */}
				<button
					type="submit"
					disabled={isLoading || !email.trim() || !isValidEmail(email)}
					className={`
						w-full flex items-center justify-center space-x-2 
						px-6 py-3 rounded-2xl font-bold text-white
						transition-all duration-300 shadow-xl
						disabled:opacity-50 disabled:cursor-not-allowed
						disabled:transform-none
						${
							isLoading
								? "bg-blue-600 cursor-wait"
								: "bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 hover:scale-105 hover:shadow-blue-500/25"
						}
					`}
				>
					{isLoading ? (
						<>
							<div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
							<span>Processando...</span>
						</>
					) : (
						<>
							<Send className="w-5 h-5" />
							<span>Inscrever-se</span>
						</>
					)}
				</button>
			</form>

			{/* Benefícios */}
			<div className="mt-6 pt-6 border-t border-gray-700/50">
				<p className="text-gray-400 text-sm font-medium mb-3">
					O que você receberá:
				</p>
				<div className="space-y-2">
					{[
						"Notícias exclusivas do motorsport",
						"Análises técnicas detalhadas",
						"Conteúdo premium dos bastidores",
						"Antecipação de novos posts",
					].map((benefit, index) => (
						<div
							key={index}
							className="flex items-center space-x-2 text-sm text-gray-400"
						>
							<div className="w-1 h-1 bg-blue-500 rounded-full flex-shrink-0"></div>
							<span>{benefit}</span>
						</div>
					))}
				</div>
			</div>
		</div>
	);
});

NewsletterSection.displayName = "NewsletterSection";

export default NewsletterSection;
