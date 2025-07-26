"use client";

import * as React from "react";
import Image from "next/image";
import { PlusCircle, Search, History, Edit, MoreHorizontal, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { AddItemSheet } from "./components/add-item-sheet";
import { EditItemSheet } from "./components/edit-item-sheet";
import { useToast } from "@/hooks/use-toast";

const initialProducts = [
  {
    id: "1",
    image: "https://placehold.co/40x40.png",
    name: "Caneta Azul",
    code: "001-25",
    patrimony: "N/A",
    type: "consumo",
    quantity: 82,
    unit: "und",
    category: "Escritório",
  },
  {
    id: "2",
    image: "https://placehold.co/40x40.png",
    name: "Caneta Preta",
    code: "002-25",
    patrimony: "N/A",
    type: "consumo",
    quantity: 63,
    unit: "und",
    category: "Escritório",
  },
  {
    id: "3",
    image: "https://placehold.co/40x40.png",
    name: "Caneta Vermelha",
    code: "003-25",
    patrimony: "N/A",
    type: "consumo",
    quantity: 19,
    unit: "und",
    category: "Escritório",
  },
  {
    id: "4",
    image: "https://placehold.co/40x40.png",
    name: "Papel A4",
    code: "005-25",
    patrimony: "N/A",
    type: "consumo",
    quantity: 11,
    unit: "Resma",
    category: "Escritório",
  },
  {
    id: "5",
    image: "https://placehold.co/40x40.png",
    name: "Quadro",
    code: "004-25",
    patrimony: "123456",
    type: "permanente",
    quantity: 1,
    unit: "und",
    category: "Mobiliário",
  },
];

type Product = typeof initialProducts[0] & { imagePreview?: string };

export default function InventoryPage() {
  const [products, setProducts] = React.useState<Product[]>(initialProducts);
  const [searchTerm, setSearchTerm] = React.useState("");
  const [isAddSheetOpen, setIsAddSheetOpen] = React.useState(false);
  const [isEditSheetOpen, setIsEditSheetOpen] = React.useState(false);
  const [selectedItem, setSelectedItem] = React.useState<any>(null);
  const [itemToDelete, setItemToDelete] = React.useState<any>(null);
  const { toast } = useToast();


  const handleAddItem = React.useCallback((newItemData: any) => {
    const itemCode = newItemData.itemCode?.trim();

    const existingProductIndex = products.findIndex(p => p.code === itemCode);

    if (itemCode && existingProductIndex > -1) {
        setProducts(prevProducts => {
            const newProducts = [...prevProducts];
            const existingProduct = newProducts[existingProductIndex];
            
            existingProduct.quantity += newItemData.initialQuantity;
            
            if (newItemData.image instanceof File) {
                existingProduct.imagePreview = URL.createObjectURL(newItemData.image);
            }
            
            toast({
                title: "Estoque Atualizado!",
                description: `A quantidade de ${existingProduct.name} foi atualizada.`,
            });
            
            return newProducts;
        });
        return;
    }
    
    const newItem: Product = {
        id: (products.length + 1).toString(),
        name: newItemData.name,
        code: itemCode || `00${products.length + 1}-25`,
        patrimony: newItemData.materialType === 'permanente' ? newItemData.patrimony : 'N/A',
        type: newItemData.materialType,
        quantity: newItemData.initialQuantity,
        unit: newItemData.unit,
        category: newItemData.category,
        image: "https://placehold.co/40x40.png"
    };
    
    if (newItemData.image instanceof File) {
        newItem.imagePreview = URL.createObjectURL(newItemData.image);
    }

    setProducts(prevProducts => [...prevProducts, newItem]);
  }, [products, toast]);
  
  const handleUpdateItem = (updatedItemData: any) => {
    setProducts(prevProducts =>
        prevProducts.map(p => {
            if (p.id === selectedItem.id) {
                const updatedProduct: Product = {
                    ...p,
                    name: updatedItemData.name,
                    type: updatedItemData.materialType,
                    code: updatedItemData.itemCode,
                    patrimony: updatedItemData.materialType === 'permanente' ? updatedItemData.patrimony : 'N/A',
                    unit: updatedItemData.unit,
                    quantity: updatedItemData.quantity,
                    category: updatedItemData.category,
                };
                if (updatedItemData.image instanceof File) {
                    updatedProduct.imagePreview = URL.createObjectURL(updatedItemData.image);
                }
                return updatedProduct;
            }
            return p;
        })
    );
  };
  
  const handleDeleteItem = (productId: string) => {
    setProducts(prevProducts => prevProducts.filter(p => p.id !== productId));
    setItemToDelete(null);
  };


  const handleEditClick = (product: any) => {
    setSelectedItem(product);
    setIsEditSheetOpen(true);
  };

  const filteredProducts = products.filter(
    (product) =>
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.code.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <>
      <div className="flex flex-col gap-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Inventário</h1>
            <p className="text-muted-foreground">
              Consulte e gira todos os itens em stock.
            </p>
          </div>
          <Button onClick={() => setIsAddSheetOpen(true)}>
            <PlusCircle className="mr-2" />
            Adicionar Novo Item
          </Button>
        </div>

        <Card>
          <CardHeader>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar item por nome ou código..."
                className="pl-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </CardHeader>
          <CardContent>
            <div className="border rounded-md">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[80px]">Item</TableHead>
                    <TableHead>Nome</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Categoria</TableHead>
                    <TableHead className="text-right">Qtd. em Estoque</TableHead>
                    <TableHead className="w-[100px] text-center">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredProducts.map((product) => (
                    <TableRow key={product.id}>
                      <TableCell>
                        <Image
                          src={product.imagePreview || product.image}
                          alt={product.name}
                          width={40}
                          height={40}
                          className="rounded-md object-cover aspect-square"
                          data-ai-hint="product image"
                        />
                      </TableCell>
                      <TableCell>
                        <div className="font-medium">{product.name}</div>
                        <div className="text-sm text-muted-foreground">
                          Código: {product.code} / Patrimônio: {product.patrimony}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={product.type === 'permanente' ? 'secondary' : 'outline'}>
                          {product.type}
                        </Badge>
                      </TableCell>
                      <TableCell>{product.category}</TableCell>
                      <TableCell className="text-right">
                        <div className="font-medium">{product.quantity}</div>
                        <div className="text-sm text-muted-foreground">{product.unit}</div>
                      </TableCell>
                      <TableCell className="text-center">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button aria-haspopup="true" size="icon" variant="ghost">
                              <MoreHorizontal className="h-4 w-4" />
                              <span className="sr-only">Toggle menu</span>
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem>
                              <History className="mr-2 h-4 w-4" />
                              <span>Ver Movimentações</span>
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleEditClick(product)}>
                              <Edit className="mr-2 h-4 w-4" />
                              <span>Editar Item</span>
                            </DropdownMenuItem>
                             <DropdownMenuSeparator />
                            <DropdownMenuItem className="text-red-600" onClick={() => setItemToDelete(product)}>
                              <Trash2 className="mr-2 h-4 w-4" />
                              <span>Excluir</span>
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
      <AddItemSheet 
        isOpen={isAddSheetOpen}
        onOpenChange={setIsAddSheetOpen}
        onItemAdded={handleAddItem}
      />
      {selectedItem && (
        <EditItemSheet
          isOpen={isEditSheetOpen}
          onOpenChange={setIsEditSheetOpen}
          onItemUpdated={handleUpdateItem}
          item={selectedItem}
        />
      )}
       {itemToDelete && (
        <AlertDialog open={!!itemToDelete} onOpenChange={() => setItemToDelete(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Você tem certeza?</AlertDialogTitle>
              <AlertDialogDescription>
                Essa ação não pode ser desfeita. Isso excluirá permanentemente o item
                 <span className="font-semibold"> {itemToDelete.name} </span>
                 do inventário.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => handleDeleteItem(itemToDelete.id)}
                className="bg-red-600 hover:bg-red-700"
              >
                Sim, excluir
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </>
  );
}
