import React from "react";
import { useParams } from "react-router-dom";
import FlexiblePage from "../../components/FlexiblePage";

const Mercedes = () => {
	const { section } = useParams();

	if (section) {
		return <FlexiblePage pageKey="mercedes" section={section} />;
	}

	return <FlexiblePage pageKey="mercedes" />;
};

export default Mercedes;
