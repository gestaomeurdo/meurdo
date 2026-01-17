"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/integrations/supabase/auth-provider";
import { Loader2, Upload, Trash2, CheckCircle2, ShieldCheck } from "lucide-react";
import { showError, showSuccess } from "@/utils/toast";
import { useQueryClient } from "@tanstack/react-query";
import { cn } from "@/lib/utils";

const UserLogoUpload = () => {
  const { profile, user } = useAuth();
  const [isUploading, setIsUploading] = useState(false);
  const queryClient = useQueryClient();

  const isPro = profile?.subscription_status === 'active' || profile?.plan_type === 'pro';
  const currentLogo = profile?.avatar_url;

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!isPro) return;
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      showError("A imagem deve ter no máximo 2MB.");
      return;
    }

    setIsUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const filePath = `logos/${user?.id}/${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('documentos_financeiros')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: publicUrlData } = supabase.storage
        .from('documentos_financeiros')
        .getPublicUrl(filePath);

      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: publicUrlData.publicUrl })
        .eq('id', user?.id);

      if (updateError) throw updateError;

      showSuccess("Logo da empresa salva com sucesso!");
      queryClient.invalidateQueries({ queryKey: ['profile'] });
    } catch (error: any) {
      showError(`Erro no upload: ${error.message}`);
    } finally {
      setIsUploading(false);
    }
  };

  const removeLogo = async () => {
    try {
      await supabase
        .from('profiles')
        .update({ avatar_url: null })
        .eq('id', user?.id);

      showSuccess("Logo removida.");
      queryClient.invalidateQueries({ queryKey: ['profile'] });
    } catch (error) {
      showError("Erro ao remover logo.");
    }
  };

  return (
    <Card className={cn("border-dashed", isPro && "border-primary/50 bg-primary/5")}>
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg flex items-center gap-2">
              Identidade Visual nos Relatórios{" "}
              {isPro && <ShieldCheck className="h-5 w-5 text-primary" />}
            </CardTitle>
            <CardDescription>
              {isPro
                ? "Substitua a nossa logo pela da sua empresa nos PDFs gerados."
                : "Recurso exclusivo do Plano PRO."}
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {!isPro ? (
          <div className="py-4 text-center">
            <p className="text-sm text-muted-foreground mb-4">
              Assine o PRO para remover nossa marca d'água e usar a sua própria.
            </p>
          </div>
        ) : (
          <div className="flex flex-col sm:flex-row items-center gap-6">
            <div className="w-32 h-32 border-2 border-dashed border-primary/30 rounded-xl bg-white flex items-center justify-center overflow-hidden group relative">
              {currentLogo ? (
                <>
                  <img
                    src={currentLogo}
                    alt="Logo Empresa"
                    className="w-full h-full object-contain p-2"
                  />
                  <button
                    onClick={removeLogo}
                    className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white"
                  >
                    <Trash2 className="w-6 h-6" />
                  </button>
                </>
              ) : (
                <Upload className="w-8 h-8 text-primary/40" />
              )}
            </div>
            <div className="flex-1 space-y-3">
              <p className="text-xs text-muted-foreground">
                Formatos aceitos: PNG ou JPG (máx 2MB). Recomendamos fundo transparente.
              </p>
              <div className="flex gap-2">
                <Button asChild variant="outline" size="sm" disabled={isUploading}>
                  <label className="cursor-pointer">
                    {isUploading ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <Upload className="w-4 h-4 mr-2" />
                    )}
                    {currentLogo ? "Alterar Logo" : "Fazer Upload"}
                    <input
                      type="file"
                      className="hidden"
                      accept="image/*"
                      onChange={handleUpload}
                      disabled={isUploading}
                    />
                  </label>
                </Button>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default UserLogoUpload;