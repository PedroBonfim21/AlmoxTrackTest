
"use client";

import React from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line,
} from "recharts";
import { format, subDays, parseISO, isValid } from "date-fns";
import { DateRange } from "react-day-picker";
import { ptBR } from "date-fns/locale";
import {
  ArrowDown,
  ArrowUp,
  FileDown,
  Package,
  Warehouse,
  Calendar as CalendarIcon,
  MoveRight,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import type { Product, Movement } from "@/lib/firestore";
import { getProducts, getMovements } from "@/lib/firestore";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";


export default function DashboardPage() {
  const [products, setProducts] = React.useState<Product[]>([]);
  const [allMovements, setAllMovements] = React.useState<Movement[]>([]);
  const [filteredMovements, setFilteredMovements] = React.useState<Movement[]>([]);
  
  const [date, setDate] = React.useState<DateRange | undefined>({
    from: subDays(new Date(), 29),
    to: new Date(),
  });
  const [movementType, setMovementType] = React.useState("all");
  const [materialType, setMaterialType] = React.useState("all");
  const [department, setDepartment] = React.useState("all");
  const [isLoading, setIsLoading] = React.useState(true);
  const { toast } = useToast();

  const fetchData = React.useCallback(async () => {
        setIsLoading(true);
        try {
            const [productsData, movementsData] = await Promise.all([getProducts(), getMovements()]);
            setProducts(productsData);
            setAllMovements(movementsData);
        } catch (error) {
            toast({
                title: "Erro ao Carregar Dados",
                description: "Não foi possível buscar os dados do dashboard.",
                variant: "destructive",
            });
        } finally {
            setIsLoading(false);
        }
    }, [toast]);

    React.useEffect(() => {
        fetchData();
    }, [fetchData]);

  
  const handleApplyFilters = React.useCallback(() => {
    let newFilteredMovements = allMovements;

    // Filter by date
    if (date?.from && date?.to) {
        newFilteredMovements = newFilteredMovements.filter(m => {
            const movementDate = parseISO(m.date);
            if (!isValid(movementDate)) return false;
            // Set time to beginning of the day for `from` and end of the day for `to`
            const fromDate = new Date(date.from!);
            fromDate.setHours(0, 0, 0, 0);
            const toDate = new Date(date.to!);
            toDate.setHours(23, 59, 59, 999);
            return movementDate >= fromDate && movementDate <= toDate;
        });
    }

    // Filter by movement type
    if (movementType !== "all") {
      newFilteredMovements = newFilteredMovements.filter(
        (m) => m.type === movementType
      );
    }

    // Filter by material type
    if (materialType !== "all") {
      const productIds = products
        .filter((p) => p.type === materialType)
        .map((p) => p.id);
      newFilteredMovements = newFilteredMovements.filter((m) =>
        productIds.includes(m.productId)
      );
    }

    // Filter by department
    if (department !== "all") {
      newFilteredMovements = newFilteredMovements.filter(
        (m) => m.department === department
      );
    }

    setFilteredMovements(newFilteredMovements);
  }, [allMovements, date, movementType, materialType, department, products]);

  // Run on mount and when filters change
  React.useEffect(() => {
    if (!isLoading) {
        handleApplyFilters();
    }
  }, [isLoading, handleApplyFilters]);

  const uniqueDepartments = React.useMemo(() => 
    [...new Set(allMovements.map((m) => m.department).filter(Boolean as any))]
  , [allMovements]);

  const totalMovements = filteredMovements.length;
  const totalEntries = filteredMovements.filter(
    (m) => m.type === "Entrada"
  ).length;
  const totalExits = filteredMovements.filter(
    (m) => m.type === "Saída"
  ).length;

  const mostMovedItem = React.useMemo(() => {
    if (filteredMovements.length === 0 || products.length === 0) return { name: "N/A", count: 0 };
    const counts = filteredMovements.reduce((acc, mov) => {
      acc[mov.productId] = (acc[mov.productId] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    if (Object.keys(counts).length === 0) return { name: "N/A", count: 0 };
    const mostMovedId = Object.keys(counts).reduce((a, b) =>
      counts[a] > counts[b] ? a : b
    );
    const product = products.find((p) => p.id === mostMovedId);
    return { name: product?.name || "Desconhecido", count: counts[mostMovedId] };
  }, [filteredMovements, products]);

  const topSector = React.useMemo(() => {
    if (filteredMovements.length === 0) return { name: "N/A", count: 0 };
    const counts = filteredMovements.reduce((acc, mov) => {
      if (mov.department) {
        acc[mov.department] = (acc[mov.department] || 0) + 1;
      }
      return acc;
    }, {} as Record<string, number>);
    if (Object.keys(counts).length === 0) return { name: "N/A", count: 0 };
    const topSectorName = Object.keys(counts).reduce((a, b) =>
      counts[a] > counts[b] ? a : b
    );
    return { name: topSectorName, count: counts[topSectorName] };
  }, [filteredMovements]);

  const movementsByDay = React.useMemo(() => {
    const dailyData: Record<string, { Entrada: number; Saída: number }> = {};
    filteredMovements.forEach((mov) => {
      if (!isValid(parseISO(mov.date))) return;
      const day = format(parseISO(mov.date), "dd/MM");
      if (!dailyData[day]) {
        dailyData[day] = { Entrada: 0, Saída: 0 };
      }
      if (mov.type === "Entrada") {
        dailyData[day].Entrada += mov.quantity;
      } else if (mov.type === "Saída") {
        dailyData[day].Saída += mov.quantity;
      }
    });
    return Object.entries(dailyData)
      .map(([name, values]) => ({ name, ...values }))
      .sort((a, b) => (parseISO(a.name) > parseISO(b.name) ? 1 : -1));
  }, [filteredMovements]);

  const top10Items = React.useMemo(() => {
    if (filteredMovements.length === 0 || products.length === 0) return [];
    const counts = filteredMovements.reduce((acc, mov) => {
      acc[mov.productId] = (acc[mov.productId] || 0) + mov.quantity;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(counts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([productId, total]) => {
        const product = products.find((p) => p.id === productId);
        return { name: product?.name || "Desconhecido", total };
      });
  }, [filteredMovements, products]);
  
  const handleExport = () => {
        const headers = ["Data", "Tipo", "Produto", "Quantidade", "Responsável", "Departamento"];
        const rows = filteredMovements.map(mov => {
            const product = products.find(p => p.id === mov.productId);
            return [
                isValid(parseISO(mov.date)) ? format(parseISO(mov.date), "dd/MM/yyyy HH:mm") : 'Data Inválida',
                mov.type,
                product?.name || 'N/A',
                mov.quantity,
                mov.responsible,
                mov.department || 'N/A'
            ].join(',');
        });

        const csvContent = "data:text/csv;charset=utf-8," 
            + [headers.join(','), ...rows].join('\n');
            
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `almox_report_${format(new Date(), 'yyyy-MM-dd')}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }

    if (isLoading) {
        return <div className="flex justify-center items-center h-full"><p>Carregando dashboard...</p></div>
    }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Painel de Controle</h1>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={handleExport}>
            <FileDown className="mr-2 h-4 w-4" />
            Exportar CSV
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Filtros Dinâmicos</CardTitle>
          <CardDescription>
            Use os filtros para analisar os dados do inventário.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
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
                        {format(date.from, "LLL dd, y")} -{" "}
                        {format(date.to, "LLL dd, y")}
                      </>
                    ) : (
                      format(date.from, "LLL dd, y")
                    )
                  ) : (
                    <span>Selecione o período</span>
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
                <SelectValue placeholder="Tipo de Movimento" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos Movimentos</SelectItem>
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
                <SelectItem value="all">Todos Tipos</SelectItem>
                <SelectItem value="consumo">Consumo</SelectItem>
                <SelectItem value="permanente">Permanente</SelectItem>
              </SelectContent>
            </Select>
            <Select value={department} onValueChange={setDepartment}>
              <SelectTrigger>
                <SelectValue placeholder="Setor" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos Setores</SelectItem>
                {uniqueDepartments.map((dep) => (
                  <SelectItem key={dep} value={dep}>
                    {dep}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total de Movimentações
            </CardTitle>
            <MoveRight className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalMovements}</div>
            <p className="text-xs text-muted-foreground">
              no período selecionado
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Item Mais Movido</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold truncate">{mostMovedItem.name}</div>
            <p className="text-xs text-muted-foreground">
              {mostMovedItem.count} movimentações
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Setor com Maior Consumo</CardTitle>
            <Warehouse className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{topSector.name}</div>
            <p className="text-xs text-muted-foreground">
              {topSector.count} requisições
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Entradas vs Saídas</CardTitle>
            <MoveRight className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold flex items-center gap-4">
              <span className="flex items-center text-green-600">
                <ArrowUp className="h-5 w-5 mr-1" /> {totalEntries}
              </span>
              <span className="flex items-center text-red-600">
                <ArrowDown className="h-5 w-5 mr-1" /> {totalExits}
              </span>
            </div>
            <p className="text-xs text-muted-foreground">Entradas e saídas no período</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="lg:col-span-4">
          <CardHeader>
            <CardTitle>Movimentações por Dia</CardTitle>
          </CardHeader>
          <CardContent className="pl-2">
            {movementsByDay.length > 0 ? (
                <ResponsiveContainer width="100%" height={350}>
                <LineChart data={movementsByDay}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis
                    dataKey="name"
                    stroke="#888888"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                    />
                    <YAxis
                    stroke="#888888"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(value) => `${value}`}
                    />
                    <Tooltip />
                    <Legend />
                    <Line
                    type="monotone"
                    dataKey="Entrada"
                    stroke="var(--chart-2)"
                    />
                    <Line type="monotone" dataKey="Saída" stroke="var(--chart-5)" />
                </LineChart>
                </ResponsiveContainer>
            ) : (
                <div className="flex h-[350px] w-full items-center justify-center">
                    <p className="text-muted-foreground">Nenhum dado para exibir.</p>
                </div>
            )}
          </CardContent>
        </Card>

        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle>Top 10 Itens Mais Movidos</CardTitle>
            <CardDescription>
              Quantidade total de itens (entrada/saída) no período.
            </CardDescription>
          </CardHeader>
          <CardContent>
             {top10Items.length > 0 ? (
                <ResponsiveContainer width="100%" height={350}>
                <BarChart data={top10Items} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" hide />
                    <YAxis
                    dataKey="name"
                    type="category"
                    width={100}
                    tickLine={false}
                    axisLine={false}
                    fontSize={12}
                    />
                    <Tooltip cursor={{ fill: "hsl(var(--muted))" }} />
                    <Legend />
                    <Bar
                    dataKey="total"
                    name="Total Movido"
                    fill="var(--chart-1)"
                    radius={[0, 4, 4, 0]}
                    />
                </BarChart>
                </ResponsiveContainer>
             ) : (
                <div className="flex h-[350px] w-full items-center justify-center">
                    <p className="text-muted-foreground">Nenhum dado para exibir.</p>
                </div>
             )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
