import { useState } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { useNavigate } from '@tanstack/react-router'
import { LogOut, User, Mail, Info, Shield, ChevronRight, Eye, EyeOff, Lock } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { useAuthStore } from '@/store/authStore'
import { signOut, updateEmail, updatePassword } from '@/hooks/useAuth'

function ProfilePage() {
  const user = useAuthStore((s) => s.user)
  const navigate = useNavigate()

  // Email dialog
  const [emailOpen, setEmailOpen] = useState(false)
  const [newEmail, setNewEmail] = useState('')
  const [emailLoading, setEmailLoading] = useState(false)
  const [emailMsg, setEmailMsg] = useState('')
  const [emailError, setEmailError] = useState('')

  // Password dialog
  const [pwOpen, setPwOpen] = useState(false)
  const [newPw, setNewPw] = useState('')
  const [confirmPw, setConfirmPw] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [pwLoading, setPwLoading] = useState(false)
  const [pwMsg, setPwMsg] = useState('')
  const [pwError, setPwError] = useState('')

  async function handleSignOut() {
    if (window.confirm('确认退出登录？')) {
      await signOut()
      void navigate({ to: '/login' })
    }
  }

  async function handleEmailUpdate(e: React.SyntheticEvent) {
    e.preventDefault()
    setEmailError('')
    setEmailMsg('')
    setEmailLoading(true)
    try {
      await updateEmail(newEmail.trim())
      setEmailMsg(`验证邮件已发送至 ${newEmail.trim()}，点击邮件中的链接完成修改`)
      setNewEmail('')
    } catch (err) {
      setEmailError(err instanceof Error ? err.message : '修改失败，请重试')
    } finally {
      setEmailLoading(false)
    }
  }

  async function handlePasswordUpdate(e: React.SyntheticEvent) {
    e.preventDefault()
    setPwError('')
    setPwMsg('')
    if (newPw.length < 8) {
      setPwError('密码至少需要 8 位')
      return
    }
    if (newPw !== confirmPw) {
      setPwError('两次输入的密码不一致')
      return
    }
    setPwLoading(true)
    try {
      await updatePassword(newPw)
      setPwMsg('密码修改成功')
      setNewPw('')
      setConfirmPw('')
    } catch (err) {
      setPwError(err instanceof Error ? err.message : '修改失败，请重试')
    } finally {
      setPwLoading(false)
    }
  }

  function openEmail() {
    setNewEmail('')
    setEmailMsg('')
    setEmailError('')
    setEmailOpen(true)
  }

  function openPw() {
    setNewPw('')
    setConfirmPw('')
    setPwMsg('')
    setPwError('')
    setShowPw(false)
    setShowConfirm(false)
    setPwOpen(true)
  }

  return (
    <div className="max-w-2xl mx-auto px-4 pt-6 sm:pt-8 pb-6 space-y-6">
      <div className="animate-slide-up">
        <h1 className="text-2xl font-extrabold text-stone-900">我的</h1>
      </div>

      {/* User card */}
      <div className="bg-white rounded-2xl p-5 shadow-[var(--shadow-card)] border border-stone-100/80 animate-slide-up">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-brand-100 flex items-center justify-center">
            <User className="w-7 h-7 text-brand-500" strokeWidth={1.8} />
          </div>
          <div>
            <div className="font-bold text-stone-900">个人账户</div>
            <div className="flex items-center gap-1.5 mt-1">
              <Mail className="w-3 h-3 text-stone-400" />
              <span className="text-sm text-stone-500 font-medium">{user?.email}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Account security */}
      <div className="bg-white rounded-2xl shadow-[var(--shadow-card)] border border-stone-100/80 overflow-hidden animate-slide-up">
        <div className="flex items-center gap-3 px-5 py-4 border-b border-stone-50">
          <Shield className="w-4 h-4 text-stone-400" />
          <span className="font-semibold text-stone-700 text-sm">账户安全</span>
        </div>
        <button
          className="w-full flex items-center justify-between px-5 py-4 border-b border-stone-50 hover:bg-stone-50 transition-colors text-left"
          onClick={openEmail}
        >
          <div className="flex items-center gap-3">
            <Mail className="w-4 h-4 text-stone-400" />
            <span className="text-sm font-medium text-stone-700">修改邮箱</span>
          </div>
          <ChevronRight className="w-4 h-4 text-stone-300" />
        </button>
        <button
          className="w-full flex items-center justify-between px-5 py-4 hover:bg-stone-50 transition-colors text-left"
          onClick={openPw}
        >
          <div className="flex items-center gap-3">
            <Lock className="w-4 h-4 text-stone-400" />
            <span className="text-sm font-medium text-stone-700">修改密码</span>
          </div>
          <ChevronRight className="w-4 h-4 text-stone-300" />
        </button>
      </div>

      {/* App info */}
      <div className="bg-white rounded-2xl shadow-[var(--shadow-card)] border border-stone-100/80 overflow-hidden animate-slide-up">
        <div className="flex items-center gap-3 px-5 py-4 border-b border-stone-50">
          <Info className="w-4 h-4 text-stone-400" />
          <span className="font-semibold text-stone-700 text-sm">关于</span>
        </div>
        <div className="px-5 py-4 space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-stone-500 font-medium">应用版本</span>
            <span className="font-semibold text-stone-700">1.0.0</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-stone-500 font-medium">数据存储</span>
            <span className="font-semibold text-stone-700">Supabase</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-stone-500 font-medium">框架</span>
            <span className="font-semibold text-stone-700">React 19 + Vite</span>
          </div>
        </div>
      </div>

      {/* Sign out */}
      <Button
        variant="danger-ghost"
        size="lg"
        className="w-full"
        onClick={handleSignOut}
      >
        <LogOut className="w-4 h-4" strokeWidth={2} />
        退出登录
      </Button>

      {/* Update email dialog */}
      <Dialog open={emailOpen} onOpenChange={(o) => { if (!o) setEmailOpen(false) }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>修改邮箱</DialogTitle>
          </DialogHeader>
          {emailMsg ? (
            <div className="py-4 text-center space-y-3">
              <div className="text-sm text-stone-600 leading-relaxed">{emailMsg}</div>
              <Button variant="outline" className="w-full" onClick={() => setEmailOpen(false)}>
                知道了
              </Button>
            </div>
          ) : (
            <form onSubmit={handleEmailUpdate} className="space-y-4 pt-1">
              <div className="space-y-2">
                <Label htmlFor="new-email">新邮箱地址</Label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
                  <Input
                    id="new-email"
                    type="email"
                    placeholder="new@email.com"
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    className="pl-10"
                    required
                    autoCapitalize="off"
                    autoCorrect="off"
                  />
                </div>
              </div>
              {emailError && (
                <div className="text-sm text-red-500 bg-red-50 px-3 py-2 rounded-xl font-medium">
                  {emailError}
                </div>
              )}
              <Button type="submit" className="w-full" disabled={emailLoading || !newEmail.trim()}>
                {emailLoading ? (
                  <span className="flex items-center gap-2">
                    <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                    发送验证邮件…
                  </span>
                ) : '发送验证邮件'}
              </Button>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* Update password dialog */}
      <Dialog open={pwOpen} onOpenChange={(o) => { if (!o) setPwOpen(false) }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>修改密码</DialogTitle>
          </DialogHeader>
          {pwMsg ? (
            <div className="py-4 text-center space-y-3">
              <div className="text-sm text-green-600 font-medium">{pwMsg}</div>
              <Button variant="outline" className="w-full" onClick={() => setPwOpen(false)}>
                完成
              </Button>
            </div>
          ) : (
            <form onSubmit={handlePasswordUpdate} className="space-y-4 pt-1">
              <div className="space-y-2">
                <Label htmlFor="new-pw">新密码</Label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
                  <Input
                    id="new-pw"
                    type={showPw ? 'text' : 'password'}
                    placeholder="至少 8 位"
                    value={newPw}
                    onChange={(e) => setNewPw(e.target.value)}
                    className="pl-10 pr-10"
                    required
                  />
                  <button
                    type="button"
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600"
                    onClick={() => setShowPw((v) => !v)}
                    tabIndex={-1}
                  >
                    {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirm-pw">确认新密码</Label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
                  <Input
                    id="confirm-pw"
                    type={showConfirm ? 'text' : 'password'}
                    placeholder="再次输入新密码"
                    value={confirmPw}
                    onChange={(e) => setConfirmPw(e.target.value)}
                    className="pl-10 pr-10"
                    required
                  />
                  <button
                    type="button"
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600"
                    onClick={() => setShowConfirm((v) => !v)}
                    tabIndex={-1}
                  >
                    {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              {pwError && (
                <div className="text-sm text-red-500 bg-red-50 px-3 py-2 rounded-xl font-medium">
                  {pwError}
                </div>
              )}
              <Button type="submit" className="w-full" disabled={pwLoading || !newPw || !confirmPw}>
                {pwLoading ? (
                  <span className="flex items-center gap-2">
                    <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                    修改中…
                  </span>
                ) : '确认修改'}
              </Button>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

export const Route = createFileRoute('/profile')({
  component: ProfilePage,
})
