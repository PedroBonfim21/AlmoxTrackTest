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
  reference: z.string().min(1, "A referência é obrigatória."),
  category: z.string().min(1, "A seleção da categoria é obrigatória."),
  otherCategory: z.string().optional(),
  image: z.any().optional(),
}).refine(data => {
  // Se a categoria for 'Outro', o campo 'otherCategory' se torna obrigatório.
  if (data.category === 'Outro') {
    return data.otherCategory && data.otherCategory.length > 0;
  }
  return true;
}, {
  // Mensagem de erro se a validação falhar
  message: "Por favor, especifique a categoria.",
  path: ["otherCategory"], // O erro aparecerá no campo 'otherCategory'
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
    if (item && isOpen) {
      // Lista de categorias padrão que existem no seu <Select>
      const standardCategories = ['Escritório', 'Limpeza'];
      
      // Verifica se a categoria do item é uma das padrões
      const isStandardCategory = standardCategories.includes(item.category);

      form.reset({
        name: item.name,
        materialType: item.type,
        itemCode: item.code,
        patrimony: item.patrimony === 'N/A' ? '' : item.patrimony,
        unit: item.unit,
        quantity: item.quantity,
        reference: item.reference,
        
        // LÓGICA CORRIGIDA AQUI:
        // Se for uma categoria padrão, usa o valor dela.
        // Se não for, define o select como 'Outro' e preenche
        // o campo de texto 'otherCategory' com o valor customizado.
        category: isStandardCategory ? item.category : 'Outro',
        otherCategory: isStandardCategory ? '' : item.category,
        
        image: null,
      });
      setImagePreview(item.image);
    }
  }, [item, form, isOpen]);

  const categoryValue = form.watch("category");
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
        const base64String = reader.result as string;
        const imageObject = {
          base64: base64String,
          fileName: file.name,
          contentType: file.type,
        };
        setImagePreview(base64String);
        form.setValue("image", imageObject);
      };
      reader.readAsDataURL(file);
    }
  };

  const onSubmit = (data: EditItemFormValues) => {
    onItemUpdated(data);
    onOpenChange(false);
  };

  return (
    <Sheet open={isOpen} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-2xl overflow-y-auto">
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
                    <Image
                      src={imagePreview}
                      alt="Preview"
                      fill
                      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                      className="rounded-lg object-cover"
                    />
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
                      <Select onValueChange={field.onChange} value={field.value}>
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
                          <Input
                            placeholder="Gerado Automaticamente" 
                            {...field} 
                            disabled
                          />
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
                            value={field.value || ''}
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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <>
                <FormField
                  control={form.control}
                  name="category"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Categoria</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione uma categoria" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="Escritório">Escritório</SelectItem>
                          <SelectItem value="Limpeza">Limpeza</SelectItem>
                          <SelectItem value="substituir">Para adicionar uma nova categoria</SelectItem>
                          <SelectItem value="Outro">Outro</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                {/* Este campo só aparece se 'Outro' for selecionado */}
                {categoryValue === 'Outro' && (
                  <FormField
                    control={form.control}
                    name="otherCategory"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Especifique a Categoria</FormLabel>
                        <FormControl>
                          <Input placeholder="Digite o nome da nova categoria" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}
              </>
              <FormField
                control={form.control}
                name="reference"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Referência / Localização</FormLabel>
                    <FormControl>
                      <Input placeholder="Ex: Prateleira A-03, Gaveta 5" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <SheetFooter className="pt-4">
              <SheetClose asChild>
                <Button type="button" variant="outline">
                  Cancelar
                </Button>
              </SheetClose>
              <Button type="submit">Salvar Alterações</Button>
            </SheetFooter>
          </form>
        </Form>
      </SheetContent>
    </Sheet>
  );
}