import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

const ProtectedRoute = ({ children }) => {
	const { user, loading } = useAuth();
	const location = useLocation();

	if (loading) {
		return (
			<div className="min-h-screen bg-black flex items-center justify-center">
				<div className="animate-spin rounded-full h-32 w-32 border-b-2 border-red-500"></div>
			</div>
		);
	}

	if (!user) {
		return <Navigate to="/admin/login" state={{ from: location }} replace />;
	}

	return children;
};

export default ProtectedRoute;
