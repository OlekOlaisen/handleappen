"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2 } from "lucide-react"

export default function ResetPasswordPage() {
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const router = useRouter()

  // Check if we have a hash in the URL (from the password reset email)
  useEffect(() => {
    const handleHashChange = async () => {
      // Get the hash from the URL
      const hash = window.location.hash.substring(1)
      if (!hash) return

      try {
        // Parse the hash parameters
        const params = new URLSearchParams(hash)
        const accessToken = params.get("access_token")
        const refreshToken = params.get("refresh_token")
        const expiresIn = params.get("expires_in")
        const tokenType = params.get("token_type")

        if (accessToken) {
          // Set the session with the tokens
          await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken || "",
          })
        }
      } catch (error) {
        console.error("Error processing reset password:", error)
        setError("Ugyldig eller utløpt tilbakestillingslenke")
      }
    }

    handleHashChange()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccessMessage(null)

    // Validate password length
    if (password.length < 8) {
      setError("Passordet må være minst 8 tegn langt")
      return
    }

    // Validate passwords match
    if (password !== confirmPassword) {
      setError("Passordene stemmer ikke overens")
      return
    }

    setIsLoading(true)

    try {
      const { error } = await supabase.auth.updateUser({ password })

      if (error) {
        if (error.message.includes("password")) {
          setError("Passordet må være minst 8 tegn langt")
        } else {
          setError("Kunne ikke oppdatere passordet. Vennligst prøv igjen.")
        }
        return
      }

      setSuccessMessage("Passordet ditt er oppdatert!")

      // Redirect to login after a short delay
      setTimeout(() => {
        router.push("/login")
      }, 2000)
    } catch (error) {
      console.error("Password update error:", error)
      setError("Kunne ikke oppdatere passordet. Vennligst prøv igjen.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <div className="w-full max-w-md space-y-4">
        <h1 className="text-4xl font-bold text-center text-primary">Handleappen</h1>
        <Card className="w-full max-w-md">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl font-bold">Tilbakestill passord</CardTitle>
            <CardDescription>Skriv inn ditt nye passord</CardDescription>
          </CardHeader>
          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-4">
              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
              {successMessage && (
                <Alert className="bg-green-50 text-green-800 border-green-200">
                  <AlertDescription>{successMessage}</AlertDescription>
                </Alert>
              )}
              <div className="space-y-2">
                <Label htmlFor="password">Nytt passord</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirm-password">Bekreft nytt passord</Label>
                <Input
                  id="confirm-password"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                />
              </div>
            </CardContent>
            <CardFooter className="flex flex-col space-y-4">
              <Button type="submit" className="w-full text-white" disabled={isLoading || !!successMessage}>
                {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Oppdater passord
              </Button>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  )
}

