import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { X, ShoppingCart } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { createPurchaseRequest } from '../utils/supabase'
import toast from 'react-hot-toast'

const PurchaseModal = ({ image, onClose }) => {
  const [formData, setFormData] = useState({
    size: '',
    frame: '',
    notes: ''
  })
  const [loading, setLoading] = useState(false)
  const { user } = useAuth()

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!user) {
      toast.error('Please sign in to make a purchase request')
      return
    }

    setLoading(true)
    try {
      const { error } = await createPurchaseRequest(user.id, image.id, formData)
      if (error) throw error
      
      toast.success('Purchase request submitted! We will contact you soon.')
      onClose()
    } catch (error) {
      console.error('Error submitting purchase request:', error)
      toast.error('Failed to submit purchase request')
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="bg-white rounded-lg p-8 max-w-lg w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <ShoppingCart className="w-6 h-6 text-gray-600" />
            <h2 className="text-2xl font-bold text-gray-900">Purchase Request</h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        <div className="mb-6">
          <img
            src={`https://images.pexels.com/photos/${Math.floor(Math.random() * 1000000) + 1000000}/pexels-photo-${Math.floor(Math.random() * 1000000) + 1000000}.jpeg?auto=compress&cs=tinysrgb&w=400&h=300&fit=crop`}
            alt={image.title}
            className="w-full h-48 object-cover rounded-lg"
            onContextMenu={(e) => e.preventDefault()}
            draggable={false}
          />
          <h3 className="text-lg font-semibold text-gray-900 mt-2">{image.title}</h3>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="size" className="block text-sm font-medium text-gray-700 mb-2">
              Print Size *
            </label>
            <select
              id="size"
              name="size"
              value={formData.size}
              onChange={handleChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent transition-colors"
              required
            >
              <option value="">Select size</option>
              <option value="8x10">8" x 10" - $50</option>
              <option value="11x14">11" x 14" - $75</option>
              <option value="16x20">16" x 20" - $125</option>
              <option value="20x24">20" x 24" - $200</option>
              <option value="24x30">24" x 30" - $300</option>
              <option value="custom">Custom Size - Contact for pricing</option>
            </select>
          </div>

          <div>
            <label htmlFor="frame" className="block text-sm font-medium text-gray-700 mb-2">
              Frame Option
            </label>
            <select
              id="frame"
              name="frame"
              value={formData.frame}
              onChange={handleChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent transition-colors"
            >
              <option value="">No frame</option>
              <option value="black">Black Frame - +$25</option>
              <option value="white">White Frame - +$25</option>
              <option value="silver">Silver Frame - +$35</option>
              <option value="custom">Custom Frame - Contact for pricing</option>
            </select>
          </div>

          <div>
            <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-2">
              Additional Notes
            </label>
            <textarea
              id="notes"
              name="notes"
              rows={3}
              value={formData.notes}
              onChange={handleChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent transition-colors"
              placeholder="Any special requests or questions..."
            />
          </div>

          <div className="bg-gray-50 p-4 rounded-lg">
            <p className="text-sm text-gray-600">
              <strong>Note:</strong> This is a purchase request. We will contact you within 24 hours 
              with pricing details and payment instructions. All prints are professionally produced 
              on premium archival paper.
            </p>
          </div>

          <button
            type="submit"
            disabled={loading || !formData.size}
            className="w-full bg-black text-white py-3 px-4 rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Submitting Request...' : 'Submit Purchase Request'}
          </button>
        </form>
      </motion.div>
    </motion.div>
  )
}

export default PurchaseModal