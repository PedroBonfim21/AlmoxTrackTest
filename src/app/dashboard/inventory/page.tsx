"use client";

import * as React from "react";
import Image from "next/image";
import { PlusCircle, Search, History, Edit, MoreHorizontal } from "lucide-react";

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
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { AddItemSheet } from "./components/add-item-sheet";


const products = [
  {
    id: "1",
    image: "https://placehold.co/40x40.png",
    name: "Caneta Azul",
    code: "001-25",
    patrimony: "N/A",
    type: "consumo",
    quantity: 82,
    unit: "und",
    category: "Escritório",
  },
  {
    id: "2",
    image: "https://placehold.co/40x40.png",
    name: "Caneta Preta",
    code: "002-25",
    patrimony: "N/A",
    type: "consumo",
    quantity: 63,
    unit: "und",
    category: "Escritório",
  },
  {
    id: "3",
    image: "https://placehold.co/40x40.png",
    name: "Caneta Vermelha",
    code: "003-25",
    patrimony: "N/A",
    type: "consumo",
    quantity: 19,
    unit: "und",
    category: "Escritório",
  },
  {
    id: "4",
    image: "https://placehold.co/40x40.png",
    name: "Papel A4",
    code: "005-25",
    patrimony: "N/A",
    type: "consumo",
    quantity: 11,
    unit: "Resma",
    category: "Escritório",
  },
  {
    id: "5",
    image: "https://placehold.co/40x40.png",
    name: "Quadro",
    code: "004-25",
    patrimony: "123456",
    type: "permanente",
    quantity: 1,
    unit: "und",
    category: "Mobiliário",
  },
];

export default function InventoryPage() {
  const [searchTerm, setSearchTerm] = React.useState("");
  const [isSheetOpen, setIsSheetOpen] = React.useState(false);
  
  const handleAddItem = (newItem: any) => {
    console.log("New item added:", newItem);
    // Here you would typically update your state or make an API call
    // For now, we'll just log it to the console.
  };

  const filteredProducts = products.filter(
    (product) =>
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.code.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <>
      <div className="flex flex-col gap-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Inventário</h1>
            <p className="text-muted-foreground">
              Consulte e gira todos os itens em stock.
            </p>
          </div>
          <Button onClick={() => setIsSheetOpen(true)}>
            <PlusCircle className="mr-2" />
            Adicionar Novo Item
          </Button>
        </div>

        <Card>
          <CardHeader>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar item por nome ou código..."
                className="pl-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </CardHeader>
          <CardContent>
            <div className="border rounded-md">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[80px]">Item</TableHead>
                    <TableHead>Nome</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Categoria</TableHead>
                    <TableHead className="text-right">Qtd. em Estoque</TableHead>
                    <TableHead className="w-[100px] text-center">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredProducts.map((product) => (
                    <TableRow key={product.id}>
                      <TableCell>
                        <Image
                          src={product.image}
                          alt={product.name}
                          width={40}
                          height={40}
                          className="rounded-md"
                          data-ai-hint="product image"
                        />
                      </TableCell>
                      <TableCell>
                        <div className="font-medium">{product.name}</div>
                        <div className="text-sm text-muted-foreground">
                          Código: {product.code} / Patrimônio: {product.patrimony}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={product.type === 'permanente' ? 'secondary' : 'outline'}>
                          {product.type}
                        </Badge>
                      </TableCell>
                      <TableCell>{product.category}</TableCell>
                      <TableCell className="text-right">
                        <div className="font-medium">{product.quantity}</div>
                        <div className="text-sm text-muted-foreground">{product.unit}</div>
                      </TableCell>
                      <TableCell className="text-center">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button aria-haspopup="true" size="icon" variant="ghost">
                              <MoreHorizontal className="h-4 w-4" />
                              <span className="sr-only">Toggle menu</span>
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem>
                              <History className="mr-2 h-4 w-4" />
                              <span>Ver Movimentações</span>
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <Edit className="mr-2 h-4 w-4" />
                              <span>Editar Item</span>
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
      <AddItemSheet 
        isOpen={isSheetOpen}
        onOpenChange={setIsSheetOpen}
        onItemAdded={handleAddItem}
      />
    </>
  );
}
