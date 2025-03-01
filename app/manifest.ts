import type { MetadataRoute } from "next"

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Handleappen",
    short_name: "Handleappen",
    description: "Finn de beste prisene på dagligvarer",
    start_url: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#ffffff", 
    icons: [
      {
        src: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/logo-192x192-oEcBR5WOdUMQH9v8kUl585lWUhTiMj.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/logo-512x512-q1fSAjmpSrSuG0KkHYhLmqyZZk7LrW.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
    screenshots: [
      {
        src: "/screenshot-mobile.png",
        sizes: "1170x2532",
        type: "image/png",
        form_factor: "narrow",
        label: "Homescreen of Handleappen",
      },
      {
        src: "/screenshot-desktop.png",
        sizes: "2048x1152",
        type: "image/png",
        form_factor: "wide",
        label: "Desktop view of Handleappen",
      },
    ],
  }
}

