import AdminLayout from "@/components/layout/AdminLayout";
import { useAuth } from "@/integrations/supabase/auth-provider";
import { useAdminTickets, useAdminTicketMessages, useAdminReply, useAdminUpdateStatus } from "@/hooks/use-admin-support";
import { useState, useRef, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Send, User, LifeBuoy, CheckCircle2, Search, ShieldCheck, Mail, Construction, Smartphone, Briefcase, Zap } from "lucide-react";
import { format, parseISO } from "date-fns";
import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";
import { showSuccess, showError } from "@/utils/toast";
import { Link } from "react-router-dom";

const AdminTickets = () => {
  const { user } = useAuth();
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

  const selectedTicket = tickets?.find(t => t.id === selectedTicketId);
  const filteredTickets = tickets?.filter(t => filter === 'all' ? true : t.status === filter) || [];

  const handleSendReply = async () => {
    if (!replyText.trim() || !selectedTicketId) return;
    try {
      await replyMutation.mutateAsync({ ticketId: selectedTicketId, message: replyText });
      setReplyText("");
      showSuccess("Resposta enviada!");
    } catch (err) { showError("Erro ao enviar."); }
  };

  return (
    <AdminLayout>
      <div className="flex h-[calc(100vh-140px)] border bg-white rounded-[2.5rem] shadow-clean overflow-hidden">
        
        {/* LISTA DE CHAT */}
        <div className="w-80 border-r flex flex-col bg-slate-50/50">
            <div className="p-6 border-b space-y-4">
                <h2 className="text-sm font-black uppercase tracking-widest text-slate-800">Inbox Suporte</h2>
                <div className="flex gap-1 p-1 bg-slate-200/50 rounded-xl">
                    {['open', 'resolved', 'all'].map(f => (
                        <button key={f} onClick={() => setFilter(f as any)} className={cn("flex-1 py-1.5 text-[9px] font-black uppercase rounded-lg transition-all", filter === f ? "bg-white text-purple-600 shadow-sm" : "text-slate-500")}>
                            {f === 'open' ? 'Abertos' : f === 'resolved' ? 'Respondidos' : 'Todos'}
                        </button>
                    ))}
                </div>
            </div>
            <ScrollArea className="flex-1">
                {filteredTickets.map(t => (
                    <div key={t.id} onClick={() => setSelectedTicketId(t.id)} className={cn("p-5 border-b cursor-pointer transition-all hover:bg-white relative", selectedTicketId === t.id ? "bg-white border-l-4 border-l-purple-600" : "")}>
                        <div className="flex justify-between items-center mb-1">
                            <span className="text-[9px] font-black uppercase text-purple-600">{t.category}</span>
                            <span className="text-[9px] font-bold text-slate-400">{format(parseISO(t.created_at), "dd/MM")}</span>
                        </div>
                        <h3 className="text-xs font-bold truncate">{t.subject}</h3>
                        <p className="text-[10px] text-slate-500 truncate mt-1">{t.profiles.first_name} {t.profiles.last_name}</p>
                        {t.status === 'open' && <div className="absolute top-1/2 right-4 -translate-y-1/2 w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>}
                    </div>
                ))}
            </ScrollArea>
        </div>

        {/* CHAT + PERFIL LATERAL */}
        <div className="flex-1 flex overflow-hidden">
            {selectedTicket ? (
                <>
                    <div className="flex-1 flex flex-col bg-white">
                        <header className="p-6 border-b flex justify-between items-center bg-slate-50/20">
                            <div>
                                <h2 className="text-lg font-black uppercase tracking-tight">{selectedTicket.subject}</h2>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Protocolo: #{selectedTicket.id.slice(0,8)}</p>
                            </div>
                            <Button variant="secondary" size="sm" className="rounded-xl h-10 font-black uppercase text-[10px] text-emerald-600" onClick={() => statusMutation.mutate({ ticketId: selectedTicket.id, status: 'closed' })}>
                                <CheckCircle2 className="w-3.5 h-3.5 mr-2" /> Resolvido
                            </Button>
                        </header>

                        <ScrollArea className="flex-1 p-8">
                            <div className="space-y-6">
                                {messages?.map((msg) => (
                                    <div key={msg.id} className={cn("flex flex-col max-w-[80%]", msg.sender_role === 'user' ? "items-start" : "ml-auto items-end")}>
                                        <div className={cn("p-5 rounded-3xl text-sm font-medium", msg.sender_role === 'user' ? "bg-slate-100 rounded-tl-none" : "bg-purple-600 text-white rounded-tr-none shadow-lg shadow-purple-900/10")}>
                                            {msg.message}
                                        </div>
                                        <span className="text-[9px] font-black uppercase text-slate-400 mt-2">{msg.sender_role === 'user' ? 'Cliente' : 'Suporte (Robson)'} • {format(parseISO(msg.created_at), "HH:mm")}</span>
                                    </div>
                                ))}
                                <div ref={scrollRef} />
                            </div>
                        </ScrollArea>

                        <div className="p-6 border-t bg-slate-50/30">
                            <div className="relative">
                                <Textarea value={replyText} onChange={(e) => setReplyText(e.target.value)} placeholder="Sua resposta para o cliente..." className="rounded-[2rem] pr-16 bg-white border-slate-200 min-h-[100px]" />
                                <Button onClick={handleSendReply} disabled={replyMutation.isPending || !replyText.trim()} className="absolute bottom-4 right-4 h-12 w-12 rounded-full bg-purple-600 shadow-xl p-0 hover:bg-purple-700">
                                    {replyMutation.isPending ? <Loader2 className="animate-spin" /> : <Send className="w-5 h-5" />}
                                </Button>
                            </div>
                        </div>
                    </div>

                    {/* MINI PERFIL DO CLIENTE */}
                    <div className="w-72 bg-slate-50 border-l p-8 space-y-8 hidden xl:block">
                        <div className="text-center space-y-4">
                            <div className="w-20 h-20 bg-purple-100 rounded-[2rem] flex items-center justify-center text-purple-600 font-black text-2xl mx-auto border-4 border-white shadow-xl">
                                {selectedTicket.profiles.first_name?.[0]}
                            </div>
                            <div>
                                <h4 className="font-black uppercase tracking-tight text-slate-800">{selectedTicket.profiles.first_name} {selectedTicket.profiles.last_name}</h4>
                                <Badge className={cn("mt-2 text-[9px] font-black uppercase px-3 border-none", selectedTicket.profiles.plan_type === 'pro' ? "bg-emerald-500" : "bg-slate-300")}>
                                    Plano {selectedTicket.profiles.plan_type || 'FREE'}
                                </Badge>
                            </div>
                        </div>

                        <div className="space-y-4 pt-6 border-t">
                            <div className="flex items-center gap-3 text-slate-600">
                                <Mail className="w-4 h-4 text-slate-400" />
                                <span className="text-[10px] font-bold truncate">{selectedTicket.profiles.email}</span>
                            </div>
                            <div className="flex items-center gap-3 text-slate-600">
                                <Construction className="w-4 h-4 text-slate-400" />
                                <span className="text-[10px] font-bold">Investigar Obras</span>
                            </div>
                        </div>

                        <Button variant="outline" className="w-full rounded-2xl h-14 border-slate-200 bg-white font-black uppercase text-[10px] tracking-widest text-slate-600 hover:bg-slate-100" asChild>
                            <Link to="/dashboard">Entrar como Usuário</Link>
                        </Button>
                    </div>
                </>
            ) : (
                <div className="flex-1 flex flex-col items-center justify-center p-20 text-center opacity-30">
                    <LifeBuoy className="w-20 h-20 mb-4" />
                    <p className="font-black uppercase tracking-widest text-xs">Selecione um chamado Robson</p>
                </div>
            )}
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminTickets;