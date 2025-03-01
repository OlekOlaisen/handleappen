import { NextResponse } from "next/server"
import puppeteer from "puppeteer"

export async function GET(request: Request) {
  try {
    const browser = await puppeteer.launch({ headless: "new" })
    const page = await browser.newPage()

    // Desktop Screenshot
    await page.setViewport({ width: 2048, height: 1152 })
    await page.goto("https://handleappen.vercel.app")
    await page.waitForTimeout(2000) // Wait for content to load
    const desktopScreenshot = await page.screenshot()
    await page.screenshot({ path: "public/screenshot-desktop.png" })

    // Mobile Screenshot
    await page.setViewport({ width: 1170, height: 2532 })
    await page.goto("https://handleappen.vercel.app")
    await page.waitForTimeout(2000) // Wait for content to load
    const mobileScreenshot = await page.screenshot()
    await page.screenshot({ path: "public/screenshot-mobile.png" })

    await browser.close()

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: "Failed to generate screenshots" }, { status: 500 })
  }
}

