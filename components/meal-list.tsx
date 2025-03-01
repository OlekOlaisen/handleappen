"use client"

import { useState } from "react"
import { Edit2, Trash2, ChevronRight, UtensilsCrossed } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useMeal } from "@/hooks/use-meal"
import { Input } from "@/components/ui/input"
import { formatPrice } from "@/lib/utils"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { ScrollArea } from "@/components/ui/scroll-area"
import MealDialog from "@/components/meal-dialog"
import Link from "next/link"
import { AddToMealWeekdayDialog } from "@/components/add-to-meal-weekday-dialog"

export default function MealList() {
  const { meals, deleteMeal, renameMeal } = useMeal()
  const [editingMealId, setEditingMealId] = useState<string | null>(null)
  const [editingMealName, setEditingMealName] = useState("")
  const [mealToDelete, setMealToDelete] = useState<string | null>(null)

  const handleStartEditing = (id: string, currentName: string) => {
    setEditingMealId(id)
    setEditingMealName(currentName)
  }

  const handleSaveEdit = () => {
    if (editingMealId && editingMealName.trim()) {
      renameMeal(editingMealId, editingMealName.trim())
      setEditingMealId(null)
    }
  }

  const handleCancelEdit = () => {
    setEditingMealId(null)
  }

  const handleDeleteMeal = () => {
    if (mealToDelete) {
      deleteMeal(mealToDelete)
      setMealToDelete(null)
    }
  }

  // Calculate total price for each meal
  const mealsWithTotals = meals.map((meal) => {
    const total = meal.items.reduce((sum, item) => {
      // Find the cheapest store option for this product
      const cheapestPrice = item.product.storeOptions
        ? Math.min(...item.product.storeOptions.map((opt) => opt.current_price))
        : item.product.current_price
      return sum + cheapestPrice * item.quantity
    }, 0)

    return {
      ...meal,
      total,
      itemCount: meal.items.reduce((sum, item) => sum + item.quantity, 0),
    }
  })

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Dine måltider</h2>
        <MealDialog />
      </div>

      {mealsWithTotals.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="pt-6 text-center">
            <UtensilsCrossed className="mx-auto h-12 w-12 text-muted-foreground opacity-50" />
            <p className="mt-2 text-sm text-muted-foreground">
              Du har ingen måltider ennå. Opprett et måltid for å komme i gang.
            </p>
            <div className="mt-4">
              <MealDialog />
            </div>
          </CardContent>
        </Card>
      ) : (
        <ScrollArea className="h-[calc(100vh-12rem)]">
          <div className="grid gap-4 pb-4">
            {mealsWithTotals.map((meal) => (
              <Card key={meal.id} className="overflow-hidden">
                <CardHeader className="pb-3">
                  {editingMealId === meal.id ? (
                    <div className="flex gap-2">
                      <Input
                        value={editingMealName}
                        onChange={(e) => setEditingMealName(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") handleSaveEdit()
                          if (e.key === "Escape") handleCancelEdit()
                        }}
                        autoFocus
                      />
                      <Button size="sm" onClick={handleSaveEdit}>
                        Lagre
                      </Button>
                      <Button size="sm" variant="ghost" onClick={handleCancelEdit}>
                        Avbryt
                      </Button>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between">
                      <CardTitle>{meal.name}</CardTitle>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => handleStartEditing(meal.id, meal.name)}
                        >
                          <Edit2 className="h-4 w-4" />
                          <span className="sr-only">Rediger måltid</span>
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive"
                          onClick={() => setMealToDelete(meal.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                          <span className="sr-only">Slett måltid</span>
                        </Button>
                      </div>
                    </div>
                  )}
                  <CardDescription>
                    {meal.itemCount} {meal.itemCount === 1 ? "produkt" : "produkter"} · Estimert pris:{" "}
                    {formatPrice(meal.total)} kr
                  </CardDescription>
                </CardHeader>
                <CardContent className="pb-3">
                  <div className="flex gap-2">
                    <Link href={`/meals/${meal.id}`} className="flex-1">
                      <Button variant="outline" className="w-full justify-between">
                        Se detaljer
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </Link>
                    <div className="flex-1">
                      <AddToMealWeekdayDialog mealId={meal.id} mealName={meal.name} />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </ScrollArea>
      )}

      <AlertDialog open={mealToDelete !== null} onOpenChange={(open) => !open && setMealToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Er du sikker?</AlertDialogTitle>
            <AlertDialogDescription>
              Dette vil slette måltiden og alle produktene i den. Denne handlingen kan ikke angres.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Avbryt</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteMeal} className="bg-destructive text-destructive-foreground">
              Slett
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

