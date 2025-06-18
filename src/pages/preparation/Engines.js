import React from "react";
import { useParams } from "react-router-dom";
import FlexiblePage from "../../components/FlexiblePage";

const Engines = () => {
	const { section } = useParams();

	if (section) {
		return <FlexiblePage pageKey="engines" section={section} />;
	}

	return <FlexiblePage pageKey="engines" />;
};

export default Engines;
