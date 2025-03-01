import { type NextRequest, NextResponse } from "next/server"

const API_KEY = "wSojXXTplbTeHEedBXqWBerv6O28SqzyKoKKIBWN"
const BASE_URL = "https://kassal.app/api/v1"

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const search = searchParams.get("search")
  const sort = searchParams.get("sort")

  if (!search) {
    return NextResponse.json({ data: [] })
  }

  try {
    // Create a new URLSearchParams to build the API request
    const apiParams = new URLSearchParams()
    apiParams.set("search", search)
    apiParams.set("size", searchParams.get("size") || "20")

    // For price_asc, we'll sort locally. For other sorts, use API sorting
    if (sort && sort !== "relevance" && sort !== "price_asc") {
      apiParams.set("sort", sort)
    }

    const response = await fetch(`${BASE_URL}/products?${apiParams.toString()}`, {
      headers: {
        Authorization: `Bearer ${API_KEY}`,
        "Content-Type": "application/json",
      },
      next: { revalidate: 60 },
    })

    const data = await response.json()

    if (!response.ok) {
      throw new Error(data.message || `API error: ${response.status}`)
    }

    // Group products by EAN and keep all store options
    const productsMap: Record<string, any> = {}

    for (const product of data.data || []) {
      if (!product.ean || !product.current_price || product.current_price <= 0) {
        continue
      }

      if (!productsMap[product.ean]) {
        productsMap[product.ean] = {
          ...product,
          storeOptions: [product],
        }
      } else {
        productsMap[product.ean].storeOptions.push(product)

        // Update main product if this price is better
        if (product.current_price < productsMap[product.ean].current_price) {
          productsMap[product.ean] = {
            ...product,
            storeOptions: productsMap[product.ean].storeOptions,
          }
        }
      }
    }

    let groupedProducts = Object.values(productsMap)

    // If price_asc sort is requested, sort locally after grouping
    if (sort === "price_asc") {
      groupedProducts = groupedProducts
        .filter((product) => product.current_price && product.current_price > 0)
        .sort((a, b) => {
          // Find the lowest price among store options
          const aMinPrice = Math.min(...a.storeOptions.map((opt: any) => opt.current_price))
          const bMinPrice = Math.min(...b.storeOptions.map((opt: any) => opt.current_price))
          return aMinPrice - bMinPrice
        })
    }

    return NextResponse.json({ data: groupedProducts })
  } catch (error) {
    console.error("Error fetching products:", error)
    return NextResponse.json(
      {
        error: "Failed to fetch products",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}

