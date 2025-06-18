import React from "react";
import { useParams } from "react-router-dom";
import FlexiblePage from "../../components/FlexiblePage";

const Tuning = () => {
	const { section } = useParams();

	if (section) {
		return <FlexiblePage pageKey="tuning" section={section} />;
	}

	return <FlexiblePage pageKey="tuning" />;
};

export default Tuning;
