import { useReducedMotion } from 'motion/react'

/* ── Durations (seconds) ── */
export const durations = {
  micro: 0.1,
  fast: 0.2,
  base: 0.32,
  slow: 0.5,
  glacial: 0.72,
} as const

/* ── Spring transitions ── */
export const spring = {
  smooth:     { type: 'spring' as const, stiffness: 400, damping: 30 },
  gentle:     { type: 'spring' as const, stiffness: 200, damping: 26, mass: 1.2 },
  snappy:     { type: 'spring' as const, stiffness: 500, damping: 30, mass: 0.8 },
  emphasized: { type: 'spring' as const, stiffness: 300, damping: 22 },
  exit:       { duration: durations.fast as number, ease: [0.4, 0, 1, 1] as [number, number, number, number] },
}

/* ── Legacy easing (for CSS-aligned tweens) ── */
export const easing = {
  smooth:    [0.22, 0.61, 0.36, 1] as const,
  springOut: [0.34, 1.56, 0.64, 1] as const,
  exit:      [0.4, 0, 1, 1] as const,
} as const

/* ── Page choreography (stagger container) ── */
export const pageChoreography = {
  initial: { opacity: 0 },
  animate: {
    opacity: 1,
    transition: {
      when: 'beforeChildren' as const,
      staggerChildren: 0.07,
      delayChildren: 0.08,
    },
  },
}

/* ── Section reveal (blocks float up) ── */
export const sectionReveal = {
  initial: { opacity: 0, y: 20, scale: 0.98 },
  animate: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: spring.gentle,
  },
}

/* ── Card entrance (playful bounce) ── */
export const cardEntrance = {
  initial: { opacity: 0, y: 24, scale: 0.95 },
  animate: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: spring.emphasized,
  },
}

/* ── Stat number reveal (crystallize) ── */
export const statNumberReveal = {
  initial: { opacity: 0, y: 12, filter: 'blur(4px)' },
  animate: {
    opacity: 1,
    y: 0,
    filter: 'blur(0px)',
    transition: spring.smooth,
  },
}

/* ── List item slide ── */
export const listItemSlide = {
  initial: { opacity: 0, x: -16 },
  animate: {
    opacity: 1,
    x: 0,
    transition: spring.smooth,
  },
}

/* ── Route transition (spring + blur) ── */
export const routeTransition = {
  initial: { opacity: 0, y: 12, filter: 'blur(2px)' },
  animate: {
    opacity: 1,
    y: 0,
    filter: 'blur(0px)',
    transition: spring.gentle,
  },
  exit: {
    opacity: 0,
    y: -6,
    filter: 'blur(2px)',
    transition: spring.exit,
  },
}

export const routeTransitionReduced = {
  initial: { opacity: 0 },
  animate: {
    opacity: 1,
    transition: { duration: durations.fast, ease: easing.smooth },
  },
  exit: {
    opacity: 0,
    transition: { duration: durations.micro, ease: easing.exit },
  },
}

/* ── Directional route transition ── */
export const directionalRouteTransition = {
  initial: { opacity: 0, scale: 0.96, y: 15, filter: 'blur(2px)' },
  animate: {
    opacity: 1,
    scale: 1,
    y: 0,
    filter: 'blur(0px)',
    transition: spring.gentle,
  },
  exit: {
    opacity: 0,
    scale: 0.98,
    filter: 'blur(1px)',
    transition: spring.exit,
  },
}

export const directionalRouteTransitionReduced = {
  initial: { opacity: 0 },
  animate: {
    opacity: 1,
    transition: { duration: durations.fast, ease: easing.smooth },
  },
  exit: {
    opacity: 0,
    transition: { duration: durations.micro, ease: easing.exit },
  },
}

/* ── Section stagger ── */
export const sectionStagger = {
  initial: { opacity: 0 },
  animate: {
    opacity: 1,
    transition: {
      when: 'beforeChildren' as const,
      staggerChildren: 0.06,
      delayChildren: 0.05,
    },
  },
}

/* ── Item rise (legacy compat) ── */
export const itemRise = {
  initial: { opacity: 0, y: 14 },
  animate: {
    opacity: 1,
    y: 0,
    transition: spring.smooth,
  },
}

/* ── Hover / press presets ── */
export const hoverLift = {
  whileHover: { y: -3, transition: spring.smooth },
  whileTap: { scale: 0.97, transition: spring.snappy },
}

export const pressScale = {
  whileTap: { scale: 0.96, transition: spring.snappy },
}

/* ── Reduced motion helper ── */
export function useReducedMotionVariants<T>(full: T, reduced: T): T {
  const shouldReduce = useReducedMotion()
  return shouldReduce ? reduced : full
}
