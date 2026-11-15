import { useEffect, useRef } from 'react'
import { createRootRouteWithContext, Outlet, useNavigate } from '@tanstack/react-router'
import { useRouterState } from '@tanstack/react-router'
import { motion } from 'motion/react'
import { useAuthInit } from '@/hooks/useAuth'
import { useAuthStore } from '@/store/authStore'
import { ErrorBoundary } from '@/components/ErrorBoundary'
import { Toaster } from '@/components/ui/toast'
import { OfflineBanner } from '@/components/OfflineBanner'
import { Sidebar } from '@/components/layout/Sidebar'
import { BottomNav } from '@/components/layout/BottomNav'
import { spring } from '@/lib/motion'
import type { RouterContext } from '@/main'

function RootLayout() {
  useAuthInit()
  const { loading, user } = useAuthStore()
  const { location } = useRouterState()
  const navigate = useNavigate()
  const mainRef = useRef<HTMLElement | null>(null)
  const isPublicRoute = location.pathname === '/login' || location.pathname === '/auth/callback'

  useEffect(() => {
    if (loading || user || isPublicRoute) return
    void navigate({ to: '/login', replace: true })
  }, [loading, user, isPublicRoute, navigate])

  const resetScrollPosition = () => {
    window.scrollTo(0, 0)
    mainRef.current?.scrollTo({ top: 0, left: 0, behavior: 'auto' })
  }

  useEffect(() => {
    resetScrollPosition()
  }, [location.pathname])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center px-6 bg-[radial-gradient(circle_at_50%_10%,rgb(216_111_47/0.14),transparent_36%),linear-gradient(180deg,#fffdf9_0%,#f5f1ea_58%,#eee9df_100%)]">
        <motion.div
          className="surface-frame w-full max-w-sm flex flex-col items-center gap-4 px-8 py-7 text-center"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={spring.gentle}
        >
          <motion.div
            className="w-12 h-12 rounded-[0.9rem] bg-gradient-to-b from-brand-400 to-brand-600 flex items-center justify-center shadow-[0_10px_24px_rgb(185_84_34/0.22)]"
            initial={{ scale: 0.6, rotate: -12 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={spring.emphasized}
          >
            <span className="text-white text-2xl">🔥</span>
          </motion.div>
          <motion.div
            className="w-5 h-5 border-2 border-brand-500/28 border-t-brand-500 rounded-full animate-spin"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.3 }}
          />
          <div>
            <div className="font-semibold text-[var(--color-ink-900)]">正在准备今日视图</div>
            <div className="mt-1 text-sm text-[var(--color-ink-600)]">同步习惯、统计和界面状态</div>
          </div>
        </motion.div>
      </div>
    )
  }

  if (!user) {
    return (
      <ErrorBoundary>
        {isPublicRoute ? (
          <Outlet />
        ) : (
          <div className="min-h-screen flex items-center justify-center px-6 bg-[radial-gradient(circle_at_50%_10%,rgb(216_111_47/0.14),transparent_36%),linear-gradient(180deg,#fffdf9_0%,#f5f1ea_58%,#eee9df_100%)]">
            <motion.div
              className="surface-frame w-full max-w-sm flex flex-col items-center gap-4 px-8 py-7 text-center"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={spring.gentle}
            >
              <motion.div
                className="w-12 h-12 rounded-[0.9rem] bg-gradient-to-b from-brand-400 to-brand-600 flex items-center justify-center shadow-[0_10px_24px_rgb(185_84_34/0.22)]"
                initial={{ scale: 0.6, rotate: -12 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={spring.emphasized}
              >
                <span className="text-white text-2xl">🔥</span>
              </motion.div>
              <motion.div
                className="w-5 h-5 border-2 border-brand-500/28 border-t-brand-500 rounded-full animate-spin"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3, duration: 0.3 }}
              />
              <div>
                <div className="font-semibold text-[var(--color-ink-900)]">未登录或会话已过期</div>
                <div className="mt-1 text-sm text-[var(--color-ink-600)]">请重新登录后继续查看打卡数据</div>
              </div>
            </motion.div>
          </div>
        )}
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
          className="app-main-scroll flex-1 pb-bottom-nav md:pb-0 min-h-screen overflow-x-hidden md:h-dvh md:min-h-0 md:overflow-y-auto"
        >
          <div className="min-h-screen overflow-x-hidden w-full md:min-h-full">
            <Outlet />
          </div>
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
