import { useEffect, useState } from 'react'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { Check, AlertCircle } from 'lucide-react'
import { initializeAuth, getAuthCallbackError, authErrorMessage } from '@/lib/auth'
import { useAuthStore } from '@/store/authStore'
import { Button } from '@/components/ui/button'

function AuthCallback() {
  const navigate = useNavigate()
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true
    void (async () => {
      try {
        await initializeAuth()
        if (!active) return
        const callbackError = getAuthCallbackError()
        if (callbackError) {
          setError(callbackError)
          return
        }
        if (!useAuthStore.getState().session) {
          setError('未获取到登录会话。请重新发送魔法链接，或使用密码登录。')
          return
        }
        await navigate({ to: '/', replace: true })
      } catch (reason) {
        if (active) setError(authErrorMessage(reason))
      }
    })()
    return () => { active = false }
  }, [navigate])

  return (
    <div className="min-h-screen flex items-center justify-center px-6">
      <div className="surface-frame w-full max-w-sm flex flex-col items-center gap-4 px-7 py-6 text-center">
        <div className="w-14 h-14 rounded-[0.9rem] bg-brand-600 flex items-center justify-center">
          {error ? <AlertCircle className="w-8 h-8 text-white" /> : <Check className="w-8 h-8 text-white" />}
        </div>
        {error ? (
          <>
            <h1 className="text-lg font-semibold">未能完成登录</h1>
            <p role="alert" className="text-sm leading-relaxed text-[var(--color-ink-700)]">{error}</p>
            <Button onClick={() => void navigate({ to: '/login', replace: true })}>返回登录，重新发送邮件</Button>
          </>
        ) : (
          <div role="status" className="flex items-center gap-2 text-[var(--color-ink-600)]">
            <div className="w-4 h-4 border-2 border-brand-500/30 border-t-brand-500 rounded-full motion-safe:animate-spin" />
            正在验证登录会话…
          </div>
        )}
      </div>
    </div>
  )
}

export const Route = createFileRoute('/auth/callback')({ component: AuthCallback })
