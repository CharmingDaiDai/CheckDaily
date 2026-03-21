import { useState, useEffect } from 'react'
import { createFileRoute, redirect, useNavigate } from '@tanstack/react-router'
import { motion } from 'motion/react'
import { Mail, Lock, Flame, ArrowRight, CheckCircle2, Eye, EyeOff } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { sendMagicLink, signInWithPassword, signUpWithPassword } from '@/hooks/useAuth'
import { Spinner } from '@/components/ui/spinner'
import { useAuthStore } from '@/store/authStore'
import { spring } from '@/lib/motion'

function LoginPage() {
  const user = useAuthStore((s) => s.user)
  const navigate = useNavigate()

  // Redirect to home when user becomes authenticated (e.g. after password login)
  useEffect(() => {
    if (user) void navigate({ to: '/' })
  }, [user, navigate])
  // Magic link state
  const [mlEmail, setMlEmail] = useState('')
  const [mlLoading, setMlLoading] = useState(false)
  const [mlSent, setMlSent] = useState(false)
  const [mlError, setMlError] = useState('')

  // Password login state
  const [mode, setMode] = useState<'login' | 'register'>('login')
  const [pwEmail, setPwEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [pwLoading, setPwLoading] = useState(false)
  const [pwError, setPwError] = useState('')
  const [registered, setRegistered] = useState(false)

  async function handleMagicLink(e: React.SyntheticEvent) {
    e.preventDefault()
    if (!mlEmail.trim()) return
    setMlLoading(true)
    setMlError('')
    try {
      await sendMagicLink(mlEmail.trim())
      setMlSent(true)
    } catch (err) {
      setMlError(err instanceof Error ? err.message : '发送失败，请重试')
    } finally {
      setMlLoading(false)
    }
  }

  async function handlePassword(e: React.SyntheticEvent) {
    e.preventDefault()
    setPwError('')

    if (mode === 'register') {
      if (password.length < 8) {
        setPwError('密码至少需要 8 位')
        return
      }
      if (password !== confirm) {
        setPwError('两次输入的密码不一致')
        return
      }
    }

    setPwLoading(true)
    try {
      if (mode === 'login') {
        await signInWithPassword(pwEmail.trim(), password)
        // onAuthStateChange will update store and trigger redirect
      } else {
        await signUpWithPassword(pwEmail.trim(), password)
        setRegistered(true)
      }
    } catch (err) {
      setPwError(err instanceof Error ? err.message : '操作失败，请重试')
    } finally {
      setPwLoading(false)
    }
  }

  function switchMode(next: 'login' | 'register') {
    setMode(next)
    setPwError('')
    setPassword('')
    setConfirm('')
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_20%_-10%,rgb(251_146_60/0.28),transparent_35%),radial-gradient(circle_at_80%_0%,rgb(253_186_116/0.26),transparent_40%),linear-gradient(180deg,#fffdf9_0%,#f6f3ee_55%,#f1ede7_100%)] flex items-center justify-center p-5">
      <div className="w-full max-w-sm">
        {/* Logo + title */}
        <motion.div
          className="flex flex-col items-center mb-10"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ staggerChildren: 0.08, delayChildren: 0.1, when: 'beforeChildren' }}
        >
          <motion.div
            className="relative mb-5"
            initial={{ opacity: 0, scale: 0.7, rotate: -12 }}
            animate={{ opacity: 1, scale: 1, rotate: 0 }}
            transition={spring.emphasized}
          >
            <div className="absolute inset-0 w-32 h-32 -left-8 -top-8 rounded-full bg-brand-200/30 blur-3xl" />
            <div className="relative w-16 h-16 rounded-2xl bg-brand-500 flex items-center justify-center shadow-[0_8px_24px_rgb(249_115_22/0.35)]">
              <Flame className="w-9 h-9 text-white" strokeWidth={2.5} />
            </div>
          </motion.div>
          <motion.h1
            className="text-3xl font-extrabold text-stone-900 tracking-tight"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ ...spring.gentle, delay: 0.15 }}
          >
            打卡
          </motion.h1>
          <motion.p
            className="text-stone-500 text-sm mt-1.5 font-medium"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ ...spring.gentle, delay: 0.25 }}
          >
            坚持好习惯，记录每一天
          </motion.p>
        </motion.div>

        {/* Card */}
        <motion.div
          className="glass-card rounded-3xl shadow-[var(--shadow-elevated)] p-7"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ...spring.gentle, delay: 0.35 }}
        >
          <Tabs defaultValue="magic">
            <TabsList className="w-full mb-6">
              <TabsTrigger value="magic" className="flex-1">魔法链接</TabsTrigger>
              <TabsTrigger value="password" className="flex-1">密码登录</TabsTrigger>
            </TabsList>

            {/* ── Magic Link Tab ── */}
            <TabsContent value="magic">
              {mlSent ? (
                <div className="flex flex-col items-center text-center gap-4 py-2">
                  <div className="w-14 h-14 rounded-full bg-green-100 flex items-center justify-center">
                    <CheckCircle2 className="w-8 h-8 text-green-500" strokeWidth={2} />
                  </div>
                  <div>
                    <div className="font-bold text-stone-900 text-lg">邮件已发送！</div>
                    <div className="text-stone-500 text-sm mt-1.5 leading-relaxed">
                      请查看 <strong className="text-stone-700">{mlEmail}</strong> 的收件箱，
                      点击邮件中的链接完成登录
                    </div>
                  </div>
                  <button
                    className="text-sm text-stone-400 hover:text-stone-600 mt-2 font-medium underline-offset-2 hover:underline"
                    onClick={() => { setMlSent(false); setMlEmail('') }}
                  >
                    重新发送
                  </button>
                </div>
              ) : (
                <form onSubmit={handleMagicLink} className="space-y-5">
                  <div>
                    <h2 className="text-xl font-bold text-stone-900 mb-1">无密码登录</h2>
                    <p className="text-stone-500 text-sm">输入邮箱，我们将发送一个登录链接</p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="ml-email">邮箱地址</Label>
                    <div className="relative">
                      <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
                      <Input
                        id="ml-email"
                        type="email"
                        placeholder="your@email.com"
                        value={mlEmail}
                        onChange={(e) => setMlEmail(e.target.value)}
                        className="pl-10"
                        required
                        autoCapitalize="off"
                        autoCorrect="off"
                      />
                    </div>
                  </div>

                  {mlError && (
                    <div className="text-sm text-red-500 bg-red-50 px-3 py-2 rounded-xl font-medium">
                      {mlError}
                    </div>
                  )}

                  <Button type="submit" size="xl" className="w-full" disabled={mlLoading || !mlEmail.trim()}>
                    {mlLoading ? (
                      <span className="flex items-center gap-2">
                        <Spinner size="default" />
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
            </TabsContent>

            {/* ── Password Tab ── */}
            <TabsContent value="password">
              {registered ? (
                <div className="flex flex-col items-center text-center gap-4 py-2">
                  <div className="w-14 h-14 rounded-full bg-green-100 flex items-center justify-center">
                    <CheckCircle2 className="w-8 h-8 text-green-500" strokeWidth={2} />
                  </div>
                  <div>
                    <div className="font-bold text-stone-900 text-lg">注册成功！</div>
                    <div className="text-stone-500 text-sm mt-1.5 leading-relaxed">
                      请查看 <strong className="text-stone-700">{pwEmail}</strong> 的收件箱，
                      点击验证链接激活账号后即可登录
                    </div>
                  </div>
                  <button
                    className="text-sm text-stone-400 hover:text-stone-600 mt-2 font-medium underline-offset-2 hover:underline"
                    onClick={() => { setRegistered(false); switchMode('login') }}
                  >
                    去登录
                  </button>
                </div>
              ) : (
                <form onSubmit={handlePassword} className="space-y-5">
                  <div>
                    <h2 className="text-xl font-bold text-stone-900 mb-1">
                      {mode === 'login' ? '密码登录' : '注册账号'}
                    </h2>
                    <p className="text-stone-500 text-sm">
                      {mode === 'login' ? '使用邮箱和密码登录' : '创建一个新账号'}
                    </p>
                  </div>

                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="pw-email">邮箱地址</Label>
                      <div className="relative">
                        <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
                        <Input
                          id="pw-email"
                          type="email"
                          placeholder="your@email.com"
                          value={pwEmail}
                          onChange={(e) => setPwEmail(e.target.value)}
                          className="pl-10"
                          required
                          autoCapitalize="off"
                          autoCorrect="off"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="pw-password">密码</Label>
                      <div className="relative">
                        <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
                        <Input
                          id="pw-password"
                          type={showPw ? 'text' : 'password'}
                          placeholder={mode === 'register' ? '至少 8 位' : '输入密码'}
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          className="pl-10 pr-10"
                          required
                        />
                        <button
                          type="button"
                          className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-lg flex items-center justify-center text-stone-400 hover:text-stone-600 hover:bg-white/80"
                          onClick={() => setShowPw((v) => !v)}
                          tabIndex={-1}
                        >
                          {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>

                    {mode === 'register' && (
                      <div className="space-y-2">
                        <Label htmlFor="pw-confirm">确认密码</Label>
                        <div className="relative">
                          <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
                          <Input
                            id="pw-confirm"
                            type={showConfirm ? 'text' : 'password'}
                            placeholder="再次输入密码"
                            value={confirm}
                            onChange={(e) => setConfirm(e.target.value)}
                            className="pl-10 pr-10"
                            required
                          />
                          <button
                            type="button"
                            className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-lg flex items-center justify-center text-stone-400 hover:text-stone-600 hover:bg-white/80"
                            onClick={() => setShowConfirm((v) => !v)}
                            tabIndex={-1}
                          >
                            {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>

                  {pwError && (
                    <div className="text-sm text-red-500 bg-red-50 px-3 py-2 rounded-xl font-medium">
                      {pwError}
                    </div>
                  )}

                  <Button
                    type="submit"
                    size="xl"
                    className="w-full"
                    disabled={pwLoading || !pwEmail.trim() || !password}
                  >
                    {pwLoading ? (
                      <span className="flex items-center gap-2">
                        <Spinner size="default" />
                        {mode === 'login' ? '登录中…' : '注册中…'}
                      </span>
                    ) : (
                      <>
                        {mode === 'login' ? '登录' : '注册'}
                        <ArrowRight className="w-4 h-4" strokeWidth={2.5} />
                      </>
                    )}
                  </Button>

                  <div className="text-center">
                    {mode === 'login' ? (
                      <button
                        type="button"
                        className="text-sm text-stone-400 hover:text-brand-500 font-medium transition-colors"
                        onClick={() => switchMode('register')}
                      >
                        没有账号？去注册
                      </button>
                    ) : (
                      <button
                        type="button"
                        className="text-sm text-stone-400 hover:text-brand-500 font-medium transition-colors"
                        onClick={() => switchMode('login')}
                      >
                        已有账号？去登录
                      </button>
                    )}
                  </div>
                </form>
              )}
            </TabsContent>
          </Tabs>
        </motion.div>

        <motion.p
          className="text-center text-xs text-stone-400 mt-6 font-medium leading-relaxed"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5, duration: 0.4 }}
        >
          登录即表示你同意将数据安全存储
          <br />数据仅供个人使用
        </motion.p>
      </div>
    </div>
  )
}

export const Route = createFileRoute('/login')({
  component: LoginPage,
  beforeLoad: ({ context }) => {
    if (context.auth.loading) return
    if (context.auth.user) throw redirect({ to: '/' })
  },
})
