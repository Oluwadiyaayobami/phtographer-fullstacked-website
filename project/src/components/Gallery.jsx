import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Download, ShoppingCart, Share2, X, Eye, ArrowRight, Images } from 'lucide-react'
import toast from 'react-hot-toast'
import {
  getCollections,
  getCollectionImages,
  createSignedUrl,
  getPublicGalleryImages,
  getDownloadPin
} from '../utils/supabase'
import { useAuth } from '../context/AuthContext'
import ImageModal from './ImageModal'
import PinModal from './PinModal'
import PurchaseModal from './PurchaseModal'
import { useNavigate } from 'react-router-dom'

const Gallery = () => {
  const [collections, setCollections] = useState([])
  const [selectedCollection, setSelectedCollection] = useState(null)
  const [images, setImages] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedImage, setSelectedImage] = useState(null)
  const [showPinModal, setShowPinModal] = useState(false)
  const [showPurchaseModal, setShowPurchaseModal] = useState(false)
  const [downloadPin, setDownloadPin] = useState('')
  const [showCollections, setShowCollections] = useState(false)
  const { user } = useAuth()
  const navigate = useNavigate()

  const COMPANY_NAME = "PLENATHEGRAPHER ©"

  useEffect(() => {
    fetchCollections()
    fetchPublicImages()
    fetchDownloadPin()
  }, [])

  const fetchCollections = async () => {
    try {
      const { data, error } = await getCollections()
      if (error) throw error
      setCollections(data || [])
    } catch (error) {
      console.error('Error fetching collections:', error)
      toast.error('Failed to load collections')
    } finally {
      setLoading(false)
    }
  }

  const fetchPublicImages = async () => {
    try {
      const { data, error } = await getPublicGalleryImages()
      if (error) throw error
      if (data && data.length > 0) {
        const random15 = data.sort(() => 0.5 - Math.random()).slice(0, 15)
        setImages(random15)
      }
    } catch (error) {
      console.error('Error fetching preview images:', error)
      toast.error('Failed to load preview images')
    }
  }

  const fetchDownloadPin = async () => {
    try {
      const { pin, error } = await getDownloadPin()
      if (error) throw error
      setDownloadPin(pin || '')
    } catch (error) {
      console.error('Error fetching download PIN:', error)
    }
  }

  const fetchCollectionImages = async (collectionId) => {
    try {
      const { data, error } = await getCollectionImages(collectionId)
      if (error) throw error
      setImages(data || [])
    } catch (error) {
      console.error('Error fetching images:', error)
      toast.error('Failed to load images')
    }
  }

  const handleCollectionClick = (collection) => {
    setSelectedCollection(collection)
    setShowCollections(false)
    fetchCollectionImages(collection.id)
  }

  const handleImageAction = (image, action) => {
    setSelectedImage(image)

    if (action === 'download') {
      if (!user) {
        toast.error('Please sign in to download images')
        navigate('/auth')
        return
      }
      setShowPinModal(true)
    } else if (action === 'buy') {
      if (!user) {
        toast.error('Please sign in to make a purchase request')
        navigate('/auth')
        return
      }
      setShowPurchaseModal(true)
    } else if (action === 'share') {
      handleShare(image)
    }
  }

  const handleDownload = async (enteredPin) => {
    if (!selectedImage) return

    try {
      // Use your existing download PIN
      if (enteredPin === downloadPin) {
        const { data, error } = await createSignedUrl(selectedImage.image_url)
        if (error) throw error

        const link = document.createElement('a')
        link.href = data.signedUrl
        link.download = COMPANY_NAME
        link.click()

        setShowPinModal(false)
        toast.success('Download started! Link expires in 60 seconds.')
      } else {
        toast.error('Invalid PIN. Please try again.')
      }
    } catch (error) {
      console.error('Error downloading image:', error)
      toast.error('Failed to download image')
    }
  }

  const handleShare = (image) => {
    if (navigator.share) {
      navigator.share({
        title: COMPANY_NAME,
        text: 'Check out this amazing photograph!',
        url: window.location.href
      })
    } else {
      navigator.clipboard.writeText(window.location.href)
      toast.success('Link copied to clipboard!')
    }
  }

  if (loading) {
    return (
      <section id="gallery" className="py-20 bg-black">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-center items-center h-64">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
              className="w-12 h-12 border-4 border-white border-t-transparent rounded-full"
            />
          </div>
        </div>
      </section>
    )
  }

  return (
    <section id="gallery" className="py-20 bg-black">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
            Featured Gallery
          </h2>
          <p className="text-xl text-gray-400 max-w-2xl mx-auto">
            Explore our curated collections and exclusive photographs
          </p>
        </motion.div>

        {/* Collections Section */}
        {!selectedCollection && !showCollections && (
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-12"
          >
            <button
              onClick={() => setShowCollections(true)}
              className="inline-flex items-center space-x-3 bg-white text-black px-8 py-4 rounded-lg font-semibold hover:bg-gray-100 transition-colors duration-300 shadow-2xl"
            >
              <Images className="w-6 h-6" />
              <span>Browse All Collections</span>
              <ArrowRight className="w-5 h-5" />
            </button>
          </motion.div>
        )}

        {/* Collections Grid */}
        {showCollections && !selectedCollection && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
            className="mb-12"
          >
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-3xl font-bold text-white">Photo Collections</h3>
              <button
                onClick={() => setShowCollections(false)}
                className="text-gray-400 hover:text-white transition-colors p-2"
              >
                <X size={24} />
              </button>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {collections.map((collection, index) => (
                <motion.div
                  key={collection.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  className="group relative bg-gray-900 rounded-xl overflow-hidden shadow-2xl cursor-pointer transform transition-transform duration-300 hover:scale-105"
                  onClick={() => handleCollectionClick(collection)}
                >
                  {/* Collection Cover Image */}
                  <div className="aspect-video bg-gradient-to-br from-purple-600 to-blue-600 relative overflow-hidden">
                    <div className="absolute inset-0 bg-black/40 group-hover:bg-black/20 transition-all duration-300" />
                    
                    {/* Collection Icon */}
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Images className="w-16 h-16 text-white opacity-80" />
                    </div>
                  </div>

                  {/* Collection Info */}
                  <div className="p-6">
                    <h4 className="text-xl font-bold text-white mb-2 group-hover:text-blue-400 transition-colors">
                      {collection.title}
                    </h4>
                    {collection.description && (
                      <p className="text-gray-400 text-sm mb-4 line-clamp-2">
                        {collection.description}
                      </p>
                    )}
                    
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-500">
                        Collection
                      </span>
                      <div className="flex items-center space-x-2 text-blue-400 group-hover:text-blue-300 transition-colors">
                        <span className="text-sm font-medium">
                          View Collection
                        </span>
                        <ArrowRight className="w-4 h-4" />
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>

            {collections.length === 0 && (
              <div className="text-center py-12">
                <Images className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                <p className="text-gray-400 text-lg">No collections available yet</p>
              </div>
            )}
          </motion.div>
        )}

        {/* Preview gallery */}
        {!selectedCollection && !showCollections && (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {images.map((image, index) => (
              <motion.div
                key={image.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="group relative bg-gray-900 rounded-lg overflow-hidden shadow-lg"
              >
                <img
                  src={image.image_url}
                  alt={COMPANY_NAME}
                  className="w-full h-64 object-cover cursor-pointer"
                  onClick={() => setSelectedImage(image)}
                  onContextMenu={(e) => e.preventDefault()}
                  draggable={false}
                />

                {/* Overlay with Actions */}
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-all duration-300 flex items-center justify-center">
                  <div className="flex space-x-4">
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        handleImageAction(image, 'download')
                      }}
                      className="p-3 bg-gray-600 rounded-full"
                      title="Download Disabled"
                    >
                      <Download className="w-5 h-5 text-white" />
                    </button>

                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        handleImageAction(image, 'buy')
                      }}
                      className="p-3 bg-white/20 rounded-full hover:bg-white/30 transition-colors"
                      title="Purchase"
                    >
                      <ShoppingCart className="w-5 h-5 text-white" />
                    </button>

                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        handleImageAction(image, 'share')
                      }}
                      className="p-3 bg-white/20 rounded-full hover:bg-white/30 transition-colors"
                      title="Share"
                    >
                      <Share2 className="w-5 h-5 text-white" />
                    </button>
                  </div>
                </div>

                {/* ✅ Always show company name */}
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4">
                  <h4 className="text-white font-semibold">{COMPANY_NAME}</h4>
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {/* Collection mode */}
        {selectedCollection && (
          <div>
            <div className="flex items-center justify-between mb-8">
              <div>
                <h3 className="text-3xl font-bold text-white">{selectedCollection.title}</h3>
                {selectedCollection.description && (
                  <p className="text-gray-400 mt-2">{selectedCollection.description}</p>
                )}
              </div>
              <button
                onClick={() => {
                  setSelectedCollection(null)
                  setImages([])
                  fetchPublicImages()
                }}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <X size={24} />
              </button>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {images.map((image, index) => (
                <motion.div
                  key={image.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  className="group relative bg-gray-900 rounded-lg overflow-hidden shadow-lg"
                >
                  <img
                    src={image.image_url}
                    alt={COMPANY_NAME}
                    className="w-full h-64 object-cover cursor-pointer"
                    onClick={() => setSelectedImage(image)}
                    onContextMenu={(e) => e.preventDefault()}
                    draggable={false}
                  />

                  {/* Overlay with Actions */}
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-all duration-300 flex items-center justify-center">
                    <div className="flex space-x-4">
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          handleImageAction(image, 'download')
                        }}
                        className="p-3 bg-white/20 rounded-full hover:bg-white/30 transition-colors"
                        title="Download"
                      >
                        <Download className="w-5 h-5 text-white" />
                      </button>

                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          handleImageAction(image, 'buy')
                        }}
                        className="p-3 bg-white/20 rounded-full hover:bg-white/30 transition-colors"
                        title="Purchase"
                      >
                        <ShoppingCart className="w-5 h-5 text-white" />
                      </button>

                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          handleImageAction(image, 'share')
                        }}
                        className="p-3 bg-white/20 rounded-full hover:bg-white/30 transition-colors"
                        title="Share"
                      >
                        <Share2 className="w-5 h-5 text-white" />
                      </button>
                    </div>
                  </div>

                  {/* ✅ Always show company name */}
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4">
                    <h4 className="text-white font-semibold">{COMPANY_NAME}</h4>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Modals */}
      <AnimatePresence>
        {selectedImage && (
          <ImageModal image={selectedImage} onClose={() => setSelectedImage(null)} />
        )}

        {showPinModal && (
          <PinModal
            onClose={() => setShowPinModal(false)}
            onSubmit={handleDownload}
            title="Enter Download PIN"
          />
        )}

        {showPurchaseModal && selectedImage && (
          <PurchaseModal image={selectedImage} onClose={() => setShowPurchaseModal(false)} />
        )}
      </AnimatePresence>
    </section>
  )
}

export default Gallery