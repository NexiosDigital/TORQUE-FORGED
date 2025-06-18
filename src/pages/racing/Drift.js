import React from "react";
import { useParams } from "react-router-dom";
import FlexiblePage from "../../components/FlexiblePage";

const Drift = () => {
	const { section } = useParams();

	if (section) {
		return <FlexiblePage pageKey="drift" section={section} />;
	}

	return <FlexiblePage pageKey="drift" />;
};

export default Drift;
