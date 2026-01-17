import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { RdoReportMetrics } from '@/hooks/use-rdo-report-data';
import { Loader2, AlertTriangle, Clock, FileText } from 'lucide-react';
import { formatDate } from '@/utils/formatters';
import { ScrollArea } from '@/components/ui/scroll-area';

interface RdoOccurrenceTimelineProps {
  metrics: RdoReportMetrics | undefined;
  isLoading: boolean;
}

const RdoOccurrenceTimeline = ({ metrics, isLoading }: RdoOccurrenceTimelineProps) => {
  if (isLoading) {
    return (
      <Card className="col-span-full lg:col-span-2">
        <CardHeader>
          <CardTitle>Linha do Tempo de Ocorrências</CardTitle>
        </CardHeader>
        <CardContent className="h-[350px] p-4 flex justify-center items-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  const occurrences = metrics?.occurrenceTimeline || [];

  return (
    <Card className="col-span-full lg:col-span-2">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 text-destructive" />
          Linha do Tempo de Ocorrências
        </CardTitle>
      </CardHeader>
      <CardContent className="h-[350px] p-0">
        {occurrences.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
            <FileText className="w-10 h-10 mb-2" />
            <p>Nenhuma ocorrência registrada no período.</p>
          </div>
        ) : (
          <ScrollArea className="h-full p-4">
            <ol className="relative border-l border-border space-y-6 ml-2">
              {occurrences.map((item, index) => (
                <li key={index} className="ml-6">
                  <span className="absolute flex items-center justify-center w-3 h-3 bg-destructive rounded-full -left-[6px] ring-8 ring-background">
                    <Clock className="w-2 h-2 text-white" />
                  </span>
                  <h3 className="flex items-center mb-1 text-sm font-semibold text-foreground">
                    Ocorrência em {formatDate(item.date)}
                  </h3>
                  <p className="text-xs text-muted-foreground italic mb-2">
                    Impedimentos e Comentários
                  </p>
                  <p className="text-sm text-foreground bg-muted/50 p-3 rounded-lg border">
                    {item.comments}
                  </p>
                </li>
              ))}
            </ol>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
};

export default RdoOccurrenceTimeline;