import React from "react";
import { useParams } from "react-router-dom";
import FlexiblePage from "../../components/FlexiblePage";

const Materiais = () => {
	const { subsection } = useParams();

	if (subsection) {
		return <FlexiblePage pageKey="materiais" section={subsection} />;
	}

	return <FlexiblePage pageKey="materiais" />;
};

export default Materiais;
