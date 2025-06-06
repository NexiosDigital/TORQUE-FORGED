import React, { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";
import { useAuth } from "../contexts/AuthContext";
import {
	Bug,
	CheckCircle,
	XCircle,
	AlertCircle,
	Database,
	User,
	Key,
	Settings,
	Loader,
	RefreshCw,
	Eye,
	EyeOff,
	Terminal,
} from "lucide-react";

const DebugPanel = () => {
	const { user, profile, isAdmin } = useAuth();
	const [tests, setTests] = useState({});
	const [loading, setLoading] = useState(false);
	const [isExpanded, setIsExpanded] = useState(false);
	const [showLogs, setShowLogs] = useState(false);
	const [logs, setLogs] = useState([]);

	const addLog = (message, type = "info") => {
		const timestamp = new Date().toLocaleTimeString();
		setLogs((prev) => [{ timestamp, message, type }, ...prev.slice(0, 49)]); // Keep last 50 logs
	};

	const runTest = async (testName, testFn) => {
		setTests((prev) => ({ ...prev, [testName]: { status: "running" } }));
		addLog(`Executando teste: ${testName}`, "info");

		try {
			const result = await testFn();
			setTests((prev) => ({
				...prev,
				[testName]: {
					status: "success",
					data: result,
					timestamp: new Date().toISOString(),
				},
			}));
			addLog(
				`✅ ${testName}: ${JSON.stringify(result).substring(0, 100)}`,
				"success"
			);
		} catch (error) {
			setTests((prev) => ({
				...prev,
				[testName]: {
					status: "error",
					error: error.message,
					timestamp: new Date().toISOString(),
				},
			}));
			addLog(`❌ ${testName}: ${error.message}`, "error");
		}
	};

	const testSupabaseConnection = async () => {
		const { data, error } = await supabase
			.from("posts")
			.select("count")
			.limit(1);

		if (error) throw error;
		return { connection: "OK", timestamp: new Date().toISOString() };
	};

	const testPostsTable = async () => {
		// Teste básico de leitura
		const { data: posts, error: postsError } = await supabase
			.from("posts")
			.select("id, title, published, created_at")
			.limit(5);

		if (postsError) throw postsError;

		// Teste de posts publicados
		const { data: publishedPosts, error: publishedError } = await supabase
			.from("posts")
			.select("id")
			.eq("published", true);

		if (publishedError) throw publishedError;

		return {
			totalPosts: posts?.length || 0,
			publishedPosts: publishedPosts?.length || 0,
			posts: posts?.map((p) => ({
				id: p.id,
				title: p.title.substring(0, 30) + "...",
			})),
		};
	};

	const testCategoriesTable = async () => {
		const { data, error } = await supabase.from("categories").select("*");

		if (error) throw error;
		return {
			totalCategories: data?.length || 0,
			categories: data?.map((c) => ({ id: c.id, name: c.name })),
		};
	};

	const testAuth = async () => {
		const {
			data: { user },
			error,
		} = await supabase.auth.getUser();

		if (error) throw error;
		return {
			authenticated: !!user,
			email: user?.email,
			id: user?.id,
			role: user?.role,
		};
	};

	const testUserProfile = async () => {
		if (!user) throw new Error("User not authenticated");

		const { data, error } = await supabase
			.from("user_profiles")
			.select("*")
			.eq("id", user.id)
			.single();

		if (error) throw error;
		return {
			id: data.id,
			email: data.email,
			role: data.role,
			full_name: data.full_name,
		};
	};

	const testRLS = async () => {
		// Teste como usuário anônimo
		const { data: anonData, error: anonError } = await supabase
			.from("posts")
			.select("id")
			.eq("published", true)
			.limit(1);

		// Teste de inserção (deve falhar se não for admin)
		const { error: insertError } = await supabase
			.from("posts")
			.insert([
				{ title: "test", slug: "test", content: "test", category: "f1" },
			])
			.select();

		return {
			canReadPublic: !anonError && !!anonData,
			canInsert: !insertError,
			publicRecords: anonData?.length || 0,
		};
	};

	const testEnvironment = async () => {
		const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
		const supabaseKey = process.env.REACT_APP_SUPABASE_ANON_KEY;

		return {
			hasUrl: !!supabaseUrl,
			hasKey: !!supabaseKey,
			urlFormat: supabaseUrl?.includes(".supabase.co") ? "Valid" : "Invalid",
			keyLength: supabaseKey?.length || 0,
			nodeEnv: process.env.NODE_ENV,
		};
	};

	const runAllTests = async () => {
		setLoading(true);
		addLog("🚀 Iniciando bateria de testes...", "info");

		await Promise.all([
			runTest("environment", testEnvironment),
			runTest("connection", testSupabaseConnection),
			runTest("posts", testPostsTable),
			runTest("categories", testCategoriesTable),
			runTest("auth", testAuth),
			runTest("rls", testRLS),
		]);

		if (user) {
			await runTest("profile", testUserProfile);
		}

		addLog("✅ Todos os testes finalizados", "success");
		setLoading(false);
	};

	useEffect(() => {
		runAllTests();
	}, [user]);

	const getStatusIcon = (status) => {
		switch (status) {
			case "success":
				return <CheckCircle className="w-4 h-4 text-green-400" />;
			case "error":
				return <XCircle className="w-4 h-4 text-red-400" />;
			case "running":
				return <Loader className="w-4 h-4 text-blue-400 animate-spin" />;
			default:
				return <AlertCircle className="w-4 h-4 text-gray-400" />;
		}
	};

	const getOverallStatus = () => {
		const testResults = Object.values(tests);
		if (testResults.some((t) => t.status === "running")) return "running";
		if (testResults.some((t) => t.status === "error")) return "error";
		if (testResults.every((t) => t.status === "success")) return "success";
		return "warning";
	};

	const getStatusColor = (status) => {
		switch (status) {
			case "success":
				return "text-green-400 border-green-500/30 bg-green-500/10";
			case "error":
				return "text-red-400 border-red-500/30 bg-red-500/10";
			case "running":
				return "text-blue-400 border-blue-500/30 bg-blue-500/10";
			default:
				return "text-yellow-400 border-yellow-500/30 bg-yellow-500/10";
		}
	};

	const clearLogs = () => setLogs([]);

	return (
		<div className="fixed bottom-4 right-4 z-50">
			<div
				className={`bg-gray-900/95 backdrop-blur-md border rounded-2xl shadow-2xl transition-all duration-300 ${getStatusColor(
					getOverallStatus()
				)}`}
			>
				{/* Header */}
				<div
					className="flex items-center justify-between p-3 cursor-pointer"
					onClick={() => setIsExpanded(!isExpanded)}
				>
					<div className="flex items-center space-x-2">
						<Bug className="w-5 h-5" />
						<span className="font-semibold">Debug</span>
						{getStatusIcon(getOverallStatus())}
					</div>
					<div className="flex items-center space-x-1">
						<button
							onClick={(e) => {
								e.stopPropagation();
								runAllTests();
							}}
							disabled={loading}
							className="p-1 rounded hover:bg-gray-700/50 transition-colors"
							title="Executar testes"
						>
							<RefreshCw
								className={`w-4 h-4 ${loading ? "animate-spin" : ""}`}
							/>
						</button>
						<div
							className={`w-2 h-2 rounded-full ${
								getOverallStatus() === "success"
									? "bg-green-400"
									: getOverallStatus() === "error"
									? "bg-red-400"
									: "bg-yellow-400"
							}`}
						></div>
					</div>
				</div>

				{/* Expanded Content */}
				{isExpanded && (
					<div className="border-t border-gray-700/50">
						{/* Quick Stats */}
						<div className="p-3 border-b border-gray-700/50">
							<div className="grid grid-cols-2 gap-2 text-xs">
								<div>Posts: {tests.posts?.data?.totalPosts || "?"}</div>
								<div>
									Categorias: {tests.categories?.data?.totalCategories || "?"}
								</div>
								<div>Auth: {user ? "✅" : "❌"}</div>
								<div>Admin: {isAdmin ? "✅" : "❌"}</div>
							</div>
						</div>

						{/* Test Results */}
						<div className="max-h-64 overflow-y-auto">
							<div className="p-3 space-y-2">
								{Object.entries(tests).map(([testName, result]) => (
									<div key={testName} className="bg-gray-800/30 rounded-lg p-2">
										<div className="flex items-center justify-between mb-1">
											<span className="text-white text-sm font-medium capitalize">
												{testName}
											</span>
											{getStatusIcon(result.status)}
										</div>
										<div className="text-xs text-gray-400">
											{result.status === "success" && (
												<div>
													{testName === "environment" && (
														<>
															URL: {result.data?.hasUrl ? "✅" : "❌"} | Key:{" "}
															{result.data?.hasKey ? "✅" : "❌"}
														</>
													)}
													{testName === "posts" && (
														<>
															Total: {result.data?.totalPosts} | Publicados:{" "}
															{result.data?.publishedPosts}
														</>
													)}
													{testName === "categories" && (
														<>Total: {result.data?.totalCategories}</>
													)}
													{testName === "auth" && (
														<>
															{result.data?.authenticated
																? result.data.email
																: "Não autenticado"}
														</>
													)}
													{testName === "profile" && (
														<>
															{result.data?.role} -{" "}
															{result.data?.full_name || "Sem nome"}
														</>
													)}
													{testName === "rls" && (
														<>
															Leitura:{" "}
															{result.data?.canReadPublic ? "✅" : "❌"} |
															Insert: {result.data?.canInsert ? "✅" : "❌"}
														</>
													)}
													{testName === "connection" && (
														<>Conectado: {result.data?.connection}</>
													)}
												</div>
											)}
											{result.status === "error" && (
												<span className="text-red-400">{result.error}</span>
											)}
											{result.status === "running" && (
												<span className="text-blue-400">Executando...</span>
											)}
										</div>
									</div>
								))}
							</div>
						</div>

						{/* Logs Section */}
						<div className="border-t border-gray-700/50">
							<div className="flex items-center justify-between p-2">
								<button
									onClick={() => setShowLogs(!showLogs)}
									className="flex items-center space-x-1 text-xs text-gray-400 hover:text-white transition-colors"
								>
									<Terminal className="w-3 h-3" />
									<span>Logs ({logs.length})</span>
									{showLogs ? (
										<EyeOff className="w-3 h-3" />
									) : (
										<Eye className="w-3 h-3" />
									)}
								</button>
								{showLogs && (
									<button
										onClick={clearLogs}
										className="text-xs text-red-400 hover:text-red-300 transition-colors"
									>
										Limpar
									</button>
								)}
							</div>

							{showLogs && (
								<div className="max-h-32 overflow-y-auto p-2 border-t border-gray-700/50">
									<div className="space-y-1">
										{logs.map((log, index) => (
											<div key={index} className="text-xs font-mono">
												<span className="text-gray-500">{log.timestamp}</span>
												<span
													className={`ml-2 ${
														log.type === "error"
															? "text-red-400"
															: log.type === "success"
															? "text-green-400"
															: "text-gray-300"
													}`}
												>
													{log.message}
												</span>
											</div>
										))}
									</div>
								</div>
							)}
						</div>

						{/* Environment Info */}
						<div className="p-2 border-t border-gray-700/50 bg-gray-800/20">
							<div className="text-xs text-gray-400 space-y-1">
								<div>User ID: {user?.id?.substring(0, 8) || "N/A"}...</div>
								<div>Profile Role: {profile?.role || "N/A"}</div>
								<div>Environment: {process.env.NODE_ENV}</div>
								<div>Timestamp: {new Date().toLocaleTimeString()}</div>
							</div>
						</div>
					</div>
				)}
			</div>
		</div>
	);
};

export default DebugPanel;
