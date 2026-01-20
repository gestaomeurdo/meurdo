import AdminLayout from "@/components/layout/AdminLayout";
import { useAdminInbox, useAdminChatMessages, useAdminReply } from "@/hooks/use-admin-support";
import { useState, useRef, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Send, User, MessageSquare, ShieldCheck, Mail, ChevronRight, Clock, Construction } from "lucide-react";
import { format, parseISO } from "date-fns";
import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";
import { showSuccess, showError } from "@/utils/toast";
import { Link, useLocation } from "react-router-dom";

const AdminTickets = () => {
  const location = useLocation();
  const [selectedId, setSelectedId] = useState<string | null>(location.state?.ticketId || null);
  const [replyText, setReplyText] = useState("");
  
  const { data: chatRooms, isLoading: loadingRooms } = useAdminInbox();
  const { data: messages, isLoading: loadingMessages } = useAdminChatMessages(selectedId || undefined);
  const replyMutation = useAdminReply();
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const selectedRoom = chatRooms?.find(r => r.id === selectedId);

  const handleSendReply = async () => {
    if (!replyText.trim() || !selectedId) return;
    try {
      await replyMutation.mutateAsync({ ticketId: selectedId, message: replyText });
      setReplyText("");
    } catch (err) { showError("Erro ao enviar."); }
  };

  return (
    <AdminLayout>
      <div className="flex h-full bg-slate-950 overflow-hidden">
        
        {/* LISTA DE CONVERSAS (LEFT) */}
        <div className="w-80 sm:w-[350px] border-r border-slate-800 flex flex-col bg-slate-900/40">
            <div className="p-8 border-b border-slate-800">
                <h2 className="text-xl font-black uppercase tracking-tight text-white flex items-center gap-3">
                    <MessageSquare className="w-6 h-6 text-blue-500" /> Inbox
                </h2>
            </div>

            <ScrollArea className="flex-1">
                {loadingRooms ? (
                    <div className="p-12 text-center"><Loader2 className="animate-spin mx-auto text-blue-500" /></div>
                ) : chatRooms?.map(room => (
                    <div 
                        key={room.id} 
                        onClick={() => setSelectedId(room.id)}
                        className={cn(
                            "p-6 border-b border-slate-800/50 cursor-pointer transition-all hover:bg-white/5 relative group",
                            selectedId === room.id ? "bg-blue-600/10 border-l-4 border-l-blue-600" : ""
                        )}
                    >
                        <div className="flex justify-between items-start mb-1">
                            <span className="text-[10px] font-black uppercase text-blue-400">{room.plan_type}</span>
                            <span className="text-[9px] font-bold text-slate-500">{format(parseISO(room.created_at), "dd/MM")}</span>
                        </div>
                        <h3 className="text-sm font-bold text-slate-100 truncate">{room.user_name}</h3>
                        <p className="text-[10px] text-slate-500 mt-1 truncate">{room.user_email}</p>
                        {room.status === 'open' && (
                            <div className="absolute top-1/2 right-4 -translate-y-1/2 w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                        )}
                    </div>
                ))}
            </ScrollArea>
        </div>

        {/* ÁREA DE CHAT (RIGHT) */}
        <div className="flex-1 flex flex-col bg-slate-950 relative">
            {selectedRoom ? (
                <>
                    <header className="p-6 border-b border-slate-800 bg-slate-900/30 flex justify-between items-center backdrop-blur-md">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-2xl bg-slate-800 flex items-center justify-center border border-slate-700 text-blue-500">
                                <User className="w-6 h-6" />
                            </div>
                            <div>
                                <h2 className="text-lg font-black uppercase tracking-tight text-white leading-none mb-1">{selectedRoom.user_name}</h2>
                                <p className="text-[10px] font-bold uppercase text-slate-500 tracking-widest">{selectedRoom.user_email}</p>
                            </div>
                        </div>
                        <div className="flex gap-2">
                             <Button variant="ghost" size="sm" className="rounded-xl h-10 font-bold text-xs text-slate-400 hover:text-white" asChild>
                                <Link to="/admin/users"><User className="w-4 h-4 mr-2" /> Perfil</Link>
                             </Button>
                        </div>
                    </header>

                    <ScrollArea className="flex-1 p-10 bg-gradient-to-b from-slate-950 to-slate-900">
                        <div className="max-w-3xl mx-auto space-y-8">
                            {messages?.map((msg) => (
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
                                        {msg.sender_role === 'user' ? 'Cliente' : 'Robson'} • {format(parseISO(msg.created_at), "HH:mm")}
                                    </span>
                                </div>
                            ))}
                            <div ref={scrollRef} />
                        </div>
                    </ScrollArea>

                    <div className="p-8 border-t border-slate-800 bg-slate-900/50">
                        <div className="max-w-3xl mx-auto relative">
                            <Textarea 
                                value={replyText}
                                onChange={(e) => setReplyText(e.target.value)}
                                placeholder="Responda ao cliente aqui..."
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
                <div className="flex-1 flex flex-col items-center justify-center p-20 text-center space-y-4 opacity-20">
                    <MessageSquare className="w-20 h-20" />
                    <h3 className="text-xl font-black uppercase tracking-widest">Selecione uma conversa</h3>
                </div>
            )}
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminTickets;