import React, { createContext, useContext, useEffect, useState } from 'react'
import { supabase, isAdmin } from '../utils/supabase'

const AuthContext = createContext()

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [userIsAdmin, setUserIsAdmin] = useState(false)

  useEffect(() => {
    const getInitialSession = async () => {
      const { data: { session } } = await supabase.auth.getSession()

      if (session?.user) {
        // ✅ Check if user exists in "users" table
        const { data: profile, error } = await supabase
          .from('users') // change to "profiles" if that's your table
          .select('*')
          .eq('id', session.user.id)
          .single()

        if (!profile || error) {
          // user deleted → force logout
          await supabase.auth.signOut()
          setUser(null)
          setUserIsAdmin(false)
        } else {
          setUser(session.user)
          const adminStatus = await isAdmin(session.user.id)
          setUserIsAdmin(adminStatus)
        }
      }

      setLoading(false)
    }

    getInitialSession()

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (session?.user) {
          const { data: profile, error } = await supabase
            .from('users')
            .select('*')
            .eq('id', session.user.id)
            .single()

          if (!profile || error) {
            await supabase.auth.signOut()
            setUser(null)
            setUserIsAdmin(false)
          } else {
            setUser(session.user)
            const adminStatus = await isAdmin(session.user.id)
            setUserIsAdmin(adminStatus)
          }
        } else {
          setUser(null)
          setUserIsAdmin(false)
        }
        setLoading(false)
      }
    )

    return () => subscription?.unsubscribe()
  }, [])

  const value = {
    user,
    userIsAdmin,
    loading
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}
