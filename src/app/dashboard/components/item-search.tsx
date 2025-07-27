
"use client";

import * as React from "react";
import Image from "next/image";
import { Input } from "@/components/ui/input";
import type { Product } from "@/lib/firestore";
import { getProducts } from "@/lib/firestore";
import { useToast } from "@/hooks/use-toast";

interface ItemSearchProps {
  onSelectItem: (item: Product) => void;
  materialType?: 'consumo' | 'permanente';
  placeholder?: string;
  searchId: string;
}

export function ItemSearch({ onSelectItem, materialType, placeholder, searchId }: ItemSearchProps) {
  const [searchTerm, setSearchTerm] = React.useState("");
  const [searchResults, setSearchResults] = React.useState<Product[]>([]);
  const [isSearchOpen, setIsSearchOpen] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(false);
  const { toast } = useToast();
  const searchRef = React.useRef<HTMLDivElement>(null);

  const fetchProducts = React.useCallback(async (term: string) => {
    if (term.length < 2) {
      setSearchResults([]);
      setIsSearchOpen(false);
      return;
    }
    setIsLoading(true);
    try {
      const productsFromDb = await getProducts({ searchTerm: term, materialType });
      setSearchResults(productsFromDb);
      setIsSearchOpen(productsFromDb.length > 0);
    } catch (error) {
      toast({
        title: "Erro ao Buscar Produtos",
        description: "Não foi possível buscar os produtos.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast, materialType]);

  React.useEffect(() => {
    const handler = setTimeout(() => {
      fetchProducts(searchTerm);
    }, 500); // Debounce search

    return () => {
      clearTimeout(handler);
    };
  }, [searchTerm, fetchProducts]);

  const handleSelectItem = (item: Product) => {
    onSelectItem(item);
    setSearchTerm(""); // Clear search term after selection
    setSearchResults([]);
    setIsSearchOpen(false);
  };

  // Close dropdown when clicking outside
  React.useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsSearchOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [searchRef]);


  return (
    <div className="flex-1 w-full relative" ref={searchRef}>
      <label htmlFor={searchId} className="text-sm font-medium">Buscar Item</label>
      <Input
        id={searchId}
        placeholder={placeholder || "Digite para buscar por nome ou código..."}
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        autoComplete="off"
      />
      {isLoading && <div className="absolute z-10 w-full mt-1 bg-background border border-border rounded-md shadow-lg p-2">Carregando...</div>}
      
      {!isLoading && isSearchOpen && searchResults.length > 0 && (
        <div className="absolute z-10 w-full mt-1 bg-background border border-border rounded-md shadow-lg max-h-60 overflow-y-auto">
          {searchResults.map((item) => (
            <div
              key={item.id}
              className="flex items-center gap-4 p-2 cursor-pointer hover:bg-muted"
              onClick={() => handleSelectItem(item)}
            >
              <Image
                src={item.image || "https://placehold.co/40x40.png"}
                alt={item.name}
                width={40}
                height={40}
                className="rounded-md object-cover aspect-square"
              />
              <div>
                <div className="font-medium">{item.name}</div>
                <div className="text-sm text-muted-foreground">{item.code}</div>
              </div>
            </div>
          ))}
        </div>
      )}
       {!isLoading && isSearchOpen && searchResults.length === 0 && searchTerm.length >= 2 && (
         <div className="absolute z-10 w-full mt-1 bg-background border border-border rounded-md shadow-lg p-2 text-center text-sm text-muted-foreground">
            Nenhum item encontrado.
         </div>
       )}
    </div>
  );
}
