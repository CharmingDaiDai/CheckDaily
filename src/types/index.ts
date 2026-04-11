
import type { Habit, HabitInsert, HabitUpdate, HabitCombo, HabitComboInsert, HabitComboUpdate, CheckIn, CheckInInsert } from '@/lib/database.types'

export type { Habit, HabitInsert, HabitUpdate, HabitCombo, HabitComboInsert, HabitComboUpdate, CheckIn, CheckInInsert }

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
