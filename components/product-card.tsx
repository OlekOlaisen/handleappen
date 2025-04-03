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
}

export default function ProductCard({ product }: ProductCardProps) {
  const { addItem } = useCart();
  const [dialogOpen, setDialogOpen] = useState(false);

  // Find the lowest price across all store options
  const bestPrice =
    product.storeOptions?.reduce(
      (lowest, option) =>
        option.current_price < lowest ? option.current_price : lowest,
      product.current_price
    ) || product.current_price;

  // Find the store with the lowest price
  const bestStore = product.storeOptions?.find(
    (option) => option.current_price === bestPrice
  )?.store;

  // Get all available stores
  const availableStores = product.storeOptions
    ?.map((option) => option.store.name)
    .join(", ");

  return (
    <>
      <Card
        className="h-full overflow-hidden hover:shadow-md transition-shadow flex flex-col cursor-pointer"
        onClick={() => setDialogOpen(true)}
      >
        <div className="relative h-48 w-full bg-white shrink-0 rounded-t-lg">
          {product.image ? (
            <Image
              src={product.image || "/placeholder.svg"}
              alt={product.name}
              fill
              className="object-contain p-2"
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
              <CardTitle className="text-lg font-semibold line-clamp-2">
                {product.name}
              </CardTitle>
              {product.brand && (
                <CardDescription>{product.brand}</CardDescription>
              )}
            </div>
            <div className="text-right shrink-0">
              <p className="font-bold text-lg">{formatPrice(bestPrice)} kr</p>
              {bestStore && (
                <p className="text-xs text-[#BE185D]">
                  Billigst hos {bestStore.name}
                </p>
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
              className="text-white"
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
      />
    </>
  );
}
