import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { User, Lock, ShoppingCart, LogOut, Eye, Clock, CheckCircle, XCircle } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { signOut, getUserPurchaseRequests } from '../utils/supabase'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import PinModal from './PinModal'

const UserDashboard = () => {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState('profile')
  const [purchaseRequests, setPurchaseRequests] = useState([])
  const [loading, setLoading] = useState(false)
  const [showPinModal, setShowPinModal] = useState(false)

  useEffect(() => {
    if (user) {
      fetchPurchaseRequests()
    }
  }, [user])

  const fetchPurchaseRequests = async () => {
    if (!user) return
    
    setLoading(true)
    try {
      const { data, error } = await getUserPurchaseRequests(user.id)
      if (error) throw error
      setPurchaseRequests(data || [])
    } catch (error) {
      console.error('Error fetching purchase requests:', error)
      toast.error('Failed to load purchase requests')
    } finally {
      setLoading(false)
    }
  }

  const handleSignOut = async () => {
    try {
      const { error } = await signOut()
      if (error) throw error
      toast.success('Signed out successfully')
      navigate('/')
    } catch (error) {
      console.error('Sign out error:', error)
      toast.error('Failed to sign out')
    }
  }

  const getStatusIcon = (status) => {
    switch (status) {
      case 'pending':
        return <Clock className="w-5 h-5 text-yellow-500" />
      case 'approved':
        return <CheckCircle className="w-5 h-5 text-green-500" />
      case 'denied':
        return <XCircle className="w-5 h-5 text-red-500" />
      default:
        return <Clock className="w-5 h-5 text-gray-500" />
    }
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800'
      case 'approved':
        return 'bg-green-100 text-green-800'
      case 'denied':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const tabs = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'gallery', label: 'Gallery Access', icon: Lock },
    { id: 'purchases', label: 'Purchase History', icon: ShoppingCart }
  ]

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-lg shadow-sm p-6 mb-8"
        >
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Welcome, {user?.user_metadata?.name || user?.email}
              </h1>
              <p className="text-gray-600 mt-1">Manage your account and access exclusive content</p>
            </div>
            <button
              onClick={handleSignOut}
              className="flex items-center space-x-2 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
            >
              <LogOut className="w-4 h-4" />
              <span>Sign Out</span>
            </button>
          </div>
        </motion.div>

        <div className="grid lg:grid-cols-4 gap-8">
          {/* Sidebar */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="lg:col-span-1"
          >
            <div className="bg-white rounded-lg shadow-sm p-6">
              <nav className="space-y-2">
                {tabs.map((tab) => {
                  const Icon = tab.icon
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-left transition-colors ${
                        activeTab === tab.id
                          ? 'bg-black text-white'
                          : 'text-gray-600 hover:bg-gray-100'
                      }`}
                    >
                      <Icon className="w-5 h-5" />
                      <span>{tab.label}</span>
                    </button>
                  )
                })}
              </nav>
            </div>
          </motion.div>

          {/* Content */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="lg:col-span-3"
          >
            <div className="bg-white rounded-lg shadow-sm p-6">
              {activeTab === 'profile' && (
                <div className="space-y-6">
                  <h2 className="text-2xl font-bold text-gray-900">Profile Information</h2>
                  
                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Name
                      </label>
                      <div className="p-3 bg-gray-50 rounded-lg">
                        {user?.user_metadata?.name || 'Not provided'}
                      </div>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Email
                      </label>
                      <div className="p-3 bg-gray-50 rounded-lg">
                        {user?.email}
                      </div>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Account Created
                      </label>
                      <div className="p-3 bg-gray-50 rounded-lg">
                        {new Date(user?.created_at).toLocaleDateString()}
                      </div>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Status
                      </label>
                      <div className="p-3 bg-green-50 rounded-lg text-green-800">
                        Active
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'gallery' && (
                <div className="space-y-6">
                  <h2 className="text-2xl font-bold text-gray-900">Gallery Access</h2>
                  
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                    <div className="flex items-start space-x-3">
                      <Eye className="w-6 h-6 text-blue-600 mt-1" />
                      <div>
                        <h3 className="text-lg font-semibold text-blue-900">
                          Access Protected Collections
                        </h3>
                        <p className="text-blue-700 mt-2">
                          Each collection in our gallery is password-protected to ensure exclusivity. 
                          Use the PIN provided to you to access your purchased or assigned collections.
                        </p>
                        <button
                          onClick={() => setShowPinModal(true)}
                          className="mt-4 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                        >
                          Enter Collection PIN
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="bg-gray-50 rounded-lg p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">
                      How Gallery Access Works
                    </h3>
                    <ul className="space-y-2 text-gray-700">
                      <li className="flex items-start space-x-2">
                        <span className="w-2 h-2 bg-gray-400 rounded-full mt-2" />
                        <span>Each collection has a unique PIN for access</span>
                      </li>
                      <li className="flex items-start space-x-2">
                        <span className="w-2 h-2 bg-gray-400 rounded-full mt-2" />
                        <span>PINs are provided after purchase or by invitation</span>
                      </li>
                      <li className="flex items-start space-x-2">
                        <span className="w-2 h-2 bg-gray-400 rounded-full mt-2" />
                        <span>Downloads require PIN verification for security</span>
                      </li>
                      <li className="flex items-start space-x-2">
                        <span className="w-2 h-2 bg-gray-400 rounded-full mt-2" />
                        <span>Download links expire after 60 seconds</span>
                      </li>
                    </ul>
                  </div>
                </div>
              )}

              {activeTab === 'purchases' && (
                <div className="space-y-6">
                  <h2 className="text-2xl font-bold text-gray-900">Purchase History</h2>
                  
                  {loading ? (
                    <div className="flex justify-center py-8">
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                        className="w-8 h-8 border-4 border-gray-300 border-t-black rounded-full"
                      />
                    </div>
                  ) : purchaseRequests.length === 0 ? (
                    <div className="text-center py-12">
                      <ShoppingCart className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                      <h3 className="text-lg font-semibold text-gray-500 mb-2">
                        No Purchase Requests Yet
                      </h3>
                      <p className="text-gray-400">
                        Browse our gallery and make your first purchase request.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {purchaseRequests.map((request) => (
                        <motion.div
                          key={request.id}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow"
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex space-x-4">
                              <img
                                src={`https://images.pexels.com/photos/${Math.floor(Math.random() * 1000000) + 1000000}/pexels-photo-${Math.floor(Math.random() * 1000000) + 1000000}.jpeg?auto=compress&cs=tinysrgb&w=200&h=150&fit=crop`}
                                alt={request.images?.title}
                                className="w-24 h-18 object-cover rounded-lg"
                              />
                              <div className="flex-1">
                                <h3 className="text-lg font-semibold text-gray-900">
                                  {request.images?.title || 'Untitled'}
                                </h3>
                                <p className="text-gray-600">
                                  Collection: {request.images?.collections?.title || 'Unknown'}
                                </p>
                                <p className="text-sm text-gray-500 mt-1">
                                  Requested: {new Date(request.created_at).toLocaleDateString()}
                                </p>
                                {request.details?.size && (
                                  <p className="text-sm text-gray-600 mt-1">
                                    Size: {request.details.size}
                                    {request.details.frame && `, Frame: ${request.details.frame}`}
                                  </p>
                                )}
                              </div>
                            </div>
                            
                            <div className="flex items-center space-x-2">
                              {getStatusIcon(request.status)}
                              <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(request.status)}`}>
                                {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                              </span>
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </motion.div>
        </div>
      </div>

      {/* Pin Modal */}
      {showPinModal && (
        <PinModal
          onClose={() => setShowPinModal(false)}
          onSubmit={(pin) => {
            // Navigate to gallery with PIN
            setShowPinModal(false)
            navigate('/')
            setTimeout(() => {
              const galleryElement = document.getElementById('gallery')
              if (galleryElement) {
                galleryElement.scrollIntoView({ behavior: 'smooth' })
              }
            }, 100)
          }}
          title="Enter Collection PIN"
        />
      )}
    </div>
  )
}

export default UserDashboard