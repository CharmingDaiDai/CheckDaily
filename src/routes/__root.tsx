import { createRootRoute, Outlet } from '@tanstack/react-router'
import { useAuthInit } from '@/hooks/useAuth'
import { useAuthStore } from '@/store/authStore'
import { ErrorBoundary } from '@/components/ErrorBoundary'
import { Toaster } from '@/components/ui/toast'
import { OfflineBanner } from '@/components/OfflineBanner'
import { Sidebar } from '@/components/layout/Sidebar'
import { BottomNav } from '@/components/layout/BottomNav'

function RootLayout() {
  useAuthInit()
  const { loading, user } = useAuthStore()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-stone-50">
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
      <div className="flex min-h-screen bg-stone-50">
        <Sidebar />
        <main className="flex-1 pb-[80px] md:pb-0 min-h-screen">
          <Outlet />
        </main>
        <BottomNav />
      </div>
      <Toaster />
    </ErrorBoundary>
  )
}

export const Route = createRootRoute({
  component: RootLayout,
})
