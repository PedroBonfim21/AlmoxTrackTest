
"use client";

import Link from "next/link";
import * as React from "react";
import {
  CircleUser,
  FileText,
  LayoutDashboard,
  LogOut,
  Package,
  ArrowRightToLine,
  ArrowLeftFromLine,
  Users,
  Warehouse,
  Settings,
  History,
  Replace,
  ChevronsLeftRight,
  FileCog
} from "lucide-react";
import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarInset,
  SidebarTrigger,
  SidebarFooter,
  SidebarSeparator
} from "@/components/ui/sidebar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { AdminSyncAuthDialog } from "./components/admin-sync-auth-dialog";
import { usePathname } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import { products } from "@/lib/mock-data";
import { syncToSheet } from "@/ai/flows/sync-sheet-flow";

// Mock user role - 'Admin' or 'Operator'
const currentUserRole = "Admin";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const { toast } = useToast();
  const [isAuthDialogOpen, setIsAuthDialogOpen] = React.useState(false);

  const navItems = [
    { href: "/dashboard", icon: LayoutDashboard, label: "Painel" },
    { href: "/dashboard/inventory", icon: Package, label: "Inventário" },
    { href: "/dashboard/entry", icon: ArrowRightToLine, label: "Entrada" },
    { href: "/dashboard/exit", icon: ArrowLeftFromLine, label: "Saída" },
    { href: "/dashboard/returns", icon: ChevronsLeftRight, label: "Devolução" },
  ];

  const handleSyncSuccess = async (credential: any) => {
    toast({
      title: "Authentication Successful!",
      description: "Now syncing data to Google Sheets. This may take a moment...",
    });

    try {
        const result = await syncToSheet({
            accessToken: credential.accessToken,
            products,
        });
        toast({
            title: "Sync Complete!",
            description: (
                <p>
                    Data synced to a new spreadsheet.
                    <a href={result.spreadsheetUrl} target="_blank" rel="noopener noreferrer" className="underline ml-1">
                        Open Sheet
                    </a>
                </p>
            ),
        });
    } catch (error: any) {
        toast({
            title: "Sync Failed",
            description: error.message || "An unknown error occurred.",
            variant: "destructive",
        });
    }
  };

  return (
    <SidebarProvider>
      <Sidebar>
        <SidebarHeader>
          <div className="flex items-center gap-2 p-2">
            <Warehouse className="w-8 h-8 text-primary" />
            <span className="text-xl font-semibold">AlmoxTrack</span>
          </div>
        </SidebarHeader>
        <SidebarContent>
          <SidebarMenu>
            {navItems.map((item) => (
              <SidebarMenuItem key={item.label}>
                <SidebarMenuButton
                  asChild
                  isActive={pathname === item.href}
                  tooltip={item.label}
                >
                  <Link href={item.href}>
                    <item.icon />
                    <span>{item.label}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
            {currentUserRole === 'Admin' && (
              <SidebarMenuItem>
                <SidebarMenuButton
                  onClick={() => setIsAuthDialogOpen(true)}
                  tooltip={"Sincronizar Planilha"}
                >
                  <FileCog />
                  <span>{"Sincronizar Planilha"}</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            )}
          </SidebarMenu>
        </SidebarContent>
        <SidebarSeparator />
        <SidebarFooter>
           <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="justify-start w-full h-auto px-2 py-2">
                 <div className="flex justify-between w-full items-center">
                    <div className="flex gap-2 items-center">
                       <Avatar className="w-8 h-8">
                         <AvatarFallback>S</AvatarFallback>
                       </Avatar>
                       <div className="flex flex-col items-start text-sm">
                         <span className="font-medium text-sidebar-foreground">sdpinho29</span>
                         <span className="text-muted-foreground text-xs">sdpinho29@gmail.com</span>
                       </div>
                    </div>
                 </div>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>Minha Conta</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem>
                <Settings className="mr-2 h-4 w-4" />
                Configurações
              </DropdownMenuItem>
              <DropdownMenuSeparator />
               <DropdownMenuItem asChild>
                 <Link href="/login">
                   <LogOut className="mr-2 h-4 w-4" />
                   Sair
                 </Link>
               </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </SidebarFooter>
      </Sidebar>
      <SidebarInset>
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between gap-4 border-b bg-background/80 backdrop-blur-sm px-4 sm:px-6 md:hidden">
          <SidebarTrigger className="sm:hidden -ml-2" />
          
           <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                className="overflow-hidden rounded-full ml-auto"
              >
                <CircleUser className="h-5 w-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Admin</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem>
                <Settings className="mr-2 h-4 w-4" />
                Configurações
              </DropdownMenuItem>
              <DropdownMenuSeparator />
               <DropdownMenuItem asChild>
                 <Link href="/login">
                   <LogOut className="mr-2 h-4 w-4" />
                   Sair
                 </Link>
               </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </header>
        <main className="flex-1 p-4 sm:px-6 sm:py-6">{children}</main>
      </SidebarInset>
      <AdminSyncAuthDialog
        isOpen={isAuthDialogOpen}
        onOpenChange={setIsAuthDialogOpen}
        onAuthSuccess={handleSyncSuccess}
      />
    </SidebarProvider>
  );
}
