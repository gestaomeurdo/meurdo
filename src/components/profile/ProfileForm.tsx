import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Loader2, Save } from "lucide-react";
import { showSuccess, showError } from "@/utils/toast";
import { Profile, useUpdateProfile } from "@/hooks/use-profile";
import { useAuth } from "@/integrations/supabase/auth-provider";

const ProfileSchema = z.object({
  first_name: z.string().min(2, "Nome deve ter pelo menos 2 caracteres.").nullable(),
  last_name: z.string().min(2, "Sobrenome deve ter pelo menos 2 caracteres.").nullable(),
});

type ProfileFormValues = z.infer<typeof ProfileSchema>;

interface ProfileFormProps {
  initialData: Profile;
}

const ProfileForm = ({ initialData }: ProfileFormProps) => {
  const updateMutation = useUpdateProfile();
  const { user } = useAuth();

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(ProfileSchema),
    defaultValues: {
      first_name: initialData.first_name || "",
      last_name: initialData.last_name || "",
    },
  });

  const onSubmit = async (values: ProfileFormValues) => {
    try {
      const payload = {
        first_name: values.first_name?.trim() || null,
        last_name: values.last_name?.trim() || null,
      };

      await updateMutation.mutateAsync(payload as { first_name: string, last_name: string });
      showSuccess("Perfil atualizado com sucesso!");
    } catch (error) {
      showError(`Erro ao salvar perfil: ${error instanceof Error ? error.message : "Erro desconhecido"}`);
    }
  };

  const isLoading = updateMutation.isPending;

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 max-w-lg">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="first_name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nome</FormLabel>
                <FormControl>
                  <Input
                    placeholder="Seu nome"
                    {...field}
                    value={field.value || ""}
                    disabled={isLoading}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="last_name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Sobrenome</FormLabel>
                <FormControl>
                  <Input
                    placeholder="Seu sobrenome"
                    {...field}
                    value={field.value || ""}
                    disabled={isLoading}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <div className="space-y-4">
          <FormItem>
            <FormLabel>Email</FormLabel>
            <FormControl>
              <Input
                value={user?.email || "N/A"}
                disabled
                className="bg-muted/50"
              />
            </FormControl>
            <p className="text-xs text-muted-foreground">O email não pode ser alterado aqui.</p>
          </FormItem>
        </div>
        <Button type="submit" disabled={isLoading}>
          {isLoading ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Save className="mr-2 h-4 w-4" />
          )}
          Salvar Alterações
        </Button>
      </form>
    </Form>
  );
};

export default ProfileForm;