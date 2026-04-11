export type Json = string | number | boolean | null | { [key: string]: Json } | Json[]

export type Database = {
  public: {
    Tables: {
      habit_combos: {
        Row: {
          id: string
          user_id: string
          name: string
          color: string
          icon: string
          habit_ids: string[]
          created_at: string
        }
        Insert: {
          id?: string
          user_id?: string
          name: string
          color?: string
          icon?: string
          habit_ids?: string[]
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          color?: string
          icon?: string
          habit_ids?: string[]
          created_at?: string
        }
        Relationships: []
      }
      habits: {
        Row: {
          id: string
          user_id: string
          name: string
          color: string
          icon: string
          archived: boolean
          created_at: string
        }
        Insert: {
          id?: string
          user_id?: string
          name: string
          color?: string
          icon?: string
          archived?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          color?: string
          icon?: string
          archived?: boolean
          created_at?: string
        }
        Relationships: []
      }
      check_ins: {
        Row: {
          id: string
          habit_id: string
          user_id: string
          checked_at: string
          note: string | null
          created_at: string
        }
        Insert: {
          id?: string
          habit_id: string
          user_id?: string
          checked_at?: string
          note?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          habit_id?: string
          user_id?: string
          checked_at?: string
          note?: string | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'check_ins_habit_id_fkey'
            columns: ['habit_id']
            isOneToOne: false
            referencedRelation: 'habits'
            referencedColumns: ['id']
          }
        ]
      }
    }
    Views: Record<string, never>
    Functions: Record<string, never>
    Enums: Record<string, never>
    CompositeTypes: Record<string, never>
  }
}

export type Habit = Database['public']['Tables']['habits']['Row']
export type HabitInsert = Database['public']['Tables']['habits']['Insert']
export type HabitUpdate = Database['public']['Tables']['habits']['Update']

export type HabitCombo = Database['public']['Tables']['habit_combos']['Row']
export type HabitComboInsert = Database['public']['Tables']['habit_combos']['Insert']
export type HabitComboUpdate = Database['public']['Tables']['habit_combos']['Update']

export type CheckIn = Database['public']['Tables']['check_ins']['Row']
export type CheckInInsert = Database['public']['Tables']['check_ins']['Insert']

