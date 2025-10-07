import React from 'react'
import { Camera, Instagram, Twitter, Facebook, Mail } from 'lucide-react'

const Footer = () => {
  return (
    <footer className="bg-black text-white py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid md:grid-cols-3 gap-8 mb-8">
          {/* Brand */}
          <div>
            <div className="flex items-center space-x-2 mb-4">
              <Camera className="h-8 w-8 text-white" />
              <span className="text-xl font-bold">PLENATHEGRAPHER</span>
            </div>
            <p className="text-gray-400 leading-relaxed">
              Capturing life's most precious moments with artistic vision and technical excellence. 
              Premium photography services for discerning clients.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Quick Links</h3>
            <ul className="space-y-2">
              <li>
                <a href="#about" className="text-gray-400 hover:text-white transition-colors">
                  About
                </a>
              </li>
              <li>
                <a href="#gallery" className="text-gray-400 hover:text-white transition-colors">
                  Gallery
                </a>
              </li>
              <li>
                <a href="#contact" className="text-gray-400 hover:text-white transition-colors">
                  Contact
                </a>
              </li>
              <li>
                <a href="/login" className="text-gray-400 hover:text-white transition-colors">
                  Client Login
                </a>
              </li>
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Contact</h3>
            <div className="space-y-2 text-gray-400">
              <p>Lagos State, Nigeria</p>
              <p>+234 706 055 3627</p>
              <p>plenastudios@gmail.com</p>
            </div>
          </div>
        </div>

        {/* Social Media & Copyright */}
        <div className="border-t border-gray-800 pt-8 flex flex-col md:flex-row justify-between items-center">
          <div className="flex space-x-6 mb-4 md:mb-0">
            <a
              href="https://instagram.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-400 hover:text-white transition-colors transform hover:scale-110"
            >
              <Instagram className="h-6 w-6" />
            </a>
            <a
              href="https://twitter.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-400 hover:text-white transition-colors transform hover:scale-110"
            >
              <Twitter className="h-6 w-6" />
            </a>
            <a
              href="https://facebook.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-400 hover:text-white transition-colors transform hover:scale-110"
            >
              <Facebook className="h-6 w-6" />
            </a>
            <a
              href="mailto:hello@plenathegrapher.com"
              className="text-gray-400 hover:text-white transition-colors transform hover:scale-110"
            >
              <Mail className="h-6 w-6" />
            </a>
          </div>

          <div className="text-gray-400 text-sm text-center md:text-right">
            <p>&copy; 2025 PLENATHEGRAPHER. All rights reserved.</p>
            <p className="mt-2">
              This website was created by <span className="font-semibold">Buildify</span> —{' '}
              <a 
                href="https://buildfiys.vercel.app/" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="text-white hover:underline"
              >
                Learn more about us
              </a>
            </p>
          </div>
        </div>
      </div>
    </footer>
  )
}

export default Footer
