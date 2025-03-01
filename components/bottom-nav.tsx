"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { UtensilsCrossed, Calendar } from "lucide-react"
import { cn } from "@/lib/utils"

export function BottomNav() {
  const pathname = usePathname()

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 pb-[env(safe-area-inset-bottom)] md:hidden">
      <nav className="grid grid-cols-2">
        <Link
          href="/week-planner"
          className={cn(
            "flex flex-col items-center justify-center py-3 text-sm",
            pathname === "/week-planner"
              ? "text-[#e4335a] [&_svg]:text-[#e4335a]"
              : "text-muted-foreground [&_svg]:text-muted-foreground",
          )}
        >
          <Calendar className="h-5 w-5" />
          <span className="mt-1">Ukemeny</span>
        </Link>
        <Link
          href="/meals"
          className={cn(
            "flex flex-col items-center justify-center py-3 text-sm",
            pathname === "/meals"
              ? "text-[#e4335a] [&_svg]:text-[#e4335a]"
              : "text-muted-foreground [&_svg]:text-muted-foreground",
          )}
        >
          <UtensilsCrossed className="h-5 w-5" />
          <span className="mt-1">Måltider</span>
        </Link>
      </nav>
    </div>
  )
}

