import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { RouterProvider, createRouter } from '@tanstack/react-router'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { useAuthStore } from '@/store/authStore'
import { routeTree } from './routeTree.gen'
import './index.css'

export interface RouterContext {
  auth: {
    user: ReturnType<typeof useAuthStore.getState>['user']
    loading: boolean
  }
}

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 30,  // 30s
      gcTime: 1000 * 60 * 10, // 10 min
      retry: 1,
    },
  },
})

const router = createRouter({
  routeTree,
  defaultPreload: 'intent',
  context: { auth: { user: null, loading: true } },
})

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router
  }
}

function InnerApp() {
  const user = useAuthStore((s) => s.user)
  const loading = useAuthStore((s) => s.loading)
  return <RouterProvider router={router} context={{ auth: { user, loading } }} />
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <InnerApp />
      {import.meta.env.DEV && <ReactQueryDevtools initialIsOpen={false} />}
    </QueryClientProvider>
  </StrictMode>,
)
