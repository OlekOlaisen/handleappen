"use client"

import { useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"

export default function AuthCallbackPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const supabase = createClientComponentClient()

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        const code = searchParams.get("code")

        if (code) {
          await supabase.auth.exchangeCodeForSession(code)
        }

        // Get the redirect path from session storage or default to home
        const redirectPath = sessionStorage.getItem("redirectAfterLogin") || "/"
        sessionStorage.removeItem("redirectAfterLogin")

        // If there's an error in the URL, redirect to login with the error
        const error = searchParams.get("error")
        const errorDescription = searchParams.get("error_description")

        if (error) {
          console.error("Auth error:", error, errorDescription)
          router.push(`/login?error=${encodeURIComponent(errorDescription || "Authentication failed")}`)
          return
        }

        // Otherwise redirect to the saved path
        router.push(redirectPath)
      } catch (error) {
        console.error("Error during auth callback:", error)
        router.push("/login?error=Authentication failed")
      }
    }

    handleAuthCallback()
  }, [router, searchParams, supabase.auth])

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-center">
        <h2 className="text-lg font-semibold">Logger inn...</h2>
        <p className="text-sm text-muted-foreground">Du vil bli videresendt automatisk</p>
      </div>
    </div>
  )
}

