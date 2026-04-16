import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/** Parse a yyyy-MM-dd string as local date (avoids UTC midnight interpretation) */
function parseLocalDate(s: string): Date {
  const [y, m, d] = s.split('-').map(Number)
  return new Date(y, m - 1, d)
}

/** Build an inclusive yyyy-MM-dd date list between start and end using local dates. */
export function getDateRangeDays(start: string, end: string): string[] {
  const result: string[] = []
  const cursor = parseLocalDate(start)
  const endDate = parseLocalDate(end)
  while (cursor <= endDate) {
    result.push(formatDate(cursor))
    cursor.setDate(cursor.getDate() + 1)
  }
  return result
}

export function formatDate(date: Date | string, fmt = 'yyyy-MM-dd') {
  const d = typeof date === 'string'
    ? /^\d{4}-\d{2}-\d{2}$/.test(date) ? parseLocalDate(date) : new Date(date)
    : date
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  if (fmt === 'yyyy-MM-dd') return `${year}-${month}-${day}`
  if (fmt === 'MM-dd') return `${month}-${day}`
  if (fmt === 'M月d日') return `${d.getMonth() + 1}月${d.getDate()}日`
  if (fmt === 'yyyy年M月') return `${year}年${d.getMonth() + 1}月`
  return `${year}-${month}-${day}`
}

export function formatTime(date: Date | string) {
  const d = typeof date === 'string' ? new Date(date) : date
  return d.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
}

export function today() {
  return formatDate(new Date())
}

export function getWeekRange(date = new Date()) {
  const d = new Date(date)
  const day = d.getDay()
  const diff = day === 0 ? -6 : 1 - day
  const mon = new Date(d)
  mon.setDate(d.getDate() + diff)
  const sun = new Date(mon)
  sun.setDate(mon.getDate() + 6)
  return { start: formatDate(mon), end: formatDate(sun) }
}

export function getMonthRange(date = new Date()) {
  const year = date.getFullYear()
  const month = date.getMonth()
  const start = formatDate(new Date(year, month, 1))
  const end = formatDate(new Date(year, month + 1, 0))
  return { start, end }
}

export function getLast7Days(): string[] {
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date()
    d.setDate(d.getDate() - (6 - i))
    return formatDate(d)
  })
}

export function getLast30Days(): string[] {
  return Array.from({ length: 30 }, (_, i) => {
    const d = new Date()
    d.setDate(d.getDate() - (29 - i))
    return formatDate(d)
  })
}

export function computeStreak(dates: string[]): number {
  if (!dates.length) return 0
  const sorted = [...new Set(dates)].sort().reverse()
  const todayStr = today()
  // 宽容逻辑：若今天还没打卡，从昨天开始计算，给用户当天时间
  const yesterday = (() => {
    const d = new Date()
    d.setDate(d.getDate() - 1)
    return formatDate(d)
  })()
  let current = sorted[0] === todayStr ? todayStr : yesterday
  let streak = 0
  for (const d of sorted) {
    if (d === current) {
      streak++
      const prev = parseLocalDate(current)
      prev.setDate(prev.getDate() - 1)
      current = formatDate(prev)
    } else if (d < current) {
      break
    }
  }
  return streak
}

export function computeLongestStreak(dates: string[]): number {
  if (!dates.length) return 0
  const sorted = [...new Set(dates)].sort()
  let max = 1
  let cur = 1
  for (let i = 1; i < sorted.length; i++) {
    const prev = parseLocalDate(sorted[i - 1])
    prev.setDate(prev.getDate() + 1)
    if (formatDate(prev) === sorted[i]) {
      cur++
      max = Math.max(max, cur)
    } else {
      cur = 1
    }
  }
  return max
}

export const HABIT_COLORS = [
  '#f97316', '#ef4444', '#ec4899', '#a855f7',
  '#6366f1', '#3b82f6', '#06b6d4', '#14b8a6',
  '#22c55e', '#84cc16', '#eab308', '#f59e0b',
]

export const HABIT_ICONS = [
  // 徒手训练常用（俯卧撑/仰卧起坐/平板支撑/跳绳/深蹲/提膝）
  '🧎', '🛌', '🪢', '🦿', '🏃‍♂️', '🏃‍♀️', '🏋️‍♂️', '🏋️‍♀️',
  // 有氧 & 全身
  '🏃', '🚴', '🏊', '🚶', '🤸', '🏄', '🚣', '🚵',
  // 力量 & 专项
  '🏋️', '💪', '🦵', '🥊', '🥋', '⛹️', '🏸', '🎾',
  // 球类 & 竞技
  '⚽', '🏆', '🥇', '🎯', '🧗', '🤼', '🏇', '🤾',
  // 身心 & 恢复
  '🧘', '😴', '💊', '❤️', '🧠', '🌿', '🛁', '🧊',
  // 学习 & 创作
  '📖', '✍️', '🎨', '🎵', '💻', '🎙️', '📝', '🔬',
  // 生活 & 饮食
  '🍎', '🥗', '💧', '☕', '🌱', '🧹', '🐕', '⭐',
]
