import React, { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "../utils/supabase";
import { useNavigate } from "react-router-dom";

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within an AuthProvider");
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [role, setRole] = useState("user"); // default to 'user'
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // Fetch role from Supabase users table
  const fetchUserRole = async (userId) => {
    try {
      const { data, error } = await supabase
        .from("users")
        .select("role")
        .eq("id", userId)
        .maybeSingle();

      if (error) throw error;

      if (!data || !data.role) return "user"; // fallback to user
      return data.role === "admin" ? "admin" : "user"; // enforce only two roles
    } catch (err) {
      console.error("Error fetching role:", err);
      return "user";
    }
  };

  const handleSession = async (session) => {
    if (session?.user) {
      setUser(session.user);
      const dbRole = await fetchUserRole(session.user.id);
      setRole(dbRole);
    } else {
      setUser(null);
      setRole("user"); // default fallback
    }
    setLoading(false);
  };

  // Initialize auth on load
  useEffect(() => {
    const init = async () => {
      setLoading(true);
      try {
        const { data: { session } } = await supabase.auth.getSession();
        await handleSession(session);
      } catch (err) {
        console.error("Auth init error:", err);
        setLoading(false);
      }
    };

    init();

    const { data: listener } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        await handleSession(session);
      }
    );

    return () => listener.subscription.unsubscribe();
  }, []);

  // Login
  const login = async (email, password) => {
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;

      await handleSession(data.session);
      return data.user;
    } catch (err) {
      console.error("Login error:", err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Signup
  const signup = async (email, password, additionalData = {}) => {
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signUp({ email, password });
      if (error) throw error;

      if (data.user) {
        // Force role to 'user' for new accounts
        await supabase.from("users").insert([{ id: data.user.id, email, role: "user", ...additionalData }]);
        await handleSession({ user: data.user });
        return data.user;
      }
    } catch (err) {
      console.error("Signup error:", err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Logout
  const logout = async () => {
    setLoading(true);
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      setUser(null);
      setRole("user");
      navigate("/");
    } catch (err) {
      console.error("Logout failed:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthContext.Provider value={{ user, role, loading, login, signup, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
