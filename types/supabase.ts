export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export interface Database {
  public: {
    Tables: {
      meals: {
        Row: {
          id: string
          created_at: string
          name: string
          user_id: string | null
        }
        Insert: {
          id?: string
          created_at?: string
          name: string
          user_id?: string | null
        }
        Update: {
          id?: string
          created_at?: string
          name?: string
          user_id?: string | null
        }
      }
      meal_items: {
        Row: {
          meal_id: string
          product_ean: string
          quantity: number
          product_data: Json
        }
        Insert: {
          meal_id: string
          product_ean: string
          quantity: number
          product_data: Json
        }
        Update: {
          meal_id?: string
          product_ean?: string
          quantity?: number
          product_data?: Json
        }
      }
      week_plans: {
        Row: {
          id: string
          created_at: string
          start_date: string
          user_id: string | null
        }
        Insert: {
          id?: string
          created_at?: string
          start_date: string
          user_id?: string | null
        }
        Update: {
          id?: string
          created_at?: string
          start_date?: string
          user_id?: string | null
        }
      }
      week_plan_days: {
        Row: {
          plan_id: string
          day: string
          meal_ids: string[]
        }
        Insert: {
          plan_id: string
          day: string
          meal_ids: string[]
        }
        Update: {
          plan_id?: string
          day?: string
          meal_ids?: string[]
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
}

