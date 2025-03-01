"use client"
import { useState, useCallback } from "react"
import { ShoppingCart, Linkedin } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import CartContents from "@/components/cart-contents"
import { Badge } from "@/components/ui/badge"
import { useCart } from "@/hooks/use-cart"
import Link from "next/link"
import { useRouter, useSearchParams, usePathname } from "next/navigation"
import { debounce, cn } from "@/lib/utils"
import { BottomNav } from "@/components/bottom-nav"
import { UtensilsCrossed, Calendar } from "lucide-react"
import { SearchBar } from "@/components/search-bar"
import { AuthButtons } from "@/components/auth-buttons"

export default function Header() {
  const { items, orphanedItems } = useCart()
  const router = useRouter()
  const searchParams = useSearchParams()
  const pathname = usePathname()
  const [searchTerm, setSearchTerm] = useState(searchParams.get("q") || "")
  const itemCount = [...items, ...orphanedItems].reduce((total, item) => total + item.quantity, 0)

  const handleSearch = useCallback(
    (term: string) => {
      if (pathname !== "/") {
        router.push(`/?q=${encodeURIComponent(term)}`)
      } else {
        router.push(`?q=${encodeURIComponent(term)}`)
      }
    },
    [router, pathname],
  )

  // Debounce the search function to avoid too many navigation updates
  const debouncedSearch = useCallback(debounce(handleSearch, 300), [handleSearch])

  return (
    <>
      <header className="sticky top-0 z-10 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-14 items-center gap-4">
          <div className="flex flex-col mr-4">
            <Link href="/" className="font-bold text-xl text-primary whitespace-nowrap">
              Handleappen
            </Link>
            
          </div>
          <div className="hidden md:block flex-1">
            <SearchBar />
          </div>
          <nav className="hidden items-center gap-2 md:flex">
            <Link href="/week-planner">
              <Button
                variant="ghost"
                size="sm"
                className={cn("gap-1", pathname === "/week-planner" && "text-[#e4335a] [&_svg]:text-[#e4335a]")}
              >
                <Calendar className="h-4 w-4" />
                Ukemeny
              </Button>
            </Link>
            <Link href="/meals">
              <Button
                variant="ghost"
                size="sm"
                className={cn("gap-1", pathname === "/meals" && "text-[#e4335a] [&_svg]:text-[#e4335a]")}
              >
                <UtensilsCrossed className="h-4 w-4" />
                Måltider
              </Button>
            </Link>
          </nav>
          <div className="flex items-center gap-2 ml-auto">
            <AuthButtons />

            <Sheet>
              <SheetTrigger asChild>
                <Button variant="outline" size="icon" className="relative">
                  <ShoppingCart className="h-5 w-5" />
                  {itemCount > 0 && (
                    <Badge className="absolute -top-2 -right-2 h-5 w-5 flex items-center justify-center p-0 animate-in zoom-in bg-[#e4335a] text-white">
                      {itemCount}
                    </Badge>
                  )}
                  <span className="sr-only">Åpne handlekurv</span>
                </Button>
              </SheetTrigger>
              <SheetContent className="sm:max-w-md transition-transform duration-300">
                <SheetHeader>
                  <SheetTitle>Handlekurv</SheetTitle>
                  <SheetDescription>Dine valgte produkter</SheetDescription>
                </SheetHeader>
                <CartContents />
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </header>
      <div className="md:hidden border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container py-2">
          <SearchBar />
        </div>
      </div>
      <BottomNav />
      {/* Add padding to main content to account for bottom nav on mobile */}
      <style jsx global>{`
        @media (max-width: 767px) {
          main {
            padding-bottom: 4rem !important;
          }
        }
      `}</style>
    </>
  )
}

