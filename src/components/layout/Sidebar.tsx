import { Link, useRouterState } from '@tanstack/react-router'
import { LayoutDashboard, ListCheck, BarChart2, User, Flame, ChevronRight } from 'lucide-react'
import { motion, LayoutGroup } from 'motion/react'
import { cn } from '@/lib/utils'
import { spring } from '@/lib/motion'

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
    <aside className="hidden md:flex md:h-dvh md:min-h-0 flex-col w-52 lg:w-60 shrink-0 bg-white/82 backdrop-blur-xl border-r border-[var(--color-line-soft)]">
      {/* Logo */}
      <div className="flex items-center gap-3 px-6 py-6">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-b from-brand-500 to-brand-600 flex items-center justify-center shadow-[0_10px_18px_rgb(249_115_22/0.32)] animate-glow-pulse" style={{ '--glow-color': 'rgba(249,115,22,0.25)' } as React.CSSProperties}>
          <Flame className="w-5 h-5 text-white" strokeWidth={2.5} />
        </div>
        <div>
          <div className="text-base font-extrabold text-[var(--color-ink-900)] leading-tight tracking-tight">打卡</div>
          <div className="text-xs text-[var(--color-ink-500)] font-medium">习惯追踪</div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 space-y-1">
        <LayoutGroup>
          {NAV_ITEMS.map(({ to, label, icon: Icon }) => {
            const active = to === '/' ? pathname === '/' : pathname.startsWith(to)
            return (
              <Link
                key={to}
                to={to}
                className={cn(
                  'group relative flex items-center gap-3 px-3.5 py-2.5 rounded-[var(--radius-control)] text-sm font-semibold',
                  'transition-colors duration-[var(--duration-fast)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500',
                  active
                    ? 'text-brand-700'
                    : 'text-[var(--color-ink-600)] hover:text-[var(--color-ink-800)]'
                )}
              >
                {active && (
                  <motion.div
                    layoutId="sidebar-indicator"
                    className="absolute inset-0 rounded-[var(--radius-control)] bg-brand-50/80 shadow-[0_6px_14px_rgb(249_115_22/0.2)]"
                    transition={spring.gentle}
                  />
                )}
                <Icon
                  className={cn('w-5 h-5 relative z-10', active ? 'text-brand-500' : 'text-[var(--color-ink-500)]')}
                  strokeWidth={active ? 2.5 : 1.8}
                />
                <span className="relative z-10 flex-1">{label}</span>
                {!active && (
                  <ChevronRight
                    className="w-3.5 h-3.5 text-[var(--color-ink-500)] opacity-0 -translate-x-1 group-hover:opacity-60 group-hover:translate-x-0 transition-all duration-[var(--duration-fast)]"
                    strokeWidth={2}
                  />
                )}
              </Link>
            )
          })}
        </LayoutGroup>
      </nav>

      {/* Footer */}
      <div className="px-5 py-4 border-t border-[var(--color-line-soft)]">
        <div className="text-xs text-[var(--color-ink-500)] font-medium">打卡 · 习惯追踪</div>
      </div>
    </aside>
  )
}
