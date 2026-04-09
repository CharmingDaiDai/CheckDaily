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
    <nav className="fixed bottom-0 left-0 right-0 z-40 pb-safe md:hidden touch-manipulation">
      <LayoutGroup>
        <div className="mx-auto max-w-lg px-2">
          <div className="relative flex h-[var(--bottom-nav-height)] items-center justify-between rounded-[1.3rem] border border-[color:rgb(130_108_87/0.26)] bg-[linear-gradient(165deg,rgba(255,255,255,0.86)_0%,rgba(255,248,239,0.76)_100%)] px-2 shadow-[0_14px_30px_rgba(26,22,17,0.16),inset_0_1px_0_rgba(255,255,255,0.74)] backdrop-blur-xl">
            {NAV_ITEMS.map(({ to, label, icon: Icon }) => {
              const active = to === '/' ? pathname === '/' : pathname.startsWith(to)
              return (
                <Link
                  key={to}
                  to={to}
                  className={cn(
                    'relative flex h-full min-h-[44px] flex-1 flex-col items-center justify-center gap-1 rounded-[1rem] px-1.5 touch-manipulation',
                    'text-[11px] font-semibold tracking-[0.01em] transition-[color,transform] duration-[var(--duration-fast)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500',
                    active ? 'text-brand-700' : 'text-[var(--color-ink-500)] hover:text-[var(--color-ink-700)]'
                  )}
                >
                  {active && (
                    <motion.div
                      layoutId="nav-indicator"
                      className="absolute inset-1.5 rounded-[0.95rem] border border-brand-200/50 bg-[linear-gradient(160deg,rgba(255,255,255,0.9)_0%,rgba(251,146,60,0.22)_100%)] shadow-[0_8px_16px_rgba(249,115,22,0.22)]"
                      transition={spring.smooth}
                    />
                  )}
                  <motion.div
                    animate={active ? { scale: 1.08, y: -1 } : { scale: 1, y: 0 }}
                    transition={spring.snappy}
                    className="relative z-10"
                  >
                    <Icon
                      className={cn('w-5 h-5', active && 'text-brand-700')}
                      strokeWidth={active ? 2.4 : 2}
                    />
                  </motion.div>
                  <span className="relative z-10 leading-none">{label}</span>
                </Link>
              )
            })}
          </div>
        </div>
      </LayoutGroup>
    </nav>
  )
}
