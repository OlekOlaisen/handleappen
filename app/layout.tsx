import type React from "react"
import type { Metadata } from "next"
import { Inter as FontSans } from "next/font/google"
import "./globals.css"
import { CartProvider } from "@/components/cart-provider"
import { ThemeProvider } from "@/components/theme-provider"
import { MealProvider } from "@/components/meal-provider"
import { MealWeekdayProvider } from "@/components/meal-weekday-provider"
import { AuthProvider } from "@/components/auth/auth-provider"
import ProtectedRoute from "@/components/auth/protected-route"
import { Toaster } from "@/components/ui/toaster"
import Script from "next/script"

const fontSans = FontSans({
  subsets: ["latin"],
  variable: "--font-sans",
})

export const metadata: Metadata = {
  title: "Handleappen",
  description: "Finn de beste prisene på dagligvarer",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Handleappen",
  },
  formatDetection: {
    telephone: false,
  },
  themeColor: "#09090b",
  viewport: {
    width: "device-width",
    initialScale: 1,
    maximumScale: 1,
    userScalable: false,
    viewportFit: "cover",
  },
    
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="nb" suppressHydrationWarning className="dark">
      <head>
        <meta name="theme-color" content="#ffffff" media="(prefers-color-scheme: light)" />
        <meta name="theme-color" content="#09090b" media="(prefers-color-scheme: dark)" />
      </head>
      <body className={`${fontSans.variable} font-sans`}>
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false} disableTransitionOnChange>
          <AuthProvider>
            <ProtectedRoute>
              <MealWeekdayProvider>
                <MealProvider>
                  <CartProvider>{children}</CartProvider>
                </MealProvider>
              </MealWeekdayProvider>
            </ProtectedRoute>
          </AuthProvider>
        </ThemeProvider>
        <Toaster />
        <Script
          id="register-sw"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: `
              if ('serviceWorker' in navigator) {
                window.addEventListener('load', function() {
                  navigator.serviceWorker.register('/sw.js').then(
                    function(registration) {
                      console.log('Service Worker registration successful');
                    },
                    function(err) {
                      console.log('Service Worker registration failed: ', err);
                    }
                  );
                });
              }
            `,
          }}
        />
      </body>
    </html>
  )
}



import './globals.css'