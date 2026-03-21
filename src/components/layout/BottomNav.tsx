import { Link, useRouterState } from '@tanstack/react-router'
import { LayoutDashboard, ListCheck, BarChart2, User } from 'lucide-react'
import { motion, LayoutGroup } from 'motion/react'
import { cn } from '@/lib/utils'
import { spring } from '@/lib/motion'

const NAV_ITEMS = [
  { to: '/', label: '首页', icon: LayoutDashboard },
  { to: '/habits', label: '项目', icon: ListCheck },
  { to: '/stats', label: '统计', icon: BarChart2 },
  { to: '/profile', label: '我的', icon: User },
] as const

export function BottomNav() {
  const { location } = useRouterState()
  const pathname = location.pathname

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white/82 backdrop-blur-3xl border-t border-[var(--color-line-soft)] pb-safe md:hidden">
      <LayoutGroup>
        <div className="flex items-center justify-around h-16 max-w-lg mx-auto">
          {NAV_ITEMS.map(({ to, label, icon: Icon }) => {
            const active = to === '/' ? pathname === '/' : pathname.startsWith(to)
            return (
              <Link
                key={to}
                to={to}
                className={cn(
                  'relative flex flex-col items-center justify-center gap-0.5 px-4 h-full min-w-[64px] rounded-[var(--radius-control)]',
                  'text-xs font-semibold transition-colors duration-[var(--duration-fast)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500',
                  active ? 'text-brand-600' : 'text-[var(--color-ink-500)] hover:text-[var(--color-ink-700)]'
                )}
              >
                {active && (
                  <motion.div
                    layoutId="nav-indicator"
                    className="absolute inset-1 rounded-xl bg-brand-50/80"
                    transition={spring.smooth}
                  />
                )}
                <motion.div
                  animate={active ? { scale: 1.1 } : { scale: 1 }}
                  transition={spring.snappy}
                  className="relative z-10"
                >
                  <Icon
                    className={cn('w-6 h-6', active && 'text-brand-600')}
                    strokeWidth={active ? 2.5 : 1.8}
                  />
                </motion.div>
                <span className="relative z-10 leading-none">{label}</span>
              </Link>
            )
          })}
        </div>
      </LayoutGroup>
    </nav>
  )
}
