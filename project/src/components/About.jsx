import React, { useRef } from 'react'
import { motion, useInView } from 'framer-motion'
import { useEffect, useState } from 'react'

const About = () => {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, threshold: 0.3 })

  const skills = [
    { name: 'Portrait Photography', percent: 95 },
    { name: 'Wedding Photography', percent: 90 },
    { name: 'Landscape Photography', percent: 85 },
    { name: 'Photo Editing', percent: 92 },
    { name: 'Creative Composition', percent: 88 },
  ]

  const stats = [
    { label: 'Years of Experience', value: 10, suffix: '+' },
    { label: 'Images Captured', value: 500, suffix: '+' },
    { label: 'Happy Clients', value: 100, suffix: '+' },
    { label: 'Awards Won', value: 15, suffix: '+' },
  ]

  // Hook to animate numbers when in view
  const [counts, setCounts] = useState(stats.map(() => 0))
  useEffect(() => {
    if (isInView) {
      stats.forEach((stat, i) => {
        let start = 0
        const end = stat.value
        const duration = 1500
        const stepTime = Math.abs(Math.floor(duration / end))

        const timer = setInterval(() => {
          start += 1
          setCounts((prev) => {
            const updated = [...prev]
            updated[i] = start
            return updated
          })
          if (start === end) clearInterval(timer)
        }, stepTime)
      })
    }
  }, [isInView])

  return (
    <section id="about" className="py-20 bg-gray-50" ref={ref}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Text Content */}
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.8 }}
          >
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="text-4xl md:text-5xl font-bold text-gray-900 mb-6"
            >
              Oluwafemi Omole
            </motion.h2>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="space-y-4 text-lg text-gray-700 leading-relaxed mb-8"
            >
              <p>
                Welcome to PLENATHEGRAPHER, where every frame tells a story and every 
                moment becomes timeless. With over a decade of experience in professional 
                photography, I specialize in capturing the essence of life's most precious moments.
              </p>
              
              <p>
                My passion lies in creating visual narratives that speak to the heart. 
                Whether it's the intimate moments of a wedding, the raw energy of a portrait 
                session, or the serene beauty of landscapes, I approach each project with 
                artistic vision and technical excellence.
              </p>

              <p>
                Each photograph in my collection is carefully curated and protected, 
                ensuring that the artistic integrity and exclusivity of the work is maintained. 
                I believe in the power of premium photography to transform spaces and preserve memories.
              </p>
            </motion.div>
          </motion.div>

          {/* Interactive Image */}
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="relative flex justify-center"
          >
            <motion.div
              whileHover={{ scale: 1.05, rotateY: 10, rotateX: 5 }}
              transition={{ type: 'spring', stiffness: 200, damping: 15 }}
              className="relative overflow-hidden rounded-2xl shadow-2xl group"
            >
              <img
                src="https://images.pexels.com/photos/1264210/pexels-photo-1264210.jpeg?auto=compress&cs=tinysrgb&w=800&h=1000&fit=crop"
                alt="Photographer at work"
                className="w-full h-96 lg:h-full object-cover transform 
                           group-hover:scale-110 transition-transform duration-700"
                onContextMenu={(e) => e.preventDefault()}
                draggable={false}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent 
                              opacity-0 group-hover:opacity-100 transition-opacity duration-500 flex 
                              items-end justify-center pb-6">
                <p className="text-white text-lg font-semibold">
                  Capturing Timeless Stories 📸
                </p>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </div>

      {/* Stats Section */}
      <div className="mt-16 bg-gray-900 py-16">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          {stats.map((stat, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 30 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.6, delay: index * 0.2 }}
              whileHover={{ scale: 1.1, rotate: -2 }}
              className="p-6 bg-gray-800 rounded-xl shadow-lg hover:shadow-2xl 
                         hover:bg-gradient-to-r hover:from-purple-600 hover:to-pink-600 
                         transition-all cursor-pointer"
            >
              <h4 className="text-4xl font-bold text-white mb-2">
                {counts[index]}{stat.suffix}
              </h4>
              <p className="text-gray-300 font-medium">{stat.label}</p>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Skills Section */}
      <div className="mt-16 bg-white py-16">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.h3
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.8 }}
            className="text-3xl md:text-4xl font-bold text-gray-900 mb-12"
          >
            What I Excel At
          </motion.h3>

          <div className="space-y-8">
            {skills.map((skill, index) => (
              <div key={index} className="group">
                <div className="flex justify-between mb-2">
                  <span className="text-gray-900 font-semibold">{skill.name}</span>
                  <span className="text-gray-600">{skill.percent}%</span>
                </div>
                <div className="w-full h-5 bg-gray-200 rounded-full overflow-hidden shadow-inner">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={isInView ? { width: `${skill.percent}%` } : { width: 0 }}
                    transition={{ duration: 1, delay: 0.2 + index * 0.2 }}
                    className="h-5 bg-gradient-to-r from-purple-500 via-pink-500 to-red-500 
                               rounded-full group-hover:brightness-125 transition-all"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

export default About
