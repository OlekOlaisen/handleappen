"use client"

import { createContext, useReducer, useEffect, type ReactNode } from "react"
import type { Product } from "@/types/product"
import { supabase } from "@/lib/supabase"
import { useAuth } from "@/components/auth/auth-provider"
import { useToast } from "@/components/ui/use-toast"

export interface CartItem extends Product {
  quantity: number
  storeOptions: Product[]
}

interface CartState {
  items: CartItem[]
  bestStores: Record<string, string>
  totalByStore: Record<string, number>
  orphanedItems: CartItem[] // Items that can't be bought in the best store
  isLoading: boolean
  isSyncing: boolean
}

type CartAction =
  | { type: "ADD_ITEM"; payload: Product }
  | { type: "REMOVE_ITEM"; payload: string }
  | { type: "UPDATE_QUANTITY"; payload: { ean: string; quantity: number } }
  | { type: "CLEAR_CART" }
  | { type: "SET_CART"; payload: CartItem[] }
  | { type: "SET_LOADING"; payload: boolean }
  | { type: "SET_SYNCING"; payload: boolean }

interface CartContextType extends Omit<CartState, "isLoading" | "isSyncing"> {
  addItem: (product: Product) => void
  removeItem: (ean: string) => void
  updateQuantity: (ean: string, quantity: number) => void
  clearCart: () => void
  isLoading: boolean
  isSyncing: boolean
}

export const CartContext = createContext<CartContextType>({
  items: [],
  bestStores: {},
  totalByStore: {},
  orphanedItems: [],
  isLoading: true,
  isSyncing: false,
  addItem: () => {},
  removeItem: () => {},
  updateQuantity: () => {},
  clearCart: () => {},
})

function findBestStoreForItems(items: CartItem[]): {
  bestStore: string
  totalByStore: Record<string, number>
  availableItems: CartItem[]
  orphanedItems: CartItem[]
} {
  const totalByStore: Record<string, number> = {}
  const itemsByStore: Record<string, CartItem[]> = {}

  // First, collect all store combinations and their totals
  items.forEach((item) => {
    item.storeOptions.forEach((option) => {
      const storeName = option.store.name
      if (!itemsByStore[storeName]) {
        itemsByStore[storeName] = []
      }
      itemsByStore[storeName].push(item)
    })
  })

  // Calculate totals for stores that have most items
  Object.entries(itemsByStore).forEach(([store, storeItems]) => {
    // Only calculate total if this store has the most items or equal to the most
    const maxItems = Math.max(...Object.values(itemsByStore).map((items) => items.length))
    if (storeItems.length === maxItems) {
      let total = 0
      storeItems.forEach((item) => {
        const storeOption = item.storeOptions.find((opt) => opt.store.name === store)
        if (storeOption) {
          total += storeOption.current_price * item.quantity
        }
      })
      totalByStore[store] = total
    }
  })

  // Find the store with the lowest total among those with the most items
  let bestStore = ""
  let lowestTotal = Number.POSITIVE_INFINITY
  Object.entries(totalByStore).forEach(([store, total]) => {
    if (total < lowestTotal) {
      lowestTotal = total
      bestStore = store
    }
  })

  // Separate items into available and orphaned
  const availableItems: CartItem[] = []
  const orphanedItems: CartItem[] = []

  items.forEach((item) => {
    if (item.storeOptions.some((opt) => opt.store.name === bestStore)) {
      availableItems.push(item)
    } else {
      orphanedItems.push(item)
    }
  })

  return { bestStore, totalByStore, availableItems, orphanedItems }
}

