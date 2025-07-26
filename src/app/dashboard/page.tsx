"use client";

import * as React from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { DateRange } from "react-day-picker";
import { Calendar as CalendarIcon, FileDown, ArrowUpRight, ArrowDownLeft, Package, Building, BarChartHorizontal } from "lucide-react";
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip, Legend, CartesianGrid, LineChart, Line } from "recharts";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { products, movements as allMovements } from "@/lib/mock-data";

const COLORS = ["#4553a4", "#00acad", "#ffc20e"];

export default function DashboardPage() {
    // Filter states
    const [date, setDate] = React.useState<DateRange | undefined>({
        from: new Date(new Date().setMonth(new Date().getMonth() - 1)),
        to: new Date(),
    });
    const [movementType, setMovementType] = React.useState("all");
    const [materialType, setMaterialType] = React.useState("all");

    // Data state
    const [filteredMovements, setFilteredMovements] = React.useState(allMovements);
    
    const handleApplyFilters = () => {
        let newFilteredMovements = allMovements;

        // Date filter
        if (date?.from && date?.to) {
            newFilteredMovements = newFilteredMovements.filter(m => {
                const movementDate = new Date(m.date);
                return movementDate >= date.from! && movementDate <= date.to!;
            });
        }
        
        // Movement type filter
        if (movementType !== 'all') {
            newFilteredMovements = newFilteredMovements.filter(m => m.type === movementType);
        }

        // Material type filter
        if (materialType !== 'all') {
            const productIds = products.filter(p => p.type === materialType).map(p => p.id);
            newFilteredMovements = newFilteredMovements.filter(m => productIds.includes(m.productId));
        }
        
        setFilteredMovements(newFilteredMovements);
    };

    React.useEffect(() => {
        // Initial data load based on default filters
        handleApplyFilters();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const totalMovements = filteredMovements.length;
    const totalEntries = filteredMovements.filter(m => m.type === 'Entrada').length;
    const totalExits = filteredMovements.filter(m => m.type === 'Saída').length;

    const mostMovedItem = React.useMemo(() => {
        if (filteredMovements.length === 0) return { name: 'N/A', count: 0 };
        const counts = filteredMovements.reduce((acc, mov) => {
            acc[mov.productId] = (acc[mov.productId] || 0) + 1;
            return acc;
        }, {} as Record<string, number>);
        
        if (Object.keys(counts).length === 0) return { name: 'N/A', count: 0 };
        const mostMovedId = Object.keys(counts).reduce((a, b) => counts[a] > counts[b] ? a : b);
        const product = products.find(p => p.id === mostMovedId);
        return { name: product?.name || 'N/A', count: counts[mostMovedId] };
    }, [filteredMovements]);

    const topSector = React.useMemo(() => {
        const exitMovements = filteredMovements.filter(m => m.type === 'Saída' && m.department);
        if (exitMovements.length === 0) return { name: 'N/A', count: 0 };
        const counts = exitMovements.reduce((acc, mov) => {
            acc[mov.department!] = (acc[mov.department!] || 0) + 1;
            return acc;
        }, {} as Record<string, number>);
        
        if (Object.keys(counts).length === 0) return { name: 'N/A', count: 0 };
        const topSectorName = Object.keys(counts).reduce((a, b) => counts[a] > counts[b] ? a : b);
        return { name: topSectorName, count: counts[topSectorName] };
    }, [filteredMovements]);

    const movementsByDay = React.useMemo(() => {
        const sortedMovements = [...filteredMovements].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
        const byDay = sortedMovements.reduce((acc, mov) => {
            const day = format(new Date(mov.date), 'dd/MM');
            if (!acc[day]) {
                acc[day] = { date: day, Entrada: 0, Saída: 0, Devolução: 0 };
            }
            if(mov.type === 'Entrada' || mov.type === 'Saída' || mov.type === 'Devolução') {
              acc[day][mov.type]++;
            }
            return acc;
        }, {} as Record<string, { date: string, Entrada: number, Saída: number, Devolução: number }>);
        return Object.values(byDay);
    }, [filteredMovements]);

    const top10Items = React.useMemo(() => {
        const counts = filteredMovements.reduce((acc, mov) => {
            acc[mov.productId] = (acc[mov.productId] || 0) + 1;
            return acc;
        }, {} as Record<string, number>);

        return Object.entries(counts)
            .map(([productId, count]) => ({
                name: products.find(p => p.id === productId)?.name || 'Desconhecido',
                count,
            }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 10);
    }, [filteredMovements]);
    
    const handleExport = () => {
        let csvContent = "data:text/csv;charset=utf-8,";
        csvContent += "Data,Produto,Tipo,Quantidade,Responsavel,Setor\n"; // Header

        filteredMovements.forEach(movement => {
            const product = products.find(p => p.id === movement.productId);
            const row = [
                format(new Date(movement.date), "yyyy-MM-dd"),
                product?.name || 'N/A',
                movement.type,
                movement.quantity,
                movement.responsible,
                movement.department || 'N/A'
            ].join(",");
            csvContent += row + "\n";
        });

        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", "relatorio_movimentacoes.csv");
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };


  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">
          Painel de Controle
        </h1>
         <Button variant="outline" className="w-full sm:w-auto" onClick={handleExport}>
            <FileDown className="mr-2 h-4 w-4" />
            Exportar para CSV
        </Button>
      </div>

       <Card>
        <CardHeader>
          <CardTitle>Filtros</CardTitle>
          <CardDescription>
            Use os filtros para analisar os dados de movimentações.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            <Popover>
                <PopoverTrigger asChild>
                <Button
                    id="date"
                    variant={"outline"}
                    className={cn(
                    "w-full justify-start text-left font-normal",
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
                    <span>Selecione um período</span>
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
            <Select value={movementType} onValueChange={setMovementType}>
                <SelectTrigger>
                    <SelectValue placeholder="Tipo de Movimentação" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    <SelectItem value="Entrada">Entrada</SelectItem>
                    <SelectItem value="Saída">Saída</SelectItem>
                    <SelectItem value="Devolução">Devolução</SelectItem>
                </SelectContent>
            </Select>
            <Select value={materialType} onValueChange={setMaterialType}>
                <SelectTrigger>
                    <SelectValue placeholder="Tipo de Material" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    <SelectItem value="consumo">Consumo</SelectItem>
                    <SelectItem value="permanente">Permanente</SelectItem>
                </SelectContent>
            </Select>
            <Button onClick={handleApplyFilters}>Aplicar Filtros</Button>
        </CardContent>
      </Card>
      
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Movimentações</CardTitle>
            <BarChartHorizontal className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalMovements}</div>
            <p className="text-xs text-muted-foreground">No período selecionado</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Item Mais Movimentado</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold truncate" title={mostMovedItem.name}>{mostMovedItem.name}</div>
            <p className="text-xs text-muted-foreground">{mostMovedItem.count} movimentações</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Setor com Maior Consumo</CardTitle>
            <Building className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{topSector.name}</div>
            <p className="text-xs text-muted-foreground">{topSector.count} requisições</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Entradas vs Saídas</CardTitle>
          </CardHeader>
          <CardContent className="flex items-center justify-center gap-4">
              <div className="flex items-center gap-2">
                <ArrowUpRight className="h-6 w-6 text-green-500" />
                <div className="text-xl font-bold">{totalEntries}</div>
              </div>
              <div className="flex items-center gap-2">
                <ArrowDownLeft className="h-6 w-6 text-red-500" />
                <div className="text-xl font-bold">{totalExits}</div>
              </div>
          </CardContent>
        </Card>
      </div>

     <div className="grid gap-6 md:grid-cols-2">
        <Card>
            <CardHeader>
                <CardTitle>Movimentações por Dia</CardTitle>
                <CardDescription>Evolução de entradas e saídas no período.</CardDescription>
            </CardHeader>
            <CardContent>
              {movementsByDay.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={movementsByDay}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="date" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Line type="monotone" dataKey="Entrada" stroke={COLORS[1]} />
                        <Line type="monotone" dataKey="Saída" stroke={COLORS[0]} />
                    </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex h-[300px] w-full items-center justify-center text-muted-foreground">
                    Nenhum dado para exibir.
                </div>
              )}
            </CardContent>
        </Card>
        <Card>
            <CardHeader>
                <CardTitle>Top 10 Itens Mais Movimentados</CardTitle>
                <CardDescription>Itens com maior volume de entradas e saídas.</CardDescription>
            </CardHeader>
            <CardContent>
                 {top10Items.length > 0 ? (
                    <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={top10Items} layout="vertical" margin={{ left: 20 }}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis type="number" />
                            <YAxis dataKey="name" type="category" width={120} tick={{ fontSize: 12 }} interval={0} />
                            <Tooltip />
                            <Legend />
                            <Bar dataKey="count" fill={COLORS[0]} name="Movimentações"/>
                        </BarChart>
                    </ResponsiveContainer>
                 ) : (
                    <div className="flex h-[300px] w-full items-center justify-center text-muted-foreground">
                        Nenhum dado para exibir.
                    </div>
                 )}
            </CardContent>
        </Card>
     </div>
    </div>
  );
}
