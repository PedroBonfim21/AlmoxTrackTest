"use client";

import * as React from "react";
import { PlusCircle, Search, Calendar as CalendarIcon, Trash2 } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { DateRange } from "react-day-picker";

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
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
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
import { AddItemSheet } from "../inventory/components/add-item-sheet";
import { AdminAuthDialog } from "./components/admin-auth-dialog";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

// Mock data - replace with actual data fetching
const mockInventoryItems = [
  { id: "1", name: "Caneta Azul", code: "001-25", unit: "und" },
  { id: "2", name: "Caneta Preta", code: "002-25", unit: "und" },
  { id: "3", name: "Papel A4", code: "005-25", unit: "Resma" },
  { id: "4", name: "Quadro", code: "004-25", unit: "und" },
];

type ReceivedItem = {
    id: string;
    name: string;
    quantity: number;
    unit: string;
};

// Mock user role
const currentUserRole = "Operator"; 

export default function EntryPage() {
    const { toast } = useToast();
    const [entryDate, setEntryDate] = React.useState<Date | undefined>(new Date());
    const [supplier, setSupplier] = React.useState("");
    const [invoice, setInvoice] = React.useState("");
    
    const [searchTerm, setSearchTerm] = React.useState("");
    const [searchResults, setSearchResults] = React.useState(mockInventoryItems);
    const [quantity, setQuantity] = React.useState(1);
    const [receivedItems, setReceivedItems] = React.useState<ReceivedItem[]>([]);
    
    const [isAddItemSheetOpen, setIsAddItemSheetOpen] = React.useState(false);
    const [isAuthDialogOpen, setIsAuthDialogOpen] = React.useState(false);
    
    React.useEffect(() => {
        const lowerCaseSearchTerm = searchTerm.toLowerCase();
        const results = mockInventoryItems.filter(item =>
            item.name.toLowerCase().includes(lowerCaseSearchTerm) ||
            item.code.toLowerCase().includes(lowerCaseSearchTerm)
        );
        setSearchResults(results);
    }, [searchTerm]);
    
    const handleSearchOrAddItem = () => {
        if (!searchTerm) return;
        
        const lowerCaseSearchTerm = searchTerm.toLowerCase();
        const existingItem = mockInventoryItems.find(item => 
            item.name.toLowerCase() === lowerCaseSearchTerm || 
            item.code.toLowerCase() === lowerCaseSearchTerm
        );
        
        if (existingItem) {
            handleAddToList(existingItem);
        } else {
            if (currentUserRole === 'Operator') {
                setIsAuthDialogOpen(true);
            } else {
                setIsAddItemSheetOpen(true);
            }
        }
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
        setSearchTerm("");
        setQuantity(1);
    };

    const handleRemoveFromList = (itemId: string) => {
        setReceivedItems(prev => prev.filter(item => item.id !== itemId));
    };

    const handleItemAdded = (newItemData: any) => {
        // This function would typically add the item to the main inventory state/database
        const newItem = {
            id: (mockInventoryItems.length + 1).toString(),
            name: newItemData.name,
            code: newItemData.itemCode || `new-${mockInventoryItems.length + 1}`,
            unit: newItemData.unit,
        };
        mockInventoryItems.push(newItem); // temporary mock update
        toast({
            title: "Item Adicionado!",
            description: `${newItem.name} foi adicionado ao inventário.`,
        });
        // Immediately add it to the current entry list
        handleAddToList(newItem);
    };

    const handleAuthSuccess = () => {
        setIsAuthDialogOpen(false);
        setIsAddItemSheetOpen(true);
    };

    const handleFinalizeEntry = () => {
        if (receivedItems.length === 0) {
            toast({
                title: "Nenhum item adicionado",
                description: "Adicione pelo menos um item para registrar a entrada.",
                variant: "destructive"
            });
            return;
        }
        
        // Logic to save the entry to the database would go here
        
        toast({
            title: "Entrada Registrada!",
            description: "A entrada de materiais foi registrada com sucesso.",
        });

        // Reset form
        setEntryDate(new Date());
        setSupplier("");
        setInvoice("");
        setReceivedItems([]);
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
                                {entryDate ? format(entryDate, "dd/MM/yyyy") : <span>Selecione uma data</span>}
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
                        <div className="flex items-end gap-2 pt-4">
                            <div className="flex-1">
                                <label htmlFor="search-item" className="text-sm font-medium">Buscar Item</label>
                                <Input 
                                    id="search-item" 
                                    placeholder="Digite para buscar por nome ou código..." 
                                    value={searchTerm} 
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    list="inventory-items"
                                />
                                <datalist id="inventory-items">
                                    {searchResults.map(item => <option key={item.id} value={item.name} />)}
                                </datalist>
                            </div>
                            <div className="w-24">
                               <label htmlFor="quantity" className="text-sm font-medium">Qtd.</label>
                               <Input id="quantity" type="number" value={quantity} onChange={e => setQuantity(Number(e.target.value))} min="1" />
                            </div>
                            <Button onClick={handleSearchOrAddItem}>Adicionar</Button>
                        </div>
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
                                                <Button variant="link" className="text-red-600 h-auto p-0" onClick={() => handleRemoveFromList(item.id)}>
                                                  Remover
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
            <Button variant="accent" size="lg" onClick={handleFinalizeEntry}>
                Finalizar Entrada
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
