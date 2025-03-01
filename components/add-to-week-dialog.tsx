"use client"

import { DialogDescription } from "@/components/ui/dialog"
import { Calendar } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { useWeekPlanner } from "@/hooks/use-week-planner"
import type { WeekDay } from "@/types/week-plan"
import { useToast } from "@/components/ui/use-toast"

interface AddToWeekDialogProps {
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

export function AddToWeekDialog({ mealId, mealName }: AddToWeekDialogProps) {
  const { currentPlan, addMealToDay } = useWeekPlanner()
  const { toast } = useToast()

  if (!currentPlan) return null

  const handleAddToDay = async (day: WeekDay) => {
    try {
      await addMealToDay(day, mealId)
      toast({
        title: "Lagt til i ukesmeny",
        description: `${mealName} er lagt til på ${WEEKDAY_NAMES[day].toLowerCase()}`,
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
          <DialogDescription>Velg en dag å legge til {mealName}</DialogDescription>
        </DialogHeader>
        <div className="grid gap-1.5 py-2">
          {WEEKDAYS.map((day) => {
            const dayMealIds = currentPlan.days[day].meal_ids

            return (
              <Button
                key={day}
                variant="outline"
                className="justify-start h-auto py-2"
                onClick={() => handleAddToDay(day)}
              >
                <div className="flex flex-col items-start">
                  <span className="font-medium">{WEEKDAY_NAMES[day]}</span>
                  <span className="text-xs text-muted-foreground">
                    {dayMealIds.length} {dayMealIds.length === 1 ? "måltid" : "måltider"} planlagt
                  </span>
                </div>
              </Button>
            )
          })}
        </div>
      </DialogContent>
    </Dialog>
  )
}

