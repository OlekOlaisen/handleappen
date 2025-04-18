"use client";

import Image from "next/image";
import { ExternalLink, ShoppingCart } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useCart } from "@/hooks/use-cart";
import type { Product } from "@/types/product";
import { formatPrice } from "@/lib/utils";
import AddToMealDialog from "@/components/add-to-meal-dialog";

interface ProductDialogProps {
  product: Product & { storeOptions?: Product[] };
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedStore?: string;
}

export default function ProductDialog({
  product,
  open,
  onOpenChange,
  selectedStore,
}: ProductDialogProps) {
  const { addItem } = useCart();

  // Sort store options by price
  const sortedStoreOptions = [...(product.storeOptions || [product])].sort(
    (a, b) => a.current_price - b.current_price
  );

  // Find the price to display (either selected store price or best price)
  let displayPrice =
    sortedStoreOptions[0]?.current_price || product.current_price;
  let displayUnitPrice =
    sortedStoreOptions[0]?.current_unit_price || product.current_unit_price;

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
      displayUnitPrice = storeOption.current_unit_price;
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl w-[90vw] md:w-[95vw] h-[90vh] flex flex-col overflow-hidden rounded-lg">
        <DialogHeader>
          <DialogTitle className="text-2xl">{product.name}</DialogTitle>
        </DialogHeader>
        <ScrollArea className="flex-1 -mx-6 px-6 overflow-y-auto">
          <div className="grid gap-6 md:grid-cols-2 pb-6">
            <div className="space-y-6">
              <div className="relative bg-white rounded-lg overflow-hidden">
               
                <div className="aspect-[16/9] md:aspect-[4/3]">
                  {product.image ? (
                    <Image
                      src={product.image || "/placeholder.svg"}
                      alt={product.name}
                      fill
                      className="object-contain p-4"
                    />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center text-muted-foreground">
                      Intet bilde
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <h3 className="font-medium text-muted-foreground">
                  Priser i butikker
                </h3>
                <div className="rounded-md border">
                  <div className="divide-y">
                    {sortedStoreOptions.map((option, index) => {
                      const isSelectedStore =
                        selectedStore && option.store.name === selectedStore;
                      const isCheapest = index === 0;
                      const isHighlighted =
                        isSelectedStore || (!selectedStore && isCheapest);

                      return (
                        <div
                          key={option.store.code}
                          className="flex items-center justify-between p-3"
                        >
                          <div className="flex items-center gap-2">
                            {option.store.logo && (
                              <div className="relative w-6 h-6 overflow-hidden rounded">
                                <Image
                                  src={option.store.logo || "/placeholder.svg"}
                                  alt={option.store.name}
                                  width={24}
                                  height={24}
                                  className="object-contain"
                                />
                              </div>
                            )}
                            <span
                              className={
                                isHighlighted
                                  ? "font-medium text-[#BE185D]"
                                  : ""
                              }
                            >
                              {option.store.name}
                              {isSelectedStore && " (Valgt butikk)"}
                              {!selectedStore && isCheapest && " (Billigst)"}
                            </span>
                            {option.url && (
                              <a
                                href={option.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-muted-foreground hover:text-foreground"
                              >
                                <ExternalLink className="h-4 w-4" />
                              </a>
                            )}
                          </div>
                          <span
                            className={
                              isHighlighted ? "font-medium text-[#BE185D]" : ""
                            }
                          >
                            {formatPrice(option.current_price)} kr
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <Tabs defaultValue="info" className="w-full">
                <TabsList className="w-full">
                  <TabsTrigger value="info" className="flex-1">
                    Info
                  </TabsTrigger>
                  <TabsTrigger value="nutrition" className="flex-1">
                    Næringsinnhold
                  </TabsTrigger>
                  <TabsTrigger value="allergens" className="flex-1">
                    Allergener
                  </TabsTrigger>
                </TabsList>
                <TabsContent value="info" className="mt-4 space-y-4">
                  {product.brand && (
                    <div>
                      <h3 className="font-medium text-muted-foreground">
                        Merke
                      </h3>
                      <p>{product.brand}</p>
                    </div>
                  )}

                  {product.vendor && (
                    <div>
                      <h3 className="font-medium text-muted-foreground">
                        Produsent
                      </h3>
                      <p>{product.vendor}</p>
                    </div>
                  )}

                  {product.description && (
                    <div>
                      <h3 className="font-medium text-muted-foreground">
                        Beskrivelse
                      </h3>
                      <p>{product.description}</p>
                    </div>
                  )}

                  {product.ingredients && (
                    <div>
                      <h3 className="font-medium text-muted-foreground">
                        Ingredienser
                      </h3>
                      <p className="text-sm">{product.ingredients}</p>
                    </div>
                  )}

                  {product.weight && product.weight_unit && (
                    <div>
                      <h3 className="font-medium text-muted-foreground">
                        Vekt
                      </h3>
                      <p>
                        {product.weight} {product.weight_unit}
                      </p>
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="nutrition" className="mt-4">
                  {product.nutrition && product.nutrition.length > 0 ? (
                    <div className="rounded-md border divide-y">
                      {product.nutrition.map((item) => (
                        <div
                          key={item.code}
                          className="flex justify-between p-3"
                        >
                          <span>{item.display_name}</span>
                          <span className="font-medium">
                            {item.amount} {item.unit}
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-muted-foreground">
                      Ingen næringsinformasjon tilgjengelig
                    </p>
                  )}
                </TabsContent>

                <TabsContent value="allergens" className="mt-4">
                  {product.allergens && product.allergens.length > 0 ? (
                    <div className="rounded-md border divide-y">
                      {product.allergens.map((allergen) => (
                        <div
                          key={allergen.code}
                          className="flex justify-between p-3"
                        >
                          <span>{allergen.display_name}</span>
                          <span
                            className={
                              allergen.contains === "YES"
                                ? "font-medium text-destructive"
                                : allergen.contains === "CAN_CONTAIN_TRACES"
                                ? "font-medium text-yellow-600"
                                : "text-muted-foreground"
                            }
                          >
                            {allergen.contains === "YES"
                              ? "Inneholder"
                              : allergen.contains === "CAN_CONTAIN_TRACES"
                              ? "Kan inneholde spor"
                              : "Inneholder ikke"}
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-muted-foreground">
                      Ingen allergeninformasjon tilgjengelig
                    </p>
                  )}
                </TabsContent>
              </Tabs>
            </div>
          </div>
        </ScrollArea>

        <div className="pt-6 space-y-2 border-t mt-auto">
          <div className="flex justify-between items-baseline">
            <span className="text-2xl font-bold">
              {formatPrice(displayPrice)} kr
            </span>
            {displayUnitPrice && (
              <span className="text-sm text-muted-foreground">
                ({formatPrice(displayUnitPrice)} kr/{product.weight_unit})
              </span>
            )}
          </div>
          <div className="grid grid-cols-2 gap-2">
            <AddToMealDialog
              product={product}
              onAddToMeal={() => onOpenChange(false)}
            />
            <Button
              size="lg"
              className="text-white"
              onClick={() => {
                addItem({
                  ...product,
                  storeOptions: product.storeOptions || [product],
                });
                onOpenChange(false);
              }}
            >
              <ShoppingCart className="h-5 w-5 mr-2" />
              Legg i handlekurv
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
