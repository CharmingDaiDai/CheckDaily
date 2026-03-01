import { useState } from 'react'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { Mail, Flame, ArrowRight, CheckCircle2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { sendMagicLink } from '@/hooks/useAuth'
import { useAuthStore } from '@/store/authStore'
import { useEffect } from 'react'

function LoginPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')
  const navigate = useNavigate()
  const user = useAuthStore((s) => s.user)

  useEffect(() => {
    if (user) void navigate({ to: '/' })
  }, [user, navigate])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!email.trim()) return
    setLoading(true)
    setError('')
    try {
      await sendMagicLink(email.trim())
      setSent(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : '发送失败，请重试')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-brand-50 to-stone-50 flex items-center justify-center p-5">
      <div className="w-full max-w-sm animate-slide-up">
        {/* Logo + title */}
        <div className="flex flex-col items-center mb-10">
          <div className="w-16 h-16 rounded-2xl bg-brand-500 flex items-center justify-center shadow-[0_8px_24px_rgb(249_115_22/0.35)] mb-5">
            <Flame className="w-9 h-9 text-white" strokeWidth={2.5} />
          </div>
          <h1 className="text-3xl font-extrabold text-stone-900 tracking-tight">打卡</h1>
          <p className="text-stone-500 text-sm mt-1.5 font-medium">坚持好习惯，记录每一天</p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-3xl shadow-[var(--shadow-elevated)] p-7 border border-stone-100/80">
          {sent ? (
            <div className="flex flex-col items-center text-center gap-4 py-2">
              <div className="w-14 h-14 rounded-full bg-green-100 flex items-center justify-center">
                <CheckCircle2 className="w-8 h-8 text-green-500" strokeWidth={2} />
              </div>
              <div>
                <div className="font-bold text-stone-900 text-lg">邮件已发送！</div>
                <div className="text-stone-500 text-sm mt-1.5 leading-relaxed">
                  请查看 <strong className="text-stone-700">{email}</strong> 的收件箱，
                  点击邮件中的链接完成登录
                </div>
              </div>
              <button
                className="text-sm text-stone-400 hover:text-stone-600 mt-2 font-medium underline-offset-2 hover:underline"
                onClick={() => { setSent(false); setEmail('') }}
              >
                重新发送
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <h2 className="text-xl font-bold text-stone-900 mb-1">无密码登录</h2>
                <p className="text-stone-500 text-sm">输入邮箱，我们将发送一个登录链接</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">邮箱地址</Label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="your@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10"
                    required
                    autoCapitalize="off"
                    autoCorrect="off"
                  />
                </div>
              </div>

              {error && (
                <div className="text-sm text-red-500 bg-red-50 px-3 py-2 rounded-xl font-medium">
                  {error}
                </div>
              )}

              <Button type="submit" size="xl" className="w-full" disabled={loading || !email.trim()}>
                {loading ? (
                  <span className="flex items-center gap-2">
                    <span className="w-5 h-5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                    发送中…
                  </span>
                ) : (
                  <>
                    发送登录链接
                    <ArrowRight className="w-4 h-4" strokeWidth={2.5} />
                  </>
                )}
              </Button>
            </form>
          )}
        </div>

        <p className="text-center text-xs text-stone-400 mt-6 font-medium leading-relaxed">
          登录即表示你同意将数据安全存储
          <br />数据仅供个人使用
        </p>
      </div>
    </div>
  )
}

export const Route = createFileRoute('/login')({
  component: LoginPage,
})
