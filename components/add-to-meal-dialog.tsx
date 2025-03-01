"use client"

import { useState } from "react"
import { UtensilsCrossed } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { useMeal } from "@/hooks/use-meal"
import type { Product } from "@/types/product"
import MealDialog from "@/components/meal-dialog"

interface AddToMealDialogProps {
  product: Product
  onAddToMeal?: () => void
}

export default function AddToMealDialog({ product, onAddToMeal }: AddToMealDialogProps) {
  const [open, setOpen] = useState(false)
  const { meals, addProductToMeal } = useMeal()

  const handleAddToMeal = (mealId: string) => {
    addProductToMeal(mealId, product)
    setOpen(false)
    if (onAddToMeal) onAddToMeal()
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="w-full" onClick={(e) => e.stopPropagation()}>
          <UtensilsCrossed className="h-4 w-4 mr-2" />
          Legg i måltid
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md" onClick={(e) => e.stopPropagation()}>
        <DialogHeader>
          <DialogTitle>Legg til måltid</DialogTitle>
          <DialogDescription>Velg et måltid å legge produktet til i</DialogDescription>
        </DialogHeader>
        {meals.length === 0 ? (
          <div className="py-6 text-center">
            <UtensilsCrossed className="mx-auto h-12 w-12 text-muted-foreground opacity-50" />
            <p className="mt-2 text-sm text-muted-foreground">Du har ingen måltider ennå.</p>
            <div className="mt-4">
              <MealDialog product={product} onMealCreated={handleAddToMeal} />
            </div>
          </div>
        ) : (
          <ScrollArea className="max-h-[60vh]">
            <div className="grid gap-2 py-4">
              {meals.map((meal) => (
                <Button
                  key={meal.id}
                  variant="outline"
                  className="justify-start h-auto py-3"
                  onClick={() => handleAddToMeal(meal.id)}
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
        )}
        <div className="flex justify-between items-center pt-2 border-t">
          <span className="text-sm text-muted-foreground">Eller opprett et nytt måltid</span>
          <MealDialog product={product} onMealCreated={handleAddToMeal} />
        </div>
      </DialogContent>
    </Dialog>
  )
}

