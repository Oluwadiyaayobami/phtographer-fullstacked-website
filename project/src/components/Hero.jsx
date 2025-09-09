import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowDown } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const images = [
  {
    url: 'https://images.pexels.com/photos/1264210/pexels-photo-1264210.jpeg?auto=compress&cs=tinysrgb&w=1920&h=1080',
    title: 'CAPTURING',
    subtitle: 'MOMENTS'
  },
  {
    url: 'https://images.pexels.com/photos/1005414/pexels-photo-1005414.jpeg?auto=compress&cs=tinysrgb&w=1920&h=1080',
    title: 'NATURE',
    subtitle: 'WONDERS'
  },
  {
    url: 'https://images.pexels.com/photos/210647/pexels-photo-210647.jpeg?auto=compress&cs=tinysrgb&w=1920&h=1080',
    title: 'CITY',
    subtitle: 'LIGHTS'
  },
  {
    url: 'https://images.pexels.com/photos/207962/pexels-photo-207962.jpeg?auto=compress&cs=tinysrgb&w=1920&h=1080',
    title: 'TIMELESS',
    subtitle: 'PORTRAITS'
  },
  {
    url: 'https://images.pexels.com/photos/1150407/pexels-photo-1150407.jpeg?auto=compress&cs=tinysrgb&w=1920&h=1080',
    title: 'CREATIVE',
    subtitle: 'ANGLES'
  },
  {
    url: 'https://images.pexels.com/photos/270360/pexels-photo-270360.jpeg?auto=compress&cs=tinysrgb&w=1920&h=1080',
    title: 'WILD',
    subtitle: 'ADVENTURES'
  },
  {
    url: 'https://images.pexels.com/photos/1629211/pexels-photo-1629211.jpeg?auto=compress&cs=tinysrgb&w=1920&h=1080',
    title: 'CULTURE',
    subtitle: 'STORIES'
  },
  {
    url: 'https://images.pexels.com/photos/325185/pexels-photo-325185.jpeg?auto=compress&cs=tinysrgb&w=1920&h=1080',
    title: 'ELEGANT',
    subtitle: 'WEDDINGS'
  },
  {
    url: 'https://images.pexels.com/photos/459225/pexels-photo-459225.jpeg?auto=compress&cs=tinysrgb&w=1920&h=1080',
    title: 'DRAMATIC',
    subtitle: 'SHOTS'
  },
  {
    url: 'https://images.pexels.com/photos/374870/pexels-photo-374870.jpeg?auto=compress&cs=tinysrgb&w=1920&h=1080',
    title: 'EVERYDAY',
    subtitle: 'MOMENTS'
  }
];

const Hero = () => {
  const [currentImage, setCurrentImage] = useState(0);
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentImage((prev) => (prev + 1) % images.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleButtonClick = () => {
    if (user) {
      // Navigate to dashboard if user is logged in
      navigate(user.role === 'admin' ? '/admin-dashboard' : '/user-dashboard');
    } else {
      // Scroll to gallery for guests
      const galleryElement = document.getElementById('gallery');
      if (galleryElement) {
        galleryElement.scrollIntoView({ behavior: 'smooth' });
      }
    }
  };

  return (
    <section className="relative h-screen flex items-center justify-center overflow-hidden">
      {/* Animated Background */}
      <AnimatePresence>
        <motion.div
          key={currentImage}
          className="absolute inset-0 bg-cover bg-center z-0"
          style={{ backgroundImage: `url(${images[currentImage].url})` }}
          initial={{ opacity: 0, scale: 1.1 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 1.1 }}
          transition={{ duration: 1.5 }}
        />
      </AnimatePresence>

      {/* Dark overlay */}
      <div className="absolute inset-0 bg-black/50 z-0" />

      {/* Content */}
      <div className="relative z-10 text-center text-white max-w-4xl mx-auto px-4">
        <motion.h1
          key={images[currentImage].title}
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -50 }}
          transition={{ duration: 1 }}
          className="text-5xl md:text-7xl font-bold mb-6 leading-tight"
        >
          {images[currentImage].title}
          <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-400">
            {images[currentImage].subtitle}
          </span>
        </motion.h1>

        <motion.p
          key={currentImage}
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -30 }}
          transition={{ duration: 1, delay: 0.4 }}
          className="text-xl md:text-2xl mb-8 text-gray-200 max-w-2xl mx-auto"
        >
          Professional photography that brings out the beauty in every story — landscapes, portraits, and beyond.
        </motion.p>

        <motion.button
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.6 }}
          onClick={handleButtonClick}
          className="group bg-white text-black px-8 py-4 rounded-full font-semibold text-lg hover:bg-gray-200 transition-all duration-300 transform hover:scale-105"
        >
          {user ? 'Go to Dashboard' : 'Explore Gallery'}
          <ArrowDown className="inline-block ml-2 group-hover:translate-y-1 transition-transform" size={20} />
        </motion.button>
      </div>

      {/* Scroll Indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1, delay: 1 }}
        className="absolute bottom-8 left-1/2 transform -translate-x-1/2"
      >
        <motion.div
          animate={{ y: [0, 10, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="w-6 h-10 border-2 border-white rounded-full flex justify-center"
        >
          <div className="w-1 h-2 bg-white rounded-full mt-2" />
        </motion.div>
      </motion.div>
    </section>
  );
};

export default Hero;
