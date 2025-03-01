import type { NextRequest } from "next/server"
import manifest from "../manifest"

export async function GET(request: NextRequest) {
  return new Response(JSON.stringify(manifest()), {
    headers: {
      "Content-Type": "application/manifest+json",
    },
  })
}

