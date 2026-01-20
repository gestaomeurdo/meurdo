import AdminLayout from "@/components/layout/AdminLayout";
import { useAdminInbox, useAdminChatMessages, useAdminReply } from "@/hooks/use-admin-support";
import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Send, User, MessageSquare, Search, ShieldCheck } from "lucide-react";
import { format, parseISO } from "date-fns";
import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { useLocation } from "react-router-dom";

const AdminTickets = () => {
  const location = useLocation();
  const [selectedUserId, setSelectedUserId] = useState<string | null>(location.state?.userId || null);
  const [replyText, setReplyText] = useState("");
  const [search, setSearch] = useState("");
  
  const { data: conversations, isLoading: loadingInbox } = useAdminInbox();
  const { data: messages, isLoading: loadingMessages } = useAdminChatMessages(selectedUserId || undefined);
  const replyMutation = useAdminReply();
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const filteredConversations = conversations?.filter(c => 
    c.first_name?.toLowerCase().includes(search.toLowerCase()) ||
    c.last_name?.toLowerCase().includes(search.toLowerCase())
  );

  const selectedUser = conversations?.find(c => c.id === selectedUserId);

  const handleSendReply = async () => {
    if (!replyText.trim() || !selectedUserId) return;
    try {
      await replyMutation.mutateAsync({ userId: selectedUserId, message: replyText });
      setReplyText("");
    } catch (err) {}
  };

  return (
    <AdminLayout>
      <div className="flex h-[calc(100vh-4px)] bg-slate-950 overflow-hidden">
        
        {/* LISTA DE CONVERSAS (ESQUERDA) */}
        <div className="w-80 sm:w-[380px] border-r border-slate-800 flex flex-col bg-slate-900/40">
            <div className="p-6 border-b border-slate-800 space-y-4">
                <h2 className="text-xl font-black uppercase tracking-tight text-white flex items-center gap-3">
                    <MessageSquare className="w-6 h-6 text-blue-500" /> Mensagens
                </h2>
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                    <Input 
                        placeholder="Buscar engenheiro..." 
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="pl-9 h-10 bg-slate-800 border-slate-700 text-white rounded-xl text-xs" 
                    />
                </div>
            </div>

            <ScrollArea className="flex-1">
                {loadingInbox ? (
                    <div className="p-12 text-center"><Loader2 className="animate-spin mx-auto text-blue-500" /></div>
                ) : filteredConversations?.length === 0 ? (
                    <div className="p-8 text-center text-slate-500 text-xs font-bold uppercase">Nenhuma conversa ativa.</div>
                ) : filteredConversations?.map((room) => (
                    <div 
                        key={room.id} 
                        onClick={() => setSelectedUserId(room.id)}
                        className={cn(
                            "p-5 border-b border-slate-800/50 cursor-pointer transition-all hover:bg-white/5 relative group",
                            selectedUserId === room.id ? "bg-blue-600/10 border-l-4 border-l-blue-600" : ""
                        )}
                    >
                        <div className="flex justify-between items-start mb-1">
                            <span className="text-[9px] font-black uppercase text-blue-400 tracking-widest">{room.plan_type || 'FREE'}</span>
                            <span className="text-[9px] font-bold text-slate-500">
                                {room.last_message_at ? format(parseISO(room.last_message_at), "dd/MM") : '--'}
                            </span>
                        </div>
                        <h3 className="text-sm font-bold text-slate-100 truncate">{room.first_name} {room.last_name}</h3>
                        <p className="text-[10px] text-slate-500 mt-1 truncate">ID: {room.id.slice(0, 8)}...</p>
                    </div>
                ))}
            </ScrollArea>
        </div>

        {/* ÁREA DE CHAT (DIREITA) */}
        <div className="flex-1 flex flex-col bg-slate-950 relative">
            {selectedUserId ? (
                <>
                    <header className="p-6 border-b border-slate-800 bg-slate-900/30 flex justify-between items-center backdrop-blur-md">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-2xl bg-slate-800 flex items-center justify-center border border-slate-700 text-blue-500 shadow-lg">
                                <User className="w-6 h-6" />
                            </div>
                            <div>
                                <h2 className="text-lg font-black uppercase tracking-tight text-white leading-none mb-1">
                                    {selectedUser?.first_name} {selectedUser?.last_name}
                                </h2>
                                <p className="text-[10px] font-bold uppercase text-slate-500 tracking-widest">
                                    Engenheiro {selectedUser?.plan_type === 'pro' ? 'Premium' : 'Básico'}
                                </p>
                            </div>
                        </div>
                    </header>

                    <ScrollArea className="flex-1 p-8 sm:p-12">
                        <div className="max-w-4xl mx-auto space-y-8">
                            {loadingMessages ? (
                                <div className="flex justify-center p-12"><Loader2 className="animate-spin text-blue-500" /></div>
                            ) : !messages || messages.length === 0 ? (
                                <div className="flex flex-col items-center justify-center p-20 text-center space-y-4 opacity-30">
                                    <div className="p-8 bg-slate-800 rounded-full"><MessageSquare className="w-12 h-12 text-slate-500" /></div>
                                    <p className="font-bold uppercase text-xs tracking-widest text-white">Nenhuma mensagem. Mande a primeira!</p>
                                </div>
                            ) : (
                                messages.map((msg) => (
                                    <div key={msg.id} className={cn("flex flex-col max-w-[80%]", msg.sender_role === 'user' ? "items-start" : "ml-auto items-end")}>
                                        <div className={cn(
                                            "p-5 rounded-3xl text-sm font-medium shadow-xl",
                                            msg.sender_role === 'user' 
                                                ? "bg-slate-800 text-slate-100 border border-slate-700 rounded-tl-none" 
                                                : "bg-blue-600 text-white rounded-tr-none shadow-blue-500/20"
                                        )}>
                                            {msg.message}
                                        </div>
                                        <span className="text-[9px] font-black uppercase text-slate-600 mt-2 tracking-widest">
                                            {msg.sender_role === 'user' ? 'Cliente' : 'Robson (Você)'} • {format(parseISO(msg.created_at), "HH:mm")}
                                        </span>
                                    </div>
                                ))
                            )}
                            <div ref={scrollRef} />
                        </div>
                    </ScrollArea>

                    <div className="p-8 border-t border-slate-800 bg-slate-900/50">
                        <div className="max-w-4xl mx-auto relative">
                            <Textarea 
                                value={replyText}
                                onChange={(e) => setReplyText(e.target.value)}
                                placeholder="Responda diretamente ao engenheiro..."
                                className="rounded-[2.5rem] pr-20 bg-slate-900 border-slate-700 text-white min-h-[100px] p-6 focus:ring-blue-600 resize-none shadow-inner"
                                onKeyDown={(e) => { if(e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSendReply(); } }}
                            />
                            <Button 
                                onClick={handleSendReply} 
                                disabled={replyMutation.isPending || !replyText.trim()} 
                                className="absolute bottom-6 right-6 h-12 w-12 rounded-full bg-blue-600 hover:bg-blue-500 shadow-xl transition-all p-0"
                            >
                                {replyMutation.isPending ? <Loader2 className="animate-spin" /> : <Send className="w-5 h-5 text-white" />}
                            </Button>
                        </div>
                    </div>
                </>
            ) : (
                <div className="flex-1 flex flex-col items-center justify-center p-20 text-center space-y-6 opacity-30">
                    <div className="p-10 bg-slate-900 rounded-[3rem] border border-slate-800">
                        <MessageSquare className="w-20 h-20 text-slate-500" />
                    </div>
                    <div className="space-y-1">
                        <h3 className="text-2xl font-black uppercase tracking-widest text-slate-400">Selecione um Cliente</h3>
                        <p className="text-sm font-medium text-slate-600">Escolha um engenheiro à esquerda para iniciar o atendimento.</p>
                    </div>
                </div>
            )}
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminTickets;