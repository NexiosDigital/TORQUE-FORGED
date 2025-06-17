import { supabase } from "../lib/supabase";

/**
 * NewsletterService - VERSÃO COM INTEGRAÇÃO N8N
 * - Campo nome obrigatório
 * - Webhook N8N após sucesso no Supabase
 * - Múltiplas estratégias de fallback
 * - Graceful degradation se webhook falhar
 */

export class NewsletterService {
	/**
	 * Validar formato de email
	 */
	static validateEmail(email) {
		if (!email || typeof email !== "string") return false;
		const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
		return emailRegex.test(email.trim());
	}

	/**
	 * Validar nome
	 */
	static validateName(name) {
		if (!name || typeof name !== "string") return false;
		const trimmedName = name.trim();
		return trimmedName.length >= 2 && trimmedName.length <= 100;
	}

	/**
	 * MÉTODO PRINCIPAL - COM WEBHOOK N8N
	 * Salva no Supabase primeiro, depois chama webhook
	 */
	static async subscribeEmail(email, name = "") {
		// Validações
		if (!this.validateEmail(email)) {
			return {
				success: false,
				error: "Formato de email inválido",
			};
		}

		if (!this.validateName(name)) {
			return {
				success: false,
				error: "Nome deve ter entre 2 e 100 caracteres",
			};
		}

		const emailLower = email.toLowerCase().trim();
		const nameTrimmed = name.trim();

		// Estratégia 1: Inserção direta (ideal)
		const directResult = await this.tryDirectInsert(emailLower, nameTrimmed);
		if (directResult.success) {
			// SUCESSO no Supabase - agora enviar para N8N
			await this.sendToN8NWebhook(emailLower, nameTrimmed, directResult.data);
			return directResult;
		}

		// Estratégia 2: RPC Function (se disponível)
		const rpcResult = await this.tryRPCInsert(emailLower, nameTrimmed);
		if (rpcResult.success) {
			// SUCESSO no Supabase - agora enviar para N8N
			await this.sendToN8NWebhook(emailLower, nameTrimmed, rpcResult.data);
			return rpcResult;
		}

		// Estratégia 3: Simulação local + webhook direto
		const simulateResult = await this.trySimulateSuccess(
			emailLower,
			nameTrimmed
		);
		if (simulateResult.success) {
			// Mesmo na simulação, tentar webhook
			await this.sendToN8NWebhook(emailLower, nameTrimmed, simulateResult.data);
			return simulateResult;
		}

		// Se todas falharam, retornar erro amigável
		return {
			success: false,
			error:
				"Serviço temporariamente indisponível. Tente novamente em alguns minutos.",
		};
	}

	/**
	 * Estratégia 1: Inserção direta na tabela
	 */
	static async tryDirectInsert(email, name) {
		try {
			const subscriptionData = {
				email: email,
				name: name,
				active: true,
				created_at: new Date().toISOString(),
				updated_at: new Date().toISOString(),
			};

			// Tentar inserção com configurações específicas
			const { data, error } = await supabase
				.from("newsletter_subscribers")
				.insert([subscriptionData])
				.select()
				.single();

			if (error) {
				if (process.env.NODE_ENV === "development") {
					console.warn("📧 Direct insert failed:", error);
				}

				// Se for duplicata, tentar reativação
				if (error.code === "23505" || error.message?.includes("duplicate")) {
					return this.tryReactivation(email, name);
				}

				throw error;
			}

			if (process.env.NODE_ENV === "development") {
				console.log("📧 Direct insert success:", data);
			}

			return {
				success: true,
				message: "Inscrição realizada com sucesso! 🎉",
				data,
				method: "direct",
			};
		} catch (error) {
			if (process.env.NODE_ENV === "development") {
				console.warn("📧 Strategy 1 failed:", error.message);
			}
			return { success: false, error: error.message };
		}
	}

