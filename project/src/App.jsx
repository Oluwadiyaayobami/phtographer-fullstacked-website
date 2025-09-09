import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { AuthProvider, useAuth } from "./context/AuthContext";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import Home from "./pages/Home";
import UserDashboard from "../UserDashboard";
import AdminDashboard from "./pages/AdminDashboard";
import AuthForm from "./components/AuthForm";

// Loader
const Loader = ({ message = "Loading..." }) => (
  <div className="flex justify-center items-center h-64 text-gray-700 font-semibold">{message}</div>
);

// Protected route
const ProtectedRoute = ({ element, allowedRoles }) => {
  const { user, loading } = useAuth();
  if (loading) return <Loader message="Checking session..." />;
  if (!user) return <Navigate to="/login" replace />;
  if (!allowedRoles.includes(user.role)) {
    return <Navigate to={user.role === "admin" ? "/admin-dashboard" : "/user-dashboard"} replace />;
  }
  return element;
};

// Redirect logged-in users from login/signup
const AuthRedirect = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return <Loader message="Checking session..." />;
  if (user) return <Navigate to={user.role === "admin" ? "/admin-dashboard" : "/user-dashboard"} replace />;
  return children;
};

function App() {
  return (
    <Router>
      <AuthProvider>
        <div className="flex flex-col min-h-screen">
          <Navbar />
          <main className="flex-1">
            <Routes>
              <Route path="/" element={<Home />} />

              {/* Auth */}
              <Route path="/login" element={<AuthRedirect><AuthForm mode="login" /></AuthRedirect>} />
              <Route path="/signup" element={<AuthRedirect><AuthForm mode="signup" /></AuthRedirect>} />

              {/* Protected */}
              <Route path="/user-dashboard" element={<ProtectedRoute element={<UserDashboard />} allowedRoles={["user"]} />} />
              <Route path="/admin-dashboard" element={<ProtectedRoute element={<AdminDashboard />} allowedRoles={["admin"]} />} />

              {/* Fallback */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </main>
          <Footer />
          <Toaster position="top-right" toastOptions={{
            duration: 4000,
            style: { background: "#363636", color: "#fff" },
            success: { duration: 3000, iconTheme: { primary: "#10B981", secondary: "#fff" } },
            error: { duration: 5000, iconTheme: { primary: "#EF4444", secondary: "#fff" } },
          }} />
        </div>
      </AuthProvider>
    </Router>
  );
}

export default App;
