import React, { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "../utils/supabase";

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within an AuthProvider");
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null); // Supabase user object
  const [role, setRole] = useState(null); // user role: 'admin' | 'user'
  const [loading, setLoading] = useState(true);

  // Fetch role from Supabase users table
  const fetchUserRole = async (userId) => {
    try {
      const { data, error } = await supabase
        .from("users")
        .select("role")
        .eq("id", userId)
        .maybeSingle();
      if (error) throw error;
      return data?.role || "user";
    } catch (err) {
      console.error("Error fetching user role:", err);
      return "user";
    }
  };

  // Handle session updates
  const handleSession = async (session) => {
    if (session?.user) {
      setUser(session.user);
      const dbRole = await fetchUserRole(session.user.id);
      setRole(dbRole);
    } else {
      setUser(null);
      setRole(null);
    }
    setLoading(false); // ensure loading ends after handling session
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

    // Listen for auth state changes (login/logout)
    const { data: listener } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        await handleSession(session);
      }
    );

    return () => listener.subscription.unsubscribe();
  }, []);

  // Login function
  const login = async (email, password) => {
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      await handleSession(data.user ? { user: data.user } : null);
      return data.user;
    } catch (err) {
      console.error("Login error:", err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Signup function
  const signup = async (email, password, additionalData = {}) => {
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signUp({ email, password });
      if (error) throw error;

      if (data.user) {
        // Insert user with role and any additional fields
        await supabase.from("users").insert([{ id: data.user.id, email, ...additionalData }]);
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

  // Logout function
  const logout = async () => {
    setLoading(true);
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      setUser(null);
      setRole(null);
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
