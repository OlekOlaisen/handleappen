"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import Image from "next/image"
import { ArrowLeft, Minus, Plus, Trash2, ShoppingCart } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useMeal } from "@/hooks/use-meal"
import { useCart } from "@/hooks/use-cart"
import { formatPrice } from "@/lib/utils"
import { ScrollArea } from "@/components/ui/scroll-area"
import Header from "@/components/header"

export default function MealDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { meals, removeProductFromMeal, updateProductQuantity } = useMeal()
  const { addItem } = useCart()
  const [meal, setMeal] = useState<ReturnType<typeof useMeal>["meals"][0] | null>(null)

  const mealId = typeof params.id === "string" ? params.id : Array.isArray(params.id) ? params.id[0] : null

  useEffect(() => {
    if (mealId) {
      const foundMeal = meals.find((m) => m.id === mealId)
      if (foundMeal) {
        setMeal(foundMeal)
      } else {
        // Meal not found, redirect to meals page
        router.push("/meals")
      }
    }
  }, [mealId, meals, router])

  if (!meal) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <div className="flex-1 p-4 flex items-center justify-center">
          <p>Laster måltid...</p>
        </div>
      </div>
    )
  }

  // Calculate total price for the meal
  const totalPrice = meal.items.reduce((sum, item) => {
    // Find the cheapest store option for this product
    const cheapestPrice = item.product.storeOptions
      ? Math.min(...item.product.storeOptions.map((opt) => opt.current_price))
      : item.product.current_price
    return sum + cheapestPrice * item.quantity
  }, 0)

  const handleAddAllToCart = () => {
    meal.items.forEach((item) => {
      addItem({
        ...item.product,
        storeOptions: item.product.storeOptions || [item.product],
      })
    })
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <div className="flex-1 container mx-auto p-4 pb-20 md:pb-4">
        <div className="mb-4 flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={() => router.push("/meals")}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-2xl font-bold">{meal.name}</h1>
        </div>

        <div className="grid gap-6 md:grid-cols-[1fr_300px]">
          {/* Meal Summary - Shown at top on mobile */}

          {/* Product List */}
          <div className="space-y-4">
            <h2 className="text-lg font-medium">Produkter i måltid</h2>
            {meal.items.length === 0 ? (
              <div className="border rounded-lg p-6 text-center">
                <p className="text-muted-foreground">Ingen produkter i dette måltid ennå.</p>
                <Button className="mt-4" onClick={() => router.push("/")}>
                  Søk etter produkter
                </Button>
              </div>
            ) : (
              <ScrollArea>
                <div className="space-y-4 pb-4">
                  {meal.items.map((item) => {
                    // Find the cheapest store option for this product
                    const storeOptions = item.product.storeOptions || [item.product]
                    const cheapestOption = storeOptions.reduce(
                      (cheapest, option) => (option.current_price < cheapest.current_price ? option : cheapest),
                      storeOptions[0],
                    )
                    const subtotal = cheapestOption.current_price * item.quantity

                    return (
                      <div key={item.product.ean} className="flex gap-4 border rounded-lg p-3">
                        <div className="relative h-16 w-16 overflow-hidden rounded-md border bg-white shrink-0">
                          {item.product.image ? (
                            <Image
                              src={item.product.image || "/placeholder.svg"}
                              alt={item.product.name}
                              fill
                              className="object-contain p-1"
                            />
                          ) : (
                            <div className="flex h-full items-center justify-center bg-secondary">
                              <span className="text-xs text-muted-foreground">Intet bilde</span>
                            </div>
                          )}
                        </div>
                        <div className="flex flex-1 flex-col">
                          <div className="flex justify-between">
                            <div className="space-y-1">
                              <h4 className="font-medium leading-none">{item.product.name}</h4>
                              <div className="text-sm text-muted-foreground">
                                <span>{formatPrice(cheapestOption.current_price)} kr</span>
                                {item.quantity > 1 && (
                                  <span className="ml-1">(Totalt: {formatPrice(subtotal)} kr)</span>
                                )}
                              </div>
                            </div>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => removeProductFromMeal(meal.id, item.product.ean)}
                            >
                              <Trash2 className="h-4 w-4" />
                              <span className="sr-only">Fjern fra måltid</span>
                            </Button>
                          </div>
                          <div className="flex items-center gap-2 mt-2">
                            <Button
                              variant="outline"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => updateProductQuantity(meal.id, item.product.ean, item.quantity - 1)}
                            >
                              <Minus className="h-4 w-4" />
                              <span className="sr-only">Reduser antall</span>
                            </Button>
                            <span className="w-8 text-center">{item.quantity}</span>
                            <Button
                              variant="outline"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => updateProductQuantity(meal.id, item.product.ean, item.quantity + 1)}
                            >
                              <Plus className="h-4 w-4" />
                              <span className="sr-only">Øk antall</span>
                            </Button>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </ScrollArea>
            )}
          </div>

          <div className="md:hidden space-y-4 mb-4">
            <div className="border rounded-lg p-4 space-y-4">
              <h2 className="text-lg font-medium">Måltidssammendrag</h2>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>Antall produkter:</span>
                  <span>{meal.items.reduce((sum, item) => sum + item.quantity, 0)}</span>
                </div>
                <div className="flex justify-between font-medium">
                  <span>Estimert totalpris:</span>
                  <span>{formatPrice(totalPrice)} kr</span>
                </div>
              </div>
              {meal.items.length > 0 && (
                <Button className="w-full" onClick={handleAddAllToCart}>
                  <ShoppingCart className="h-4 w-4 mr-2" />
                  Legg alle i handlekurv
                </Button>
              )}
            </div>
          </div>

          {/* Meal Summary - Hidden on mobile, shown on desktop */}
          <div className="hidden md:block space-y-4">
            <div className="border rounded-lg p-4 space-y-4">
              <h2 className="text-lg font-medium">Måltidssammendrag</h2>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>Antall produkter:</span>
                  <span>{meal.items.reduce((sum, item) => sum + item.quantity, 0)}</span>
                </div>
                <div className="flex justify-between font-medium">
                  <span>Estimert totalpris:</span>
                  <span>{formatPrice(totalPrice)} kr</span>
                </div>
              </div>
              {meal.items.length > 0 && (
                <Button className="w-full" onClick={handleAddAllToCart}>
                  <ShoppingCart className="h-4 w-4 mr-2" />
                  Legg alle i handlekurv
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