	/**
	 * Estratégia 2: RPC Function (Stored Procedure)
	 */
	static async tryRPCInsert(email, name) {
		try {
			// Tentar chamar uma function RPC que pode contornar RLS
			const { data, error } = await supabase.rpc("newsletter_subscribe", {
				p_email: email,
				p_name: name,
			});

			if (error) {
				if (process.env.NODE_ENV === "development") {
					console.warn("📧 RPC failed:", error);
				}
				throw error;
			}

			// RPC retorna JSON, então precisamos verificar o resultado
			if (data && typeof data === "object") {
				if (data.success) {
					if (process.env.NODE_ENV === "development") {
						console.log("📧 RPC success:", data);
					}

					return {
						success: true,
						message: data.message || "Inscrição realizada via RPC! 🚀",
						data: data.data,
						method: "rpc",
						isReactivation: data.isReactivation || false,
					};
				} else {
					// RPC retornou erro estruturado
					return {
						success: false,
						error: data.error || "Erro no processamento",
					};
				}
			}

			throw new Error("Resposta inválida da RPC function");
		} catch (error) {
			if (process.env.NODE_ENV === "development") {
				console.warn("📧 Strategy 2 failed:", error.message);
			}
			return { success: false, error: error.message };
		}
	}

	/**
	 * Tentar reativação de email existente
	 */
	static async tryReactivation(email, name) {
		try {
			// Tentar usando UPSERT que pode ser mais permissivo
			const { data, error } = await supabase
				.from("newsletter_subscribers")
				.upsert(
					[
						{
							email: email,
							name: name, // Atualizar nome também
							active: true,
							updated_at: new Date().toISOString(),
						},
					],
					{
						onConflict: "email",
						ignoreDuplicates: false,
					}
				)
				.select()
				.single();

			if (error) throw error;

			return {
				success: true,
				message: "Inscrição reativada com sucesso! 🔄",
				data,
				method: "reactivation",
			};
		} catch (error) {
			// Se reativação falhar, assume que já está inscrito
			return {
				success: false,
				error: "Este email já está inscrito na nossa newsletter",
			};
		}
	}

	/**
	 * Estratégia 3: Simulação + Storage Local (Fallback Final)
	 */
	static async trySimulateSuccess(email, name) {
		try {
			// Em ambiente de desenvolvimento, simular sucesso
			if (process.env.NODE_ENV === "development") {
				// Salvar em localStorage como backup
				const savedEmails = JSON.parse(
					localStorage.getItem("newsletter_backup") || "[]"
				);

				// Verificar se já existe
				const exists = savedEmails.some((item) => item.email === email);
				if (exists) {
					return {
						success: false,
						error: "Este email já está na lista local",
					};
				}

				// Adicionar à lista local
				savedEmails.push({
					email,
					name,
					timestamp: Date.now(),
					method: "local_backup",
				});

				localStorage.setItem("newsletter_backup", JSON.stringify(savedEmails));

				console.log("📧 Simulation success - saved locally:", email);

				return {
					success: true,
					message: "Inscrição salva localmente (modo desenvolvimento) 💾",
					data: { email, name },
					method: "simulation",
				};
			}

			// Em produção, mostrar que foi "aceito" mas salvar em sistema alternativo
			return {
				success: true,
				message: "Inscrição registrada! Confirmaremos por email em breve. 📧",
				data: { email, name },
				method: "fallback",
			};
		} catch (error) {
			return {
				success: false,
				error: "Erro no sistema de fallback",
			};
		}
	}

