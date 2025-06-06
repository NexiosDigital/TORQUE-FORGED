import React from "react";
import { Routes, Route } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { AuthProvider } from "./contexts/AuthContext";
import Layout from "./components/Layout/Layout";
import ProtectedRoute from "./components/ProtectedRoute";
import Home from "./pages/Home";
import Formula1 from "./pages/Formula1";
import NASCAR from "./pages/NASCAR";
import Endurance from "./pages/Endurance";
import Drift from "./pages/Drift";
import Tuning from "./pages/Tuning";
import Engines from "./pages/Engines";
import About from "./pages/About";
import Contact from "./pages/Contact";
import PostDetail from "./pages/PostDetail";
import Category from "./pages/Category";
import AdminLogin from "./pages/Admin/Login";
import AdminDashboard from "./pages/Admin/Dashboard";
import PostEditor from "./pages/Admin/PostEditor";

function App() {
	return (
		<AuthProvider>
			<div className="App">
				<Toaster
					position="top-right"
					toastOptions={{
						duration: 4000,
						style: {
							background: "#1f2937",
							color: "#ffffff",
							border: "1px solid #374151",
						},
						success: {
							style: {
								border: "1px solid #10b981",
							},
						},
						error: {
							style: {
								border: "1px solid #ef4444",
							},
						},
					}}
				/>

				<Routes>
					{/* Public Routes */}
					<Route
						path="/"
						element={
							<Layout>
								<Home />
							</Layout>
						}
					/>
					<Route
						path="/f1"
						element={
							<Layout>
								<Formula1 />
							</Layout>
						}
					/>
					<Route
						path="/nascar"
						element={
							<Layout>
								<NASCAR />
							</Layout>
						}
					/>
					<Route
						path="/endurance"
						element={
							<Layout>
								<Endurance />
							</Layout>
						}
					/>
					<Route
						path="/drift"
						element={
							<Layout>
								<Drift />
							</Layout>
						}
					/>
					<Route
						path="/tuning"
						element={
							<Layout>
								<Tuning />
							</Layout>
						}
					/>
					<Route
						path="/engines"
						element={
							<Layout>
								<Engines />
							</Layout>
						}
					/>
					<Route
						path="/about"
						element={
							<Layout>
								<About />
							</Layout>
						}
					/>
					<Route
						path="/contact"
						element={
							<Layout>
								<Contact />
							</Layout>
						}
					/>
					<Route
						path="/post/:id"
						element={
							<Layout>
								<PostDetail />
							</Layout>
						}
					/>
					<Route
						path="/category/:category"
						element={
							<Layout>
								<Category />
							</Layout>
						}
					/>

					{/* Admin Routes */}
					<Route path="/admin/login" element={<AdminLogin />} />
					<Route
						path="/admin/dashboard"
						element={
							<ProtectedRoute>
								<AdminDashboard />
							</ProtectedRoute>
						}
					/>
					<Route
						path="/admin/posts/new"
						element={
							<ProtectedRoute>
								<PostEditor />
							</ProtectedRoute>
						}
					/>
					<Route
						path="/admin/posts/edit/:id"
						element={
							<ProtectedRoute>
								<PostEditor />
							</ProtectedRoute>
						}
					/>
				</Routes>
			</div>
		</AuthProvider>
	);
}

export default App;
