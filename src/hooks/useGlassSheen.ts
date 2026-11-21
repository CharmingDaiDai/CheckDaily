import { useEffect } from 'react'

const GLASS_SELECTOR = '.surface-frame, .glass-card, .glass-tile, .floating-chrome'

/** One delegated, frame-batched highlight for all glass surfaces. */
export function useGlassSheen() {
  useEffect(() => {
    const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)')
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)')
    const reducedTransparency = window.matchMedia('(prefers-reduced-transparency: reduce)')
    const increasedContrast = window.matchMedia('(prefers-contrast: more)')
    const preferences = [finePointer, reducedMotion, reducedTransparency, increasedContrast]
    let current: HTMLElement | null = null
    let frame: number | null = null
    let pending: { el: HTMLElement; x: number; y: number } | null = null

    const enabled = () => finePointer.matches && !reducedMotion.matches
      && !reducedTransparency.matches && !increasedContrast.matches

    const reset = () => {
      if (frame !== null) cancelAnimationFrame(frame)
      frame = null
      pending = null
      current?.style.removeProperty('--glass-sheen')
      current = null
    }

    const handleMove = (event: PointerEvent) => {
      if (!enabled() || event.pointerType === 'touch') return
      const el = event.target instanceof Element
        ? event.target.closest<HTMLElement>(GLASS_SELECTOR)
        : null
      if (!el) {
        reset()
        return
      }
      pending = { el, x: event.clientX, y: event.clientY }
      if (frame !== null) return
      frame = requestAnimationFrame(() => {
        frame = null
        const sample = pending
        pending = null
        if (!sample || !sample.el.isConnected) {
          reset()
          return
        }
        // Read layout once per frame, before writing any styles.
        const rect = sample.el.getBoundingClientRect()
        if (!rect.width || !rect.height) {
          reset()
          return
        }
        if (current !== sample.el) current?.style.removeProperty('--glass-sheen')
        current = sample.el
        current.style.setProperty('--glass-x', `${((sample.x - rect.left) / rect.width) * 100}%`)
        current.style.setProperty('--glass-y', `${((sample.y - rect.top) / rect.height) * 100}%`)
        current.style.setProperty('--glass-sheen', '1')
      })
    }

    const handleOut = (event: PointerEvent) => {
      if (event.relatedTarget === null) reset()
    }

    window.addEventListener('pointermove', handleMove, { passive: true })
    window.addEventListener('pointerout', handleOut, { passive: true })
    window.addEventListener('blur', reset)
    window.addEventListener('scroll', reset, { passive: true, capture: true })
    preferences.forEach((query) => query.addEventListener('change', reset))

    return () => {
      window.removeEventListener('pointermove', handleMove)
      window.removeEventListener('pointerout', handleOut)
      window.removeEventListener('blur', reset)
      window.removeEventListener('scroll', reset, true)
      preferences.forEach((query) => query.removeEventListener('change', reset))
      reset()
    }
  }, [])
}
