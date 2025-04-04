"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import ProductCard from "@/components/product-card";
import ProductCardSkeleton from "@/components/product-card-skeleton";
import type { Product } from "@/types/product";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function ProductSearch() {
  const searchParams = useSearchParams();
  const searchTerm = searchParams.get("q") || "";
  const sortParam = searchParams.get("sort") || "relevance"; // Default to relevance
  const storeParam = searchParams.get("store") || "all"; // Default to all stores

  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasSearched, setHasSearched] = useState(false);
  const [sortBy, setSortBy] = useState(sortParam);
  const [selectedStore, setSelectedStore] = useState(storeParam);
  const [availableStores, setAvailableStores] = useState<string[]>([]);

  useEffect(() => {
    async function searchProducts() {
      if (!searchTerm.trim()) {
        setProducts([]);
        setFilteredProducts([]);
        setHasSearched(false);
        return;
      }

      setLoading(true);
      setError(null);
      setHasSearched(true);

      try {
        const params = new URLSearchParams({
          search: searchTerm,
          size: "100",
        });

        if (sortBy && sortBy !== "relevance") {
          params.append("sort", sortBy);
        }

        const response = await fetch(`/api/products?${params.toString()}`);
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.details || `Error: ${response.status}`);
        }

        const fetchedProducts = (data.data as Product[]).filter(
          (product: Product) =>
            product.current_price && product.current_price > 0
        );

        setProducts(fetchedProducts);

        // Extract all unique store names from the products
        const storeSet = new Set<string>();

        fetchedProducts.forEach((product) => {
          // Add the product's own store if it exists
          if (product.store && product.store.name) {
            storeSet.add(product.store.name);
          }

          // Add all stores from storeOptions
          if (product.storeOptions && product.storeOptions.length > 0) {
            product.storeOptions.forEach((option) => {
              if (option.store && option.store.name) {
                storeSet.add(option.store.name);
              }
            });
          }
        });

        // Convert Set to sorted array
        const storeArray = Array.from(storeSet).sort();
        setAvailableStores(storeArray);

        // Apply store filtering
        filterProductsByStore(fetchedProducts, selectedStore);
      } catch (err) {
        const errorMessage =
          err instanceof Error
            ? err.message
            : "Kunne ikke hente produkter. Vennligst prøv igjen.";
        setError(errorMessage);
        console.error("Search error:", err);
      } finally {
        setLoading(false);
      }
    }

    searchProducts();
  }, [searchTerm, sortBy]);

  // Filter products by store and prepare products with store-specific prices
  function filterProductsByStore(productsToFilter: Product[], store: string) {
    if (!store || store === "all") {
      setFilteredProducts(productsToFilter);
      return;
    }

    // Filter products available at the selected store and update their prices
    const filtered = productsToFilter
      .filter((product) => {
        // Check if the product has storeOptions and if the selected store is in those options
        if (product.storeOptions && product.storeOptions.length > 0) {
          return product.storeOptions.some(
            (option) => option.store && option.store.name === store
          );
        }

        // If no storeOptions, check the product's own store
        return product.store && product.store.name === store;
      })
      .map((product) => {
        // Create a copy of the product to avoid mutating the original
        const productCopy = { ...product };

        // If the product has store options, find the price for the selected store
        if (product.storeOptions && product.storeOptions.length > 0) {
          const storeOption = product.storeOptions.find(
            (option) => option.store && option.store.name === store
          );

          if (storeOption) {
            // Update the product's price to the selected store's price
            productCopy.current_price = storeOption.current_price;
            productCopy.current_unit_price = storeOption.current_unit_price;
            productCopy.store = storeOption.store;
          }
        }

        return productCopy;
      });

    setFilteredProducts(filtered);
  }

  // Update filtered products when store selection changes
  useEffect(() => {
    filterProductsByStore(products, selectedStore);
  }, [selectedStore, products]);

  // Update URL when sort changes
  const handleSortChange = (value: string) => {
    setSortBy(value);
    const url = new URL(window.location.href);
    if (value) {
      url.searchParams.set("sort", value);
    } else {
      url.searchParams.delete("sort");
    }
    window.history.pushState({}, "", url);
  };

  // Update URL when store changes
  const handleStoreChange = (value: string) => {
    setSelectedStore(value);
    const url = new URL(window.location.href);
    if (value && value !== "all") {
      url.searchParams.set("store", value);
    } else {
      url.searchParams.delete("store");
    }
    window.history.pushState({}, "", url);
  };

  return (
    <div className="container mx-auto">
      {error && (
        <div className="bg-destructive/15 text-destructive p-4 rounded-md mb-6">
          {error}
        </div>
      )}

      <div className="mb-6 flex justify-end gap-2">
        <Select value={selectedStore} onValueChange={handleStoreChange}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Velg butikk" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Alle butikker</SelectItem>
            {availableStores.map((store) => (
              <SelectItem key={store} value={store}>
                {store}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={sortBy} onValueChange={handleSortChange}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Sorter etter" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="relevance">Relevans</SelectItem>
            <SelectItem value="price_asc">Pris: Lav til høy</SelectItem>
            <SelectItem value="price_desc">Pris: Høy til lav</SelectItem>
            <SelectItem value="name_asc">Navn: A til Å</SelectItem>
            <SelectItem value="name_desc">Navn: Å til A</SelectItem>
            <SelectItem value="date_desc">Nyeste først</SelectItem>
            <SelectItem value="date_asc">Eldste først</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <ProductCardSkeleton key={i} />
          ))}
        </div>
      ) : hasSearched ? (
        filteredProducts.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {filteredProducts.map((product: Product) => (
              <ProductCard
                key={product.id}
                product={product}
                selectedStore={
                  selectedStore !== "all" ? selectedStore : undefined
                }
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-muted-foreground">
              Ingen produkter funnet for "{searchTerm}"
              {selectedStore !== "all" ? ` hos ${selectedStore}` : ""}
            </p>
          </div>
        )
      ) : (
        <div className="text-center py-12">
          <p className="text-muted-foreground">
            Skriv inn søkeord for å finne produkter
          </p>
        </div>
      )}
    </div>
  );
}
