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

		// Se não há usuário (logout), limpar todo o cache
		if (!user) {
			queryClient.clear();
			return;
		}

		// Se usuário logou ou mudou status de admin, invalidar queries relevantes
		if (user) {
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
		queryClient.clear();
		queryClient.invalidateQueries();
	};

	return { forceCacheSync };
};
