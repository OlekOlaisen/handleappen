"use client"

import { Plus, Trash2, ShoppingCart } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { useMealWeekday } from "@/hooks/use-meal-weekday"
import { useMeal } from "@/hooks/use-meal"
import { useCart } from "@/hooks/use-cart"
import { useToast } from "@/components/ui/use-toast"
import type { WeekDay } from "@/types/meal-weekday"
import { formatPrice } from "@/lib/utils"
import { Skeleton } from "@/components/ui/skeleton"
import { useState } from "react"

const WEEKDAYS: WeekDay[] = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"]
const WEEKDAY_NAMES: Record<WeekDay, string> = {
  monday: "Mandag",
  tuesday: "Tirsdag",
  wednesday: "Onsdag",
  thursday: "Torsdag",
  friday: "Fredag",
  saturday: "Lørdag",
  sunday: "Søndag",
}

export default function MealWeekdayPlanner() {
  const { weekdays, isLoading, removeMealFromDay, addMealToDay, clearWeek } = useMealWeekday()
  const { meals } = useMeal()
  const { addItem } = useCart()
  const { toast } = useToast()
  const [isAddingToCart, setIsAddingToCart] = useState(false)

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1">
            <Skeleton className="h-8 w-32" />
            <Skeleton className="h-4 w-48" />
          </div>
          <Skeleton className="h-10 w-48" />
        </div>
        <div className="grid gap-4 md:grid-cols-7">
          {WEEKDAYS.map((_, index) => (
            <Card key={index} className="relative">
              <CardHeader className="pb-3">
                <Skeleton className="h-5 w-24" />
              </CardHeader>
              <CardContent className="p-0">
                <div className="px-3 pb-3">
                  <div className="flex h-[180px] items-center justify-center">
                    <Skeleton className="h-full w-full" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  // Get all meals for the week
  const weekMeals = WEEKDAYS.flatMap((weekday) =>
    weekdays[weekday]
      .map((mealId) => meals.find((m) => m.id === mealId))
      .filter((meal): meal is NonNullable<typeof meal> => meal != null),
  )

  // Calculate total price for the week
  const weekTotal = weekMeals.reduce((total, meal) => {
    return (
      total +
      meal.items.reduce((mealTotal, item) => {
        const cheapestPrice = item.product.storeOptions
          ? Math.min(...item.product.storeOptions.map((opt) => opt.current_price))
          : item.product.current_price
        return mealTotal + cheapestPrice * item.quantity
      }, 0)
    )
  }, 0)

  // Get all unique products and their quantities
  const getAllProducts = () => {
    const productMap = new Map<string, { product: any; quantity: number }>()

    weekMeals.forEach((meal) => {
      meal.items.forEach((item) => {
        const existing = productMap.get(item.product.ean)
        if (existing) {
          existing.quantity += item.quantity
        } else {
          productMap.set(item.product.ean, {
            product: item.product,
            quantity: item.quantity,
          })
        }
      })
    })

    return Array.from(productMap.values())
  }

  const handleAddAllToCart = async () => {
    setIsAddingToCart(true)
    try {
      const products = getAllProducts()

      // Add each product to cart with its accumulated quantity
      products.forEach(({ product, quantity }) => {
        for (let i = 0; i < quantity; i++) {
          addItem({
            ...product,
            storeOptions: product.storeOptions || [product],
          })
        }
      })

      toast({
        title: "Lagt til i handlekurv",
        description: `${products.length} produkter fra ukemenyen er lagt til i handlekurven`,
      })
    } catch (error) {
      toast({
        title: "Noe gikk galt",
        description: "Kunne ikke legge til produktene i handlekurven",
        variant: "destructive",
      })
    } finally {
      setIsAddingToCart(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold">Ukemeny</h2>
          <Button
            variant="outline"
            className="text-destructive hover:bg-destructive/10"
            onClick={() => clearWeek()}
            disabled={Object.values(weekdays).every((meals) => meals.length === 0)}
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Tøm ukemeny
          </Button>
        </div>
        <div className="flex items-center gap-2 justify-end">
          <div className="text-sm text-muted-foreground">Total: {formatPrice(weekTotal)} kr</div>
          <Button onClick={handleAddAllToCart} disabled={isAddingToCart || weekTotal === 0} className="text-white">
            <ShoppingCart className="h-4 w-4 mr-2" />
            {isAddingToCart ? "Legger til..." : "Legg alt i handlekurv"}
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-7">
        {WEEKDAYS.map((weekday) => {
          const dayMealIds = weekdays[weekday]
          const dayMeals = dayMealIds
            .map((mealId) => meals.find((m) => m.id === mealId))
            .filter((meal): meal is NonNullable<typeof meal> => meal != null)

          // Calculate total price for the day
          const dayTotal = dayMeals.reduce((total, meal) => {
            return (
              total +
              meal.items.reduce((mealTotal, item) => {
                const cheapestPrice = item.product.storeOptions
                  ? Math.min(...item.product.storeOptions.map((opt) => opt.current_price))
                  : item.product.current_price
                return mealTotal + cheapestPrice * item.quantity
              }, 0)
            )
          }, 0)

          return (
            <Card key={weekday} className="relative">
              <CardHeader className="pb-3">
                <CardTitle className="flex justify-between items-baseline text-base">
                  <span>{WEEKDAY_NAMES[weekday]}</span>
                  {dayTotal > 0 && <span className="text-sm text-muted-foreground">{formatPrice(dayTotal)} kr</span>}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <ScrollArea className="h-full">
                  <div className="px-3 pb-3">
                    {dayMeals.length > 0 ? (
                      <div className="space-y-2">
                        {dayMeals.map((meal) => (
                          <div
                            key={meal.id}
                            className="group relative rounded-md border bg-card/50 p-3 pr-8 text-sm hover:bg-muted/50 transition-colors"
                          >
                            <div className="font-medium">{meal.name}</div>
                            <div className="space-y-1 mt-1">
                              <div className="text-xs text-muted-foreground">
                                {meal.items.length} {meal.items.length === 1 ? "produkt" : "produkter"}
                              </div>
                              <div className="text-xs text-[#BE185D]">
                                Estimert pris:{" "}
                                {formatPrice(
                                  meal.items.reduce((total, item) => {
                                    const cheapestPrice = item.product.storeOptions
                                      ? Math.min(...item.product.storeOptions.map((opt) => opt.current_price))
                                      : item.product.current_price
                                    return total + cheapestPrice * item.quantity
                                  }, 0),
                                )}{" "}
                                kr
                              </div>
                            </div>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="absolute right-1 top-1 h-6 w-6 md:opacity-0 transition-opacity group-hover:opacity-100"
                              onClick={() => removeMealFromDay(weekday, meal.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                              <span className="sr-only">Fjern måltid</span>
                            </Button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="flex h-full items-center justify-center">
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button variant="ghost" className="h-auto w-full py-8 hover:bg-muted">
                              <Plus className="h-8 w-8" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Legg til måltid</DialogTitle>
                            </DialogHeader>
                            <ScrollArea className="max-h-[60vh]">
                              <div className="grid gap-2 py-4">
                                {meals.map((meal) => (
                                  <Button
                                    key={meal.id}
                                    variant="outline"
                                    className="justify-start h-auto py-3"
                                    onClick={() => {
                                      addMealToDay(weekday, meal.id)
                                      // Close dialog by clicking the closest dialog element
                                      const dialog = document.querySelector("[role=dialog]")
                                      if (dialog instanceof HTMLElement) {
                                        const closeButton = dialog.querySelector(
                                          "button[aria-label=Close]",
                                        ) as HTMLButtonElement
                                        closeButton?.click()
                                      }
                                    }}
                                  >
                                    <div className="flex flex-col items-center">
                                      <span className="font-medium">{meal.name}</span>
                                      <span className="text-xs text-muted-foreground">
                                        {meal.items.length} {meal.items.length === 1 ? "produkt" : "produkter"}
                                      </span>
                                    </div>
                                  </Button>
                                ))}
                              </div>
                            </ScrollArea>
                          </DialogContent>
                        </Dialog>
                      </div>
                    )}
                  </div>
                </ScrollArea>
                {/* {dayMeals.length > 0 && (
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button variant="ghost" size="sm" className="w-full rounded-none border-t">
                        <Plus className="h-4 w-4 mr-2" />
                        Legg til måltid
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Legg til måltid</DialogTitle>
                      </DialogHeader>
                      <ScrollArea className="max-h-[60vh]">
                        <div className="grid gap-2 py-4">
                          {meals.map((meal) => (
                            <Button
                              key={meal.id}
                              variant="outline"
                              className="justify-start h-auto py-3"
                              onClick={() => {
                                addMealToDay(weekday, meal.id)
                                // Close dialog by clicking the closest dialog element
                                const dialog = document.querySelector("[role=dialog]")
                                if (dialog instanceof HTMLElement) {
                                  const closeButton = dialog.querySelector(
                                    "button[aria-label=Close]",
                                  ) as HTMLButtonElement
                                  closeButton?.click()
                                }
                              }}
                            >
                              <div className="flex flex-col items-start">
                                <span className="font-medium">{meal.name}</span>
                                <span className="text-xs text-muted-foreground">
                                  {meal.items.length} {meal.items.length === 1 ? "produkt" : "produkter"}
                                </span>
                              </div>
                            </Button>
                          ))}
                        </div>
                      </ScrollArea>
                    </DialogContent>
                  </Dialog>
                )} */}
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}

