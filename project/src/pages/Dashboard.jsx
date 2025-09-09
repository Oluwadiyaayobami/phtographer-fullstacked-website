import React, { useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import UserDashboard from "../components/UserDashboard";
import AdminDashboard from "./AdminDashboard";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";

const Dashboard = () => {
  const { user, role, loading } = useAuth();
  const navigate = useNavigate();

  // Redirect to home if session expired
  useEffect(() => {
    if (!loading && !user) {
      navigate("/");
    }
  }, [user, loading, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="w-12 h-12 border-4 border-gray-300 border-t-black rounded-full"
        />
      </div>
    );
  }

  if (!user) return null;

  // Only two roles allowed
  return role === "admin" ? <AdminDashboard /> : <UserDashboard />;
};

export default Dashboard;
