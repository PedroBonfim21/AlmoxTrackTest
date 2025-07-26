"use client";

import * as React from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { DateRange } from "react-day-picker";
import { Calendar as CalendarIcon, FileDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

const movements = [
  { date: "2024-05-01", product: "Cimento Votoran 50kg", type: "Entrada", quantity: 100, responsible: "João Silva" },
  { date: "2024-05-02", product: "Tijolo Baiano 9 furos", type: "Saída", quantity: 500, responsible: "Maria Oliveira" },
  { date: "2024-05-03", product: "Areia Média (metro)", type: "Entrada", quantity: 10, responsible: "João Silva" },
  { date: "2024-05-04", product: "Vergalhão 3/8", type: "Saída", quantity: 20, responsible: "Carlos Pereira" },
  { date: "2024-05-05", product: "Cimento Votoran 50kg", type: "Saída", quantity: 30, responsible: "Maria Oliveira" },
  { date: "2024-05-06", product: "Tinta Branca (Lata 18L)", type: "Entrada", quantity: 15, responsible: "João Silva" },
  { date: "2024-05-07", product: "Cano PVC 100mm", type: "Saída", quantity: 40, responsible: "Ana Costa" },
];

export default function DashboardPage() {
  const [date, setDate] = React.useState<DateRange | undefined>(undefined);

  React.useEffect(() => {
    setDate({
      from: new Date(2024, 4, 1),
      to: new Date(),
    });
  }, []);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">
          Painel
        </h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Filtros de Relatório</CardTitle>
          <CardDescription>
            Selecione o período para gerar o relatório de movimentações.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <Popover>
            <PopoverTrigger asChild>
              <Button
                id="date"
                variant={"outline"}
                className={cn(
                  "w-full sm:w-[300px] justify-start text-left font-normal",
                  !date && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {date?.from ? (
                  date.to ? (
                    <>
                      {format(date.from, "P", { locale: ptBR })} -{" "}
                      {format(date.to, "P", { locale: ptBR })}
                    </>
                  ) : (
                    format(date.from, "P", { locale: ptBR })
                  )
                ) : (
                  <span>Selecione uma data</span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                initialFocus
                mode="range"
                defaultMonth={date?.from}
                selected={date}
                onSelect={setDate}
                numberOfMonths={2}
                locale={ptBR}
              />
            </PopoverContent>
          </Popover>
          <Button variant="accent" className="w-full sm:w-auto">
            Gerar Relatório
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between space-x-0 sm:space-x-2 space-y-2 sm:space-y-0">
          <div>
            <CardTitle>Relatório de Movimentações</CardTitle>
            <CardDescription>
              Exibindo as últimas movimentações no período selecionado.
            </CardDescription>
          </div>
           <Button variant="outline" className="w-full sm:w-auto">
            <FileDown className="mr-2 h-4 w-4" />
            Exportar para CSV
          </Button>
        </CardHeader>
        <CardContent>
          <div className="border rounded-md overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[120px]">Data</TableHead>
                  <TableHead>Produto</TableHead>
                  <TableHead className="w-[120px]">Tipo</TableHead>
                  <TableHead className="text-right w-[120px]">Quantidade</TableHead>
                  <TableHead className="w-[180px] hidden md:table-cell">Responsável</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {movements.map((movement, index) => (
                  <TableRow key={index}>
                    <TableCell>{format(new Date(movement.date), "dd/MM/yyyy")}</TableCell>
                    <TableCell className="font-medium">{movement.product}</TableCell>
                    <TableCell>
                      <Badge variant={movement.type === 'Entrada' ? 'secondary' : 'outline'} className={cn(movement.type === 'Entrada' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800')}>
                        {movement.type}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">{movement.quantity}</TableCell>
                    <TableCell className="hidden md:table-cell">{movement.responsible}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
