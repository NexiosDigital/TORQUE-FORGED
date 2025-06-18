import React from "react";
import { useParams } from "react-router-dom";
import FlexiblePage from "../../components/FlexiblePage";

const Ferrari = () => {
	const { section } = useParams();

	if (section) {
		return <FlexiblePage pageKey="ferrari" section={section} />;
	}

	return <FlexiblePage pageKey="ferrari" />;
};

export default Ferrari;
