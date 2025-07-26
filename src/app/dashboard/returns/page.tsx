
"use client";

import * as React from "react";
import { Calendar as CalendarIcon, Trash2 } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import Image from "next/image";

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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import type { Product } from "@/lib/firestore";
import { getProducts, finalizeReturn } from "@/lib/firestore";


type ReturnedItem = {
    id: string;
    name: string;
    quantity: number;
    unit: string;
};

export default function ReturnsPage() {
    const { toast } = useToast();
    const [allProducts, setAllProducts] = React.useState<Product[]>([]);
    const [returnDate, setReturnDate] = React.useState<Date | undefined>(new Date());
    const [returningDepartment, setReturningDepartment] = React.useState("");
    const [returnReason, setReturnReason] = React.useState("");
    const [searchTerm, setSearchTerm] = React.useState("");
    const [quantity, setQuantity] = React.useState(1);
    const [returnedItems, setReturnedItems] = React.useState<ReturnedItem[]>([]);
    const [searchResults, setSearchResults] = React.useState<Product[]>([]);
    const [isSearchOpen, setIsSearchOpen] = React.useState(false);
    const [isLoading, setIsLoading] = React.useState(true);
    const [isFinalizing, setIsFinalizing] = React.useState(false);

    const fetchProducts = React.useCallback(async () => {
        setIsLoading(true);
        const productsFromDb = await getProducts();
        setAllProducts(productsFromDb);
        setIsLoading(false);
    }, []);

    React.useEffect(() => {
        fetchProducts();
    }, [fetchProducts]);

    React.useEffect(() => {
        if (searchTerm.trim()) {
            const results = allProducts.filter(item =>
                item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                item.code.toLowerCase().includes(searchTerm.toLowerCase())
            );
            setSearchResults(results);
            setIsSearchOpen(true);
        } else {
            setSearchResults([]);
            setIsSearchOpen(false);
        }
    }, [searchTerm, allProducts]);

    const handleSelectSearchItem = (item: Product) => {
        setSearchTerm(item.name);
        setIsSearchOpen(false);
    };

    const handleAddToList = () => {
        if (!searchTerm) return;
        
        const item = allProducts.find(p => p.name.toLowerCase() === searchTerm.toLowerCase());

        if (!item) {
             toast({
                title: "Item não encontrado",
                description: "O item buscado não existe no inventário.",
                variant: "destructive"
            });
            return;
        }

        if (quantity <= 0) {
            toast({
                title: "Quantidade inválida",
                description: "Por favor, insira uma quantidade maior que zero.",
                variant: "destructive",
            });
            return;
        }

        setReturnedItems(prev => {
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
        setReturnedItems(prev => prev.filter(item => item.id !== itemId));
    };

    const handleFinalizeReturn = async () => {
        if (returnedItems.length === 0) {
            toast({
                title: "Nenhum item adicionado",
                description: "Adicione pelo menos um item para registrar a devolução.",
                variant: "destructive"
            });
            return;
        }

        if (!returningDepartment || !returnReason) {
            toast({
                title: "Campos obrigatórios",
                description: "Por favor, preencha o setor e o motivo da devolução.",
                variant: "destructive"
            });
            return;
        }

        setIsFinalizing(true);
        try {
            await finalizeReturn({
                items: returnedItems,
                date: returnDate?.toISOString() || new Date().toISOString(),
                department: returningDepartment,
                reason: returnReason,
                responsible: 'sdpinho29' // Mock responsible
            });

            await fetchProducts();

            toast({
                title: "Devolução Registrada!",
                description: "A devolução de materiais foi registrada com sucesso.",
            });

            // Reset form
            setReturnDate(new Date());
            setReturningDepartment("");
            setReturnReason("");
            setReturnedItems([]);
        } catch (error) {
            toast({
                title: "Erro ao Finalizar Devolução",
                description: "Não foi possível registrar a devolução. Tente novamente.",
                variant: "destructive"
            });
        } finally {
            setIsFinalizing(false);
        }
    };

    if (isLoading) {
        return (
            <div className="flex justify-center items-center h-full">
                <p>Carregando dados...</p>
            </div>
        )
    }

    return (
        <div className="flex flex-col gap-6">
            <h1 className="text-3xl font-bold tracking-tight">Registrar Devolução de Materiais</h1>

            <Card>
                <CardContent className="pt-6">
                    <div className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="space-y-2">
                                <label htmlFor="return-date" className="text-sm font-medium">Data da Devolução</label>
                                <Popover>
                                    <PopoverTrigger asChild>
                                        <Button
                                            id="return-date"
                                            variant={"outline"}
                                            className={cn("w-full justify-start text-left font-normal", !returnDate && "text-muted-foreground")}
                                        >
                                            <CalendarIcon className="mr-2 h-4 w-4" />
                                            {returnDate ? format(returnDate, "dd/MM/yyyy") : <span>Selecione uma data</span>}
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-auto p-0">
                                        <Calendar mode="single" selected={returnDate} onSelect={setReturnDate} initialFocus locale={ptBR} />
                                    </PopoverContent>
                                </Popover>
                            </div>
                            <div className="space-y-2">
                                <label htmlFor="returning-department" className="text-sm font-medium">Setor Devolvente</label>
                                <Input id="returning-department" value={returningDepartment} onChange={e => setReturningDepartment(e.target.value)} />
                            </div>
                            <div className="space-y-2">
                                <label htmlFor="return-reason" className="text-sm font-medium">Motivo</label>
                                 <Select value={returnReason} onValueChange={setReturnReason}>
                                    <SelectTrigger id="return-reason">
                                        <SelectValue placeholder="Selecione o motivo" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="unused">Material não utilizado</SelectItem>
                                        <SelectItem value="excess">Material em excesso</SelectItem>
                                        <SelectItem value="defective">Material com defeito</SelectItem>
                                        <SelectItem value="other">Outro</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <Card>
                            <CardHeader>
                                <CardTitle>Itens Devolvidos</CardTitle>
                                <div className="flex flex-col md:flex-row items-end gap-2 pt-4">
                                    <div className="flex-1 w-full relative">
                                        <label htmlFor="search-item" className="text-sm font-medium">Buscar Item</label>
                                        <Input 
                                            id="search-item" 
                                            placeholder="Digite para buscar..." 
                                            value={searchTerm} 
                                            onChange={e => setSearchTerm(e.target.value)}
                                            autoComplete="off"
                                        />
                                        {isSearchOpen && searchResults.length > 0 && (
                                            <div className="absolute z-10 w-full mt-1 bg-background border border-border rounded-md shadow-lg max-h-60 overflow-y-auto">
                                                {searchResults.map(item => (
                                                    <div 
                                                        key={item.id}
                                                        className="flex items-center gap-4 p-2 cursor-pointer hover:bg-muted"
                                                        onClick={() => handleSelectSearchItem(item)}
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
                                    </div>
                                    <div className="w-full md:w-24">
                                        <label htmlFor="quantity" className="text-sm font-medium">Qtd.</label>
                                        <Input id="quantity" type="number" value={quantity} onChange={e => setQuantity(Number(e.target.value))} min="1" />
                                    </div>
                                    <Button onClick={handleAddToList} className="w-full md:w-auto">Adicionar</Button>
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
                                            {returnedItems.length === 0 ? (
                                                <TableRow>
                                                    <TableCell colSpan={3} className="text-center text-muted-foreground">
                                                        Nenhum item adicionado à devolução.
                                                    </TableCell>
                                                </TableRow>
                                            ) : (
                                                returnedItems.map(item => (
                                                    <TableRow key={item.id}>
                                                        <TableCell className="font-medium">{item.name}</TableCell>
                                                        <TableCell className="text-right">{`${item.quantity} ${item.unit}`}</TableCell>
                                                        <TableCell className="text-center">
                                                            <Button variant="ghost" size="icon" className="text-red-600 hover:bg-red-100" onClick={() => handleRemoveFromList(item.id)}>
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
                    </div>
                    <div className="flex justify-end mt-6">
                        <Button 
                            size="lg" 
                            variant="accent" 
                            onClick={handleFinalizeReturn} 
                            disabled={isFinalizing || returnedItems.length === 0}
                        >
                             {isFinalizing ? "Finalizando..." : "Finalizar Devolução"}
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
