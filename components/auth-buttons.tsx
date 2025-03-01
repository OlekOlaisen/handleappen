"use client"

import Link from "next/link"
import { useAuth } from "@/components/auth/auth-provider"
import { Button } from "@/components/ui/button"
import { UserMenu } from "@/components/user-menu"

export function AuthButtons() {
  const { user, isLoading } = useAuth()

  if (isLoading) {
    return null
  }

  if (user) {
    return <UserMenu />
  }

  return (
    <div className="flex items-center gap-2">
      <Link href="/login">
        <Button variant="ghost" size="sm">
          Logg inn
        </Button>
      </Link>
      <Link href="/signup">
        <Button size="sm">Registrer deg</Button>
      </Link>
    </div>
  )
}

