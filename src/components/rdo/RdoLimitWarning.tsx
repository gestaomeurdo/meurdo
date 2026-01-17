import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useRdoLimits } from "@/hooks/use-rdo-limits";
import { Loader2, Zap, FileText, CheckCircle2 } from "lucide-react";
import UpgradeButton from "../subscription/UpgradeButton";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

const RdoLimitWarning = () => {
  const { rdoCount, limit, canCreateRdo, isPro, isLoading } = useRdoLimits();

  if (isLoading) {
    return <div className="h-20 flex items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;
  }

  if (isPro) {
    return (
      <Card className="border-primary/20 bg-primary/5">
        <CardContent className="p-4 flex items-center gap-3">
          <CheckCircle2 className="h-6 w-6 text-primary shrink-0" />
          <p className="text-sm font-medium text-primary">
            Plano PRO: Você tem registros de RDO ilimitados.
          </p>
        </CardContent>
      </Card>
    );
  }
  
  const progressValue = (rdoCount / limit) * 100;
  const isReached = !canCreateRdo;

  return (
    <Card className={isReached ? "border-destructive/50 bg-destructive/5" : "border-orange-500/50 bg-orange-50/10"}>
      <CardContent className="p-4 space-y-3">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-orange-600" />
            <h3 className="font-semibold text-sm">Limite de RDOs (Plano Gratuito)</h3>
          </div>
          <span className="font-bold text-lg">{rdoCount} / {limit}</span>
        </div>
        
        <Progress value={progressValue} className="h-2" indicatorClassName={isReached ? "bg-destructive" : "bg-orange-500"} />
        
        {isReached ? (
          <div className="space-y-3 pt-2">
            <p className="text-sm font-medium text-destructive">
              Limite atingido! Você não pode criar mais RDOs.
            </p>
            <UpgradeButton />
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">
            Você pode criar mais {limit - rdoCount} RDOs antes de precisar do plano PRO.
          </p>
        )}
      </CardContent>
    </Card>
  );
};

export default RdoLimitWarning;