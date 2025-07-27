
"use client";

import * as React from "react";
import { Calendar as CalendarIcon, Trash2, PlusCircle } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

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
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { AddItemSheet } from "../inventory/components/add-item-sheet";
import { AdminAuthDialog } from "./components/admin-auth-dialog";
import { ItemSearch } from "../components/item-search";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import type { Product } from "@/lib/firestore";
import { addProduct, finalizeEntry, uploadImage, addMovement } from "@/lib/firestore";

type ReceivedItem = {
    id: string;
    name: string;
    quantity: number;
    unit: string;
};

export default function EntryPage() {
    const { toast } = useToast();
    const [entryDate, setEntryDate] = React.useState<Date | undefined>(undefined);
    const [supplier, setSupplier] = React.useState("");
    const [invoice, setInvoice] = React.useState("");
    
    const [quantity, setQuantity] = React.useState(1);
    const [receivedItems, setReceivedItems] = React.useState<ReceivedItem[]>([]);
    
    const [isAddItemSheetOpen, setIsAddItemSheetOpen] = React.useState(false);
    const [isAuthDialogOpen, setIsAuthDialogOpen] = React.useState(false);
    const [isLoading, setIsLoading] = React.useState(false);
    const [isFinalizing, setIsFinalizing] = React.useState(false);
    const [selectedItemForAddition, setSelectedItemForAddition] = React.useState<Product | null>(null);

    React.useEffect(() => {
        setEntryDate(new Date());
    }, []);
    
    const handleSelectSearchItem = (item: Product) => {
        setSelectedItemForAddition(item);
    }
    
    const handleSearchOrAddItem = async () => {
        if (!selectedItemForAddition) {
             toast({
                title: "Nenhum item selecionado",
                description: "Por favor, busque e selecione um item da lista.",
                variant: "destructive",
            });
            return;
        };
        
        handleAddToList(selectedItemForAddition);
        setSelectedItemForAddition(null); // Reset after adding
    };
    
    const handleAddToList = (item: { id: string; name: string; unit: string; }) => {
        if (quantity <= 0) {
            toast({
                title: "Quantidade inválida",
                description: "Por favor, insira uma quantidade maior que zero.",
                variant: "destructive",
            });
            return;
        }

        setReceivedItems(prev => {
            const existing = prev.find(i => i.id === item.id);
            if (existing) {
                return prev.map(i => i.id === item.id ? { ...i, quantity: i.quantity + quantity } : i);
            }
            return [...prev, { id: item.id, name: item.name, quantity, unit: item.unit }];
        });
        setQuantity(1);
    };

    const handleRemoveFromList = (itemId: string) => {
        setReceivedItems(prev => prev.filter(item => item.id !== itemId));
    };

    const handleItemAdded = async (newItemData: any) => {
        setIsLoading(true);
        try {
            let imageUrl = "https://placehold.co/40x40.png";
            if (newItemData.image) {
                imageUrl = await uploadImage(newItemData.image);
            }

            const newProductData: Omit<Product, 'id'> = {
                name: newItemData.name,
                name_lowercase: newItemData.name.toLowerCase(),
                code: newItemData.itemCode || `new-${Date.now()}`,
                unit: newItemData.unit,
                patrimony: newItemData.materialType === 'permanente' ? newItemData.patrimony : 'N/A',
                type: newItemData.materialType,
                quantity: 0, // Initial quantity is 0, entry will update it
                category: newItemData.category,
                image: imageUrl,
            };
            
            const newProductId = await addProduct(newProductData);
            
            if(newItemData.initialQuantity > 0) {
                await addMovement({
                    productId: newProductId,
                    date: new Date().toISOString(),
                    type: 'Entrada',
                    quantity: newItemData.initialQuantity,
                    responsible: 'Sistema' // Or a logged in user
                });
            }

            toast({
                title: "Item Adicionado!",
                description: `${newProductData.name} foi adicionado ao inventário.`,
            });
            
            // If the item had an initial quantity, add it directly to the received list
            if (newItemData.initialQuantity > 0) {
                setReceivedItems(prev => [...prev, {
                    id: newProductId,
                    name: newProductData.name,
                    quantity: newItemData.initialQuantity,
                    unit: newProductData.unit
                }]);
            }
        } catch (error) {
             toast({
                title: "Erro ao Adicionar Item",
                description: "Não foi possível adicionar o novo item.",
                variant: "destructive",
            });
        } finally {
            setIsLoading(false);
        }
    };

    const handleAuthSuccess = () => {
        setIsAuthDialogOpen(false);
        setIsAddItemSheetOpen(true);
    };
    
    const handleRegisterNewItemClick = () => {
        setIsAuthDialogOpen(true);
    }

    const handleFinalizeEntry = async () => {
        if (receivedItems.length === 0) {
            toast({
                title: "Nenhum item adicionado",
                description: "Adicione pelo menos um item para registrar a entrada.",
                variant: "destructive"
            });
            return;
        }
        if (!supplier || !invoice) {
            toast({
                title: "Campos obrigatórios",
                description: "Preencha o fornecedor e a nota fiscal/processo.",
                variant: "destructive"
            });
            return;
        }
        
        setIsFinalizing(true);
        try {
            await finalizeEntry({
                items: receivedItems,
                date: entryDate?.toISOString() || new Date().toISOString(),
                supplier: supplier,
                invoice: invoice,
                responsible: 'sdpinho29' // Mock responsible user
            });
            
            toast({
                title: "Entrada Registrada!",
                description: "A entrada de materiais foi registrada com sucesso.",
            });

            // Reset form
            setEntryDate(new Date());
            setSupplier("");
            setInvoice("");
            setReceivedItems([]);
        } catch (error) {
             toast({
                title: "Erro ao Finalizar Entrada",
                description: "Não foi possível registrar a entrada. Tente novamente.",
                variant: "destructive"
            });
        } finally {
            setIsFinalizing(false);
        }
    };

  return (
    <>
      <div className="flex flex-col gap-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Registrar Entrada de Materiais</h1>
            <p className="text-muted-foreground">
              Preencha os dados da nota fiscal e adicione os itens recebidos.
            </p>
          </div>
        </div>

        <Card>
            <CardHeader>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                     <div className="space-y-2">
                        <label htmlFor="entry-date" className="text-sm font-medium">Data da Entrada</label>
                        <Popover>
                            <PopoverTrigger asChild>
                            <Button
                                id="entry-date"
                                variant={"outline"}
                                className={cn(
                                "w-full justify-start text-left font-normal",
                                !entryDate && "text-muted-foreground"
                                )}
                            >
                                <CalendarIcon className="mr-2 h-4 w-4" />
                                {entryDate ? format(entryDate, "dd/MM/yyyy", { locale: ptBR }) : <span>Selecione uma data</span>}
                            </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0">
                                <Calendar
                                    mode="single"
                                    selected={entryDate}
                                    onSelect={setEntryDate}
                                    initialFocus
                                    locale={ptBR}
                                />
                            </PopoverContent>
                        </Popover>
                     </div>
                     <div className="space-y-2">
                        <label htmlFor="supplier" className="text-sm font-medium">Fornecedor</label>
                        <Input id="supplier" placeholder="Ex: Bic" value={supplier} onChange={e => setSupplier(e.target.value)} />
                     </div>
                     <div className="space-y-2">
                        <label htmlFor="invoice" className="text-sm font-medium">Nota Fiscal / Processo</label>
                        <Input id="invoice" placeholder="Ex: NF-e 456156451345" value={invoice} onChange={e => setInvoice(e.target.value)} />
                     </div>
                </div>
            </CardHeader>
            <CardContent>
                <Card>
                    <CardHeader>
                        <CardTitle>Itens Recebidos</CardTitle>
                        <div className="flex flex-col md:flex-row items-end gap-2 pt-4">
                            <ItemSearch 
                                onSelectItem={handleSelectSearchItem} 
                                searchId="entry-item-search"
                                onRegisterNewItem={handleRegisterNewItemClick}
                            />
                            <div className="w-full md:w-24">
                               <label htmlFor="quantity" className="text-sm font-medium">Qtd.</label>
                               <Input id="quantity" type="number" value={quantity} onChange={e => setQuantity(Number(e.target.value))} min="1" />
                            </div>
                            <Button onClick={handleSearchOrAddItem} className="w-full md:w-auto">Adicionar</Button>
                        </div>
                        {selectedItemForAddition && (
                            <div className="mt-2 p-2 bg-muted rounded-md text-sm">
                                Item selecionado: <span className="font-medium">{selectedItemForAddition.name}</span>
                            </div>
                        )}
                    </CardHeader>
                    <CardContent>
                         <div className="border rounded-md overflow-x-auto">
                            <Table>
                                <TableHeader>
                                <TableRow>
                                    <TableHead>Item</TableHead>
                                    <TableHead className="w-[100px] text-right">Qtd</TableHead>
                                    <TableHead className="w-[100px] text-center">Ação</TableHead>
                                </TableRow>
                                </TableHeader>
                                <TableBody>
                                 {receivedItems.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={3} className="text-center text-muted-foreground">
                                            Nenhum item adicionado à entrada.
                                        </TableCell>
                                    </TableRow>
                                 ) : (
                                    receivedItems.map((item) => (
                                        <TableRow key={item.id}>
                                            <TableCell className="font-medium">{item.name}</TableCell>
                                            <TableCell className="text-right">{`${item.quantity} ${item.unit}`}</TableCell>
                                            <TableCell className="text-center">
                                                <Button variant="ghost" size="icon" className="text-red-600 hover:bg-red-100 h-auto p-0" onClick={() => handleRemoveFromList(item.id)}>
                                                  <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                 )}
                                </TableBody>
                            </Table>
                         </div>
                    </CardContent>
                </Card>
            </CardContent>
        </Card>
         <div className="flex justify-end">
            <Button variant="accent" size="lg" onClick={handleFinalizeEntry} disabled={isFinalizing}>
                {isFinalizing ? "Finalizando..." : "Finalizar Entrada"}
            </Button>
        </div>
      </div>
      <AddItemSheet 
        isOpen={isAddItemSheetOpen}
        onOpenChange={setIsAddItemSheetOpen}
        onItemAdded={handleItemAdded}
      />
      <AdminAuthDialog
        isOpen={isAuthDialogOpen}
        onOpenChange={setIsAuthDialogOpen}
        onAuthSuccess={handleAuthSuccess}
      />
    </>
  );
}

    