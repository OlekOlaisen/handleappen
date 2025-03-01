import { type NextRequest, NextResponse } from "next/server"

const API_KEY = "wSojXXTplbTeHEedBXqWBerv6O28SqzyKoKKIBWN"
const BASE_URL = "https://kassal.app/api/v1"

export async function GET(request: NextRequest, { params }: { params: { ean: string } }) {
  const { ean } = params

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

    // Filter for products with matching EAN and valid prices
    const storeOptions = (data.data || []).filter(
      (product: any) => product.ean === ean && product.current_price && product.current_price > 0,
    )

    return NextResponse.json({ data: storeOptions })
  } catch (error) {
    console.error("Error fetching store options:", error)
    return NextResponse.json({ error: "Failed to fetch store options" }, { status: 500 })
  }
}

