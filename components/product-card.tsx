"use client";

import Image from "next/image";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ShoppingCart } from "lucide-react";
import { useCart } from "@/hooks/use-cart";
import type { Product } from "@/types/product";
import { formatPrice } from "@/lib/utils";
import ProductDialog from "@/components/product-dialog";
import AddToMealDialog from "@/components/add-to-meal-dialog";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";

interface ProductCardProps {
  product: Product & { storeOptions?: Product[] };
  selectedStore?: string;
}

export default function ProductCard({
  product,
  selectedStore,
}: ProductCardProps) {
  const { addItem } = useCart();
  const [dialogOpen, setDialogOpen] = useState(false);

  let displayPrice = product.current_price;
  let displayStore = product.store;
  let isLowestPrice = false;

  // If a specific store is selected, find that store's price
  if (
    selectedStore &&
    product.storeOptions &&
    product.storeOptions.length > 0
  ) {
    const storeOption = product.storeOptions.find(
      (option) => option.store && option.store.name === selectedStore
    );
    if (storeOption) {
      displayPrice = storeOption.current_price;
      displayStore = storeOption.store;
    }
  }
  // If no specific store is selected, find the cheapest option
  else if (product.storeOptions && product.storeOptions.length > 0) {
    const cheapestOption = product.storeOptions.reduce(
      (cheapest, option) =>
        option.current_price < cheapest.current_price ? option : cheapest,
      product.storeOptions[0]
    );
    displayPrice = cheapestOption.current_price;
    displayStore = cheapestOption.store;
    isLowestPrice = true;
  }

  // Get all available stores
  const availableStores = product.storeOptions
    ?.map((option) => option.store.name)
    .join(", ");

  return (
    <>
      <Card
        className="h-full overflow-hidden hover:shadow-lg transition-all duration-300 ease-in-out transform hover:-translate-y-1 flex flex-col cursor-pointer group"
        onClick={() => setDialogOpen(true)}
      >
        <div className="relative h-48 w-full bg-white shrink-0 rounded-t-lg overflow-hidden">
          {product.image ? (
            <Image
              src={product.image || "/placeholder.svg"}
              alt={product.name}
              fill
              className="object-contain p-2 transition-transform duration-300 group-hover:scale-105"
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center text-muted-foreground">
              Intet bilde
            </div>
          )}
        </div>

        <CardHeader className="p-4 pb-2">
          <div className="flex items-start justify-between gap-4">
            <div>
              <CardTitle className="text-sm font-semibold line-clamp-2 group-hover:underline decoration-[#BE185D]/70 decoration-2 underline-offset-2">
                {product.name}
              </CardTitle>
              {product.brand && (
                <CardDescription>{product.brand}</CardDescription>
              )}
            </div>
            <div className="text-right shrink-0">
              <p className="font-bold text-lg">
                {formatPrice(displayPrice)} kr
              </p>
              {isLowestPrice && displayStore && (
                <div className="flex items-center justify-end gap-1 text-xs text-[#BE185D]">
                  {displayStore.logo && (
                    <div className="relative w-4 h-4 overflow-hidden rounded">
                      <Image
                        src={displayStore.logo || "/placeholder.svg"}
                        alt={displayStore.name}
                        width={16}
                        height={16}
                        className="object-contain"
                      />
                    </div>
                  )}
                  <span>Billigst hos {displayStore.name}</span>
                </div>
              )}
              {selectedStore && displayStore && !isLowestPrice && (
                <div className="flex items-center justify-end gap-1 text-xs text-muted-foreground">
                  {displayStore.logo && (
                    <div className="relative w-4 h-4 overflow-hidden rounded">
                      <Image
                        src={displayStore.logo || "/placeholder.svg"}
                        alt={displayStore.name}
                        width={16}
                        height={16}
                        className="object-contain"
                      />
                    </div>
                  )}
                  <span>Pris hos {displayStore.name}</span>
                </div>
              )}
            </div>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Tilgjengelig hos: {availableStores}
          </p>
        </CardHeader>

        <CardContent className="p-4 pt-0 mt-auto">
          <div className="grid grid-cols-2 gap-2">
            <AddToMealDialog product={product} />
            <Button
              className="text-white transition-colors hover:bg-[#a01a52]"
              onClick={(e) => {
                e.stopPropagation();
                addItem({
                  ...product,
                  storeOptions: product.storeOptions || [product],
                });
              }}
            >
              <ShoppingCart className="h-4 w-4 mr-2" />
              Legg i kurv
            </Button>
          </div>
        </CardContent>
      </Card>

      <ProductDialog
        product={product}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        selectedStore={selectedStore}
      />
    </>
  );
}
