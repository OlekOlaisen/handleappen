"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import {
  ArrowLeft,
  Minus,
  Plus,
  Trash2,
  ShoppingCart,
  Store,
  AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useMeal } from "@/hooks/use-meal";
import { useCart } from "@/hooks/use-cart";
import { formatPrice } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";
import Header from "@/components/header";
import { Separator } from "@/components/ui/separator";

export default function MealDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { meals, removeProductFromMeal, updateProductQuantity } = useMeal();
  const { addItem } = useCart();
  const [meal, setMeal] = useState<
    ReturnType<typeof useMeal>["meals"][0] | null
  >(null);

  const mealId =
    typeof params.id === "string"
      ? params.id
      : Array.isArray(params.id)
      ? params.id[0]
      : null;

  useEffect(() => {
    if (mealId) {
      const foundMeal = meals.find((m) => m.id === mealId);
      if (foundMeal) {
        setMeal(foundMeal);
      } else {
        // Meal not found, redirect to meals page
        router.push("/meals");
      }
    }
  }, [mealId, meals, router]);

  if (!meal) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <div className="flex-1 p-4 flex items-center justify-center">
          <p>Laster måltid...</p>
        </div>
      </div>
    );
  }

  // Track prices by store and which products are available at each store
  const storeData: Record<
    string,
    {
      total: number;
      productCount: number;
      availableProducts: Set<string | number>;
      logo?: string;
      hasAllProducts: boolean;
    }
  > = {};

  // Track all products in the meal
  const allProductIds = new Set(meal.items.map((item) => item.product.id));
  const totalProductCount = allProductIds.size;

  // Calculate the cheapest possible total price (across all stores)
  const cheapestTotalPrice = meal.items.reduce((sum, item) => {
    // Find the cheapest store option for this product
    const cheapestPrice = item.product.storeOptions
      ? Math.min(...item.product.storeOptions.map((opt) => opt.current_price))
      : item.product.current_price;
    return sum + cheapestPrice * item.quantity;
  }, 0);

  // Calculate total price for the meal and track by store
  meal.items.forEach((item) => {
    if (item.product.storeOptions && item.product.storeOptions.length > 0) {
      item.product.storeOptions.forEach((option) => {
        const storeName = option.store.name;
        if (!storeData[storeName]) {
          storeData[storeName] = {
            total: 0,
            productCount: 0,
            availableProducts: new Set(),
            logo: option.store.logo,
            hasAllProducts: false,
          };
        }

        if (!storeData[storeName].availableProducts.has(item.product.id)) {
          storeData[storeName].productCount++;
          storeData[storeName].availableProducts.add(item.product.id);
        }

        storeData[storeName].total += option.current_price * item.quantity;
      });
    }
  });

  // Mark stores that have all products
  Object.keys(storeData).forEach((storeName) => {
    storeData[storeName].hasAllProducts =
      storeData[storeName].productCount === totalProductCount;
  });

  // Sort stores by product count (descending) first, then by price (ascending)
  const sortedStores = Object.entries(storeData)
    .map(([name, data]) => ({
      name,
      total: data.total,
      logo: data.logo,
      productCount: data.productCount,
      hasAllProducts: data.hasAllProducts,
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

  // Determine if the best store has all products
  const hasAllProducts = bestStore?.hasAllProducts || false;

  const handleAddAllToCart = () => {
    meal.items.forEach((item) => {
      addItem({
        ...item.product,
        storeOptions: item.product.storeOptions || [item.product],
      });
    });
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <div className="flex-1 container mx-auto p-4 pb-20 md:pb-4">
        <div className="mb-4 flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push("/meals")}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-2xl font-bold">{meal.name}</h1>
        </div>

        <div className="grid gap-6 md:grid-cols-[1fr_300px]">
          {/* Product List */}
          <div className="space-y-4">
            <h2 className="text-lg font-medium">Produkter i måltid</h2>
            {meal.items.length === 0 ? (
              <div className="border rounded-lg p-6 text-center">
                <p className="text-muted-foreground">
                  Ingen produkter i dette måltid ennå.
                </p>
                <Button className="mt-4" onClick={() => router.push("/")}>
                  Søk etter produkter
                </Button>
              </div>
            ) : (
              <ScrollArea>
                <div className="space-y-4 pb-4">
                  {meal.items.map((item) => {
                    // Find the cheapest store option for this product
                    const storeOptions = item.product.storeOptions || [
                      item.product,
                    ];
                    const cheapestOption = storeOptions.reduce(
                      (cheapest, option) =>
                        option.current_price < cheapest.current_price
                          ? option
                          : cheapest,
                      storeOptions[0]
                    );
                    const subtotal =
                      cheapestOption.current_price * item.quantity;

                    return (
                      <div
                        key={item.product.ean}
                        className="flex gap-4 border rounded-lg p-3"
                      >
                        <div className="relative h-16 w-16 overflow-hidden rounded-md border bg-white shrink-0">
                          {item.product.image ? (
                            <Image
                              src={item.product.image || "/placeholder.svg"}
                              alt={item.product.name}
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
                          <div className="flex justify-between">
                            <div className="space-y-1">
                              <h4 className="font-medium leading-none">
                                {item.product.name}
                              </h4>
                              <div className="text-sm text-muted-foreground">
                                <span>
                                  {formatPrice(cheapestOption.current_price)} kr
                                </span>
                                {item.quantity > 1 && (
                                  <span className="ml-1">
                                    (Totalt: {formatPrice(subtotal)} kr)
                                  </span>
                                )}
                              </div>
                              <div className="text-xs text-[#BE185D]">
                                Billigst hos {cheapestOption.store.name}
                              </div>
                            </div>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() =>
                                removeProductFromMeal(meal.id, item.product.ean)
                              }
                            >
                              <Trash2 className="h-4 w-4" />
                              <span className="sr-only">Fjern fra måltid</span>
                            </Button>
                          </div>
                          <div className="flex items-center gap-2 mt-2">
                            <Button
                              variant="outline"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() =>
                                updateProductQuantity(
                                  meal.id,
                                  item.product.ean,
                                  item.quantity - 1
                                )
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
                                updateProductQuantity(
                                  meal.id,
                                  item.product.ean,
                                  item.quantity + 1
                                )
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
              </ScrollArea>
            )}
          </div>

          {/* Meal Summary - Mobile */}
          <div className="md:hidden space-y-4 mb-4">
            <div className="border rounded-lg p-4 space-y-4">
              <h2 className="text-lg font-medium">Måltidssammendrag</h2>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>Antall produkter:</span>
                  <span>
                    {meal.items.reduce((sum, item) => sum + item.quantity, 0)}
                  </span>
                </div>
                <div className="flex justify-between font-medium">
                  <span>Estimert totalpris:</span>
                  <span>{formatPrice(cheapestTotalPrice)} kr</span>
                </div>

                {bestStore && (
                  <div className="space-y-1 pt-2">
                    <div className="flex items-center gap-1 text-sm text-[#BE185D]">
                      <Store className="h-4 w-4" />
                      <span>
                        Billigst hos {bestStore.name}:{" "}
                        {formatPrice(bestStore.total)} kr
                        {!bestStore.hasAllProducts &&
                          ` (${bestStore.productCount}/${totalProductCount})`}
                      </span>
                    </div>

                    {!bestStore.hasAllProducts && (
                      <div className="flex items-center gap-1 text-sm text-yellow-600">
                        <AlertCircle className="h-4 w-4" />
                        <span>
                          Noen ingredienser må kjøpes fra andre butikker
                        </span>
                      </div>
                    )}
                  </div>
                )}

                {sortedStores.length > 1 && (
                  <>
                    <Separator className="my-2" />
                    <div className="space-y-2">
                      <div className="text-sm font-medium">
                        Sammenligning av butikker:
                      </div>
                      {sortedStores.map((store, index) => (
                        <div
                          key={store.name}
                          className="flex items-center justify-between text-sm"
                        >
                          <div className="flex items-center gap-2">
                            {store.logo && (
                              <Image
                                src={store.logo || "/placeholder.svg"}
                                alt={store.name}
                                width={20}
                                height={20}
                                className="rounded"
                              />
                            )}
                            <span
                              className={
                                store.name === bestStore?.name
                                  ? "font-medium text-[#BE185D]"
                                  : ""
                              }
                            >
                              {store.name}{" "}
                              {store.name === bestStore?.name && "(Billigst)"}
                            </span>
                            <span className="text-yellow-600 text-xs ml-1">
                              ({store.productCount}/{totalProductCount})
                            </span>
                          </div>
                          <span
                            className={
                              store.name === bestStore?.name
                                ? "font-medium text-[#BE185D]"
                                : ""
                            }
                          >
                            {formatPrice(store.total)} kr
                          </span>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </div>
              {meal.items.length > 0 && (
                <Button className="w-full" onClick={handleAddAllToCart}>
                  <ShoppingCart className="h-4 w-4 mr-2" />
                  Legg alle i handlekurv
                </Button>
              )}
            </div>
          </div>

          {/* Meal Summary - Desktop */}
          <div className="hidden md:block space-y-4">
            <div className="border rounded-lg p-4 space-y-4">
              <h2 className="text-lg font-medium">Måltidssammendrag</h2>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>Antall produkter:</span>
                  <span>
                    {meal.items.reduce((sum, item) => sum + item.quantity, 0)}
                  </span>
                </div>
                <div className="flex justify-between font-medium">
                  <span>Estimert totalpris:</span>
                  <span>{formatPrice(cheapestTotalPrice)} kr</span>
                </div>

                {bestStore && (
                  <div className="space-y-1 pt-2">
                    <div className="flex items-center gap-1 text-sm text-[#BE185D]">
                      <Store className="h-4 w-4" />
                      <span>
                        Billigst hos {bestStore.name}:{" "}
                        {formatPrice(bestStore.total)} kr
                        {!bestStore.hasAllProducts &&
                          ` (${bestStore.productCount}/${totalProductCount})`}
                      </span>
                    </div>

                    {!bestStore.hasAllProducts && (
                      <div className="flex items-center gap-1 text-sm text-yellow-600">
                        <AlertCircle className="h-4 w-4" />
                        <span>
                          Noen ingredienser må kjøpes fra andre butikker
                        </span>
                      </div>
                    )}
                  </div>
                )}

                {sortedStores.length > 1 && (
                  <>
                    <Separator className="my-2" />
                    <div className="space-y-2">
                      <div className="text-sm font-medium">
                        Sammenligning av butikker:
                      </div>
                      {sortedStores.map((store) => (
                        <div
                          key={store.name}
                          className="flex items-center justify-between text-sm"
                        >
                          <div className="flex items-center gap-2">
                            {store.logo && (
                              <Image
                                src={store.logo || "/placeholder.svg"}
                                alt={store.name}
                                width={20}
                                height={20}
                                className="rounded"
                              />
                            )}
                            <span
                              className={
                                store.name === bestStore?.name
                                  ? "font-medium text-[#BE185D]"
                                  : ""
                              }
                            >
                              {store.name}{" "}
                              {store.name === bestStore?.name && "(Billigst)"}
                            </span>
                            <span className="text-yellow-600 text-xs ml-1">
                              ({store.productCount}/{totalProductCount})
                            </span>
                          </div>
                          <span
                            className={
                              store.name === bestStore?.name
                                ? "font-medium text-[#BE185D]"
                                : ""
                            }
                          >
                            {formatPrice(store.total)} kr
                          </span>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </div>
              {meal.items.length > 0 && (
                <Button className="w-full" onClick={handleAddAllToCart}>
                  <ShoppingCart className="h-4 w-4 mr-2" />
                  Legg alle i handlekurv
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
