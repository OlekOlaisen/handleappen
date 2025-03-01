export interface Product {
  id: number
  name: string
  brand: string | null
  vendor: string | null
  ean: string
  url: string
  image: string | null
  description: string | null
  ingredients: string | null
  current_price: number
  current_unit_price: number | null
  weight: number | null
  weight_unit: string | null
  store: {
    name: string
    code: string
    url: string
    logo: string
  }
  price_history: Array<{
    price: number
    date: string
  }>
  storeOptions?: Product[]
  allergens?: Array<{
    code: string
    display_name: string
    contains: "YES" | "NO" | "CAN_CONTAIN_TRACES"
  }>
  nutrition?: Array<{
    code: string
    display_name: string
    amount: number
    unit: string
  }>
}

