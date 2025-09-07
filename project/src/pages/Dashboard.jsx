import React from 'react'
import { useAuth } from '../context/AuthContext'
import UserDashboard from '../components/UserDashboard'
import AdminDashboard from '../components/AdminDashboard'
import { motion } from 'framer-motion'

const Dashboard = () => {
  const { user, userIsAdmin, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="w-12 h-12 border-4 border-gray-300 border-t-black rounded-full"
        />
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Access Denied</h2>
          <p className="text-gray-600">Please sign in to access the dashboard.</p>
        </div>
      </div>
    )
  }

  return userIsAdmin ? <AdminDashboard /> : <UserDashboard />
}

export default Dashboard