function cartReducer(state: CartState, action: CartAction): CartState {
  switch (action.type) {
    case "ADD_ITEM": {
      const existingItem = state.items.find((item) => item.ean === action.payload.ean)
      const existingOrphanedItem = state.orphanedItems.find((item) => item.ean === action.payload.ean)

      let newItems = state.items
      let newOrphanedItems = state.orphanedItems

      if (existingItem) {
        newItems = state.items.map((item) =>
          item.ean === action.payload.ean ? { ...item, quantity: item.quantity + 1 } : item,
        )
      } else if (existingOrphanedItem) {
        newOrphanedItems = state.orphanedItems.map((item) =>
          item.ean === action.payload.ean ? { ...item, quantity: item.quantity + 1 } : item,
        )
      } else {
        const newItem = {
          ...action.payload,
          quantity: 1,
          storeOptions: action.payload.storeOptions || [action.payload],
        }

        // Check if the new item can be bought in the current best store
        const currentBestStore = Object.values(state.bestStores)[0]
        if (currentBestStore && newItem.storeOptions.some((opt) => opt.store.name === currentBestStore)) {
          newItems = [...state.items, newItem]
        } else {
          newOrphanedItems = [...state.orphanedItems, newItem]
        }
      }

      const { bestStore, totalByStore, availableItems, orphanedItems } = findBestStoreForItems([
        ...newItems,
        ...newOrphanedItems,
      ])

      const bestStores = availableItems.reduce(
        (acc, item) => {
          acc[item.ean] = bestStore
          return acc
        },
        {} as Record<string, string>,
      )

      return {
        ...state,
        items: availableItems,
        orphanedItems: orphanedItems,
        bestStores,
        totalByStore,
      }
    }

    case "REMOVE_ITEM": {
      const newItems = state.items.filter((item) => item.ean !== action.payload)
      const newOrphanedItems = state.orphanedItems.filter((item) => item.ean !== action.payload)

      const { bestStore, totalByStore, availableItems, orphanedItems } = findBestStoreForItems([
        ...newItems,
        ...newOrphanedItems,
      ])

      const bestStores = availableItems.reduce(
        (acc, item) => {
          acc[item.ean] = bestStore
          return acc
        },
        {} as Record<string, string>,
      )

      return {
        ...state,
        items: availableItems,
        orphanedItems: orphanedItems,
        bestStores,
        totalByStore,
      }
    }

    case "UPDATE_QUANTITY": {
      if (action.payload.quantity <= 0) {
        return cartReducer(state, { type: "REMOVE_ITEM", payload: action.payload.ean })
      }

      const newItems = state.items.map((item) =>
        item.ean === action.payload.ean ? { ...item, quantity: action.payload.quantity } : item,
      )

      const newOrphanedItems = state.orphanedItems.map((item) =>
        item.ean === action.payload.ean ? { ...item, quantity: action.payload.quantity } : item,
      )

      const { bestStore, totalByStore, availableItems, orphanedItems } = findBestStoreForItems([
        ...newItems,
        ...newOrphanedItems,
      ])

      const bestStores = availableItems.reduce(
        (acc, item) => {
          acc[item.ean] = bestStore
          return acc
        },
        {} as Record<string, string>,
      )

      return {
        ...state,
        items: availableItems,
        orphanedItems: orphanedItems,
        bestStores,
        totalByStore,
      }
    }
    case "CLEAR_CART": {
      return {
        ...state,
        items: [],
        orphanedItems: [],
        bestStores: {},
        totalByStore: {},
      }
    }
    case "SET_CART": {
      const { bestStore, totalByStore, availableItems, orphanedItems } = findBestStoreForItems(action.payload)

      const bestStores = availableItems.reduce(
        (acc, item) => {
          acc[item.ean] = bestStore
          return acc
        },
        {} as Record<string, string>,
      )

      return {
        ...state,
        items: availableItems,
        orphanedItems: orphanedItems,
        bestStores,
        totalByStore,
      }
    }
    case "SET_LOADING": {
      return {
        ...state,
        isLoading: action.payload,
      }
    }
    case "SET_SYNCING": {
      return {
        ...state,
        isSyncing: action.payload,
      }
    }
    default:
      return state
  }
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(cartReducer, {
    items: [],
    orphanedItems: [],
    bestStores: {},
    totalByStore: {},
    isLoading: true,
    isSyncing: false,
  })
  const { user } = useAuth()
  const { toast } = useToast()

  // Load cart from Supabase when user logs in
  useEffect(() => {
    async function loadCart() {
      if (!user) {
        dispatch({ type: "SET_CART", payload: [] })
        dispatch({ type: "SET_LOADING", payload: false })
        return
      }

      dispatch({ type: "SET_LOADING", payload: true })

      try {
        const { data, error } = await supabase
          .from("cart_items")
          .select("*")
          .eq("user_id", user.id)
          .order("created_at", { ascending: true })

        if (error) throw error

        const cartItems: CartItem[] = (data || []).map((item) => ({
          ...(item.product_data as Product),
          quantity: item.quantity,
          storeOptions: item.product_data.storeOptions || [item.product_data],
        }))

        dispatch({ type: "SET_CART", payload: cartItems })
      } catch (error) {
        console.error("Error loading cart:", error)
        toast({
          title: "Error",
          description: "Could not load your shopping cart. Please try again later.",
          variant: "destructive",
        })
      } finally {
        dispatch({ type: "SET_LOADING", payload: false })
      }
    }

    loadCart()
  }, [user, toast])

  // Save cart to Supabase when it changes
  useEffect(() => {
    // Skip saving if cart is still loading or user is not logged in
    if (state.isLoading || !user) return

    const allItems = [...state.items, ...state.orphanedItems]
    if (allItems.length === 0) return

    const saveCart = async () => {
      dispatch({ type: "SET_SYNCING", payload: true })

      try {
        // First, delete all existing cart items for this user
        await supabase.from("cart_items").delete().eq("user_id", user.id)

        // Then insert all current cart items
        if (allItems.length > 0) {
          const { error } = await supabase.from("cart_items").insert(
            allItems.map((item) => ({
              user_id: user.id,
              product_ean: item.ean,
              quantity: item.quantity,
              product_data: {
                ...item,
                quantity: undefined, // Remove quantity from product_data to avoid duplication
              },
            })),
          )

          if (error) throw error
        }
      } catch (error) {
        console.error("Error saving cart:", error)
        toast({
          title: "Error",
          description: "Could not save your shopping cart. Please try again later.",
          variant: "destructive",
        })
      } finally {
        dispatch({ type: "SET_SYNCING", payload: false })
      }
    }

    // Debounce the save operation to avoid too many database calls
    const timeoutId = setTimeout(saveCart, 1000)
    return () => clearTimeout(timeoutId)
  }, [state.items, state.orphanedItems, user, toast, state.isLoading])

  const addItem = (product: Product) => {
    dispatch({ type: "ADD_ITEM", payload: product })
  }

  const removeItem = (ean: string) => {
    dispatch({ type: "REMOVE_ITEM", payload: ean })
  }

  const updateQuantity = (ean: string, quantity: number) => {
    dispatch({ type: "UPDATE_QUANTITY", payload: { ean, quantity } })
  }

  const clearCart = async () => {
    dispatch({ type: "CLEAR_CART" })

    // If user is logged in, also clear cart in database
    if (user) {
      try {
        const { error } = await supabase.from("cart_items").delete().eq("user_id", user.id)
        if (error) throw error
      } catch (error) {
        console.error("Error clearing cart in database:", error)
        toast({
          title: "Error",
          description: "Could not clear your shopping cart in the database. Please try again later.",
          variant: "destructive",
        })
      }
    }
  }

  return (
    <CartContext.Provider
      value={{
        ...state,
        addItem,
        removeItem,
        updateQuantity,
        clearCart,
      }}
    >
      {children}
    </CartContext.Provider>
  )
}

