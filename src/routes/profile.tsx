import { useState, useEffect } from 'react'
import { createFileRoute, redirect } from '@tanstack/react-router'
import { useNavigate } from '@tanstack/react-router'
import { motion } from 'motion/react'
import { LogOut, User, Mail, Info, Shield, ChevronRight, Eye, EyeOff, Lock, Download, Database } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { useAuthStore } from '@/store/authStore'
import { signOut, updateEmail, updatePassword } from '@/hooks/useAuth'
import { supabase } from '@/lib/supabase'
import { toast } from '@/hooks/useToast'
import { Spinner } from '@/components/ui/spinner'
import { useFormDialog } from '@/hooks/useFormDialog'
import { pageChoreography, sectionReveal } from '@/lib/motion'

function ProfilePage() {
  const user = useAuthStore((s) => s.user)
  const navigate = useNavigate()

  // Email dialog
  const emailDialog = useFormDialog()
  const [newEmail, setNewEmail] = useState('')

  // Password dialog
  const pwDialog = useFormDialog()
  const [newPw, setNewPw] = useState('')
  const [confirmPw, setConfirmPw] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)

  // Reset field values when dialogs close
  useEffect(() => { if (!emailDialog.open) setNewEmail('') }, [emailDialog.open])
  useEffect(() => { if (!pwDialog.open) { setNewPw(''); setConfirmPw(''); setShowPw(false); setShowConfirm(false) } }, [pwDialog.open])

  // Sign out dialog
  const [signOutOpen, setSignOutOpen] = useState(false)

  // Export data
  const [exporting, setExporting] = useState(false)

  async function handleExport() {
    if (!user) return
    setExporting(true)
    try {
      const [habitsRes, checkInsRes] = await Promise.all([
        supabase.from('habits').select('*').eq('user_id', user.id).order('created_at'),
        supabase.from('check_ins').select('*').eq('user_id', user.id).order('checked_at'),
      ])
      if (habitsRes.error) throw habitsRes.error
      if (checkInsRes.error) throw checkInsRes.error

      const exportData = {
        exportedAt: new Date().toISOString(),
        habits: habitsRes.data,
        checkIns: checkInsRes.data,
      }

      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      const dateStr = new Date().toLocaleDateString('zh-CN').replace(/\//g, '-')
      a.download = `打卡数据-${dateStr}.json`
      a.click()
      URL.revokeObjectURL(url)
      toast.success('数据导出成功')
    } catch {
      toast.error('导出失败，请稍后重试')
    } finally {
      setExporting(false)
    }
  }

  async function handleSignOut() {
    await signOut()
    void navigate({ to: '/login' })
  }

  async function handleEmailUpdate(e: React.SyntheticEvent) {
    e.preventDefault()
    emailDialog.setError('')
    emailDialog.setMsg('')
    emailDialog.setLoading(true)
    try {
      await updateEmail(newEmail.trim())
      emailDialog.setMsg(`验证邮件已发送至 ${newEmail.trim()}，点击邮件中的链接完成修改`)
      setNewEmail('')
    } catch (err) {
      emailDialog.setError(err instanceof Error ? err.message : '修改失败，请重试')
    } finally {
      emailDialog.setLoading(false)
    }
  }

  async function handlePasswordUpdate(e: React.SyntheticEvent) {
    e.preventDefault()
    pwDialog.setError('')
    pwDialog.setMsg('')
    if (newPw.length < 8) {
      pwDialog.setError('密码至少需要 8 位')
      return
    }
    if (newPw !== confirmPw) {
      pwDialog.setError('两次输入的密码不一致')
      return
    }
    pwDialog.setLoading(true)
    try {
      await updatePassword(newPw)
      pwDialog.setMsg('密码修改成功')
      setNewPw('')
      setConfirmPw('')
    } catch (err) {
      pwDialog.setError(err instanceof Error ? err.message : '修改失败，请重试')
    } finally {
      pwDialog.setLoading(false)
    }
  }


  return (
    <motion.div
      className="max-w-2xl mx-auto px-4 pt-6 sm:pt-8 pb-6 space-y-6"
      variants={pageChoreography}
      initial="initial"
      animate="animate"
    >
      <div>
        <h1 className="headline-premium text-[2rem] sm:text-[2.28rem] font-normal tracking-[0.01em] text-[var(--color-ink-950)]">我的</h1>
      </div>

      {/* User card */}
      <motion.div variants={sectionReveal} className="glass-card rounded-[var(--radius-card-lg)] p-5">
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
      </motion.div>

      {/* Account security */}
      <motion.div variants={sectionReveal} className="glass-card rounded-[var(--radius-card-lg)] overflow-hidden">
        <div className="flex items-center gap-3 px-5 py-4 border-b luxury-divider">
          <Shield className="w-4 h-4 text-stone-400" />
          <span className="font-semibold text-stone-700 text-sm">账户安全</span>
        </div>
        <button
          className="w-full flex items-center justify-between px-5 py-4 border-b luxury-divider hover:bg-white/65 transition-colors text-left"
          onClick={emailDialog.openDialog}
        >
          <div className="flex items-center gap-3">
            <Mail className="w-4 h-4 text-stone-400" />
            <span className="text-sm font-medium text-stone-700">修改邮箱</span>
          </div>
          <ChevronRight className="w-4 h-4 text-stone-300" />
        </button>
        <button
          className="w-full flex items-center justify-between px-5 py-4 hover:bg-white/65 transition-colors text-left"
          onClick={pwDialog.openDialog}
        >
          <div className="flex items-center gap-3">
            <Lock className="w-4 h-4 text-stone-400" />
            <span className="text-sm font-medium text-stone-700">修改密码</span>
          </div>
          <ChevronRight className="w-4 h-4 text-stone-300" />
        </button>
      </motion.div>

      {/* Data management */}
      <motion.div variants={sectionReveal} className="glass-card rounded-[var(--radius-card-lg)] overflow-hidden">
        <div className="flex items-center gap-3 px-5 py-4 border-b luxury-divider">
          <Database className="w-4 h-4 text-stone-400" />
          <span className="font-semibold text-stone-700 text-sm">数据管理</span>
        </div>
        <button
          className="w-full flex items-center justify-between px-5 py-4 hover:bg-white/65 transition-colors text-left disabled:opacity-50"
          onClick={handleExport}
          disabled={exporting}
        >
          <div className="flex items-center gap-3">
            <Download className="w-4 h-4 text-stone-400" />
            <div>
              <div className="text-sm font-medium text-stone-700">导出数据</div>
              <div className="text-xs text-stone-400 mt-0.5">下载全部习惯和打卡记录 (JSON)</div>
            </div>
          </div>
          {exporting ? (
            <Spinner variant="muted" />
          ) : (
            <ChevronRight className="w-4 h-4 text-stone-300" />
          )}
        </button>
      </motion.div>

      {/* App info */}
      <motion.div variants={sectionReveal} className="glass-card rounded-[var(--radius-card-lg)] overflow-hidden">
        <div className="flex items-center gap-3 px-5 py-4 border-b luxury-divider">
          <Info className="w-4 h-4 text-stone-400" />
          <span className="font-semibold text-stone-700 text-sm">关于</span>
        </div>
        <div className="px-5 py-4 space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-stone-500 font-medium">应用版本</span>
            <span className="font-semibold text-stone-700">{__APP_VERSION__}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-stone-500 font-medium">开发者</span>
            <span className="font-semibold text-stone-700">CharmingDaiDai</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-stone-500 font-medium">主页</span>
            <span className="font-semibold text-stone-700">https://github.com/CharmingDaiDai</span>
          </div>
        </div>
      </motion.div>

      {/* Sign out */}
      <Button
        variant="danger-ghost"
        size="lg"
        className="w-full max-w-xs mx-auto"
        onClick={() => setSignOutOpen(true)}
      >
        <LogOut className="w-4 h-4" strokeWidth={2} />
        退出登录
      </Button>

      <ConfirmDialog
        open={signOutOpen}
        onOpenChange={setSignOutOpen}
        title="确认退出登录？"
        description="退出后需要重新登录才能使用。"
        confirmText="退出"
        variant="danger"
        onConfirm={handleSignOut}
      />

      {/* Update email dialog */}
      <Dialog open={emailDialog.open} onOpenChange={(o) => { if (!o) emailDialog.close() }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>修改邮箱</DialogTitle>
          </DialogHeader>
          {emailDialog.msg ? (
            <div className="py-4 text-center space-y-3">
              <div className="text-sm text-stone-600 leading-relaxed">{emailDialog.msg}</div>
              <Button variant="outline" className="w-full" onClick={() => emailDialog.close()}>
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
              {emailDialog.error && (
                <div className="text-sm text-red-500 bg-red-50 px-3 py-2 rounded-xl font-medium">
                  {emailDialog.error}
                </div>
              )}
              <Button
                type="submit"
                className="w-full"
                disabled={!newEmail.trim()}
                isLoading={emailDialog.loading}
                loadingText="发送验证邮件…"
                requestGuard
              >
                发送验证邮件
              </Button>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* Update password dialog */}
      <Dialog open={pwDialog.open} onOpenChange={(o) => { if (!o) pwDialog.close() }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>修改密码</DialogTitle>
          </DialogHeader>
          {pwDialog.msg ? (
            <div className="py-4 text-center space-y-3">
              <div className="text-sm text-green-600 font-medium">{pwDialog.msg}</div>
              <Button variant="outline" className="w-full" onClick={() => pwDialog.close()}>
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
                    className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-lg flex items-center justify-center text-stone-400 hover:text-stone-600 hover:bg-white"
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
                    className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-lg flex items-center justify-center text-stone-400 hover:text-stone-600 hover:bg-white"
                    onClick={() => setShowConfirm((v) => !v)}
                    tabIndex={-1}
                  >
                    {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              {pwDialog.error && (
                <div className="text-sm text-red-500 bg-red-50 px-3 py-2 rounded-xl font-medium">
                  {pwDialog.error}
                </div>
              )}
              <Button
                type="submit"
                className="w-full"
                disabled={!newPw || !confirmPw}
                isLoading={pwDialog.loading}
                loadingText="修改中…"
                requestGuard
              >
                确认修改
              </Button>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </motion.div>
  )
}

export const Route = createFileRoute('/profile')({
  component: ProfilePage,
  beforeLoad: ({ context }) => {
    if (context.auth.loading) return
    if (!context.auth.user) throw redirect({ to: '/login' })
  },
})
