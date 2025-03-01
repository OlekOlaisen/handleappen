"use client"

import { useContext } from "react"
import { MealContext } from "@/components/meal-provider"

export function useMeal() {
  const context = useContext(MealContext)

  if (!context) {
    throw new Error("useMeal must be used within a MealProvider")
  }

  return context
}

