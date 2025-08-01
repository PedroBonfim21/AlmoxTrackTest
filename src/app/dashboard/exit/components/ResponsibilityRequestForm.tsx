
"use client";

import * as React from "react";
import { Calendar as CalendarIcon, Trash2 } from "lucide-react";
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
import { Textarea } from "@/components/ui/textarea";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogFooter,
} from "@/components/ui/alert-dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import type { Product } from "@/lib/firestore";
import { finalizeExit } from "@/lib/firestore";
import { ItemSearch } from "../../components/item-search";
import { useAuth } from "@/contexts/AuthContext";

type RequestedItem = {
    id: string;
    name: string;
    quantity: number;
    unit: string;
    patrimony: string;
};

export default function ResponsibilityRequestForm() {
    const { toast } = useToast();
    const [responsibilityDate, setResponsibilityDate] = React.useState<Date | undefined>(undefined);
    const [responsibleName, setResponsibleName] = React.useState("");
    const [responsibleId, setResponsibleId] = React.useState("");
    const [responsibilityDepartment, setResponsibilityDepartment] = React.useState("");
    const [projectDescription, setProjectDescription] = React.useState("");
    const [quantity, setQuantity] = React.useState(1);
    const [requestedItems, setRequestedItems] = React.useState<RequestedItem[]>([]);
    const [selectedItem, setSelectedItem] = React.useState<Product | null>(null);
    const [isConfirmDialogOpen, setIsConfirmDialogOpen] = React.useState(false);
    const [isTermAccepted, setIsTermAccepted] = React.useState(false);
    const [isFinalizing, setIsFinalizing] = React.useState(false);
    const [department, setDepartment] = React.useState("");
    const { user } = useAuth();

    React.useEffect(() => {
        setResponsibilityDate(new Date());
    }, []);

    const handleAddItem = () => {
        if (!selectedItem) {
            toast({ title: "Erro", description: "Por favor, busque e selecione um item.", variant: "destructive" });
            return;
        }

        if (quantity <= 0) {
            toast({ title: "Quantidade inválida", description: "A quantidade deve ser maior que zero.", variant: "destructive" });
            return;
        }

        if (selectedItem.quantity < quantity) {
            toast({ title: "Estoque insuficiente", description: `A quantidade solicitada (${quantity}) é maior que a disponível (${selectedItem.quantity}).`, variant: "destructive" });
            return;
        }

        setRequestedItems((prev) => {
            const existing = prev.find((i) => i.id === selectedItem.id);
            if (existing) {
                const newQuantity = existing.quantity + quantity;
                if (selectedItem.quantity < newQuantity) {
                    toast({ title: "Estoque insuficiente", description: `A quantidade total solicitada (${newQuantity}) é maior que a disponível (${selectedItem.quantity}).`, variant: "destructive" });
                    return prev;
                }
                return prev.map((i) => i.id === selectedItem.id ? { ...i, quantity: newQuantity } : i);
            }
            return [...prev, { id: selectedItem.id, name: selectedItem.name, quantity, unit: selectedItem.unit, patrimony: selectedItem.patrimony }];
        });

        setSelectedItem(null);
        setQuantity(1);
    };

    const handleRemoveItem = (itemId: string) => {
        setRequestedItems(prev => prev.filter(item => item.id !== itemId));
    };
    
    const handleFinalizeResponsibility = () => {
        if (requestedItems.length === 0) {
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

    const handlePrintAndFinalize = async (e: React.MouseEvent<HTMLButtonElement>) => {
        e.preventDefault();
        
        setIsFinalizing(true);
        try {
            await finalizeExit({
                items: requestedItems,
                date: responsibilityDate?.toISOString() || new Date().toISOString(),
                requester: `${responsibleName} (${responsibleId})`,
                department: responsibilityDepartment,
                purpose: projectDescription,
                responsible: user?.email || "Desconhecido",
            });

            toast({ title: "Termo Gerado e Saída Registrada!", description: "A saída de material permanente foi registrada com sucesso." });
            
            setTimeout(() => {
                window.print();
                
                // Reset form after printing
                setIsConfirmDialogOpen(false);
                setResponsibilityDate(new Date());
                setResponsibleName("");
                setResponsibleId("");
                setResponsibilityDepartment("");
                setProjectDescription("");
                setRequestedItems([]);
            }, 100);

        } catch (error: any) {
            toast({
                title: "Erro ao Finalizar Saída",
                description: error.message || "Não foi possível registrar a saída. Tente novamente.",
                variant: "destructive"
            });
        } finally {
            setIsFinalizing(false);
        }
    };

    return (
        <>
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
                                <label htmlFor="responsible-id" className="text-sm font-medium">Matrícula do Responsável</label>
                                <Input id="responsible-id" value={responsibleId} onChange={e => setResponsibleId(e.target.value)} />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <label htmlFor="department" className="text-sm font-medium">Setor/Departamento</label>
                            <Select onValueChange={setDepartment} value={department}>
                                <SelectTrigger id="department">
                                    <SelectValue placeholder="Selecione um setor" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="Transito">Trânsito</SelectItem>
                                    <SelectItem value="Guarda">Guarda</SelectItem>
                                    <SelectItem value="Transporte">Transporte</SelectItem>
                                    <SelectItem value="Administracao">Administração</SelectItem>
                                    <SelectItem value="Financeiro">Financeiro</SelectItem>
                                    <SelectItem value="Limpeza">Limpeza</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <label htmlFor="project-description" className="text-sm font-medium">Descrição de Uso ou Projeto</label>
                            <Textarea id="project-description" value={projectDescription} onChange={e => setProjectDescription(e.target.value)} />
                        </div>

                        <Card>
                            <CardHeader>
                                <CardTitle>Itens Sob Responsabilidade</CardTitle>
                                <div className="flex flex-col md:flex-row items-end gap-2 pt-4">
                                    <ItemSearch onSelectItem={setSelectedItem} materialType="permanente" placeholder="Buscar item permanente..." searchId="responsibility-search" />
                                    <div className="w-full md:w-24">
                                        <label htmlFor="quantity-responsibility" className="text-sm font-medium">Qtd.</label>
                                        <Input id="quantity-responsibility" type="number" value={quantity} onChange={e => setQuantity(Number(e.target.value))} min="1" />
                                    </div>
                                    <Button onClick={handleAddItem} className="w-full md:w-auto">Adicionar</Button>
                                </div>
                                {selectedItem && (
                                    <div className="mt-2 p-2 bg-muted rounded-md text-sm">
                                        Item selecionado: <span className="font-medium">{selectedItem.name}</span> (Disponível: {selectedItem.quantity})
                                    </div>
                                )}
                            </CardHeader>
                            <CardContent>
                                <div className="border rounded-md overflow-x-auto">
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>Item</TableHead>
                                                <TableHead>Nº Patrimônio</TableHead>
                                                <TableHead className="w-[100px] text-right">Qtd</TableHead>
                                                <TableHead className="w-[100px] text-center">Ação</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {requestedItems.length === 0 ? (
                                                <TableRow>
                                                    <TableCell colSpan={4} className="text-center text-muted-foreground">
                                                        Nenhum item adicionado.
                                                    </TableCell>
                                                </TableRow>
                                            ) : (
                                                requestedItems.map(item => (
                                                    <TableRow key={item.id}>
                                                        <TableCell className="font-medium">{item.name}</TableCell>
                                                        <TableCell>{item.patrimony}</TableCell>
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
                        <Button size="lg" onClick={handleFinalizeResponsibility} disabled={isFinalizing || requestedItems.length === 0}>
                            {isFinalizing ? "Finalizando..." : "Gerar Termo e Finalizar"}
                        </Button>
                    </div>
                </CardContent>
            </Card>
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
                                        {requestedItems.map(reqItem => (
                                            <TableRow key={reqItem.id}>
                                                <TableCell>{reqItem.patrimony || 'N/A'}</TableCell>
                                                <TableCell>{reqItem.name}</TableCell>
                                                <TableCell>N/A</TableCell>
                                            </TableRow>
                                        ))}
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
                                <AlertDialogAction onClick={handlePrintAndFinalize} disabled={!isTermAccepted || isFinalizing}>
                                    {isFinalizing ? "Finalizando..." : "Imprimir e Finalizar"}
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
        </>
    );
}

    