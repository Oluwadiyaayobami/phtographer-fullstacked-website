import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  User, ShoppingCart, LogOut,
  Eye, Clock, CheckCircle, XCircle, Download, ChevronRight,
  Lock, ImageIcon, Crown, Folder, ArrowLeft, Grid, List,
  Camera, MessageCircle, Star, Zap, Sparkles, Heart
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import {
  getUserPurchaseRequests,
  signOut,
  getAllImages,
  createPurchaseRequest,
  getDownloadPin,
  getCollections,
  getCollectionImages,
  getRandomImages,
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
  const [allImages, setAllImages] = useState([])
  const [randomImages, setRandomImages] = useState([])
  const [collections, setCollections] = useState([])
  const [selectedCollection, setSelectedCollection] = useState(null)
  const [collectionImages, setCollectionImages] = useState([])
  const [loading, setLoading] = useState(false)
  const [showPinModal, setShowPinModal] = useState(false)
  const [checkingSession, setCheckingSession] = useState(true)
  const [selectedImage, setSelectedImage] = useState(null)
  const [storedDownloadPin, setStoredDownloadPin] = useState('')
  const [downloadType, setDownloadType] = useState('')
  const [viewMode, setViewMode] = useState('gallery')
  const [collectionView, setCollectionView] = useState(false)
  
  // Hire Photographer Form State
  const [showHireForm, setShowHireForm] = useState(false)
  const [hireForm, setHireForm] = useState({
    eventType: '',
    eventDate: '',
    budget: '',
    location: '',
    guests: '',
    specialRequests: '',
    contactPreference: 'whatsapp'
  })

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
        const [imagesResult, requestsResult, collectionsResult, pinResult, randomImagesResult] = await Promise.all([
          getAllImages(),
          getUserPurchaseRequests(user.id),
          getCollections(),
          getDownloadPin(),
          getRandomImages()
        ]);

        if (imagesResult.error) throw imagesResult.error;
        if (requestsResult.error) throw requestsResult.error;
        if (collectionsResult.error) throw collectionsResult.error;
        if (randomImagesResult.error) throw randomImagesResult.error;

        setAllImages(imagesResult.data || []);
        setRandomImages(randomImagesResult.data || []);
        setCollections(collectionsResult.data || []);
        setStoredDownloadPin(pinResult.pin || '');

        const mergedRequests = (requestsResult.data || []).map(request => {
          const imageData = imagesResult.data?.find(img => img.id === request.image_id);
          return {
            ...request,
            image: imageData || { 
              title: 'Premium Image', 
              image_url: '', 
              description: 'High quality photograph' 
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

  // Fetch collection images
  const fetchCollectionImages = async (collectionId) => {
    setLoading(true);
    try {
      const { data, error } = await getCollectionImages(collectionId);
      if (error) throw error;
      setCollectionImages(data || []);
      setCollectionView(true);
    } catch (error) {
      console.error('Error fetching collection images:', error);
      toast.error('Failed to load collection images');
    } finally {
      setLoading(false);
    }
  };

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

  // PURCHASE REQUEST
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
      
      const imageData = allImages.find(img => img.id === imageId)
      setPurchaseRequests(prev => [
        { 
          id: Date.now().toString(),
          user_id: user.id,
          image_id: imageId,
          status: 'pending',
          created_at: new Date().toISOString(),
          image: imageData || { 
            title: 'Premium Image', 
            image_url: '', 
            description: 'High quality photograph' 
          }
        },
        ...prev
      ])
    } catch (err) {
      console.error(err)
      toast.error('Failed to send request')
    }
  }

  // DOWNLOAD FUNCTIONS
  const handleDownloadWithWatermark = (image) => {
    setSelectedImage(image);
    setDownloadType('watermark');
    setShowPinModal(true);
  };

  const handleDownloadPremium = (image) => {
    setSelectedImage(image);
    setDownloadType('premium');
    setShowPinModal(true);
  };

  const handleDownloadCollection = (collection) => {
    setSelectedImage(collection);
    setDownloadType('collection');
    setShowPinModal(true);
  };

  const handlePinSubmit = async (pin) => {
    if (!selectedImage) return;
    
    try {
      if (pin === storedDownloadPin) {
        if (downloadType === 'watermark') {
          downloadImageWithWatermark(selectedImage);
          toast.success('Download with watermark started!');
        } else if (downloadType === 'premium') {
          handlePurchaseRequest(selectedImage.id);
          toast.success('Premium download request sent for approval!');
        } else if (downloadType === 'collection') {
          downloadEntireCollection(selectedImage);
          toast.success('Collection download started!');
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

  // HIRE PHOTOGRAPHER FUNCTIONS
  const handleHireFormChange = (field, value) => {
    setHireForm(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const submitHireRequest = () => {
    const { eventType, eventDate, budget, location, guests, specialRequests } = hireForm;
    
    if (!eventType || !eventDate || !budget || !location) {
      toast.error('Please fill in all required fields');
      return;
    }

    // Create WhatsApp message
    const message = `🌟 New Photography Booking Request 🌟
    
📅 Event Type: ${eventType}
📆 Event Date: ${eventDate}
💰 Budget: ₦${budget}
📍 Location: ${location}
👥 Expected Guests: ${guests || 'Not specified'}
💫 Special Requests: ${specialRequests || 'None'}

📞 Contact: ${user?.email}
👤 Client: ${user?.user_metadata?.name || 'Not specified'}

Please respond to this booking request at your earliest convenience.`;

    const encodedMessage = encodeURIComponent(message);
    const whatsappUrl = `https://wa.me/2347060553627?text=${encodedMessage}`;
    
    window.open(whatsappUrl, '_blank');
    toast.success('Opening WhatsApp to send your booking request!');
    setShowHireForm(false);
    
    // Reset form
    setHireForm({
      eventType: '',
      eventDate: '',
      budget: '',
      location: '',
      guests: '',
      specialRequests: '',
      contactPreference: 'whatsapp'
    });
  };

  // DOWNLOAD UTILITIES
  const downloadImageWithWatermark = (image) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = image.image_url;
    
    img.onload = function() {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      canvas.width = img.width;
      canvas.height = img.height;
      ctx.drawImage(img, 0, 0);
      
      ctx.font = 'bold 30px Arial';
      ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('©PLENATHEGRAPHER', canvas.width / 2, canvas.height / 2);
      
      ctx.font = 'bold 20px Arial';
      ctx.fillText('PLENATHEGRAPHER ©', canvas.width - 120, canvas.height - 25);

      const dataURL = canvas.toDataURL('image/jpeg');
      const link = document.createElement('a');
      link.href = dataURL;
      link.download = `plenathegrapher-${getImageTitle(image)}.jpg`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    };
    
    img.onerror = function() {
      const link = document.createElement('a');
      link.href = image.image_url;
      link.download = `plenathegrapher-${getImageTitle(image)}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    };
  };

  const getImageTitle = (image) => {
    if (!image.title) return 'image';
    let title = image.title
      .replace(/\.(jpg|jpeg|png|gif|webp|bmp)$/i, '')
      .replace(/IMG[-_]/g, '')
      .replace(/WA\d+/g, '')
      .replace(/\d+/g, '')
      .replace(/[-_]/g, ' ')
      .trim();
    
    if (!title || title.length < 2) return 'plenathegrapher-image';
    return title.toLowerCase().replace(/\s+/g, '-');
  };

  const getDisplayTitle = (image) => {
    if (image.custom_title) return image.custom_title;
    let title = image.title
      ?.replace(/\.(jpg|jpeg|png|gif|webp|bmp)$/i, '')
      .replace(/IMG[-_]/g, '')
      .replace(/WA\d+/g, '')
      .replace(/\d+/g, '')
      .replace(/[-_]/g, ' ')
      .trim();
    
    if (!title || title.length < 2) return 'Beautiful Photograph';
    return title.split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  };

  const getDisplayDescription = (image) => {
    if (image.description) return image.description;
    return 'Professional photography by PLENATHEGRAPHER';
  };

  const downloadPremiumImage = (image) => {
    const link = document.createElement('a');
    link.href = image.image_url;
    link.download = `plenathegrapher-premium-${getImageTitle(image)}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const downloadEntireCollection = async (collection) => {
    try {
      const { data: collectionImages, error } = await getCollectionImages(collection.id);
      if (error) throw error;

      for (const image of collectionImages) {
        const link = document.createElement('a');
        link.href = image.image_url;
        link.download = `plenathegrapher-${collection.title}-${getImageTitle(image)}`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      
      toast.success(`Downloaded ${collectionImages.length} images from ${collection.title}`);
    } catch (err) {
      console.error('Error downloading collection:', err);
      toast.error('Failed to download collection');
    }
  };

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
    { id: 'purchases', label: 'Purchases', icon: ShoppingCart },
    { id: 'hire', label: 'Hire Photographer', icon: Camera }
  ]

  if (checkingSession) {
    return (
      <div className="min-h-screen flex justify-center items-center bg-gradient-to-br from-purple-50 via-blue-50 to-cyan-50">
        <motion.div
          animate={{ rotate: 360, scale: [1, 1.1, 1] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          className="w-16 h-16 border-4 border-purple-500 border-t-transparent rounded-full"
        />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-cyan-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
          {/* Enhanced Header */}
        <motion.div
        initial={{ opacity: 0, y: -30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, type: "spring" }}
        className="relative bg-gradient-to-r from-purple-600 via-blue-600 to-cyan-600 text-white rounded-3xl shadow-2xl p-6 sm:p-8 mb-8 overflow-hidden"
        >
        <div className="absolute inset-0 bg-black/10"></div>
        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-16 translate-x-16"></div>
        <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/10 rounded-full translate-y-12 -translate-x-12"></div>

        <div className="relative flex flex-col sm:flex-row justify-between items-start sm:items-center">
        <div className="flex items-center mb-4 sm:mb-0">
        <div className="bg-white/20 p-3 sm:p-4 rounded-2xl mr-4 sm:mr-6 backdrop-blur-sm">
          <User className="w-6 h-6 sm:w-8 sm:h-8" />
        </div>
        <div>
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold bg-gradient-to-r from-white to-cyan-100 bg-clip-text text-transparent">
            Welcome back, {user?.user_metadata?.name || user?.email}!
          </h1>
          <p className="mt-1 sm:mt-2 text-purple-100 text-sm sm:text-base md:text-lg">
            Your creative journey continues here
          </p>
        </div>
        </div>
        <motion.button
        whileHover={{ scale: 1.05, backgroundColor: "rgba(255,255,255,0.3)" }}
        whileTap={{ scale: 0.95 }}
        onClick={handleSignOut}
        className="flex items-center space-x-2 bg-white/20 backdrop-blur-sm hover:bg-white/30 transition-all px-4 py-3 sm:px-6 sm:py-4 rounded-2xl font-semibold shadow-lg border border-white/20 text-sm sm:text-base"
        >
        <LogOut className="w-4 h-4 sm:w-5 sm:h-5" />
        <span>Sign Out</span>
        </motion.button>
        </div>
        </motion.div>

        <div className="flex flex-col lg:flex-row gap-8">

          {/* Enhanced Sidebar */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="lg:w-1/4"
          >
            <div className="bg-white/80 backdrop-blur-lg rounded-3xl shadow-xl p-6 sticky top-8 border border-white/20">
              <nav className="flex flex-col gap-3">
                {tabs.map((tab, index) => {
                  const Icon = tab.icon
                  return (
                    <motion.button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      whileHover={{ x: 8, backgroundColor: activeTab === tab.id ? "" : "rgba(99, 102, 241, 0.1)" }}
                      whileTap={{ scale: 0.98 }}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.4, delay: index * 0.1 }}
                      className={`flex items-center justify-between gap-4 px-6 py-5 rounded-2xl transition-all font-semibold group ${
                        activeTab === tab.id
                          ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-lg shadow-purple-500/25'
                          : 'text-gray-700 hover:text-purple-700'
                      }`}
                    >
                      <div className="flex items-center gap-4">
                        <Icon className={`w-6 h-6 transition-transform group-hover:scale-110 ${
                          activeTab === tab.id ? 'text-white' : 'text-gray-500 group-hover:text-purple-600'
                        }`} />
                        <span className="text-lg">{tab.label}</span>
                      </div>
                      <ChevronRight className={`w-5 h-5 transition-transform duration-300 ${
                        activeTab === tab.id ? 'rotate-90 text-white' : 'text-gray-400 group-hover:text-purple-600'
                      }`} />
                    </motion.button>
                  )
                })}
              </nav>

              {/* Quick Stats */}
              <div className="mt-8 p-6 bg-gradient-to-br from-purple-500/10 to-blue-500/10 rounded-2xl border border-purple-200/50">
                <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
                  <Zap className="w-5 h-5 text-purple-600" />
                  Quick Stats
                </h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Images</span>
                    <span className="font-semibold text-purple-700">{randomImages.length}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Collections</span>
                    <span className="font-semibold text-blue-700">{collections.length}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Requests</span>
                    <span className="font-semibold text-cyan-700">{purchaseRequests.length}</span>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Enhanced Content Area */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="lg:w-3/4"
          >
            <div className="bg-white/80 backdrop-blur-lg rounded-3xl shadow-xl p-8 space-y-8 border border-white/20">

              <AnimatePresence mode="wait">
                {/* Enhanced Profile Tab */}
                {activeTab === 'profile' && (
                  <motion.div
                    key="profile"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.4 }}
                    className="space-y-8"
                  >
                    <div className="flex items-center gap-4 mb-8">
                      <div className="p-3 bg-gradient-to-r from-purple-500 to-blue-500 rounded-2xl shadow-lg">
                        <User className="w-8 h-8 text-white" />
                      </div>
                      <div>
                        <h2 className="text-3xl font-bold bg-gradient-to-r from-gray-800 to-purple-600 bg-clip-text text-transparent">
                          Profile Information
                        </h2>
                        <p className="text-gray-600 mt-2">Manage your account details and preferences</p>
                      </div>
                    </div>
                    
                    <div className="grid md:grid-cols-2 gap-6">
                      <EnhancedProfileCard 
                        label="Full Name" 
                        value={user?.user_metadata?.name || 'Not provided'} 
                        icon={User}
                        gradient="from-purple-500 to-pink-500"
                      />
                      <EnhancedProfileCard 
                        label="Email Address" 
                        value={user?.email} 
                        icon={MessageCircle}
                        gradient="from-blue-500 to-cyan-500"
                      />
                      <EnhancedProfileCard 
                        label="Member Since" 
                        value={new Date(user?.created_at).toLocaleDateString()} 
                        icon={Calendar}
                        gradient="from-green-500 to-emerald-500"
                      />
                      <EnhancedProfileCard 
                        label="Account Status" 
                        value="Active" 
                        icon={CheckCircle}
                        gradient="from-emerald-500 to-green-500"
                        status
                      />
                    </div>
                  </motion.div>
                )}

                {/* Enhanced Gallery Tab */}
                {activeTab === 'gallery' && (
                  <GalleryContent 
                    collectionView={collectionView}
                    selectedCollection={selectedCollection}
                    loading={loading}
                    collectionImages={collectionImages}
                    purchaseRequests={purchaseRequests}
                    randomImages={randomImages}
                    viewMode={viewMode}
                    collections={collections}
                    onBackToCollections={() => {
                      setCollectionView(false);
                      setSelectedCollection(null);
                      setCollectionImages([]);
                    }}
                    onViewModeChange={setViewMode}
                    onCollectionSelect={(collection) => {
                      setSelectedCollection(collection);
                      fetchCollectionImages(collection.id);
                    }}
                    onDownloadWithWatermark={handleDownloadWithWatermark}
                    onDownloadPremium={handleDownloadPremium}
                    onDownloadPremiumDirect={downloadPremiumImage}
                    onDownloadCollection={handleDownloadCollection}
                    preventImageActions={preventImageActions}
                    getDisplayTitle={getDisplayTitle}
                    getDisplayDescription={getDisplayDescription}
                  />
                )}

                {/* Enhanced Purchases Tab */}
                {activeTab === 'purchases' && (
                  <PurchasesContent 
                    loading={loading}
                    purchaseRequests={purchaseRequests}
                    allImages={allImages}
                    downloadPremiumImage={downloadPremiumImage}
                    getDisplayTitle={getDisplayTitle}
                    getStatusIcon={getStatusIcon}
                    getStatusColor={getStatusColor}
                  />
                )}

                {/* New Hire Photographer Tab */}
                {activeTab === 'hire' && (
                  <HirePhotographerContent 
                    showHireForm={showHireForm}
                    hireForm={hireForm}
                    onShowForm={() => setShowHireForm(true)}
                    onHideForm={() => setShowHireForm(false)}
                    onFormChange={handleHireFormChange}
                    onSubmitForm={submitHireRequest}
                    user={user}
                  />
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
            description={`Please enter the PIN provided by admin to ${downloadType === 'watermark' ? 'download with watermark' : downloadType === 'premium' ? 'request premium download' : 'download the entire collection'}`}
          />
        )}
      </AnimatePresence>
    </div>
  )
}

// Enhanced Profile Card Component
const EnhancedProfileCard = ({ label, value, icon: Icon, gradient, status = false }) => (
  <motion.div
    whileHover={{ y: -5, scale: 1.02 }}
    className={`p-6 rounded-2xl bg-gradient-to-br ${gradient} text-white shadow-lg hover:shadow-xl transition-all duration-300`}
  >
    <div className="flex items-center justify-between mb-4">
      <Icon className="w-8 h-8 text-white/80" />
      {status && <div className="w-3 h-3 bg-white rounded-full animate-pulse"></div>}
    </div>
    <p className="text-sm font-medium text-white/80 mb-2">{label}</p>
    <p className="text-xl font-bold">{value}</p>
  </motion.div>
)

// Gallery Content Component
const GalleryContent = ({
  collectionView, selectedCollection, loading, collectionImages, purchaseRequests,
  randomImages, viewMode, collections, onBackToCollections, onViewModeChange,
  onCollectionSelect, onDownloadWithWatermark, onDownloadPremium, onDownloadPremiumDirect,
  onDownloadCollection, preventImageActions, getDisplayTitle, getDisplayDescription
}) => (
  <motion.div
    key="gallery"
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: -20 }}
    transition={{ duration: 0.4 }}
  >
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 mb-8">
      <div className="flex items-center gap-4">
        <div className="p-3 bg-gradient-to-r from-purple-500 to-blue-500 rounded-2xl shadow-lg">
          <Eye className="w-8 h-8 text-white" />
        </div>
        <div>
          <h2 className="text-3xl font-bold bg-gradient-to-r from-gray-800 to-purple-600 bg-clip-text text-transparent">
            {collectionView ? selectedCollection?.title : 'Explore Gallery'}
          </h2>
          <p className="text-gray-600 mt-2">
            {collectionView ? 'Browse collection images' : 'Discover amazing photography'}
          </p>
        </div>
      </div>
      
      <div className="flex items-center gap-3">
        {collectionView && (
          <motion.button
            whileHover={{ x: -5 }}
            whileTap={{ scale: 0.95 }}
            onClick={onBackToCollections}
            className="flex items-center gap-3 px-5 py-3 text-gray-600 hover:text-purple-700 transition-colors bg-white/50 rounded-2xl border border-gray-200 hover:border-purple-300"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="font-medium">Back to Collections</span>
          </motion.button>
        )}
        
        {!collectionView && (
          <div className="flex bg-gray-100 rounded-2xl p-2 border border-gray-200">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => onViewModeChange('gallery')}
              className={`flex items-center gap-3 px-5 py-3 rounded-xl transition-all font-medium ${
                viewMode === 'gallery' 
                  ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-lg' 
                  : 'text-gray-600 hover:text-purple-700 hover:bg-white'
              }`}
            >
              <Grid className="w-5 h-5" />
              <span>Individual Images</span>
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => onViewModeChange('collections')}
              className={`flex items-center gap-3 px-5 py-3 rounded-xl transition-all font-medium ${
                viewMode === 'collections' 
                  ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-lg' 
                  : 'text-gray-600 hover:text-purple-700 hover:bg-white'
              }`}
            >
              <Folder className="w-5 h-5" />
              <span>Collections</span>
            </motion.button>
          </div>
        )}
      </div>
    </div>
    
    {loading ? (
      <div className="flex justify-center items-center py-20">
        <motion.div
          animate={{ rotate: 360, scale: [1, 1.2, 1] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          className="w-16 h-16 border-4 border-purple-500 border-t-transparent rounded-full"
        />
      </div>
    ) : collectionView ? (
      <CollectionView 
        collectionImages={collectionImages}
        selectedCollection={selectedCollection}
        purchaseRequests={purchaseRequests}
        onDownloadCollection={onDownloadCollection}
        onDownloadWithWatermark={onDownloadWithWatermark}
        onDownloadPremium={onDownloadPremium}
        onDownloadPremiumDirect={onDownloadPremiumDirect}
        preventImageActions={preventImageActions}
        getDisplayTitle={getDisplayTitle}
        getDisplayDescription={getDisplayDescription}
      />
    ) : viewMode === 'gallery' ? (
      <IndividualImagesView 
        randomImages={randomImages}
        purchaseRequests={purchaseRequests}
        onDownloadWithWatermark={onDownloadWithWatermark}
        onDownloadPremium={onDownloadPremium}
        onDownloadPremiumDirect={onDownloadPremiumDirect}
        preventImageActions={preventImageActions}
        getDisplayTitle={getDisplayTitle}
        getDisplayDescription={getDisplayDescription}
      />
    ) : (
      <CollectionsView 
        collections={collections}
        onCollectionSelect={onCollectionSelect}
      />
    )}
  </motion.div>
)

// Collection View Component
const CollectionView = ({
  collectionImages, selectedCollection, purchaseRequests, onDownloadCollection,
  onDownloadWithWatermark, onDownloadPremium, onDownloadPremiumDirect,
  preventImageActions, getDisplayTitle, getDisplayDescription
}) => (
  <div>
    {collectionImages.length === 0 ? (
      <div className="text-center py-20">
        <div className="inline-block p-6 bg-gradient-to-r from-purple-100 to-blue-100 rounded-3xl mb-6">
          <Folder className="w-16 h-16 text-purple-600" />
        </div>
        <h3 className="text-2xl font-bold text-gray-800 mb-3">Empty Collection</h3>
        <p className="text-gray-600 max-w-md mx-auto">This collection doesn't have any images yet. Check back later for updates!</p>
      </div>
    ) : (
      <>
        <div className="mb-8 p-6 bg-gradient-to-r from-purple-50 to-blue-50 rounded-3xl border border-purple-200 shadow-lg">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
            <div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">Download Entire Collection</h3>
              <p className="text-gray-600">
                Get all {collectionImages.length} premium images from "{selectedCollection?.title}" in one click
              </p>
            </div>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => onDownloadCollection(selectedCollection)}
              className="bg-gradient-to-r from-purple-600 to-blue-600 text-white px-8 py-4 rounded-2xl hover:shadow-xl transition-all font-semibold flex items-center gap-3 whitespace-nowrap shadow-lg"
            >
              <Download className="w-6 h-6" />
              Download Collection ({collectionImages.length} images)
            </motion.button>
          </div>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {collectionImages.map((img, index) => {
            const approvedRequest = purchaseRequests.find(
              req => req.image_id === img.id && req.status === 'approved'
            );
            
            return (
              <EnhancedImageCard
                key={img.id}
                image={img}
                index={index}
                approvedRequest={approvedRequest}
                onDownloadWithWatermark={onDownloadWithWatermark}
                onDownloadPremium={onDownloadPremium}
                onDownloadPremiumDirect={onDownloadPremiumDirect}
                preventImageActions={preventImageActions}
                getDisplayTitle={getDisplayTitle}
                getDisplayDescription={getDisplayDescription}
              />
            );
          })}
        </div>
      </>
    )}
  </div>
)

// Individual Images View Component
const IndividualImagesView = ({
  randomImages, purchaseRequests, onDownloadWithWatermark, onDownloadPremium,
  onDownloadPremiumDirect, preventImageActions, getDisplayTitle, getDisplayDescription
}) => (
  randomImages.length === 0 ? (
    <div className="text-center py-20">
      <div className="inline-block p-6 bg-gradient-to-r from-purple-100 to-blue-100 rounded-3xl mb-6">
        <Eye className="w-16 h-16 text-purple-600" />
      </div>
      <h3 className="text-2xl font-bold text-gray-800 mb-3">No Images Available</h3>
      <p className="text-gray-600 max-w-md mx-auto">
        There are no individual images available at the moment. 
        Check out our collections for amazing photography content!
      </p>
    </div>
  ) : (
    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {randomImages.map((img, index) => {
        const approvedRequest = purchaseRequests.find(
          req => req.image_id === img.id && req.status === 'approved'
        );
        
        return (
          <EnhancedImageCard
            key={img.id}
            image={img}
            index={index}
            approvedRequest={approvedRequest}
            onDownloadWithWatermark={onDownloadWithWatermark}
            onDownloadPremium={onDownloadPremium}
            onDownloadPremiumDirect={onDownloadPremiumDirect}
            preventImageActions={preventImageActions}
            getDisplayTitle={getDisplayTitle}
            getDisplayDescription={getDisplayDescription}
          />
        );
      })}
    </div>
  )
)

// Collections View Component
const CollectionsView = ({ collections, onCollectionSelect }) => (
  collections.length === 0 ? (
    <div className="text-center py-20">
      <div className="inline-block p-6 bg-gradient-to-r from-purple-100 to-blue-100 rounded-3xl mb-6">
        <Folder className="w-16 h-16 text-purple-600" />
      </div>
      <h3 className="text-2xl font-bold text-gray-800 mb-3">No Collections Yet</h3>
      <p className="text-gray-600">Collections will appear here once they're created by the admin.</p>
    </div>
  ) : (
    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
      {collections.map((collection, index) => (
        <motion.div
          key={collection.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: index * 0.1 }}
          whileHover={{ y: -8, scale: 1.02 }}
          className="bg-gradient-to-br from-white to-gray-50 rounded-3xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 cursor-pointer group border border-gray-200"
          onClick={() => onCollectionSelect(collection)}
        >
          <div className="h-48 bg-gradient-to-br from-purple-500 to-blue-600 relative overflow-hidden">
            <div className="absolute inset-0 bg-black/20 group-hover:bg-black/10 transition-all flex items-center justify-center">
              <Folder className="w-16 h-16 text-white opacity-90 group-hover:scale-110 transition-transform" />
            </div>
            <div className="absolute top-4 right-4">
              <div className="bg-white/20 backdrop-blur-sm rounded-full p-2">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
            </div>
          </div>
          <div className="p-6">
            <h3 className="font-bold text-xl text-gray-900 mb-3 group-hover:text-purple-700 transition-colors line-clamp-1">
              {collection.title}
            </h3>
            {collection.description && (
              <p className="text-gray-600 text-sm mb-4 line-clamp-2 leading-relaxed">
                {collection.description}
              </p>
            )}
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
                Curated Collection
              </span>
              <div className="flex items-center gap-2 text-purple-600 group-hover:text-purple-700 transition-colors">
                <span className="text-sm font-semibold">Explore</span>
                <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  )
)

// Enhanced Image Card Component
const EnhancedImageCard = ({
  image, index, approvedRequest, onDownloadWithWatermark, onDownloadPremium,
  onDownloadPremiumDirect, preventImageActions, getDisplayTitle, getDisplayDescription
}) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.4, delay: index * 0.1 }}
    whileHover={{ y: -5, scale: 1.02 }}
    className="bg-white rounded-3xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 group border border-gray-200"
  >
    <div className="h-64 overflow-hidden relative">
      <img
        src={image.image_url}
        alt={getDisplayTitle(image)}
        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
        onContextMenu={preventImageActions}
        onDragStart={preventImageActions}
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-6">
        <div className="text-white text-sm font-medium bg-black/30 backdrop-blur-sm px-3 py-2 rounded-full">
          <ImageIcon className="w-4 h-4 inline mr-2" />
          PLENATHEGRAPHER ©
        </div>
      </div>
      <div className="absolute top-4 left-4">
        <div className="bg-white/90 backdrop-blur-sm rounded-full px-3 py-1">
          <Star className="w-4 h-4 text-yellow-500 inline mr-1" />
          <span className="text-xs font-semibold text-gray-800">Premium</span>
        </div>
      </div>
    </div>
    <div className="p-6 space-y-4">
      <div>
        <h3 className="font-bold text-lg text-gray-900 mb-2 line-clamp-1">
          {getDisplayTitle(image)}
        </h3>
        <p className="text-gray-600 text-sm leading-relaxed line-clamp-2">
          {getDisplayDescription(image)}
        </p>
      </div>
      <div className="flex flex-col gap-3">
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => onDownloadWithWatermark(image)}
          className="bg-gradient-to-r from-purple-600 to-blue-600 text-white py-3 rounded-xl hover:shadow-lg transition-all font-semibold flex items-center justify-center gap-3"
        >
          <Download className="w-5 h-5" />
          Download with Watermark
        </motion.button>
        {approvedRequest ? (
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => onDownloadPremiumDirect(image)}
            className="bg-gradient-to-r from-emerald-500 to-green-500 text-white py-3 rounded-xl hover:shadow-lg transition-all font-semibold flex items-center justify-center gap-3"
          >
            <Crown className="w-5 h-5" />
            Download Premium
          </motion.button>
        ) : (
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => onDownloadPremium(image)}
            className="bg-gradient-to-r from-amber-500 to-orange-500 text-white py-3 rounded-xl hover:shadow-lg transition-all font-semibold flex items-center justify-center gap-3"
          >
            <Lock className="w-5 h-5" />
            Request Premium
          </motion.button>
        )}
      </div>
    </div>
  </motion.div>
)

// Purchases Content Component
const PurchasesContent = ({
  loading, purchaseRequests, allImages, downloadPremiumImage,
  getDisplayTitle, getStatusIcon, getStatusColor
}) => (
  <motion.div
    key="purchases"
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: -20 }}
    transition={{ duration: 0.4 }}
  >
    <div className="flex items-center gap-4 mb-8">
      <div className="p-3 bg-gradient-to-r from-purple-500 to-blue-500 rounded-2xl shadow-lg">
        <ShoppingCart className="w-8 h-8 text-white" />
      </div>
      <div>
        <h2 className="text-3xl font-bold bg-gradient-to-r from-gray-800 to-purple-600 bg-clip-text text-transparent">
          Purchase History
        </h2>
        <p className="text-gray-600 mt-2">Track your premium download requests and status</p>
      </div>
    </div>
    
    {loading ? (
      <div className="flex justify-center items-center py-20">
        <motion.div
          animate={{ rotate: 360, scale: [1, 1.2, 1] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          className="w-16 h-16 border-4 border-purple-500 border-t-transparent rounded-full"
        />
      </div>
    ) : purchaseRequests.length === 0 ? (
      <div className="text-center py-20">
        <div className="inline-block p-6 bg-gradient-to-r from-purple-100 to-blue-100 rounded-3xl mb-6">
          <ShoppingCart className="w-16 h-16 text-purple-600" />
        </div>
        <h3 className="text-2xl font-bold text-gray-800 mb-3">No Purchase Requests</h3>
        <p className="text-gray-600 max-w-md mx-auto">
          You haven't made any premium download requests yet. 
          Visit the gallery to request premium access to your favorite images!
        </p>
      </div>
    ) : (
      <div className="space-y-6">
        {purchaseRequests.map((request, index) => (
          <motion.div
            key={request.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: index * 0.1 }}
            className="bg-white rounded-3xl p-6 flex flex-col md:flex-row justify-between items-start md:items-center shadow-lg hover:shadow-xl transition-all gap-6 border border-gray-200"
          >
            <div className="flex-1">
              <p className="font-bold text-xl text-gray-900 mb-2">
                {getDisplayTitle(request.image) || 'Premium Image'}
              </p>
              <p className="text-gray-600">
                Requested on {request.created_at ? new Date(request.created_at).toLocaleDateString('en-US', { 
                  weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' 
                }) : 'Unknown date'}
              </p>
            </div>
            <div className="flex items-center gap-4 flex-wrap">
              <div className="flex items-center gap-3">
                {getStatusIcon(request.status ?? 'pending')}
                <span className={`px-4 py-2 rounded-full text-sm font-semibold ${getStatusColor(request.status ?? 'pending')}`}>
                  {(request.status ?? 'pending').charAt(0).toUpperCase() + (request.status ?? 'pending').slice(1)}
                </span>
              </div>
              {request.status === 'approved' && (
                <div className="flex items-center gap-3">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => {
                      const image = allImages.find(img => img.id === request.image_id);
                      if (image) downloadPremiumImage(image);
                    }}
                    className="bg-gradient-to-r from-emerald-500 to-green-500 text-white px-6 py-3 rounded-xl hover:shadow-lg transition-all font-semibold flex items-center gap-3"
                  >
                    <Crown className="w-5 h-5" />
                    Download Premium
                  </motion.button>
                  <motion.a
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    href="https://wa.me/2347060553627"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="bg-gradient-to-r from-blue-500 to-cyan-500 text-white px-6 py-3 rounded-xl hover:shadow-lg transition-all font-semibold flex items-center gap-3"
                  >
                    <MessageCircle className="w-5 h-5" />
                    Chat Admin
                  </motion.a>
                </div>
              )}
            </div>
          </motion.div>
        ))}
      </div>
    )}
  </motion.div>
)

