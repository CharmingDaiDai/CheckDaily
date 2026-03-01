import { createFileRoute } from '@tanstack/react-router'
import { useNavigate } from '@tanstack/react-router'
import { LogOut, User, Mail, Info } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useAuthStore } from '@/store/authStore'
import { signOut } from '@/hooks/useAuth'

function ProfilePage() {
  const user = useAuthStore((s) => s.user)
  const navigate = useNavigate()

  async function handleSignOut() {
    if (window.confirm('确认退出登录？')) {
      await signOut()
      void navigate({ to: '/login' })
    }
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
    </div>
  )
}

export const Route = createFileRoute('/profile')({
  component: ProfilePage,
})
