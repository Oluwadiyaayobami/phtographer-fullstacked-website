import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  User, ShoppingCart, LogOut,
  Eye, Clock, CheckCircle, XCircle, Download
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import {
  getUserPurchaseRequests,
  signOut,
  getAllImages,
  createPurchaseRequest
} from '../utils/supabase'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import PinModal from './PinModal'

const UserDashboard = () => {
  const { user, role } = useAuth()
  const navigate = useNavigate()

  const [activeTab, setActiveTab] = useState('profile')
  const [purchaseRequests, setPurchaseRequests] = useState([])
  const [galleryImages, setGalleryImages] = useState([])
  const [loading, setLoading] = useState(false)
  const [showPinModal, setShowPinModal] = useState(false)
  const [checkingSession, setCheckingSession] = useState(true)

  // ------------------- SESSION & ROLE CHECK -------------------
  useEffect(() => {
    if (!user) {
      toast.error('Session expired. Redirecting to home.')
      navigate('/')
    } else if (role && role !== 'user') {
      toast.error('Access denied.')
      navigate(role === 'admin' ? '/admin-dashboard' : '/')
    }
    setCheckingSession(false)
  }, [user, role, navigate])

  // ------------------- FETCH PURCHASE REQUESTS -------------------
  useEffect(() => {
    const fetchPurchaseRequests = async () => {
      if (!user || role !== 'user') return
      setLoading(true)
      try {
        const { data, error } = await getUserPurchaseRequests(user.id)
        if (error) throw error
        setPurchaseRequests(data || [])
      } catch (err) {
        console.error('Error fetching purchase requests:', err)
        toast.error('Failed to load purchase requests')
      } finally {
        setLoading(false)
      }
    }

    fetchPurchaseRequests()
  }, [user, role])

  // ------------------- FETCH GALLERY IMAGES -------------------
  useEffect(() => {
    const fetchImages = async () => {
      setLoading(true)
      try {
        const { data, error } = await getAllImages()
        if (error) throw error
        setGalleryImages(data || [])
      } catch (err) {
        console.error('Error fetching images:', err)
        toast.error('Failed to load images')
      } finally {
        setLoading(false)
      }
    }

    fetchImages()
  }, [])

  // ------------------- SIGN OUT -------------------
  const handleSignOut = async () => {
    try {
      const { error } = await signOut()
      if (error) throw error
      toast.success('Signed out successfully')
      navigate('/')
    } catch (err) {
      console.error('Sign out error:', err)
      toast.error('Failed to sign out')
    }
  }

  // ------------------- PURCHASE REQUEST -------------------
  const handlePurchaseRequest = async (imageId) => {
    if (!user) {
      toast.error('Please sign in first')
      navigate('/auth')
      return
    }
    try {
      const { error } = await createPurchaseRequest(user.id, imageId)
      if (error) throw error
      toast.success('Purchase request sent! The admin will get back to you within 24 hours.')
      setPurchaseRequests(prev => [...prev, { image_id: imageId, status: 'pending', created_at: new Date().toISOString(), images: galleryImages.find(img => img.id === imageId) }])
    } catch (err) {
      console.error('Purchase request error:', err)
      toast.error('Failed to send request')
    }
  }

  // ------------------- STATUS HELPERS -------------------
  const getStatusIcon = (status) => {
    switch (status) {
      case 'pending': return <Clock className="w-5 h-5 text-yellow-500" />
      case 'approved': return <CheckCircle className="w-5 h-5 text-green-500" />
      case 'denied': return <XCircle className="w-5 h-5 text-red-500" />
      default: return <Clock className="w-5 h-5 text-gray-500" />
    }
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800'
      case 'approved': return 'bg-green-100 text-green-800'
      case 'denied': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  // ------------------- TABS -------------------
  const tabs = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'gallery', label: 'Gallery', icon: Eye },
    { id: 'purchases', label: 'Purchases', icon: ShoppingCart }
  ]

  // ------------------- LOADING STATE -------------------
  if (checkingSession) {
    return (
      <div className="min-h-screen flex justify-center items-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          className="w-10 h-10 border-4 border-gray-300 border-t-black rounded-full"
        />
      </div>
    )
  }

  // ------------------- JSX -------------------
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl shadow-md p-6 mb-8 flex flex-col sm:flex-row justify-between items-start sm:items-center"
        >
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Welcome, {user?.user_metadata?.name || user?.email}
            </h1>
            <p className="text-gray-600 mt-2">Manage your account and explore our collections</p>
          </div>
          <button
            onClick={handleSignOut}
            className="flex items-center space-x-2 bg-red-600 text-white px-4 py-2 rounded-xl hover:bg-red-700 transition"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out</span>
          </button>
        </motion.div>

        <div className="grid lg:grid-cols-4 gap-6">
          
          {/* Sidebar / Tabs */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="lg:col-span-1"
          >
            <div className="bg-white rounded-2xl shadow p-4">
              <nav className="flex lg:flex-col gap-2 overflow-x-auto">
                {tabs.map((tab) => {
                  const Icon = tab.icon
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`flex items-center gap-3 px-4 py-3 rounded-xl transition font-medium ${
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
            <div className="bg-white rounded-2xl shadow p-6 space-y-6">
              
              {/* Profile */}
              {activeTab === 'profile' && (
                <div className="space-y-6">
                  <h2 className="text-2xl font-bold text-gray-900">Profile Information</h2>
                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-600 mb-1">Name</label>
                      <div className="p-3 bg-gray-50 rounded-lg">{user?.user_metadata?.name || 'Not provided'}</div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-600 mb-1">Email</label>
                      <div className="p-3 bg-gray-50 rounded-lg">{user?.email}</div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-600 mb-1">Joined</label>
                      <div className="p-3 bg-gray-50 rounded-lg">{new Date(user?.created_at).toLocaleDateString()}</div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-600 mb-1">Status</label>
                      <div className="p-3 bg-green-50 rounded-lg text-green-800">Active</div>
                    </div>
                  </div>
                </div>
              )}

              {/* Gallery */}
              {activeTab === 'gallery' && (
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-4">Explore Gallery</h2>
                  {loading ? (
                    <div className="flex justify-center py-12">
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                        className="w-10 h-10 border-4 border-gray-300 border-t-black rounded-full"
                      />
                    </div>
                  ) : galleryImages.length === 0 ? (
                    <p className="text-center text-gray-500">No images available yet</p>
                  ) : (
                    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                      {galleryImages.map((img) => (
                        <div
                          key={img.id}
                          className="border rounded-xl overflow-hidden shadow hover:shadow-lg transition"
                        >
                          <img
                            src={img.image_url}
                            alt={img.title}
                            className="w-full h-48 object-cover"
                          />
                          <div className="p-4 space-y-3">
                            <h3 className="font-semibold text-gray-900">{img.title}</h3>
                            <p className="text-sm text-gray-600">{img.description || 'No description'}</p>
                            <div className="flex gap-3">
                              <button
                                onClick={() => handlePurchaseRequest(img.id)}
                                className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition"
                              >
                                Request
                              </button>
                              <button
                                onClick={() => navigate('/auth')}
                                className="flex items-center justify-center bg-gray-100 px-3 py-2 rounded-lg hover:bg-gray-200"
                              >
                                <Download className="w-4 h-4 text-gray-600" />
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Purchases */}
              {activeTab === 'purchases' && (
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-4">Purchase History</h2>
                  {loading ? (
                    <div className="flex justify-center py-8">
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                        className="w-8 h-8 border-4 border-gray-300 border-t-black rounded-full"
                      />
                    </div>
                  ) : purchaseRequests.length === 0 ? (
                    <p className="text-center text-gray-500">No purchase requests yet</p>
                  ) : (
                    <div className="space-y-4">
                      {purchaseRequests.map((request) => (
                        <motion.div
                          key={request.id}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="border rounded-xl p-4 flex flex-col md:flex-row justify-between items-start md:items-center shadow-sm gap-4"
                        >
                          <div>
                            <p className="font-semibold">{request.images?.title || 'Untitled'}</p>
                            <p className="text-sm text-gray-600">
                              Requested: {new Date(request.created_at).toLocaleDateString()}
                            </p>
                          </div>
                          <div className="flex items-center gap-3">
                            {getStatusIcon(request.status)}
                            <span
                              className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(
                                request.status
                              )}`}
                            >
                              {request.status}
                            </span>

                            {/* ✅ WhatsApp button only when approved */}
                            {request.status === 'approved' && (
                              <a
                                href="https://wa.me/2347060553627"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-2 bg-green-600 text-white px-3 py-1 rounded-lg hover:bg-green-700 transition text-sm"
                              >
                                <span>Chat Admin</span>
                              </a>
                            )}
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

      {/* PIN Modal */}
      {showPinModal && (
        <PinModal
          onClose={() => setShowPinModal(false)}
          onSubmit={(pin) => {
            setShowPinModal(false)
            toast.success(`PIN ${pin} submitted`)
          }}
          title="Enter Collection PIN"
        />
      )}
    </div>
  )
}

export default UserDashboard
