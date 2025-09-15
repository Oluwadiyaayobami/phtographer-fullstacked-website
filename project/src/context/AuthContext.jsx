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
  const [user, setUser] = useState(null); // includes role + name
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // Fetch user from Supabase DB to get role and name
  const loadUser = async (authUser) => {
    try {
      const { data, error } = await supabase
        .from("users")
        .select("*")
        .eq("id", authUser.id)
        .single();

      if (error) throw error;

      // Merge auth user (id, email, etc.) with DB fields (name, role, etc.)
      const fullUser = { ...authUser, ...data };
      setUser(fullUser);
      return fullUser;
    } catch (err) {
      console.error("Error loading user:", err);
      const fallbackUser = { ...authUser, role: "user" };
      setUser(fallbackUser);
      return fallbackUser;
    }
  };

  // Handle session
  const handleSession = async (session) => {
    if (session?.user) {
      await loadUser(session.user);
    } else {
      setUser(null);
    }
    setLoading(false);
  };

  // Initialize on app load
  useEffect(() => {
    const init = async () => {
      setLoading(true);
      const { data } = await supabase.auth.getSession();
      await handleSession(data.session);
    };
    init();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        handleSession(session);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  // Signup
  const signup = async ({ email, password, name }) => {
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signUp({ email, password });
      if (error) throw error;

      const newUser = { id: data.user.id, email, name, role: "user" };
      await supabase.from("users").insert([newUser]);

      const fullUser = await loadUser(data.user);
      navigate("/user-dashboard");
      return fullUser;
    } catch (err) {
      console.error("Signup error:", err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Login
  const login = async ({ email, password }) => {
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;

      const fullUser = await loadUser(data.user);

      if (fullUser.role === "admin") navigate("/admin-dashboard");
      else navigate("/user-dashboard");

      return fullUser;
    } catch (err) {
      console.error("Login error:", err);
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
      navigate("/login");
    } catch (err) {
      console.error("Logout failed:", err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, signup, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
