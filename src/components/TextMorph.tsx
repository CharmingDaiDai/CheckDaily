import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import { spring } from '@/lib/motion'

interface TextMorphProps {
  children: React.ReactNode
  id: string | number
  className?: string
}

export function TextMorph({ children, id, className }: TextMorphProps) {
  const reduceMotion = useReducedMotion()

  return (
    <AnimatePresence mode="popLayout">
      <motion.span
        key={id}
        className={className}
        initial={reduceMotion ? false : { opacity: 0, y: 8, filter: 'blur(2px)' }}
        animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
        exit={reduceMotion ? { opacity: 0 } : { opacity: 0, y: -8, filter: 'blur(2px)' }}
        transition={reduceMotion ? { duration: 0.1 } : spring.smooth}
      >
        {children}
      </motion.span>
    </AnimatePresence>
  )
}
