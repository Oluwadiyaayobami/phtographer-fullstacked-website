import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Upload, Users, Image as ImageIcon, ShoppingCart, Settings, CheckCircle, XCircle, Eye, LogOut } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { getAllPurchaseRequests, updatePurchaseRequestStatus } from '../utils/supabase'
import toast from 'react-hot-toast'

const AdminDashboard = () => {
  const { user, logout } = useAuth()
  const [activeTab, setActiveTab] = useState('overview')
  const [purchaseRequests, setPurchaseRequests] = useState([])
  const [loading, setLoading] = useState(false)

  // Redirect or block if user is not admin
  useEffect(() => {
    if (!user || !user.is_admin) {
      toast.error('Access denied: Admins only')
      // Optionally navigate to login or home here
    }
  }, [user])

  useEffect(() => {
    fetchPurchaseRequests()
  }, [])

  const fetchPurchaseRequests = async () => {
    setLoading(true)
    try {
      const { data, error } = await getAllPurchaseRequests()
      if (error) throw error
      setPurchaseRequests(data || [])
    } catch (error) {
      console.error('Error fetching purchase requests:', error)
      toast.error('Failed to load purchase requests')
    } finally {
      setLoading(false)
    }
  }

  const handleStatusUpdate = async (requestId, status) => {
    try {
      const { error } = await updatePurchaseRequestStatus(requestId, status)
      if (error) throw error
      
      setPurchaseRequests(prev =>
        prev.map(request =>
          request.id === requestId ? { ...request, status } : request
        )
      )
      
      toast.success(`Request ${status === 'approved' ? 'approved' : 'denied'} successfully`)
    } catch (error) {
      console.error('Error updating status:', error)
      toast.error('Failed to update request status')
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

  const stats = {
    totalRequests: purchaseRequests.length,
    pendingRequests: purchaseRequests.filter(r => r.status === 'pending').length,
    approvedRequests: purchaseRequests.filter(r => r.status === 'approved').length,
    deniedRequests: purchaseRequests.filter(r => r.status === 'denied').length,
  }

  const tabs = [
    { id: 'overview', label: 'Overview', icon: Eye },
    { id: 'requests', label: 'Purchase Requests', icon: ShoppingCart },
    { id: 'upload', label: 'Upload Content', icon: Upload },
    { id: 'users', label: 'Users', icon: Users },
    { id: 'settings', label: 'Settings', icon: Settings }
  ]

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-lg shadow-sm p-6 mb-8 flex justify-between items-center"
        >
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
            <p className="text-gray-600 mt-1">Manage your photography business</p>
          </div>
          <div className="flex items-center space-x-4">
            <div className="bg-black text-white px-4 py-2 rounded-lg">
              <span className="text-sm">Admin Panel</span>
            </div>
            <button
              onClick={logout}
              className="flex items-center space-x-1 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
            >
              <LogOut className="w-4 h-4" />
              <span>Logout</span>
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

              {/* --- Overview Tab --- */}
              {activeTab === 'overview' && (
                <div className="space-y-6">
                  <h2 className="text-2xl font-bold text-gray-900">Business Overview</h2>
                  
                  {/* Stats Grid */}
                  <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-blue-600 text-sm font-medium">Total Requests</p>
                          <p className="text-3xl font-bold text-blue-900">{stats.totalRequests}</p>
                        </div>
                        <ShoppingCart className="w-8 h-8 text-blue-600" />
                      </div>
                    </div>
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-yellow-600 text-sm font-medium">Pending</p>
                          <p className="text-3xl font-bold text-yellow-900">{stats.pendingRequests}</p>
                        </div>
                        <Eye className="w-8 h-8 text-yellow-600" />
                      </div>
                    </div>
                    <div className="bg-green-50 border border-green-200 rounded-lg p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-green-600 text-sm font-medium">Approved</p>
                          <p className="text-3xl font-bold text-green-900">{stats.approvedRequests}</p>
                        </div>
                        <CheckCircle className="w-8 h-8 text-green-600" />
                      </div>
                    </div>
                    <div className="bg-red-50 border border-red-200 rounded-lg p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-red-600 text-sm font-medium">Denied</p>
                          <p className="text-3xl font-bold text-red-900">{stats.deniedRequests}</p>
                        </div>
                        <XCircle className="w-8 h-8 text-red-600" />
                      </div>
                    </div>
                  </div>

                  <div className="bg-gray-50 rounded-lg p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
                    <div className="grid md:grid-cols-3 gap-4">
                      <button
                        onClick={() => setActiveTab('requests')}
                        className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow text-left"
                      >
                        <ShoppingCart className="w-8 h-8 text-gray-600 mb-2" />
                        <h4 className="font-semibold text-gray-900">Review Requests</h4>
                        <p className="text-sm text-gray-600">Manage purchase requests</p>
                      </button>
                      <button
                        onClick={() => setActiveTab('upload')}
                        className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow text-left"
                      >
                        <Upload className="w-8 h-8 text-gray-600 mb-2" />
                        <h4 className="font-semibold text-gray-900">Upload Content</h4>
                        <p className="text-sm text-gray-600">Add new collections</p>
                      </button>
                      <button
                        onClick={() => setActiveTab('users')}
                        className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow text-left"
                      >
                        <Users className="w-8 h-8 text-gray-600 mb-2" />
                        <h4 className="font-semibold text-gray-900">Manage Users</h4>
                        <p className="text-sm text-gray-600">View user accounts</p>
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* --- Purchase Requests Tab --- */}
              {activeTab === 'requests' && (
                <div className="space-y-6">
                  <h2 className="text-2xl font-bold text-gray-900">Purchase Requests</h2>
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
                        No Purchase Requests
                      </h3>
                      <p className="text-gray-400">
                        Customer purchase requests will appear here.
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
                            <div className="flex space-x-4 flex-1">
                              <img
                                src={`https://images.pexels.com/photos/${Math.floor(Math.random() * 1000000) + 1000000}/pexels-photo-${Math.floor(Math.random() * 1000000) + 1000000}.jpeg?auto=compress&cs=tinysrgb&w=200&h=150&fit=crop`}
                                alt={request.images?.title}
                                className="w-24 h-18 object-cover rounded-lg"
                              />
                              <div className="flex-1">
                                <div className="flex items-start justify-between">
                                  <div>
                                    <h3 className="text-lg font-semibold text-gray-900">
                                      {request.images?.title || 'Untitled'}
                                    </h3>
                                    <p className="text-gray-600">
                                      Customer: {request.users?.name || request.users?.email}
                                    </p>
                                    <p className="text-gray-600">
                                      Collection: {request.images?.collections?.title || 'Unknown'}
                                    </p>
                                    <p className="text-sm text-gray-500 mt-1">
                                      Requested: {new Date(request.created_at).toLocaleDateString()}
                                    </p>
                                  </div>
                                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(request.status)}`}>
                                    {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                                  </span>
                                </div>
                                {request.details && (
                                  <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                                    <p className="text-sm text-gray-700">
                                      <strong>Size:</strong> {request.details.size || 'Not specified'}
                                    </p>
                                    {request.details.frame && (
                                      <p className="text-sm text-gray-700">
                                        <strong>Frame:</strong> {request.details.frame}
                                      </p>
                                    )}
                                    {request.details.notes && (
                                      <p className="text-sm text-gray-700">
                                        <strong>Notes:</strong> {request.details.notes}
                                      </p>
                                    )}
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                          {request.status === 'pending' && (
                            <div className="mt-4 flex space-x-3">
                              <button
                                onClick={() => handleStatusUpdate(request.id, 'approved')}
                                className="flex items-center space-x-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
                              >
                                <CheckCircle className="w-4 h-4" />
                                <span>Approve</span>
                              </button>
                              <button
                                onClick={() => handleStatusUpdate(request.id, 'denied')}
                                className="flex items-center space-x-2 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
                              >
                                <XCircle className="w-4 h-4" />
                                <span>Deny</span>
                              </button>
                            </div>
                          )}
                        </motion.div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* --- Upload Tab --- */}
              {activeTab === 'upload' && (
                <div className="space-y-6">
                  <h2 className="text-2xl font-bold text-gray-900">Upload Content</h2>
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                    <div className="flex items-start space-x-3">
                      <Upload className="w-6 h-6 text-blue-600 mt-1" />
                      <div>
                        <h3 className="text-lg font-semibold text-blue-900">
                          Content Management
                        </h3>
                        <p className="text-blue-700 mt-2">
                          This feature requires backend integration with Supabase storage. 
                          In production, implement:
                        </p>
                        <ul className="mt-4 space-y-2 text-blue-700">
                          <li>• Image upload to Supabase Storage buckets</li>
                          <li>• Collection creation with PIN assignment</li>
                          <li>• Batch upload functionality</li>
                          <li>• Image metadata management</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-12 text-center">
                    <Upload className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      Upload New Collection
                    </h3>
                    <p className="text-gray-600 mb-4">
                      Drag and drop images here, or click to browse
                    </p>
                    <button className="bg-black text-white px-6 py-3 rounded-lg hover:bg-gray-800 transition-colors">
                      Choose Files
                    </button>
                  </div>
                </div>
              )}

              {/* --- Users Tab --- */}
              {activeTab === 'users' && (
                <div className="space-y-6">
                  <h2 className="text-2xl font-bold text-gray-900">User Management</h2>
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
                    <div className="flex items-start space-x-3">
                      <Users className="w-6 h-6 text-yellow-600 mt-1" />
                      <div>
                        <h3 className="text-lg font-semibold text-yellow-900">
                          User Management System
                        </h3>
                        <p className="text-yellow-700 mt-2">
                          In production, implement:
                        </p>
                        <ul className="mt-4 space-y-2 text-yellow-700">
                          <li>• User listing with search and filters</li>
                          <li>• User role management (admin/user)</li>
                          <li>• Account status controls</li>
                          <li>• User activity analytics</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* --- Settings Tab --- */}
              {activeTab === 'settings' && (
                <div className="space-y-6">
                  <h2 className="text-2xl font-bold text-gray-900">Settings</h2>
                  <div className="space-y-6">
                    <div className="bg-white border border-gray-200 rounded-lg p-6">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">
                        Business Information
                      </h3>
                      <div className="grid md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Business Name
                          </label>
                          <input
                            type="text"
                            className="block w-full border-gray-300 rounded-lg shadow-sm focus:ring-black focus:border-black sm:text-sm"
                            placeholder="PLENATHEGRAPHER"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Email
                          </label>
                          <input
                            type="email"
                            className="block w-full border-gray-300 rounded-lg shadow-sm focus:ring-black focus:border-black sm:text-sm"
                            placeholder="contact@plenathegrapher.com"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="bg-white border border-gray-200 rounded-lg p-6">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">
                        Preferences
                      </h3>
                      <div className="space-y-3">
                        <div className="flex items-center space-x-2">
                          <input type="checkbox" className="h-4 w-4 text-black border-gray-300 rounded" />
                          <label className="text-gray-700">Enable Email Notifications</label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <input type="checkbox" className="h-4 w-4 text-black border-gray-300 rounded" />
                          <label className="text-gray-700">Enable Dark Mode</label>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

            </div>
          </motion.div>
        </div>
      </div>
    </div>
  )
}

export default AdminDashboard
