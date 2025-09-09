import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Upload, Users, ShoppingCart, Settings, CheckCircle, XCircle, Eye, LogOut } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { getAllPurchaseRequests, updatePurchaseRequestStatus, supabase } from '../utils/supabase'
import toast from 'react-hot-toast'

const AdminDashboard = () => {
  const { user, logout } = useAuth()
  const [activeTab, setActiveTab] = useState('overview')
  const [purchaseRequests, setPurchaseRequests] = useState([])
  const [loading, setLoading] = useState(false)
  const [allUsers, setAllUsers] = useState([])
  const [settings, setSettings] = useState({
    businessName: 'PLENATHEGRAPHER',
    email: 'contact@plenathegrapher.com',
    notifications: true,
    darkMode: false
  })

  // Fetch purchase requests when user is ready
  useEffect(() => {
    if (!user) return
    fetchPurchaseRequests()
  }, [user])

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
      case 'pending': return 'bg-yellow-100 text-yellow-800'
      case 'approved': return 'bg-green-100 text-green-800'
      case 'denied': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
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

  // ---------------- Upload Tab ----------------
  const handleFileUpload = async (files) => {
    if (!files) return
    const folder = `gallery/${Date.now()}`

    for (let file of files) {
      const { data, error: uploadError } = await supabase.storage
        .from('gallery')
        .upload(`${folder}/${file.name}`, file)

      if (uploadError) {
        toast.error(`Failed to upload ${file.name}`)
        continue
      }

      const { publicUrl } = supabase.storage.from('gallery').getPublicUrl(`${folder}/${file.name}`)

      // Save metadata to Supabase
      const { error: dbError } = await supabase.from('images').insert([
        {
          title: file.name,
          collection: folder,
          url: publicUrl,
          uploaded_by: user.id,
          created_at: new Date()
        }
      ])

      if (dbError) {
        toast.error(`Failed to save metadata for ${file.name}`)
        continue
      }

      toast.success(`${file.name} uploaded successfully!`)
    }
  }

  // ---------------- Users Tab ----------------
  useEffect(() => {
    if (activeTab === 'users' && user) fetchUsers()
  }, [activeTab, user])

  const fetchUsers = async () => {
    try {
      const { data, error } = await supabase.from('users').select('*')
      if (error) throw error
      setAllUsers(data || [])
    } catch (err) {
      toast.error("Failed to fetch users")
    }
  }

  const updateUserRole = async (userId, role) => {
    const { error } = await supabase.from('users').update({ role }).eq('id', userId)
    if (error) toast.error("Failed to update role")
    else {
      setAllUsers(prev => prev.map(u => u.id === userId ? { ...u, role } : u))
      toast.success("Role updated successfully")
    }
  }

  // ---------------- Settings Tab ----------------
  useEffect(() => {
    if (activeTab === 'settings' && user) fetchSettings()
  }, [activeTab, user])

  const fetchSettings = async () => {
    try {
      const { data, error } = await supabase.from('settings').select('*').single()
      if (!error && data) setSettings(data)
    } catch (err) {
      console.error("Failed to fetch settings:", err)
    }
  }

  const updateSettings = async () => {
    const { error } = await supabase.from('settings').upsert(settings)
    if (error) toast.error("Failed to update settings")
    else toast.success("Settings updated!")
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-r from-black via-gray-800 to-black rounded-lg shadow-lg p-6 mb-8 flex justify-between items-center"
        >
          <div>
            <h1 className="text-3xl font-extrabold text-white">Admin Dashboard</h1>
            <p className="text-gray-300 mt-1">Manage your photography business</p>
          </div>
          <div className="flex items-center space-x-4">
            <div className="bg-white text-black px-4 py-2 rounded-lg font-semibold">
              Admin Panel
            </div>
            <button
              onClick={logout}
              className="flex items-center space-x-1 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors shadow-md"
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
            <div className="bg-white rounded-lg shadow-lg p-6 sticky top-8">
              <nav className="space-y-2">
                {tabs.map((tab) => {
                  const Icon = tab.icon
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-left transition-colors font-medium ${
                        activeTab === tab.id ? 'bg-black text-white shadow-md' : 'text-gray-600 hover:bg-gray-100'
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
            <div className="bg-white rounded-lg shadow-lg p-6 space-y-6">

              {/* Overview Tab */}
              {activeTab === 'overview' && (
                <div className="space-y-6">
                  <h2 className="text-2xl font-bold text-gray-900">Business Overview</h2>
                  <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 shadow-sm">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-blue-600 text-sm font-medium">Total Requests</p>
                          <p className="text-3xl font-bold text-blue-900">{stats.totalRequests}</p>
                        </div>
                        <ShoppingCart className="w-8 h-8 text-blue-600" />
                      </div>
                    </div>
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 shadow-sm">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-yellow-600 text-sm font-medium">Pending</p>
                          <p className="text-3xl font-bold text-yellow-900">{stats.pendingRequests}</p>
                        </div>
                        <Eye className="w-8 h-8 text-yellow-600" />
                      </div>
                    </div>
                    <div className="bg-green-50 border border-green-200 rounded-lg p-6 shadow-sm">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-green-600 text-sm font-medium">Approved</p>
                          <p className="text-3xl font-bold text-green-900">{stats.approvedRequests}</p>
                        </div>
                        <CheckCircle className="w-8 h-8 text-green-600" />
                      </div>
                    </div>
                    <div className="bg-red-50 border border-red-200 rounded-lg p-6 shadow-sm">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-red-600 text-sm font-medium">Denied</p>
                          <p className="text-3xl font-bold text-red-900">{stats.deniedRequests}</p>
                        </div>
                        <XCircle className="w-8 h-8 text-red-600" />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Requests Tab */}
              {activeTab === 'requests' && (
                <div className="space-y-6">
                  <h2 className="text-2xl font-bold text-gray-900">Purchase Requests</h2>
                  {/* Add your requests table or list here */}
                </div>
              )}

              {/* Upload Tab */}
              {activeTab === "upload" && (
                <div className="space-y-6">
                  <h2 className="text-2xl font-bold text-gray-900">Upload Content</h2>
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-12 text-center">
                    <input
                      type="file"
                      multiple
                      onChange={(e) => handleFileUpload(e.target.files)}
                      className="hidden"
                      id="fileInput"
                    />
                    <label htmlFor="fileInput" className="cursor-pointer">
                      <Upload className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">Upload New Collection</h3>
                      <p className="text-gray-600 mb-4">Click to browse files</p>
                      <button className="bg-black text-white px-6 py-3 rounded-lg hover:bg-gray-800 transition-colors shadow-md">Choose Files</button>
                    </label>
                  </div>
                </div>
              )}

              {/* Users Tab */}
              {activeTab === 'users' && (
                <div className="space-y-6">
                  <h2 className="text-2xl font-bold text-gray-900">User Management</h2>
                  <div className="bg-white rounded-lg shadow-lg p-6 overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead>
                        <tr>
                          <th>Name</th>
                          <th>Email</th>
                          <th>Role</th>
                          <th>Status</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {allUsers.map(u => (
                          <tr key={u.id}>
                            <td>{u.name}</td>
                            <td>{u.email}</td>
                            <td>{u.role}</td>
                            <td>{u.approved ? "Approved" : "Pending"}</td>
                            <td className="space-x-2">
                              <button onClick={() => updateUserRole(u.id, 'admin')} className="px-3 py-1 bg-blue-600 text-white rounded">Make Admin</button>
                              <button onClick={() => updateUserRole(u.id, 'user')} className="px-3 py-1 bg-gray-600 text-white rounded">Make User</button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Settings Tab */}
              {activeTab === 'settings' && (
                <div className="space-y-6">
                  <h2 className="text-2xl font-bold text-gray-900">Settings</h2>
                  <div className="bg-white border p-6 rounded-lg shadow-sm space-y-4">
                    <input
                      type="text"
                      value={settings.businessName}
                      onChange={e => setSettings({...settings, businessName: e.target.value})}
                      className="block w-full border rounded p-2"
                      placeholder="Business Name"
                    />
                    <input
                      type="email"
                      value={settings.email}
                      onChange={e => setSettings({...settings, email: e.target.value})}
                      className="block w-full border rounded p-2"
                      placeholder="Email"
                    />
                    <div className="flex items-center space-x-4">
                      <label>Enable Notifications</label>
                      <input type="checkbox" checked={settings.notifications} onChange={e => setSettings({...settings, notifications: e.target.checked})} />
                      <label>Dark Mode</label>
                      <input type="checkbox" checked={settings.darkMode} onChange={e => setSettings({...settings, darkMode: e.target.checked})} />
                    </div>
                    <button onClick={updateSettings} className="bg-black text-white px-6 py-2 rounded hover:bg-gray-800">Save Settings</button>
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
