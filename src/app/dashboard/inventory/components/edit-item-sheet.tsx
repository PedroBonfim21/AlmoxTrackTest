"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Upload } from "lucide-react";
import Image from "next/image";

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
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";

const formSchema = z.object({
  name: z.string().min(1, "O nome do item é obrigatório."),
  materialType: z.enum(["consumo", "permanente"]),
  itemCode: z.string().optional(),
  patrimony: z.string().optional(),
  unit: z.string().min(1, "A unidade é obrigatória."),
  quantity: z.coerce.number().min(0, "A quantidade deve ser um número positivo."),
  category: z.string().min(1, "A categoria é obrigatória."),
  image: z.any().optional(),
});

type EditItemFormValues = z.infer<typeof formSchema>;

interface EditItemSheetProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onItemUpdated: (item: EditItemFormValues) => void;
  item: any; 
}

export function EditItemSheet({ isOpen, onOpenChange, onItemUpdated, item }: EditItemSheetProps) {
  const { toast } = useToast();
  const [imagePreview, setImagePreview] = React.useState<string | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const form = useForm<EditItemFormValues>({
    resolver: zodResolver(formSchema),
  });
  
  React.useEffect(() => {
    if (item) {
        form.reset({
            name: item.name,
            materialType: item.type,
            itemCode: item.code,
            patrimony: item.patrimony === 'N/A' ? '' : item.patrimony,
            unit: item.unit,
            quantity: item.quantity,
            category: item.category,
        });
        setImagePreview(item.image);
    }
  }, [item, form]);

  const materialType = form.watch("materialType");

  React.useEffect(() => {
    if (materialType === "consumo") {
      form.setValue("patrimony", "");
    }
  }, [materialType, form]);
  
  React.useEffect(() => {
    if (!isOpen) {
      form.reset();
      setImagePreview(null);
    }
  }, [isOpen, form]);


  const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
        form.setValue("image", file);
      };
      reader.readAsDataURL(file);
    }
  };

  const onSubmit = (data: EditItemFormValues) => {
    onItemUpdated(data);
    toast({
      title: "Item Atualizado!",
      description: `${data.name} foi atualizado com sucesso.`,
    });
    onOpenChange(false);
  };

  return (
    <Sheet open={isOpen} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-2xl">
        <SheetHeader>
          <SheetTitle>Editar Item</SheetTitle>
          <SheetDescription>
            Atualize os detalhes do item do inventário.
          </SheetDescription>
        </SheetHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 py-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="md:col-span-1 space-y-2">
                 <FormLabel>Imagem do Produto</FormLabel>
                <div 
                  className="relative flex flex-col items-center justify-center w-full h-48 border-2 border-dashed rounded-lg cursor-pointer hover:bg-muted"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleImageChange}
                    className="hidden"
                    accept="image/*"
                  />
                  {imagePreview ? (
                     <Image src={imagePreview} alt="Preview" layout="fill" objectFit="contain" className="rounded-lg" />
                  ) : (
                    <div className="text-center text-muted-foreground">
                      <Upload className="mx-auto h-8 w-8 mb-2" />
                      <span>Clique para carregar</span>
                    </div>
                  )}
                </div>
              </div>
              <div className="md:col-span-2 space-y-4">
                <FormField
                  control={form.control}
                  name="materialType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tipo de Material</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione o tipo de material" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="consumo">Consumo</SelectItem>
                          <SelectItem value="permanente">Permanente</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nome/Descrição do Item</FormLabel>
                      <FormControl>
                        <Input placeholder="Ex: Caneta Esferográfica Azul" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                 <FormField
                  control={form.control}
                  name="itemCode"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Código do Item (Opcional)</FormLabel>
                      <FormControl>
                        <Input placeholder="Ex: CAN-AZ-001" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="patrimony"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nº Patrimonial</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="Ex: 123456" 
                          {...field} 
                          disabled={materialType === 'consumo'}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
             </div>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                 <FormField
                  control={form.control}
                  name="unit"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Unidade</FormLabel>
                      <FormControl>
                        <Input placeholder="Ex: Un, Cx, Resma" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                 <FormField
                  control={form.control}
                  name="quantity"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Quantidade</FormLabel>
                      <FormControl>
                        <Input type="number" placeholder="0" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
             </div>
            <FormField
              control={form.control}
              name="category"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Categoria</FormLabel>
                  <FormControl>
                    <Input placeholder="Ex: Escritório, Limpeza" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <SheetFooter className="pt-4">
              <SheetClose asChild>
                <Button type="button" variant="outline">
                  Cancelar
                </Button>
              </SheetClose>
              <Button type="submit">Salvar Item</Button>
            </SheetFooter>
          </form>
        </Form>
      </SheetContent>
    </Sheet>
  );
}