"use client";

import { useProfile } from "@/hooks/use-profile";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, Zap, CreditCard, ShieldCheck } from "lucide-react";
import UpgradeButton from "../subscription/UpgradeButton";
import { Skeleton } from "@/components/ui/skeleton";

const SubscriptionTab = () => {
  const { data: profile, isLoading } = useProfile();

  if (isLoading) {
    return <Skeleton className="h-[300px] w-full" />;
  }

  const isPro = profile?.subscription_status === 'active';

  return (
    <div className="space-y-6">
      <Card className={isPro ? "border-primary/50 bg-primary/5" : ""}>
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="text-2xl flex items-center gap-2">
                Seu Plano Atual: {isPro ? "PRO" : "Gratuito"}{" "}
                {isPro && <ShieldCheck className="h-6 w-6 text-primary" />}
              </CardTitle>
              <CardDescription>
                {isPro
                  ? "Você tem acesso total a todos os recursos do sistema."
                  : "Você está usando a versão limitada para 1 obra."}
              </CardDescription>
            </div>
            <Badge
              variant={isPro ? "default" : "outline"}
              className="px-4 py-1"
            >
              {isPro ? "Assinatura Ativa" : "Limitado"}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-3">
              <h4 className="font-semibold text-sm uppercase text-muted-foreground">
                Recursos PRO
              </h4>
              <ul className="space-y-2">
                <li className="flex items-center gap-2 text-sm">
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                  Obras Ilimitadas
                </li>
                <li className="flex items-center gap-2 text-sm">
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                  Exportação de PDF com Logotipo
                </li>
                <li className="flex items-center gap-2 text-sm">
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                  Assinaturas Digitais no RDO
                </li>
                <li className="flex items-center gap-2 text-sm">
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                  Suporte Prioritário
                </li>
              </ul>
            </div>
            <div className="flex flex-col justify-center bg-background/50 p-6 rounded-xl border border-dashed">
              {!isPro ? (
                <div className="text-center space-y-4">
                  <p className="text-sm text-muted-foreground">
                    Libere o potencial completo da sua gestão de obras por apenas{" "}
                    <strong>R$ 49,90/mês</strong>.
                  </p>
                  <UpgradeButton />
                </div>
              ) : (
                <div className="text-center space-y-2">
                  <div className="mx-auto w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-2">
                    <CreditCard className="h-6 w-6 text-primary" />
                  </div>
                  <p className="font-bold">Assinatura Gerenciada via Stripe</p>
                  <p className="text-xs text-muted-foreground">
                    Para cancelar ou alterar dados de pagamento, verifique seu e-mail ou entre em
                    contato com o suporte.
                  </p>
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