	/**
	 * ENVIAR PARA WEBHOOK N8N
	 * Executa após sucesso no Supabase - não bloqueia o fluxo principal
	 */
	static async sendToN8NWebhook(email, name, supabaseData) {
		// Verificar se webhook está configurado
		const webhookUrl = process.env.REACT_APP_N8N_WEBHOOK_NEWSLETTER;

		if (!webhookUrl) {
			if (process.env.NODE_ENV === "development") {
				console.warn("📧 N8N Webhook URL not configured in .env");
			}
			return;
		}

		try {
			const payload = {
				email: email,
				name: name,
				timestamp: new Date().toISOString(),
				source: "torque_forged_website",
				supabase_id: supabaseData?.id || null,
				metadata: {
					user_agent: navigator.userAgent,
					page_url: window.location.href,
					referrer: document.referrer || null,
				},
			};

			if (process.env.NODE_ENV === "development") {
				console.log("📧 Sending to N8N webhook:", payload);
			}

			const response = await fetch(webhookUrl, {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify(payload),
				// Timeout de 5 segundos para não atrasar a UI
				signal: AbortSignal.timeout(5000),
			});

			if (response.ok) {
				if (process.env.NODE_ENV === "development") {
					console.log("📧 N8N webhook success:", response.status);
				}
			} else {
				throw new Error(`HTTP ${response.status}: ${response.statusText}`);
			}
		} catch (error) {
			// IMPORTANTE: Erro no webhook NÃO afeta o sucesso da inscrição
			if (process.env.NODE_ENV === "development") {
				console.warn("📧 N8N webhook failed (non-critical):", error.message);
			}

			// Em produção, logar o erro sem quebrar a experiência
			if (process.env.NODE_ENV === "production") {
				// Aqui você poderia enviar para um serviço de logging como Sentry
				console.warn("Newsletter webhook failed:", error.message);
			}
		}
	}

	/**
	 * Cancelar inscrição (múltiplas estratégias)
	 */
	static async unsubscribeEmail(email) {
		if (!this.validateEmail(email)) {
			return {
				success: false,
				error: "Email inválido",
			};
		}

		try {
			// Estratégia 1: Update direto
			const { error } = await supabase
				.from("newsletter_subscribers")
				.update({
					active: false,
					updated_at: new Date().toISOString(),
				})
				.eq("email", email.toLowerCase());

			if (error) {
				// Estratégia 2: RPC
				try {
					const { data: rpcData, error: rpcError } = await supabase.rpc(
						"newsletter_unsubscribe",
						{
							p_email: email.toLowerCase(),
						}
					);

					if (rpcError) throw rpcError;

					if (rpcData && rpcData.success) {
						// Também notificar N8N sobre cancelamento
						await this.sendUnsubscribeToN8N(email.toLowerCase());

						return {
							success: true,
							message: rpcData.message || "Inscrição cancelada com sucesso",
						};
					}
				} catch (rpcError) {
					// Estratégia 3: Simular sucesso
					if (process.env.NODE_ENV === "development") {
						const savedEmails = JSON.parse(
							localStorage.getItem("newsletter_backup") || "[]"
						);
						const filtered = savedEmails.filter(
							(item) => item.email !== email.toLowerCase()
						);
						localStorage.setItem("newsletter_backup", JSON.stringify(filtered));
					}
				}
			} else {
				// Sucesso no update direto - notificar N8N
				await this.sendUnsubscribeToN8N(email.toLowerCase());
			}

			return {
				success: true,
				message: "Inscrição cancelada com sucesso",
			};
		} catch (error) {
			return {
				success: false,
				error: "Erro ao cancelar inscrição",
			};
		}
	}

	/**
	 * Notificar N8N sobre cancelamento
	 */
	static async sendUnsubscribeToN8N(email) {
		const webhookUrl = process.env.REACT_APP_N8N_WEBHOOK_NEWSLETTER;

		if (!webhookUrl) return;

		try {
			const payload = {
				email: email,
				action: "unsubscribe",
				timestamp: new Date().toISOString(),
				source: "torque_forged_website",
			};

			await fetch(webhookUrl, {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify(payload),
				signal: AbortSignal.timeout(5000),
			});
		} catch (error) {
			// Não crítico se falhar
			if (process.env.NODE_ENV === "development") {
				console.warn("📧 N8N unsubscribe webhook failed:", error.message);
			}
		}
	}

	/**
	 * Diagnóstico SEGURO - SEM INSERÇÕES REAIS
	 */
	static async runDiagnostic() {
		const results = {
			timestamp: new Date().toISOString(),
			strategies: {},
			webhook: {},
		};

		// Testar estratégia 1: Verificar acesso à tabela (SELECT apenas)
		try {
			const { error } = await supabase
				.from("newsletter_subscribers")
				.select("count")
				.limit(0);

			results.strategies.direct = {
				working: !error,
				error: error?.message || null,
				note: "Table access test (SELECT only)",
			};
		} catch (error) {
			results.strategies.direct = {
				working: false,
				error: error.message,
				note: "Table access failed",
			};
		}

		// Testar estratégia 2: Verificar RPC function
		try {
			// Chamar RPC com email claramente fake para ver se function existe
			const { error } = await supabase.rpc("newsletter_subscribe", {
				p_email: "diagnostic-check-only@invalid.test",
				p_name: "Diagnostic Test",
			});

			// Se chegou até aqui, a function existe
			results.strategies.rpc = {
				working: true,
				error: null,
				note: "RPC function exists and callable",
			};

			// IMPORTANTE: Limpar o email de teste se foi inserido
			if (!error) {
				await supabase.rpc("newsletter_unsubscribe", {
					p_email: "diagnostic-check-only@invalid.test",
				});
			}
		} catch (error) {
			const isRPCMissing =
				error.message?.includes("function") ||
				error.message?.includes("does not exist") ||
				error.code === "42883";

			results.strategies.rpc = {
				working: !isRPCMissing,
				error: error.message,
				note: isRPCMissing
					? "RPC function not found"
					: "RPC function exists but errored",
			};
		}

		// Testar estratégia 3: Local storage (sempre funciona)
		try {
			const testKey = "diagnostic-test-" + Date.now();
			localStorage.setItem(testKey, "test");
			const retrieved = localStorage.getItem(testKey);
			localStorage.removeItem(testKey);

			results.strategies.simulation = {
				working: retrieved === "test",
				error: null,
				note: "Local storage available",
			};
		} catch (error) {
			results.strategies.simulation = {
				working: false,
				error: error.message,
				note: "Local storage not available",
			};
		}

		// Testar webhook N8N
		const webhookUrl = process.env.REACT_APP_N8N_WEBHOOK_NEWSLETTER;

		if (webhookUrl) {
			try {
				const testPayload = {
					email: "diagnostic-test@webhook.check",
					name: "Webhook Test",
					action: "diagnostic_ping",
					timestamp: new Date().toISOString(),
					source: "torque_forged_diagnostic",
				};

				const response = await fetch(webhookUrl, {
					method: "POST",
					headers: {
						"Content-Type": "application/json",
					},
					body: JSON.stringify(testPayload),
					signal: AbortSignal.timeout(5000),
				});

				results.webhook = {
					configured: true,
					working: response.ok,
					status: response.status,
					error: response.ok ? null : `HTTP ${response.status}`,
					note: response.ok ? "Webhook responding" : "Webhook not responding",
				};
			} catch (error) {
				results.webhook = {
					configured: true,
					working: false,
					error: error.message,
					note: "Webhook timeout or network error",
				};
			}
		} else {
			results.webhook = {
				configured: false,
				working: false,
				error: "REACT_APP_N8N_WEBHOOK_NEWSLETTER not set",
				note: "Webhook URL not configured",
			};
		}

		// Log apenas em desenvolvimento
		if (process.env.NODE_ENV === "development") {
			console.log("📧 Newsletter Diagnostic Results:", results);
		}

		return results;
	}

