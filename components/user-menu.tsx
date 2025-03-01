"use client"

import { useState } from "react"
import { useAuth } from "@/components/auth/auth-provider"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { User, LogOut, Settings } from "lucide-react"
import { SettingsDialog } from "@/components/settings-dialog"
import Image from "next/image"

export function UserMenu() {
  const { user, signOut } = useAuth()
  const [open, setOpen] = useState(false)

  if (!user) {
    return null
  }

  const avatarUrl = user.user_metadata?.avatar_url

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="icon" className="rounded-full overflow-hidden p-0">
            {avatarUrl ? (
              <Image
                src={avatarUrl || "/placeholder.svg"}
                alt="Profile picture"
                width={32}
                height={32}
                className="h-full w-full object-cover"
              />
            ) : (
              <User className="h-5 w-5" />
            )}
            <span className="sr-only">Brukermeny</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuLabel>Min konto</DropdownMenuLabel>
          <DropdownMenuItem disabled>{user.email}</DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => setOpen(true)}>
            <Settings className="mr-2 h-4 w-4" />
            Innstillinger
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => signOut()} className="text-destructive">
            <LogOut className="mr-2 h-4 w-4" />
            Logg ut
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <SettingsDialog open={open} onOpenChange={setOpen} />
    </>
  )
}

