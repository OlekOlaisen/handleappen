"use client"

import { useState, useCallback } from "react"
import { Search } from "lucide-react"
import { Input } from "@/components/ui/input"
import { useRouter, useSearchParams, usePathname } from "next/navigation"
import { debounce } from "@/lib/utils"

export function SearchBar() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const pathname = usePathname()
  const [searchTerm, setSearchTerm] = useState(searchParams.get("q") || "")

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

  const debouncedSearch = useCallback(debounce(handleSearch, 800), [])

  return (
    <div className="relative md:flex-1">
      <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
      <Input
        type="search"
        placeholder="Søk etter produkter..."
        className="pl-8 w-full"
        value={searchTerm}
        onChange={(e) => {
          setSearchTerm(e.target.value)
          debouncedSearch(e.target.value)
        }}
      />
    </div>
  )
}

