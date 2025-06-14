import React, { useState, useEffect } from "react";
import {
	X,
	Table,
	Plus,
	Minus,
	RotateCcw,
	Eye,
	EyeOff,
	AlignLeft,
	AlignCenter,
	AlignRight,
} from "lucide-react";
import toast from "react-hot-toast";

/**
 * TableGeneratorModal - Gerador visual de tabelas markdown
 * - Interface drag-and-drop para criar tabelas
 * - Preview em tempo real
 * - Controle de alinhamento de colunas
 * - Templates predefinidos
 * - Redimensionamento dinâmico
 */

const TableGeneratorModal = ({ isOpen, onClose, onTableInserted }) => {
	// Estados da tabela
	const [rows, setRows] = useState(3); // Incluindo header
	const [cols, setCols] = useState(3);
	const [tableData, setTableData] = useState({});
	const [alignment, setAlignment] = useState({});
	const [showPreview, setShowPreview] = useState(true);
	const [selectedTemplate, setSelectedTemplate] = useState(null);

	// Reset do modal
	const resetModal = () => {
		setRows(3);
		setCols(3);
		setTableData({});
		setAlignment({});
		setShowPreview(true);
		setSelectedTemplate(null);
	};

	// Fechar modal
	const handleClose = () => {
		resetModal();
		onClose();
	};

	// Inicializar tabela quando dimensões mudam
	useEffect(() => {
		const newTableData = {};
		const newAlignment = {};

		// Criar células da tabela
		for (let row = 0; row < rows; row++) {
			for (let col = 0; col < cols; col++) {
				const key = `${row}-${col}`;
				if (!tableData[key]) {
					if (row === 0) {
						newTableData[key] = `Coluna ${col + 1}`;
					} else {
						newTableData[key] = "";
					}
				} else {
					newTableData[key] = tableData[key];
				}
			}
		}

		// Configurar alinhamento padrão
		for (let col = 0; col < cols; col++) {
			if (!alignment[col]) {
				newAlignment[col] = "left";
			} else {
				newAlignment[col] = alignment[col];
			}
		}

		setTableData(newTableData);
		setAlignment(newAlignment);
	}, [rows, cols]);

	// Atualizar célula
	const updateCell = (row, col, value) => {
		const key = `${row}-${col}`;
		setTableData((prev) => ({
			...prev,
			[key]: value,
		}));
	};

	// Atualizar alinhamento da coluna
	const updateAlignment = (col, align) => {
		setAlignment((prev) => ({
			...prev,
			[col]: align,
		}));
	};

	// Adicionar linha
	const addRow = () => {
		if (rows < 10) {
			setRows((prev) => prev + 1);
		}
	};

	// Remover linha
	const removeRow = () => {
		if (rows > 2) {
			setRows((prev) => prev - 1);
		}
	};

	// Adicionar coluna
	const addCol = () => {
		if (cols < 8) {
			setCols((prev) => prev + 1);
		}
	};

	// Remover coluna
	const removeCol = () => {
		if (cols > 2) {
			setCols((prev) => prev - 1);
		}
	};

	// Templates predefinidos
	const templates = [
		{
			id: "comparison",
			name: "Comparação",
			icon: "📊",
			rows: 4,
			cols: 3,
			data: {
				"0-0": "Produto",
				"0-1": "Preço",
				"0-2": "Avaliação",
				"1-0": "McLaren P1",
				"1-1": "$1.15M",
				"1-2": "⭐⭐⭐⭐⭐",
				"2-0": "Ferrari LaFerrari",
				"2-1": "$1.4M",
				"2-2": "⭐⭐⭐⭐⭐",
				"3-0": "Porsche 918",
				"3-1": "$850K",
				"3-2": "⭐⭐⭐⭐⭐",
			},
			alignment: { 0: "left", 1: "center", 2: "center" },
		},
		{
			id: "specs",
			name: "Especificações",
			icon: "🔧",
			rows: 5,
			cols: 2,
			data: {
				"0-0": "Especificação",
				"0-1": "Valor",
				"1-0": "Motor",
				"1-1": "V8 Turbo",
				"2-0": "Potência",
				"2-1": "650 CV",
				"3-0": "Torque",
				"3-1": "720 Nm",
				"4-0": "0-100 km/h",
				"4-1": "3.2s",
			},
			alignment: { 0: "left", 1: "right" },
		},
		{
			id: "schedule",
			name: "Cronograma",
			icon: "📅",
			rows: 4,
			cols: 4,
			data: {
				"0-0": "Etapa",
				"0-1": "Data",
				"0-2": "Local",
				"0-3": "Status",
				"1-0": "Treino Livre",
				"1-1": "Sexta-feira",
				"1-2": "Interlagos",
				"1-3": "✅ Concluído",
				"2-0": "Classificação",
				"2-1": "Sábado",
				"2-2": "Interlagos",
				"2-3": "⏳ Pendente",
				"3-0": "Corrida",
				"3-1": "Domingo",
				"3-2": "Interlagos",
				"3-3": "⏳ Pendente",
			},
			alignment: { 0: "left", 1: "center", 2: "left", 3: "center" },
		},
	];

	// Aplicar template
	const applyTemplate = (template) => {
		setRows(template.rows);
		setCols(template.cols);
		setTableData(template.data);
		setAlignment(template.alignment);
		setSelectedTemplate(template.id);
		toast.success(`Template "${template.name}" aplicado!`);
	};

	// Gerar markdown da tabela
	const generateMarkdown = () => {
		if (rows < 1 || cols < 1) return "";

		let markdown = "";

		// Header row
		let headerRow = "|";
		for (let col = 0; col < cols; col++) {
			const cellValue = tableData[`0-${col}`] || "";
			headerRow += ` ${cellValue} |`;
		}
		markdown += headerRow + "\n";

		// Separator row with alignment
		let separatorRow = "|";
		for (let col = 0; col < cols; col++) {
			const align = alignment[col] || "left";
			let separator = "";

			switch (align) {
				case "left":
					separator = ":---";
					break;
				case "center":
					separator = ":---:";
					break;
				case "right":
					separator = "---:";
					break;
				default:
					separator = "---";
			}

			separatorRow += ` ${separator} |`;
		}
		markdown += separatorRow + "\n";

		// Data rows
		for (let row = 1; row < rows; row++) {
			let dataRow = "|";
			for (let col = 0; col < cols; col++) {
				const cellValue = tableData[`${row}-${col}`] || "";
				dataRow += ` ${cellValue} |`;
			}
			markdown += dataRow + "\n";
		}

		return markdown;
	};

	// Inserir tabela no editor
	const handleInsertTable = () => {
		// Verificar se há pelo menos o header preenchido
		const hasValidHeader = Object.keys(tableData).some((key) => {
			const [row] = key.split("-");
			return row === "0" && tableData[key].trim() !== "";
		});

		if (!hasValidHeader) {
			toast.error("Preencha pelo menos os títulos das colunas");
			return;
		}

		const markdown = generateMarkdown();

		// Callback para inserir no editor
		if (onTableInserted) {
			onTableInserted({
				markdown,
				rows,
				cols,
				data: tableData,
				alignment,
			});
		}

		toast.success("Tabela inserida no editor!");

		// Fechar modal após sucesso
		setTimeout(() => {
			handleClose();
		}, 300);
	};

	// Renderizar célula editável
	const renderCell = (row, col) => {
		const key = `${row}-${col}`;
		const value = tableData[key] || "";
		const isHeader = row === 0;

		return (
			<input
				key={key}
				type="text"
				value={value}
				onChange={(e) => updateCell(row, col, e.target.value)}
				className={`w-full px-2 py-2 text-sm border border-gray-600 rounded text-white transition-colors duration-300 ${
					isHeader
						? "bg-gray-700/50 font-semibold focus:bg-gray-700 focus:border-blue-500"
						: "bg-gray-800/50 focus:bg-gray-800 focus:border-blue-500"
				}`}
				placeholder={isHeader ? `Coluna ${col + 1}` : "Conteúdo..."}
			/>
		);
	};

	// Renderizar preview da tabela
	const renderPreview = () => {
		const markdown = generateMarkdown();

		return (
			<div className="bg-gray-900/50 p-4 rounded-xl border border-gray-700/30">
				<h4 className="text-white font-semibold mb-3 flex items-center space-x-2">
					<Eye className="w-4 h-4" />
					<span>Preview da Tabela</span>
				</h4>

				{/* Tabela renderizada */}
				<div className="overflow-x-auto mb-4">
					<table className="min-w-full border border-gray-600 rounded-lg overflow-hidden">
						<thead className="bg-gray-700/50">
							<tr>
								{Array.from({ length: cols }).map((_, col) => (
									<th
										key={col}
										className={`px-3 py-2 text-sm font-semibold text-white border-r border-gray-600 last:border-r-0 ${
											alignment[col] === "center"
												? "text-center"
												: alignment[col] === "right"
												? "text-right"
												: "text-left"
										}`}
									>
										{tableData[`0-${col}`] || `Coluna ${col + 1}`}
									</th>
								))}
							</tr>
						</thead>
						<tbody>
							{Array.from({ length: rows - 1 }).map((_, row) => (
								<tr key={row + 1} className="border-t border-gray-600">
									{Array.from({ length: cols }).map((_, col) => (
										<td
											key={col}
											className={`px-3 py-2 text-sm text-gray-300 border-r border-gray-600 last:border-r-0 ${
												alignment[col] === "center"
													? "text-center"
													: alignment[col] === "right"
													? "text-right"
													: "text-left"
											}`}
										>
											{tableData[`${row + 1}-${col}`] || "-"}
										</td>
									))}
								</tr>
							))}
						</tbody>
					</table>
				</div>

				{/* Markdown gerado */}
				<div className="bg-gray-800/50 p-3 rounded-lg">
					<h5 className="text-gray-400 text-xs font-semibold mb-2">
						Markdown gerado:
					</h5>
					<pre className="text-xs text-gray-300 font-mono whitespace-pre-wrap overflow-x-auto">
						{markdown}
					</pre>
				</div>
			</div>
		);
	};

	// Não renderizar se não estiver aberto
	if (!isOpen) return null;

	return (
		<div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
			<div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-3xl border border-gray-700/50 max-w-5xl w-full max-h-[90vh] overflow-y-auto">
				{/* Header */}
				<div className="flex items-center justify-between p-6 border-b border-gray-700/50">
					<div className="flex items-center space-x-3">
						<div className="w-10 h-10 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-xl flex items-center justify-center">
							<Table className="w-5 h-5 text-white" />
						</div>
						<div>
							<h2 className="text-xl font-bold text-white">
								Gerador de Tabelas
							</h2>
							<p className="text-gray-400 text-sm">
								Crie tabelas markdown de forma visual
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
				<div className="p-6">
					<div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
						{/* Editor Section */}
						<div className="space-y-6">
							{/* Templates */}
							<div>
								<h3 className="text-white font-semibold mb-3">
									Templates Rápidos
								</h3>
								<div className="grid grid-cols-3 gap-3">
									{templates.map((template) => (
										<button
											key={template.id}
											onClick={() => applyTemplate(template)}
											className={`p-3 rounded-xl text-center transition-all duration-300 border ${
												selectedTemplate === template.id
													? "bg-indigo-600/20 border-indigo-500/50 text-indigo-400"
													: "bg-gray-800/30 border-gray-600/50 text-gray-300 hover:bg-gray-700/30 hover:border-gray-500/50"
											}`}
										>
											<div className="text-2xl mb-1">{template.icon}</div>
											<div className="text-xs font-medium">{template.name}</div>
											<div className="text-xs text-gray-500">
												{template.rows}x{template.cols}
											</div>
										</button>
									))}
								</div>
							</div>

							{/* Controles de Dimensão */}
							<div>
								<h3 className="text-white font-semibold mb-3">Dimensões</h3>
								<div className="flex items-center space-x-6">
									<div className="flex items-center space-x-3">
										<span className="text-gray-400 text-sm">Linhas:</span>
										<button
											onClick={removeRow}
											disabled={rows <= 2}
											className="p-1 rounded bg-gray-700 hover:bg-gray-600 text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-300"
										>
											<Minus className="w-4 h-4" />
										</button>
										<span className="text-white font-bold w-8 text-center">
											{rows}
										</span>
										<button
											onClick={addRow}
											disabled={rows >= 10}
											className="p-1 rounded bg-gray-700 hover:bg-gray-600 text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-300"
										>
											<Plus className="w-4 h-4" />
										</button>
									</div>

									<div className="flex items-center space-x-3">
										<span className="text-gray-400 text-sm">Colunas:</span>
										<button
											onClick={removeCol}
											disabled={cols <= 2}
											className="p-1 rounded bg-gray-700 hover:bg-gray-600 text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-300"
										>
											<Minus className="w-4 h-4" />
										</button>
										<span className="text-white font-bold w-8 text-center">
											{cols}
										</span>
										<button
											onClick={addCol}
											disabled={cols >= 8}
											className="p-1 rounded bg-gray-700 hover:bg-gray-600 text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-300"
										>
											<Plus className="w-4 h-4" />
										</button>
									</div>

									<button
										onClick={resetModal}
										className="flex items-center space-x-2 px-3 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg text-sm transition-colors duration-300"
									>
										<RotateCcw className="w-4 h-4" />
										<span>Reset</span>
									</button>
								</div>
							</div>

							{/* Alinhamento das Colunas */}
							<div>
								<h3 className="text-white font-semibold mb-3">
									Alinhamento das Colunas
								</h3>
								<div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
									{Array.from({ length: cols }).map((_, col) => (
										<div key={col} className="space-y-2">
											<span className="text-gray-400 text-xs">
												Col {col + 1}
											</span>
											<div className="flex bg-gray-800/30 rounded-lg p-1">
												{["left", "center", "right"].map((align) => {
													const Icon = {
														left: AlignLeft,
														center: AlignCenter,
														right: AlignRight,
													}[align];

													return (
														<button
															key={align}
															onClick={() => updateAlignment(col, align)}
															className={`flex-1 p-1 rounded transition-colors duration-300 ${
																alignment[col] === align
																	? "bg-indigo-600 text-white"
																	: "text-gray-400 hover:text-white hover:bg-gray-700/50"
															}`}
														>
															<Icon className="w-4 h-4 mx-auto" />
														</button>
													);
												})}
											</div>
										</div>
									))}
								</div>
							</div>

							{/* Editor da Tabela */}
							<div>
								<h3 className="text-white font-semibold mb-3">Editor</h3>
								<div className="space-y-2">
									{Array.from({ length: rows }).map((_, row) => (
										<div
											key={row}
											className="grid gap-2"
											style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}
										>
											{Array.from({ length: cols }).map((_, col) =>
												renderCell(row, col)
											)}
										</div>
									))}
								</div>
							</div>
						</div>

						{/* Preview Section */}
						<div className="space-y-6">
							<div className="flex items-center justify-between">
								<h3 className="text-white font-semibold">Preview</h3>
								<button
									onClick={() => setShowPreview(!showPreview)}
									className="flex items-center space-x-2 px-3 py-2 bg-gray-700/50 hover:bg-gray-700 text-white rounded-lg text-sm transition-colors duration-300"
								>
									{showPreview ? (
										<EyeOff className="w-4 h-4" />
									) : (
										<Eye className="w-4 h-4" />
									)}
									<span>{showPreview ? "Ocultar" : "Mostrar"}</span>
								</button>
							</div>

							{showPreview && renderPreview()}

							{/* Dicas */}
							<div className="bg-indigo-500/10 border border-indigo-500/20 rounded-xl p-4">
								<h4 className="text-indigo-400 font-semibold mb-2">💡 Dicas</h4>
								<ul className="text-indigo-300 text-sm space-y-1">
									<li>
										• Use <strong>templates</strong> para começar rapidamente
									</li>
									<li>
										• <strong>Headers</strong> (primeira linha) são automáticos
									</li>
									<li>
										• Ajuste o <strong>alinhamento</strong> por coluna
									</li>
									<li>• Células vazias aparecerão como "-" no preview</li>
									<li>
										• Máximo: <strong>10 linhas × 8 colunas</strong>
									</li>
								</ul>
							</div>
						</div>
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
						onClick={handleInsertTable}
						className="flex items-center space-x-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white px-6 py-3 rounded-xl font-semibold transition-all duration-300 shadow-lg hover:shadow-indigo-500/25 hover:scale-105"
					>
						<Table className="w-4 h-4" />
						<span>Inserir Tabela</span>
					</button>
				</div>
			</div>
		</div>
	);
};

export default TableGeneratorModal;
