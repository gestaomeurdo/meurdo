import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

interface KpiCardProps {
  title: string;
  value: string | number;
  description?: string;
  icon: React.ElementType;
  isLoading: boolean;
  className?: string;
}

const KpiCard = ({ title, value, description, icon: Icon, isLoading, className }: KpiCardProps) => (
  <Card className={cn("overflow-hidden", className)}>
    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-4">
      <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground uppercase tracking-wider">{title}</CardTitle>
      <Icon className="h-4 w-4 text-muted-foreground/70" />
    </CardHeader>
    <CardContent className="p-4 pt-0">
      {isLoading ? (
        <div className="space-y-2">
          <Skeleton className="h-7 w-full" />
          {description && <Skeleton className="h-3 w-3/4" />}
        </div>
      ) : (
        <>
          <div className="text-lg sm:text-2xl font-bold break-words tracking-tight">
            {value}
          </div>
          {description && (
            <p className="text-[10px] sm:text-xs text-muted-foreground mt-1 line-clamp-1">
              {description}
            </p>
          )}
        </>
      )}
    </CardContent>
  </Card>
);

export default KpiCard;