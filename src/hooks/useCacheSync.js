import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "../contexts/AuthContext";

/**
 * Hook para sincronizar cache com mudanças de autenticação
 * - Limpa cache quando usuário desloga
 * - Invalida cache quando status de admin muda
 * - Sincroniza dados entre público e admin
 */
export const useCacheSync = () => {
	const queryClient = useQueryClient();
	const { user, isAdmin, sessionChecked } = useAuth();

	useEffect(() => {
		// Aguardar verificação da sessão antes de fazer qualquer coisa
		if (!sessionChecked) return;

		console.log("🔄 CacheSync: Estado de auth mudou:", {
			user: !!user,
			isAdmin,
			sessionChecked,
		});

		// Se não há usuário (logout), limpar todo o cache
		if (!user) {
			console.log("🧹 CacheSync: Limpando cache (logout)");
			queryClient.clear();
			return;
		}

		// Se usuário logou ou mudou status de admin, invalidar queries relevantes
		if (user) {
			console.log(
				"🔄 CacheSync: Invalidando queries após login/mudança de status"
			);

			// Invalidar queries admin se for admin
			if (isAdmin) {
				queryClient.invalidateQueries({ queryKey: ["admin"] });
			}

			// Sempre invalidar queries públicas para garantir dados atualizados
			queryClient.invalidateQueries({ queryKey: ["public"] });
		}
	}, [user, isAdmin, sessionChecked, queryClient]);

	// Função para forçar sincronização manual
	const forceCacheSync = () => {
		console.log("🔄 CacheSync: Sincronização manual forçada");
		queryClient.clear();
		queryClient.invalidateQueries();
	};

	return { forceCacheSync };
};