// Hire Photographer Content Component
const HirePhotographerContent = ({
  showHireForm, hireForm, onShowForm, onHideForm, onFormChange, onSubmitForm, user
}) => (
  <motion.div
    key="hire"
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: -20 }}
    transition={{ duration: 0.4 }}
  >
    <div className="flex items-center gap-4 mb-8">
      <div className="p-3 bg-gradient-to-r from-purple-500 to-blue-500 rounded-2xl shadow-lg">
        <Camera className="w-8 h-8 text-white" />
      </div>
      <div>
        <h2 className="text-3xl font-bold bg-gradient-to-r from-gray-800 to-purple-600 bg-clip-text text-transparent">
          Hire Our Photographer
        </h2>
        <p className="text-gray-600 mt-2">Book professional photography services for your special moments</p>
      </div>
    </div>

    {!showHireForm ? (
      <div className="text-center py-12">
        <div className="max-w-2xl mx-auto">
          <div className="inline-block p-6 bg-gradient-to-r from-purple-100 to-blue-100 rounded-3xl mb-8">
            <Camera className="w-20 h-20 text-purple-600" />
          </div>
          <h3 className="text-4xl font-bold text-gray-900 mb-6">
            Capture Your <span className="bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">Special Moments</span>
          </h3>
          <p className="text-xl text-gray-600 mb-8 leading-relaxed">
            Professional photography services for weddings, events, portraits, and more. 
            Let us help you preserve your precious memories with stunning imagery.
          </p>
          
          <div className="grid md:grid-cols-3 gap-6 mb-12">
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-purple-200">
              <div className="w-12 h-12 bg-purple-100 rounded-2xl flex items-center justify-center mb-4">
                <Star className="w-6 h-6 text-purple-600" />
              </div>
              <h4 className="font-bold text-gray-900 mb-2">Premium Quality</h4>
              <p className="text-gray-600 text-sm">High-resolution professional photography</p>
            </div>
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-blue-200">
              <div className="w-12 h-12 bg-blue-100 rounded-2xl flex items-center justify-center mb-4">
                <Zap className="w-6 h-6 text-blue-600" />
              </div>
              <h4 className="font-bold text-gray-900 mb-2">Quick Response</h4>
              <p className="text-gray-600 text-sm">Get a response within hours</p>
            </div>
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-cyan-200">
              <div className="w-12 h-12 bg-cyan-100 rounded-2xl flex items-center justify-center mb-4">
                <Heart className="w-6 h-6 text-cyan-600" />
              </div>
              <h4 className="font-bold text-gray-900 mb-2">Custom Packages</h4>
              <p className="text-gray-600 text-sm">Tailored to your needs and budget</p>
            </div>
          </div>

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={onShowForm}
            className="bg-gradient-to-r from-purple-600 to-blue-600 text-white px-12 py-4 rounded-2xl hover:shadow-2xl transition-all font-bold text-lg shadow-lg"
          >
            Start Booking Process
          </motion.button>
        </div>
      </div>
    ) : (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-2xl mx-auto"
      >
        <div className="bg-white/90 backdrop-blur-lg rounded-3xl p-8 shadow-xl border border-purple-200">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-2xl font-bold text-gray-900">Booking Details</h3>
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={onHideForm}
              className="text-gray-500 hover:text-gray-700 transition-colors"
            >
              <ArrowLeft className="w-6 h-6" />
            </motion.button>
          </div>

          <div className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Event Type *
                </label>
                <select
                  value={hireForm.eventType}
                  onChange={(e) => onFormChange('eventType', e.target.value)}
                  className="w-full px-4 py-3 rounded-2xl border border-gray-300 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition-all"
                >
                  <option value="">Select event type</option>
                  <option value="wedding">Wedding</option>
                  <option value="engagement">Engagement</option>
                  <option value="portrait">Portrait Session</option>
                  <option value="corporate">Corporate Event</option>
                  <option value="birthday">Birthday Party</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Event Date *
                </label>
                <input
                  type="date"
                  value={hireForm.eventDate}
                  onChange={(e) => onFormChange('eventDate', e.target.value)}
                  className="w-full px-4 py-3 rounded-2xl border border-gray-300 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition-all"
                />
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Budget (₦) *
                </label>
                <input
                  type="number"
                  placeholder="e.g., 50000"
                  value={hireForm.budget}
                  onChange={(e) => onFormChange('budget', e.target.value)}
                  className="w-full px-4 py-3 rounded-2xl border border-gray-300 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition-all"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Location *
                </label>
                <input
                  type="text"
                  placeholder="City or venue"
                  value={hireForm.location}
                  onChange={(e) => onFormChange('location', e.target.value)}
                  className="w-full px-4 py-3 rounded-2xl border border-gray-300 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Number of Guests
              </label>
              <input
                type="number"
                placeholder="Approximate number of guests"
                value={hireForm.guests}
                onChange={(e) => onFormChange('guests', e.target.value)}
                className="w-full px-4 py-3 rounded-2xl border border-gray-300 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition-all"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Special Requests
              </label>
              <textarea
                placeholder="Any specific requirements or special requests..."
                value={hireForm.specialRequests}
                onChange={(e) => onFormChange('specialRequests', e.target.value)}
                rows="4"
                className="w-full px-4 py-3 rounded-2xl border border-gray-300 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition-all resize-none"
              />
            </div>

            <div className="bg-purple-50 rounded-2xl p-6 border border-purple-200">
              <h4 className="font-semibold text-purple-900 mb-2">Contact Information</h4>
              <p className="text-purple-700 text-sm">
                We'll contact you at: <strong>{user?.email}</strong>
              </p>
              {user?.user_metadata?.name && (
                <p className="text-purple-700 text-sm mt-1">
                  Name: <strong>{user.user_metadata.name}</strong>
                </p>
              )}
            </div>

            <div className="flex gap-4 pt-4">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={onHideForm}
                className="flex-1 px-6 py-4 rounded-2xl border border-gray-300 text-gray-700 hover:bg-gray-50 transition-all font-semibold"
              >
                Cancel
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={onSubmitForm}
                className="flex-1 bg-gradient-to-r from-purple-600 to-blue-600 text-white px-6 py-4 rounded-2xl hover:shadow-xl transition-all font-semibold shadow-lg"
              >
                Send via WhatsApp
              </motion.button>
            </div>
          </div>
        </div>
      </motion.div>
    )}
  </motion.div>
)

// Calendar icon component
const Calendar = (props) => (
  <svg
    {...props}
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
    />
  </svg>
)

export default UserDashboard