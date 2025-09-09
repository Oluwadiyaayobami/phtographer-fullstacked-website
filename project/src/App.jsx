import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import Home from './pages/Home';
import Dashboard from './pages/Dashboard';
import AdminDashboard from './pages/AdminDashboard';
import AuthForm from './components/AuthForm';

// Protected route wrapper
const ProtectedRoute = ({ element, allowedRoles }) => {
  const { user, role, loading } = useAuth();

  if (loading) return <div className="text-center p-6">Loading...</div>;

  if (!user) return <Navigate to="/login" replace />;

  if (allowedRoles && !allowedRoles.includes(role)) {
    return <Navigate to="/" replace />;
  }

  return element;
};

// Redirect logged-in users away from login/signup pages
const AuthRedirect = ({ children }) => {
  const { user, role, loading } = useAuth();

  if (loading) return <div className="text-center p-6">Loading...</div>;

  if (user) {
    return <Navigate to={role === 'admin' ? '/admin-dashboard' : '/dashboard'} replace />;
  }

  return children;
};

function App() {
  return (
    <Router>
      <AuthProvider>
        <div className="flex flex-col min-h-screen">
          <Navbar />
          <main className="flex-1">
            <Routes>
              {/* Public Routes */}
              <Route path="/" element={<Home />} />
              <Route
                path="/login"
                element={
                  <AuthRedirect>
                    <AuthForm mode="signin" />
                  </AuthRedirect>
                }
              />
              <Route
                path="/signup"
                element={
                  <AuthRedirect>
                    <AuthForm mode="signup" />
                  </AuthRedirect>
                }
              />

              {/* Protected Routes */}
              <Route
                path="/dashboard"
                element={<ProtectedRoute element={<Dashboard />} allowedRoles={['user']} />}
              />
              <Route
                path="/admin-dashboard"
                element={<ProtectedRoute element={<AdminDashboard />} allowedRoles={['admin']} />}
              />

              {/* Fallback */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </main>
          <Footer />
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 4000,
              style: { background: '#363636', color: '#fff' },
              success: { duration: 3000, iconTheme: { primary: '#10B981', secondary: '#fff' } },
              error: { duration: 5000, iconTheme: { primary: '#EF4444', secondary: '#fff' } },
            }}
          />
        </div>
      </AuthProvider>
    </Router>
  );
}

export default App;
