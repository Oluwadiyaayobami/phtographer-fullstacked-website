import React, { createContext, useContext, useEffect, useState } from "react"
import { supabase } from "../utils/supabase"

const AuthContext = createContext()

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [role, setRole] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const getSession = async () => {
      setLoading(true)
      const { data: { session }, error } = await supabase.auth.getSession()

      if (error) {
        console.error("Error getting session:", error)
        setUser(null)
        setRole(null)
      } else if (session?.user) {
        setUser(session.user)
        setRole(session.user.user_metadata?.role || "user") // ✅ role comes from metadata
      } else {
        setUser(null)
        setRole(null)
      }

      setLoading(false)
    }

    getSession()

    const {
      data: { subscription }
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setUser(session.user)
        setRole(session.user.user_metadata?.role || "user")
      } else {
        setUser(null)
        setRole(null)
      }
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  return (
    <AuthContext.Provider value={{ user, role, loading }}>
      {children}
    </AuthContext.Provider>
  )
}
