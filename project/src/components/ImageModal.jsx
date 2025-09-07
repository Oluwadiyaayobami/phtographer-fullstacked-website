import React from 'react'
import { motion } from 'framer-motion'
import { X } from 'lucide-react'

const ImageModal = ({ image, onClose }) => {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.8, opacity: 0 }}
        className="relative max-w-4xl w-full"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute -top-12 right-0 text-white hover:text-gray-300 transition-colors z-10"
        >
          <X size={32} />
        </button>
        
        <img
          src={`https://images.pexels.com/photos/${Math.floor(Math.random() * 1000000) + 1000000}/pexels-photo-${Math.floor(Math.random() * 1000000) + 1000000}.jpeg?auto=compress&cs=tinysrgb&w=1200&h=800&fit=crop`}
          alt={image.title}
          className="w-full h-auto max-h-[80vh] object-contain rounded-lg"
          onContextMenu={(e) => e.preventDefault()}
          draggable={false}
        />
        
        {image.title && (
          <div className="mt-4 text-center">
            <h3 className="text-2xl font-bold text-white">{image.title}</h3>
          </div>
        )}
      </motion.div>
    </motion.div>
  )
}

export default ImageModal