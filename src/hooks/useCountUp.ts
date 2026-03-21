import { useState, useEffect, useRef } from 'react'

export function useCountUp(target: number, duration = 600) {
  const [value, setValue] = useState(0)
  const rafRef = useRef<number>(0)

  useEffect(() => {
    if (target === 0) {
      setValue(0)
      return
    }

    const start = performance.now()

    function tick(now: number) {
      const elapsed = now - start
      const progress = Math.min(elapsed / duration, 1)
      // Damped spring overshoot: slightly overshoots then settles
      const overshoot = 1 + (0.08 * Math.exp(-8 * progress) * Math.sin(12 * progress))
      const eased = (1 - Math.pow(1 - progress, 3)) * overshoot
      setValue(Math.round(eased * target))

      if (progress < 1) {
        rafRef.current = requestAnimationFrame(tick)
      } else {
        setValue(target) // ensure exact final value
      }
    }

    rafRef.current = requestAnimationFrame(tick)
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
    }
  }, [target, duration])

  return value
}
