"use client";

import { useProfile, useStripeCustomerPortal } from "@/hooks/use-profile";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, Zap, CreditCard, ShieldCheck, ExternalLink, Loader2, Lock } from "lucide-react";
import UpgradeButton from "../subscription/UpgradeButton";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/integrations/supabase/auth-provider";
import { toast } from "sonner";

const ADMIN_EMAIL = 'robsonalixandree@gmail.com';

const SubscriptionTab = () => {
  const { user } = useAuth();
  const { data: profile, isLoading } = useProfile();
  const { mutate: openPortal, isPending: isOpeningPortal } = useStripeCustomerPortal();
  const [isYearly, setIsYearly] = useState(false);
  
  if (isLoading) return <Skeleton className="h-[400px] w-full rounded-3xl" />;

  const isPro = profile?.subscription_status === 'active' || profile?.plan_type === 'pro';

  const handleManageSubscription = () => {
    // 1. Proteção para o Admin (Evita erro 500 do Stripe por falta de ID)
    if (user?.email === ADMIN_EMAIL) {
      toast.info("👑 Acesso Administrativo: Sua assinatura é vitalícia e gerenciada pelo sistema.");
      return;
    }

    // 2. Fluxo normal para clientes
    openPortal();
  };

  return (
    <div className="space-y-12 animate-in fade-in duration-700 pb-20">
      
      {/* SEÇÃO DE PREÇOS */}
      <section className="space-y-10">
          <div className="flex flex-col items-center text-center gap-6">
              <div className="space-y-2">
                <h2 className="text-2xl font-black uppercase tracking-tight text-foreground">Planos e Faturamento</h2>
                <p className="text-muted-foreground text-sm font-medium">Gerencie seu acesso e histórico de cobrança.</p>
              </div>

              {!isPro && (
                <div className="flex items-center gap-4 bg-slate-100 dark:bg-slate-900 p-2 rounded-full border dark:border-slate-800 shadow-inner">
                    <span className={cn("text-xs font-black px-4 transition-colors uppercase tracking-widest", !isYearly ? "text-primary" : "text-muted-foreground")}>Mensal</span>
                    <Switch checked={isYearly} onCheckedChange={setIsYearly} className="data-[state=checked]:bg-[#066abc]" />
                    <div className="flex items-center gap-3 pr-2">
                        <span className={cn("text-xs font-black px-2 transition-colors uppercase tracking-widest", isYearly ? "text-primary" : "text-muted-foreground")}>Anual</span>
                        <Badge className="bg-emerald-500 text-white border-none text-[9px] font-black uppercase tracking-tighter px-3">Economize 15%</Badge>
                    </div>
                </div>
              )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto items-stretch">
              {/* PLANO STARTER */}
              <Card className="bg-card border-slate-200 dark:bg-slate-900 dark:border-slate-800 rounded-[2.5rem] shadow-sm flex flex-col p-2 h-full transition-all">
                  <CardHeader className="text-center pt-10">
                      <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 mb-2">Starter</p>
                      <CardTitle className="text-3xl font-black">Gratuito</CardTitle>
                      <div className="pt-6"><span className="text-4xl font-black">R$ 0</span></div>
                  </CardHeader>
                  <CardContent className="flex-1 space-y-8 px-8 pb-10">
                      <ul className="space-y-4 pt-6 border-t dark:border-slate-800 text-xs font-bold text-muted-foreground">
                          <li className="flex items-center gap-3"><CheckCircle2 className="w-4 h-4 text-slate-300" /> 1 Obra Ativa</li>
                          <li className="flex items-center gap-3"><CheckCircle2 className="w-4 h-4 text-slate-300" /> PDF com Marca d'água</li>
                          <li className="flex items-center gap-3"><CheckCircle2 className="w-4 h-4 text-slate-300" /> Até 5 fotos por RDO</li>
                          <li className="flex items-center gap-3 opacity-50"><Lock className="w-4 h-4" /> Sem Relatório Executivo</li>
                      </ul>
                      <Button variant="outline" disabled className="w-full h-14 rounded-2xl border-slate-200 dark:border-slate-700 text-slate-400 font-black uppercase text-[10px] tracking-widest">
                          {!isPro ? "Seu Plano Atual" : "Nível Base"}
                      </Button>
                  </CardContent>
              </Card>

              {/* PLANO PROFISSIONAL */}
              <Card className={cn(
                  "bg-card border-2 dark:bg-slate-900 rounded-[3rem] shadow-2xl flex flex-col p-2 relative h-full transition-all",
                  isPro ? "border-emerald-500 ring-8 ring-emerald-500/5" : "border-[#066abc] ring-8 ring-[#066abc]/5 scale-105 z-10"
              )}>
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                      <Badge className={cn("text-white border-none px-6 py-1.5 rounded-full font-black text-[9px] uppercase tracking-widest shadow-xl", isPro ? "bg-emerald-500" : "bg-[#066abc]")}>
                          {isPro ? "Plano Ativo" : "Recomendado"}
                      </Badge>
                  </div>
                  <CardHeader className="text-center pt-12">
                      <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#066abc] mb-2">Profissional</p>
                      <CardTitle className="text-3xl font-black">Ilimitado</CardTitle>
                      <div className="pt-6 flex flex-col items-center">
                          <div className="flex items-baseline gap-2">
                              <span className="text-5xl font-black">R$ {isYearly ? "85" : "100"}</span>
                              <span className="text-slate-500 text-xs font-bold">/mês</span>
                          </div>
                          {isYearly && <p className="text-[10px] font-black text-emerald-600 uppercase mt-2">Faturado R$ 1.020 anualmente</p>}
                      </div>
                  </CardHeader>
                  <CardContent className="flex-1 space-y-8 px-8 pb-12">
                      <ul className="space-y-4 pt-6 border-t dark:border-slate-800 text-sm font-black">
                          <li className="flex items-center gap-3"><CheckCircle2 className="w-5 h-5 text-emerald-500" /> Obras & RDOs Ilimitados</li>
                          <li className="flex items-center gap-3"><CheckCircle2 className="w-5 h-5 text-emerald-500" /> PDF Whitelabel (Sua Logo)</li>
                          <li className="flex items-center gap-3"><CheckCircle2 className="w-5 h-5 text-emerald-500" /> Relatório Executivo Mensal</li>
                          <li className="flex items-center gap-3"><CheckCircle2 className="w-5 h-5 text-emerald-500" /> Links de Aprovação Digital</li>
                      </ul>
                      {isPro ? (
                          <Button onClick={handleManageSubscription} disabled={isOpeningPortal} className="w-full h-16 rounded-2xl bg-[#066abc] hover:bg-[#066abc]/90 text-white font-black uppercase text-xs tracking-widest shadow-xl">
                              {isOpeningPortal ? <Loader2 className="animate-spin h-5 w-5" /> : <ExternalLink className="w-5 h-5 mr-2" />} Gerenciar Assinatura
                          </Button>
                      ) : (
                          <div className="h-16"><UpgradeButton /></div>
                      )}
                  </CardContent>
              </Card>
          </div>
      </section>

      <section className="flex justify-center pt-16 border-t dark:border-slate-800">
          <Card className="bg-emerald-500/5 border-emerald-500/10 border-none rounded-[2rem] p-8 max-w-2xl w-full text-center">
              <div className="flex flex-col items-center gap-4">
                  <ShieldCheck className="w-10 h-10 text-emerald-600" />
                  <div className="space-y-1">
                    <span className="text-[10px] font-black uppercase tracking-widest text-emerald-700">Pagamento Seguro</span>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                        Assinatura processada via Stripe. Cancele ou altere seu plano a qualquer momento.
                    </p>
                  </div>
              </div>
          </Card>
      </section>
    </div>
  );
};

export default SubscriptionTab;