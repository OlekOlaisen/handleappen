"use client"

import type React from "react"

import { useEffect } from "react"
import { useRouter, usePathname } from "next/navigation"
import { useAuth } from "@/components/auth/auth-provider"
import { Loader2 } from "lucide-react"

export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth()
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    // Skip redirect for auth pages
    if (
      pathname === "/login" ||
      pathname === "/signup" ||
      pathname === "/reset-password" ||
      pathname === "/forgot-password"
    ) {
      return
    }

    if (!isLoading && !user) {
      // Store the page they tried to visit
      sessionStorage.setItem("redirectAfterLogin", pathname)
      router.push("/login")
    }
  }, [user, isLoading, router, pathname])

  // Show loading indicator while checking auth status
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  // For auth pages, we want to show them even if the user is not logged in
  if (
    pathname === "/login" ||
    pathname === "/signup" ||
    pathname === "/reset-password" ||
    pathname === "/forgot-password"
  ) {
    return <>{children}</>
  }

  // For protected pages, only show content if user is logged in
  return user ? <>{children}</> : null
}

