import React, { useState, useMemo } from "react";
import { User } from "lucide-react";
import { AvatarService } from "../services/AvatarService";

/**
 * AvatarDisplay - Componente para exibir avatares
 * - Otimização automática de imagens
 * - Fallback para avatar padrão
 * - Diferentes tamanhos e estilos
 * - Loading states
 * - Error handling
 */

const AvatarDisplay = ({
	// Props principais
	avatarUrl,
	avatarPath,
	userName = "Usuário",

	// Configurações visuais
	size = 40,
	className = "",
	rounded = "rounded-xl",

	// Otimização
	optimize = true,
	quality = 80,

	// Estados
	showInitials = true,
	initialsColor = "from-red-600 to-red-500",
	fallbackIcon = User,

	// Eventos
	onClick,
	onLoad,
	onError,

	// Accessibility
	alt,
	title,

	// Debug
	debug = false,
}) => {
	const [imageError, setImageError] = useState(false);
	const [isLoading, setIsLoading] = useState(true);

	// Determinar URL otimizada
	const optimizedUrl = useMemo(() => {
		if (!avatarUrl && !avatarPath) return null;

		// Se optimize está desabilitado, usar URL original
		if (!optimize) {
			return avatarUrl;
		}

		// Se temos avatarPath, usar versão otimizada
		if (avatarPath) {
			return AvatarService.getOptimizedAvatarUrl(avatarPath, size);
		}

		// Usar URL original se não temos path
		return avatarUrl;
	}, [avatarUrl, avatarPath, optimize, size]);

	// Calcular iniciais do nome
	const initials = useMemo(() => {
		if (!userName || !showInitials) return "";

		return userName
			.split(" ")
			.map((name) => name.charAt(0))
			.join("")
			.substring(0, 2)
			.toUpperCase();
	}, [userName, showInitials]);

	// Props de acessibilidade
	const accessibilityProps = {
		alt: alt || `Avatar de ${userName}`,
		title: title || userName,
		role: onClick ? "button" : "img",
		tabIndex: onClick ? 0 : undefined,
		"aria-label": onClick
			? `Avatar de ${userName}, clique para editar`
			: undefined,
	};

	// Handler para erro de imagem
	const handleImageError = (e) => {
		if (debug) {
			console.warn("AvatarDisplay: Erro ao carregar imagem:", optimizedUrl);
		}

		setImageError(true);
		setIsLoading(false);

		if (onError) {
			onError(e);
		}
	};

	// Handler para load da imagem
	const handleImageLoad = (e) => {
		setIsLoading(false);

		if (onLoad) {
			onLoad(e);
		}
	};

	// Handler para clique
	const handleClick = (e) => {
		if (onClick) {
			onClick(e);
		}
	};

	// Handler para teclado (acessibilidade)
	const handleKeyDown = (e) => {
		if (onClick && (e.key === "Enter" || e.key === " ")) {
			e.preventDefault();
			onClick(e);
		}
	};

	// Estilos computados
	const containerClasses = [
		"relative inline-block overflow-hidden border-2 border-gray-600/50",
		rounded,
		onClick
			? "cursor-pointer hover:border-red-500/50 transition-all duration-300"
			: "",
		className,
	]
		.filter(Boolean)
		.join(" ");

	const FallbackIcon = fallbackIcon;

	return (
		<div
			className={containerClasses}
			style={{ width: size, height: size }}
			onClick={handleClick}
			onKeyDown={handleKeyDown}
			{...accessibilityProps}
		>
			{/* Imagem principal */}
			{optimizedUrl && !imageError && (
				<img
					src={optimizedUrl}
					alt={accessibilityProps.alt}
					className="w-full h-full object-cover"
					onLoad={handleImageLoad}
					onError={handleImageError}
					style={{ display: isLoading ? "none" : "block" }}
				/>
			)}

			{/* Loading state */}
			{isLoading && optimizedUrl && !imageError && (
				<div className="absolute inset-0 bg-gray-700 animate-pulse flex items-center justify-center">
					<div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin"></div>
				</div>
			)}

			{/* Fallback com iniciais */}
			{(!optimizedUrl || imageError) && showInitials && initials && (
				<div
					className={`w-full h-full bg-gradient-to-br ${initialsColor} flex items-center justify-center text-white font-bold`}
					style={{ fontSize: size * 0.4 }}
				>
					{initials}
				</div>
			)}

			{/* Fallback com ícone */}
			{(!optimizedUrl || imageError) && (!showInitials || !initials) && (
				<div
					className={`w-full h-full bg-gradient-to-br ${initialsColor} flex items-center justify-center`}
				>
					<FallbackIcon
						className="text-white"
						style={{ width: size * 0.5, height: size * 0.5 }}
					/>
				</div>
			)}

			{/* Overlay de hover para clicáveis */}
			{onClick && (
				<div className="absolute inset-0 bg-black/20 opacity-0 hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
					<div className="w-6 h-6 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm">
						<User className="w-3 h-3 text-white" />
					</div>
				</div>
			)}

			{/* Debug info */}
			{debug && process.env.NODE_ENV === "development" && (
				<div className="absolute -top-8 left-0 text-xs bg-black text-white p-1 rounded z-50">
					{optimizedUrl ? "✅" : "❌"} {size}px
				</div>
			)}
		</div>
	);
};

/**
 * Variações pré-configuradas do AvatarDisplay
 */

// Avatar pequeno para listas
export const AvatarSmall = (props) => (
	<AvatarDisplay size={32} rounded="rounded-lg" {...props} />
);

// Avatar médio para cards
export const AvatarMedium = (props) => (
	<AvatarDisplay size={48} rounded="rounded-xl" {...props} />
);

// Avatar grande para perfis
export const AvatarLarge = (props) => (
	<AvatarDisplay size={80} rounded="rounded-2xl" {...props} />
);

// Avatar extra grande para páginas de perfil
export const AvatarXLarge = (props) => (
	<AvatarDisplay size={120} rounded="rounded-3xl" {...props} />
);

// Avatar circular (para usar em comentários, etc)
export const AvatarCircular = (props) => (
	<AvatarDisplay rounded="rounded-full" {...props} />
);

// Avatar para navbar
export const AvatarNav = (props) => (
	<AvatarDisplay size={32} rounded="rounded-lg" optimize={true} {...props} />
);

export default AvatarDisplay;
