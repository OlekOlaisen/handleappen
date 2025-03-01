export type WeekDay = "monday" | "tuesday" | "wednesday" | "thursday" | "friday" | "saturday" | "sunday"

export interface DayPlan {
  meals: string[] // Meal IDs
}

export interface WeekPlan {
  id: string
  startDate: string // ISO date string
  days: Record<WeekDay, DayPlan>
}

