import React, { useState, useRef, useEffect } from "react";
import {
	X,
	Link as LinkIcon,
	ExternalLink,
	Globe,
	AlertCircle,
	Check,
} from "lucide-react";
import toast from "react-hot-toast";

/**
 * LinkInsertModal - Modal para inserção rápida de links no editor
 * - Interface intuitiva para texto e URL
 * - Validação de URL em tempo real
 * - Preview do link
 * - Inserção automática de markdown
 * - Suporte a links internos e externos
 */

const LinkInsertModal = ({ isOpen, onClose, onLinkInserted }) => {
	const textInputRef = useRef(null);
	const urlInputRef = useRef(null);

	// Estados do modal
	const [linkText, setLinkText] = useState("");
	const [linkUrl, setLinkUrl] = useState("");
	const [urlError, setUrlError] = useState("");
	const [isValidating, setIsValidating] = useState(false);
	const [urlValid, setUrlValid] = useState(false);

	// Reset do modal
	const resetModal = () => {
		setLinkText("");
		setLinkUrl("");
		setUrlError("");
		setIsValidating(false);
		setUrlValid(false);
	};

	// Fechar modal
	const handleClose = () => {
		resetModal();
		onClose();
	};

	// Focar no primeiro campo quando abrir
	useEffect(() => {
		if (isOpen && textInputRef.current) {
			setTimeout(() => {
				textInputRef.current?.focus();
			}, 100);
		}
	}, [isOpen]);

	// Validação de URL em tempo real
	useEffect(() => {
		if (!linkUrl.trim()) {
			setUrlError("");
			setUrlValid(false);
			return;
		}

		setIsValidating(true);
		setUrlError("");

		// Debounce da validação
		const timeoutId = setTimeout(() => {
			validateUrl(linkUrl);
		}, 500);

		return () => clearTimeout(timeoutId);
	}, [linkUrl]);

	// Função de validação de URL
	const validateUrl = (url) => {
		try {
			// Adicionar protocolo se não tiver
			let urlToValidate = url.trim();
			if (
				!urlToValidate.startsWith("http://") &&
				!urlToValidate.startsWith("https://") &&
				!urlToValidate.startsWith("/")
			) {
				urlToValidate = "https://" + urlToValidate;
			}

			// Validação básica de URL
			if (urlToValidate.startsWith("/")) {
				// URL interna - validação simples
				setUrlValid(true);
				setUrlError("");
			} else {
				// URL externa - validação mais rigorosa
				const urlObj = new URL(urlToValidate);

				// Verificar se é um domínio válido
				if (urlObj.hostname && urlObj.hostname.includes(".")) {
					setUrlValid(true);
					setUrlError("");

					// Atualizar o campo com protocolo se foi adicionado
					if (url !== urlToValidate) {
						setLinkUrl(urlToValidate);
					}
				} else {
					throw new Error("Domínio inválido");
				}
			}
		} catch (error) {
			setUrlValid(false);
			setUrlError(
				"URL inválida. Exemplo: https://exemplo.com ou /pagina-interna"
			);
		} finally {
			setIsValidating(false);
		}
	};

	// Detectar tipo de link
	const getLinkType = (url) => {
		if (!url) return null;

		if (url.startsWith("/")) {
			return { type: "internal", icon: LinkIcon, label: "Link Interno" };
		} else if (url.startsWith("http")) {
			return { type: "external", icon: ExternalLink, label: "Link Externo" };
		} else {
			return { type: "website", icon: Globe, label: "Website" };
		}
	};

	// Inserir link no editor
	const handleInsertLink = () => {
		// Validação final
		if (!linkText.trim()) {
			toast.error("Digite o texto do link");
			textInputRef.current?.focus();
			return;
		}

		if (!linkUrl.trim()) {
			toast.error("Digite a URL do link");
			urlInputRef.current?.focus();
			return;
		}

		if (!urlValid) {
			toast.error("URL inválida");
			urlInputRef.current?.focus();
			return;
		}

		// Gerar markdown do link
		const markdown = `[${linkText.trim()}](${linkUrl.trim()})`;

		// Callback para inserir no editor
		if (onLinkInserted) {
			onLinkInserted({
				markdown,
				text: linkText.trim(),
				url: linkUrl.trim(),
				type: getLinkType(linkUrl)?.type || "external",
			});
		}

		toast.success("Link inserido no editor!");

		// Fechar modal após sucesso
		setTimeout(() => {
			handleClose();
		}, 300);
	};

	// Shortcuts de teclado
	const handleKeyDown = (e) => {
		// Enter para inserir (se ambos os campos estão preenchidos)
		if (e.key === "Enter" && linkText.trim() && linkUrl.trim() && urlValid) {
			e.preventDefault();
			handleInsertLink();
		}

		// Escape para fechar
		if (e.key === "Escape") {
			e.preventDefault();
			handleClose();
		}

		// Tab para navegar entre campos
		if (e.key === "Tab" && e.target === textInputRef.current && !e.shiftKey) {
			e.preventDefault();
			urlInputRef.current?.focus();
		}
	};

	// Sugestões de links comuns
	const commonLinks = [
		{ text: "Torque Forged", url: "/", type: "internal" },
		{ text: "Fórmula 1", url: "/f1", type: "internal" },
		{ text: "NASCAR", url: "/nascar", type: "internal" },
		{ text: "FIA", url: "https://www.fia.com", type: "external" },
		{ text: "Formula1.com", url: "https://www.formula1.com", type: "external" },
	];

	// Aplicar sugestão
	const applySuggestion = (suggestion) => {
		setLinkText(suggestion.text);
		setLinkUrl(suggestion.url);
	};

	// Não renderizar se não estiver aberto
	if (!isOpen) return null;

	const linkType = getLinkType(linkUrl);

	return (
		<div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
			<div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-3xl border border-gray-700/50 max-w-lg w-full max-h-[90vh] overflow-y-auto">
				{/* Header */}
				<div className="flex items-center justify-between p-6 border-b border-gray-700/50">
					<div className="flex items-center space-x-3">
						<div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl flex items-center justify-center">
							<LinkIcon className="w-5 h-5 text-white" />
						</div>
						<div>
							<h2 className="text-xl font-bold text-white">Inserir Link</h2>
							<p className="text-gray-400 text-sm">
								Adicione um link ao seu conteúdo
							</p>
						</div>
					</div>
					<button
						onClick={handleClose}
						className="p-2 rounded-xl text-gray-400 hover:text-white hover:bg-gray-700/50 transition-colors duration-300"
					>
						<X className="w-5 h-5" />
					</button>
				</div>

				{/* Content */}
				<div className="p-6 space-y-6">
					{/* Texto do Link */}
					<div>
						<label className="block text-white font-semibold mb-3">
							Texto do Link *
						</label>
						<input
							ref={textInputRef}
							type="text"
							value={linkText}
							onChange={(e) => setLinkText(e.target.value)}
							onKeyDown={handleKeyDown}
							className="w-full px-4 py-3 bg-gray-800/50 border border-gray-600/50 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-blue-500/50 focus:bg-gray-800 transition-all duration-300"
							placeholder="Ex: Visite nosso site"
							maxLength={100}
						/>
						<p className="text-gray-500 text-xs mt-2">
							Este será o texto clicável que aparece no post
						</p>
					</div>

					{/* URL do Link */}
					<div>
						<label className="block text-white font-semibold mb-3">
							URL de Destino *
						</label>
						<input
							ref={urlInputRef}
							type="url"
							value={linkUrl}
							onChange={(e) => setLinkUrl(e.target.value)}
							onKeyDown={handleKeyDown}
							className={`w-full px-4 py-3 bg-gray-800/50 border rounded-xl text-white placeholder-gray-500 focus:outline-none focus:bg-gray-800 transition-all duration-300 ${
								urlError
									? "border-red-500/50 focus:border-red-500/50"
									: urlValid
									? "border-green-500/50 focus:border-green-500/50"
									: "border-gray-600/50 focus:border-blue-500/50"
							}`}
							placeholder="https://exemplo.com ou /pagina-interna"
						/>

						{/* Status da URL */}
						<div className="mt-2 flex items-center justify-between">
							<div className="flex items-center space-x-2">
								{isValidating && (
									<div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
								)}

								{!isValidating && urlValid && linkType && (
									<div className="flex items-center space-x-2 text-green-400">
										<Check className="w-4 h-4" />
										<linkType.icon className="w-4 h-4" />
										<span className="text-sm font-medium">
											{linkType.label}
										</span>
									</div>
								)}

								{!isValidating && urlError && (
									<div className="flex items-center space-x-2 text-red-400">
										<AlertCircle className="w-4 h-4" />
										<span className="text-sm">{urlError}</span>
									</div>
								)}
							</div>

							{linkUrl && !isValidating && urlValid && (
								<span className="text-gray-500 text-xs">✓ URL válida</span>
							)}
						</div>
					</div>

					{/* Preview do Link */}
					{linkText && linkUrl && urlValid && (
						<div className="bg-gray-800/30 rounded-xl p-4 border border-gray-700/30">
							<h4 className="text-white font-semibold mb-2">Preview</h4>
							<div className="text-gray-300">
								Este é um parágrafo com{" "}
								<span className="text-blue-400 underline decoration-blue-400/50 cursor-pointer">
									{linkText}
								</span>{" "}
								inserido no meio do texto.
							</div>
							<div className="mt-3 text-xs text-gray-500 bg-gray-900/50 p-2 rounded-lg">
								<strong>Markdown:</strong>{" "}
								<code>
									[{linkText}]({linkUrl})
								</code>
							</div>
						</div>
					)}

					{/* Sugestões */}
					{!linkText && !linkUrl && (
						<div className="bg-gray-800/30 rounded-xl p-4 border border-gray-700/30">
							<h4 className="text-white font-semibold mb-3">
								Sugestões Rápidas
							</h4>
							<div className="space-y-2">
								{commonLinks.map((suggestion, index) => (
									<button
										key={index}
										onClick={() => applySuggestion(suggestion)}
										className="w-full text-left p-3 rounded-lg bg-gray-700/30 hover:bg-gray-700/50 transition-colors duration-300 group"
									>
										<div className="flex items-center justify-between">
											<div className="flex items-center space-x-3">
												{suggestion.type === "internal" ? (
													<LinkIcon className="w-4 h-4 text-blue-400" />
												) : (
													<ExternalLink className="w-4 h-4 text-green-400" />
												)}
												<div>
													<span className="text-white font-medium group-hover:text-blue-400 transition-colors duration-300">
														{suggestion.text}
													</span>
													<span className="text-gray-500 text-sm block">
														{suggestion.url}
													</span>
												</div>
											</div>
											<span className="text-gray-500 text-xs opacity-0 group-hover:opacity-100 transition-opacity duration-300">
												Usar
											</span>
										</div>
									</button>
								))}
							</div>
						</div>
					)}

					{/* Dicas */}
					<div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4">
						<h4 className="text-blue-400 font-semibold mb-2">💡 Dicas</h4>
						<ul className="text-blue-300 text-sm space-y-1">
							<li>
								• Use <strong>/pagina</strong> para links internos do site
							</li>
							<li>• Links externos abrem em nova aba automaticamente</li>
							<li>• Textos descritivos são melhores que "clique aqui"</li>
							<li>
								• <strong>Enter</strong> para inserir, <strong>Esc</strong> para
								cancelar
							</li>
						</ul>
					</div>
				</div>

				{/* Footer */}
				<div className="flex items-center justify-end space-x-3 p-6 border-t border-gray-700/50">
					<button
						onClick={handleClose}
						className="px-6 py-3 text-gray-300 hover:text-white border border-gray-600 hover:border-gray-500 rounded-xl font-semibold transition-colors duration-300"
					>
						Cancelar
					</button>
					<button
						onClick={handleInsertLink}
						disabled={!linkText.trim() || !linkUrl.trim() || !urlValid}
						className="flex items-center space-x-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white px-6 py-3 rounded-xl font-semibold transition-all duration-300 shadow-lg hover:shadow-blue-500/25 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
					>
						<LinkIcon className="w-4 h-4" />
						<span>Inserir Link</span>
					</button>
				</div>
			</div>
		</div>
	);
};

export default LinkInsertModal;
