import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Edit, Loader2 } from "lucide-react";
import { UserWithAccess, useUpdateUserRole, useUpdateUserObraAccess } from "@/hooks/use-users";
import { useObras, Obra } from "@/hooks/use-obras";
import { showSuccess, showError } from "@/utils/toast";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";

const EditUserSchema = z.object({
  role: z.enum(['administrator', 'obra_user', 'view_only']),
  obraIds: z.array(z.string()),
});

type EditUserFormValues = z.infer<typeof EditUserSchema>;

interface UserEditDialogProps {
  user: UserWithAccess;
}

const UserEditDialog = ({ user }: UserEditDialogProps) => {
  const [open, setOpen] = useState(false);
  const { data: allObras, isLoading: isLoadingObras } = useObras(); // Admin will get all obras
  const updateRoleMutation = useUpdateUserRole();
  const updateAccessMutation = useUpdateUserObraAccess();

  const form = useForm<EditUserFormValues>({
    resolver: zodResolver(EditUserSchema),
    defaultValues: {
      role: user.role,
      obraIds: user.obra_access?.map(oa => oa.obra_id) || [],
    },
  });

  useEffect(() => {
    if (user) {
      form.reset({
        role: user.role,
        obraIds: user.obra_access?.map(oa => oa.obra_id) || [],
      });
    }
  }, [user, form]);

  const onSubmit = async (values: EditUserFormValues) => {
    try {
      // Update role if changed
      if (values.role !== user.role) {
        await updateRoleMutation.mutateAsync({ userId: user.id, role: values.role });
      }
      
      // Update obra access
      await updateAccessMutation.mutateAsync({ userId: user.id, obraIds: values.obraIds });

      showSuccess(`Usuário ${user.email} atualizado com sucesso.`);
      setOpen(false);
    } catch (error) {
      showError(`Erro ao atualizar usuário: ${error instanceof Error ? error.message : "Erro desconhecido"}`);
    }
  };

  const isLoading = updateRoleMutation.isPending || updateAccessMutation.isPending;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon">
          <Edit className="w-4 h-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Editar Usuário</DialogTitle>
        </DialogHeader>
        <p className="text-sm text-muted-foreground">{user.email}</p>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="role"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Função</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value} disabled={isLoading}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="view_only">Visualizador</SelectItem>
                      <SelectItem value="obra_user">Usuário da Obra</SelectItem>
                      <SelectItem value="administrator">Administrador</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="obraIds"
              render={() => (
                <FormItem>
                  <FormLabel>Acesso às Obras</FormLabel>
                  {isLoadingObras ? (
                    <div className="flex items-center"><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Carregando obras...</div>
                  ) : (
                    <ScrollArea className="h-40 w-full rounded-md border p-4">
                      {allObras?.map((obra: Obra) => (
                        <FormField
                          key={obra.id}
                          control={form.control}
                          name="obraIds"
                          render={({ field }) => (
                            <FormItem className="flex flex-row items-start space-x-3 space-y-0 mb-2">
                              <FormControl>
                                <Checkbox
                                  checked={field.value?.includes(obra.id)}
                                  onCheckedChange={(checked) => {
                                    return checked
                                      ? field.onChange([...field.value, obra.id])
                                      : field.onChange(field.value?.filter((id) => id !== obra.id));
                                  }}
                                />
                              </FormControl>
                              <FormLabel className="font-normal">{obra.nome}</FormLabel>
                            </FormItem>
                          )}
                        />
                      ))}
                    </ScrollArea>
                  )}
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button type="submit" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Salvar Alterações
            </Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default UserEditDialog;