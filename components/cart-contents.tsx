"use client";

import Image from "next/image";
import { Minus, Plus, Trash2, Store, AlertCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCart } from "@/hooks/use-cart";
import { formatPrice } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/components/auth/auth-provider";
import { ShoppingListExport } from "@/components/shopping-list-export";

export default function CartContents() {
  const {
    items,
    orphanedItems,
    removeItem,
    updateQuantity,
    clearCart,
    isLoading,
    isSyncing,
  } = useCart();
  const { user } = useAuth();

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-[50vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
        <p className="text-muted-foreground">Laster handlekurv...</p>
      </div>
    );
  }

  if (items.length === 0 && orphanedItems.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-[50vh] text-muted-foreground">
        <p>Handlekurven er tom</p>
      </div>
    );
  }

  // Get all unique product IDs
  const allItems = [...items, ...orphanedItems];
  const allProductIds = new Set(allItems.map((item) => item.ean));
  const totalProductCount = allProductIds.size;

  // Track prices by store and which products are available at each store
  const storeData: Record<
    string,
    {
      total: number;
      productCount: number;
      availableProducts: Set<string>;
      logo?: string;
      name?: string;
      hasAllProducts: boolean;
    }
  > = {};

  // Calculate total price for each store
  allItems.forEach((item) => {
    item.storeOptions.forEach((option) => {
      const storeCode = option.store.code;

      // Initialize store data if not already done
      if (!storeData[storeCode]) {
        storeData[storeCode] = {
          total: 0,
          productCount: 0,
          availableProducts: new Set(),
          hasAllProducts: false,
          name: option.store.name,
          logo: option.store.logo,
        };
      }

      // Add product to store's available products if not already added
      if (!storeData[storeCode].availableProducts.has(item.ean)) {
        storeData[storeCode].availableProducts.add(item.ean);
        storeData[storeCode].productCount++;
      }

      // Add price to store's total
      storeData[storeCode].total += option.current_price * item.quantity;
    });
  });

  // Mark stores that have all products
  Object.keys(storeData).forEach((storeCode) => {
    storeData[storeCode].hasAllProducts =
      storeData[storeCode].productCount === totalProductCount;
  });

  // Convert to array and sort by product count (descending) first, then by price (ascending)
  const sortedStores = Object.entries(storeData)
    .map(([storeCode, data]) => ({
      storeCode,
      total: data.total,
      productCount: data.productCount,
      hasAllProducts: data.hasAllProducts,
      name: data.name || storeCode,
      logo: data.logo,
    }))
    .sort((a, b) => {
      // First sort by product count (descending)
      if (b.productCount !== a.productCount) {
        return b.productCount - a.productCount;
      }
      // Then sort by price (ascending)
      return a.total - b.total;
    });

  // The best store is the first one after sorting by product count and price
  const bestStore = sortedStores.length > 0 ? sortedStores[0] : null;

  // Calculate the cheapest possible total price (across all stores)
  const cheapestTotalPrice = allItems.reduce((sum, item) => {
    // Find the cheapest store option for this product
    const cheapestPrice = item.storeOptions
      ? Math.min(...item.storeOptions.map((opt) => opt.current_price))
      : item.current_price;
    return sum + cheapestPrice * item.quantity;
  }, 0);

  return (
    <div className="flex flex-col h-[calc(100vh-5rem)]">
      {bestStore && (
        <Alert className="mb-4">
          <Store className="h-4 w-4" />
          <AlertTitle>Anbefalt butikk</AlertTitle>
          <AlertDescription className="mt-2 space-y-2">
            <p>Den billigste butikken for ditt kjøp er</p>
            <div className="flex items-center gap-2">
              {bestStore.logo && (
                <div className="relative w-6 h-6 overflow-hidden rounded">
                  <Image
                    src={bestStore.logo || "/placeholder.svg"}
                    alt={bestStore.name}
                    width={24}
                    height={24}
                    className="object-contain"
                  />
                </div>
              )}
              <span className="font-semibold text-[#BE185D]">
                {bestStore.name}
              </span>
              <span>
                ({bestStore.productCount}/{totalProductCount} produkter)
              </span>
            </div>
            <p className="font-semibold">
              Total pris: {formatPrice(bestStore.total)} kr
            </p>
            {!bestStore.hasAllProducts && (
              <p className="text-yellow-600 text-sm flex items-center gap-1">
                <AlertCircle className="h-4 w-4" />
                <span>Noen produkter må kjøpes fra andre butikker</span>
              </p>
            )}
          </AlertDescription>
        </Alert>
      )}

      <ScrollArea className="flex-1 -mx-6 px-6">
        <div className="space-y-6">
          {items.length > 0 && (
            <div className="space-y-4">
              {/* Added store logo to the heading */}
              <div className="flex items-center gap-2">
                {bestStore?.logo ? (
                  <div className="relative w-5 h-5 overflow-hidden rounded">
                    <Image
                      src={bestStore.logo || "/placeholder.svg"}
                      alt={bestStore.name}
                      width={20}
                      height={20}
                      className="object-contain"
                    />
                  </div>
                ) : (
                  <Store className="h-4 w-4 text-[#BE185D]" />
                )}
                <h3 className="font-medium text-sm">
                  Handlekurv - {bestStore?.name || ""}
                </h3>
              </div>
              <div className="space-y-4">
                {items.map((item) => {
                  const bestStoreOption = item.storeOptions.find(
                    (opt) => opt.store.code === bestStore?.storeCode
                  );
                  const price =
                    bestStoreOption?.current_price || item.current_price;
                  const subtotal = price * item.quantity;

                  return (
                    <div
                      key={item.ean}
                      className="flex gap-4 animate-in slide-in-from-right"
                    >
                      <div className="relative h-16 w-16 overflow-hidden rounded-md border">
                        {item.image ? (
                          <Image
                            src={item.image || "/placeholder.svg"}
                            alt={item.name}
                            fill
                            className="object-cover"
                          />
                        ) : (
                          <div className="flex h-full items-center justify-center bg-secondary">
                            <span className="text-xs text-muted-foreground">
                              Intet bilde
                            </span>
                          </div>
                        )}
                      </div>
                      <div className="flex flex-1 flex-col">
                        <div className="flex justify-between">
                          <div className="space-y-1">
                            <h4 className="font-medium leading-none">
                              {item.name}
                            </h4>
                            <div className="text-sm text-muted-foreground">
                              <span>{formatPrice(price)} kr</span>
                              {item.quantity > 1 && (
                                <span className="ml-1">
                                  (Totalt: {formatPrice(subtotal)} kr)
                                </span>
                              )}
                            </div>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => removeItem(item.ean)}
                          >
                            <Trash2 className="h-4 w-4" />
                            <span className="sr-only">
                              Fjern fra handlekurv
                            </span>
                          </Button>
                        </div>
                        <div className="flex items-center gap-2 mt-2">
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() =>
                              updateQuantity(item.ean, item.quantity - 1)
                            }
                          >
                            <Minus className="h-4 w-4" />
                            <span className="sr-only">Reduser antall</span>
                          </Button>
                          <span className="w-8 text-center">
                            {item.quantity}
                          </span>
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() =>
                              updateQuantity(item.ean, item.quantity + 1)
                            }
                          >
                            <Plus className="h-4 w-4" />
                            <span className="sr-only">Øk antall</span>
                          </Button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {orphanedItems.length > 0 && (
            <div className="space-y-4">
              {items.length > 0 && <Separator />}
              <div className="flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-yellow-600" />
                <h3 className="font-medium text-sm text-yellow-600">
                  Produkter som må kjøpes separat
                </h3>
              </div>
              <div className="space-y-4">
                {orphanedItems.map((item) => {
                  const sortedOptions = [...item.storeOptions].sort(
                    (a, b) => a.current_price - b.current_price
                  );
                  const bestOption = sortedOptions[0];
                  const subtotal = bestOption.current_price * item.quantity;

                  return (
                    <div
                      key={item.ean}
                      className="flex gap-4 animate-in slide-in-from-right"
                    >
                      <div className="relative h-16 w-16 overflow-hidden rounded-md border">
                        {item.image ? (
                          <Image
                            src={item.image || "/placeholder.svg"}
                            alt={item.name}
                            fill
                            className="object-cover"
                          />
                        ) : (
                          <div className="flex h-full items-center justify-center bg-secondary">
                            <span className="text-xs text-muted-foreground">
                              Intet bilde
                            </span>
                          </div>
                        )}
                      </div>
                      <div className="flex flex-1 flex-col">
                        <div className="flex justify-between">
                          <div className="space-y-1">
                            <h4 className="font-medium leading-none">
                              {item.name}
                            </h4>
                            <div className="space-y-1">
                              {/* Added store logo to the best option */}
                              <div className="flex items-center gap-1">
                                {bestOption.store.logo && (
                                  <div className="relative w-4 h-4 overflow-hidden rounded">
                                    <Image
                                      src={
                                        bestOption.store.logo ||
                                        "/placeholder.svg"
                                      }
                                      alt={bestOption.store.name}
                                      width={16}
                                      height={16}
                                      className="object-contain"
                                    />
                                  </div>
                                )}
                                <span className="text-sm text-[#BE185D]">
                                  {bestOption.store.name} (Billigst)
                                </span>{" "}
                                <span className="text-sm text-muted-foreground ">
                                  {formatPrice(bestOption.current_price)} kr
                                </span>
                              </div>
                              <div className="text-sm text-muted-foreground">
                                {sortedOptions
                                  .slice(1, 4)
                                  .map((option, index) => (
                                    <span
                                      key={option.store.code}
                                      className="flex items-center inline-flex gap-1 first:ml-0 ml-1"
                                    >
                                      {index === 0 ? "" : ", "}
                                      {option.store.logo && (
                                        <div className="relative w-4 h-4 overflow-hidden rounded">
                                          <Image
                                            src={
                                              option.store.logo ||
                                              "/placeholder.svg"
                                            }
                                            alt={option.store.name}
                                            width={16}
                                            height={16}
                                            className="object-contain"
                                          />
                                        </div>
                                      )}
                                      {option.store.name} (
                                      {formatPrice(option.current_price)} kr)
                                    </span>
                                  ))}
                              </div>
                            </div>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => removeItem(item.ean)}
                          >
                            <Trash2 className="h-4 w-4" />
                            <span className="sr-only">
                              Fjern fra handlekurv
                            </span>
                          </Button>
                        </div>
                        <div className="flex items-center gap-2 mt-2">
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() =>
                              updateQuantity(item.ean, item.quantity - 1)
                            }
                          >
                            <Minus className="h-4 w-4" />
                            <span className="sr-only">Reduser antall</span>
                          </Button>
                          <span className="w-8 text-center">
                            {item.quantity}
                          </span>
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() =>
                              updateQuantity(item.ean, item.quantity + 1)
                            }
                          >
                            <Plus className="h-4 w-4" />
                            <span className="sr-only">Øk antall</span>
                          </Button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </ScrollArea>

      {(items.length > 0 || orphanedItems.length > 0) && (
        <div className="pt-4 border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 flex flex-col">
          {items.length > 0 && (
            <div className="mb-4">
              <div className="text-sm font-medium mb-2">
                Sammenligning av butikker:
              </div>
              <div className="max-h-[250px] overflow-y-auto pr-1 space-y-2">
                {sortedStores.slice(0, 4).map((store) => (
                  <div
                    key={store.storeCode}
                    className="flex items-center justify-between text-sm mb-2"
                  >
                    <div className="flex items-center gap-2">
                      {store.logo && (
                        <div className="relative w-6 h-6 overflow-hidden rounded">
                          <Image
                            src={store.logo || "/placeholder.svg"}
                            alt={store.name}
                            width={24}
                            height={24}
                            className="object-contain"
                          />
                        </div>
                      )}
                      <span
                        className={
                          store === bestStore
                            ? "font-medium text-[#BE185D]"
                            : ""
                        }
                      >
                        {store.name} {store === bestStore && "(Billigst)"}
                      </span>
                      <span className="text-yellow-600 text-xs">
                        ({store.productCount}/{totalProductCount})
                      </span>
                    </div>
                    <span
                      className={
                        store === bestStore ? "font-medium text-[#BE185D]" : ""
                      }
                    >
                      {formatPrice(store.total)} kr
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {user && isSyncing && (
            <div className="flex items-center justify-center text-sm text-muted-foreground py-1">
              <Loader2 className="h-3 w-3 animate-spin mr-2" />
              Synkroniserer handlekurv...
            </div>
          )}

          <div className="mt-auto pt-4 space-y-2">
            <ShoppingListExport />
            <Button
              variant="outline"
              className="w-full text-destructive hover:bg-destructive/10"
              onClick={clearCart}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Tøm handlekurv
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
