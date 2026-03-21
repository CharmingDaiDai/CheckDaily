import { useRef } from 'react'
import { motion, useInView, useReducedMotion } from 'motion/react'
import { spring } from '@/lib/motion'

interface AnimateOnScrollProps {
  children: React.ReactNode
  className?: string
}

export function AnimateOnScroll({ children, className }: AnimateOnScrollProps) {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: '-60px' })
  const reduceMotion = useReducedMotion()

  return (
    <motion.div
      ref={ref}
      initial={reduceMotion ? false : { opacity: 0, y: 16 }}
      animate={inView ? { opacity: 1, y: 0 } : undefined}
      transition={reduceMotion ? { duration: 0.15 } : spring.smooth}
      className={className}
    >
      {children}
    </motion.div>
  )
}
