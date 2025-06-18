import React from "react";
import { useParams } from "react-router-dom";
import FlexiblePage from "../../components/FlexiblePage";

const Aerodinamica = () => {
	const { subsection } = useParams();

	if (subsection) {
		return <FlexiblePage pageKey="aerodinamica" section={subsection} />;
	}

	return <FlexiblePage pageKey="aerodinamica" />;
};

export default Aerodinamica;
