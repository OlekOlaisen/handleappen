"use client"

import { Calendar } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { useMealWeekday } from "@/hooks/use-meal-weekday"
import type { WeekDay } from "@/types/meal-weekday"
import { useToast } from "@/components/ui/use-toast"

interface AddToMealWeekdayDialogProps {
  mealId: string
  mealName: string
}

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

export function AddToMealWeekdayDialog({ mealId, mealName }: AddToMealWeekdayDialogProps) {
  const { weekdays, addMealToDay } = useMealWeekday()
  const { toast } = useToast()

  const handleAddToDay = async (weekday: WeekDay) => {
    try {
      await addMealToDay(weekday, mealId)
      toast({
        title: "Lagt til i ukesmeny",
        description: `${mealName} er lagt til på ${WEEKDAY_NAMES[weekday].toLowerCase()}`,
      })
      // Close dialog by clicking the closest dialog element
      const dialog = document.querySelector("[role=dialog]")
      if (dialog instanceof HTMLElement) {
        const closeButton = dialog.querySelector("button[aria-label=Close]") as HTMLButtonElement
        closeButton?.click()
      }
    } catch (error) {
      toast({
        title: "Noe gikk galt",
        description: "Kunne ikke legge til måltid i ukesmenyen",
        variant: "destructive",
      })
    }
  }

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" className="w-full" onClick={(e) => e.stopPropagation()}>
          <Calendar className="h-4 w-4 mr-2" />
          Legg til i ukesmeny
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Legg til i ukesmeny</DialogTitle>
        </DialogHeader>
        <div className="grid gap-1.5 py-2">
          {WEEKDAYS.map((weekday) => {
            const dayMealIds = weekdays[weekday]

            return (
              <Button
                key={weekday}
                variant="outline"
                className="justify-start h-auto py-2"
                onClick={() => handleAddToDay(weekday)}
              >
                <div className="flex flex-col items-center ">
                  <span className="font-medium">{WEEKDAY_NAMES[weekday]}</span>
                  <span className="text-xs text-muted-foreground">
                    {dayMealIds.length}{" "}
                    {dayMealIds.length === 1 ? "måltid" : "måltider"} planlagt
                  </span>
                </div>
              </Button>
            );
          })}
        </div>
      </DialogContent>
    </Dialog>
  )
}

