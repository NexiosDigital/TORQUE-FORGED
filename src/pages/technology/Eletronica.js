import React from "react";
import { useParams } from "react-router-dom";
import FlexiblePage from "../../components/FlexiblePage";

const Eletronica = () => {
	const { subsection } = useParams();

	if (subsection) {
		return <FlexiblePage pageKey="eletronica" section={subsection} />;
	}

	return <FlexiblePage pageKey="eletronica" />;
};

export default Eletronica;
