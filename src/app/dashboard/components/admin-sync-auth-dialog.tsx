
"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";

interface AdminSyncAuthDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onAuthSuccess: () => void;
}

export function AdminSyncAuthDialog({ isOpen, onOpenChange, onAuthSuccess }: AdminSyncAuthDialogProps) {
  const { toast } = useToast();
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");

  const handleAuthentication = () => {
    // Mock authentication for an admin user
    if (email === "admin@gmail.com" && password === "admin") {
      onAuthSuccess();
      onOpenChange(false);
    } else {
      toast({
        title: "Falha na Autenticação",
        description: "Credenciais inválidas. Tente novamente.",
        variant: "destructive",
      });
    }
    setPassword("");
  };
  
  const handleClose = () => {
    setEmail("");
    setPassword("");
    onOpenChange(false);
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Autenticação Administrativa</DialogTitle>
          <DialogDescription>
            É necessária a permissão de administrador para sincronizar a planilha.
            Por favor, insira suas credenciais.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="email" sx={{ textAlign: "right" }}>
              Email
            </Label>
            <Input
              id="email"
              type="email"
              placeholder="admin@gmail.com"
              className="col-span-3"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="password" sx={{ textAlign: "right" }}>
              Senha
            </Label>
            <Input
              id="password"
              type="password"
              className="col-span-3"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={handleClose}>
            Cancelar
          </Button>
          <Button type="submit" onClick={handleAuthentication}>
            Login
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
