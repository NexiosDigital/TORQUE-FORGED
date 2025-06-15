import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY;

// Verificação de variáveis de ambiente
if (!supabaseUrl || !supabaseAnonKey) {
	console.error("❌ Variáveis de ambiente do Supabase não encontradas:");
	console.error(
		"REACT_APP_SUPABASE_URL:",
		supabaseUrl ? "✅ OK" : "❌ Não definida"
	);
	console.error(
		"REACT_APP_SUPABASE_ANON_KEY:",
		supabaseAnonKey ? "✅ OK" : "❌ Não definida"
	);
	throw new Error("Missing Supabase environment variables");
}

// Configuração otimizada do cliente Supabase
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
	auth: {
		// Configurações de autenticação
		persistSession: true,
		autoRefreshToken: true,
		detectSessionInUrl: true,
		storageKey: "torque-forged-auth",
		storage: window.localStorage,

		// Configurações de flow
		flowType: "pkce",
	},

	// Configurações de realtime
	realtime: {
		params: {
			eventsPerSecond: 10,
		},
	},

	// Configurações globais
	global: {
		headers: {
			"X-Client-Info": "torque-forged-motorsport",
		},
	},

	// Configurações de database
	db: {
		schema: "public",
	},
});

// Debug em desenvolvimento
if (process.env.NODE_ENV === "development") {
	// Teste de conectividade
	supabase
		.from("posts")
		.select("count")
		.limit(1)
		.then(({ data, error }) => {
			if (error) {
				console.error("❌ Teste de conectividade falhou:", error);
			} else {
			}
		})
		.catch((error) => {
			console.error("❌ Erro no teste de conectividade:", error);
		});
}

// Exportar configuração para uso em outros serviços
export const supabaseConfig = {
	url: supabaseUrl,
	anonKey: supabaseAnonKey,
};

// Helper para criar cliente com configurações específicas
export const createSupabaseClient = (options = {}) => {
	return createClient(supabaseUrl, supabaseAnonKey, {
		...options,
		auth: {
			persistSession: true,
			autoRefreshToken: true,
			detectSessionInUrl: true,
			storageKey: options.storageKey || "torque-forged-auth",
			...options.auth,
		},
	});
};

// Cliente específico para operações administrativas
export const createAdminClient = () => {
	return createClient(supabaseUrl, supabaseAnonKey, {
		auth: {
			persistSession: true,
			autoRefreshToken: true,
			detectSessionInUrl: false,
			storageKey: "torque-forged-admin-auth",
		},
		global: {
			headers: {
				"X-Client-Info": "torque-forged-admin",
			},
		},
	});
};

export default supabase;
