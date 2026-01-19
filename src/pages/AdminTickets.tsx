import DashboardLayout from "@/components/layout/DashboardLayout";
import { useAuth } from "@/integrations/supabase/auth-provider";
import { useAdminTickets, useAdminTicketMessages, useAdminReply, useAdminUpdateStatus, AdminTicket } from "@/hooks/use-admin-support";
import { useState, useRef, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Send, User, LifeBuoy, CheckCircle2, AlertCircle, Clock, ExternalLink, ShieldCheck, Mail } from "lucide-react";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";
import { showSuccess, showError } from "@/utils/toast";

const AdminTickets = () => {
  const { profile } = useAuth();
  const isAdmin = profile?.role === 'administrator';
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);
  const [replyText, setReplyText] = useState("");
  const [filter, setFilter] = useState<'open' | 'resolved' | 'all'>('open');
  
  const { data: tickets, isLoading: loadingTickets } = useAdminTickets();
  const { data: messages, isLoading: loadingMessages } = useAdminTicketMessages(selectedTicketId || undefined);
  const replyMutation = useAdminReply();
  const statusMutation = useAdminUpdateStatus();
  
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  if (!isAdmin) {
    return <div className="p-20 text-center font-bold">Acesso Negado. Esta área é restrita a administradores.</div>;
  }

  const selectedTicket = tickets?.find(t => t.id === selectedTicketId);

  const filteredTickets = tickets?.filter(t => {
    if (filter === 'all') return true;
    return t.status === filter;
  }) || [];

  const handleSendReply = async () => {
    if (!replyText.trim() || !selectedTicketId) return;
    try {
      await replyMutation.mutateAsync({ ticketId: selectedTicketId, message: replyText });
      setReplyText("");
      showSuccess("Resposta enviada!");
    } catch (err) {
      showError("Erro ao enviar resposta.");
    }
  };

  const handleMarkResolved = async () => {
    if (!selectedTicketId) return;
    try {
      await statusMutation.mutateAsync({ ticketId: selectedTicketId, status: 'closed' });
      showSuccess("Chamado finalizado.");
    } catch (err) {}
  };

  return (
    <DashboardLayout>
      <div className="flex h-[calc(100vh-64px)] overflow-hidden">
        
        {/* COLUNA ESQUERDA: LISTA */}
        <div className="w-80 sm:w-96 border-r flex flex-col bg-slate-50 dark:bg-slate-900/20">
          <div className="p-6 border-b space-y-4">
            <h1 className="text-xl font-black uppercase tracking-tight flex items-center gap-2">
                <LifeBuoy className="w-6 h-6 text-primary" /> Central de Suporte
            </h1>
            <div className="flex gap-1 p-1 bg-muted rounded-xl">
                <button 
                    onClick={() => setFilter('open')} 
                    className={cn("flex-1 py-1.5 text-[10px] font-black uppercase rounded-lg transition-all", filter === 'open' ? "bg-white dark:bg-slate-800 shadow-sm text-primary" : "text-muted-foreground")}
                >
                    Abertos
                </button>
                <button 
                    onClick={() => setFilter('resolved')} 
                    className={cn("flex-1 py-1.5 text-[10px] font-black uppercase rounded-lg transition-all", filter === 'resolved' ? "bg-white dark:bg-slate-800 shadow-sm text-primary" : "text-muted-foreground")}
                >
                    Respondidos
                </button>
                <button 
                    onClick={() => setFilter('all')} 
                    className={cn("flex-1 py-1.5 text-[10px] font-black uppercase rounded-lg transition-all", filter === 'all' ? "bg-white dark:bg-slate-800 shadow-sm text-primary" : "text-muted-foreground")}
                >
                    Todos
                </button>
            </div>
          </div>

          <ScrollArea className="flex-1">
            {loadingTickets ? (
                <div className="p-8 text-center"><Loader2 className="animate-spin mx-auto text-primary" /></div>
            ) : filteredTickets.length === 0 ? (
                <div className="p-8 text-center text-muted-foreground text-xs uppercase font-bold">Nenhum chamado nesta categoria.</div>
            ) : (
                filteredTickets.map(ticket => (
                    <div 
                        key={ticket.id} 
                        onClick={() => setSelectedTicketId(ticket.id)}
                        className={cn(
                            "p-4 border-b cursor-pointer transition-all hover:bg-white dark:hover:bg-slate-800/50 relative group",
                            selectedTicketId === ticket.id ? "bg-white dark:bg-slate-800 border-l-4 border-l-primary" : "bg-transparent"
                        )}
                    >
                        <div className="flex justify-between items-start mb-1">
                            <span className="text-[9px] font-black uppercase text-muted-foreground tracking-widest">{ticket.category}</span>
                            <span className="text-[9px] font-bold text-muted-foreground">{format(parseISO(ticket.created_at), "dd/MM HH:mm")}</span>
                        </div>
                        <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 truncate">{ticket.subject}</h3>
                        <p className="text-[10px] font-medium text-slate-500 mt-1 truncate">
                            {ticket.profiles.first_name} {ticket.profiles.last_name}
                        </p>
                        {ticket.status === 'open' && (
                            <div className="absolute top-1/2 right-4 -translate-y-1/2 w-2.5 h-2.5 bg-blue-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(59,130,246,0.5)]"></div>
                        )}
                    </div>
                ))
            )}
          </ScrollArea>
        </div>

        {/* COLUNA DIREITA: CONVERSA */}
        <div className="flex-1 flex flex-col bg-white dark:bg-slate-950">
          {selectedTicket ? (
            <>
                {/* CABEÇALHO DO CLIENTE */}
                <header className="p-6 border-b bg-slate-50/50 dark:bg-slate-900/30 flex justify-between items-center">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center border border-primary/20">
                            <User className="w-6 h-6 text-primary" />
                        </div>
                        <div>
                            <h2 className="text-lg font-black uppercase tracking-tight text-slate-800 dark:text-slate-100">
                                {selectedTicket.profiles.first_name} {selectedTicket.profiles.last_name}
                            </h2>
                            <div className="flex items-center gap-3 text-[10px] font-bold uppercase text-muted-foreground tracking-widest">
                                <span className="flex items-center gap-1"><Mail className="w-3 h-3" /> {selectedTicket.profiles.email}</span>
                                <Badge className="bg-emerald-500/10 text-emerald-600 border-none px-2 rounded-lg text-[8px]">{selectedTicket.profiles.plan_type || 'FREE'}</Badge>
                            </div>
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <Button variant="outline" size="sm" className="rounded-xl h-10 font-bold text-xs" onClick={handleMarkResolved}>
                            <CheckCircle2 className="w-4 h-4 mr-2 text-green-500" /> Resolvido
                        </Button>
                    </div>
                </header>

                {/* HISTÓRICO DE CHAT */}
                <ScrollArea className="flex-1 p-6">
                    <div className="max-w-3xl mx-auto space-y-6">
                        {loadingMessages ? (
                            <div className="flex justify-center p-12"><Loader2 className="animate-spin text-primary" /></div>
                        ) : (
                            messages?.map((msg) => (
                                <div key={msg.id} className={cn("flex flex-col max-w-[80%]", msg.sender_role === 'user' ? "items-start" : "ml-auto items-end")}>
                                    <div className={cn(
                                        "p-4 rounded-3xl text-sm font-medium shadow-sm",
                                        msg.sender_role === 'user' 
                                            ? "bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-100 rounded-tl-none" 
                                            : "bg-[#066abc] text-white rounded-tr-none"
                                    )}>
                                        {msg.message}
                                    </div>
                                    <span className="text-[9px] font-black uppercase text-muted-foreground mt-1.5 tracking-tighter">
                                        {msg.sender_role === 'user' ? 'Cliente' : 'Suporte (Você)'} • {format(parseISO(msg.created_at), "HH:mm")}
                                    </span>
                                </div>
                            ))
                        )}
                        <div ref={scrollRef} />
                    </div>
                </ScrollArea>

                {/* INPUT DE RESPOSTA */}
                <div className="p-6 border-t bg-slate-50/50 dark:bg-slate-900/30">
                    <div className="max-w-3xl mx-auto relative">
                        <Textarea 
                            value={replyText}
                            onChange={(e) => setReplyText(e.target.value)}
                            placeholder="Escreva sua orientação para o cliente..."
                            className="rounded-[2rem] pr-16 bg-white dark:bg-slate-950 border-slate-200 min-h-[100px] resize-none"
                        />
                        <Button 
                            onClick={handleSendReply}
                            disabled={replyMutation.isPending || !replyText.trim()}
                            className="absolute bottom-4 right-4 h-12 w-12 rounded-full bg-primary shadow-xl p-0"
                        >
                            {replyMutation.isPending ? <Loader2 className="animate-spin" /> : <Send className="w-5 h-5" />}
                        </Button>
                    </div>
                </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-12 text-center space-y-4">
                <div className="w-20 h-20 bg-primary/5 rounded-[2.5rem] flex items-center justify-center">
                    <LifeBuoy className="w-10 h-10 text-primary opacity-20" />
                </div>
                <h3 className="text-xl font-black uppercase tracking-tight text-slate-300">Selecione um chamado</h3>
                <p className="text-sm text-slate-400 max-w-xs">Robson, escolha um ticket à esquerda para iniciar o atendimento.</p>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default AdminTickets;