import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  User, ShoppingCart, LogOut,
  Eye, Clock, CheckCircle, XCircle, Download, ChevronRight,
  Lock, ImageIcon, Crown
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import {
  getUserPurchaseRequests,
  signOut,
  getAllImages,
  createPurchaseRequest,
  getDownloadPin,
  supabase
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
  const [selectedImage, setSelectedImage] = useState(null)
  const [storedDownloadPin, setStoredDownloadPin] = useState('')
  const [downloadType, setDownloadType] = useState('') // 'watermark' or 'premium'

  // SESSION & ROLE CHECK
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

  // FETCH ALL DATA
  useEffect(() => {
    const fetchAllData = async () => {
      if (!user?.id) return
      
      setLoading(true)
      try {
        // Fetch images, requests, and download PIN in parallel
        const [imagesResult, requestsResult, pinResult] = await Promise.all([
          getAllImages(),
          getUserPurchaseRequests(user.id),
          getDownloadPin()
        ]);

        if (imagesResult.error) throw imagesResult.error;
        if (requestsResult.error) throw requestsResult.error;

        setGalleryImages(imagesResult.data || []);
        setStoredDownloadPin(pinResult.pin || '');

        // Merge purchase requests with image data
        const mergedRequests = (requestsResult.data || []).map(request => {
          const imageData = imagesResult.data?.find(img => img.id === request.image_id);
          
          return {
            ...request,
            image: imageData || { 
              title: 'Unknown Image', 
              image_url: '', 
              description: 'Image data not available' 
            }
          };
        });

        setPurchaseRequests(mergedRequests);

      } catch (err) {
        console.error('Error fetching data:', err);
        toast.error('Failed to load data');
      } finally {
        setLoading(false);
      }
    };

    fetchAllData();
  }, [user?.id]);

  // SIGN OUT
  const handleSignOut = async () => {
    try {
      const { error } = await signOut()
      if (error) throw error
      toast.success('Signed out successfully')
      navigate('/')
    } catch (err) {
      console.error(err)
      toast.error('Failed to sign out')
    }
  }

  // PURCHASE REQUEST FOR PREMIUM DOWNLOAD (NO WATERMARK)
  const handlePurchaseRequest = async (imageId) => {
    if (!user) {
      toast.error('Please sign in first')
      navigate('/auth')
      return
    }
    try {
      const { error } = await createPurchaseRequest(user.id, imageId)
      if (error) throw error
      toast.success('Premium download request sent! Admin will review your request.')
      
      // Find the image data from galleryImages
      const imageData = galleryImages.find(img => img.id === imageId)
      
      // Immediately update UI with merged data
      setPurchaseRequests(prev => [
        { 
          id: Date.now().toString(),
          user_id: user.id,
          image_id: imageId,
          status: 'pending',
          created_at: new Date().toISOString(),
          image: imageData || { 
            title: 'New Request', 
            image_url: '', 
            description: 'Pending image data' 
          }
        },
        ...prev
      ])
    } catch (err) {
      console.error(err)
      toast.error('Failed to send request')
    }
  }

  // DOWNLOAD WITH WATERMARK (PIN REQUIRED)
  const handleDownloadWithWatermark = (image) => {
    setSelectedImage(image);
    setDownloadType('watermark');
    setShowPinModal(true);
  };

  // DOWNLOAD WITHOUT WATERMARK (PREMIUM - REQUIRES APPROVAL)
  const handleDownloadPremium = (image) => {
    setSelectedImage(image);
    setDownloadType('premium');
    setShowPinModal(true);
  };

  const handlePinSubmit = async (pin) => {
    if (!selectedImage) return;
    
    try {
      // Verify the PIN against the stored download PIN
      if (pin === storedDownloadPin) {
        if (downloadType === 'watermark') {
          // Download with watermark
          downloadImageWithWatermark(selectedImage);
          toast.success('Download with watermark started!');
        } else if (downloadType === 'premium') {
          // Request premium download (no watermark)
          handlePurchaseRequest(selectedImage.id);
          toast.success('Premium download request sent for approval!');
        }
      } else {
        toast.error('Invalid PIN. Please try again.');
      }
    } catch (err) {
      console.error('Download error:', err);
      toast.error('Failed to process your request');
    } finally {
      setShowPinModal(false);
      setSelectedImage(null);
      setDownloadType('');
    }
  };

  // Add watermark to image (client-side canvas manipulation)
  const downloadImageWithWatermark = (image) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = image.image_url;
    
    img.onload = function() {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      // Set canvas dimensions
      canvas.width = img.width;
      canvas.height = img.height;
      
      // Draw the image
      ctx.drawImage(img, 0, 0);
      
      // Add watermark text
      ctx.font = 'bold 30px Arial';
      ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      
      // Add watermark in the center
      ctx.fillText('©PLENATHEGRAPHER protected by buildify', canvas.width / 2, canvas.height / 2);
      
      // Add smaller watermark in corner
      ctx.font = 'bold 24px Arial';
      ctx.fillText('© PLENATHEGRAPHER', canvas.width - 150, canvas.height - 30);

      
      // Convert to data URL and download
      const dataURL = canvas.toDataURL('image/jpeg');
      const link = document.createElement('a');
      link.href = dataURL;
      link.download = `plenathegrapher-watermark-${image.title}.jpg`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    };
    
    img.onerror = function() {
      // Fallback to direct download if canvas manipulation fails
      const link = document.createElement('a');
      link.href = image.image_url;
      link.download = `plenathegrapher-${image.title}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    };
  };

  // Download premium image (no watermark) - only for approved requests
  const downloadPremiumImage = (image) => {
    const link = document.createElement('a');
    link.href = image.image_url;
    link.download = `plenathegrapher-premium-${image.title}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Prevent right-click and image dragging
  const preventImageActions = (e) => {
    e.preventDefault();
    return false;
  };

  // STATUS ICONS & COLORS
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

  const tabs = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'gallery', label: 'Gallery', icon: Eye },
    { id: 'purchases', label: 'Purchases', icon: ShoppingCart }
  ]

  if (checkingSession) {
    return (
      <div className="min-h-screen flex justify-center items-center bg-gradient-to-br from-gray-50 to-gray-100">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          className="w-12 h-12 border-4 border-gray-300 border-t-blue-600 rounded-full"
        />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="bg-gradient-to-r from-indigo-600 to-purple-700 text-white rounded-2xl shadow-lg p-6 mb-8 flex flex-col sm:flex-row justify-between items-start sm:items-center"
        >
          <div className="flex items-center">
            <div className="bg-white/20 p-3 rounded-xl mr-4">
              <User className="w-8 h-8" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">
                Welcome back, {user?.user_metadata?.name || user?.email}!
              </h1>
              <p className="mt-1 text-indigo-100">Manage your account and explore our collection</p>
            </div>
          </div>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleSignOut}
            className="mt-4 sm:mt-0 flex items-center space-x-2 bg-white/20 hover:bg-white/30 transition px-5 py-3 rounded-xl font-medium shadow-md"
          >
            <LogOut className="w-5 h-5" />
            <span>Sign Out</span>
          </motion.button>
        </motion.div>

        <div className="flex flex-col lg:flex-row gap-6">

          {/* Sidebar / Tabs */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="lg:w-1/4"
          >
            <div className="bg-white rounded-2xl shadow-lg p-4 sticky top-6">
              <nav className="flex flex-col gap-2">
                {tabs.map(tab => {
                  const Icon = tab.icon
                  return (
                    <motion.button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      whileHover={{ x: 5 }}
                      whileTap={{ scale: 0.97 }}
                      className={`flex items-center justify-between gap-3 px-5 py-4 rounded-xl transition-all font-medium ${
                        activeTab === tab.id
                          ? 'bg-indigo-50 text-indigo-700 shadow-sm'
                          : 'text-gray-600 hover:bg-gray-50'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <Icon className="w-5 h-5" />
                        <span>{tab.label}</span>
                      </div>
                      <ChevronRight className={`w-4 h-4 transition-transform ${activeTab === tab.id ? 'rotate-90' : ''}`} />
                    </motion.button>
                  )
                })}
              </nav>
            </div>
          </motion.div>

          {/* Content */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="lg:w-3/4"
          >
            <div className="bg-white rounded-2xl shadow-lg p-6 space-y-6">

              <AnimatePresence mode="wait">
                {/* Profile */}
                {activeTab === 'profile' && (
                  <motion.div
                    key="profile"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    transition={{ duration: 0.3 }}
                    className="space-y-6"
                  >
                    <div className="flex items-center gap-3 mb-6">
                      <div className="p-2 bg-indigo-100 rounded-lg">
                        <User className="w-6 h-6 text-indigo-600" />
                      </div>
                      <h2 className="text-2xl font-bold text-gray-900">Profile Information</h2>
                    </div>
                    
                    <div className="grid md:grid-cols-2 gap-5">
                      <ProfileCard label="Full Name" value={user?.name || 'Not provided'} />
                      <ProfileCard label="Email Address" value={user?.email} />
                      <ProfileCard label="Member Since" value={new Date(user?.created_at).toLocaleDateString()} />
                      <ProfileCard 
                        label="Account Status" 
                        value="Active" 
                        bg="bg-green-50" 
                        textColor="text-green-700"
                        valueBg="bg-green-100"
                      />
                    </div>
                  </motion.div>
                )}

                {/* Gallery */}
                {activeTab === 'gallery' && (
                  <motion.div
                    key="gallery"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    transition={{ duration: 0.3 }}
                  >
                    <div className="flex items-center gap-3 mb-6">
                      <div className="p-2 bg-indigo-100 rounded-lg">
                        <Eye className="w-6 h-6 text-indigo-600" />
                      </div>
                      <h2 className="text-2xl font-bold text-gray-900">Explore Gallery</h2>
                    </div>
                    
                    {loading ? (
                      <div className="flex justify-center py-12">
                        <motion.div
                          animate={{ rotate: 360 }}
                          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                          className="w-12 h-12 border-4 border-gray-300 border-t-indigo-600 rounded-full"
                        />
                      </div>
                    ) : galleryImages.length === 0 ? (
                      <div className="text-center py-12">
                        <div className="inline-block p-4 bg-gray-100 rounded-full mb-4">
                          <Eye className="w-8 h-8 text-gray-400" />
                        </div>
                        <p className="text-gray-500">No images available yet</p>
                      </div>
                    ) : (
                      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
                        {galleryImages.map(img => {
                          const approvedRequest = purchaseRequests.find(
                            req => req.image_id === img.id && req.status === 'approved'
                          );
                          
                          return (
                            <motion.div
                              key={img.id}
                              whileHover={{ y: -5 }}
                              className="border rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all duration-300 bg-white"
                            >
                              <div className="h-52 overflow-hidden relative">
                                <img
                                  src={img.image_url}
                                  alt={img.title}
                                  className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
                                  onContextMenu={preventImageActions}
                                  onDragStart={preventImageActions}
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 hover:opacity-100 transition-opacity flex items-end p-4">
                                  <div className="text-white text-sm">
                                    <ImageIcon className="w-4 h-4 inline mr-1" />
                                    PLENATHEGRAPHER ©
                                  </div>
                                </div>
                              </div>
                              <div className="p-4 space-y-3">
                                <h3 className="font-semibold text-gray-900 truncate">{img.title}</h3>
                                <p className="text-sm text-gray-600 line-clamp-2">{img.description || 'No description'}</p>
                                <div className="flex flex-col gap-2 mt-3">
                                  <button
                                    onClick={() => handleDownloadWithWatermark(img)}
                                    className="bg-indigo-600 text-white py-2.5 rounded-lg hover:bg-indigo-700 transition-colors font-medium flex items-center justify-center gap-2"
                                  >
                                    <Download className="w-4 h-4" />
                                    Download with Watermark
                                  </button>
                                  {approvedRequest ? (
                                    <button
                                      onClick={() => downloadPremiumImage(img)}
                                      className="bg-green-600 text-white py-2.5 rounded-lg hover:bg-green-700 transition-colors font-medium flex items-center justify-center gap-2"
                                    >
                                      <Crown className="w-4 h-4" />
                                      Download Premium
                                    </button>
                                  ) : (
                                    <button
                                      onClick={() => handleDownloadPremium(img)}
                                      className="bg-amber-600 text-white py-2.5 rounded-lg hover:bg-amber-700 transition-colors font-medium flex items-center justify-center gap-2"
                                    >
                                      <Lock className="w-4 h-4" />
                                      Request Premium
                                    </button>
                                  )}
                                </div>
                              </div>
                            </motion.div>
                          );
                        })}
                      </div>
                    )}
                  </motion.div>
                )}

                {/* Purchases */}
                {activeTab === 'purchases' && (
                  <motion.div
                    key="purchases"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    transition={{ duration: 0.3 }}
                  >
                    <div className="flex items-center gap-3 mb-6">
                      <div className="p-2 bg-indigo-100 rounded-lg">
                        <ShoppingCart className="w-6 h-6 text-indigo-600" />
                      </div>
                      <h2 className="text-2xl font-bold text-gray-900">Purchase History</h2>
                    </div>
                    
                    {loading ? (
                      <div className="flex justify-center py-8">
                        <motion.div
                          animate={{ rotate: 360 }}
                          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                          className="w-10 h-10 border-4 border-gray-300 border-t-indigo-600 rounded-full"
                        />
                      </div>
                    ) : purchaseRequests.length === 0 ? (
                      <div className="text-center py-12">
                        <div className="inline-block p-4 bg-gray-100 rounded-full mb-4">
                          <ShoppingCart className="w-8 h-8 text-gray-400" />
                        </div>
                        <p className="text-gray-500">No purchase requests yet</p>
                        <p className="text-sm text-gray-400 mt-2">Visit the Gallery to make your first request</p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {purchaseRequests.map(request => (
                          <motion.div
                            key={request.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="border rounded-2xl p-5 flex flex-col md:flex-row justify-between items-start md:items-center shadow-sm gap-4 hover:shadow-md transition-all bg-white"
                          >
                            <div className="flex-1">
                              <p className="font-semibold text-gray-900">
                                {request.image?.title || 'Unknown Image'}
                              </p>
                              <p className="text-sm text-gray-600 mt-1">
                                Requested on {request.created_at ? new Date(request.created_at).toLocaleDateString() : 'Unknown date'}
                              </p>
                            </div>
                            <div className="flex items-center gap-3 flex-wrap">
                              {getStatusIcon(request.status ?? 'pending')}
                              <span className={`px-3 py-1.5 rounded-full text-xs font-medium ${getStatusColor(request.status ?? 'pending')}`}>
                                {(request.status ?? 'pending').charAt(0).toUpperCase() + (request.status ?? 'pending').slice(1)}
                              </span>
                              {request.status === 'approved' && (
                                <>
                                  <button
                                    onClick={() => {
                                      const image = galleryImages.find(img => img.id === request.image_id);
                                      if (image) downloadPremiumImage(image);
                                    }}
                                    className="flex items-center gap-2 bg-green-600 text-white px-4 py-1.5 rounded-lg hover:bg-green-700 transition text-sm font-medium"
                                  >
                                    <Crown className="w-4 h-4" />
                                    Download Premium
                                  </button>
                                  <a
                                    href="https://wa.me/2347060553627"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center gap-2 bg-blue-600 text-white px-4 py-1.5 rounded-lg hover:bg-blue-700 transition text-sm font-medium"
                                  >
                                    Chat Admin
                                  </a>
                                </>
                              )}
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        </div>
      </div>

      {/* PIN Modal */}
      <AnimatePresence>
        {showPinModal && selectedImage && (
          <PinModal
            onClose={() => {
              setShowPinModal(false);
              setSelectedImage(null);
              setDownloadType('');
            }}
            onSubmit={handlePinSubmit}
            title="Enter Download PIN"
            description={`Please enter the PIN provided by admin to ${downloadType === 'watermark' ? 'download with watermark' : 'request premium download'}`}
          />
        )}
      </AnimatePresence>
    </div>
  )
}

// Enhanced Profile card component
const ProfileCard = ({ label, value, bg = 'bg-gray-50', textColor = 'text-gray-800', valueBg = 'bg-white' }) => (
  <div className={`p-5 rounded-2xl ${bg} ${textColor} shadow-sm border border-gray-100`}>
    <p className="text-sm font-medium text-gray-500 mb-2">{label}</p>
    <p className={`font-semibold py-2 px-3 ${valueBg} rounded-lg inline-block`}>{value}</p>
  </div>
)

export default UserDashboard