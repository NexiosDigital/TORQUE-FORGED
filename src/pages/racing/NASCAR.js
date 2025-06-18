import React from "react";
import { useParams } from "react-router-dom";
import FlexiblePage from "../../components/FlexiblePage";

const NASCAR = () => {
	const { section } = useParams();

	if (section) {
		return <FlexiblePage pageKey="nascar" section={section} />;
	}

	return <FlexiblePage pageKey="nascar" />;
};

export default NASCAR;
