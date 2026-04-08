import { useState, useMemo } from 'react'
import { createFileRoute, redirect } from '@tanstack/react-router'
import { motion, AnimatePresence } from 'motion/react'
import { Plus, Pencil, Archive, MoreHorizontal, ListCheck, Search, X, RotateCcw, ChevronDown, ChevronUp } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { Skeleton } from '@/components/ui/skeleton'
import { HabitForm } from '@/components/habits/HabitForm'
import { useHabits, useArchiveHabit, useRestoreHabit } from '@/hooks/useHabits'
import type { Habit } from '@/types'
import { cn } from '@/lib/utils'
import { pageChoreography, sectionReveal, listItemSlide, spring } from '@/lib/motion'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

function HabitsPage() {
  const { data: habits, isLoading } = useHabits(false)
  const { data: allHabits } = useHabits(true)
  const [createOpen, setCreateOpen] = useState(false)
  const [editHabit, setEditHabit] = useState<Habit | null>(null)
  const [search, setSearch] = useState('')
  const [showArchived, setShowArchived] = useState(false)
  const [archiveTarget, setArchiveTarget] = useState<{ id: string; name: string } | null>(null)
  const archive = useArchiveHabit()
  const restore = useRestoreHabit()

  const filtered = useMemo(
    () => habits?.filter(h => h.name.toLowerCase().includes(search.toLowerCase())) ?? [],
    [habits, search]
  )

  const archivedHabits = useMemo(
    () => allHabits?.filter(h => h.archived) ?? [],
    [allHabits]
  )

  function handleArchive(id: string, name: string) {
    setArchiveTarget({ id, name })
  }

  return (
    <motion.div
      className="max-w-2xl mx-auto px-4 pt-6 sm:pt-8 pb-6 space-y-6"
      variants={pageChoreography}
      initial="initial"
      animate="animate"
    >
      {/* Header */}
      <motion.div variants={sectionReveal} className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-[var(--color-ink-950)] tracking-tight">项目管理</h1>
          <p className="text-sm text-[var(--color-ink-500)] font-medium mt-0.5">
            {habits?.length ?? 0} 个活跃项目
          </p>
        </div>

        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger asChild>
            <Button size="default">
              <Plus className="w-4 h-4" strokeWidth={2.5} />
              新建项目
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>新建打卡项目</DialogTitle>
            </DialogHeader>
            <HabitForm onClose={() => setCreateOpen(false)} />
          </DialogContent>
        </Dialog>
      </motion.div>

      {/* Edit dialog */}
      <Dialog open={!!editHabit} onOpenChange={(o) => { if (!o) setEditHabit(null) }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>编辑项目</DialogTitle>
          </DialogHeader>
          {editHabit && (
            <HabitForm existing={editHabit} onClose={() => setEditHabit(null)} />
          )}
        </DialogContent>
      </Dialog>

      {/* Archive confirm dialog */}
      <ConfirmDialog
        open={!!archiveTarget}
        onOpenChange={(open) => { if (!open) setArchiveTarget(null) }}
        title={`确认归档「${archiveTarget?.name ?? ''}」？`}
        description="归档后将不再出现在今日打卡列表中。你可以在已归档区域恢复。"
        confirmText="归档"
        variant="danger"
        onConfirm={async () => {
          if (archiveTarget) await archive.mutateAsync(archiveTarget.id)
        }}
      />

      {/* Search — only show when there are items */}
      {!isLoading && (habits?.length ?? 0) > 0 && (
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
          <Input
            placeholder="搜索项目…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 pr-14"
          />
          {search && (
            <button
              className="absolute right-1 top-1/2 -translate-y-1/2 w-11 h-11 rounded-xl flex items-center justify-center text-stone-400 hover:text-stone-600 hover:bg-white transition-colors"
              onClick={() => setSearch('')}
              aria-label="清除搜索"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      )}

      {/* List */}
      {isLoading ? (
        <motion.div variants={sectionReveal} className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-20 rounded-2xl" />
          ))}
        </motion.div>
      ) : habits && habits.length > 0 ? (
        filtered.length > 0 ? (
          <motion.div
            variants={sectionReveal}
            className="space-y-3"
          >
            {filtered.map((habit) => (
              <motion.div
                key={habit.id}
                variants={listItemSlide}
                className={cn(
                  'flex items-center gap-4 glass-card rounded-[var(--radius-card-lg)] px-4 py-3.5'
                )}
              >
                {/* Color + icon */}
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl shrink-0"
                  style={{ backgroundColor: habit.color + '18', borderColor: habit.color + '30' }}
                >
                  {habit.icon || '📌'}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="font-bold text-stone-900 text-sm truncate">{habit.name}</div>
                  <div className="flex items-center gap-2 mt-1">
                    <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: habit.color }} />
                      <span className="text-xs text-[var(--color-ink-500)] font-medium">
                      {new Date(habit.created_at).toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' })} 创建
                    </span>
                  </div>
                </div>

                {/* Actions */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon-sm" className="shrink-0" aria-label={`${habit.name} 更多操作`}>
                      <MoreHorizontal className="w-4 h-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => setEditHabit(habit)}>
                      <Pencil className="w-3.5 h-3.5 mr-2" />
                      编辑
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => handleArchive(habit.id, habit.name)}
                      className="text-red-600 focus:text-red-700 focus:bg-red-50"
                    >
                      <Archive className="w-3.5 h-3.5 mr-2" />
                      归档
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </motion.div>
            ))}
          </motion.div>
        ) : (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Search className="w-10 h-10 text-stone-200 mb-3" strokeWidth={1.5} />
            <div className="font-bold text-stone-700 mb-1">没有找到「{search}」</div>
            <button
              className="text-sm text-stone-400 hover:text-brand-500 font-medium mt-2 transition-colors"
              onClick={() => setSearch('')}
            >
              清除搜索
            </button>
          </div>
        )
      ) : (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="w-20 h-20 rounded-full bg-stone-100 flex items-center justify-center mb-4">
            <ListCheck className="w-10 h-10 text-stone-300" strokeWidth={1.5} />
          </div>
          <div className="font-bold text-stone-700 text-lg mb-1">还没有打卡项目</div>
          <div className="text-stone-400 text-sm mb-5">创建你的第一个习惯开始打卡</div>
          <Button onClick={() => setCreateOpen(true)}>
            <Plus className="w-4 h-4" strokeWidth={2.5} />
            新建项目
          </Button>
        </div>
      )}

      {/* Archived habits */}
      {archivedHabits.length > 0 && (
        <div>
          <button
            className="flex items-center gap-2 w-full text-sm font-semibold text-stone-400 hover:text-stone-600 transition-colors py-1"
            onClick={() => setShowArchived(v => !v)}
          >
            {showArchived ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            已归档项目（{archivedHabits.length}）
          </button>

          {showArchived && (
            <AnimatePresence>
              <motion.div
                className="space-y-3 mt-3"
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={spring.gentle}
              >
              {archivedHabits.map((habit) => (
                <div
                  key={habit.id}
                  className="flex items-center gap-4 bg-white/45 rounded-[var(--radius-card)] px-4 py-3.5 border border-[var(--color-line-soft)]"
                >
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl shrink-0 opacity-60"
                    style={{ backgroundColor: habit.color + '18' }}
                  >
                    {habit.icon || '📌'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-bold text-stone-400 text-sm truncate">{habit.name}</div>
                    <div className="text-xs text-stone-300 font-medium mt-0.5">已归档</div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="shrink-0 gap-1.5"
                    onClick={() => void restore.mutateAsync(habit.id)}
                    disabled={restore.isPending}
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    恢复
                  </Button>
                </div>
              ))}
            </motion.div>
            </AnimatePresence>
          )}
        </div>
      )}
    </motion.div>
  )
}

export const Route = createFileRoute('/habits')({
  component: HabitsPage,
  beforeLoad: ({ context }) => {
    if (context.auth.loading) return
    if (!context.auth.user) throw redirect({ to: '/login' })
  },
})
