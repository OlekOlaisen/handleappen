"use client"

import { useContext } from "react"
import { WeekPlannerContext } from "@/components/week-planner-provider"

export function useWeekPlanner() {
  const context = useContext(WeekPlannerContext)

  if (!context) {
    throw new Error("useWeekPlanner must be used within a WeekPlannerProvider")
  }

  return context
}

