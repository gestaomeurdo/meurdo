import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

interface KpiCardProps {
  title: string;
  value: string | number;
  description?: string;
  icon: React.ElementType;
  isLoading: boolean;
}

const KpiCard = ({ title, value, description, icon: Icon, isLoading }: KpiCardProps) => (
  <Card>
    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
      <CardTitle className="text-sm font-medium">{title}</CardTitle>
      <Icon className="h-4 w-4 text-muted-foreground" />
    </CardHeader>
    <CardContent>
      {isLoading ? (
        <>
          <Skeleton className="h-8 w-3/4" />
          {description && <Skeleton className="h-4 w-full mt-2" />}
        </>
      ) : (
        <>
          <div className="text-2xl font-bold">{value}</div>
          {description && (
            <p className="text-xs text-muted-foreground mt-1">{description}</p>
          )}
        </>
      )}
    </CardContent>
  </Card>
);

export default KpiCard;