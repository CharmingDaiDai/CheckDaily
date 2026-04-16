import { useState, useMemo } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { motion, AnimatePresence } from 'motion/react'
import { Plus, Pencil, Archive, MoreHorizontal, ListCheck, Search, X, RotateCcw, ChevronDown, ChevronUp, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ModalOverlay } from '@/components/ui/modal-overlay'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { Skeleton } from '@/components/ui/skeleton'
import { HabitForm } from '@/components/habits/HabitForm'
import { ComboForm } from '@/components/habits/ComboForm'
import { useHabits, useArchiveHabit, useRestoreHabit } from '@/hooks/useHabits'
import { useCombos, useDeleteCombo } from '@/hooks/useCombos'
import { toast } from '@/hooks/useToast'
import type { Habit, HabitCombo } from '@/types'
import { pageChoreography, sectionReveal, listItemSlide } from '@/lib/motion'
import { HabitIcon } from '@/lib/habitIcons'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'

export const Route = createFileRoute('/habits')({
  component: HabitsPage,
})

export default function HabitsPage() {
  const {
    data: habits,
    isLoading: habitsLoading,
    error: habitsError,
    refetch: refetchHabits,
  } = useHabits(false)
  
  const {
    data: allHabits,
    error: allHabitsError,
  } = useHabits(true)

  const {
    data: combos,
    isLoading: combosLoading,
    error: combosError,
    refetch: refetchCombos,
  } = useCombos()

  const [activeTab, setActiveTab] = useState<'habits' | 'combos'>('habits')

  const [createOpen, setCreateOpen] = useState(false)
  const [editHabit, setEditHabit] = useState<Habit | null>(null)
  
  const [createComboOpen, setCreateComboOpen] = useState(false)
  const [editCombo, setEditCombo] = useState<HabitCombo | null>(null)

  const [search, setSearch] = useState('')
  const [showArchived, setShowArchived] = useState(false)
  
  const [archiveTarget, setArchiveTarget] = useState<{ id: string; name: string } | null>(null)
  const [deleteComboTarget, setDeleteComboTarget] = useState<{ id: string; name: string } | null>(null)
  
  const archive = useArchiveHabit()
  const restore = useRestoreHabit()
  const deleteCombo = useDeleteCombo()

  const hasLoadError = Boolean(habitsError || allHabitsError || combosError)

  const filteredHabits = useMemo(
    () => habits?.filter(h => h.name.toLowerCase().includes(search.toLowerCase())) ?? [],
    [habits, search]
  )

  const filteredCombos = useMemo(
    () => combos?.filter(c => c.name.toLowerCase().includes(search.toLowerCase())) ?? [],
    [combos, search]
  )

  const archivedHabits = useMemo(
    () => allHabits?.filter(h => h.archived) ?? [],
    [allHabits]
  )

  return (
    <motion.div
      className="max-w-2xl mx-auto px-4 pt-6 sm:pt-8 pb-6 space-y-6"
      variants={pageChoreography}
      initial="initial"
      animate="animate"
    >
      {/* Header */}
      <motion.div variants={sectionReveal} className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between border-b border-[var(--color-line-soft)] pb-5">
        <div>
          <h1 className="headline-premium text-[2.02rem] sm:text-[2.3rem] font-normal tracking-[0.01em] text-[var(--color-ink-950)]">项目管理</h1>
          <p className="text-sm text-[var(--color-ink-500)] font-medium mt-0.5">
            {habits?.length ?? 0} 个项目 · {combos?.length ?? 0} 个组合
          </p>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto overflow-x-auto select-none no-scrollbar">
          <Tabs value={activeTab} onValueChange={(v: any) => { setActiveTab(v); setSearch(''); }} className="shrink-0">
            <TabsList>
              <TabsTrigger value="habits">单项运动</TabsTrigger>
              <TabsTrigger value="combos">运动组合</TabsTrigger>
            </TabsList>
          </Tabs>

          <Button 
            size="default" 
            onClick={() => activeTab === 'habits' ? setCreateOpen(true) : setCreateComboOpen(true)}
            className="shrink-0 ml-auto sm:ml-0"
          >
            <Plus className="w-4 h-4" strokeWidth={2.5} />
            新建{activeTab === 'habits' ? '单项' : '组合'}
          </Button>
        </div>
      </motion.div>

      {/* Modals & Dialogs */}
      <ModalOverlay open={createOpen} onOpenChange={setCreateOpen} title="新建打卡项目">
        <HabitForm onClose={() => setCreateOpen(false)} />
      </ModalOverlay>
      
      <ModalOverlay open={!!editHabit} onOpenChange={(o) => { if (!o) setEditHabit(null) }} title="编辑项目">
        {editHabit && <HabitForm existing={editHabit} onClose={() => setEditHabit(null)} />}
      </ModalOverlay>

      <ModalOverlay open={createComboOpen} onOpenChange={setCreateComboOpen} title="新建运动组合">
        <ComboForm habits={habits ?? []} onClose={() => setCreateComboOpen(false)} />
      </ModalOverlay>

      <ModalOverlay open={!!editCombo} onOpenChange={(o) => { if (!o) setEditCombo(null) }} title="编辑组合">
        {editCombo && <ComboForm existing={editCombo} habits={habits ?? []} onClose={() => setEditCombo(null)} />}
      </ModalOverlay>

      <ConfirmDialog
        open={!!archiveTarget}
        onOpenChange={(open) => { if (!open) setArchiveTarget(null) }}
        title={"确认归档「」？"}
        description="归档后将不再出现在今日打卡列表中。你可以在已归档区域恢复。"
        confirmText="归档"
        variant="danger"
        onConfirm={async () => {
          if (!archiveTarget) return
          const target = archiveTarget
          await archive.mutateAsync(target.id)
          toast.success("已归档「」", {
            duration: 5200,
            action: {
              label: '撤销',
              onClick: async () => {
                try {
                  await restore.mutateAsync(target.id)
                  toast.success("已恢复「」")
                } catch {}
              },
            },
          })
        }}
      />

      <ConfirmDialog
        open={!!deleteComboTarget}
        onOpenChange={(open) => { if (!open) setDeleteComboTarget(null) }}
        title={"确认删除组合「」？"}
        description="删除组合不会影响其中的单项运动及其历史打卡记录，操作不可恢复。"
        confirmText="删除"
        variant="danger"
        onConfirm={async () => {
          if (!deleteComboTarget) return
          await deleteCombo.mutateAsync(deleteComboTarget.id)
        }}
      />

      {/* Loading & Content */}
      {(hasLoadError && !habitsLoading && !combosLoading) ? (
        <motion.div variants={sectionReveal} className="flex flex-col items-center justify-center py-14 text-center">
          <div className="font-bold text-rose-700 text-base">数据暂时无法加载</div>
          <div className="text-rose-500/80 text-sm mt-1 mb-4">请检查网络后重试</div>
          <Button variant="outline" onClick={() => { refetchHabits(); refetchCombos(); }}>再试一次</Button>
        </motion.div>
      ) : (habitsLoading || combosLoading) ? (
        <motion.div variants={sectionReveal} className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-20 rounded-[var(--radius-card-lg)]" />
          ))}
        </motion.div>
      ) : (
        <>
          {/* Search bar */}
          {((activeTab === 'habits' && (habits?.length ?? 0) > 0) || (activeTab === 'combos' && (combos?.length ?? 0) > 0)) && (
            <div className="relative mb-4">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
              <Input
                placeholder="搜索…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10 pr-14"
              />
              {search && (
                <button
                  className="absolute right-1 top-1/2 -translate-y-1/2 w-11 h-11 rounded-xl flex items-center justify-center text-stone-400 hover:text-stone-600 hover:bg-white transition-colors"
                  onClick={() => setSearch('')}
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          )}

          {activeTab === 'habits' && (
            <motion.div key="habits-list" variants={sectionReveal} initial="initial" animate="animate">
              {(habits?.length ?? 0) === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <div className="w-20 h-20 rounded-full bg-stone-100 flex items-center justify-center mb-4">
                    <ListCheck className="w-10 h-10 text-stone-300" strokeWidth={1.5} />
                  </div>
                  <div className="font-bold text-stone-700 text-lg mb-1">还没有单项运动</div>
                  <div className="text-stone-400 text-sm mb-5">开始创建你的第一个运动项目</div>
                  <Button onClick={() => setCreateOpen(true)}>
                    <Plus className="w-4 h-4" strokeWidth={2.5} /> 新建项目
                  </Button>
                </div>
              ) : filteredHabits.length > 0 ? (
                <div className="space-y-3">
                  {filteredHabits.map((habit) => (
                    <motion.div key={habit.id} variants={listItemSlide} className="flex items-center gap-4 glass-card rounded-[var(--radius-card-lg)] px-4 py-3.5">
                      <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl shrink-0" style={{ backgroundColor: habit.color + '18', borderColor: habit.color + '30' }}>
                        <HabitIcon icon={habit.icon} className="w-6 h-6" color={habit.color} fallback="📌" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-bold text-stone-900 text-base truncate">{habit.name}</div>
                        <div className="flex items-center gap-2 mt-1">
                          <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: habit.color }} />
                            <span className="text-[11px] text-[var(--color-ink-500)] font-medium">
                            {new Date(habit.created_at).toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' })} 创建
                          </span>
                        </div>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon-sm" className="shrink-0"><MoreHorizontal className="w-4 h-4" /></Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => setEditHabit(habit)}>
                            <Pencil className="w-3.5 h-3.5 mr-2" /> 编辑
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => setArchiveTarget({ id: habit.id, name: habit.name })} className="text-red-600 focus:bg-red-50">
                            <Archive className="w-3.5 h-3.5 mr-2" /> 归档
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div className="py-10 text-center text-stone-400 text-sm">没有找到对应的单项</div>
              )}

              {/* Archived */}
              {archivedHabits.length > 0 && (
                <div className="mt-8 pt-4 border-t border-[var(--color-line-soft)]">
                  <button
                    className="flex items-center gap-2 w-full text-sm font-semibold text-stone-400 hover:text-stone-600 transition-colors py-1"
                    onClick={() => setShowArchived(v => !v)}
                  >
                    {showArchived ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    已归档项目（{archivedHabits.length}）
                  </button>

                  {showArchived && (
                    <AnimatePresence>
                      <motion.div className="space-y-3 mt-3" initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}>
                        {archivedHabits.map((habit) => (
                          <div key={habit.id} className="flex items-center gap-4 bg-white/45 rounded-2xl px-4 py-3.5 border border-stone-200/60">
                            <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl opacity-60" style={{ backgroundColor: habit.color + '18' }}>
                              <HabitIcon icon={habit.icon} className="w-5 h-5" color={habit.color} fallback="📌" />
                            </div>
                            <div className="flex-1 min-w-0 opacity-70">
                              <div className="font-bold text-stone-600 text-sm truncate">{habit.name}</div>
                            </div>
                            <Button variant="outline" size="sm" onClick={() => restore.mutate(habit.id)} isLoading={restore.isPending}>
                              <RotateCcw className="w-3.5 h-3.5 mr-1" /> 恢复
                            </Button>
                          </div>
                        ))}
                      </motion.div>
                    </AnimatePresence>
                  )}
                </div>
              )}
            </motion.div>
          )}

          {activeTab === 'combos' && (
            <motion.div key="combos-list" variants={sectionReveal} initial="initial" animate="animate">
              {(combos?.length ?? 0) === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <div className="w-20 h-20 rounded-full bg-brand-50 flex items-center justify-center mb-4">
                    <ListCheck className="w-10 h-10 text-brand-300" strokeWidth={1.5} />
                  </div>
                  <div className="font-bold text-stone-700 text-lg mb-1">还没有运动组合</div>
                  <div className="text-stone-400 text-sm mb-5">把经常一起做的运动打包，一键轻松打卡</div>
                  <Button onClick={() => setCreateComboOpen(true)}>
                    <Plus className="w-4 h-4" strokeWidth={2.5} /> 创建组合
                  </Button>
                </div>
              ) : filteredCombos.length > 0 ? (
                <div className="space-y-3">
                  {filteredCombos.map((combo) => {
                    const linkedHabits = (habits ?? []).filter(h => combo.habit_ids.includes(h.id))
                    
                    return (
                      <motion.div key={combo.id} variants={listItemSlide} className="flex flex-col gap-3 glass-card rounded-[var(--radius-card-lg)] px-4 py-3.5 border-t border-[var(--color-line-soft)]">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-[0.8rem] flex items-center justify-center text-xl shrink-0 border" style={{ backgroundColor: combo.color + '15', borderColor: combo.color + '40' }}>
                              <HabitIcon icon={combo.icon} className="w-[18px] h-[18px]" color={combo.color} fallback="🚀" />
                            </div>
                            <div>
                              <div className="font-bold text-stone-900 text-[15px]">{combo.name}</div>
                              <div className="text-[11px] text-stone-500 font-medium leading-none mt-1">
                                包含 {combo.habit_ids.length} 个项目
                              </div>
                            </div>
                          </div>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon-sm" className="shrink-0"><MoreHorizontal className="w-4 h-4" /></Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => setEditCombo(combo)}>
                                <Pencil className="w-3.5 h-3.5 mr-2" /> 编辑
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => setDeleteComboTarget(combo)} className="text-red-600 focus:bg-red-50">
                                <Trash2 className="w-3.5 h-3.5 mr-2" /> 删除
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                        
                        <div className="flex flex-wrap gap-1.5">
                          {linkedHabits.map(h => (
                            <span key={h.id} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-stone-100 text-[10px] font-bold text-stone-600">
                              <HabitIcon icon={h.icon} className="w-3.5 h-3.5" color={h.color} fallback="📌" /> {h.name}
                            </span>
                          ))}
                        </div>
                      </motion.div>
                    )
                  })}
                </div>
              ) : (
                <div className="py-10 text-center text-stone-400 text-sm">没有找到对应的组合</div>
              )}
            </motion.div>
          )}
        </>
      )}
    </motion.div>
  )
}