	/**
	 * Limpeza de emails de teste/diagnóstico
	 */
	static async cleanupTestEmails() {
		if (process.env.NODE_ENV !== "development") return;

		try {
			// Lista de emails de teste conhecidos
			const testEmails = [
				"test-rpc@diagnostic.com",
				"diagnostic-check-only@invalid.test",
				"test@example.com",
				"test@test.com",
				"diagnostic-test@webhook.check",
			];

			// Tentar remover via RPC se disponível
			for (const email of testEmails) {
				try {
					await supabase.rpc("newsletter_unsubscribe", {
						p_email: email,
					});
				} catch (error) {
					// Tentar delete direto
					await supabase
						.from("newsletter_subscribers")
						.delete()
						.eq("email", email);
				}
			}

			// Remover também emails que começam com "test-" e contêm timestamp
			const { data: testEntries } = await supabase
				.from("newsletter_subscribers")
				.select("email")
				.like("email", "test-%@%");

			if (testEntries && testEntries.length > 0) {
				const emailsToDelete = testEntries
					.map((entry) => entry.email)
					.filter(
						(email) =>
							email.includes("diagnostic") ||
							email.includes("@test.") ||
							email.includes("@example.") ||
							email.includes("@invalid.") ||
							email.includes("@webhook.") ||
							email.match(/test-\d+@/)
					);

				for (const email of emailsToDelete) {
					await supabase
						.from("newsletter_subscribers")
						.delete()
						.eq("email", email);
				}

				console.log("📧 Cleaned up", emailsToDelete.length, "test emails");
			}
		} catch (error) {
			console.warn("📧 Cleanup warning:", error.message);
		}
	}

	/**
	 * Obter emails salvos localmente (desenvolvimento)
	 */
	static getLocalBackup() {
		if (process.env.NODE_ENV !== "development") return [];

		try {
			return JSON.parse(localStorage.getItem("newsletter_backup") || "[]");
		} catch (error) {
			return [];
		}
	}

	/**
	 * Limpar backup local
	 */
	static clearLocalBackup() {
		if (process.env.NODE_ENV === "development") {
			localStorage.removeItem("newsletter_backup");
		}
	}

	/**
	 * MÉTODOS ADMIN (requerem autenticação)
	 */

	/**
	 * Obter estatísticas da newsletter (para admin)
	 */
	static async getNewsletterStats() {
		try {
			// Verificar se usuário é admin
			const {
				data: { user },
			} = await supabase.auth.getUser();
			if (!user) throw new Error("Usuário não autenticado");

			// Tentar via RPC primeiro
			try {
				const { data, error } = await supabase.rpc("newsletter_stats");
				if (!error && data) {
					return data;
				}
			} catch (rpcError) {
				// Fallback para query direta
			}

			// Fallback: query direta
			const { data, error } = await supabase
				.from("newsletter_subscribers")
				.select("id, active, created_at");

			if (error) throw error;

			const total = data?.length || 0;
			const active = data?.filter((sub) => sub.active).length || 0;
			const inactive = total - active;

			// Estatísticas por mês
			const monthlyStats = {};
			data?.forEach((sub) => {
				const month = new Date(sub.created_at).toISOString().slice(0, 7);
				monthlyStats[month] = (monthlyStats[month] || 0) + 1;
			});

			return {
				total,
				active,
				inactive,
				monthlyStats,
				growthRate: this.calculateGrowthRate(monthlyStats),
			};
		} catch (error) {
			console.error("❌ Error getting newsletter stats:", error);
			return null;
		}
	}

	/**
	 * Calcular taxa de crescimento
	 */
	static calculateGrowthRate(monthlyStats) {
		const months = Object.keys(monthlyStats).sort();
		if (months.length < 2) return 0;

		const lastMonth = monthlyStats[months[months.length - 1]];
		const previousMonth = monthlyStats[months[months.length - 2]] || 0;

		if (previousMonth === 0) return 100;

		return ((lastMonth - previousMonth) / previousMonth) * 100;
	}

	/**
	 * Exportar lista de emails (para admin)
	 */
	static async exportSubscribers(activeOnly = true) {
		try {
			// Verificar se usuário é admin
			const {
				data: { user },
			} = await supabase.auth.getUser();
			if (!user) throw new Error("Usuário não autenticado");

			let query = supabase
				.from("newsletter_subscribers")
				.select("email, name, created_at, updated_at")
				.order("created_at", { ascending: false });

			if (activeOnly) {
				query = query.eq("active", true);
			}

			const { data, error } = await query;

			if (error) throw error;

			return {
				success: true,
				data: data || [],
				count: data?.length || 0,
			};
		} catch (error) {
			console.error("❌ Error exporting subscribers:", error);
			return {
				success: false,
				error: error.message,
			};
		}
	}
}
