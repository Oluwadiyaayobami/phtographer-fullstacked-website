import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  User, ShoppingCart, LogOut,
  Eye, Clock, CheckCircle, XCircle, Download, ChevronRight,
  Lock, ImageIcon, Crown, Folder, ArrowLeft, Grid, List,
  Camera, MessageCircle, Star, Zap, Sparkles, Heart, Menu, X,
  Mail, MessageSquare
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
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  
  // Admin contact information
  const [adminContact, setAdminContact] = useState({
    whatsapp: '+2347060553627',
    email: 'admin@plenathegrapher.com'
  })
  
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
      setMobileMenuOpen(false);
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

  // DOWNLOAD FUNCTIONS - UPDATED: No PIN for watermark downloads
  const handleDownloadWithWatermark = (image) => {
    setSelectedImage(image);
    downloadImageWithWatermark(image);
    toast.success('Download with watermark started!');
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
        if (downloadType === 'premium') {
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

  // MESSAGE ADMIN FUNCTIONALITY
  const handleMessageAdmin = (subject = '', message = '') => {
    const defaultMessage = `Hello PLENATHEGRAPHER Admin,\n\nI need assistance with my purchase/download.\n\nUser: ${user?.email}\nName: ${user?.user_metadata?.name || 'Not specified'}\n\nThank you!`;
    
    const finalMessage = message || defaultMessage
    const encodedMessage = encodeURIComponent(finalMessage)
    const whatsappUrl = `https://wa.me/${adminContact.whatsapp}?text=${encodedMessage}`
    
    window.open(whatsappUrl, '_blank')
    toast.success('Opening WhatsApp to message admin!')
  }

  // ENHANCED DOWNLOAD FOR APPROVED REQUESTS
  const handleDownloadApproved = (image) => {
    if (!image) {
      toast.error('Image not found')
      return
    }
    
    try {
      const link = document.createElement('a')
      link.href = image.image_url
      link.download = `plenathegrapher-premium-${getImageTitle(image)}`
      link.target = '_blank'
      
      link.addEventListener('click', () => {
        setTimeout(() => {
          toast.success('Premium download started!')
        }, 1000)
      })
      
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      
    } catch (error) {
      console.error('Download error:', error)
      toast.error('Failed to download. Please message admin for assistance.')
      
      setTimeout(() => {
        if (window.confirm('Download failed. Would you like to message admin for assistance?')) {
          handleMessageAdmin(
            'Download Assistance Needed',
            `Hello PLENATHEGRAPHER Admin,\n\nI'm having trouble downloading my approved premium image:\n\n- Image: ${getDisplayTitle(image)}\n- User: ${user?.email}\n- Name: ${user?.user_metadata?.name || 'Not specified'}\n\nCould you please assist? Thank you!`
          )
        }
      }, 2000)
    }
  }

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

  // UPDATED: Enhanced watermark function with more visible and moderate watermark
  const downloadImageWithWatermark = (image) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = image.image_url;
    
    img.onload = function() {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      canvas.width = img.width;
      canvas.height = img.height;
      
      // Draw the original image
      ctx.drawImage(img, 0, 0);
      
      // Enhanced watermark styling - more visible but moderate
      const fontSize = Math.max(canvas.width * 0.03, 24); // Responsive font size
      const lineHeight = fontSize * 1.2;
      
      // Set font properties
      ctx.font = `bold ${fontSize}px Arial, sans-serif`;
      ctx.fillStyle = 'rgba(255, 255, 255, 0.7)'; // More visible white
      ctx.strokeStyle = 'rgba(0, 0, 0, 0.5)'; // Dark outline for contrast
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.lineWidth = 2;
      
      // Main watermark text in center
      const mainText = '© PLENATHEGRAPHER';
      const centerX = canvas.width / 2;
      const centerY = canvas.height / 2;
      
      // Draw text with outline for better visibility
      ctx.strokeText(mainText, centerX, centerY);
      ctx.fillText(mainText, centerX, centerY);
      
      // Secondary watermark in corner - smaller but still visible
      const cornerFontSize = Math.max(canvas.width * 0.015, 14);
      ctx.font = `bold ${cornerFontSize}px Arial, sans-serif`;
      ctx.lineWidth = 1;
      
      const cornerText = 'PLENATHEGRAPHER.COM';
      const cornerX = canvas.width - 150;
      const cornerY = canvas.height - 30;
      
      ctx.strokeText(cornerText, cornerX, cornerY);
      ctx.fillText(cornerText, cornerX, cornerY);
      
      // Additional diagonal watermarks for extra protection
      ctx.save();
      ctx.translate(canvas.width / 2, canvas.height / 2);
      ctx.rotate(-Math.PI / 6); // 30 degree angle
      
      const diagonalText = 'PLENATHEGRAPHER';
      const diagonalFontSize = Math.max(canvas.width * 0.02, 18);
      ctx.font = `bold ${diagonalFontSize}px Arial, sans-serif`;
      ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
      ctx.strokeStyle = 'rgba(0, 0, 0, 0.3)';
      ctx.lineWidth = 1;
      
      // Create repeating diagonal pattern
      for (let i = -2; i <= 2; i++) {
        for (let j = -2; j <= 2; j++) {
          const x = i * (canvas.width / 2);
          const y = j * (canvas.height / 3);
          ctx.strokeText(diagonalText, x, y);
          ctx.fillText(diagonalText, x, y);
        }
      }
      
      ctx.restore();
      
      // Convert to data URL and download
      const dataURL = canvas.toDataURL('image/jpeg', 0.9);
      const link = document.createElement('a');
      link.href = dataURL;
      link.download = `plenathegrapher-watermark-${getImageTitle(image)}.jpg`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    };
    
    img.onerror = function() {
      // Fallback: download original image if canvas processing fails
      const link = document.createElement('a');
      link.href = image.image_url;
      link.download = `plenathegrapher-${getImageTitle(image)}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.info('Downloaded original image (watermark failed)');
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
    return 'Professional photography by PLENATHEGRAPHER and BUILDYIFY';
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
      case 'pending': return <Clock className="w-4 h-4 text-yellow-500" />
      case 'approved': return <CheckCircle className="w-4 h-4 text-green-500" />
      case 'denied': return <XCircle className="w-4 h-4 text-red-500" />
      default: return <Clock className="w-4 h-4 text-gray-500" />
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
          className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full"
        />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-cyan-50 py-4 sm:py-8">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        
      {/* Enhanced Header - Mobile Optimized */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="relative bg-gradient-to-r from-purple-600 via-blue-600 to-cyan-600 text-white rounded-2xl sm:rounded-3xl shadow-xl p-4 sm:p-6 mt-8 mb-6 sm:mt-12 sm:mb-8 overflow-hidden"
      >
        <div className="absolute inset-0 bg-black/10"></div>
        <div className="absolute top-0 right-0 w-20 h-20 sm:w-32 sm:h-32 bg-white/10 rounded-full -translate-y-8 translate-x-8 sm:-translate-y-16 sm:translate-x-16"></div>
        <div className="absolute bottom-0 left-0 w-16 h-16 sm:w-24 sm:h-24 bg-white/10 rounded-full translate-y-8 -translate-x-8 sm:translate-y-12 sm:-translate-x-12"></div>

        <div className="relative flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center">
            <div className="bg-white/20 p-2 sm:p-3 rounded-xl sm:rounded-2xl mr-3 sm:mr-4 backdrop-blur-sm">
              <User className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <div>
              <h1 className="text-lg sm:text-xl md:text-2xl font-bold bg-gradient-to-r from-white to-cyan-100 bg-clip-text text-transparent">
                Welcome, {user?.user_metadata?.name || user?.email}!
              </h1>
              <p className="mt-1 text-purple-100 text-xs sm:text-sm">
                Your creative journey continues
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-3 self-end sm:self-auto">
            {/* Mobile Menu Button */}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="sm:hidden bg-white/20 backdrop-blur-sm p-2 rounded-xl border border-white/20"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </motion.button>
            
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleSignOut}
              className="flex items-center space-x-2 bg-white/20 backdrop-blur-sm hover:bg-white/30 transition-all px-3 py-2 sm:px-4 sm:py-3 rounded-xl sm:rounded-2xl font-semibold shadow-lg border border-white/20 text-xs sm:text-sm"
            >
              <LogOut className="w-3 h-3 sm:w-4 sm:h-4" />
              <span className="hidden xs:inline">Sign Out</span>
            </motion.button>
          </div>
        </div>
      </motion.div>

        <div className="flex flex-col lg:flex-row gap-4 sm:gap-6 lg:gap-8">
          {/* Enhanced Sidebar - Mobile Optimized */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className={`lg:w-1/4 ${mobileMenuOpen ? 'block' : 'hidden'} sm:block`}
          >
            <div className="bg-white/80 backdrop-blur-lg rounded-2xl sm:rounded-3xl shadow-lg p-4 sm:p-6 border border-white/20">
              <nav className="flex flex-col gap-2 sm:gap-3">
                {tabs.map((tab, index) => {
                  const Icon = tab.icon
                  return (
                    <motion.button
                      key={tab.id}
                      onClick={() => {
                        setActiveTab(tab.id)
                        setMobileMenuOpen(false)
                      }}
                      whileHover={{ x: 4, backgroundColor: activeTab === tab.id ? "" : "rgba(99, 102, 241, 0.1)" }}
                      whileTap={{ scale: 0.98 }}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.4, delay: index * 0.1 }}
                      className={`flex items-center justify-between gap-3 px-4 py-3 sm:px-5 sm:py-4 rounded-xl sm:rounded-2xl transition-all font-semibold text-sm sm:text-base group ${
                        activeTab === tab.id
                          ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-lg shadow-purple-500/25'
                          : 'text-gray-700 hover:text-purple-700'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <Icon className={`w-4 h-4 sm:w-5 sm:h-5 transition-transform group-hover:scale-110 ${
                          activeTab === tab.id ? 'text-white' : 'text-gray-500 group-hover:text-purple-600'
                        }`} />
                        <span>{tab.label}</span>
                      </div>
                      <ChevronRight className={`w-3 h-3 sm:w-4 sm:h-4 transition-transform duration-300 ${
                        activeTab === tab.id ? 'rotate-90 text-white' : 'text-gray-400 group-hover:text-purple-600'
                      }`} />
                    </motion.button>
                  )
                })}
              </nav>

              {/* Quick Stats */}
              <div className="mt-6 p-4 bg-gradient-to-br from-purple-500/10 to-blue-500/10 rounded-xl sm:rounded-2xl border border-purple-200/50">
                <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2 text-sm sm:text-base">
                  <Zap className="w-4 h-4 text-purple-600" />
                  Quick Stats
                </h3>
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-xs sm:text-sm text-gray-600">Images</span>
                    <span className="font-semibold text-purple-700 text-sm">{randomImages.length}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs sm:text-sm text-gray-600">Collections</span>
                    <span className="font-semibold text-blue-700 text-sm">{collections.length}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs sm:text-sm text-gray-600">Requests</span>
                    <span className="font-semibold text-cyan-700 text-sm">{purchaseRequests.length}</span>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Enhanced Content Area - Mobile Optimized */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="lg:w-3/4"
          >
            <div className="bg-white/80 backdrop-blur-lg rounded-2xl sm:rounded-3xl shadow-lg p-4 sm:p-6 space-y-6 sm:space-y-8 border border-white/20">

              <AnimatePresence mode="wait">
                {/* Enhanced Profile Tab - Mobile Optimized */}
                {activeTab === 'profile' && (
                  <motion.div
                    key="profile"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.3 }}
                    className="space-y-6"
                  >
                    <div className="flex items-center gap-3 mb-6">
                      <div className="p-2 sm:p-3 bg-gradient-to-r from-purple-500 to-blue-500 rounded-xl sm:rounded-2xl shadow-lg">
                        <User className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                      </div>
                      <div>
                        <h2 className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-gray-800 to-purple-600 bg-clip-text text-transparent">
                          Profile
                        </h2>
                        <p className="text-gray-600 text-xs sm:text-sm">Your account details</p>
                      </div>
                    </div>
                    
                    <div className="grid gap-4 sm:grid-cols-2 sm:gap-5">
                      <EnhancedProfileCard 
                        label="Full Name" 
                        value={user?.user_metadata?.name || 'Not provided'} 
                        icon={User}
                        gradient="from-purple-500 to-pink-500"
                      />
                      <EnhancedProfileCard 
                        label="Email" 
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
                        label="Status" 
                        value="Active" 
                        icon={CheckCircle}
                        gradient="from-emerald-500 to-green-500"
                        status
                      />
                    </div>
                  </motion.div>
                )}

                {/* Enhanced Gallery Tab - Mobile Optimized */}
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
                    onDownloadPremiumDirect={handleDownloadApproved}
                    onDownloadCollection={handleDownloadCollection}
                    preventImageActions={preventImageActions}
                    getDisplayTitle={getDisplayTitle}
                    getDisplayDescription={getDisplayDescription}
                  />
                )}

                {/* Enhanced Purchases Tab - Mobile Optimized */}
                {activeTab === 'purchases' && (
                  <PurchasesContent 
                    loading={loading}
                    purchaseRequests={purchaseRequests}
                    allImages={allImages}
                    downloadPremiumImage={handleDownloadApproved}
                    getDisplayTitle={getDisplayTitle}
                    getStatusIcon={getStatusIcon}
                    getStatusColor={getStatusColor}
                    onMessageAdmin={handleMessageAdmin}
                    adminContact={adminContact}
                    user={user}
                  />
                )}

                {/* Hire Photographer Tab - Mobile Optimized */}
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

      {/* PIN Modal - Only for premium and collection downloads now */}
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
            description={`Please enter the PIN provided by admin to ${downloadType === 'premium' ? 'request premium download' : 'download the entire collection'}`}
          />
        )}
      </AnimatePresence>
    </div>
  )
}

