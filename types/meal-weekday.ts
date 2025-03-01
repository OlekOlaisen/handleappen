export type WeekDay = "monday" | "tuesday" | "wednesday" | "thursday" | "friday" | "saturday" | "sunday"

export interface MealWeekday {
  id: string
  meal_id: string
  weekday: WeekDay
  user_id: string
  created_at: string
}

