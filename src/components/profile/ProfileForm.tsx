import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { Loader2, Save, Building2, User, MapPin } from "lucide-react";
import { showSuccess, showError } from "@/utils/toast";
import { Profile, useUpdateProfile } from "@/hooks/use-profile";

const ProfileSchema = z.object({
  first_name: z.string().min(2, "Obrigatório"),
  last_name: z.string().min(2, "Obrigatório"),
  company_name: z.string().nullable().optional(),
  cnpj: z.string().nullable().optional(),
  address: z.string().nullable().optional(),
});

type ProfileFormValues = z.infer<typeof ProfileSchema>;

interface ProfileFormProps {
  initialData: Profile;
}

const ProfileForm = ({ initialData }: ProfileFormProps) => {
  const updateMutation = useUpdateProfile();

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(ProfileSchema),
    defaultValues: {
      first_name: initialData.first_name || "",
      last_name: initialData.last_name || "",
      company_name: initialData.company_name || "",
      cnpj: initialData.cnpj || "",
      address: initialData.address || "",
    },
  });

  const onSubmit = async (values: ProfileFormValues) => {
    try {
      await updateMutation.mutateAsync(values as any);
      showSuccess("Dados atualizados com sucesso!");
    } catch (error) {
      showError("Erro ao salvar alterações.");
    }
  };

  const isLoading = updateMutation.isPending;

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        
        {/* DADOS PESSOAIS */}
        <div className="space-y-4">
          <h3 className="text-sm font-black uppercase tracking-widest text-primary flex items-center gap-2">
            <User className="w-4 h-4" /> Informações Pessoais
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField control={form.control} name="first_name" render={({ field }) => (
              <FormItem>
                <FormLabel>Nome</FormLabel>
                <FormControl><Input {...field} disabled={isLoading} className="rounded-xl h-11" /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <FormField control={form.control} name="last_name" render={({ field }) => (
              <FormItem>
                <FormLabel>Sobrenome</FormLabel>
                <FormControl><Input {...field} disabled={isLoading} className="rounded-xl h-11" /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
          </div>
        </div>

        {/* DADOS DA EMPRESA */}
        <div className="space-y-4 pt-6 border-t dark:border-slate-800">
          <h3 className="text-sm font-black uppercase tracking-widest text-primary flex items-center gap-2">
            <Building2 className="w-4 h-4" /> Dados da Construtora
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField control={form.control} name="company_name" render={({ field }) => (
              <FormItem>
                <FormLabel>Razão Social / Nome Fantasia</FormLabel>
                <FormControl><Input placeholder="Minha Construtora LTDA" {...field} value={field.value || ""} disabled={isLoading} className="rounded-xl h-11" /></FormControl>
                <FormDescription className="text-[10px] uppercase font-bold text-slate-400">Exibido no cabeçalho dos relatórios PDF.</FormDescription>
                <FormMessage />
              </FormItem>
            )} />
            <FormField control={form.control} name="cnpj" render={({ field }) => (
              <FormItem>
                <FormLabel>CNPJ</FormLabel>
                <FormControl><Input placeholder="00.000.000/0000-00" {...field} value={field.value || ""} disabled={isLoading} className="rounded-xl h-11" /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
          </div>
          <FormField control={form.control} name="address" render={({ field }) => (
            <FormItem>
              <FormLabel>Endereço Comercial</FormLabel>
              <FormControl>
                <div className="relative">
                  <MapPin className="absolute left-3 top-3.5 h-4 w-4 text-muted-foreground" />
                  <Input className="pl-9 rounded-xl h-11" placeholder="Rua, número, cidade - UF" {...field} value={field.value || ""} disabled={isLoading} />
                </div>
              </FormControl>
              <FormDescription className="text-[10px] uppercase font-bold text-slate-400">Utilizado como rodapé técnico nos documentos.</FormDescription>
              <FormMessage />
            </FormItem>
          )} />
        </div>

        <Button type="submit" className="bg-[#066abc] hover:bg-[#066abc]/90 rounded-xl h-12 px-8 font-bold shadow-lg" disabled={isLoading}>
          {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
          Salvar Alterações
        </Button>
      </form>
    </Form>
  );
};

export default ProfileForm;