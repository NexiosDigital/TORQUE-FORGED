import React from "react";
import { useParams } from "react-router-dom";
import FlexiblePage from "../../components/FlexiblePage";

const Porsche = () => {
	const { section } = useParams();

	if (section) {
		return <FlexiblePage pageKey="porsche" section={section} />;
	}

	return <FlexiblePage pageKey="porsche" />;
};

export default Porsche;
