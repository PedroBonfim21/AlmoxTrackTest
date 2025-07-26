
"use client";

import React from "react";
import { getProducts, getMovements } from "@/lib/firestore"; 

export default function DashboardPage() {
  const [products, setProducts] = React.useState<any[]>([]);
  const [allMovements, setAllMovements] = React.useState<any[]>([]);
  const [filteredMovements, setFilteredMovements] = React.useState<any[]>([]);

  // Fetch initial data
  React.useEffect(() => {
    const fetchData = async () => {
      try {
        const [productsData, movementsData] = await Promise.all([
          getProducts(),
          getMovements(),
        ]);
        setProducts(productsData);
        setAllMovements(movementsData);
        setFilteredMovements(movementsData);
      } catch (error) {
        console.error("Failed to fetch data:", error);
      }
    };
    fetchData();
  }, []);

  const totalMovements = filteredMovements.length;
  const totalEntries = filteredMovements.filter(
    (m) => m.type === "Entrada"
  ).length;
  const totalExits = filteredMovements.filter(
    (m) => m.type === "Saída"
  ).length;

  const mostMovedItem = React.useMemo(() => {
    if (filteredMovements.length === 0 || products.length === 0) {
      return { name: "N/A", count: 0 };
    }

    const counts = filteredMovements.reduce((acc, mov) => {
      acc[mov.productId] = (acc[mov.productId] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    if (Object.keys(counts).length === 0) {
        return { name: "N/A", count: 0 };
    }
      
    const mostMovedId = Object.keys(counts).reduce((a, b) =>
      counts[a] > counts[b] ? a : b
    );
    const product = products.find((p) => p.id === mostMovedId);

    return { name: product?.name || "Desconhecido", count: counts[mostMovedId] };
  }, [filteredMovements, products]);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">
          Painel de Controle
        </h1>
      </div>

      {/* Example metric summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded shadow bg-white">
          <p className="text-sm text-gray-500">Total de Movimentações</p>
          <p className="text-xl font-bold">{totalMovements}</p>
        </div>
        <div className="p-4 rounded shadow bg-white">
          <p className="text-sm text-gray-500">Entradas</p>
          <p className="text-xl font-bold">{totalEntries}</p>
        </div>
        <div className="p-4 rounded shadow bg-white">
          <p className="text-sm text-gray-500">Saídas</p>
          <p className="text-xl font-bold">{totalExits}</p>
        </div>
      </div>

      {/* Most moved item */}
      <div className="p-4 rounded shadow bg-white">
        <p className="text-sm text-gray-500">Item mais movimentado</p>
        <p className="text-lg font-semibold">
          {mostMovedItem.name} ({mostMovedItem.count} movimentações)
        </p>
      </div>

      {/* Future filters and charts can be added here */}
    </div>
  );
}
