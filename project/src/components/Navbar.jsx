import React, { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Menu, X, Camera } from 'lucide-react'
import { useAuth } from '../context/AuthContext'

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false)
  const location = useLocation()
  const { user } = useAuth()

  const navItems = [
    { name: 'Home', path: '/' },
    { name: 'About', path: '#about' },
    { name: 'Gallery', path: '#gallery' },
    { name: 'Contact', path: '#contact' }
  ]

  const isActive = (path) => {
    if (path.startsWith('#')) {
      return false
    }
    return location.pathname === path
  }

  const scrollToSection = (sectionId) => {
    const element = document.getElementById(sectionId)
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' })
    }
  }

  const handleNavClick = (path) => {
    setIsOpen(false)
    if (path.startsWith('#')) {
      scrollToSection(path.substring(1))
    }
  }

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-black/90 backdrop-blur-md border-b border-white/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2 group">
            <Camera className="h-8 w-8 text-white group-hover:text-gray-300 transition-colors" />
            <span className="text-xl font-bold text-white group-hover:text-gray-300 transition-colors">
              PLENATHEGRAPHER
            </span>
          </Link>

          {/* Desktop Menu */}
          <div className="hidden md:block">
            <div className="ml-10 flex items-center space-x-8">
              {navItems.map((item) => (
                <Link
                  key={item.name}
                  to={item.path}
                  onClick={() => handleNavClick(item.path)}
                  className={`relative text-white hover:text-gray-300 transition-colors group ${
                    isActive(item.path) ? 'text-gray-300' : ''
                  }`}
                >
                  {item.name}
                  <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-white group-hover:w-full transition-all duration-300"></span>
                </Link>
              ))}
              
              {user ? (
                <Link
                  to="/dashboard"
                  className="bg-white text-black px-4 py-2 rounded-md hover:bg-gray-200 transition-colors"
                >
                  Dashboard
                </Link>
              ) : (
                <Link
                  to="/login"
                  className="bg-white text-black px-4 py-2 rounded-md hover:bg-gray-200 transition-colors"
                >
                  Sign In
                </Link>
              )}
            </div>
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="text-white hover:text-gray-300 transition-colors"
            >
              {isOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden bg-black/95 backdrop-blur-md border-b border-white/10"
          >
            <div className="px-2 pt-2 pb-3 space-y-1">
              {navItems.map((item) => (
                <Link
                  key={item.name}
                  to={item.path}
                  onClick={() => handleNavClick(item.path)}
                  className="block px-3 py-2 text-white hover:text-gray-300 transition-colors"
                >
                  {item.name}
                </Link>
              ))}
              
              {user ? (
                <Link
                  to="/dashboard"
                  className="block px-3 py-2 bg-white text-black rounded-md mx-3 text-center hover:bg-gray-200 transition-colors"
                  onClick={() => setIsOpen(false)}
                >
                  Dashboard
                </Link>
              ) : (
                <Link
                  to="/login"
                  className="block px-3 py-2 bg-white text-black rounded-md mx-3 text-center hover:bg-gray-200 transition-colors"
                  onClick={() => setIsOpen(false)}
                >
                  Sign In
                </Link>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  )
}

export default Navbar