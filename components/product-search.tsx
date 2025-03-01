"use client"

import { useEffect, useState } from "react"
import { useSearchParams } from "next/navigation"
import ProductCard from "@/components/product-card"
import ProductCardSkeleton from "@/components/product-card-skeleton"
import type { Product } from "@/types/product"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

export default function ProductSearch() {
  const searchParams = useSearchParams()
  const searchTerm = searchParams.get("q") || ""
  const sortParam = searchParams.get("sort") || "relevance" // Default to relevance
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [hasSearched, setHasSearched] = useState(false)
  const [sortBy, setSortBy] = useState(sortParam)

  useEffect(() => {
    async function searchProducts() {
      if (!searchTerm.trim()) {
        setProducts([])
        setHasSearched(false)
        return
      }

      setLoading(true)
      setError(null)
      setHasSearched(true)

      try {
        const params = new URLSearchParams({
          search: searchTerm,
          size: "100",
        })

        if (sortBy && sortBy !== "relevance") {
          params.append("sort", sortBy)
        }

        const response = await fetch(`/api/products?${params.toString()}`)
        const data = await response.json()

        if (!response.ok) {
          throw new Error(data.details || `Error: ${response.status}`)
        }

        const filteredProducts = (data.data || []).filter(
          (product) => product.current_price && product.current_price > 0,
        )
        setProducts(filteredProducts)
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "Kunne ikke hente produkter. Vennligst prøv igjen."
        setError(errorMessage)
        console.error("Search error:", err)
      } finally {
        setLoading(false)
      }
    }

    searchProducts()
  }, [searchTerm, sortBy])

  // Update URL when sort changes
  const handleSortChange = (value: string) => {
    setSortBy(value)
    const url = new URL(window.location.href)
    if (value) {
      url.searchParams.set("sort", value)
    } else {
      url.searchParams.delete("sort")
    }
    window.history.pushState({}, "", url)
  }

  return (
    <div className="container mx-auto">
      {error && <div className="bg-destructive/15 text-destructive p-4 rounded-md mb-6">{error}</div>}

      <div className="mb-6 flex justify-end">
        <Select value={sortBy} onValueChange={handleSortChange}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Sorter etter" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="relevance">Relevans</SelectItem>
            <SelectItem value="price_asc">Pris: Lav til høy</SelectItem>
            <SelectItem value="price_desc">Pris: Høy til lav</SelectItem>
            <SelectItem value="name_asc">Navn: A til Å</SelectItem>
            <SelectItem value="name_desc">Navn: Å til A</SelectItem>
            <SelectItem value="date_desc">Nyeste først</SelectItem>
            <SelectItem value="date_asc">Eldste først</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <ProductCardSkeleton key={i} />
          ))}
        </div>
      ) : hasSearched ? (
        products.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-muted-foreground">Ingen produkter funnet for "{searchTerm}"</p>
          </div>
        )
      ) : (
        <div className="text-center py-12">
          <p className="text-muted-foreground">Skriv inn søkeord for å finne produkter</p>
        </div>
      )}
    </div>
  )
}

