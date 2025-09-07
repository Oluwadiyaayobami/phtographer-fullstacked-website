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
    let channel

    // Get initial session
    const getInitialSession = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (session?.user) {
        setUser(session.user)
        const adminStatus = await isAdmin(session.user.id)
        setUserIsAdmin(adminStatus)

        // Start realtime subscription for this user
        channel = supabase
          .channel('user-realtime-check')
          .on(
            'postgres_changes',
            {
              event: '*',
              schema: 'public',
              table: 'users',
              filter: `id=eq.${session.user.id}`,
            },
            async (payload) => {
              if (payload.eventType === 'DELETE') {
                await supabase.auth.signOut()
                setUser(null)
                setUserIsAdmin(false)
                navigate('/login')
              }
            }
          )
          .subscribe()
      }
      setLoading(false)
    }

    getInitialSession()

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (session?.user) {
          setUser(session.user)
          const adminStatus = await isAdmin(session.user.id)
          setUserIsAdmin(adminStatus)

          // Re-subscribe to realtime changes for the new user
          if (channel) supabase.removeChannel(channel)
          channel = supabase
            .channel('user-realtime-check')
            .on(
              'postgres_changes',
              {
                event: '*',
                schema: 'public',
                table: 'users',
                filter: `id=eq.${session.user.id}`,
              },
              async (payload) => {
                if (payload.eventType === 'DELETE') {
                  await supabase.auth.signOut()
                  setUser(null)
                  setUserIsAdmin(false)
                  navigate('/login')
                }
              }
            )
            .subscribe()
        } else {
          setUser(null)
          setUserIsAdmin(false)
          if (channel) supabase.removeChannel(channel)
        }
        setLoading(false)
      }
    )

    return () => {
      subscription?.unsubscribe()
      if (channel) supabase.removeChannel(channel)
    }
  }, [navigate])

  const value = {
    user,
    userIsAdmin,
    loading,
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}
