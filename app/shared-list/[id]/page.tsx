"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Image from "next/image";
import { Store, AlertCircle, Loader2, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatPrice } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import Header from "@/components/header";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

interface SharedListItem {
  id: string;
  ean: string;
  name: string;
  quantity: number;
  image?: string;
  price: number;
  stores: Array<{
    name: string;
    price: number;
    logo?: string;
  }>;
}

interface SharedList {
  id: string;
  name: string;
  items: SharedListItem[];
  created_at: string;
  expires_at: string;
}

export default function SharedListPage() {
  const params = useParams();
  const [shoppingList, setShoppingList] = useState<SharedList | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const listId =
    typeof params.id === "string"
      ? params.id
      : Array.isArray(params.id)
      ? params.id[0]
      : null;

  useEffect(() => {
    async function fetchSharedList() {
      if (!listId) {
        setError("Ugyldig liste-ID");
        setIsLoading(false);
        return;
      }
      try {
        const response = await fetch(`/api/shared-list/${listId}`);
        const result = await response.json();
        if (!response.ok) {
          throw new Error(result.error || "Kunne ikke hente handlelisten");
        }
        setShoppingList(result.data);
      } catch (err) {
        console.error("Error fetching shared list:", err);
        setError(
          err instanceof Error ? err.message : "Kunne ikke hente handlelisten"
        );
      } finally {
        setIsLoading(false);
      }
    }
    fetchSharedList();
  }, [listId]);

  // Compute store comparison data (including logo) from all items
  const computeStoreComparisonData = () => {
    if (!shoppingList?.items) return [];
    const storeData: Record<
      string,
      {
        total: number;
        productCount: number;
        availableProducts: Set<string>;
        logo?: string;
      }
    > = {};

    shoppingList.items.forEach((item) => {
      item.stores.forEach((storeOption) => {
        const storeName = storeOption.name;
        if (!storeData[storeName]) {
          storeData[storeName] = {
            total: 0,
            productCount: 0,
            availableProducts: new Set(),
            logo: storeOption.logo,
          };
        }
        if (!storeData[storeName].availableProducts.has(item.id)) {
          storeData[storeName].availableProducts.add(item.id);
          storeData[storeName].productCount++;
        }
        storeData[storeName].total += storeOption.price * item.quantity;
      });
    });

    const totalProductCount = shoppingList.items.length;
    return Object.entries(storeData)
      .map(([name, data]) => ({
        name,
        total: data.total,
        productCount: data.productCount,
        hasAllProducts: data.productCount === totalProductCount,
        logo: data.logo,
      }))
      .sort((a, b) => {
        if (b.productCount !== a.productCount)
          return b.productCount - a.productCount;
        return a.total - b.total;
      });
  };

  const storeComparisonData = computeStoreComparisonData();
  const recommendedStore = storeComparisonData[0] || null;

  // Split items into those available at the recommended store and orphaned ones
  const recommendedStoreName = recommendedStore?.name;
  const itemsInRecommendedStore =
    shoppingList?.items.filter((item) =>
      item.stores.some((store) => store.name === recommendedStoreName)
    ) || [];
  const orphanedItems =
    shoppingList?.items.filter(
      (item) =>
        !item.stores.some((store) => store.name === recommendedStoreName)
    ) || [];

  // Calculate total price using the cheapest price for each item
  const calculateTotal = () => {
    if (!shoppingList?.items) return 0;
    return shoppingList.items.reduce((total, item) => {
      const cheapestPrice = Math.min(...item.stores.map((s) => s.price));
      return total + cheapestPrice * item.quantity;
    }, 0);
  };

  // Download shared list as a text file
  const downloadShoppingList = () => {
    if (!shoppingList) return;
    let content = `${shoppingList.name}\n`;
    content += `Generert: ${new Date(
      shoppingList.created_at
    ).toLocaleDateString()}\n\n`;
    shoppingList.items.forEach((item) => {
      const cheapestStore = [...item.stores].sort(
        (a, b) => a.price - b.price
      )[0];
      const itemTotal = cheapestStore.price * item.quantity;
      content += `${item.quantity}x ${item.name} - ${formatPrice(
        itemTotal
      )} kr\n`;
    });
    content += `\nTotal: ${formatPrice(calculateTotal())} kr\n`;
    const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `shopping-list-${listId}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <div className="flex-1 container mx-auto p-4 flex items-center justify-center">
          <div className="flex flex-col items-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
            <p className="text-muted-foreground">Laster handleliste...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !shoppingList) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <div className="flex-1 container mx-auto p-4 flex items-center justify-center">
          <div className="text-center">
            <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
            <h1 className="text-2xl font-bold mb-2">
              Kunne ikke hente handlelisten
            </h1>
            <p className="text-muted-foreground">
              {error || "Handlelisten finnes ikke eller har utløpt"}
            </p>
          </div>
        </div>
      </div>
    );
  }

  const expiresAt = new Date(shoppingList.expires_at);
  const now = new Date();
  const daysLeft = Math.ceil(
    (expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
  );

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <div className="flex-1 container mx-auto p-4 flex flex-col">
        {/* Recommended store alert */}
        {recommendedStore && (
          <Alert className="mb-4">
            <Store className="h-4 w-4" />
            <AlertTitle>Anbefalt butikk</AlertTitle>
            <AlertDescription className="mt-2 space-y-2">
              <p>Den billigste butikken for ditt kjøp er</p>
              <div className="flex items-center gap-2">
                <span className="font-semibold text-[#BE185D]">
                  {recommendedStore.name}
                </span>
                <span>
                  ({recommendedStore.productCount}/{shoppingList.items.length}{" "}
                  produkter)
                </span>
              </div>
              <p className="font-semibold">
                Total pris: {formatPrice(recommendedStore.total)} kr
              </p>
              {!recommendedStore.hasAllProducts && (
                <p className="text-yellow-600 text-sm flex items-center gap-1">
                  <AlertCircle className="h-4 w-4" />
                  <span>Noen produkter må kjøpes fra andre butikker</span>
                </p>
              )}
            </AlertDescription>
          </Alert>
        )}

        <div className="mb-6">
          <h1 className="text-2xl font-bold">{shoppingList.name}</h1>
          <p className="text-sm text-muted-foreground">
            Opprettet {new Date(shoppingList.created_at).toLocaleDateString()} ·
            Utløper om {daysLeft} {daysLeft === 1 ? "dag" : "dager"}
          </p>
        </div>

        <div className="flex justify-end mb-4">
          <Button onClick={downloadShoppingList}>
            <Download className="h-4 w-4 mr-2" />
            Last ned som tekstfil
          </Button>
        </div>

        <ScrollArea className="flex-1">
          <div className="space-y-6">
            {/* Items available at the recommended store */}
            {itemsInRecommendedStore.length > 0 && (
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <h3 className="font-medium">
                    Handlekurv - {recommendedStoreName}
                  </h3>
                </div>
                {itemsInRecommendedStore.map((item) => {
                  // Get the option for the recommended store; if missing, fall back to cheapest option
                  const bestStoreOption =
                    item.stores.find(
                      (store) => store.name === recommendedStoreName
                    ) || [...item.stores].sort((a, b) => a.price - b.price)[0];
                  const itemTotal = bestStoreOption.price * item.quantity;
                  return (
                    <div key={item.id} className="flex gap-4 items-center">
                      <div className="relative h-16 w-16 overflow-hidden rounded-md border bg-white shrink-0">
                        {item.image ? (
                          <Image
                            src={item.image || "/placeholder.svg"}
                            alt={item.name}
                            fill
                            className="object-contain p-1"
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
                        <h4 className="font-medium">{item.name}</h4>
                        <div className="text-sm text-muted-foreground">
                          <span>
                            {formatPrice(bestStoreOption.price)} kr{" "}
                            {item.quantity > 1 &&
                              `(Totalt: ${formatPrice(itemTotal)} kr)`}
                          </span>
                        </div>
                        <p className="text-sm">Antall: {item.quantity}x</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Orphaned items: those not available at the recommended store */}
            {orphanedItems.length > 0 && (
              <div className="space-y-4">
                {itemsInRecommendedStore.length > 0 && <Separator />}
                <div className="flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 text-yellow-600" />
                  <h3 className="font-medium text-yellow-600">
                    Produkter som må kjøpes separat
                  </h3>
                </div>
                <div className="space-y-4">
                  {orphanedItems.map((item) => {
                    const sortedOptions = [...item.stores].sort(
                      (a, b) => a.price - b.price
                    );
                    const bestOption = sortedOptions[0];
                    const itemTotal = bestOption.price * item.quantity;
                    return (
                      <div key={item.id} className="flex gap-4 items-center">
                        <div className="relative h-16 w-16 overflow-hidden rounded-md border bg-white shrink-0">
                          {item.image ? (
                            <Image
                              src={item.image || "/placeholder.svg"}
                              alt={item.name}
                              fill
                              className="object-contain p-1"
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
                          <h4 className="font-medium">{item.name}</h4>
                          <div className="space-y-1">
                            <p className="text-sm text-[#BE185D]">
                              Billigst hos {bestOption.name}:{" "}
                              {formatPrice(bestOption.price)} kr{" "}
                              {item.quantity > 1 && (
                                <span>
                                  (Totalt: {formatPrice(itemTotal)} kr)
                                </span>
                              )}
                            </p>
                            <div className="text-sm text-muted-foreground">
                              Andre butikker:
                              {sortedOptions
                                .slice(1, 4)
                                .map((option, index) => (
                                  <span key={option.name}>
                                    {index === 0 ? " " : ", "}
                                    {option.name} ({formatPrice(option.price)}{" "}
                                    kr)
                                  </span>
                                ))}
                            </div>
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

        {/* Store Comparison Section */}
        <div className="mt-6 pt-4 border-t">
          {storeComparisonData.length > 0 && (
            <div className="mb-4">
              <div className="text-sm font-medium mb-2">
                Sammenligning av butikker:
              </div>
              <div className="max-h-[250px] overflow-y-auto pr-1 space-y-2">
                {storeComparisonData.slice(0, 4).map((store) => (
                  <div
                    key={store.name}
                    className="flex items-center justify-between text-sm mb-2"
                  >
                    <div className="flex items-center gap-2">
                      <span
                        className={
                          store.name === recommendedStore?.name
                            ? "font-medium text-[#BE185D]"
                            : ""
                        }
                      >
                        {store.name}{" "}
                        {store.name === recommendedStore?.name && "(Billigst)"}
                      </span>
                      <span className="text-yellow-600 text-xs">
                        ({store.productCount}/{shoppingList.items.length})
                      </span>
                    </div>
                    <span
                      className={
                        store.name === recommendedStore?.name
                          ? "font-medium text-[#BE185D]"
                          : ""
                      }
                    >
                      {formatPrice(store.total)} kr
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex justify-between items-center">
            <span className="text-lg font-medium">Total</span>
            <span className="text-lg font-bold">
              {formatPrice(calculateTotal())} kr
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
