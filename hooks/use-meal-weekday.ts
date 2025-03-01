"use client"

import { useContext } from "react"
import { MealWeekdayContext } from "@/components/meal-weekday-provider"

export function useMealWeekday() {
  const context = useContext(MealWeekdayContext)

  if (!context) {
    throw new Error("useMealWeekday must be used within a MealWeekdayProvider")
  }

  return context
}

