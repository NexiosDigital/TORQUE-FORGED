import React from "react";
import { useParams } from "react-router-dom";
import FlexiblePage from "./FlexiblePage";

/**
 * DynamicPage - Componente único para todas as páginas de categoria
 * Elimina a necessidade de arquivos individuais para cada página
 */
const DynamicPage = ({ pageKey: propPageKey }) => {
	const params = useParams();

	// Extrair pageKey de diferentes estruturas de URL
	const pageKey =
		propPageKey ||
		params.category ||
		params.brand ||
		params.section ||
		params.pageKey;

	// Extrair subsection de diferentes estruturas
	const subsection = params.subsection || params.section;

	return <FlexiblePage pageKey={pageKey} section={subsection} />;
};

export default DynamicPage;
