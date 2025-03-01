import ProductSearch from "@/components/product-search"
import Header from "@/components/header"
import { PWAPrompt } from "@/components/pwa-prompt"

export default function Home() {
  return (
    <>
      <PWAPrompt />
      <main className="min-h-screen flex flex-col">
        <Header />
        <div className="flex-1 p-4">
          <ProductSearch />
        </div>
      </main>
    </>
  )
}

