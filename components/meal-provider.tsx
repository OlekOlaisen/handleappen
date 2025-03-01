"use client"

import { createContext, useReducer, useEffect, type ReactNode } from "react"
import type { Meal } from "@/types/meal"
import type { Product } from "@/types/product"
import { supabase } from "@/lib/supabase"
import { useToast } from "@/components/ui/use-toast"
import { useAuth } from "@/components/auth/auth-provider"

interface MealState {
  meals: Meal[]
  activeMealId: string | null
  isLoading: boolean
}

type MealAction =
  | { type: "SET_MEALS"; payload: Meal[] }
  | { type: "SET_LOADING"; payload: boolean }
  | { type: "ADD_MEAL"; payload: Meal }
  | { type: "UPDATE_MEAL"; payload: Meal }
  | { type: "DELETE_MEAL"; payload: string }
  | { type: "SET_ACTIVE_MEAL"; payload: string | null }

interface MealContextType extends Omit<MealState, "isLoading"> {
  isLoading: boolean
  createMeal: (name: string) => Promise<string>
  deleteMeal: (id: string) => Promise<void>
  renameMeal: (id: string, name: string) => Promise<void>
  addProductToMeal: (mealId: string, product: Product, quantity?: number) => Promise<void>
  removeProductFromMeal: (mealId: string, productEan: string) => Promise<void>
  updateProductQuantity: (mealId: string, productEan: string, quantity: number) => Promise<void>
  setActiveMeal: (id: string | null) => void
}

export const MealContext = createContext<MealContextType>({
  meals: [],
  activeMealId: null,
  isLoading: true,
  createMeal: async () => "",
  deleteMeal: async () => {},
  renameMeal: async () => {},
  addProductToMeal: async () => {},
  removeProductFromMeal: async () => {},
  updateProductQuantity: async () => {},
  setActiveMeal: () => {},
})

function mealReducer(state: MealState, action: MealAction): MealState {
  switch (action.type) {
    case "SET_MEALS":
      return {
        ...state,
        meals: action.payload,
      }

    case "SET_LOADING":
      return {
        ...state,
        isLoading: action.payload,
      }

    case "ADD_MEAL":
      return {
        ...state,
        meals: [...state.meals, action.payload],
      }

    case "UPDATE_MEAL":
      return {
        ...state,
        meals: state.meals.map((meal) => (meal.id === action.payload.id ? action.payload : meal)),
      }

    case "DELETE_MEAL":
      return {
        ...state,
        meals: state.meals.filter((meal) => meal.id !== action.payload),
        activeMealId: state.activeMealId === action.payload ? null : state.activeMealId,
      }

    case "SET_ACTIVE_MEAL":
      return {
        ...state,
        activeMealId: action.payload,
      }

    default:
      return state
  }
}

