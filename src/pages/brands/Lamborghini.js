import React from "react";
import { useParams } from "react-router-dom";
import FlexiblePage from "../../components/FlexiblePage";

const McLaren = () => {
	const { section } = useParams();

	if (section) {
		return <FlexiblePage pageKey="mclaren" section={section} />;
	}

	return <FlexiblePage pageKey="mclaren" />;
};

export default McLaren;
