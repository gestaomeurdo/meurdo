import AdminLayout from "@/components/layout/AdminLayout";
import { useAdminTickets, useAdminTicketMessages, useAdminReply, useAdminUpdateStatus } from "@/hooks/use-admin-support";
import { useState, useRef, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Send, User, LifeBuoy, CheckCircle2, Mail, ShieldCheck, AlertCircle } from "lucide-react";
import { format, parseISO } from "date-fns";
import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";
import { showSuccess, showError } from "@/utils/toast";
import { Link } from "react-router-dom";

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
              <div className="flex flex-col items-center justify-center h-full gap-4 text-center p-10">
                  <AlertCircle className="w-12 h-12 text-red-500" />
                  <h2 className="text-xl font-black uppercase">Bloqueio de Banco de Dados</h2>
                  <p className="text-slate-400 max-w-sm">Suas credenciais admin não foram reconhecidas pelo RLS.</p>
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
    } catch (err) { showError("Erro ao enviar."); }
  };

  return (
    <AdminLayout>
      <div className="flex h-full bg-slate-950 overflow-hidden">
        
        {/* LISTA DE TICKETS */}
        <div className="w-80 sm:w-96 border-r border-slate-800 flex flex-col bg-slate-900/40">
            <div className="p-6 border-b border-slate-800 space-y-4">
                <div className="flex items-center justify-between">
                    <h2 className="text-xs font-black uppercase tracking-widest text-slate-400">Inbox Suporte</h2>
                    <Badge className="bg-[#066abc] text-white border-none text-[9px] px-2">{filteredTickets.length}</Badge>
                </div>
                <div className="flex gap-1 p-1 bg-slate-800 rounded-lg">
                    {(['open', 'resolved', 'all'] as const).map(f => (
                        <button key={f} onClick={() => setFilter(f)} className={cn("flex-1 py-1.5 text-[9px] font-black uppercase rounded transition-all", filter === f ? "bg-slate-700 text-white" : "text-slate-500")}>
                            {f === 'open' ? 'Novos' : f === 'resolved' ? 'Fim' : 'Todos'}
                        </button>
                    ))}
                </div>
            </div>

            <ScrollArea className="flex-1">
                {loadingTickets ? (
                    <div className="p-10 text-center"><Loader2 className="animate-spin mx-auto text-[#066abc]" /></div>
                ) : filteredTickets.map(t => (
                    <div 
                        key={t.id} 
                        onClick={() => setSelectedId(t.id)}
                        className={cn(
                            "p-5 border-b border-slate-800/50 cursor-pointer transition-all hover:bg-white/5 relative",
                            selectedId === t.id ? "bg-blue-500/10 border-l-4 border-l-[#066abc]" : ""
                        )}
                    >
                        <div className="flex justify-between items-start mb-1">
                            <span className="text-[9px] font-black uppercase text-[#066abc] tracking-tighter">{t.category}</span>
                            <span className="text-[9px] font-bold text-slate-500">{format(parseISO(t.created_at), "dd/MM")}</span>
                        </div>
                        <h3 className="text-xs font-bold truncate text-slate-100">{t.subject}</h3>
                        <p className="text-[10px] text-slate-500 truncate mt-1">{t.profiles?.first_name || 'Usuário'} {t.profiles?.last_name || ''}</p>
                    </div>
                ))}
            </ScrollArea>
        </div>

        {/* CHAT */}
        <div className="flex-1 flex flex-col">
            {selectedTicket ? (
                <>
                    <header className="p-6 border-b border-slate-800 flex justify-between items-center bg-slate-900/20">
                        <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center border border-slate-700 text-slate-400">
                                <User className="w-5 h-5" />
                            </div>
                            <div>
                                <h2 className="text-sm font-black uppercase tracking-tight text-white">{selectedTicket.profiles?.first_name} {selectedTicket.profiles?.last_name}</h2>
                                <p className="text-[10px] font-bold uppercase text-slate-500 tracking-widest">{selectedTicket.profiles?.email}</p>
                            </div>
                        </div>
                        <Button variant="secondary" size="sm" className="rounded-lg h-9 font-black uppercase text-[10px] bg-emerald-600/10 text-emerald-400 border-emerald-900/50" onClick={() => statusMutation.mutate({ ticketId: selectedTicket.id, status: 'closed' })}>
                            <CheckCircle2 className="w-4 h-4 mr-2" /> Resolvido
                        </Button>
                    </header>

                    <ScrollArea className="flex-1 p-8">
                        <div className="max-w-2xl mx-auto space-y-6">
                            {messages?.map((msg) => (
                                <div key={msg.id} className={cn("flex flex-col max-w-[85%]", msg.sender_role === 'user' ? "items-start" : "ml-auto items-end")}>
                                    <div className={cn(
                                        "p-4 rounded-2xl text-sm font-medium shadow-sm",
                                        msg.sender_role === 'user' 
                                            ? "bg-slate-800 text-slate-200 border border-slate-700 rounded-tl-none" 
                                            : "bg-[#066abc] text-white rounded-tr-none"
                                    )}>
                                        {msg.message}
                                    </div>
                                    <span className="text-[8px] font-black uppercase text-slate-500 mt-2 tracking-widest">
                                        {msg.sender_role === 'user' ? 'Cliente' : 'Suporte'} • {format(parseISO(msg.created_at), "HH:mm")}
                                    </span>
                                </div>
                            ))}
                            <div ref={scrollRef} />
                        </div>
                    </ScrollArea>

                    <div className="p-6 border-t border-slate-800 bg-slate-900/30">
                        <div className="max-w-2xl mx-auto relative">
                            <Textarea 
                                value={replyText}
                                onChange={(e) => setReplyText(e.target.value)}
                                placeholder="Pressione Enter para responder..."
                                className="rounded-2xl pr-16 bg-slate-900 border-slate-700 text-slate-100 min-h-[80px] resize-none"
                                onKeyDown={(e) => { if(e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSendReply(); } }}
                            />
                            <Button onClick={handleSendReply} disabled={replyMutation.isPending || !replyText.trim()} className="absolute bottom-3 right-3 h-10 w-10 rounded-xl bg-[#066abc]">
                                <Send className="w-4 h-4 text-white" />
                            </Button>
                        </div>
                    </div>
                </>
            ) : (
                <div className="flex-1 flex flex-col items-center justify-center p-20 text-center opacity-20">
                    <LifeBuoy className="w-12 h-12 text-slate-400 mb-4" />
                    <p className="text-xs font-black uppercase tracking-widest">Nenhum chamado selecionado</p>
                </div>
            )}
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminTickets;