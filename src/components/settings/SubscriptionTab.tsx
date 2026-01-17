"use client";

import { useProfile, useStripeCustomerPortal } from "@/hooks/use-profile";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, Zap, CreditCard, ShieldCheck, ExternalLink, Loader2 } from "lucide-react";
import UpgradeButton from "../subscription/UpgradeButton";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";

const SubscriptionTab = () => {
  const { data: profile, isLoading } = useProfile();
  const { mutate: openPortal, isPending: isOpeningPortal } = useStripeCustomerPortal();

  if (isLoading) {
    return <Skeleton className="h-[300px] w-full" />;
  }

  const isPro = profile?.subscription_status === 'active' || profile?.plan_type === 'pro';

  return (
    <div className="space-y-6">
      <Card className={isPro ? "border-primary/50 bg-primary/5 shadow-md" : "border-dashed"}>
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="text-2xl flex items-center gap-2">
                Seu Plano: {isPro ? "PRO" : "Gratuito"}{" "}
                {isPro && <ShieldCheck className="h-6 w-6 text-primary" />}
              </CardTitle>
              <CardDescription>
                {isPro
                  ? "Você tem acesso total a todos os recursos profissionais."
                  : "Você está usando a versão limitada. Faça o upgrade para crescer."}
              </CardDescription>
            </div>
            <Badge
              variant={isPro ? "default" : "outline"}
              className={isPro ? "px-4 py-1 bg-green-600 hover:bg-green-600 text-white" : "px-4 py-1"}
            >
              {isPro ? "Assinatura Ativa" : "Plano Limitado"}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-4">
              <h4 className="font-bold text-xs uppercase text-muted-foreground tracking-widest">
                Seu Acesso Inclui:
              </h4>
              <ul className="space-y-3">
                <li className="flex items-center gap-3 text-sm font-medium">
                  <CheckCircle2 className="h-5 w-5 text-green-500 shrink-0" />
                  Obras Ilimitadas
                </li>
                <li className="flex items-center gap-3 text-sm font-medium">
                  <CheckCircle2 className="h-5 w-5 text-green-500 shrink-0" />
                  Assinaturas Digitais no RDO
                </li>
                <li className="flex items-center gap-3 text-sm font-medium">
                  <CheckCircle2 className="h-5 w-5 text-green-500 shrink-0" />
                  Relatórios PDF sem marca d'água
                </li>
                <li className="flex items-center gap-3 text-sm font-medium">
                  <CheckCircle2 className="h-5 w-5 text-green-500 shrink-0" />
                  Personalização com sua Logo
                </li>
              </ul>
            </div>

            <div className="flex flex-col justify-center bg-background p-6 rounded-2xl border border-primary/10 shadow-inner">
              {!isPro ? (
                <div className="text-center space-y-4">
                  <div className="mx-auto w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center mb-2">
                    <Zap className="h-6 w-6 text-orange-600 fill-current" />
                  </div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Libere o potencial da sua construtora por apenas{" "}
                    <span className="text-foreground font-black text-lg">R$ 49,90/mês</span>.
                  </p>
                  <UpgradeButton />
                </div>
              ) : (
                <div className="text-center space-y-4">
                  <div className="mx-auto w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-2">
                    <CreditCard className="h-6 w-6 text-primary" />
                  </div>
                  <div className="space-y-1">
                    <p className="font-black text-lg">Pagamento via Stripe</p>
                    <p className="text-xs text-muted-foreground leading-relaxed px-4">
                      Gerencie cartões, baixe faturas ou altere seu plano através do portal seguro.
                    </p>
                  </div>
                  <Button 
                    variant="outline" 
                    className="w-full rounded-xl border-primary text-primary hover:bg-primary/5 font-bold"
                    onClick={() => openPortal()}
                    disabled={isOpeningPortal}
                  >
                    {isOpeningPortal ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <ExternalLink className="mr-2 h-4 w-4" />
                    )}
                    Abrir Portal de Pagamentos
                  </Button>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SubscriptionTab;