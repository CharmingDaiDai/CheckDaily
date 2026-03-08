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
    <aside className="hidden md:flex flex-col w-48 lg:w-56 shrink-0 bg-white border-r border-stone-100 min-h-screen">
      {/* Logo */}
      <div className="flex items-center gap-3 px-6 py-6">
        <div className="w-9 h-9 rounded-xl bg-brand-500 flex items-center justify-center shadow-sm">
          <Flame className="w-5 h-5 text-white" strokeWidth={2.5} />
        </div>
        <div>
          <div className="text-base font-extrabold text-stone-900 leading-tight">打卡</div>
          <div className="text-xs text-stone-400 font-medium">习惯追踪</div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 space-y-0.5">
        {NAV_ITEMS.map(({ to, label, icon: Icon }) => {
          const active = to === '/' ? pathname === '/' : pathname.startsWith(to)
          return (
            <Link
              key={to}
              to={to}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold',
                'transition-all duration-150',
                active
                  ? 'bg-brand-50 text-brand-600 border-l-3 border-l-brand-500'
                  : 'text-stone-500 hover:bg-stone-50 hover:text-stone-800 border-l-3 border-l-transparent'
              )}
            >
              <Icon
                className={cn('w-5 h-5', active ? 'text-brand-500' : 'text-stone-400')}
                strokeWidth={active ? 2.5 : 1.8}
              />
              {label}
            </Link>
          )
        })}
      </nav>

      {/* Footer */}
      <div className="px-5 py-4 border-t border-stone-100">
        <div className="text-xs text-stone-300 font-medium">打卡 · 习惯追踪</div>
      </div>
    </aside>
  )
}
