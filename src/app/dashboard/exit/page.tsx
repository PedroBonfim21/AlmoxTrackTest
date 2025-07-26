
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
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { products as allProducts, addMovement } from "@/lib/mock-data";

type RequestedItem = {
    id: string;
    name: string;
    quantity: number;
    unit: string;
};

type Product = (typeof allProducts)[0];

export default function ExitPage() {
    const { toast } = useToast();
    const [activeTab, setActiveTab] = React.useState("consumption");

    // State for Consumption Tab
    const [requestDate, setRequestDate] = React.useState<Date | undefined>(new Date());
    const [requesterName, setRequesterName] = React.useState("");
    const [requesterId, setRequesterId] = React.useState("");
    const [department, setDepartment] = React.useState("");
    const [purpose, setPurpose] = React.useState("");
    const [consumptionSearchTerm, setConsumptionSearchTerm] = React.useState("");
    const [consumptionSearchResults, setConsumptionSearchResults] = React.useState<Product[]>([]);
    const [isConsumptionSearchOpen, setIsConsumptionSearchOpen] = React.useState(false);
    const [consumptionQuantity, setConsumptionQuantity] = React.useState(1);
    const [requestedItems, setRequestedItems] = React.useState<RequestedItem[]>([]);

    // State for Responsibility Tab
    const [responsibilityDate, setResponsibilityDate] = React.useState<Date | undefined>(new Date());
    const [responsibleName, setResponsibleName] = React.useState("");
    const [responsibleId, setResponsibleId] = React.useState("");
    const [responsibilityDepartment, setResponsibilityDepartment] = React.useState("");
    const [projectDescription, setProjectDescription] = React.useState("");
    const [responsibilitySearchTerm, setResponsibilitySearchTerm] = React.useState("");
    const [responsibilitySearchResults, setResponsibilitySearchResults] = React.useState<Product[]>([]);
    const [isResponsibilitySearchOpen, setIsResponsibilitySearchOpen] = React.useState(false);
    const [responsibilityQuantity, setResponsibilityQuantity] = React.useState(1);
    const [responsibilityItems, setResponsibilityItems] = React.useState<RequestedItem[]>([]);
    const [isConfirmDialogOpen, setIsConfirmDialogOpen] = React.useState(false);
    const [isTermAccepted, setIsTermAccepted] = React.useState(false);
    
    const consumableItems = allProducts.filter(p => p.type === 'consumo');
    const permanentItems = allProducts.filter(p => p.type === 'permanente');

    React.useEffect(() => {
        if (consumptionSearchTerm.trim()) {
            const results = consumableItems.filter(item =>
                item.name.toLowerCase().includes(consumptionSearchTerm.toLowerCase()) ||
                item.code.toLowerCase().includes(consumptionSearchTerm.toLowerCase())
            );
            setConsumptionSearchResults(results);
            setIsConsumptionSearchOpen(results.length > 0);
        } else {
            setConsumptionSearchResults([]);
            setIsConsumptionSearchOpen(false);
        }
    }, [consumptionSearchTerm]);

     React.useEffect(() => {
        if (responsibilitySearchTerm.trim()) {
            const results = permanentItems.filter(item =>
                item.name.toLowerCase().includes(responsibilitySearchTerm.toLowerCase()) ||
                item.code.toLowerCase().includes(responsibilitySearchTerm.toLowerCase())
            );
            setResponsibilitySearchResults(results);
            setIsResponsibilitySearchOpen(results.length > 0);
        } else {
            setResponsibilitySearchResults([]);
            setIsResponsibilitySearchOpen(false);
        }
    }, [responsibilitySearchTerm]);
    
    const handleSelectSearchItem = (item: Product, type: 'consumption' | 'responsibility') => {
        if (type === 'consumption') {
            setConsumptionSearchTerm(item.name);
            setIsConsumptionSearchOpen(false);
        } else {
            setResponsibilitySearchTerm(item.name);
            setIsResponsibilitySearchOpen(false);
        }
    }


    const handleAddItem = (type: 'consumption' | 'responsibility') => {
        const searchTerm = type === 'consumption' ? consumptionSearchTerm : responsibilitySearchTerm;
        const quantity = type === 'consumption' ? consumptionQuantity : responsibilityQuantity;
        const items = type === 'consumption' ? consumableItems : permanentItems;
        const setRequestedItemsFn = type === 'consumption' ? setRequestedItems : setResponsibilityItems;

        if (!searchTerm.trim()) {
            toast({ title: "Erro", description: "Por favor, busque e selecione um item.", variant: "destructive" });
            return;
        }

        const item = items.find(i => 
            i.name.toLowerCase() === searchTerm.toLowerCase() || 
            i.code.toLowerCase() === searchTerm.toLowerCase()
        );

        if (!item) {
            toast({ title: "Item não encontrado", description: `O item buscado não existe no estoque de ${type === 'consumption' ? 'consumo' : 'permanente'}.`, variant: "destructive" });
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

        setRequestedItemsFn(prev => {
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

        if (type === 'consumption') {
            setConsumptionSearchTerm("");
            setConsumptionQuantity(1);
        } else {
            setResponsibilitySearchTerm("");
            setResponsibilityQuantity(1);
        }
    };

    const handleRemoveItem = (itemId: string, type: 'consumption' | 'responsibility') => {
        const setRequestedItemsFn = type === 'consumption' ? setRequestedItems : setResponsibilityItems;
        setRequestedItemsFn(prev => prev.filter(item => item.id !== itemId));
    };

    const handleFinalizeIssue = () => {
        if (requestedItems.length === 0) {
            toast({ title: "Nenhum item solicitado", description: "Adicione pelo menos um item para registrar a saída.", variant: "destructive" });
            return;
        }

        if (!requesterName || !requesterId || !department) {
            toast({ title: "Campos obrigatórios", description: "Por favor, preencha o nome, matrícula e setor do solicitante.", variant: "destructive" });
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
                responsible: requesterName
            });
        });
        
        toast({ title: "Saída Registrada!", description: "A saída de materiais de consumo foi registrada com sucesso." });

        // Reset form
        setRequestDate(new Date());
        setRequesterName("");
        setRequesterId("");
        setDepartment("");
        setPurpose("");
        setRequestedItems([]);
    };
    
    const handleFinalizeResponsibility = () => {
        if (responsibilityItems.length === 0) {
            toast({ title: "Nenhum item adicionado", description: "Adicione pelo menos um item para gerar o termo.", variant: "destructive" });
            return;
        }
        if (!responsibleName || !responsibleId || !responsibilityDepartment) {
            toast({ title: "Campos obrigatórios", description: "Por favor, preencha o nome, matrícula e setor do responsável.", variant: "destructive" });
            return;
        }
        setIsTermAccepted(false);
        setIsConfirmDialogOpen(true);
    };

    const handlePrintAndFinalize = (e: React.MouseEvent<HTMLButtonElement>) => {
        e.preventDefault();
        // Finalize the stock removal
        responsibilityItems.forEach(item => {
            const productIndex = allProducts.findIndex(p => p.id === item.id);
            if (productIndex !== -1) {
                allProducts[productIndex].quantity -= item.quantity;
            }
            addMovement({
                productId: item.id,
                date: new Date().toISOString(),
                type: 'Saída',
                quantity: item.quantity,
                responsible: responsibleName
            });
        });

        toast({ title: "Termo Gerado e Saída Registrada!", description: "A saída de material permanente foi registrada com sucesso." });
        
        // Trigger browser print dialog
        setTimeout(() => {
            window.print();
            
            // Reset form after printing
            setIsConfirmDialogOpen(false);
            setResponsibilityDate(new Date());
            setResponsibleName("");
            setResponsibleId("");
            setResponsibilityDepartment("");
            setProjectDescription("");
            setResponsibilityItems([]);
        }, 100);
    };

    return (
        <div className="flex flex-col gap-6">
            <h1 className="text-3xl font-bold tracking-tight">Registrar Saída de Materiais</h1>

            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
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
                                        <label htmlFor="requester-id" className="text-sm font-medium">Matrícula do Solicitante</label>
                                        <Input id="requester-id" value={requesterId} onChange={e => setRequesterId(e.target.value)} />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                        <label htmlFor="department" className="text-sm font-medium">Setor/Departamento</label>
                                        <Input id="department" value={department} onChange={e => setDepartment(e.target.value)} />
                                </div>
                                <div className="space-y-2">
                                    <label htmlFor="purpose" className="text-sm font-medium">Finalidade de Uso</label>
                                    <Textarea id="purpose" value={purpose} onChange={e => setPurpose(e.target.value)} />
                                </div>

                                <Card>
                                    <CardHeader>
                                        <CardTitle>Itens Solicitados</CardTitle>
                                        <div className="flex flex-col md:flex-row items-end gap-2 pt-4">
                                            <div className="flex-1 w-full relative">
                                                <label htmlFor="search-item-consumption" className="text-sm font-medium">Buscar Item de Consumo</label>
                                                <Input 
                                                    id="search-item-consumption" 
                                                    placeholder="Digite para buscar..." 
                                                    value={consumptionSearchTerm} 
                                                    onChange={e => setConsumptionSearchTerm(e.target.value)}
                                                    autoComplete="off"
                                                />
                                                {isConsumptionSearchOpen && consumptionSearchResults.length > 0 && (
                                                    <div className="absolute z-10 w-full mt-1 bg-background border border-border rounded-md shadow-lg max-h-60 overflow-y-auto">
                                                        {consumptionSearchResults.map(item => (
                                                            <div 
                                                                key={item.id}
                                                                className="flex items-center gap-4 p-2 cursor-pointer hover:bg-muted"
                                                                onClick={() => handleSelectSearchItem(item, 'consumption')}
                                                            >
                                                                <Image 
                                                                    src={item.image}
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
                                                <label htmlFor="quantity-consumption" className="text-sm font-medium">Qtd.</label>
                                                <Input id="quantity-consumption" type="number" value={consumptionQuantity} onChange={e => setConsumptionQuantity(Number(e.target.value))} min="1" />
                                            </div>
                                            <Button onClick={() => handleAddItem('consumption')} className="w-full md:w-auto">Adicionar</Button>
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
                                                                    <Button variant="ghost" size="icon" className="text-red-600 hover:bg-red-100" onClick={() => handleRemoveItem(item.id, 'consumption')}>
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
                                <Button size="lg" onClick={handleFinalizeIssue} disabled={requestedItems.length === 0}>
                                    Finalizar Saída
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
                <TabsContent value="responsibility">
                     <Card>
                        <CardContent className="pt-6">
                            <div className="space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                    <div className="space-y-2">
                                        <label htmlFor="responsibility-date" className="text-sm font-medium">Data da Solicitação</label>
                                        <Popover>
                                            <PopoverTrigger asChild>
                                                <Button
                                                    id="responsibility-date"
                                                    variant={"outline"}
                                                    className={cn("w-full justify-start text-left font-normal", !responsibilityDate && "text-muted-foreground")}
                                                >
                                                    <CalendarIcon className="mr-2 h-4 w-4" />
                                                    {responsibilityDate ? format(responsibilityDate, "dd/MM/yyyy") : <span>Selecione uma data</span>}
                                                </Button>
                                            </PopoverTrigger>
                                            <PopoverContent className="w-auto p-0">
                                                <Calendar mode="single" selected={responsibilityDate} onSelect={setResponsibilityDate} initialFocus locale={ptBR} />
                                            </PopoverContent>
                                        </Popover>
                                    </div>
                                    <div className="space-y-2">
                                        <label htmlFor="responsible-name" className="text-sm font-medium">Nome do Responsável</label>
                                        <Input id="responsible-name" value={responsibleName} onChange={e => setResponsibleName(e.target.value)} />
                                    </div>
                                    <div className="space-y-2">
                                        <label htmlFor="responsible-id" className="text-sm font-medium">Matrícula</label>
                                        <Input id="responsible-id" value={responsibleId} onChange={e => setResponsibleId(e.target.value)} />
                                    </div>
                                </div>
                                 <div className="space-y-2">
                                    <label htmlFor="responsibility-department" className="text-sm font-medium">Setor/Departamento</label>
                                    <Input id="responsibility-department" value={responsibilityDepartment} onChange={e => setResponsibilityDepartment(e.target.value)} />
                                </div>
                                <div className="space-y-2">
                                    <label htmlFor="project-description" className="text-sm font-medium">Descrição de Uso ou Projeto</label>
                                    <Textarea id="project-description" value={projectDescription} onChange={e => setProjectDescription(e.target.value)} />
                                </div>

                                <Card>
                                    <CardHeader>
                                        <CardTitle>Itens Sob Responsabilidade</CardTitle>
                                        <div className="flex flex-col md:flex-row items-end gap-2 pt-4">
                                            <div className="flex-1 w-full relative">
                                                <label htmlFor="search-item-responsibility" className="text-sm font-medium">Buscar Item Permanente</label>
                                                <Input 
                                                    id="search-item-responsibility" 
                                                    placeholder="Digite para buscar por item permanente..." 
                                                    value={responsibilitySearchTerm} 
                                                    onChange={e => setResponsibilitySearchTerm(e.target.value)}
                                                    autoComplete="off"
                                                />
                                                 {isResponsibilitySearchOpen && responsibilitySearchResults.length > 0 && (
                                                    <div className="absolute z-10 w-full mt-1 bg-background border border-border rounded-md shadow-lg max-h-60 overflow-y-auto">
                                                        {responsibilitySearchResults.map(item => (
                                                            <div 
                                                                key={item.id}
                                                                className="flex items-center gap-4 p-2 cursor-pointer hover:bg-muted"
                                                                onClick={() => handleSelectSearchItem(item, 'responsibility')}
                                                            >
                                                                <Image 
                                                                    src={item.image}
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
                                                <label htmlFor="quantity-responsibility" className="text-sm font-medium">Qtd.</label>
                                                <Input id="quantity-responsibility" type="number" value={responsibilityQuantity} onChange={e => setResponsibilityQuantity(Number(e.target.value))} min="1" />
                                            </div>
                                            <Button onClick={() => handleAddItem('responsibility')} className="w-full md:w-auto">Adicionar</Button>
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
                                                    {responsibilityItems.length === 0 ? (
                                                        <TableRow>
                                                            <TableCell colSpan={3} className="text-center text-muted-foreground">
                                                                Nenhum item adicionado.
                                                            </TableCell>
                                                        </TableRow>
                                                    ) : (
                                                        responsibilityItems.map(item => (
                                                            <TableRow key={item.id}>
                                                                <TableCell className="font-medium">{item.name}</TableCell>
                                                                <TableCell className="text-right">{`${item.quantity} ${item.unit}`}</TableCell>
                                                                <TableCell className="text-center">
                                                                    <Button variant="ghost" size="icon" className="text-red-600 hover:bg-red-100" onClick={() => handleRemoveItem(item.id, 'responsibility')}>
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
                                <Button size="lg" onClick={handleFinalizeResponsibility} disabled={responsibilityItems.length === 0}>
                                    Gerar Termo e Finalizar
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
             <div id="print-container">
                {isConfirmDialogOpen && (
                    <AlertDialog open={isConfirmDialogOpen} onOpenChange={setIsConfirmDialogOpen}>
                        <AlertDialogContent className="max-w-3xl print:max-w-full print:border-none print:shadow-none">
                            <AlertDialogHeader>
                                <AlertDialogTitle className="text-center text-xl font-bold">
                                    TERMO DE RESPONSABILIDADE DE MATERIAIS PERMANENTES
                                </AlertDialogTitle>
                            </AlertDialogHeader>
                            <div className="text-sm text-justify space-y-4 p-4 border rounded-md bg-white print:border-none print:p-0">
                                <p>
                                    Pelo presente termo, eu, <strong>{responsibleName || '[NOME DO SERVIDOR]'}</strong>, matrícula nº <strong>{responsibleId || '[MATRÍCULA]'}</strong>, servidor(a) da Secretaria Municipal de <strong>{responsibilityDepartment || '[NOME DA SECRETARIA]'}</strong>, assumo a responsabilidade pelo recebimento e guarda dos materiais permanentes abaixo descritos, destinados ao uso exclusivo nas atividades institucionais.
                                </p>

                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Nº Patrimonial</TableHead>
                                            <TableHead>Descrição do Bem</TableHead>
                                            <TableHead>Marca/Modelo</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {responsibilityItems.map(reqItem => {
                                            const product = allProducts.find(p => p.id === reqItem.id);
                                            return (
                                                <TableRow key={reqItem.id}>
                                                    <TableCell>{product?.patrimony || 'N/A'}</TableCell>
                                                    <TableCell>{reqItem.name}</TableCell>
                                                    <TableCell>N/A</TableCell>
                                                </TableRow>
                                            );
                                        })}
                                    </TableBody>
                                </Table>

                                <div>
                                    <h3 className="font-semibold mb-2">Declaro estar ciente de que:</h3>
                                    <ul className="list-disc list-inside space-y-1 text-xs">
                                        <li>É vedada a utilização do bem para fins particulares.</li>
                                        <li>Sou responsável pela guarda, conservação e uso adequado.</li>
                                        <li>Em caso de extravio, dano ou mau uso, devo comunicar imediatamente ao setor competente.</li>
                                        <li>Este termo deverá ser renovado em caso de transferência de setor, baixa patrimonial ou substituição do bem.</li>
                                    </ul>
                                </div>

                                <div className="pt-4">
                                    <p>Local e Data: __________, {format(new Date(), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}</p>
                                </div>

                                <div className="flex justify-around pt-12 text-center text-xs">
                                    <div className="border-t w-1/4 pt-2">Assinatura do Responsável pelo Setor</div>
                                    <div className="border-t w-1/4 pt-2">Assinatura do Servidor Responsável</div>
                                    <div className="border-t w-1/4 pt-2">Assinatura do Almoxarife/Patrimônio</div>
                                </div>
                                
                            </div>
                            <div className="flex items-center space-x-2 pt-4 print:hidden">
                                <Checkbox id="terms" checked={isTermAccepted} onCheckedChange={(checked) => setIsTermAccepted(checked as boolean)} />
                                <Label htmlFor="terms" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                                    Declaro que li e concordo com os termos de responsabilidade.
                                </Label>
                             </div>
                            <AlertDialogFooter className="print:hidden">
                                <AlertDialogCancel onClick={() => setIsConfirmDialogOpen(false)}>Sair</AlertDialogCancel>
                                <AlertDialogAction onClick={handlePrintAndFinalize} disabled={!isTermAccepted}>
                                    Imprimir
                                </AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>
                )}
            </div>
            <style jsx global>{`
                @media print {
                    body > *:not(#print-container) {
                        display: none;
                    }
                    #print-container {
                        display: block;
                        position: absolute;
                        left: 0;
                        top: 0;
                        width: 100%;
                    }
                    main {
                        padding: 0 !important;
                        margin: 0 !important;
                    }
                    .print-container-content {
                        padding: 2rem; /* Add some padding for the print layout */
                    }
                }
            `}</style>
        </div>
    );
}
