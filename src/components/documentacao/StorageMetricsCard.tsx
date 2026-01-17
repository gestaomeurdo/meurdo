import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { StorageMetrics } from "@/hooks/use-document-storage";
import { Loader2, HardDrive, Zap, CheckCircle2 } from "lucide-react";
import { formatBytes } from "@/utils/file-utils";
import UpgradeButton from "../subscription/UpgradeButton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

interface StorageMetricsCardProps {
  metrics: StorageMetrics | undefined;
  isLoading: boolean;
}

const StorageMetricsCard = ({ metrics, isLoading }: StorageMetricsCardProps) => {
  if (isLoading) {
    return (
      <Card className="h-40 flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </Card>
    );
  }

  if (!metrics) return null;

  const { totalSize, limit, isPro, canUpload } = metrics;
  const totalSizeMB = totalSize / (1024 * 1024);
  const limitMB = limit / (1024 * 1024);
  const progressValue = (totalSize / limit) * 100;
  const isNearLimit = progressValue >= 80 && progressValue < 100 && !isPro;
  const isOverLimit = progressValue >= 100 && !isPro;

  return (
    <Card className="shadow-clean border-l-4 border-l-primary">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium uppercase text-muted-foreground">
          Uso de Armazenamento
        </CardTitle>
        <HardDrive className="h-4 w-4 text-primary" />
      </CardHeader>
      <CardContent className="pt-4 space-y-3">
        <div className="flex justify-between items-center">
          <span className="text-2xl font-bold">{formatBytes(totalSize)}</span>
          <span className="text-sm text-muted-foreground">
            {isPro ? "Ilimitado (1GB)" : `Limite: ${formatBytes(limit)}`}
          </span>
        </div>
        {!isPro && (
          <>
            <Progress
              value={Math.min(progressValue, 100)}
              className="h-2"
              indicatorClassName={
                isOverLimit
                  ? "bg-destructive"
                  : isNearLimit
                  ? "bg-orange-500"
                  : "bg-primary"
              }
            />
            {isOverLimit && (
              <Alert variant="destructive" className="mt-4">
                <Zap className="h-4 w-4" />
                <AlertTitle>Limite Atingido!</AlertTitle>
                <AlertDescription>
                  Você excedeu o limite de 10MB. Faça upgrade para continuar fazendo uploads.
                </AlertDescription>
              </Alert>
            )}
            {!canUpload && !isOverLimit && (
              <div className="pt-2">
                <UpgradeButton />
              </div>
            )}
          </>
        )}
        {isPro && (
          <div className="flex items-center gap-2 text-sm text-green-600">
            <CheckCircle2 className="h-4 w-4" />
            <span>Plano PRO: 1GB de armazenamento disponível.</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default StorageMetricsCard;