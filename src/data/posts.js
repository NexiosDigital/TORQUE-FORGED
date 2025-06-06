export const posts = [
	{
		id: 1,
		title: "GP de Mônaco 2025: Verstappen Domina nas Ruas Principescas",
		slug: "gp-monaco-2025-verstappen-domina",
		category: "f1",
		categoryName: "Fórmula 1",
		image: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800",
		excerpt:
			"Max Verstappen conquista mais uma vitória em Mônaco com uma performance impecável que deixou os fãs extasiados...",
		content: `Max Verstappen mais uma vez demonstrou sua maestria nas ruas estreitas de Monte Carlo, conquistando uma vitória dominante no GP de Mônaco 2025. O piloto holandês, largando da pole position, controlou a corrida do início ao fim.

A estratégia da Red Bull foi perfeita, com pit stops precisos e uma gestão exemplar dos pneus. Verstappen cruzou a linha de chegada com uma vantagem de mais de 15 segundos sobre Charles Leclerc, que ficou em segundo lugar para alegria da torcida local.

O pódio foi completado por Lewis Hamilton, que com uma Mercedes renovada mostrou sinais de recuperação após algumas temporadas difíceis. A corrida foi marcada por poucas ultrapassagens, característica típica de Mônaco, mas nem por isso deixou de ser emocionante.`,
		date: "2025-05-28",
		author: "Equipe TF",
		readTime: "5 min",
		trending: true,
		tags: ["f1", "verstappen", "monaco", "red-bull"],
	},
	{
		id: 2,
		title: "Novo Motor V8 Biturbo: A Revolução dos 1000HP",
		slug: "novo-motor-v8-biturbo-1000hp",
		category: "engines",
		categoryName: "Motores",
		image: "https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?w=800",
		excerpt:
			"Análise completa do novo propulsor que está mudando o cenário do tuning com tecnologia de ponta...",
		content: `A indústria automotiva testemunha mais uma revolução com o lançamento do novo motor V8 biturbo que promete entregar incríveis 1000 cavalos de potência. Este propulsor representa o que há de mais avançado em engenharia automotiva.

O motor utiliza tecnologia de injeção direta de combustível combinada com dois turbocompressores de geometria variável, resultando em uma resposta instantânea do acelerador e uma curva de torque impressionante. O sistema de gerenciamento eletrônico foi completamente redesenhado para otimizar cada aspecto da combustão.

Os materiais utilizados incluem liga de alumínio aeroespacial no bloco e pistões forjados de alta resistência. O sistema de lubrificação foi aprimorado com uma bomba de óleo de volume variável que se adapta às condições de uso, garantindo proteção máxima mesmo em condições extremas.`,
		date: "2025-05-25",
		author: "Tech Team",
		readTime: "8 min",
		trending: false,
		tags: ["motores", "v8", "biturbo", "tuning", "1000hp"],
	},
	{
		id: 3,
		title: "Daytona 500: A Batalha Épica que Definiu a Temporada",
		slug: "daytona-500-batalha-epica-temporada",
		category: "nascar",
		categoryName: "NASCAR",
		image: "https://images.unsplash.com/photo-1566473965997-3de9c817e938?w=800",
		excerpt:
			"Relato completo da corrida mais emocionante do ano com ultrapassagens incríveis e estratégias audaciosas...",
		content: `A Daytona 500 de 2025 entrou para a história como uma das corridas mais emocionantes já disputadas no autódromo mais famoso da NASCAR. Com 200 voltas de pura adrenalina, a corrida teve de tudo: ultrapassagens espetaculares, estratégias arriscadas e um final de tirar o fôlego.

Joey Logano conquistou sua segunda vitória na "Grande Americana", mas não foi fácil. O piloto da Ford teve que superar adversários formidáveis como Kyle Larson e Chase Elliott, que protagonizaram batalhas épicas nas últimas 50 voltas.

A corrida foi marcada por apenas duas bandeiras amarelas, permitindo um ritmo intenso do início ao fim. A estratégia de combustível foi crucial, com várias equipes apostando em diferentes janelas de abastecimento. O draft (vácuo aerodinâmico) funcionou perfeitamente, proporcionando ultrapassagens constantes e mantendo a emoção até a última volta.`,
		date: "2025-05-20",
		author: "Race Team",
		readTime: "6 min",
		trending: true,
		tags: ["nascar", "daytona", "500", "logano", "corrida"],
	},
];

export const categories = [
	{
		id: "f1",
		name: "Fórmula 1",
		description: "A elite do automobilismo mundial",
		color: "from-red-500 to-orange-500",
		count: 24,
	},
	{
		id: "nascar",
		name: "NASCAR",
		description: "A categoria mais popular dos EUA",
		color: "from-blue-500 to-cyan-500",
		count: 18,
	},
	{
		id: "endurance",
		name: "Endurance",
		description: "Corridas de resistência épicas",
		color: "from-green-500 to-emerald-500",
		count: 12,
	},
	{
		id: "drift",
		name: "Formula Drift",
		description: "A arte de deslizar com estilo",
		color: "from-purple-500 to-pink-500",
		count: 15,
	},
	{
		id: "tuning",
		name: "Tuning & Custom",
		description: "Personalização e modificações",
		color: "from-yellow-500 to-orange-500",
		count: 32,
	},
	{
		id: "engines",
		name: "Motores",
		description: "Tecnologia e performance",
		color: "from-indigo-500 to-purple-500",
		count: 28,
	},
];
