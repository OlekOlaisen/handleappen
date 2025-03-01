"use client"

import { createContext, useReducer, useEffect, type ReactNode } from "react"
import { getWeek, getYear } from "date-fns"
import type { WeekPlan, DayOfWeek } from "@/types/week-planner"
import { supabase } from "@/lib/supabase"
import { useToast } from "@/components/ui/use-toast"
import { useAuth } from "@/components/auth/auth-provider"

interface WeekPlannerState {
  currentPlan: WeekPlan | null
  isLoading: boolean
  error: string | null
}

type WeekPlannerAction =
  | { type: "SET_PLAN"; payload: WeekPlan | null }
  | { type: "SET_LOADING"; payload: boolean }
  | { type: "SET_ERROR"; payload: string | null }
  | { type: "UPDATE_DAY"; payload: { dayOfWeek: DayOfWeek; mealIds: string[] } }

interface WeekPlannerContextType extends Omit<WeekPlannerState, "error"> {
  addMealToDay: (dayOfWeek: DayOfWeek, mealId: string) => Promise<void>
  removeMealFromDay: (dayOfWeek: DayOfWeek, mealId: string) => Promise<void>
  clearDay: (dayOfWeek: DayOfWeek) => Promise<void>
}

export const WeekPlannerContext = createContext<WeekPlannerContextType>({
  currentPlan: null,
  isLoading: true,
  addMealToDay: async () => {},
  removeMealFromDay: async () => {},
  clearDay: async () => {},
})

const DAYS_OF_WEEK: DayOfWeek[] = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"]

function weekPlannerReducer(state: WeekPlannerState, action: WeekPlannerAction): WeekPlannerState {
  switch (action.type) {
    case "SET_PLAN":
      return {
        ...state,
        currentPlan: action.payload,
        error: null,
      }
    case "SET_LOADING":
      return {
        ...state,
        isLoading: action.payload,
      }
    case "SET_ERROR":
      return {
        ...state,
        error: action.payload,
      }
    case "UPDATE_DAY":
      if (!state.currentPlan?.days) return state

      return {
        ...state,
        currentPlan: {
          ...state.currentPlan,
          days: state.currentPlan.days.map((day) =>
            day.day_of_week === action.payload.dayOfWeek ? { ...day, meal_ids: action.payload.mealIds } : day,
          ),
        },
      }
    default:
      return state
  }
}

export function WeekPlannerProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(weekPlannerReducer, {
    currentPlan: null,
    isLoading: true,
    error: null,
  })
  const { toast } = useToast()
  const { user } = useAuth()

  useEffect(() => {
    async function loadOrCreateCurrentWeekPlan() {
      if (!user) {
        dispatch({ type: "SET_PLAN", payload: null })
        dispatch({ type: "SET_LOADING", payload: false })
        return
      }

      try {
        const today = new Date()
        const currentWeek = getWeek(today, { weekStartsOn: 1 })
        const currentYear = getYear(today)

        // Try to find existing plan for current week
        const { data: existingPlan, error: fetchError } = await supabase
          .from("week_plans")
          .select(
            `
            *,
            days:week_days(*)
          `,
          )
          .eq("user_id", user.id)
          .eq("year", currentYear)
          .eq("week", currentWeek)
          .single()

        if (fetchError && fetchError.code !== "PGRST116") {
          // PGRST116 means no rows returned, which is fine
          throw fetchError
        }

        if (existingPlan) {
          dispatch({ type: "SET_PLAN", payload: existingPlan })
        } else {
          // Create new plan for current week
          const { data: newPlan, error: insertPlanError } = await supabase
            .from("week_plans")
            .upsert(
              {
                user_id: user.id,
                year: currentYear,
                week: currentWeek,
              },
              { onConflict: "user_id,year,week", ignoreDuplicates: false },
            )
            .select()
            .single()

          if (insertPlanError) throw insertPlanError

          // Create days for the new plan
          const { data: days, error: insertDaysError } = await supabase
            .from("week_days")
            .insert(
              DAYS_OF_WEEK.map((day_of_week) => ({
                plan_id: newPlan.id,
                day_of_week,
                meal_ids: [],
              })),
            )
            .select()

          if (insertDaysError) throw insertDaysError

          dispatch({
            type: "SET_PLAN",
            payload: {
              ...newPlan,
              days,
            },
          })
        }
      } catch (error) {
        console.error("Error loading week plan:", error)
        dispatch({ type: "SET_ERROR", payload: "Could not load week plan" })
        toast({
          title: "Error",
          description: "Could not load week plan. Please try again later.",
          variant: "destructive",
        })
      } finally {
        dispatch({ type: "SET_LOADING", payload: false })
      }
    }

    loadOrCreateCurrentWeekPlan()
  }, [toast, user])

  const addMealToDay = async (dayOfWeek: DayOfWeek, mealId: string) => {
    if (!state.currentPlan?.days) return

    const day = state.currentPlan.days.find((d) => d.day_of_week === dayOfWeek)
    if (!day) return

    try {
      const updatedMealIds = [...day.meal_ids, mealId]

      const { error } = await supabase.from("week_days").update({ meal_ids: updatedMealIds }).eq("id", day.id)

      if (error) throw error

      dispatch({
        type: "UPDATE_DAY",
        payload: { dayOfWeek, mealIds: updatedMealIds },
      })

      toast({
        description: "Meal added to day",
      })
    } catch (error) {
      console.error("Error adding meal to day:", error)
      toast({
        title: "Error",
        description: "Could not add meal to day. Please try again.",
        variant: "destructive",
      })
    }
  }

  const removeMealFromDay = async (dayOfWeek: DayOfWeek, mealId: string) => {
    if (!state.currentPlan?.days) return

    const day = state.currentPlan.days.find((d) => d.day_of_week === dayOfWeek)
    if (!day) return

    try {
      const updatedMealIds = day.meal_ids.filter((id) => id !== mealId)

      const { error } = await supabase.from("week_days").update({ meal_ids: updatedMealIds }).eq("id", day.id)

      if (error) throw error

      dispatch({
        type: "UPDATE_DAY",
        payload: { dayOfWeek, mealIds: updatedMealIds },
      })

      toast({
        description: "Meal removed from day",
      })
    } catch (error) {
      console.error("Error removing meal from day:", error)
      toast({
        title: "Error",
        description: "Could not remove meal from day. Please try again.",
        variant: "destructive",
      })
    }
  }

  const clearDay = async (dayOfWeek: DayOfWeek) => {
    if (!state.currentPlan?.days) return

    const day = state.currentPlan.days.find((d) => d.day_of_week === dayOfWeek)
    if (!day) return

    try {
      const { error } = await supabase.from("week_days").update({ meal_ids: [] }).eq("id", day.id)

      if (error) throw error

      dispatch({
        type: "UPDATE_DAY",
        payload: { dayOfWeek, mealIds: [] },
      })

      toast({
        description: "Day cleared",
      })
    } catch (error) {
      console.error("Error clearing day:", error)
      toast({
        title: "Error",
        description: "Could not clear day. Please try again.",
        variant: "destructive",
      })
    }
  }

  return (
    <WeekPlannerContext.Provider
      value={{
        currentPlan: state.currentPlan,
        isLoading: state.isLoading,
        addMealToDay,
        removeMealFromDay,
        clearDay,
      }}
    >
      {children}
    </WeekPlannerContext.Provider>
  )
}

