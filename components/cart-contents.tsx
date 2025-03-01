"use client"

import Image from "next/image"
import { Minus, Plus, Trash2, Store, AlertCircle, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useCart } from "@/hooks/use-cart"
import { formatPrice } from "@/lib/utils"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Separator } from "@/components/ui/separator"
import { useAuth } from "@/components/auth/auth-provider"

export default function CartContents() {
  const {
    items,
    orphanedItems,
    removeItem,
    updateQuantity,
    bestStores,
    totalByStore,
    clearCart,
    isLoading,
    isSyncing,
  } = useCart()
  const { user } = useAuth()

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-[50vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
        <p className="text-muted-foreground">Laster handlekurv...</p>
      </div>
    )
  }

  if (items.length === 0 && orphanedItems.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-[50vh] text-muted-foreground">
        <p>Handlekurven er tom</p>
      </div>
    )
  }

  // Find the store with the lowest total
  const sortedStores = Object.entries(totalByStore).sort(([, a], [, b]) => a - b)

  const bestStore =
    sortedStores.length > 0
      ? {
          store: sortedStores[0][0],
          total: sortedStores[0][1],
        }
      : { store: "", total: 0 }

  return (
    <div className="flex flex-col h-[calc(100vh-10rem)]">
      {bestStore.store && (
        <Alert className="mb-4">
          <Store className="h-4 w-4" />
          <AlertTitle>Anbefalt butikk</AlertTitle>
          <AlertDescription className="mt-2 space-y-2">
            <p>
              Den billigste butikken for ditt kjøp er{" "}
              <span className="font-semibold text-[#BE185D]">{bestStore.store}</span>
            </p>
            <p className="font-semibold">Total pris: {formatPrice(bestStore.total)} kr</p>
          </AlertDescription>
        </Alert>
      )}

      <ScrollArea className="flex-1 -mx-6 px-6">
        <div className="space-y-6">
          {items.length > 0 && (
            <div className="space-y-4">
              <h3 className="font-medium text-sm">Handlekurv - {bestStore.store}</h3>
              <div className="space-y-4">
                {items.map((item) => {
                  const bestStoreOption = item.storeOptions.find((opt) => opt.store.name === bestStore.store)
                  const price = bestStoreOption?.current_price || item.current_price
                  const subtotal = price * item.quantity

                  return (
                    <div key={item.ean} className="flex gap-4 animate-in slide-in-from-right">
                      <div className="relative h-16 w-16 overflow-hidden rounded-md border">
                        {item.image ? (
                          <Image src={item.image || "/placeholder.svg"} alt={item.name} fill className="object-cover" />
                        ) : (
                          <div className="flex h-full items-center justify-center bg-secondary">
                            <span className="text-xs text-muted-foreground">Intet bilde</span>
                          </div>
                        )}
                      </div>
                      <div className="flex flex-1 flex-col">
                        <div className="flex justify-between">
                          <div className="space-y-1">
                            <h4 className="font-medium leading-none">{item.name}</h4>
                            <div className="text-sm text-muted-foreground">
                              <span>{formatPrice(price)} kr</span>
                              {item.quantity > 1 && <span className="ml-1">(Totalt: {formatPrice(subtotal)} kr)</span>}
                            </div>
                          </div>
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => removeItem(item.ean)}>
                            <Trash2 className="h-4 w-4" />
                            <span className="sr-only">Fjern fra handlekurv</span>
                          </Button>
                        </div>
                        <div className="flex items-center gap-2 mt-2">
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => updateQuantity(item.ean, item.quantity - 1)}
                          >
                            <Minus className="h-4 w-4" />
                            <span className="sr-only">Reduser antall</span>
                          </Button>
                          <span className="w-8 text-center">{item.quantity}</span>
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => updateQuantity(item.ean, item.quantity + 1)}
                          >
                            <Plus className="h-4 w-4" />
                            <span className="sr-only">Øk antall</span>
                          </Button>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {orphanedItems.length > 0 && (
            <div className="space-y-4">
              {items.length > 0 && <Separator />}
              <div className="flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-yellow-600" />
                <h3 className="font-medium text-sm text-yellow-600">Produkter som må kjøpes separat</h3>
              </div>
              <div className="space-y-4">
                {orphanedItems.map((item) => {
                  // Find the cheapest store option for this item
                  const sortedOptions = [...item.storeOptions].sort((a, b) => a.current_price - b.current_price)
                  const bestOption = sortedOptions[0]
                  const subtotal = bestOption.current_price * item.quantity

                  return (
                    <div key={item.ean} className="flex gap-4 animate-in slide-in-from-right">
                      <div className="relative h-16 w-16 overflow-hidden rounded-md border">
                        {item.image ? (
                          <Image src={item.image || "/placeholder.svg"} alt={item.name} fill className="object-cover" />
                        ) : (
                          <div className="flex h-full items-center justify-center bg-secondary">
                            <span className="text-xs text-muted-foreground">Intet bilde</span>
                          </div>
                        )}
                      </div>
                      <div className="flex flex-1 flex-col">
                        <div className="flex justify-between">
                          <div className="space-y-1">
                            <h4 className="font-medium leading-none">{item.name}</h4>
                            <div className="space-y-1">
                              <p className="text-sm text-[#BE185D]">
                                Billigst hos {bestOption.store.name}: {formatPrice(bestOption.current_price)} kr
                                {item.quantity > 1 && (
                                  <span className="ml-1">(Totalt: {formatPrice(subtotal)} kr)</span>
                                )}
                              </p>
                              <div className="text-sm text-muted-foreground">
                                Andre butikker:
                                {sortedOptions.slice(1, 4).map((option, index) => (
                                  <span key={option.store.code}>
                                    {index === 0 ? " " : ", "}
                                    {option.store.name} ({formatPrice(option.current_price)} kr)
                                  </span>
                                ))}
                              </div>
                            </div>
                          </div>
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => removeItem(item.ean)}>
                            <Trash2 className="h-4 w-4" />
                            <span className="sr-only">Fjern fra handlekurv</span>
                          </Button>
                        </div>
                        <div className="flex items-center gap-2 mt-2">
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => updateQuantity(item.ean, item.quantity - 1)}
                          >
                            <Minus className="h-4 w-4" />
                            <span className="sr-only">Reduser antall</span>
                          </Button>
                          <span className="w-8 text-center">{item.quantity}</span>
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => updateQuantity(item.ean, item.quantity + 1)}
                          >
                            <Plus className="h-4 w-4" />
                            <span className="sr-only">Øk antall</span>
                          </Button>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>
      </ScrollArea>

      {(items.length > 0 || orphanedItems.length > 0) && (
        <div className="space-y-4 pt-4 border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          {items.length > 0 && (
            <div className="space-y-2">
              <div className="text-sm font-medium mb-2">Sammenligning av butikker:</div>
              {sortedStores.slice(0, 3).map(([store, total]) => (
                <div key={store} className="flex justify-between text-sm">
                  <span className={store === bestStore.store ? "font-medium text-[#BE185D]" : ""}>
                    {store} {store === bestStore.store && "(Billigst)"}
                  </span>
                  <span className={store === bestStore.store ? "font-medium text-[#BE185D]" : ""}>
                    {formatPrice(total)} kr
                  </span>
                </div>
              ))}
            </div>
          )}

          {user && isSyncing && (
            <div className="flex items-center justify-center text-sm text-muted-foreground py-1">
              <Loader2 className="h-3 w-3 animate-spin mr-2" />
              Synkroniserer handlekurv...
            </div>
          )}

          <Button variant="outline" className="w-full text-destructive hover:bg-destructive/10" onClick={clearCart}>
            <Trash2 className="h-4 w-4 mr-2" />
            Tøm handlekurv
          </Button>
        </div>
      )}
    </div>
  )
}

