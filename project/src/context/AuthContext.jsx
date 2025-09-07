// import React, { createContext, useContext, useEffect, useState } from 'react'
// import { supabase, getCurrentUser, isAdmin } from '../utils/supabase'

// const AuthContext = createContext()

// export const useAuth = () => {
//   const context = useContext(AuthContext)
//   if (!context) {
//     throw new Error('useAuth must be used within an AuthProvider')
//   }
//   return context
// }

// export const AuthProvider = ({ children }) => {
//   const [user, setUser] = useState(null)
//   const [loading, setLoading] = useState(true)
//   const [userIsAdmin, setUserIsAdmin] = useState(false)

//   useEffect(() => {
//     // Get initial session
//     const getInitialSession = async () => {
//       const { data: { session } } = await supabase.auth.getSession()
//       if (session?.user) {
//         setUser(session.user)
//         const adminStatus = await isAdmin(session.user.id)
//         setUserIsAdmin(adminStatus)
//       }
//       setLoading(false)
//     }

//     getInitialSession()

//     // Listen for auth changes
//     const { data: { subscription } } = supabase.auth.onAuthStateChange(
//       async (event, session) => {
//         if (session?.user) {
//           setUser(session.user)
//           const adminStatus = await isAdmin(session.user.id)
//           setUserIsAdmin(adminStatus)
//         } else {
//           setUser(null)
//           setUserIsAdmin(false)
//         }
//         setLoading(false)
//       }
//     )

//     return () => subscription?.unsubscribe()
//   }, [])

//   const value = {
//     user,
//     userIsAdmin,
//     loading
//   }

//   return (
//     <AuthContext.Provider value={value}>
//       {children}
//     </AuthContext.Provider>
//   )
// }
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
    // Get initial session
    const getInitialSession = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (session?.user) {
        // Check if user still exists in DB
        const { data, error } = await supabase
          .from('users')
          .select('id')
          .eq('id', session.user.id)
          .single()

        if (!data || error) {
          // User deleted → log out & redirect
          await supabase.auth.signOut()
          setUser(null)
          setUserIsAdmin(false)
          window.location.href = '/'   // ✅ redirect to home
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
          // Re-check existence when session changes
          const { data, error } = await supabase
            .from('users')
            .select('id')
            .eq('id', session.user.id)
            .single()

          if (!data || error) {
            await supabase.auth.signOut()
            setUser(null)
            setUserIsAdmin(false)
            window.location.href = '/'   // ✅ redirect
            return
          }

          setUser(session.user)
          const adminStatus = await isAdmin(session.user.id)
          setUserIsAdmin(adminStatus)
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
