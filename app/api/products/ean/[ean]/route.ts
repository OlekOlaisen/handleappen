import { type NextRequest, NextResponse } from "next/server"

const API_KEY = "wSojXXTplbTeHEedBXqWBerv6O28SqzyKoKKIBWN"
const BASE_URL = "https://kassal.app/api/v1"

export async function GET(request: NextRequest, { params }: { params: { ean: string } }) {
  const { ean } = params

  if (!ean) {
    return NextResponse.json({ error: "EAN is required" }, { status: 400 })
  }

  try {
    const response = await fetch(`${BASE_URL}/products?search=${ean}`, {
      headers: {
        Authorization: `Bearer ${API_KEY}`,
        "Content-Type": "application/json",
      },
      next: { revalidate: 60 },
    })

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`)
    }

    const data = await response.json()

    // Filter products to only include those matching the exact EAN
    const matchingProducts = Array.isArray(data.data)
      ? data.data.filter((product: any) => product.ean === ean && product.current_price && product.current_price > 0)
      : []

    return NextResponse.json({ data: matchingProducts })
  } catch (error) {
    console.error("Error fetching product options:", error)
    return NextResponse.json(
      { error: "Failed to fetch product options", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 },
    )
  }
}

