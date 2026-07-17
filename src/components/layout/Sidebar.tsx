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
    <aside className="hidden md:flex md:h-dvh md:min-h-0 flex-col w-52 lg:w-60 shrink-0 border-r border-white/55 bg-white/54 backdrop-blur-2xl">
      {/* Logo */}
      <div className="flex items-center gap-3 px-6 py-6">
        <div className="w-10 h-10 rounded-[0.8rem] bg-gradient-to-b from-brand-400 to-brand-600 flex items-center justify-center shadow-[0_10px_18px_rgb(185_84_34/0.24)]" style={{ '--glow-color': 'rgba(216,111,47,0.18)' } as React.CSSProperties}>
          <Flame className="w-5 h-5 text-white" strokeWidth={2.5} />
        </div>
        <div>
          <div className="text-base font-extrabold text-[var(--color-ink-900)] leading-tight tracking-[0]">打卡</div>
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
                  'transition-[color,transform] duration-[var(--duration-fast)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 active:scale-[0.992]',
                  active
                    ? 'text-brand-700'
                    : 'text-[var(--color-ink-600)] hover:text-[var(--color-ink-900)]'
                )}
              >
                {active && (
                  <motion.div
                      layoutId="sidebar-indicator"
                    className="absolute inset-0 rounded-[var(--radius-control)] border border-white/62 bg-[linear-gradient(160deg,rgba(255,255,255,0.76),rgba(216,111,47,0.14))] shadow-[0_8px_20px_rgb(185_84_34/0.13)]"
                    transition={spring.smooth}
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
      <div className="px-5 py-4 border-t border-white/50">
        <div className="text-xs text-[var(--color-ink-500)] font-medium">打卡 · 习惯追踪</div>
      </div>
    </aside>
  )
}
