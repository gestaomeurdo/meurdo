import AdminLayout from "@/components/layout/AdminLayout";
import { useAdminTickets, useAdminTicketMessages, useAdminReply, useAdminUpdateStatus } from "@/hooks/use-admin-support";
import { useState, useRef, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Send, User, LifeBuoy, CheckCircle2, Mail, ShieldCheck, AlertCircle, Clock, ChevronRight } from "lucide-react";
import { format, parseISO } from "date-fns";
import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";
import { showSuccess, showError } from "@/utils/toast";

const AdminTickets = () => {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [replyText, setReplyText] = useState("");
  const [filter, setFilter] = useState<'open' | 'resolved' | 'all'>('open');
  
  const { data: tickets, isLoading: loadingTickets, isError } = useAdminTickets();
  const { data: messages, isLoading: loadingMessages } = useAdminTicketMessages(selectedId || undefined);
  const replyMutation = useAdminReply();
  const statusMutation = useAdminUpdateStatus();
  
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  if (isError) {
      return (
          <AdminLayout>
              <div className="flex flex-col items-center justify-center h-full gap-6 text-center p-12 bg-slate-950">
                  <div className="p-6 bg-red-500/10 rounded-[2.5rem] border border-red-500/20"><AlertCircle className="w-12 h-12 text-red-500" /></div>
                  <div className="space-y-2">
                    <h2 className="text-2xl font-black uppercase text-white tracking-tighter">Erro de Comunicação SQL</h2>
                    <p className="text-slate-500 max-w-sm mx-auto text-sm font-medium">As permissões de Admin (RLS) foram negadas. Verifique se o e-mail de admin está correto.</p>
                  </div>
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
      showSuccess("Resposta enviada com sucesso!");
    } catch (err) { showError("Falha ao enviar resposta."); }
  };

  return (
    <AdminLayout>
      <div className="flex h-full bg-slate-950 overflow-hidden">
        
        {/* LISTA DE CHAMADOS - SLATE THEME */}
        <div className="w-80 sm:w-[400px] border-r border-slate-800 flex flex-col bg-slate-900/40 backdrop-blur-md">
            <div className="p-8 border-b border-slate-800 space-y-6">
                <div className="flex items-center justify-between">
                    <h2 className="text-sm font-black uppercase tracking-widest text-slate-400">Inbox Suporte</h2>
                    <Badge className="bg-blue-600 text-white border-none text-[10px] px-2.5 font-black">{filteredTickets.length}</Badge>
                </div>
                <div className="flex gap-1 p-1 bg-slate-800/50 rounded-xl border border-slate-700/50">
                    {(['open', 'resolved', 'all'] as const).map(f => (
                        <button 
                            key={f} 
                            onClick={() => setFilter(f)} 
                            className={cn(
                                "flex-1 py-2 text-[10px] font-black uppercase rounded-lg transition-all", 
                                filter === f ? "bg-slate-700 text-white shadow-lg" : "text-slate-500 hover:text-slate-300"
                            )}
                        >
                            {f === 'open' ? 'Novos' : f === 'resolved' ? 'Fim' : 'Tudo'}
                        </button>
                    ))}
                </div>
            </div>

            <ScrollArea className="flex-1">
                {loadingTickets ? (
                    <div className="p-12 text-center space-y-4">
                        <Loader2 className="animate-spin mx-auto text-blue-500" />
                        <p className="text-[10px] font-black uppercase text-slate-600 tracking-widest">Sincronizando Inbox...</p>
                    </div>
                ) : filteredTickets.map(t => (
                    <div 
                        key={t.id} 
                        onClick={() => setSelectedId(t.id)}
                        className={cn(
                            "p-6 border-b border-slate-800/50 cursor-pointer transition-all hover:bg-white/5 relative group",
                            selectedId === t.id ? "bg-blue-600/10 border-l-4 border-l-blue-600" : ""
                        )}
                    >
                        <div className="flex justify-between items-start mb-2">
                            <span className="text-[9px] font-black uppercase text-blue-400 tracking-tighter bg-blue-500/10 px-2 py-0.5 rounded-md border border-blue-500/20">{t.category}</span>
                            <span className="text-[9px] font-bold text-slate-500 uppercase flex items-center"><Clock className="w-2.5 h-2.5 mr-1" /> {format(parseISO(t.created_at), "dd MMM")}</span>
                        </div>
                        <h3 className="text-sm font-bold text-slate-100 line-clamp-1 mb-1">{t.subject}</h3>
                        <p className="text-[11px] text-slate-500 font-medium truncate uppercase tracking-tighter">
                            {t.profiles?.first_name || 'Usuário'} {t.profiles?.last_name || ''}
                        </p>
                        <ChevronRight className={cn("absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-700 transition-all", selectedId === t.id ? "text-blue-500 translate-x-1" : "group-hover:translate-x-1")} />
                    </div>
                ))}
            </ScrollArea>
        </div>

        {/* ÁREA DE CONVERSA - SLATE THEME */}
        <div className="flex-1 flex flex-col bg-slate-950">
            {selectedTicket ? (
                <>
                    <header className="p-8 border-b border-slate-800 flex justify-between items-center bg-slate-900/30 backdrop-blur-md">
                        <div className="flex items-center gap-5">
                            <div className="w-14 h-14 rounded-2xl bg-slate-800 flex items-center justify-center border border-slate-700 text-blue-500 shadow-xl">
                                <User className="w-7 h-7" />
                            </div>
                            <div>
                                <h2 className="text-xl font-black uppercase tracking-tight text-white leading-none mb-1">
                                    {selectedTicket.profiles?.first_name} {selectedTicket.profiles?.last_name}
                                </h2>
                                <div className="flex items-center gap-3">
                                    <p className="text-[10px] font-black uppercase text-slate-500 tracking-[0.1em]">{selectedTicket.profiles?.email}</p>
                                    <Badge className="bg-emerald-600/10 text-emerald-400 border-emerald-900/50 text-[8px] font-black px-2.5 uppercase">{selectedTicket.profiles?.plan_type || 'FREE'}</Badge>
                                </div>
                            </div>
                        </div>
                        <Button 
                            variant="secondary" 
                            size="sm" 
                            className="rounded-xl h-12 px-6 font-black uppercase text-[10px] tracking-widest bg-emerald-600/10 text-emerald-400 border-emerald-900/50 hover:bg-emerald-600 hover:text-white transition-all shadow-xl"
                            onClick={() => statusMutation.mutate({ ticketId: selectedTicket.id, status: 'closed' })}
                        >
                            <CheckCircle2 className="w-4 h-4 mr-2" /> Marcar Resolvido
                        </Button>
                    </header>

                    <ScrollArea className="flex-1 p-10 bg-gradient-to-b from-slate-950 to-slate-900">
                        <div className="max-w-3xl mx-auto space-y-8">
                            {messages?.map((msg) => (
                                <div key={msg.id} className={cn("flex flex-col max-w-[80%]", msg.sender_role === 'user' ? "items-start" : "ml-auto items-end")}>
                                    <div className={cn(
                                        "p-6 rounded-[2rem] text-sm font-medium shadow-2xl transition-all hover:scale-[1.01]",
                                        msg.sender_role === 'user' 
                                            ? "bg-slate-800 text-slate-100 border border-slate-700 rounded-tl-none" 
                                            : "bg-[#066abc] text-white rounded-tr-none shadow-blue-500/10"
                                    )}>
                                        {msg.message}
                                    </div>
                                    <span className="text-[9px] font-black uppercase text-slate-600 mt-3 tracking-widest flex items-center gap-2">
                                        {msg.sender_role === 'user' ? <User className="w-2.5 h-2.5" /> : <ShieldCheck className="w-2.5 h-2.5" />}
                                        {msg.sender_role === 'user' ? 'Cliente' : 'Suporte (Robson)'} • {format(parseISO(msg.created_at), "HH:mm")}
                                    </span>
                                </div>
                            ))}
                            <div ref={scrollRef} />
                        </div>
                    </ScrollArea>

                    {/* INPUT REESTILIZADO */}
                    <div className="p-8 border-t border-slate-800 bg-slate-900/50">
                        <div className="max-w-3xl mx-auto relative group">
                            <Textarea 
                                value={replyText}
                                onChange={(e) => setReplyText(e.target.value)}
                                placeholder="Pressione Enter para enviar resposta..."
                                className="rounded-[2.5rem] pr-20 bg-slate-900 border-slate-700 text-slate-100 min-h-[100px] p-6 focus:ring-blue-600 focus:border-blue-600 transition-all resize-none shadow-inner"
                                onKeyDown={(e) => { if(e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSendReply(); } }}
                            />
                            <Button 
                                onClick={handleSendReply} 
                                disabled={replyMutation.isPending || !replyText.trim()} 
                                className="absolute bottom-5 right-5 h-12 w-12 rounded-2xl bg-blue-600 hover:bg-blue-500 shadow-xl transition-all active:scale-95 flex items-center justify-center p-0"
                            >
                                {replyMutation.isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5 text-white" />}
                            </Button>
                        </div>
                        <p className="text-center text-[9px] font-bold text-slate-600 uppercase tracking-widest mt-4">Atendimento Premium • Suporte Meu RDO</p>
                    </div>
                </>
            ) : (
                <div className="flex-1 flex flex-col items-center justify-center p-20 text-center space-y-6">
                    <div className="w-24 h-24 bg-slate-900 rounded-[2.5rem] border border-slate-800 flex items-center justify-center text-slate-800 animate-pulse">
                        <LifeBuoy className="w-12 h-12" />
                    </div>
                    <div className="space-y-2">
                        <h3 className="text-xl font-black uppercase tracking-[0.2em] text-slate-700">Inbox Vazia</h3>
                        <p className="text-sm font-medium text-slate-600 max-w-xs mx-auto uppercase tracking-tighter">Selecione um chamado à esquerda para iniciar a conversa.</p>
                    </div>
                </div>
            )}
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminTickets;