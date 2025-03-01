import { put } from "@vercel/blob"
import { NextResponse } from "next/server"

async function uploadLogo(svg: string, size: number) {
  // Convert SVG string to Blob
  const svgBlob = new Blob([svg], { type: "image/svg+xml" })

  // Upload to Vercel Blob
  const blob = await put(`logo-${size}x${size}.svg`, svgBlob, {
    access: "public",
  })

  return blob
}

export async function GET() {
  try {
    // Your existing SVG logo code with the pink color
    const svg192 = `<svg width="192" height="192" viewBox="0 0 192 192" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="192" height="192" rx="96" fill="#e4335a"/>
      <path d="M48 48C45.7909 48 44 49.7909 44 52C44 54.2091 45.7909 56 48 56H56.832L71.2 123.2C71.8 126.4 74.4 128 77.6 128H140.8C144 128 146.4 126.4 147.2 123.2L160 72H68L71.2 84H147.2L136.8 116H81.6L67.2 48.8C66.4 45.6 64 44 60.8 44H48Z" fill="white"/>
      <circle cx="84" cy="144" r="8" fill="white"/>
      <circle cx="132" cy="144" r="8" fill="white"/>
    </svg>`

    const svg512 = `<svg width="512" height="512" viewBox="0 0 512 512" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="512" height="512" rx="256" fill="#e4335a"/>
      <path d="M128 128C123.582 128 120 131.582 120 136C120 140.418 123.582 144 128 144H151.552L190.4 328.8C192 336.8 198.4 342.4 206.4 342.4H374.4C382.4 342.4 388.8 336.8 390.4 328.8L424 192H180L188.8 224H390.4L363.2 310.4H217.6L178.4 129.6C176.8 121.6 170.4 116 162.4 116H128Z" fill="white"/>
      <circle cx="224" cy="384" r="24" fill="white"/>
      <circle cx="352" cy="384" r="24" fill="white"/>
    </svg>`

    // Upload both logos
    const [blob192, blob512] = await Promise.all([uploadLogo(svg192, 192), uploadLogo(svg512, 512)])

    return NextResponse.json({
      logo192: blob192.url,
      logo512: blob512.url,
    })
  } catch (error) {
    console.error("Error uploading logos:", error)
    return NextResponse.json({ error: "Failed to upload logos" }, { status: 500 })
  }
}

