"use client"

import { useState } from "react"
import { Plus } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useMeal } from "@/hooks/use-meal"
import type { Product } from "@/types/product"

interface MealDialogProps {
  product?: Product
  onMealCreated?: (mealId: string) => void
}

export default function MealDialog({ product, onMealCreated }: MealDialogProps) {
  const [open, setOpen] = useState(false)
  const [mealName, setMealName] = useState("")
  const { createMeal } = useMeal()

  const handleCreateMeal = async () => {
    if (mealName.trim()) {
      const mealId = await createMeal(mealName.trim())
      setMealName("")
      setOpen(false)
      if (onMealCreated) {
        onMealCreated(mealId)
      }
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-1" onClick={(e) => e.stopPropagation()}>
          <Plus className="h-4 w-4" />
          Nytt måltid
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md" onClick={(e) => e.stopPropagation()}>
        <DialogHeader>
          <DialogTitle>Opprett nytt måltid</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="meal-name">Måltidsnavn</Label>
            <Input
              id="meal-name"
              placeholder="F.eks. Kjøttdeig og spaghetti"
              value={mealName}
              onChange={(e) => setMealName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  handleCreateMeal()
                }
              }}
            />
          </div>
          <Button onClick={handleCreateMeal} disabled={!mealName.trim()}>
            Opprett måltid
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

