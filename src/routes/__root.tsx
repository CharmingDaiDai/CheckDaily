import { useLayoutEffect, useMemo, useRef } from 'react'
import { createRootRouteWithContext, Outlet } from '@tanstack/react-router'
import { useRouterState } from '@tanstack/react-router'
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import { useAuthInit } from '@/hooks/useAuth'
import { useAuthStore } from '@/store/authStore'
import { ErrorBoundary } from '@/components/ErrorBoundary'
import { Toaster } from '@/components/ui/toast'
import { OfflineBanner } from '@/components/OfflineBanner'
import { Sidebar } from '@/components/layout/Sidebar'
import { BottomNav } from '@/components/layout/BottomNav'
import {
  directionalRouteTransition,
  directionalRouteTransitionReduced,
  spring,
} from '@/lib/motion'
import type { RouterContext } from '@/main'

const routeRank: Record<string, number> = {
  '/login': 0,
  '/auth/callback': 0,
  '/': 1,
  '/habits': 2,
  '/stats': 3,
  '/stats/$habitId': 4,
  '/profile': 5,
}

function normalizePath(pathname: string): string {
  if (pathname.startsWith('/stats/') && pathname !== '/stats' && pathname !== '/stats/') {
    return '/stats/$habitId'
  }
  if (pathname === '/stats/' || pathname === '/stats') {
    return '/stats'
  }
  return pathname
}

function RootLayout() {
  useAuthInit()
  const { loading, user } = useAuthStore()
  const { location } = useRouterState()
  const reduceMotion = useReducedMotion()
  const prevPathRef = useRef(location.pathname)
  const mainRef = useRef<HTMLElement | null>(null)
  const direction = useMemo(() => {
    const currentPath = normalizePath(location.pathname)
    const prevPath = normalizePath(prevPathRef.current)
    const prevRank = routeRank[prevPath] ?? 0
    const currentRank = routeRank[currentPath] ?? 0
    if (currentRank > prevRank) return 1
    if (currentRank < prevRank) return -1
    return 0
  }, [location.pathname])

  useLayoutEffect(() => {
    prevPathRef.current = location.pathname
  }, [location.pathname])

  const routeVariants = useMemo(
    () => (reduceMotion ? directionalRouteTransitionReduced : directionalRouteTransition),
    [reduceMotion]
  )

  const resetScrollPosition = () => {
    window.scrollTo(0, 0)
    mainRef.current?.scrollTo({ top: 0, left: 0, behavior: 'auto' })
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[radial-gradient(circle_at_50%_10%,rgb(251_146_60/0.18),transparent_40%),linear-gradient(180deg,#fffdf9_0%,#f6f3ee_60%,#f1ede7_100%)]">
        <motion.div
          className="flex flex-col items-center gap-4"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={spring.gentle}
        >
          <motion.div
            className="w-12 h-12 rounded-2xl bg-gradient-to-b from-brand-400 to-brand-600 flex items-center justify-center shadow-[0_10px_24px_rgb(249_115_22/0.35)]"
            initial={{ scale: 0.6, rotate: -12 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={spring.emphasized}
          >
            <span className="text-white text-2xl">🔥</span>
          </motion.div>
          <motion.div
            className="w-5 h-5 border-2 border-brand-500/30 border-t-brand-500 rounded-full animate-spin"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.3 }}
          />
        </motion.div>
      </div>
    )
  }

  if (!user) {
    return (
      <ErrorBoundary>
        <AnimatePresence
          mode="wait"
          initial={false}
          onExitComplete={resetScrollPosition}
        >
          <motion.div
            key={location.pathname}
            custom={direction}
            initial="initial"
            animate="animate"
            exit="exit"
            variants={routeVariants}
          >
            <Outlet />
          </motion.div>
        </AnimatePresence>
        <Toaster />
      </ErrorBoundary>
    )
  }

  return (
    <ErrorBoundary>
      <OfflineBanner />
      <div className="flex min-h-screen md:h-dvh md:min-h-0">
        <Sidebar />
        <main
          ref={mainRef}
          className="flex-1 pb-bottom-nav md:pb-0 min-h-screen overflow-x-hidden md:h-dvh md:min-h-0 md:overflow-y-auto"
        >
          <AnimatePresence
            mode="wait"
            initial={false}
            onExitComplete={resetScrollPosition}
          >
            <motion.div
              key={location.pathname}
              custom={direction}
              initial="initial"
              animate="animate"
              exit="exit"
              variants={routeVariants}
              className="min-h-screen overflow-x-hidden w-full md:min-h-full"
            >
              <Outlet />
            </motion.div>
          </AnimatePresence>
        </main>
        <BottomNav />
      </div>
      <Toaster />
    </ErrorBoundary>
  )
}

export const Route = createRootRouteWithContext<RouterContext>()({
  component: RootLayout,
})
