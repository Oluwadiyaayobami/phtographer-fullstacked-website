import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { X, Lock, Eye, EyeOff } from 'lucide-react'

const PinModal = ({ onClose, onSubmit, title }) => {
  const [pin, setPin] = useState('')
  const [loading, setLoading] = useState(false)
  const [showPin, setShowPin] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!pin.trim()) {
      setError('Please enter a PIN')
      return
    }

    setLoading(true)
    setError('')
    await onSubmit(pin)
    setLoading(false)
    setPin('')
  }

  const handlePinChange = (value) => {
    setPin(value)
    if (error) setError('')
  }

  const togglePinVisibility = () => {
    setShowPin(!showPin)
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.9, opacity: 0, y: 20 }}
        transition={{ type: "spring", damping: 25, stiffness: 300 }}
        className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl max-w-md w-full mx-auto border border-gray-200 dark:border-gray-700"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-100 dark:border-gray-800">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg shadow-lg">
              <Lock className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                {title}
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                Enter your secure PIN to continue
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors duration-200 group"
          >
            <X className="w-5 h-5 text-gray-500 group-hover:text-gray-700 dark:group-hover:text-gray-300 transition-colors" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="space-y-3">
            <label htmlFor="pin" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Security PIN
            </label>
            
            <div className="relative">
              <input
                type={showPin ? "text" : "password"}
                id="pin"
                value={pin}
                onChange={(e) => handlePinChange(e.target.value)}
                className={`w-full px-4 py-4 border-2 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-center text-xl font-mono tracking-widest
                  ${error 
                    ? 'border-red-300 bg-red-50 dark:bg-red-900/20 dark:border-red-700' 
                    : 'border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 hover:border-gray-300 dark:hover:border-gray-600'
                  }`}
                placeholder="••••"
                required
                autoFocus
                maxLength={10}
                disabled={loading}
              />
              
              {/* Eye toggle button */}
              <button
                type="button"
                onClick={togglePinVisibility}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors duration-200"
                disabled={loading}
              >
                {showPin ? (
                  <EyeOff className="w-5 h-5" />
                ) : (
                  <Eye className="w-5 h-5" />
                )}
              </button>
            </div>

            {/* Error message */}
            {error && (
              <motion.p
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-sm text-red-600 dark:text-red-400 flex items-center space-x-1"
              >
                <X className="w-4 h-4" />
                <span>{error}</span>
              </motion.p>
            )}

            {/* PIN hint */}
            <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
              Enter the PIN provided by the administrator
            </p>
          </div>

          {/* Submit button */}
          <motion.button
            type="submit"
            disabled={loading || !pin.trim()}
            whileHover={{ scale: loading || !pin.trim() ? 1 : 1.02 }}
            whileTap={{ scale: loading || !pin.trim() ? 1 : 0.98 }}
            className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-4 px-6 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none group relative overflow-hidden"
          >
            {/* Animated background */}
            <motion.div
              className="absolute inset-0 bg-gradient-to-r from-blue-700 to-purple-700 opacity-0 group-hover:opacity-100 transition-opacity duration-200"
            />
            
            {/* Button content */}
            <span className="relative z-10 flex items-center justify-center space-x-2">
              {loading ? (
                <>
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    className="w-5 h-5 border-2 border-white border-t-transparent rounded-full"
                  />
                  <span>Verifying...</span>
                </>
              ) : (
                <>
                  <Lock className="w-5 h-5" />
                  <span>Access Content</span>
                </>
              )}
            </span>
          </motion.button>

          {/* Security notice */}
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
            <p className="text-xs text-blue-800 dark:text-blue-300 text-center">
              🔒 Your PIN is encrypted and secure
            </p>
          </div>
        </form>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50 rounded-b-2xl">
          <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
            Contact support if you've forgotten your PIN
          </p>
        </div>
      </motion.div>
    </motion.div>
  )
}

export default PinModal