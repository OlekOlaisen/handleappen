import Header from "@/components/header"
import MealWeekdayPlanner from "@/components/meal-weekday-planner"

export default function WeekPlannerPage() {
  return (
    <main className="min-h-screen flex flex-col">
      <Header />
      <div className="flex-1 container mx-auto p-4">
        <MealWeekdayPlanner />
      </div>
    </main>
  )
}

