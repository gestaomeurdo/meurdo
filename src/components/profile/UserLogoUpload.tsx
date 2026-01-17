"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/integrations/supabase/auth-provider";
import { Loader2, Upload, Trash2, ShieldCheck, Lock, AlertTriangle } from "lucide-react";
import { showError, showSuccess } from "@/utils/toast";
import { useQueryClient } from "@tanstack/react-query";
import { cn } from "@/lib/utils";
import UpgradeModal from "../subscription/UpgradeModal";

const BUCKET_NAME = 'company_assets';

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
        // Limpa o input para permitir selecionar o mesmo arquivo novamente se o usuário virar PRO
        e.target.value = '';
        return;
    }
    const file = e.target.files?.[0];
    if (!file) return;

    // Validação de tamanho (2MB)
    if (file.size > 2 * 1024 * 1024) {
      showError("A imagem é muito grande. O limite máximo é 2MB.");
      e.target.value = '';
      return;
    }

    // Validação de tipo
    if (!file.type.startsWith('image/')) {
      showError("Apenas arquivos de imagem são permitidos.");
      e.target.value = '';
      return;
    }

    setIsUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      // Usando user.id como pasta raiz para conformidade com RLS
      const filePath = `${user?.id}/${Date.now()}.${fileExt}`;

      // 1. Upload para o bucket dedicado
      const { error: uploadError } = await supabase.storage
        .from(BUCKET_NAME)
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) {
        console.error("Erro detalhado do upload:", uploadError);
        throw new Error(uploadError.message === "The resource was not found" ? "Bucket de armazenamento não encontrado." : uploadError.message);
      }

      // 2. Obter URL pública
      const { data: publicUrlData } = supabase.storage
        .from(BUCKET_NAME)
        .getPublicUrl(filePath);

      // 3. Atualizar perfil
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: publicUrlData.publicUrl })
        .eq('id', user?.id);

      if (updateError) throw updateError;

      showSuccess("Logo da empresa salva com sucesso!");
      queryClient.invalidateQueries({ queryKey: ['profile'] });
    } catch (error: any) {
      console.error("Erro no processo de logo:", error);
      showError(`Falha no upload: ${error.message || "Erro de conexão."}`);
    } finally {
      setIsUploading(false);
      // Limpa o input
      e.target.value = '';
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
                    "w-32 h-32 border-2 border-dashed rounded-2xl bg-white flex items-center justify-center overflow-hidden group relative transition-all shadow-sm",
                    !isPro && "opacity-50 cursor-not-allowed hover:bg-muted",
                    isPro && "border-primary/30"
                )}
                onClick={() => !isPro && setShowUpgrade(true)}
            >
              {currentLogo ? (
                <>
                  <img src={currentLogo} alt="Logo" className="w-full h-full object-contain p-2" />
                  {isPro && (
                    <button 
                        onClick={(e) => { e.stopPropagation(); removeLogo(); }} 
                        className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white"
                        title="Remover Logo"
                    >
                        <Trash2 className="w-6 h-6" />
                    </button>
                  )}
                </>
              ) : (
                <div className="text-center space-y-1">
                    {isPro ? <Upload className="mx-auto w-6 h-6 text-primary/40" /> : <Lock className="mx-auto w-6 h-6 text-muted-foreground" />}
                </div>
              )}
            </div>
            <div className="flex-1 space-y-3 w-full text-center sm:text-left">
              <p className="text-xs text-muted-foreground font-medium">
                Recomendado: PNG com fundo transparente.<br/>Tamanho máximo: 2MB.
              </p>
              <div className="flex justify-center sm:justify-start gap-2">
                <Button 
                    asChild={isPro} 
                    variant={isPro ? "outline" : "secondary"} 
                    size="sm" 
                    disabled={isUploading}
                    onClick={() => !isPro && setShowUpgrade(true)}
                    className="rounded-xl font-bold min-w-[140px]"
                >
                  <label className={isPro ? "cursor-pointer" : "cursor-not-allowed"}>
                    {isUploading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}
                    {currentLogo ? "Trocar Logotipo" : "Fazer Upload"}
                    {isPro && <input type="file" className="hidden" accept="image/png, image/jpeg, image/jpg" onChange={handleUpload} disabled={isUploading} />}
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