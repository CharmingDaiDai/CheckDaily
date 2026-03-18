import { createRootRouteWithContext, Outlet } from '@tanstack/react-router'
import { useAuthInit } from '@/hooks/useAuth'
import { useAuthStore } from '@/store/authStore'
import { ErrorBoundary } from '@/components/ErrorBoundary'
import { Toaster } from '@/components/ui/toast'
import { OfflineBanner } from '@/components/OfflineBanner'
import { Sidebar } from '@/components/layout/Sidebar'
import { BottomNav } from '@/components/layout/BottomNav'
import type { RouterContext } from '@/main'

function RootLayout() {
  useAuthInit()
  const { loading, user } = useAuthStore()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[radial-gradient(circle_at_50%_10%,rgb(251_146_60/0.18),transparent_40%),linear-gradient(180deg,#fffdf9_0%,#f6f3ee_60%,#f1ede7_100%)]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-brand-500 flex items-center justify-center">
            <span className="text-white text-xl">🔥</span>
          </div>
          <div className="w-5 h-5 border-2 border-brand-500/30 border-t-brand-500 rounded-full animate-spin" />
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <ErrorBoundary>
        <Outlet />
        <Toaster />
      </ErrorBoundary>
    )
  }

  return (
    <ErrorBoundary>
      <OfflineBanner />
      <div className="flex min-h-screen">
        <Sidebar />
        <main className="flex-1 pb-[80px] md:pb-0 min-h-screen animate-page-enter">
          <Outlet />
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
