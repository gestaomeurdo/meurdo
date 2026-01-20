import AdminLayout from "@/components/layout/AdminLayout";
import { useAdminTickets, useAdminTicketMessages, useAdminReply, useAdminUpdateStatus } from "@/hooks/use-admin-support";
import { useState, useRef, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Send, User, LifeBuoy, CheckCircle2, Construction, Mail, Smartphone, ShieldCheck } from "lucide-react";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";
import { showSuccess, showError } from "@/utils/toast";
import { Link } from "react-router-dom";

const AdminTickets = () => {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [replyText, setReplyText] = useState("");
  const [filter, setFilter] = useState<'open' | 'resolved' | 'all'>('open');
  
  const { data: tickets, isLoading: loadingTickets } = useAdminTickets();
  const { data: messages, isLoading: loadingMessages } = useAdminTicketMessages(selectedId || undefined);
  const replyMutation = useAdminReply();
  const statusMutation = useAdminUpdateStatus();
  
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const selectedTicket = tickets?.find(t => t.id === selectedId);
  const filteredTickets = tickets?.filter(t => filter === 'all' ? true : (filter === 'open' ? t.status === 'open' : t.status !== 'open')) || [];

  const handleSendReply = async () => {
    if (!replyText.trim() || !selectedId) return;
    try {
      await replyMutation.mutateAsync({ ticketId: selectedId, message: replyText });
      setReplyText("");
      showSuccess("Resposta enviada com sucesso!");
    } catch (err) { showError("Erro ao enviar resposta."); }
  };

  return (
    <AdminLayout>
      <div className="flex h-full bg-white dark:bg-slate-950 overflow-hidden">
        
        {/* COLUNA ESQUERDA: LISTA DE TICKETS */}
        <div className="w-80 sm:w-96 border-r flex flex-col bg-slate-50/50 dark:bg-slate-900/20">
            <div className="p-6 border-b space-y-4">
                <div className="flex items-center justify-between">
                    <h2 className="text-sm font-black uppercase tracking-widest text-slate-800 dark:text-white">Central de Chamados</h2>
                    <Badge className="bg-purple-600 text-white border-none text-[9px]">{filteredTickets.length}</Badge>
                </div>
                <div className="flex gap-1 p-1 bg-slate-200/50 dark:bg-slate-800 rounded-xl">
                    {(['open', 'resolved', 'all'] as const).map(f => (
                        <button 
                            key={f} 
                            onClick={() => setFilter(f)} 
                            className={cn(
                                "flex-1 py-1.5 text-[9px] font-black uppercase rounded-lg transition-all", 
                                filter === f ? "bg-white dark:bg-slate-700 text-purple-600 shadow-sm" : "text-slate-500"
                            )}
                        >
                            {f === 'open' ? 'Abertos' : f === 'resolved' ? 'Histórico' : 'Todos'}
                        </button>
                    ))}
                </div>
            </div>

            <ScrollArea className="flex-1">
                {loadingTickets ? (
                    <div className="p-10 text-center"><Loader2 className="animate-spin mx-auto text-purple-600" /></div>
                ) : filteredTickets.length === 0 ? (
                    <div className="p-10 text-center opacity-30">
                        <LifeBuoy className="w-10 h-10 mx-auto mb-2" />
                        <p className="text-xs font-bold uppercase">Nenhum chamado</p>
                    </div>
                ) : (
                    filteredTickets.map(t => (
                        <div 
                            key={t.id} 
                            onClick={() => setSelectedId(t.id)}
                            className={cn(
                                "p-5 border-b cursor-pointer transition-all hover:bg-white dark:hover:bg-slate-800/50 relative group",
                                selectedId === t.id ? "bg-white dark:bg-slate-800 border-l-4 border-l-purple-600" : ""
                            )}
                        >
                            <div className="flex justify-between items-start mb-1">
                                <span className="text-[9px] font-black uppercase text-purple-600">{t.category}</span>
                                <span className="text-[9px] font-bold text-slate-400">{format(parseISO(t.created_at), "dd/MM HH:mm")}</span>
                            </div>
                            <h3 className="text-xs font-bold truncate text-slate-800 dark:text-slate-100">{t.subject}</h3>
                            <p className="text-[10px] text-slate-500 truncate mt-1">{t.profiles.first_name} {t.profiles.last_name}</p>
                            {t.status === 'open' && (
                                <div className="absolute top-1/2 right-4 -translate-y-1/2 w-2 h-2 bg-blue-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(59,130,246,0.5)]"></div>
                            )}
                        </div>
                    ))
                )}
            </ScrollArea>
        </div>

        {/* COLUNA DIREITA: JANELA DE CHAT */}
        <div className="flex-1 flex flex-col bg-white dark:bg-slate-950">
            {selectedTicket ? (
                <>
                    {/* CABEÇALHO DO CHAT */}
                    <header className="p-6 border-b flex justify-between items-center bg-slate-50/30 dark:bg-slate-900/30">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-[1.25rem] bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center border border-purple-200 dark:border-purple-800">
                                <User className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                            </div>
                            <div>
                                <h2 className="text-sm font-black uppercase tracking-tight text-slate-800 dark:text-white">
                                    {selectedTicket.profiles.first_name} {selectedTicket.profiles.last_name}
                                </h2>
                                <div className="flex items-center gap-3 text-[10px] font-bold uppercase text-muted-foreground mt-0.5">
                                    <span className="flex items-center gap-1"><Mail className="w-3 h-3" /> {selectedTicket.profiles.email}</span>
                                    <Badge className="bg-emerald-500/10 text-emerald-600 border-none px-2 rounded-lg text-[8px]">{selectedTicket.profiles.plan_type || 'FREE'}</Badge>
                                </div>
                            </div>
                        </div>
                        <div className="flex gap-2">
                            <Button variant="ghost" size="sm" className="rounded-xl h-10 font-black uppercase text-[10px]" asChild>
                                <Link to="/obras">Investigar Obras</Link>
                            </Button>
                            <Button variant="secondary" size="sm" className="rounded-xl h-10 font-black uppercase text-[10px] text-emerald-600" onClick={() => statusMutation.mutate({ ticketId: selectedTicket.id, status: 'closed' })}>
                                <CheckCircle2 className="w-4 h-4 mr-2" /> Resolvido
                            </Button>
                        </div>
                    </header>

                    {/* MENSAGENS */}
                    <ScrollArea className="flex-1 p-8">
                        <div className="max-w-3xl mx-auto space-y-6">
                            {loadingMessages ? (
                                <div className="flex justify-center p-10"><Loader2 className="animate-spin text-purple-600" /></div>
                            ) : (
                                messages?.map((msg) => (
                                    <div key={msg.id} className={cn("flex flex-col max-w-[80%]", msg.sender_role === 'user' ? "items-start" : "ml-auto items-end")}>
                                        <div className={cn(
                                            "p-5 rounded-3xl text-sm font-medium shadow-sm",
                                            msg.sender_role === 'user' 
                                                ? "bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-100 rounded-tl-none" 
                                                : "bg-purple-600 text-white rounded-tr-none"
                                        )}>
                                            {msg.message}
                                        </div>
                                        <span className="text-[9px] font-black uppercase text-slate-400 mt-2 tracking-widest">
                                            {msg.sender_role === 'user' ? 'Cliente' : 'Suporte (Você)'} • {format(parseISO(msg.created_at), "HH:mm")}
                                        </span>
                                    </div>
                                ))
                            )}
                            <div ref={scrollRef} />
                        </div>
                    </ScrollArea>

                    {/* INPUT */}
                    <div className="p-6 border-t bg-slate-50/50 dark:bg-slate-900/30">
                        <div className="max-w-3xl mx-auto relative">
                            <Textarea 
                                value={replyText}
                                onChange={(e) => setReplyText(e.target.value)}
                                placeholder="Digite sua resposta técnica aqui..."
                                className="rounded-[2rem] pr-16 bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 min-h-[100px] resize-none"
                            />
                            <Button 
                                onClick={handleSendReply}
                                disabled={replyMutation.isPending || !replyText.trim()}
                                className="absolute bottom-4 right-4 h-12 w-12 rounded-full bg-purple-600 shadow-xl p-0 hover:bg-purple-700 transition-all active:scale-95"
                            >
                                {replyMutation.isPending ? <Loader2 className="animate-spin" /> : <Send className="w-5 h-5 text-white" />}
                            </Button>
                        </div>
                    </div>
                </>
            ) : (
                <div className="flex-1 flex flex-col items-center justify-center p-20 text-center space-y-4">
                    <div className="w-24 h-24 bg-purple-50 dark:bg-purple-900/10 rounded-[3rem] flex items-center justify-center">
                        <LifeBuoy className="w-12 h-12 text-purple-600 opacity-20" />
                    </div>
                    <h3 className="text-xl font-black uppercase tracking-tight text-slate-300 dark:text-slate-800">Selecione um Chamado</h3>
                    <p className="text-sm text-slate-400 max-w-xs">Robson, escolha um ticket à esquerda para iniciar o atendimento ao cliente.</p>
                </div>
            )}
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminTickets;