import React from "react";
import { useParams } from "react-router-dom";
import FlexiblePage from "../../components/FlexiblePage";

const Endurance = () => {
	const { section } = useParams();

	if (section) {
		return <FlexiblePage pageKey="endurance" section={section} />;
	}

	return <FlexiblePage pageKey="endurance" />;
};

export default Endurance;
