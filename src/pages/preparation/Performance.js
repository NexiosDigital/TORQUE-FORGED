import React from "react";
import { useParams } from "react-router-dom";
import FlexiblePage from "../../components/FlexiblePage";

const Performance = () => {
	const { section } = useParams();

	if (section) {
		return <FlexiblePage pageKey="performance" section={section} />;
	}

	return <FlexiblePage pageKey="performance" />;
};

export default Performance;
