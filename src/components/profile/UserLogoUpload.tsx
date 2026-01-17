"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/integrations/supabase/auth-provider";
import { Loader2, Upload, Trash2, ShieldCheck, Lock } from "lucide-react";
import { showError, showSuccess } from "@/utils/toast";
import { useQueryClient } from "@tanstack/react-query";
import { cn } from "@/lib/utils";
import UpgradeModal from "../subscription/UpgradeModal";

const UserLogoUpload = () => {
  const { profile, user } = useAuth();
  const [isUploading, setIsUploading] = useState(false);
  const [showUpgrade, setShowUpgrade] = useState(false);
  const queryClient = useQueryClient();

  const isPro = profile?.subscription_status === 'active' || profile?.plan_type === 'pro';
  const currentLogo = profile?.avatar_url;

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!isPro) {
        setShowUpgrade(true);
        return;
    }
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
    <>
      <Card className={cn("border-dashed rounded-3xl overflow-hidden", isPro && "border-primary/50 bg-primary/5")}>
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg flex items-center gap-2">
                Logotipo da Empresa{" "}
                {isPro ? <ShieldCheck className="h-5 w-5 text-primary" /> : <Lock className="h-4 w-4 text-muted-foreground" />}
              </CardTitle>
              <CardDescription>
                {isPro
                  ? "Sua logo aparecerá no cabeçalho de todos os PDFs gerados."
                  : "Assine o PRO para remover nossa marca d'água e usar a sua própria."}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row items-center gap-6">
            <div 
                className={cn(
                    "w-32 h-32 border-2 border-dashed rounded-2xl bg-white flex items-center justify-center overflow-hidden group relative transition-all",
                    !isPro && "opacity-50 cursor-not-allowed hover:bg-muted",
                    isPro && "border-primary/30"
                )}
                onClick={() => !isPro && setShowUpgrade(true)}
            >
              {currentLogo ? (
                <>
                  <img src={currentLogo} alt="Logo" className="w-full h-full object-contain p-2" />
                  <button onClick={(e) => { e.stopPropagation(); removeLogo(); }} className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white"><Trash2 className="w-6 h-6" /></button>
                </>
              ) : (
                <div className="text-center space-y-1">
                    {isPro ? <Upload className="mx-auto w-6 h-6 text-primary/40" /> : <Lock className="mx-auto w-6 h-6 text-muted-foreground" />}
                </div>
              )}
            </div>
            <div className="flex-1 space-y-3">
              <p className="text-xs text-muted-foreground font-medium">
                PNG ou JPG (fundo transparente recomendado). Tamanho máx: 2MB.
              </p>
              <div className="flex gap-2">
                <Button 
                    asChild={isPro} 
                    variant={isPro ? "outline" : "secondary"} 
                    size="sm" 
                    disabled={isUploading}
                    onClick={() => !isPro && setShowUpgrade(true)}
                    className="rounded-xl font-bold"
                >
                  <label className={isPro ? "cursor-pointer" : "cursor-not-allowed"}>
                    {isUploading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}
                    {currentLogo ? "Trocar Logotipo" : "Fazer Upload"}
                    {isPro && <input type="file" className="hidden" accept="image/*" onChange={handleUpload} disabled={isUploading} />}
                  </label>
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <UpgradeModal 
        open={showUpgrade} 
        onOpenChange={setShowUpgrade} 
        title="Personalize seus Relatórios"
        description="Destaque sua empresa usando sua própria logo no cabeçalho dos documentos."
      />
    </>
  );
};

export default UserLogoUpload;