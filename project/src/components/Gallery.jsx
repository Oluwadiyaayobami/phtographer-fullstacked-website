import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Lock, Download, ShoppingCart, Share2, X, Eye } from 'lucide-react'
import toast from 'react-hot-toast'
import { getCollections, getCollectionImages, verifyCollectionPin, createSignedUrl } from '../utils/supabase'
import { useAuth } from '../context/AuthContext'
import ImageModal from './ImageModal'
import PinModal from './PinModal'
import PurchaseModal from './PurchaseModal'

const Gallery = () => {
  const [collections, setCollections] = useState([])
  const [selectedCollection, setSelectedCollection] = useState(null)
  const [images, setImages] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedImage, setSelectedImage] = useState(null)
  const [showPinModal, setShowPinModal] = useState(false)
  const [showPurchaseModal, setShowPurchaseModal] = useState(false)
  const [actionType, setActionType] = useState(null)
  const [unlockedCollections, setUnlockedCollections] = useState(new Set())
  const { user } = useAuth()

  useEffect(() => {
    fetchCollections()
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
    if (unlockedCollections.has(collection.id)) {
      setSelectedCollection(collection)
      fetchCollectionImages(collection.id)
    } else {
      setSelectedCollection(collection)
      setShowPinModal(true)
    }
  }

  const handlePinSubmit = async (pin) => {
    if (!selectedCollection) return

    try {
      const isValid = await verifyCollectionPin(selectedCollection.id, pin)
      if (isValid) {
        setUnlockedCollections(prev => new Set([...prev, selectedCollection.id]))
        setShowPinModal(false)
        fetchCollectionImages(selectedCollection.id)
        toast.success('Collection unlocked!')
      } else {
        toast.error('Invalid PIN. Please try again.')
      }
    } catch (error) {
      console.error('Error verifying PIN:', error)
      toast.error('Failed to verify PIN')
    }
  }

  const handleImageAction = (image, action) => {
    setSelectedImage(image)
    setActionType(action)
    
    if (action === 'download') {
      setShowPinModal(true)
    } else if (action === 'buy') {
      if (!user) {
        toast.error('Please sign in to make a purchase request')
        return
      }
      setShowPurchaseModal(true)
    } else if (action === 'share') {
      handleShare(image)
    }
  }

  const handleDownload = async (pin) => {
    if (!selectedImage) return

    try {
      const isValid = await verifyCollectionPin(selectedImage.collection_id, pin)
      if (isValid) {
        const { data, error } = await createSignedUrl(selectedImage.image_url)
        if (error) throw error
        
        // Create download link
        const link = document.createElement('a')
        link.href = data.signedUrl
        link.download = selectedImage.title || 'image'
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
        title: image.title || 'PLENATHEGRAPHER Image',
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
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
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
            Protected Gallery
          </h2>
          <p className="text-xl text-gray-400 max-w-2xl mx-auto">
            Exclusive collections of premium photography. Each collection is password-protected 
            to ensure the artistic integrity and exclusivity of the work.
          </p>
        </motion.div>

        {!selectedCollection ? (
          /* Collection Grid */
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {collections.map((collection, index) => (
              <motion.div
                key={collection.id}
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                viewport={{ once: true }}
                className="group cursor-pointer"
                onClick={() => handleCollectionClick(collection)}
              >
                <div className="relative bg-gray-900 rounded-lg overflow-hidden shadow-2xl">
                  <div className="aspect-w-16 aspect-h-12 bg-gradient-to-br from-gray-800 to-gray-900 flex items-center justify-center">
                    {unlockedCollections.has(collection.id) ? (
                      <Eye className="w-16 h-16 text-green-500" />
                    ) : (
                      <Lock className="w-16 h-16 text-gray-500" />
                    )}
                  </div>
                  
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-all duration-300 flex items-center justify-center">
                    <div className="text-center text-white">
                      <h3 className="text-2xl font-bold mb-2">{collection.title}</h3>
                      <p className="text-gray-300 mb-4">{collection.description}</p>
                      <div className="inline-flex items-center space-x-2 bg-white/20 px-4 py-2 rounded-full">
                        {unlockedCollections.has(collection.id) ? (
                          <>
                            <Eye size={16} />
                            <span>View Collection</span>
                          </>
                        ) : (
                          <>
                            <Lock size={16} />
                            <span>Enter PIN</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        ) : (
          /* Image Grid */
          <div>
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-3xl font-bold text-white">{selectedCollection.title}</h3>
              <button
                onClick={() => {
                  setSelectedCollection(null)
                  setImages([])
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
                    src={`https://images.pexels.com/photos/${1000000 + index}/pexels-photo-${1000000 + index}.jpeg?auto=compress&cs=tinysrgb&w=800&h=600&fit=crop`}
                    alt={image.title}
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

                  {/* Image Title */}
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4">
                    <h4 className="text-white font-semibold">{image.title}</h4>
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
          <ImageModal
            image={selectedImage}
            onClose={() => setSelectedImage(null)}
          />
        )}
        
        {showPinModal && (
          <PinModal
            onClose={() => setShowPinModal(false)}
            onSubmit={actionType === 'download' ? handleDownload : handlePinSubmit}
            title={actionType === 'download' ? 'Enter PIN to Download' : 'Enter Collection PIN'}
          />
        )}
        
        {showPurchaseModal && selectedImage && (
          <PurchaseModal
            image={selectedImage}
            onClose={() => setShowPurchaseModal(false)}
          />
        )}
      </AnimatePresence>
    </section>
  )
}

export default Gallery