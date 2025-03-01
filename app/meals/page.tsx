import Header from "@/components/header"
import MealList from "@/components/meal-list"

export default function MealsPage() {
  return (
    <main className="min-h-screen flex flex-col">
      <Header />
      <div className="flex-1 container mx-auto p-4">
        <MealList />
      </div>
    </main>
  )
}

