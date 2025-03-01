import type { Product } from "./product"

export interface MealItem {
  product: Product
  quantity: number
}

export interface Meal {
  id: string
  name: string
  items: MealItem[]
}

