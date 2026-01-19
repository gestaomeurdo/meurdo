import { SupportTicket, useTicketMessages, useSendReply } from "@/hooks/use-support";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Loader2, Send, User, LifeBuoy, MessageSquare } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";

interface SupportTicketChatProps {
  ticket: SupportTicket;
  trigger: React.ReactNode;
}

const SupportTicketChat = ({ ticket, trigger }: SupportTicketChatProps) => {
  const [open, setOpen] = useState(false);
  const [reply, setReply] = useState("");
  const { data: messages, isLoading } = useTicketMessages(ticket.id);
  const sendReplyMutation = useSendReply();
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
        scrollRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, open]);

  const handleSend = async () => {
    if (!reply.trim()) return;
    try {
      await sendReplyMutation.mutateAsync({ ticketId: ticket.id, message: reply });
      setReply("");
    } catch (err) {}
  };

  const isClosed = ticket.status === 'closed' || ticket.status === 'resolved';

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="sm:max-w-[600px] h-[80vh] flex flex-col p-0 overflow-hidden rounded-[2rem]">
        <DialogHeader className="p-6 border-b bg-muted/20">
          <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-xl"><LifeBuoy className="w-5 h-5 text-primary" /></div>
              <div>
                <DialogTitle className="text-lg font-black uppercase tracking-tight">{ticket.subject}</DialogTitle>
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Protocolo: #{ticket.id.slice(0, 8)} • {ticket.category}</p>
              </div>
          </div>
        </DialogHeader>

        <ScrollArea className="flex-1 p-6 bg-slate-50 dark:bg-slate-900/50">
          <div className="space-y-6">
            {isLoading ? (
              <div className="flex justify-center p-12"><Loader2 className="animate-spin text-primary" /></div>
            ) : (
              messages?.map((msg) => (
                <div key={msg.id} className={cn("flex flex-col max-w-[85%]", msg.sender_role === 'user' ? "ml-auto items-end" : "items-start")}>
                    <div className={cn(
                        "p-4 rounded-2xl shadow-sm text-sm font-medium",
                        msg.sender_role === 'user' 
                            ? "bg-[#066abc] text-white rounded-tr-none" 
                            : "bg-white dark:bg-slate-800 border dark:border-slate-700 text-foreground rounded-tl-none"
                    )}>
                        {msg.message}
                    </div>
                    <span className="text-[9px] font-bold text-muted-foreground mt-1 uppercase tracking-tighter">
                        {msg.sender_role === 'user' ? 'Você' : 'Suporte Meu RDO'} • {format(parseISO(msg.created_at), "HH:mm")}
                    </span>
                </div>
              ))
            )}
            <div ref={scrollRef} />
          </div>
        </ScrollArea>

        {!isClosed ? (
          <div className="p-4 bg-white dark:bg-slate-900 border-t">
            <div className="flex gap-2">
              <Input 
                value={reply} 
                onChange={(e) => setReply(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                placeholder="Escreva sua resposta..." 
                className="rounded-xl bg-muted/30"
                disabled={sendReplyMutation.isPending}
              />
              <Button onClick={handleSend} disabled={sendReplyMutation.isPending || !reply.trim()} className="rounded-xl bg-[#066abc] aspect-square p-0 w-12">
                {sendReplyMutation.isPending ? <Loader2 className="animate-spin" /> : <Send className="w-5 h-5" />}
              </Button>
            </div>
          </div>
        ) : (
          <div className="p-4 bg-muted/20 text-center border-t">
              <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Este chamado foi finalizado.</p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default SupportTicketChat;