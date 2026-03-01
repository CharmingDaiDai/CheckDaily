import { Link, useRouterState } from '@tanstack/react-router'
import { LayoutDashboard, ListCheck, BarChart2, User } from 'lucide-react'
import { cn } from '@/lib/utils'

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
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white/90 backdrop-blur-xl border-t border-stone-100 pb-safe sm:hidden">
      <div className="flex items-center justify-around h-[60px] max-w-lg mx-auto">
        {NAV_ITEMS.map(({ to, label, icon: Icon }) => {
          const active = to === '/' ? pathname === '/' : pathname.startsWith(to)
          return (
            <Link
              key={to}
              to={to}
              className={cn(
                'flex flex-col items-center justify-center gap-0.5 px-4 h-full min-w-[60px]',
                'text-xs font-semibold transition-colors duration-150',
                active ? 'text-brand-500' : 'text-stone-400 hover:text-stone-600'
              )}
            >
              <Icon
                className={cn('w-[22px] h-[22px] transition-all duration-150', active && 'scale-110')}
                strokeWidth={active ? 2.5 : 1.8}
              />
              <span className="leading-none">{label}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
