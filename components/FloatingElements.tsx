'use client'

import React from 'react'
import { motion } from 'motion/react'

export function FloatingElements() {
  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden">
      {/* Floating red accents */}
      <motion.div
        className="absolute top-20 left-10 w-3 h-3 bg-red-600 rounded-full opacity-20"
        animate={{
          y: [0, -20, 0],
          x: [0, 10, 0],
        }}
        transition={{
          duration: 6,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />
      <motion.div
        className="absolute top-40 right-20 w-2 h-2 bg-red-600 rounded-full opacity-30"
        animate={{
          y: [0, 15, 0],
          x: [0, -15, 0],
        }}
        transition={{
          duration: 8,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 1,
        }}
      />
      <motion.div
        className="absolute bottom-40 left-1/4 w-4 h-4 bg-red-600 rounded-full opacity-15"
        animate={{
          y: [0, -25, 0],
          x: [0, 20, 0],
        }}
        transition={{
          duration: 7,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 2,
        }}
      />
      <motion.div
        className="absolute bottom-20 right-1/3 w-2 h-2 bg-red-600 rounded-full opacity-25"
        animate={{
          y: [0, 18, 0],
          x: [0, -12, 0],
        }}
        transition={{
          duration: 9,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 3,
        }}
      />
    </div>
  )
}


