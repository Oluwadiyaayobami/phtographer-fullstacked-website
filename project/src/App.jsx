import React, { useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route, useNavigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { AuthProvider, useAuth } from './context/AuthContext'
import Navbar from './components/Navbar'
import Footer from './components/Footer'
import Home from './pages/Home'
import Dashboard from './pages/Dashboard'
import AdminDashboard from './pages/AdminDashboard'
import AuthForm from './components/AuthForm'

// Redirect component
const AuthRedirect = () => {
  const { user, role, loading } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    if (!loading && user) {
      if (role === 'admin') {
        navigate('/AdminDashboard')
      } else {
        navigate('/dashboard')
      }
    }
  }, [user, role, loading, navigate])

  return null
}

// Protected route wrapper
const ProtectedRoute = ({ element, allowedRoles }) => {
  const { user, role, loading } = useAuth()

  if (loading) return <div className="text-center p-6">Loading...</div>

  if (!user) return <AuthForm mode="signin" />

  if (allowedRoles && !allowedRoles.includes(role)) {
    return <div className="text-center p-6">Unauthorized 🚫</div>
  }

  return element
}

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="flex flex-col min-h-screen">
          <Navbar />
          
          <main className="flex-1">
            <AuthRedirect />

            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/login" element={<AuthForm mode="signin" />} />
              <Route path="/signup" element={<AuthForm mode="signup" />} />
              
              {/* Protected Routes */}
              <Route 
                path="/dashboard" 
                element={<ProtectedRoute element={<Dashboard />} allowedRoles={['user']} />} 
              />
              <Route 
                path="/AdminDashboard" 
                element={<ProtectedRoute element={<AdminDashboard />} allowedRoles={['admin']} />} 
              />
            </Routes>
          </main>

          <Footer />
          
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 4000,
              style: {
                background: '#363636',
                color: '#fff',
              },
              success: {
                duration: 3000,
                iconTheme: {
                  primary: '#10B981',
                  secondary: '#fff',
                },
              },
              error: {
                duration: 5000,
                iconTheme: {
                  primary: '#EF4444',
                  secondary: '#fff',
                },
              },
            }}
          />
        </div>
      </Router>
    </AuthProvider>
  )
}

export default App