// Enhanced Profile Card Component - Mobile Optimized
const EnhancedProfileCard = ({ label, value, icon: Icon, gradient, status = false }) => (
  <motion.div
    whileHover={{ y: -3, scale: 1.01 }}
    className={`p-4 sm:p-5 rounded-xl sm:rounded-2xl bg-gradient-to-br ${gradient} text-white shadow-md hover:shadow-lg transition-all duration-300`}
  >
    <div className="flex items-center justify-between mb-3">
      <Icon className="w-5 h-5 sm:w-6 sm:h-6 text-white/80" />
      {status && <div className="w-2 h-2 sm:w-3 sm:h-3 bg-white rounded-full animate-pulse"></div>}
    </div>
    <p className="text-xs sm:text-sm font-medium text-white/80 mb-1">{label}</p>
    <p className="text-base sm:text-lg font-bold truncate">{value}</p>
  </motion.div>
)

// Gallery Content Component - Mobile Optimized
const GalleryContent = ({
  collectionView, selectedCollection, loading, collectionImages, purchaseRequests,
  randomImages, viewMode, collections, onBackToCollections, onViewModeChange,
  onCollectionSelect, onDownloadWithWatermark, onDownloadPremium, onDownloadPremiumDirect,
  onDownloadCollection, preventImageActions, getDisplayTitle, getDisplayDescription
}) => (
  <motion.div
    key="gallery"
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: -10 }}
    transition={{ duration: 0.3 }}
  >
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
      <div className="flex items-center gap-3">
        <div className="p-2 sm:p-3 bg-gradient-to-r from-purple-500 to-blue-500 rounded-xl sm:rounded-2xl shadow-lg">
          <Eye className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
        </div>
        <div>
          <h2 className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-gray-800 to-purple-600 bg-clip-text text-transparent">
            {collectionView ? selectedCollection?.title : 'Gallery'}
          </h2>
          <p className="text-gray-600 text-xs sm:text-sm">
            {collectionView ? 'Collection images' : 'Discover photography'}
          </p>
        </div>
      </div>
      
      <div className="flex items-center gap-2 sm:gap-3">
        {collectionView && (
          <motion.button
            whileHover={{ x: -3 }}
            whileTap={{ scale: 0.95 }}
            onClick={onBackToCollections}
            className="flex items-center gap-2 px-3 py-2 text-gray-600 hover:text-purple-700 transition-colors bg-white/50 rounded-xl border border-gray-200 hover:border-purple-300 text-sm"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="font-medium">Back</span>
          </motion.button>
        )}
        
        {!collectionView && (
          <div className="flex bg-gray-100 rounded-xl p-1 border border-gray-200 text-xs sm:text-sm">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => onViewModeChange('gallery')}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-all font-medium ${
                viewMode === 'gallery' 
                  ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-md' 
                  : 'text-gray-600 hover:text-purple-700 hover:bg-white'
              }`}
            >
              <Grid className="w-3 h-3 sm:w-4 sm:h-4" />
              <span>Images</span>
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => onViewModeChange('collections')}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-all font-medium ${
                viewMode === 'collections' 
                  ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-md' 
                  : 'text-gray-600 hover:text-purple-700 hover:bg-white'
              }`}
            >
              <Folder className="w-3 h-3 sm:w-4 sm:h-4" />
              <span>Collections</span>
            </motion.button>
          </div>
        )}
      </div>
    </div>
    
    {loading ? (
      <div className="flex justify-center items-center py-12">
        <motion.div
          animate={{ rotate: 360, scale: [1, 1.1, 1] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full"
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

// Collection View Component - Mobile Optimized
const CollectionView = ({
  collectionImages, selectedCollection, purchaseRequests, onDownloadCollection,
  onDownloadWithWatermark, onDownloadPremium, onDownloadPremiumDirect,
  preventImageActions, getDisplayTitle, getDisplayDescription
}) => (
  <div>
    {collectionImages.length === 0 ? (
      <div className="text-center py-12">
        <div className="inline-block p-4 bg-gradient-to-r from-purple-100 to-blue-100 rounded-2xl mb-4">
          <Folder className="w-10 h-10 sm:w-12 sm:h-12 text-purple-600" />
        </div>
        <h3 className="text-lg sm:text-xl font-bold text-gray-800 mb-2">Empty Collection</h3>
        <p className="text-gray-600 text-sm max-w-md mx-auto">No images in this collection yet.</p>
      </div>
    ) : (
      <>
        <div className="mb-6 p-4 bg-gradient-to-r from-purple-50 to-blue-50 rounded-2xl border border-purple-200 shadow-md">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-lg font-bold text-gray-900 mb-1">Download Collection</h3>
              <p className="text-gray-600 text-sm">
                All {collectionImages.length} images from "{selectedCollection?.title}"
              </p>
            </div>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => onDownloadCollection(selectedCollection)}
              className="bg-gradient-to-r from-purple-600 to-blue-600 text-white px-4 py-3 rounded-xl hover:shadow-lg transition-all font-semibold flex items-center gap-2 text-sm sm:text-base shadow-md"
            >
              <Download className="w-4 h-4" />
              Download ({collectionImages.length})
            </motion.button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
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

// Individual Images View Component - Mobile Optimized
const IndividualImagesView = ({
  randomImages, purchaseRequests, onDownloadWithWatermark, onDownloadPremium,
  onDownloadPremiumDirect, preventImageActions, getDisplayTitle, getDisplayDescription
}) => (
  randomImages.length === 0 ? (
    <div className="text-center py-12">
      <div className="inline-block p-4 bg-gradient-to-r from-purple-100 to-blue-100 rounded-2xl mb-4">
        <Eye className="w-10 h-10 sm:w-12 sm:h-12 text-purple-600" />
      </div>
      <h3 className="text-lg sm:text-xl font-bold text-gray-800 mb-2">No Images</h3>
      <p className="text-gray-600 text-sm max-w-md mx-auto">
        Check collections for photography content!
      </p>
    </div>
  ) : (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
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

// Collections View Component - Mobile Optimized
const CollectionsView = ({ collections, onCollectionSelect }) => (
  collections.length === 0 ? (
    <div className="text-center py-12">
      <div className="inline-block p-4 bg-gradient-to-r from-purple-100 to-blue-100 rounded-2xl mb-4">
        <Folder className="w-10 h-10 sm:w-12 sm:h-12 text-purple-600" />
      </div>
      <h3 className="text-lg sm:text-xl font-bold text-gray-800 mb-2">No Collections</h3>
      <p className="text-gray-600 text-sm">Collections will appear here.</p>
    </div>
  ) : (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
      {collections.map((collection, index) => (
        <motion.div
          key={collection.id}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: index * 0.1 }}
          whileHover={{ y: -4, scale: 1.01 }}
          className="bg-gradient-to-br from-white to-gray-50 rounded-2xl overflow-hidden shadow-md hover:shadow-lg transition-all duration-300 cursor-pointer group border border-gray-200"
          onClick={() => onCollectionSelect(collection)}
        >
          <div className="h-32 sm:h-40 bg-gradient-to-br from-purple-500 to-blue-600 relative overflow-hidden">
            <div className="absolute inset-0 bg-black/20 group-hover:bg-black/10 transition-all flex items-center justify-center">
              <Folder className="w-8 h-8 sm:w-10 sm:h-10 text-white opacity-90 group-hover:scale-105 transition-transform" />
            </div>
            <div className="absolute top-2 right-2 sm:top-3 sm:right-3">
              <div className="bg-white/20 backdrop-blur-sm rounded-full p-1 sm:p-2">
                <Sparkles className="w-3 h-3 sm:w-4 sm:h-4 text-white" />
              </div>
            </div>
          </div>
          <div className="p-4">
            <h3 className="font-bold text-base sm:text-lg text-gray-900 mb-2 group-hover:text-purple-700 transition-colors line-clamp-1">
              {collection.title}
            </h3>
            {collection.description && (
              <p className="text-gray-600 text-xs sm:text-sm mb-3 line-clamp-2 leading-relaxed">
                {collection.description}
              </p>
            )}
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                Collection
              </span>
              <div className="flex items-center gap-1 text-purple-600 group-hover:text-purple-700 transition-colors">
                <span className="text-xs font-semibold">View</span>
                <ChevronRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
              </div>
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  )
)

// Enhanced Image Card Component - Mobile Optimized
const EnhancedImageCard = ({
  image, index, approvedRequest, onDownloadWithWatermark, onDownloadPremium,
  onDownloadPremiumDirect, preventImageActions, getDisplayTitle, getDisplayDescription
}) => (
  <motion.div
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.3, delay: index * 0.1 }}
    whileHover={{ y: -3, scale: 1.01 }}
    className="bg-white rounded-2xl overflow-hidden shadow-md hover:shadow-lg transition-all duration-300 group border border-gray-200"
  >
    <div className="h-40 sm:h-48 overflow-hidden relative">
      <img
        src={image.image_url}
        alt={getDisplayTitle(image)}
        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
        onContextMenu={preventImageActions}
        onDragStart={preventImageActions}
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-3 sm:p-4">
        <div className="text-white text-xs font-medium bg-black/30 backdrop-blur-sm px-2 py-1 rounded-full">
          <ImageIcon className="w-3 h-3 inline mr-1" />
          PLENATHEGRAPHER ©
        </div>
      </div>
      <div className="absolute top-2 left-2 sm:top-3 sm:left-3">
        <div className="bg-white/90 backdrop-blur-sm rounded-full px-2 py-1">
          <Star className="w-3 h-3 text-yellow-500 inline mr-1" />
          <span className="text-xs font-semibold text-gray-800">Premium</span>
        </div>
      </div>
    </div>
    <div className="p-3 sm:p-4 space-y-3">
      <div>
        <h3 className="font-bold text-sm sm:text-base text-gray-900 mb-1 line-clamp-1">
          {getDisplayTitle(image)}
        </h3>
        <p className="text-gray-600 text-xs leading-relaxed line-clamp-2">
          {getDisplayDescription(image)}
        </p>
      </div>
      <div className="flex flex-col gap-2">
        <motion.button
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => onDownloadWithWatermark(image)}
          className="bg-gradient-to-r from-purple-600 to-blue-600 text-white py-2 rounded-lg hover:shadow-md transition-all font-semibold flex items-center justify-center gap-2 text-xs sm:text-sm"
        >
          <Download className="w-3 h-3 sm:w-4 sm:h-4" />
          Watermark
        </motion.button>
        {approvedRequest ? (
          <motion.button
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => onDownloadPremiumDirect(image)}
            className="bg-gradient-to-r from-emerald-500 to-green-500 text-white py-2 rounded-lg hover:shadow-md transition-all font-semibold flex items-center justify-center gap-2 text-xs sm:text-sm"
          >
            <Crown className="w-3 h-3 sm:w-4 sm:h-4" />
            Download Premium
          </motion.button>
        ) : (
          <motion.button
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => onDownloadPremium(image)}
            className="bg-gradient-to-r from-amber-500 to-orange-500 text-white py-2 rounded-lg hover:shadow-md transition-all font-semibold flex items-center justify-center gap-2 text-xs sm:text-sm"
          >
            <Lock className="w-3 h-3 sm:w-4 sm:h-4" />
            Request Premium
          </motion.button>
        )}
      </div>
    </div>
  </motion.div>
)

// Enhanced Purchases Content Component - Mobile Optimized
const PurchasesContent = ({
  loading, purchaseRequests, allImages, downloadPremiumImage,
  getDisplayTitle, getStatusIcon, getStatusColor, onMessageAdmin, adminContact, user
}) => (
  <motion.div
    key="purchases"
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: -10 }}
    transition={{ duration: 0.3 }}
  >
    <div className="flex items-center gap-3 mb-6">
      <div className="p-2 sm:p-3 bg-gradient-to-r from-purple-500 to-blue-500 rounded-xl sm:rounded-2xl shadow-lg">
        <ShoppingCart className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
      </div>
      <div>
        <h2 className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-gray-800 to-purple-600 bg-clip-text text-transparent">
          Purchases
        </h2>
        <p className="text-gray-600 text-xs sm:text-sm">Your download requests</p>
      </div>
    </div>
    
    {loading ? (
      <div className="flex justify-center items-center py-12">
        <motion.div
          animate={{ rotate: 360, scale: [1, 1.1, 1] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full"
        />
      </div>
    ) : purchaseRequests.length === 0 ? (
      <div className="text-center py-12">
        <div className="inline-block p-4 bg-gradient-to-r from-purple-100 to-blue-100 rounded-2xl mb-4">
          <ShoppingCart className="w-10 h-10 sm:w-12 sm:h-12 text-purple-600" />
        </div>
        <h3 className="text-lg sm:text-xl font-bold text-gray-800 mb-2">No Requests</h3>
        <p className="text-gray-600 text-sm max-w-md mx-auto">
          Visit gallery to request premium downloads!
        </p>
      </div>
    ) : (
      <div className="space-y-4">
        {purchaseRequests.map((request, index) => {
          const image = allImages.find(img => img.id === request.image_id)
          
          return (
            <motion.div
              key={request.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.1 }}
              className="bg-white rounded-2xl p-4 shadow-md hover:shadow-lg transition-all border border-gray-200"
            >
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-start gap-3">
                    {image?.image_url && (
                      <div className="flex-shrink-0 w-12 h-12 sm:w-16 sm:h-16 rounded-lg overflow-hidden">
                        <img
                          src={image.image_url}
                          alt={getDisplayTitle(image)}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-base sm:text-lg text-gray-900 mb-1 line-clamp-1">
                        {getDisplayTitle(request.image) || 'Premium Image'}
                      </p>
                      <p className="text-gray-600 text-xs sm:text-sm mb-2">
                        Requested {request.created_at ? new Date(request.created_at).toLocaleDateString('en-US', { 
                          month: 'short', day: 'numeric', year: 'numeric'
                        }) : 'Unknown date'}
                      </p>
                      <div className="flex items-center gap-2">
                        {getStatusIcon(request.status ?? 'pending')}
                        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getStatusColor(request.status ?? 'pending')}`}>
                          {(request.status ?? 'pending').charAt(0).toUpperCase() + (request.status ?? 'pending').slice(1)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="flex flex-col sm:flex-row gap-2">
                  {request.status === 'approved' && image && (
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => downloadPremiumImage(image)}
                      className="bg-gradient-to-r from-emerald-500 to-green-500 text-white px-4 py-2 rounded-lg hover:shadow-md transition-all font-semibold flex items-center justify-center gap-2 text-xs sm:text-sm"
                    >
                      <Download className="w-3 h-3 sm:w-4 sm:h-4" />
                      Download Premium
                    </motion.button>
                  )}
                  
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => onMessageAdmin(
                      `Regarding Request: ${getDisplayTitle(request.image)}`,
                      `Hello PLENATHEGRAPHER Admin,\n\nI have a question about my purchase request:\n\n- Image: ${getDisplayTitle(request.image)}\n- Request ID: ${request.id}\n- Status: ${request.status}\n- User: ${user?.email}\n- Name: ${user?.user_metadata?.name || 'Not specified'}\n\nCould you please provide an update? Thank you!`
                    )}
                    className="bg-gradient-to-r from-blue-500 to-cyan-500 text-white px-4 py-2 rounded-lg hover:shadow-md transition-all font-semibold flex items-center justify-center gap-2 text-xs sm:text-sm"
                  >
                    <MessageSquare className="w-3 h-3 sm:w-4 sm:h-4" />
                    Message Admin
                  </motion.button>
                </div>
              </div>
              
              {/* Additional info for pending/denied requests */}
              {request.status !== 'approved' && (
                <div className="mt-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
                  <p className="text-xs text-gray-600">
                    {request.status === 'pending' 
                      ? '⏳ Your request is under review. You will be able to download once approved.'
                      : '❌ Request denied. Please message admin for more information.'
                    }
                  </p>
                </div>
              )}
            </motion.div>
          )
        })}
      </div>
    )}
    
    {/* Admin Contact Section */}
    <div className="mt-8 p-4 bg-gradient-to-r from-purple-50 to-blue-50 rounded-2xl border border-purple-200">
      <div className="flex items-center gap-3 mb-3">
        <div className="p-2 bg-purple-100 rounded-xl">
          <MessageSquare className="w-5 h-5 text-purple-600" />
        </div>
        <div>
          <h3 className="font-bold text-gray-900">Need Help?</h3>
          <p className="text-gray-600 text-sm">Contact admin for any issues</p>
        </div>
      </div>
      <div className="flex flex-wrap gap-2">
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => onMessageAdmin()}
          className="bg-white text-purple-700 px-4 py-2 rounded-lg border border-purple-200 hover:bg-purple-50 transition-all font-semibold flex items-center gap-2 text-sm"
        >
          <MessageSquare className="w-4 h-4" />
          WhatsApp Admin
        </motion.button>
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => window.location.href = `mailto:${adminContact.email}?subject=Purchase Assistance&body=Hello PLENATHEGRAPHER Admin,%0D%0A%0D%0AI need assistance with my purchase.%0D%0A%0D%0AUser: ${user?.email}%0D%0AName: ${user?.user_metadata?.name || 'Not specified'}%0D%0A%0D%0AThank you!`}
          className="bg-white text-blue-700 px-4 py-2 rounded-lg border border-blue-200 hover:bg-blue-50 transition-all font-semibold flex items-center gap-2 text-sm"
        >
          <Mail className="w-4 h-4" />
          Email Admin
        </motion.button>
      </div>
    </div>
  </motion.div>
)

// Hire Photographer Content Component - Mobile Optimized
const HirePhotographerContent = ({
  showHireForm, hireForm, onShowForm, onHideForm, onFormChange, onSubmitForm, user
}) => (
  <motion.div
    key="hire"
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: -10 }}
    transition={{ duration: 0.3 }}
  >
    <div className="flex items-center gap-3 mb-6">
      <div className="p-2 sm:p-3 bg-gradient-to-r from-purple-500 to-blue-500 rounded-xl sm:rounded-2xl shadow-lg">
        <Camera className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
      </div>
      <div>
        <h2 className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-gray-800 to-purple-600 bg-clip-text text-transparent">
          Hire Photographer
        </h2>
        <p className="text-gray-600 text-xs sm:text-sm">Book professional services</p>
      </div>
    </div>

    {!showHireForm ? (
      <div className="text-center py-8 sm:py-12">
        <div className="max-w-2xl mx-auto">
          <div className="inline-block p-4 sm:p-6 bg-gradient-to-r from-purple-100 to-blue-100 rounded-2xl mb-6">
            <Camera className="w-12 h-12 sm:w-16 sm:h-16 text-purple-600" />
          </div>
          <h3 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-4">
            Capture Your <span className="bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">Moments</span>
          </h3>
          <p className="text-base sm:text-lg text-gray-600 mb-6 leading-relaxed">
            Professional photography for weddings, events, portraits, and more.
          </p>
          
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
            <div className="bg-white/80 backdrop-blur-sm rounded-xl p-4 border border-purple-200">
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-purple-100 rounded-xl flex items-center justify-center mb-3">
                <Star className="w-4 h-4 sm:w-5 sm:h-5 text-purple-600" />
              </div>
              <h4 className="font-bold text-gray-900 text-sm sm:text-base mb-1">Premium Quality</h4>
              <p className="text-gray-600 text-xs">High-resolution photos</p>
            </div>
            <div className="bg-white/80 backdrop-blur-sm rounded-xl p-4 border border-blue-200">
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-blue-100 rounded-xl flex items-center justify-center mb-3">
                <Zap className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" />
              </div>
              <h4 className="font-bold text-gray-900 text-sm sm:text-base mb-1">Quick Response</h4>
              <p className="text-gray-600 text-xs">Response within hours</p>
            </div>
            <div className="bg-white/80 backdrop-blur-sm rounded-xl p-4 border border-cyan-200">
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-cyan-100 rounded-xl flex items-center justify-center mb-3">
                <Heart className="w-4 h-4 sm:w-5 sm:h-5 text-cyan-600" />
              </div>
              <h4 className="font-bold text-gray-900 text-sm sm:text-base mb-1">Custom Packages</h4>
              <p className="text-gray-600 text-xs">Tailored to your needs</p>
            </div>
          </div>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={onShowForm}
            className="bg-gradient-to-r from-purple-600 to-blue-600 text-white px-6 sm:px-8 py-3 sm:py-4 rounded-xl hover:shadow-lg transition-all font-bold text-sm sm:text-base shadow-md"
          >
            Start Booking
          </motion.button>
        </div>
      </div>
    ) : (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-2xl mx-auto"
      >
        <div className="bg-white/90 backdrop-blur-lg rounded-2xl p-4 sm:p-6 shadow-lg border border-purple-200">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg sm:text-xl font-bold text-gray-900">Booking Details</h3>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={onHideForm}
              className="text-gray-500 hover:text-gray-700 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </motion.button>
          </div>

          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-1">
                  Event Type *
                </label>
                <select
                  value={hireForm.eventType}
                  onChange={(e) => onFormChange('eventType', e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-gray-300 focus:border-purple-500 focus:ring-1 focus:ring-purple-200 transition-all text-sm"
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
                <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-1">
                  Event Date *
                </label>
                <input
                  type="date"
                  value={hireForm.eventDate}
                  onChange={(e) => onFormChange('eventDate', e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-gray-300 focus:border-purple-500 focus:ring-1 focus:ring-purple-200 transition-all text-sm"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-1">
                  Budget (₦) *
                </label>
                <input
                  type="number"
                  placeholder="e.g., 50000"
                  value={hireForm.budget}
                  onChange={(e) => onFormChange('budget', e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-gray-300 focus:border-purple-500 focus:ring-1 focus:ring-purple-200 transition-all text-sm"
                />
              </div>

              <div>
                <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-1">
                  Location *
                </label>
                <input
                  type="text"
                  placeholder="City or venue"
                  value={hireForm.location}
                  onChange={(e) => onFormChange('location', e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-gray-300 focus:border-purple-500 focus:ring-1 focus:ring-purple-200 transition-all text-sm"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-1">
                Number of Guests
              </label>
              <input
                type="number"
                placeholder="Approximate guests"
                value={hireForm.guests}
                onChange={(e) => onFormChange('guests', e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-gray-300 focus:border-purple-500 focus:ring-1 focus:ring-purple-200 transition-all text-sm"
              />
            </div>

            <div>
              <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-1">
                Special Requests
              </label>
              <textarea
                placeholder="Any specific requirements..."
                value={hireForm.specialRequests}
                onChange={(e) => onFormChange('specialRequests', e.target.value)}
                rows="3"
                className="w-full px-3 py-2 rounded-xl border border-gray-300 focus:border-purple-500 focus:ring-1 focus:ring-purple-200 transition-all text-sm resize-none"
              />
            </div>

            <div className="bg-purple-50 rounded-xl p-3 border border-purple-200">
              <h4 className="font-semibold text-purple-900 text-sm mb-1">Contact Information</h4>
              <p className="text-purple-700 text-xs">
                We'll contact you at: <strong>{user?.email}</strong>
              </p>
              {user?.user_metadata?.name && (
                <p className="text-purple-700 text-xs mt-1">
                  Name: <strong>{user.user_metadata.name}</strong>
                </p>
              )}
            </div>

            <div className="flex gap-3 pt-2">
              <motion.button
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.98 }}
                onClick={onHideForm}
                className="flex-1 px-4 py-3 rounded-xl border border-gray-300 text-gray-700 hover:bg-gray-50 transition-all font-semibold text-sm"
              >
                Cancel
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.98 }}
                onClick={onSubmitForm}
                className="flex-1 bg-gradient-to-r from-purple-600 to-blue-600 text-white px-4 py-3 rounded-xl hover:shadow-md transition-all font-semibold text-sm shadow-sm"
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