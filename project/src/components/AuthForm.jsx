import React, { useState } from "react";
import { motion } from "framer-motion";
import { Eye, EyeOff, Camera } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { useAuth } from "../context/AuthContext";

const AuthForm = ({ mode }) => {
  const { login, signup, role } = useAuth();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    role: "user", // default role on signup
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (mode === "signup") {
        if (formData.password !== formData.confirmPassword) {
          toast.error("Passwords do not match");
          setLoading(false);
          return;
        }

        // Signup via AuthContext
        await signup(formData.email, formData.password, {
          name: formData.name,
          role: formData.role,
        });

        toast.success("Account created successfully!");
        navigate("/login"); // after signup go to login
      } else {
        // Login via AuthContext
        await login(formData.email, formData.password);

        toast.success("Signed in successfully!");

        // Redirect based on role from context
        if (role === "admin") {
          navigate("/admin-dashboard");
        } else if (role === "user") {
          navigate("/user-dashboard");
        } else {
          toast.error("Role not recognized");
        }
      }
    } catch (error) {
      console.error("Auth error:", error);
      toast.error(error.message || "Authentication failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center"
        >
          <Link to="/" className="flex items-center justify-center space-x-2 mb-6">
            <Camera className="h-12 w-12 text-white" />
            <span className="text-2xl font-bold text-white">PLENATHEGRAPHER</span>
          </Link>
          <h2 className="text-3xl font-bold text-white">
            {mode === "signup" ? "Create Account" : "Sign In"}
          </h2>
          <p className="mt-2 text-gray-400">
            {mode === "signup"
              ? "Join our exclusive community of photography enthusiasts"
              : "Welcome back to your photography portal"}
          </p>
        </motion.div>

        <motion.form
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="bg-white rounded-lg p-8 shadow-2xl space-y-6"
          onSubmit={handleSubmit}
        >
          {mode === "signup" && (
            <>
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                  Full Name *
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent transition-colors"
                  required
                />
              </div>

              <div>
                <label htmlFor="role" className="block text-sm font-medium text-gray-700 mb-2">
                  Role *
                </label>
                <select
                  id="role"
                  name="role"
                  value={formData.role}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent transition-colors"
                >
                  <option value="user">User</option>
                  <option value="admin">Admin</option>
                </select>
              </div>

              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
                  Confirm Password *
                </label>
                <input
                  type="password"
                  id="confirmPassword"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent transition-colors"
                  required
                />
              </div>
            </>
          )}

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
              Email Address *
            </label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent transition-colors"
              required
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
              Password *
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                id="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent transition-colors pr-12"
                required
              />
              <button
                type="button"
                className="absolute inset-y-0 right-0 pr-3 flex items-center"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <EyeOff className="h-5 w-5 text-gray-400" /> : <Eye className="h-5 w-5 text-gray-400" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-black text-white py-3 px-4 rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading
              ? mode === "signup"
                ? "Creating Account..."
                : "Signing In..."
              : mode === "signup"
              ? "Create Account"
              : "Sign In"}
          </button>

          <div className="text-center">
            {mode === "signup" ? (
              <p className="text-gray-600">
                Already have an account?{" "}
                <Link to="/login" className="font-medium text-black hover:text-gray-800">
                  Sign in here
                </Link>
              </p>
            ) : (
              <p className="text-gray-600">
                Don't have an account?{" "}
                <Link to="/signup" className="font-medium text-black hover:text-gray-800">
                  Create one here
                </Link>
              </p>
            )}
          </div>
        </motion.form>
      </div>
    </div>
  );
};

export default AuthForm;
