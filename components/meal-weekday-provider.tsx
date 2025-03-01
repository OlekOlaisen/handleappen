"use client"

import { createContext, useReducer, useEffect, type ReactNode } from "react"
import type { WeekDay } from "@/types/meal-weekday"
import { supabase } from "@/lib/supabase"
import { useToast } from "@/components/ui/use-toast"
import { useAuth } from "@/components/auth/auth-provider"

interface MealWeekdayState {
  weekdays: Record<WeekDay, string[]> // weekday -> meal_ids
  isLoading: boolean
}

type MealWeekdayAction =
  | { type: "SET_WEEKDAYS"; payload: Record<WeekDay, string[]> }
  | { type: "SET_LOADING"; payload: boolean }
  | { type: "ADD_MEAL"; payload: { weekday: WeekDay; mealId: string } }
  | { type: "REMOVE_MEAL"; payload: { weekday: WeekDay; mealId: string } }

interface MealWeekdayContextType extends Omit<MealWeekdayState, "isLoading"> {
  isLoading: boolean
  addMealToDay: (weekday: WeekDay, mealId: string) => Promise<void>
  removeMealFromDay: (weekday: WeekDay, mealId: string) => Promise<void>
  clearWeek: () => Promise<void>
}

export const MealWeekdayContext = createContext<MealWeekdayContextType>({
  weekdays: {
    monday: [],
    tuesday: [],
    wednesday: [],
    thursday: [],
    friday: [],
    saturday: [],
    sunday: [],
  },
  isLoading: true,
  addMealToDay: async () => {},
  removeMealFromDay: async () => {},
  clearWeek: async () => {},
})

function mealWeekdayReducer(state: MealWeekdayState, action: MealWeekdayAction): MealWeekdayState {
  switch (action.type) {
    case "SET_WEEKDAYS":
      return {
        ...state,
        weekdays: action.payload,
      }
    case "SET_LOADING":
      return {
        ...state,
        isLoading: action.payload,
      }
    case "ADD_MEAL":
      return {
        ...state,
        weekdays: {
          ...state.weekdays,
          [action.payload.weekday]: [...state.weekdays[action.payload.weekday], action.payload.mealId],
        },
      }
    case "REMOVE_MEAL":
      return {
        ...state,
        weekdays: {
          ...state.weekdays,
          [action.payload.weekday]: state.weekdays[action.payload.weekday].filter((id) => id !== action.payload.mealId),
        },
      }
    default:
      return state
  }
}

export function MealWeekdayProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(mealWeekdayReducer, {
    weekdays: {
      monday: [],
      tuesday: [],
      wednesday: [],
      thursday: [],
      friday: [],
      saturday: [],
      sunday: [],
    },
    isLoading: true,
  })
  const { toast } = useToast()
  const { user } = useAuth()

  useEffect(() => {
    async function loadMealWeekdays() {
      if (!user) {
        dispatch({
          type: "SET_WEEKDAYS",
          payload: {
            monday: [],
            tuesday: [],
            wednesday: [],
            thursday: [],
            friday: [],
            saturday: [],
            sunday: [],
          },
        })
        dispatch({ type: "SET_LOADING", payload: false })
        return
      }

      try {
        const { data: mealWeekdays, error } = await supabase
          .from("meal_weekdays")
          .select("*")
          .eq("user_id", user.id)
          .order("created_at", { ascending: true })

        if (error) throw error

        // Group meals by weekday
        const weekdayMeals = (mealWeekdays || []).reduce(
          (acc, mw) => {
            if (!acc[mw.weekday]) {
              acc[mw.weekday] = []
            }
            acc[mw.weekday].push(mw.meal_id)
            return acc
          },
          {
            monday: [],
            tuesday: [],
            wednesday: [],
            thursday: [],
            friday: [],
            saturday: [],
            sunday: [],
          } as Record<WeekDay, string[]>,
        )

        dispatch({ type: "SET_WEEKDAYS", payload: weekdayMeals })
      } catch (error) {
        console.error("Error loading meal weekdays:", error)
        toast({
          title: "Error",
          description: "Could not load meal weekdays. Please try again later.",
          variant: "destructive",
        })
      } finally {
        dispatch({ type: "SET_LOADING", payload: false })
      }
    }

    loadMealWeekdays()

    // Subscribe to changes
    const mealWeekdaysSubscription = supabase
      .channel("meal-weekdays-channel")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "meal_weekdays",
          filter: `user_id=eq.${user?.id}`,
        },
        () => {
          // Reload meal weekdays when changes occur
          loadMealWeekdays()
        },
      )
      .subscribe()

    return () => {
      mealWeekdaysSubscription.unsubscribe()
    }
  }, [toast, user])

  const addMealToDay = async (weekday: WeekDay, mealId: string) => {
    if (!user) {
      toast({
        title: "Error",
        description: "You must be logged in to add meals to weekdays.",
        variant: "destructive",
      })
      throw new Error("Not authenticated")
    }

    try {
      const { error } = await supabase.from("meal_weekdays").insert([
        {
          meal_id: mealId,
          weekday,
          user_id: user.id,
        },
      ])

      if (error) throw error

      dispatch({
        type: "ADD_MEAL",
        payload: { weekday, mealId },
      })
    } catch (error) {
      console.error("Error adding meal to weekday:", error)
      toast({
        title: "Error",
        description: "Could not add meal to weekday. Please try again.",
        variant: "destructive",
      })
      throw error
    }
  }

  const removeMealFromDay = async (weekday: WeekDay, mealId: string) => {
    if (!user) return

    try {
      const { error } = await supabase
        .from("meal_weekdays")
        .delete()
        .eq("weekday", weekday)
        .eq("meal_id", mealId)
        .eq("user_id", user.id)

      if (error) throw error

      dispatch({
        type: "REMOVE_MEAL",
        payload: { weekday, mealId },
      })

      toast({
        description: "Måltid fjernet fra ukesmeny",
      })
    } catch (error) {
      console.error("Error removing meal from weekday:", error)
      toast({
        title: "Error",
        description: "Could not remove meal from weekday. Please try again.",
        variant: "destructive",
      })
      throw error
    }
  }

  const clearWeek = async () => {
    if (!user) return

    try {
      const { error } = await supabase.from("meal_weekdays").delete().eq("user_id", user.id)

      if (error) throw error

      dispatch({
        type: "SET_WEEKDAYS",
        payload: {
          monday: [],
          tuesday: [],
          wednesday: [],
          thursday: [],
          friday: [],
          saturday: [],
          sunday: [],
        },
      })

      toast({
        description: "Ukemeny tømt",
      })
    } catch (error) {
      console.error("Error clearing week:", error)
      toast({
        title: "Error",
        description: "Could not clear week. Please try again.",
        variant: "destructive",
      })
      throw error
    }
  }

  return (
    <MealWeekdayContext.Provider
      value={{
        weekdays: state.weekdays,
        isLoading: state.isLoading,
        addMealToDay,
        removeMealFromDay,
        clearWeek,
      }}
    >
      {children}
    </MealWeekdayContext.Provider>
  )
}

