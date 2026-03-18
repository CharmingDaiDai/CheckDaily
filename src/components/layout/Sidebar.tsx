import { Link, useRouterState } from '@tanstack/react-router'
import { LayoutDashboard, ListCheck, BarChart2, User, Flame } from 'lucide-react'
import { cn } from '@/lib/utils'

const NAV_ITEMS = [
  { to: '/', label: '今日打卡', icon: LayoutDashboard },
  { to: '/habits', label: '项目管理', icon: ListCheck },
  { to: '/stats', label: '统计分析', icon: BarChart2 },
  { to: '/profile', label: '我的', icon: User },
] as const

export function Sidebar() {
  const { location } = useRouterState()
  const pathname = location.pathname

  return (
    <aside className="hidden md:flex flex-col w-52 lg:w-60 shrink-0 bg-white/82 backdrop-blur-xl border-r border-[var(--color-line-soft)] min-h-screen">
      {/* Logo */}
      <div className="flex items-center gap-3 px-6 py-6">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-b from-brand-500 to-brand-600 flex items-center justify-center shadow-[0_10px_18px_rgb(249_115_22/0.32)]">
          <Flame className="w-5 h-5 text-white" strokeWidth={2.5} />
        </div>
        <div>
          <div className="text-base font-extrabold text-[var(--color-ink-900)] leading-tight tracking-tight">打卡</div>
          <div className="text-xs text-[var(--color-ink-500)] font-medium">习惯追踪</div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 space-y-1">
        {NAV_ITEMS.map(({ to, label, icon: Icon }) => {
          const active = to === '/' ? pathname === '/' : pathname.startsWith(to)
          return (
            <Link
              key={to}
              to={to}
              className={cn(
                'flex items-center gap-3 px-3.5 py-2.5 rounded-[var(--radius-control)] text-sm font-semibold',
                'transition-all duration-[var(--duration-fast)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500',
                active
                  ? 'bg-brand-50/80 text-brand-700 shadow-[0_6px_14px_rgb(249_115_22/0.2)]'
                  : 'text-[var(--color-ink-600)] hover:bg-white/75 hover:text-[var(--color-ink-800)]'
              )}
            >
              <Icon
                className={cn('w-5 h-5', active ? 'text-brand-500' : 'text-[var(--color-ink-500)]')}
                strokeWidth={active ? 2.5 : 1.8}
              />
              {label}
            </Link>
          )
        })}
      </nav>

      {/* Footer */}
      <div className="px-5 py-4 border-t border-[var(--color-line-soft)]">
        <div className="text-xs text-[var(--color-ink-500)] font-medium">打卡 · 习惯追踪</div>
      </div>
    </aside>
  )
}
