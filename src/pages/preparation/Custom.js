import React from "react";
import { useParams } from "react-router-dom";
import FlexiblePage from "../../components/FlexiblePage";

const Custom = () => {
	const { section } = useParams();

	if (section) {
		return <FlexiblePage pageKey="custom" section={section} />;
	}

	return <FlexiblePage pageKey="custom" />;
};

export default Custom;