export function MealProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(mealReducer, {
    meals: [],
    activeMealId: null,
    isLoading: true,
  })
  const { toast } = useToast()
  const { user } = useAuth()

  // Load meals from Supabase on mount
  useEffect(() => {
    async function loadMeals() {
      if (!user) {
        dispatch({ type: "SET_MEALS", payload: [] })
        dispatch({ type: "SET_LOADING", payload: false })
        return
      }

      try {
        const { data: meals, error } = await supabase
          .from("meals")
          .select(`
            id,
            name,
            created_at,
            meal_items (
              product_ean,
              quantity,
              product_data
            )
          `)
          .eq("user_id", user.id)
          .order("created_at", { ascending: false })

        if (error) throw error

        const formattedMeals: Meal[] = meals.map((meal) => ({
          id: meal.id,
          name: meal.name,
          items: (meal.meal_items || []).map((item) => ({
            product: item.product_data as Product,
            quantity: item.quantity,
          })),
        }))

        dispatch({ type: "SET_MEALS", payload: formattedMeals })
      } catch (error) {
        console.error("Error loading meals:", error)
        toast({
          title: "Error",
          description: "Could not load meals. Please try again later.",
          variant: "destructive",
        })
      } finally {
        dispatch({ type: "SET_LOADING", payload: false })
      }
    }

    loadMeals()

    // Subscribe to changes
    const mealsSubscription = supabase
      .channel("meals-channel")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "meals",
          filter: `user_id=eq.${user?.id}`,
        },
        () => {
          // Reload meals when changes occur
          loadMeals()
        },
      )
      .subscribe()

    return () => {
      mealsSubscription.unsubscribe()
    }
  }, [toast, user])

  const createMeal = async (name: string) => {
    if (!user) {
      toast({
        title: "Error",
        description: "You must be logged in to create a meal.",
        variant: "destructive",
      })
      throw new Error("Not authenticated")
    }

    try {
      const { data: meal, error } = await supabase
        .from("meals")
        .insert([{ name, user_id: user.id }])
        .select()
        .single()

      if (error) throw error

      const newMeal: Meal = {
        id: meal.id,
        name: meal.name,
        items: [],
      }

      dispatch({ type: "ADD_MEAL", payload: newMeal })
      return meal.id
    } catch (error) {
      console.error("Error creating meal:", error)
      toast({
        title: "Error",
        description: "Could not create meal. Please try again.",
        variant: "destructive",
      })
      throw error
    }
  }

  const deleteMeal = async (id: string) => {
    try {
      const { error } = await supabase.from("meals").delete().eq("id", id)

      if (error) throw error

      dispatch({ type: "DELETE_MEAL", payload: id })
    } catch (error) {
      console.error("Error deleting meal:", error)
      toast({
        title: "Error",
        description: "Could not delete meal. Please try again.",
        variant: "destructive",
      })
      throw error
    }
  }

  const renameMeal = async (id: string, name: string) => {
    try {
      const { error } = await supabase.from("meals").update({ name }).eq("id", id)

      if (error) throw error

      const meal = state.meals.find((m) => m.id === id)
      if (meal) {
        dispatch({
          type: "UPDATE_MEAL",
          payload: { ...meal, name },
        })
      }
    } catch (error) {
      console.error("Error renaming meal:", error)
      toast({
        title: "Error",
        description: "Could not rename meal. Please try again.",
        variant: "destructive",
      })
      throw error
    }
  }

  const addProductToMeal = async (mealId: string, product: Product, quantity = 1) => {
    try {
      const { error } = await supabase.from("meal_items").insert([
        {
          meal_id: mealId,
          product_ean: product.ean,
          quantity,
          product_data: product,
        },
      ])

      if (error) throw error

      const meal = state.meals.find((m) => m.id === mealId)
      if (meal) {
        const updatedMeal: Meal = {
          ...meal,
          items: [...meal.items, { product, quantity }],
        }
        dispatch({ type: "UPDATE_MEAL", payload: updatedMeal })
      }
    } catch (error) {
      console.error("Error adding product to meal:", error)
      toast({
        title: "Error",
        description: "Could not add product to meal. Please try again.",
        variant: "destructive",
      })
      throw error
    }
  }

  const removeProductFromMeal = async (mealId: string, productEan: string) => {
    try {
      const { error } = await supabase.from("meal_items").delete().eq("meal_id", mealId).eq("product_ean", productEan)

      if (error) throw error

      const meal = state.meals.find((m) => m.id === mealId)
      if (meal) {
        const updatedMeal: Meal = {
          ...meal,
          items: meal.items.filter((item) => item.product.ean !== productEan),
        }
        dispatch({ type: "UPDATE_MEAL", payload: updatedMeal })
      }
    } catch (error) {
      console.error("Error removing product from meal:", error)
      toast({
        title: "Error",
        description: "Could not remove product from meal. Please try again.",
        variant: "destructive",
      })
      throw error
    }
  }

  const updateProductQuantity = async (mealId: string, productEan: string, quantity: number) => {
    try {
      if (quantity <= 0) {
        return removeProductFromMeal(mealId, productEan)
      }

      const { error } = await supabase
        .from("meal_items")
        .update({ quantity })
        .eq("meal_id", mealId)
        .eq("product_ean", productEan)

      if (error) throw error

      const meal = state.meals.find((m) => m.id === mealId)
      if (meal) {
        const updatedMeal: Meal = {
          ...meal,
          items: meal.items.map((item) => (item.product.ean === productEan ? { ...item, quantity } : item)),
        }
        dispatch({ type: "UPDATE_MEAL", payload: updatedMeal })
      }
    } catch (error) {
      console.error("Error updating product quantity:", error)
      toast({
        title: "Error",
        description: "Could not update product quantity. Please try again.",
        variant: "destructive",
      })
      throw error
    }
  }

  const setActiveMeal = (id: string | null) => {
    dispatch({ type: "SET_ACTIVE_MEAL", payload: id })
  }

  return (
    <MealContext.Provider
      value={{
        meals: state.meals,
        activeMealId: state.activeMealId,
        isLoading: state.isLoading,
        createMeal,
        deleteMeal,
        renameMeal,
        addProductToMeal,
        removeProductFromMeal,
        updateProductQuantity,
        setActiveMeal,
      }}
    >
      {children}
    </MealContext.Provider>
  )
}

