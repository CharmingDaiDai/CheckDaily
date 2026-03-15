import confetti from 'canvas-confetti'

interface CelebrateOptions {
  colors?: string[]
  origin?: { x: number; y: number }
}

/**
 * Fire a multi-stage confetti burst from the given viewport position.
 * Uses canvas-confetti which manages its own <canvas> overlay.
 */
export function celebrate(options?: CelebrateOptions) {
  const { colors = ['#f97316', '#fbbf24', '#ffffff'], origin = { x: 0.5, y: 0.5 } } = options ?? {}

  const defaults = {
    origin,
    colors,
    zIndex: 9999,
    disableForReducedMotion: true,
  }

  // Burst 1: wide spread, medium velocity
  confetti({
    ...defaults,
    particleCount: 28,
    spread: 70,
    startVelocity: 30,
    gravity: 1.2,
    ticks: 120,
    shapes: ['circle', 'square'],
    scalar: 0.9,
  })

  // Burst 2: narrower spread, higher velocity (second wave)
  setTimeout(() => {
    confetti({
      ...defaults,
      particleCount: 18,
      spread: 50,
      startVelocity: 40,
      gravity: 1.2,
      ticks: 120,
      shapes: ['circle', 'square'],
      scalar: 0.8,
    })
  }, 100)

  // Burst 3: wide sparkle tail with stars
  setTimeout(() => {
    confetti({
      ...defaults,
      particleCount: 10,
      spread: 100,
      startVelocity: 20,
      gravity: 0.8,
      ticks: 150,
      shapes: ['star'],
      scalar: 1.1,
    })
  }, 200)
}
