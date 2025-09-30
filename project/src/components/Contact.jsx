import React, { useState, useRef } from 'react'
import { motion, useInView } from 'framer-motion'
import { Mail, Phone, MapPin, Send, MessageCircle, Calendar, Clock, Camera, Star, LogIn } from 'lucide-react'
import toast from 'react-hot-toast'
import { submitContactForm } from '../utils/supabase'
import { useNavigate } from 'react-router-dom'

const Contact = () => {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, threshold: 0.3 })
  const navigate = useNavigate()
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    message: ''
  })
  const [loading, setLoading] = useState(false)
  const [activeTab, setActiveTab] = useState('contact') // 'contact' or 'appointment'

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)

    try {
      const { error } = await submitContactForm(
        formData.name,
        formData.email,
        formData.message
      )
      if (error) throw error

      toast.success('Message sent successfully! I will get back to you soon.')
      setFormData({ name: '', email: '', message: '' })
    } catch (error) {
      console.error('Error sending message:', error)
      toast.error('Failed to send message. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleBookAppointment = () => {
    // Redirect to sign in page
    toast.loading('Redirecting to sign in...')
    setTimeout(() => {
      navigate('/signin') // Adjust this route to match your signin page
    }, 1000)
  }

  const appointmentPackages = [
    {
      name: 'Portrait Session',
      duration: '1-2 hours',
      price: '₦50,000',
      includes: ['Professional editing', '10 digital photos', 'Online gallery'],
      popular: false
    },
    {
      name: 'Wedding Package',
      duration: 'Full day',
      price: '₦200,000',
      includes: ['2 photographers', 'All digital photos', 'Premium album', 'Online gallery'],
      popular: true
    },
    {
      name: 'Event Coverage',
      duration: '4 hours',
      price: '₦100,000',
      includes: ['Professional editing', '50+ digital photos', 'Online gallery'],
      popular: false
    }
  ]

  return (
    <section id="contact" className="py-20 bg-gradient-to-br from-slate-50 to-blue-50 relative overflow-hidden" ref={ref}>
      {/* Background decorative elements */}
      <div className="absolute top-0 left-0 w-72 h-72 bg-purple-100 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob"></div>
      <div className="absolute top-0 right-0 w-72 h-72 bg-yellow-100 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-2000"></div>
      <div className="absolute -bottom-8 left-20 w-72 h-72 bg-pink-100 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-4000"></div>
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8 }}
          className="text-center mb-16"
        >
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="inline-flex items-center px-4 py-2 rounded-full bg-purple-100 text-purple-800 text-sm font-medium mb-4"
          >
            <span className="w-2 h-2 bg-purple-500 rounded-full mr-2"></span>
            Get In Touch
          </motion.div>
          
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="text-4xl md:text-5xl font-bold text-gray-900 mb-4"
          >
            Let's Create <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-600">Magic</span> Together
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="text-xl text-gray-600 max-w-2xl mx-auto"
          >
            Ready to capture your special moments? Choose how you'd like to connect with me.
          </motion.p>
        </motion.div>

        {/* Tab Navigation */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, delay: 0.5 }}
          className="flex justify-center mb-12"
        >
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-2 shadow-lg border border-gray-200">
            <div className="flex space-x-2">
              <button
                onClick={() => setActiveTab('contact')}
                className={`px-8 py-3 rounded-xl font-semibold transition-all duration-300 ${
                  activeTab === 'contact'
                    ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <MessageCircle className="w-5 h-5 inline mr-2" />
                Send Message
              </button>
              <button
                onClick={() => setActiveTab('appointment')}
                className={`px-8 py-3 rounded-xl font-semibold transition-all duration-300 ${
                  activeTab === 'appointment'
                    ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <Calendar className="w-5 h-5 inline mr-2" />
                Book Session
              </button>
            </div>
          </div>
        </motion.div>

        <div className="grid lg:grid-cols-2 gap-12">
          {/* Left Column - Contact Info & Appointment Packages */}
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="space-y-8"
          >
            {/* Contact Information */}
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-8 shadow-lg border border-gray-200">
              <h3 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
                <MessageCircle className="w-6 h-6 mr-3 text-purple-600" />
                Get in Touch
              </h3>
              <div className="space-y-6">
                <motion.div 
                  className="flex items-center space-x-4 p-4 rounded-xl hover:bg-purple-50 transition-colors group"
                  whileHover={{ x: 5 }}
                >
                  <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Mail className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h4 className="text-lg font-semibold text-gray-900">Email</h4>
                    <p className="text-gray-600">hello@plenathegrapher.com</p>
                  </div>
                </motion.div>

                <motion.div 
                  className="flex items-center space-x-4 p-4 rounded-xl hover:bg-purple-50 transition-colors group"
                  whileHover={{ x: 5 }}
                >
                  <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Phone className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h4 className="text-lg font-semibold text-gray-900">Phone</h4>
                    <p className="text-gray-600">+234 706 055 3627</p>
                  </div>
                </motion.div>

                <motion.div 
                  className="flex items-center space-x-4 p-4 rounded-xl hover:bg-purple-50 transition-colors group"
                  whileHover={{ x: 5 }}
                >
                  <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                    <MapPin className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h4 className="text-lg font-semibold text-gray-900">Studio</h4>
                    <p className="text-gray-600">Lagos State, Nigeria</p>
                  </div>
                </motion.div>
              </div>
            </div>

            {/* Business Hours */}
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-8 shadow-lg border border-gray-200">
              <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <Clock className="w-5 h-5 mr-2 text-purple-600" />
                Business Hours
              </h4>
              <div className="space-y-3 text-gray-600">
                <div className="flex justify-between py-2 border-b border-gray-100">
                  <span>Monday - Friday</span>
                  <span className="font-semibold text-gray-900">9:00 AM - 6:00 PM</span>
                </div>
                <div className="flex justify-between py-2 border-b border-gray-100">
                  <span>Saturday</span>
                  <span className="font-semibold text-gray-900">10:00 AM - 4:00 PM</span>
                </div>
                <div className="flex justify-between py-2">
                  <span>Sunday</span>
                  <span className="font-semibold text-gray-900">By appointment only</span>
                </div>
              </div>
            </div>

            {/* WhatsApp Button */}
            <motion.a
              href="https://wa.me/2347060553627"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center space-x-3 bg-gradient-to-r from-green-500 to-green-600 text-white px-8 py-4 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 w-full group"
              whileHover={{ scale: 1.02, y: -2 }}
            >
              <MessageCircle className="w-6 h-6" />
              <span className="font-semibold text-lg">Message on WhatsApp</span>
            </motion.a>
          </motion.div>

          {/* Right Column - Dynamic Content based on Tab */}
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.8, delay: 0.4 }}
          >
            {activeTab === 'contact' ? (
              /* Contact Form */
              <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-8 shadow-lg border border-gray-200">
                <h3 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
                  <Send className="w-6 h-6 mr-3 text-purple-600" />
                  Send Me a Message
                </h3>
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div>
                    <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                      Your Name *
                    </label>
                    <input
                      type="text"
                      id="name"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-colors bg-white/50"
                      required
                    />
                  </div>

                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                      Email Address *
                    </label>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-colors bg-white/50"
                      required
                    />
                  </div>

                  <div>
                    <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-2">
                      Your Message *
                    </label>
                    <textarea
                      id="message"
                      name="message"
                      rows={6}
                      value={formData.message}
                      onChange={handleChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-colors bg-white/50 resize-none"
                      placeholder="Tell me about your photography needs, project ideas, or any questions you might have..."
                      required
                    />
                  </div>

                  <motion.button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white py-4 px-6 rounded-xl hover:shadow-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-3 font-semibold"
                    whileHover={{ scale: loading ? 1 : 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    {loading ? (
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{
                          duration: 1,
                          repeat: Infinity,
                          ease: 'linear'
                        }}
                        className="w-6 h-6 border-2 border-white border-t-transparent rounded-full"
                      />
                    ) : (
                      <>
                        <Send className="w-5 h-5" />
                        <span>Send Message</span>
                      </>
                    )}
                  </motion.button>
                </form>
              </div>
            ) : (
              /* Appointment Booking Section */
              <div className="space-y-6">
                <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-8 shadow-lg border border-gray-200">
                  <h3 className="text-2xl font-bold text-gray-900 mb-2 flex items-center">
                    <Calendar className="w-6 h-6 mr-3 text-purple-600" />
                    Book Your Session
                  </h3>
                  <p className="text-gray-600 mb-6">
                    Choose from our popular photography packages. Sign in to book your session and manage your appointments.
                  </p>

                  <div className="space-y-6">
                    {appointmentPackages.map((pkg, index) => (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className={`border-2 rounded-2xl p-6 transition-all duration-300 hover:shadow-lg ${
                          pkg.popular
                            ? 'border-purple-500 bg-gradient-to-br from-purple-50 to-pink-50'
                            : 'border-gray-200 hover:border-purple-300'
                        }`}
                      >
                        {pkg.popular && (
                          <div className="inline-flex items-center px-3 py-1 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 text-white text-sm font-medium mb-4">
                            <Star className="w-3 h-3 mr-1 fill-current" />
                            Most Popular
                          </div>
                        )}
                        
                        <div className="flex justify-between items-start mb-4">
                          <div>
                            <h4 className="text-xl font-bold text-gray-900">{pkg.name}</h4>
                            <p className="text-gray-600 flex items-center mt-1">
                              <Clock className="w-4 h-4 mr-1" />
                              {pkg.duration}
                            </p>
                          </div>
                          <div className="text-right">
                            <div className="text-2xl font-bold text-purple-600">{pkg.price}</div>
                            <div className="text-sm text-gray-500">starting from</div>
                          </div>
                        </div>

                        <ul className="space-y-2 mb-6">
                          {pkg.includes.map((item, itemIndex) => (
                            <li key={itemIndex} className="flex items-center text-gray-700">
                              <div className="w-2 h-2 bg-purple-500 rounded-full mr-3"></div>
                              {item}
                            </li>
                          ))}
                        </ul>

                        <motion.button
                          onClick={handleBookAppointment}
                          className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white py-3 px-6 rounded-xl font-semibold hover:shadow-lg transition-all duration-300 flex items-center justify-center space-x-2"
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                        >
                          <LogIn className="w-4 h-4" />
                          <span>Sign In to Book</span>
                        </motion.button>
                      </motion.div>
                    ))}
                  </div>
                </div>

                {/* Sign In CTA */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                  className="bg-gradient-to-r from-purple-500 to-pink-500 rounded-2xl p-8 text-center text-white"
                >
                  <LogIn className="w-12 h-12 mx-auto mb-4" />
                  <h4 className="text-xl font-bold mb-2">Already Have an Account?</h4>
                  <p className="mb-4 opacity-90">
                    Sign in to book appointments, view your session history, and manage your photography projects.
                  </p>
                  <motion.button
                    onClick={handleBookAppointment}
                    className="bg-white text-purple-600 px-8 py-3 rounded-xl font-semibold hover:bg-gray-100 transition-colors flex items-center justify-center space-x-2 mx-auto"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <LogIn className="w-5 h-5" />
                    <span>Sign In Now</span>
                  </motion.button>
                </motion.div>

                {/* New User CTA */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.6 }}
                  className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-gray-200 text-center"
                >
                  <h4 className="text-lg font-bold text-gray-900 mb-2">New to PLENATHEGRAPHER?</h4>
                  <p className="text-gray-600 mb-4">
                    Create an account to book sessions, save your preferences, and get exclusive offers.
                  </p>
                  <motion.button
                    onClick={() => navigate('/signup')} // Adjust to your signup route
                    className="bg-gradient-to-r from-gray-700 to-gray-900 text-white px-6 py-3 rounded-xl font-semibold hover:shadow-lg transition-all duration-300"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    Create Account
                  </motion.button>
                </motion.div>
              </div>
            )}
          </motion.div>
        </div>

        {/* Live Map */}
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8, delay: 0.6 }}
          className="mt-16 rounded-2xl overflow-hidden shadow-xl border border-gray-200"
        >
          <div className="bg-white/80 backdrop-blur-sm p-6 border-b border-gray-200">
            <h3 className="text-xl font-bold text-gray-900 flex items-center">
              <MapPin className="w-5 h-5 mr-2 text-purple-600" />
              Studio Location
            </h3>
          </div>
          <iframe
            src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d126913.224211764!2d3.30761225!3d6.5243793!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x103b8b123456789%3A0xabcdef123456789!2sLagos%20State%2C%20Nigeria!5e0!3m2!1sen!2sng!4v1694000000000!5m2!1sen!2sng"
            width="100%"
            height="400"
            style={{ border: 0 }}
            allowFullScreen=""
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            className="filter saturate-150 contrast-125"
          ></iframe>
        </motion.div>
      </div>
    </section>
  )
}

export default Contact