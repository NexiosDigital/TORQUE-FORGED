import React from "react";
import { useParams } from "react-router-dom";
import FlexiblePage from "../../components/FlexiblePage";

const Formula1 = () => {
	const { section } = useParams();

	if (section) {
		return <FlexiblePage pageKey="f1" section={section} />;
	}

	return <FlexiblePage pageKey="f1" />;
};

export default Formula1;
