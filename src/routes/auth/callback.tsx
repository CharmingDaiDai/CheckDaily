import { useEffect } from 'react'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { supabase } from '@/lib/supabase'
import { Flame } from 'lucide-react'

function AuthCallback() {
  const navigate = useNavigate()

  useEffect(() => {
    // Supabase handles the token from the URL automatically
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        void navigate({ to: '/', replace: true })
      } else {
        // Try to exchange the code
        const code = new URLSearchParams(window.location.search).get('code')
        if (code) {
          supabase.auth.exchangeCodeForSession(code).then(() => {
            void navigate({ to: '/', replace: true })
          })
        } else {
          void navigate({ to: '/login', replace: true })
        }
      }
    })
  }, [navigate])

  return (
    <div className="min-h-screen flex items-center justify-center px-6 bg-[radial-gradient(circle_at_50%_10%,rgb(216_111_47/0.12),transparent_34%),linear-gradient(180deg,#fffdf9_0%,#f5f1ea_58%,#eee9df_100%)]">
      <div className="surface-frame w-full max-w-xs flex flex-col items-center gap-4 px-7 py-6 text-center">
        <div className="w-14 h-14 rounded-[0.9rem] bg-brand-500 flex items-center justify-center shadow-[0_8px_24px_rgb(185_84_34/0.22)]">
          <Flame className="w-8 h-8 text-white" strokeWidth={2.5} />
        </div>
        <div className="flex items-center gap-2 text-[var(--color-ink-600)] font-medium">
          <div className="w-4 h-4 border-2 border-brand-500/30 border-t-brand-500 rounded-full animate-spin" />
          正在登录…
        </div>
      </div>
    </div>
  )
}

export const Route = createFileRoute('/auth/callback')({
  component: AuthCallback,
})
