import type { Habit } from '@/lib/database.types'

export type { Habit, HabitInsert, HabitUpdate, CheckIn, CheckInInsert } from '@/lib/database.types'

export type StatTab = 'day' | 'week' | 'month' | 'year'

export interface DailyCount {
  date: string
  count: number
}

export interface HabitWithTodayCount extends Habit {
  todayCount: number
}

export interface CalendarDatum {
  day: string
  value: number
}
