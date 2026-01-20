import AdminLayout from "@/components/layout/AdminLayout";
import { useAdminTickets, useAdminTicketMessages, useAdminReply, useAdminUpdateStatus } from "@/hooks/use-admin-support";
import { useState, useRef, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Send, User, LifeBuoy, CheckCircle2, Construction, Mail, ShieldCheck } from "lucide-react";
import { format, parseISO } from "date-fns";
import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";
import { showSuccess, showError } from "@/utils/toast";
import { Link } from "react-router-dom";

const AdminTickets = () => {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [replyText, setReplyText] = useState("");
  const [filter, setFilter] = useState<'open' | 'resolved' | 'all'>('open');
  
  const { data: tickets, isLoading: loadingTickets, error: ticketsError } = useAdminTickets();
  const { data: messages, isLoading: loadingMessages } = useAdminTicketMessages(selectedId || undefined);
  const replyMutation = useAdminReply();
  const statusMutation = useAdminUpdateStatus();
  
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Se houver erro de RLS ou conexão, mostramos feedback
  if (ticketsError) {
      return (
          <AdminLayout>
              <div className="flex items-center justify-center h-full p-10 text-center flex-col gap-4">
                  <AlertCircle className="w-12 h-12 text-red-500" />
                  <h2 className="text-xl font-black uppercase text-white">Falha Crítica de Dados</h2>
                  <p className="text-slate-400 max-w-md">O banco de dados não permitiu carregar os chamados. Rode o SQL de resgate novamente ou verifique as permissões de Robson.</p>
                  <Button variant="outline" className="border-slate-700 text-slate-300" onClick={() => window.location.reload()}>Tentar Recarregar</Button>
              </div>
          </AdminLayout>
      );
  }

  const selectedTicket = tickets?.find(t => t.id === selectedId);
  const filteredTickets = tickets?.filter(t => filter === 'all' ? true : (filter === 'open' ? t.status === 'open' : t.status !== 'open')) || [];

  const handleSendReply = async () => {
    if (!replyText.trim() || !selectedId) return;
    try {
      await replyMutation.mutateAsync({ ticketId: selectedId, message: replyText });
      setReplyText("");
      showSuccess("Resposta enviada!");
    } catch (err) { showError("Erro ao enviar resposta."); }
  };

  return (
    <AdminLayout>
      <div className="flex h-full bg-slate-950 overflow-hidden">
        
        {/* COLUNA ESQUERDA: LISTA DE TICKETS (CYBER DARK) */}
        <div className="w-80 sm:w-96 border-r border-slate-800 flex flex-col bg-slate-900/50 backdrop-blur-md">
            <div className="p-6 border-b border-slate-800 space-y-4">
                <div className="flex items-center justify-between">
                    <h2 className="text-xs font-black uppercase tracking-widest text-slate-400">Central de Chamados</h2>
                    <Badge className="bg-purple-600 text-white border-none text-[9px] px-2">{filteredTickets.length}</Badge>
                </div>
                <div className="flex gap-1 p-1 bg-slate-800/80 rounded-xl border border-slate-700">
                    {(['open', 'resolved', 'all'] as const).map(f => (
                        <button 
                            key={f} 
                            onClick={() => setFilter(f)} 
                            className={cn(
                                "flex-1 py-1.5 text-[9px] font-black uppercase rounded-lg transition-all", 
                                filter === f ? "bg-slate-700 text-white shadow-lg" : "text-slate-500 hover:text-slate-300"
                            )}
                        >
                            {f === 'open' ? 'Abertos' : f === 'resolved' ? 'Respondidos' : 'Todos'}
                        </button>
                    ))}
                </div>
            </div>

            <ScrollArea className="flex-1">
                {loadingTickets ? (
                    <div className="p-10 text-center"><Loader2 className="animate-spin mx-auto text-white" /></div>
                ) : filteredTickets.length === 0 ? (
                    <div className="p-10 text-center opacity-20">
                        <LifeBuoy className="w-10 h-10 mx-auto mb-2" />
                        <p className="text-xs font-bold uppercase tracking-widest">Nenhum chamado</p>
                    </div>
                ) : (
                    filteredTickets.map(t => (
                        <div 
                            key={t.id} 
                            onClick={() => setSelectedId(t.id)}
                            className={cn(
                                "p-5 border-b border-slate-800/50 cursor-pointer transition-all hover:bg-white/5 relative group",
                                selectedId === t.id ? "bg-indigo-500/10 border-l-4 border-l-purple-600" : ""
                            )}
                        >
                            <div className="flex justify-between items-start mb-1">
                                <span className="text-[9px] font-black uppercase text-purple-400 tracking-tighter">{t.category}</span>
                                <span className="text-[9px] font-bold text-slate-500">{format(parseISO(t.created_at), "dd/MM HH:mm")}</span>
                            </div>
                            <h3 className="text-xs font-bold truncate text-slate-100">{t.subject}</h3>
                            <p className="text-[10px] text-slate-400 truncate mt-1">
                                {t.profiles?.first_name ? `${t.profiles.first_name} ${t.profiles.last_name || ''}` : 'Usuário Desconhecido'}
                            </p>
                            {t.status === 'open' && (
                                <div className="absolute top-1/2 right-4 -translate-y-1/2 w-1.5 h-1.5 bg-blue-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(59,130,246,0.8)]"></div>
                            )}
                        </div>
                    ))
                )}
            </ScrollArea>
        </div>

        {/* COLUNA DIREITA: JANELA DE CHAT (DARK) */}
        <div className="flex-1 flex flex-col bg-slate-950">
            {selectedTicket ? (
                <>
                    <header className="p-6 border-b border-slate-800 flex justify-between items-center bg-slate-900/20">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-[1.25rem] bg-slate-800 flex items-center justify-center border border-slate-700">
                                <User className="w-6 h-6 text-slate-400" />
                            </div>
                            <div>
                                <h2 className="text-sm font-black uppercase tracking-tight text-white">
                                    {selectedTicket.profiles?.first_name || 'Usuário'} {selectedTicket.profiles?.last_name || ''}
                                </h2>
                                <div className="flex items-center gap-3 text-[10px] font-bold uppercase text-slate-500 mt-0.5">
                                    <span className="flex items-center gap-1"><Mail className="w-3 h-3" /> {selectedTicket.profiles?.email || 'N/A'}</span>
                                    <Badge className="bg-emerald-500/20 text-emerald-400 border-none px-2 rounded-lg text-[8px] uppercase">{selectedTicket.profiles?.plan_type || 'FREE'}</Badge>
                                </div>
                            </div>
                        </div>
                        <div className="flex gap-2">
                            <Button variant="ghost" size="sm" className="rounded-xl h-10 font-black uppercase text-[10px] text-slate-400 hover:text-white" asChild>
                                <Link to="/obras">Investigar Obras</Link>
                            </Button>
                            <Button variant="secondary" size="sm" className="rounded-xl h-10 font-black uppercase text-[10px] bg-emerald-600/10 text-emerald-400 hover:bg-emerald-600/20 border-emerald-900/50" onClick={() => statusMutation.mutate({ ticketId: selectedTicket.id, status: 'closed' })}>
                                <CheckCircle2 className="w-4 h-4 mr-2" /> Resolver
                            </Button>
                        </div>
                    </header>

                    <ScrollArea className="flex-1 p-8">
                        <div className="max-w-3xl mx-auto space-y-6">
                            {loadingMessages ? (
                                <div className="flex justify-center p-10"><Loader2 className="animate-spin text-white" /></div>
                            ) : (
                                messages?.map((msg) => (
                                    <div key={msg.id} className={cn("flex flex-col max-w-[80%]", msg.sender_role === 'user' ? "items-start" : "ml-auto items-end")}>
                                        <div className={cn(
                                            "p-5 rounded-3xl text-sm font-medium shadow-2xl",
                                            msg.sender_role === 'user' 
                                                ? "bg-slate-800 text-slate-200 border border-slate-700 rounded-tl-none" 
                                                : "bg-purple-600 text-white rounded-tr-none shadow-purple-900/20"
                                        )}>
                                            {msg.message}
                                        </div>
                                        <span className="text-[9px] font-black uppercase text-slate-500 mt-2 tracking-widest px-1">
                                            {msg.sender_role === 'user' ? 'Cliente' : 'Você (Suporte)'} • {format(parseISO(msg.created_at), "HH:mm")}
                                        </span>
                                    </div>
                                ))
                            )}
                            <div ref={scrollRef} />
                        </div>
                    </ScrollArea>

                    <div className="p-6 border-t border-slate-800 bg-slate-900/30">
                        <div className="max-w-3xl mx-auto relative">
                            <Textarea 
                                value={replyText}
                                onChange={(e) => setReplyText(e.target.value)}
                                placeholder="Pressione Enter para enviar ou use o botão..."
                                className="rounded-[2rem] pr-16 bg-slate-900 border-slate-700 text-slate-100 min-h-[100px] resize-none focus:ring-purple-600"
                                onKeyDown={(e) => { if(e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSendReply(); } }}
                            />
                            <Button 
                                onClick={handleSendReply}
                                disabled={replyMutation.isPending || !replyText.trim()}
                                className="absolute bottom-4 right-4 h-12 w-12 rounded-full bg-purple-600 shadow-xl p-0 hover:bg-purple-700 transition-all hover:scale-110 active:scale-95"
                            >
                                {replyMutation.isPending ? <Loader2 className="animate-spin" /> : <Send className="w-5 h-5 text-white" />}
                            </Button>
                        </div>
                    </div>
                </>
            ) : (
                <div className="flex-1 flex flex-col items-center justify-center p-20 text-center space-y-6">
                    <div className="w-24 h-24 bg-slate-900 rounded-[3rem] border border-slate-800 flex items-center justify-center shadow-2xl">
                        <LifeBuoy className="w-10 h-10 text-purple-600 opacity-40 animate-pulse" />
                    </div>
                    <div>
                        <h3 className="text-xl font-black uppercase tracking-tight text-slate-200">Terminal de Suporte</h3>
                        <p className="text-sm text-slate-500 max-w-xs mx-auto mt-2">Selecione um chamado à esquerda para carregar o canal de comunicação criptografado.</p>
                    </div>
                </div>
            )}
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminTickets;