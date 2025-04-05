"use client";

import { useState } from "react";
import { Download, Share2, Copy, Check, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCart } from "@/hooks/use-cart";
import { formatPrice } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { useAuth } from "@/components/auth/auth-provider";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface ShoppingListData {
  id: string;
  user_id?: string;
  items: any[];
  created_at: string;
  name: string;
  expires_at: string;
}

export function ShoppingListExport() {
  const { items, orphanedItems } = useCart();
  const { toast } = useToast();
  const { user } = useAuth();
  const supabase = createClientComponentClient();

  const [isGeneratingLink, setIsGeneratingLink] = useState(false);
  const [shareableLink, setShareableLink] = useState<string | null>(null);
  const [isCopied, setIsCopied] = useState(false);
  const [listName, setListName] = useState("Min handleliste");
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  // All items from cart
  const allItems = [...items, ...orphanedItems];

  // Generate text content for the shopping list
  const generateShoppingListText = () => {
    if (allItems.length === 0) {
      return "Handlelisten er tom";
    }

    // Group items by store for better organization
    const storeGroups: Record<string, any[]> = {};

    allItems.forEach((item) => {
      // Find the cheapest store option for this product
      const storeOptions = [...item.storeOptions].sort(
        (a, b) => a.current_price - b.current_price
      );
      const bestOption = storeOptions[0];
      const storeName = bestOption.store.name;

      if (!storeGroups[storeName]) {
        storeGroups[storeName] = [];
      }

      storeGroups[storeName].push({
        ...item,
        price: bestOption.current_price,
      });
    });

    // Format the text content
    let content = `${listName}\n`;
    content += `Generert: ${new Date().toLocaleDateString()}\n\n`;

    let totalPrice = 0;

    Object.entries(storeGroups).forEach(([storeName, storeItems]) => {
      content += `=== ${storeName} ===\n`;

      let storeTotal = 0;
      storeItems.forEach((item) => {
        const itemTotal = item.price * item.quantity;
        storeTotal += itemTotal;
        content += `${item.quantity}x ${item.name} - ${formatPrice(
          itemTotal
        )} kr\n`;
      });

      content += `Subtotal: ${formatPrice(storeTotal)} kr\n\n`;
      totalPrice += storeTotal;
    });

    content += `Total: ${formatPrice(totalPrice)} kr\n`;

    return content;
  };

  // Download shopping list as text file
  const downloadShoppingList = () => {
    const content = generateShoppingListText();
    const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = `${listName.replace(/\s+/g, "-").toLowerCase()}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    toast({
      title: "Handleliste lastet ned",
      description: "Handlelisten er lastet ned som en tekstfil.",
    });
  };

  // Generate shareable link
  const generateShareableLink = async () => {
    if (allItems.length === 0) {
      toast({
        title: "Handlelisten er tom",
        description: "Legg til produkter i handlekurven først.",
        variant: "destructive",
      });
      return;
    }

    setIsGeneratingLink(true);

    try {
      // Create a simplified version of the items for sharing
      const simplifiedItems = allItems.map((item) => ({
        id: item.id,
        ean: item.ean,
        name: item.name,
        quantity: item.quantity,
        image: item.image,
        price: Math.min(...item.storeOptions.map((opt) => opt.current_price)),
        stores: item.storeOptions.map((opt) => ({
          name: opt.store.name,
          price: opt.current_price,
        })),
      }));

      // Calculate expiration date (7 days from now)
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7);

      // Create a record in the database
      const { data, error } = await supabase
        .from("shopping_lists")
        .insert({
          user_id: user?.id || null,
          items: simplifiedItems,
          name: listName,
          expires_at: expiresAt.toISOString(),
        })
        .select("id")
        .single();

      if (error) throw error;

      // Generate the shareable link
      const shareLink = `${window.location.origin}/shared-list/${data.id}`;
      setShareableLink(shareLink);
    } catch (error) {
      console.error("Error generating shareable link:", error);
      toast({
        title: "Feil ved generering av delbar lenke",
        description:
          "Kunne ikke generere delbar lenke. Vennligst prøv igjen senere.",
        variant: "destructive",
      });
    } finally {
      setIsGeneratingLink(false);
    }
  };

  // Copy link to clipboard
  const copyLinkToClipboard = () => {
    if (shareableLink) {
      navigator.clipboard.writeText(shareableLink);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);

      toast({
        title: "Lenke kopiert",
        description: "Delbar lenke er kopiert til utklippstavlen.",
      });
    }
  };

  return (
    <>
      <div className="flex gap-2">
        <Button
          variant="outline"
          className="flex-1"
          onClick={downloadShoppingList}
          disabled={allItems.length === 0}
        >
          <Download className="h-4 w-4 mr-2" />
          Last ned
        </Button>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button
              variant="outline"
              className="flex-1"
              disabled={allItems.length === 0}
            >
              <Share2 className="h-4 w-4 mr-2" />
              Del liste
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Del handleliste</DialogTitle>
              <DialogDescription>
                Opprett en delbar lenke til handlelisten din. Lenken vil være
                gyldig i 7 dager.
              </DialogDescription>
            </DialogHeader>

            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="list-name" className="text-right">
                  Navn
                </Label>
                <Input
                  id="list-name"
                  value={listName}
                  onChange={(e) => setListName(e.target.value)}
                  className="col-span-3"
                />
              </div>

              {shareableLink && (
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="link" className="text-right">
                    Lenke
                  </Label>
                  <div className="col-span-3 flex gap-2">
                    <Input
                      id="link"
                      readOnly
                      value={shareableLink}
                      className="col-span-2"
                    />
                    <Button size="icon" onClick={copyLinkToClipboard}>
                      {isCopied ? (
                        <Check className="h-4 w-4" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>
              )}
            </div>

            <DialogFooter className="sm:justify-between">
              <Button
                variant="secondary"
                onClick={() => setIsDialogOpen(false)}
              >
                Lukk
              </Button>

              {!shareableLink && (
                <Button
                  onClick={generateShareableLink}
                  disabled={isGeneratingLink}
                >
                  {isGeneratingLink && (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  )}
                  Generer delbar lenke
                </Button>
              )}
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </>
  );
}
