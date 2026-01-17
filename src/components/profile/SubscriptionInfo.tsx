import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useProfile } from "@/hooks/use-profile";
import { Loader2, Zap, CreditCard, ShieldCheck, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useStripeCustomerPortal } from "@/hooks/use-profile";
import { Skeleton } from "@/components/ui/skeleton";
import UpgradeButton from "../subscription/UpgradeButton";

const SubscriptionInfo = () => {
  const { data: profile, isLoading } = useProfile();
  const { mutate: getPortalUrl, isPending: isRedirecting } = useStripeCustomerPortal();

  if (isLoading) {
    return <Skeleton className="h-40 w-full" />;
  }

  const isPro = profile?.subscription_status === 'active';
  const planType = profile?.plan_type || 'free';

  const handleManageSubscription = () => {
    getPortalUrl();
  };

  return (
    <Card className={isPro ? "border-primary/50 bg-primary/5" : "border-dashed"}>
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-xl flex items-center gap-2">
              Plano: {planType.toUpperCase()}
            </CardTitle>
            <CardDescription>
              {isPro 
                ? "Sua assinatura PRO está ativa. Gerencie seus detalhes de pagamento." 
                : "Você está no plano gratuito. Faça upgrade para obras ilimitadas."}
            </CardDescription>
          </div>
          <Badge variant={isPro ? "default" : "outline"} className="px-4 py-1 bg-green-500/10 text-green-600 border-green-500/50">
            {isPro ? "PRO ATIVA" : "GRATUITO"}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {isPro ? (
          <Button 
            onClick={handleManageSubscription} 
            disabled={isRedirecting}
            className="bg-primary hover:bg-primary/90"
          >
            {isRedirecting ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <ExternalLink className="mr-2 h-4 w-4" />
            )}
            Gerenciar Assinatura
          </Button>
        ) : (
          <div className="max-w-xs">
            <UpgradeButton />
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default SubscriptionInfo;