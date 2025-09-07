import React, { createContext, useContext, useEffect, useState } from 'react'
import { supabase, isAdmin } from '../utils/supabase'
import { useNavigate } from 'react-router-dom'

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
  const navigate = useNavigate()

  useEffect(() => {
    // Get initial session
    const getInitialSession = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (session?.user) {
        // ✅ Check if user still exists in DB
        const { data, error } = await supabase
          .from('users')
          .select('id')
          .eq('id', session.user.id)
          .single()

        if (!data || error) {
          await supabase.auth.signOut()
          setUser(null)
          setUserIsAdmin(false)
          navigate('/')
          return
        }

        setUser(session.user)
        const adminStatus = await isAdmin(session.user.id)
        setUserIsAdmin(adminStatus)
      }
      setLoading(false)
    }

    getInitialSession()

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (session?.user) {
          // ✅ Check DB existence again
          const { data, error } = await supabase
            .from('users')
            .select('id')
            .eq('id', session.user.id)
            .single()

          if (!data || error) {
            await supabase.auth.signOut()
            setUser(null)
            setUserIsAdmin(false)
            navigate('/')
            return
          }

          setUser(session.user)
          const adminStatus = await isAdmin(session.user.id)
          setUserIsAdmin(adminStatus)
        } else {
          setUser(null)
          setUserIsAdmin(false)
          navigate('/')
        }
        setLoading(false)
      }
    )

    return () => subscription?.unsubscribe()
  }, [navigate])

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
