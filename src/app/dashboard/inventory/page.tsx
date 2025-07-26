
"use client";

import * as React from "react";
import Image from "next/image";
import { PlusCircle, Search, History, Edit, MoreHorizontal, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
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
import { MovementsSheet } from "./components/movements-sheet";
import { useToast } from "@/hooks/use-toast";
import { Product, getProducts, addProduct, updateProduct, deleteProduct, addMovement } from "@/lib/firestore";
import { movements as allMovements } from "@/lib/mock-data";


export default function InventoryPage() {
  const [products, setProducts] = React.useState<Product[]>([]);
  const [searchTerm, setSearchTerm] = React.useState("");
  const [isAddSheetOpen, setIsAddSheetOpen] = React.useState(false);
  const [isEditSheetOpen, setIsEditSheetOpen] = React.useState(false);
  const [isMovementsSheetOpen, setIsMovementsSheetOpen] = React.useState(false);
  const [selectedItem, setSelectedItem] = React.useState<Product | null>(null);
  const [itemToDelete, setItemToDelete] = React.useState<Product | null>(null);
  const { toast } = useToast();

  React.useEffect(() => {
    const fetchProducts = async () => {
        const productsFromDb = await getProducts();
        setProducts(productsFromDb);
    };
    fetchProducts();
  }, []);


  const handleAddItem = React.useCallback(async (newItemData: any) => {
    const itemCode = newItemData.itemCode?.trim();
    
    // In a real app with a backend, this logic would be more robust.
    // For now, we simulate checking if an item with the same code exists.
    if (itemCode) {
      const existingProduct = products.find(p => p.code === itemCode);
      if (existingProduct && existingProduct.id) {
          const updatedQuantity = existingProduct.quantity + newItemData.initialQuantity;
          await updateProduct(existingProduct.id, { quantity: updatedQuantity });
          
          setProducts(prevProducts => prevProducts.map(p => p.id === existingProduct.id ? {...p, quantity: updatedQuantity} : p));

          toast({
              title: "Estoque Atualizado!",
              description: `A quantidade de ${existingProduct.name} foi atualizada.`,
          });
          return;
      }
    }
    
    const newItem: Omit<Product, 'id'> = {
        name: newItemData.name,
        code: itemCode || `00${products.length + 1}-25`,
        patrimony: newItemData.materialType === 'permanente' ? newItemData.patrimony : 'N/A',
        type: newItemData.materialType,
        quantity: newItemData.initialQuantity,
        unit: newItemData.unit,
        category: newItemData.category,
        image: "https://placehold.co/40x40.png"
    };

    const newProductId = await addProduct(newItem);
    setProducts(prevProducts => [...prevProducts, { id: newProductId, ...newItem }]);

  }, [products, toast]);
  
  const handleUpdateItem = async (updatedItemData: any) => {
    if (!selectedItem || !selectedItem.id) return;

    const updatedProductData = {
        name: updatedItemData.name,
        type: updatedItemData.materialType,
        code: updatedItemData.itemCode,
        patrimony: updatedItemData.materialType === 'permanente' ? updatedItemData.patrimony : 'N/A',
        unit: updatedItemData.unit,
        quantity: updatedItemData.quantity,
        category: updatedItemData.category,
        // Image update logic would go here if we were handling uploads
    };

    await updateProduct(selectedItem.id, updatedProductData);
    
    setProducts(prevProducts =>
        prevProducts.map(p => 
            p.id === selectedItem.id ? { ...p, ...updatedProductData } : p
        )
    );
     toast({
      title: "Item Atualizado!",
      description: `${updatedItemData.name} foi atualizado com sucesso.`,
    });
  };
  
  const handleDeleteItem = async (productId: string) => {
    await deleteProduct(productId);
    setProducts(prevProducts => prevProducts.filter(p => p.id !== productId));
    setItemToDelete(null);
    toast({
        title: "Item Excluído!",
        description: "O item foi removido do inventário.",
    });
  };


  const handleEditClick = (product: Product) => {
    setSelectedItem(product);
    setIsEditSheetOpen(true);
  };

  const handleMovementsClick = (product: Product) => {
    setSelectedItem(product);
    setIsMovementsSheetOpen(true);
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
              Consulte e gerencie todos os itens em estoque.
            </p>
          </div>
          <Button onClick={() => setIsAddSheetOpen(true)} className="w-full sm:w-auto">
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
            <div className="border rounded-md overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[80px]">Item</TableHead>
                    <TableHead>Nome</TableHead>
                    <TableHead className="hidden md:table-cell">Tipo</TableHead>
                    <TableHead className="hidden lg:table-cell">Categoria</TableHead>
                    <TableHead className="text-right">Qtd. em Estoque</TableHead>
                    <TableHead className="w-[100px] text-center">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredProducts.map((product) => (
                    <TableRow key={product.id}>
                      <TableCell>
                        <Image
                          src={product.image || "https://placehold.co/40x40.png"}
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
                          Código: {product.code}
                        </div>
                         <div className="text-sm text-muted-foreground md:hidden">
                          Patrimônio: {product.patrimony}
                        </div>
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        <Badge variant={product.type === 'permanente' ? 'secondary' : 'outline'}>
                          {product.type}
                        </Badge>
                      </TableCell>
                      <TableCell className="hidden lg:table-cell">{product.category}</TableCell>
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
                            <DropdownMenuItem onClick={() => handleMovementsClick(product)}>
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
      {selectedItem && (
        <MovementsSheet
          isOpen={isMovementsSheetOpen}
          onOpenChange={setIsMovementsSheetOpen}
          item={selectedItem}
        />
      )}
       {itemToDelete && itemToDelete.id && (
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
                onClick={() => handleDeleteItem(itemToDelete.id!)}
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
