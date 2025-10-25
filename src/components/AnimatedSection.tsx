import React from 'react'
import { motion } from 'motion/react'
import { useInView } from 'motion/react'
import { useRef } from 'react'

interface AnimatedSectionProps {
  children: React.ReactNode
  className?: string
  delay?: number
  direction?: 'up' | 'down' | 'left' | 'right'
}

export function AnimatedSection({ 
  children, 
  className = '', 
  delay = 0,
  direction = 'up'
}: AnimatedSectionProps) {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: "-50px" })

  const getInitialPosition = () => {
    switch (direction) {
      case 'up': return { y: 40, opacity: 0 }
      case 'down': return { y: -40, opacity: 0 }
      case 'left': return { x: 40, opacity: 0 }
      case 'right': return { x: -40, opacity: 0 }
      default: return { y: 40, opacity: 0 }
    }
  }

  return (
    <motion.div
      ref={ref}
      className={className}
      initial={getInitialPosition()}
      animate={isInView ? { x: 0, y: 0, opacity: 1 } : getInitialPosition()}
      transition={{
        duration: 0.6,
        delay: delay,
        ease: [0.25, 0.25, 0, 1]
      }}
    >
      {children}
    </motion.div>
  )
}