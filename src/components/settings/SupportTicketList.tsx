import { useSupportTickets, TicketStatus } from "@/hooks/use-support";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { MessageSquare, Clock, CheckCircle2, Search, LifeBuoy } from "lucide-react";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";
import SupportTicketChat from "./SupportTicketChat";
import { Skeleton } from "@/components/ui/skeleton";

const statusConfig: Record<TicketStatus, { label: string, color: string, icon: any }> = {
  'open': { label: 'Aberto', color: 'bg-slate-400', icon: Clock },
  'in_progress': { label: 'Em Análise', color: 'bg-orange-500', icon: Search },
  'resolved': { label: 'Respondido', color: 'bg-emerald-600', icon: CheckCircle2 },
  'closed': { label: 'Finalizado', color: 'bg-slate-300', icon: CheckCircle2 },
};

const SupportTicketList = () => {
  const { data: tickets, isLoading } = useSupportTickets();

  if (isLoading) return (
      <div className="space-y-2">
          {[1,2,3].map(i => <Skeleton key={i} className="h-16 w-full rounded-xl" />)}
      </div>
  );

  if (!tickets || tickets.length === 0) return (
    <div className="text-center py-12 bg-muted/10 border border-dashed rounded-3xl">
      <MessageSquare className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
      <p className="text-sm font-medium text-muted-foreground">Você ainda não possui chamados abertos.</p>
    </div>
  );

  return (
    <div className="rounded-2xl border overflow-hidden bg-card shadow-sm">
      <Table>
        <TableHeader className="bg-muted/50">
          <TableRow>
            <TableHead className="text-[10px] font-black uppercase tracking-widest">Assunto</TableHead>
            <TableHead className="text-[10px] font-black uppercase tracking-widest hidden sm:table-cell">Categoria</TableHead>
            <TableHead className="text-[10px] font-black uppercase tracking-widest">Status</TableHead>
            <TableHead className="text-[10px] font-black uppercase tracking-widest text-right">Data</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {tickets.map((ticket) => {
            const config = statusConfig[ticket.status];
            return (
              <SupportTicketChat 
                key={ticket.id} 
                ticket={ticket} 
                trigger={
                  <TableRow className="cursor-pointer hover:bg-accent/50 transition-colors group">
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-bold text-sm leading-tight">{ticket.subject}</span>
                        <span className="text-[9px] text-muted-foreground font-black uppercase tracking-tighter sm:hidden">{ticket.category}</span>
                      </div>
                    </TableCell>
                    <TableCell className="hidden sm:table-cell">
                      <span className="text-xs font-medium text-muted-foreground">{ticket.category}</span>
                    </TableCell>
                    <TableCell>
                      <Badge className={cn("text-[9px] font-black uppercase tracking-tighter px-2 border-none text-white", config.color)}>
                        {config.label}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex flex-col items-end">
                        <span className="text-xs font-bold">{format(parseISO(ticket.created_at), "dd/MM")}</span>
                        <span className="text-[9px] text-muted-foreground uppercase">{format(parseISO(ticket.created_at), "HH:mm")}</span>
                      </div>
                    </TableCell>
                  </TableRow>
                }
              />
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
};

export default SupportTicketList;