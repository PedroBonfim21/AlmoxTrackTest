"use client";

import * as React from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";

import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
  SheetClose,
} from "@/components/ui/sheet";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

const mockMovements = [
    { id: '1', date: '2024-05-20T10:00:00Z', type: 'Entrada', quantity: 50, responsible: 'João Silva' },
    { id: '2', date: '2024-05-21T14:30:00Z', type: 'Saída', quantity: 10, responsible: 'Maria Oliveira' },
    { id: '3', date: '2024-05-22T09:15:00Z', type: 'Saída', quantity: 5, responsible: 'Carlos Pereira' },
    { id: '4', date: '2024-05-23T11:00:00Z', type: 'Entrada', quantity: 20, responsible: 'João Silva' },
    { id: '5', date: '2024-05-24T16:45:00Z', type: 'Devolução', quantity: 2, responsible: 'Ana Costa' },
];

const getBadgeVariant = (type: string) => {
    switch (type) {
      case 'Entrada':
        return 'bg-green-100 text-green-800';
      case 'Saída':
        return 'bg-red-100 text-red-800';
      case 'Devolução':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'outline';
    }
  };

interface MovementsSheetProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  item: any; 
}

export function MovementsSheet({ isOpen, onOpenChange, item }: MovementsSheetProps) {
  
  React.useEffect(() => {
    if (!isOpen) {
     // Optional: Reset any state if needed when sheet closes
    }
  }, [isOpen]);

  return (
    <Sheet open={isOpen} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-3xl overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Histórico de Movimentações</SheetTitle>
          <SheetDescription>
            Veja o histórico completo de entradas, saídas e devoluções para o item <span className="font-semibold">{item?.name}</span>.
          </SheetDescription>
        </SheetHeader>
        <div className="py-6">
            <div className="border rounded-md">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Data e Hora</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead className="text-right">Quantidade</TableHead>
                    <TableHead>Operador</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {mockMovements.map((movement) => (
                    <TableRow key={movement.id}>
                      <TableCell>{format(new Date(movement.date), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className={cn(getBadgeVariant(movement.type))}>
                            {movement.type}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right font-medium">{movement.quantity}</TableCell>
                      <TableCell>{movement.responsible}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
        </div>
        <SheetFooter className="pt-4">
          <SheetClose asChild>
            <Button type="button" variant="outline">
              Fechar
            </Button>
          </SheetClose>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
