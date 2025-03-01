export type DayOfWeek = "monday" | "tuesday" | "wednesday" | "thursday" | "friday" | "saturday" | "sunday"

export interface WeekDay {
  id: string
  plan_id: string
  day_of_week: DayOfWeek
  meal_ids: string[]
  created_at: string
  updated_at: string
}

export interface WeekPlan {
  id: string
  user_id: string
  year: number
  week: number
  created_at: string
  updated_at: string
  days?: WeekDay[]
}

