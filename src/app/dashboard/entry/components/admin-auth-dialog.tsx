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

interface AdminAuthDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onAuthSuccess: () => void;
}

export function AdminAuthDialog({ isOpen, onOpenChange, onAuthSuccess }: AdminAuthDialogProps) {
  const { toast } = useToast();
  const [password, setPassword] = React.useState("");

  const handleAuthentication = () => {
    // In a real app, this would involve an API call to verify admin credentials
    if (password === "admin") { // Mock password
      toast({
        title: "Autenticação bem-sucedida!",
        description: "Permissão de administrador concedida.",
      });
      onAuthSuccess();
    } else {
      toast({
        title: "Falha na Autenticação",
        description: "A senha do administrador está incorreta.",
        variant: "destructive",
      });
    }
    setPassword("");
  };
  
  const handleClose = () => {
    setPassword("");
    onOpenChange(false);
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Autenticação de Administrador</DialogTitle>
          <DialogDescription>
            É necessária a permissão de um administrador para adicionar um novo item ao inventário.
            Por favor, insira a senha do administrador.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="admin-password" sx={{ textAlign: "right" }}>
              Senha
            </Label>
            <Input
              id="admin-password"
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
            Autenticar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
