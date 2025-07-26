
"use client";

import * as React from "react";
import { Calendar as CalendarIcon, Trash2 } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { products as allProducts, addMovement } from "@/lib/mock-data";

type RequestedItem = {
    id: string;
    name: string;
    quantity: number;
    unit: string;
};

export default function ExitPage() {
    const { toast } = useToast();
    const [requestDate, setRequestDate] = React.useState<Date | undefined>(new Date());
    const [requesterName, setRequesterName] = React.useState("");
    const [department, setDepartment] = React.useState("");
    const [purpose, setPurpose] = React.useState("");
    
    const [searchTerm, setSearchTerm] = React.useState("");
    const [quantity, setQuantity] = React.useState(1);
    const [requestedItems, setRequestedItems] = React.useState<RequestedItem[]>([]);
    
    const consumableItems = allProducts.filter(p => p.type === 'consumo');

    const handleAddItem = () => {
        if (!searchTerm.trim()) {
            toast({ title: "Erro", description: "Por favor, busque e selecione um item.", variant: "destructive" });
            return;
        }

        const item = consumableItems.find(i => 
            i.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
            i.code.toLowerCase().includes(searchTerm.toLowerCase())
        );

        if (!item) {
            toast({ title: "Item não encontrado", description: "O item buscado não existe no estoque de consumo.", variant: "destructive" });
            return;
        }

        if (quantity <= 0) {
            toast({ title: "Quantidade inválida", description: "A quantidade deve ser maior que zero.", variant: "destructive" });
            return;
        }

        if (item.quantity < quantity) {
            toast({ title: "Estoque insuficiente", description: `A quantidade solicitada (${quantity}) é maior que a disponível (${item.quantity}).`, variant: "destructive" });
            return;
        }

        setRequestedItems(prev => {
            const existing = prev.find(i => i.id === item.id);
            if (existing) {
                const newQuantity = existing.quantity + quantity;
                if (item.quantity < newQuantity) {
                    toast({ title: "Estoque insuficiente", description: `A quantidade total solicitada (${newQuantity}) é maior que a disponível (${item.quantity}).`, variant: "destructive" });
                    return prev;
                }
                return prev.map(i => i.id === item.id ? { ...i, quantity: newQuantity } : i);
            }
            return [...prev, { id: item.id, name: item.name, quantity, unit: item.unit }];
        });

        setSearchTerm("");
        setQuantity(1);
    };

    const handleRemoveItem = (itemId: string) => {
        setRequestedItems(prev => prev.filter(item => item.id !== itemId));
    };

    const handleFinalizeIssue = () => {
        if (requestedItems.length === 0) {
            toast({ title: "Nenhum item solicitado", description: "Adicione pelo menos um item para registrar a saída.", variant: "destructive" });
            return;
        }
        
        requestedItems.forEach(item => {
            const productIndex = allProducts.findIndex(p => p.id === item.id);
            if (productIndex !== -1) {
                allProducts[productIndex].quantity -= item.quantity;
            }
            addMovement({
                productId: item.id,
                date: new Date().toISOString(),
                type: 'Saída',
                quantity: item.quantity,
                responsible: 'sdpinho29' // Mock user
            });
        });
        
        toast({ title: "Saída Registrada!", description: "A saída de materiais foi registrada com sucesso." });

        // Reset form
        setRequestDate(new Date());
        setRequesterName("");
        setDepartment("");
        setPurpose("");
        setRequestedItems([]);
    };

    return (
        <div className="flex flex-col gap-6">
            <h1 className="text-3xl font-bold tracking-tight">Registrar Saída de Materiais</h1>

            <Tabs defaultValue="consumption" className="w-full">
                <TabsList className="grid w-full grid-cols-2 max-w-md">
                    <TabsTrigger value="consumption">Requisição de Consumo</TabsTrigger>
                    <TabsTrigger value="responsibility">Termo de Responsabilidade</TabsTrigger>
                </TabsList>
                <TabsContent value="consumption">
                    <Card>
                        <CardContent className="pt-6">
                            <div className="space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                    <div className="space-y-2">
                                        <label htmlFor="request-date" className="text-sm font-medium">Data da Solicitação</label>
                                        <Popover>
                                            <PopoverTrigger asChild>
                                                <Button
                                                    id="request-date"
                                                    variant={"outline"}
                                                    className={cn("w-full justify-start text-left font-normal", !requestDate && "text-muted-foreground")}
                                                >
                                                    <CalendarIcon className="mr-2 h-4 w-4" />
                                                    {requestDate ? format(requestDate, "dd/MM/yyyy") : <span>Selecione uma data</span>}
                                                </Button>
                                            </PopoverTrigger>
                                            <PopoverContent className="w-auto p-0">
                                                <Calendar mode="single" selected={requestDate} onSelect={setRequestDate} initialFocus locale={ptBR} />
                                            </PopoverContent>
                                        </Popover>
                                    </div>
                                    <div className="space-y-2">
                                        <label htmlFor="requester-name" className="text-sm font-medium">Nome do Solicitante</label>
                                        <Input id="requester-name" value={requesterName} onChange={e => setRequesterName(e.target.value)} />
                                    </div>
                                    <div className="space-y-2">
                                        <label htmlFor="department" className="text-sm font-medium">Setor/Departamento</label>
                                        <Input id="department" value={department} onChange={e => setDepartment(e.target.value)} />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label htmlFor="purpose" className="text-sm font-medium">Finalidade de Uso</label>
                                    <Textarea id="purpose" value={purpose} onChange={e => setPurpose(e.target.value)} />
                                </div>

                                <Card>
                                    <CardHeader>
                                        <CardTitle>Itens Solicitados</CardTitle>
                                        <div className="flex flex-col md:flex-row items-end gap-2 pt-4">
                                            <div className="flex-1 w-full">
                                                <label htmlFor="search-item" className="text-sm font-medium">Buscar Item de Consumo</label>
                                                <Input 
                                                    id="search-item" 
                                                    placeholder="Digite para buscar..." 
                                                    value={searchTerm} 
                                                    onChange={e => setSearchTerm(e.target.value)}
                                                    list="consumable-items"
                                                />
                                                <datalist id="consumable-items">
                                                    {consumableItems.map(item => <option key={item.id} value={item.name} />)}
                                                </datalist>
                                            </div>
                                            <div className="w-full md:w-24">
                                                <label htmlFor="quantity" className="text-sm font-medium">Qtd.</label>
                                                <Input id="quantity" type="number" value={quantity} onChange={e => setQuantity(Number(e.target.value))} min="1" />
                                            </div>
                                            <Button onClick={handleAddItem} className="w-full md:w-auto">Adicionar</Button>
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
                                                    {requestedItems.length === 0 ? (
                                                        <TableRow>
                                                            <TableCell colSpan={3} className="text-center text-muted-foreground">
                                                                Nenhum item solicitado.
                                                            </TableCell>
                                                        </TableRow>
                                                    ) : (
                                                        requestedItems.map(item => (
                                                            <TableRow key={item.id}>
                                                                <TableCell className="font-medium">{item.name}</TableCell>
                                                                <TableCell className="text-right">{`${item.quantity} ${item.unit}`}</TableCell>
                                                                <TableCell className="text-center">
                                                                    <Button variant="ghost" size="icon" className="text-red-600 hover:bg-red-100" onClick={() => handleRemoveItem(item.id)}>
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
                                <Button size="lg" onClick={handleFinalizeIssue}>
                                    Finalizar Saída
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
                <TabsContent value="responsibility">
                     <Card>
                        <CardHeader>
                            <CardTitle>Termo de Responsabilidade</CardTitle>
                            <CardDescription>
                                Esta funcionalidade ainda será implementada.
                            </CardDescription>
                        </CardHeader>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}

