
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
import type { Product } from "@/lib/firestore";
import { getProducts, addProduct, updateProduct, deleteProduct, addMovement, uploadImage } from "@/lib/firestore";

export default function InventoryPage() {
  const [products, setProducts] = React.useState<Product[]>([]);
  const [searchTerm, setSearchTerm] = React.useState("");
  const [isAddSheetOpen, setIsAddSheetOpen] = React.useState(false);
  const [isEditSheetOpen, setIsEditSheetOpen] = React.useState(false);
  const [isMovementsSheetOpen, setIsMovementsSheetOpen] = React.useState(false);
  const [selectedItem, setSelectedItem] = React.useState<Product | null>(null);
  const [itemToDelete, setItemToDelete] = React.useState<Product | null>(null);
  const { toast } = useToast();
  const [isLoading, setIsLoading] = React.useState(true);

  const fetchProducts = React.useCallback(async (term: string) => {
    setIsLoading(true);
    try {
      const productsFromDb = await getProducts({ searchTerm: term });
      setProducts(productsFromDb);
    } catch (error) {
       toast({
        title: "Erro ao Carregar Produtos",
        description: "Não foi possível buscar os produtos do banco de dados.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  React.useEffect(() => {
    const handler = setTimeout(() => {
      fetchProducts(searchTerm);
    }, 500); // Debounce search

    return () => {
      clearTimeout(handler);
    };
  }, [searchTerm, fetchProducts]);

const handleAddItem = React.useCallback(async (newItemData: {
  name: string;
  unit: string;
  category: string;
  materialType: "permanente" | "consumo";
  initialQuantity: number;
  image?: { base64: string; fileName: string; contentType: string } | undefined;
  itemCode?: string;
  patrimony?: string;
}) => {
  setIsLoading(true);
  try {
    let imageUrl = "https://placehold.co/40x40.png";

    if (newItemData.image) {
      imageUrl = await uploadImage(newItemData.image);
    }

    const itemCode = newItemData.itemCode?.trim() || `new-${Date.now()}`;

    const newProduct: Omit<Product, 'id'> = {
      name: newItemData.name,
      name_lowercase: newItemData.name.toLowerCase(),
      code: itemCode,
      patrimony: newItemData.materialType === 'permanente' ? (newItemData.patrimony ?? '') : 'N/A',
      type: newItemData.materialType,
      quantity: newItemData.initialQuantity || 0,
      unit: newItemData.unit,
      category: newItemData.category,
      image: imageUrl,
    };

    const newProductId = await addProduct(newProduct);
    if (newProduct.quantity > 0) {
      await addMovement({
        productId: newProductId,
        date: new Date().toISOString(),
        type: 'Entrada',
        quantity: newProduct.quantity,
        responsible: 'Sistema'
      });
    }

    toast({
      title: "Item Adicionado!",
      description: `${newProduct.name} foi adicionado ao inventário.`,
    });
    fetchProducts(searchTerm);
  } catch (error) {
    toast({
      title: "Erro ao Adicionar Item",
      description: "Não foi possível adicionar o item. Tente novamente.",
      variant: "destructive"
    });
  } finally {
    setIsLoading(false);
  }
}, [fetchProducts, toast, searchTerm]);
  
const handleUpdateItem = async (updatedItemData: any) => {
  if (!selectedItem) return;
  setIsLoading(true);
  try {
    let imageUrl = selectedItem.image; // 1. Começa assumindo que vamos manter a imagem antiga.

    // 2. VERIFICA SE UMA NOVA IMAGEM FOI ENVIADA.
    // Uma nova imagem será o nosso objeto { base64: "...", ... }, enquanto a antiga é uma string de URL.
    if (updatedItemData.image && typeof updatedItemData.image === 'object') {
      // Se for um objeto, significa que o usuário escolheu um novo arquivo.
      // Então, fazemos o upload.
      imageUrl = await uploadImage(updatedItemData.image);
    }
    // Se 'updatedItemData.image' não for um objeto, ele simplesmente ignora e mantém a URL antiga.

    const updateData: Partial<Product> = {
        name: updatedItemData.name,
        name_lowercase: updatedItemData.name.toLowerCase(),
        type: updatedItemData.materialType,
        code: updatedItemData.itemCode,
        patrimony: updatedItemData.materialType === 'permanente' ? updatedItemData.patrimony : 'N/A',
        unit: updatedItemData.unit,
        quantity: updatedItemData.quantity,
        category: updatedItemData.category,
        image: imageUrl, // 3. Salva a URL correta (a nova ou a antiga mantida).
    };
    
    await updateProduct(selectedItem.id, updateData);
    
    toast({
      title: "Item Atualizado!",
      description: `${updatedItemData.name} foi atualizado com sucesso.`,
    });
    fetchProducts(searchTerm);
  } catch(error) {
     toast({
        title: "Erro ao Atualizar Item",
        description: "Não foi possível atualizar o item. Tente novamente.",
        variant: "destructive"
     });
  } finally {
     setIsLoading(false);
  }
};
  
  const handleDeleteItem = async (productId: string) => {
    setIsLoading(true);
    try {
        await deleteProduct(productId);
        toast({
            title: "Item Excluído!",
            description: "O item foi removido do inventário.",
        });
        fetchProducts(searchTerm); // Refresh the product list
    } catch(error) {
        toast({
            title: "Erro ao Excluir Item",
            description: "Não foi possível excluir o item. Tente novamente.",
            variant: "destructive"
        });
    } finally {
        setItemToDelete(null);
        setIsLoading(false);
    }
  };


  const handleEditClick = (product: Product) => {
    setSelectedItem(product);
    setIsEditSheetOpen(true);
  };

  const handleMovementsClick = (product: Product) => {
    setSelectedItem(product);
    setIsMovementsSheetOpen(true);
  };

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
                  {isLoading ? (
                     <TableRow>
                      <TableCell colSpan={6} className="text-center text-muted-foreground">Carregando inventário...</TableCell>
                    </TableRow>
                  ) : products.length > 0 ? (
                    products.map((product) => (
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
                    ))
                  ) : (
                    <TableRow>
                        <TableCell colSpan={6} className="text-center text-muted-foreground">Nenhum produto encontrado.</TableCell>
                    </TableRow>
                  )}
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
                onClick={() => handleDeleteItem(itemToDelete!.id)}
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
