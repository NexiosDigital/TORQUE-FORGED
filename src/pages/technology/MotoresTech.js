import React from "react";
import { useParams } from "react-router-dom";
import FlexiblePage from "../../components/FlexiblePage";

const MotoresTech = () => {
	const { subsection } = useParams();

	if (subsection) {
		return <FlexiblePage pageKey="motores-tech" section={subsection} />;
	}

	return <FlexiblePage pageKey="motores-tech" />;
};

export default MotoresTech;
