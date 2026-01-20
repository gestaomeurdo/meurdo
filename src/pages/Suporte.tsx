import DashboardLayout from "@/components/layout/DashboardLayout";
import { useUserChat } from "@/hooks/use-support";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Loader2, Send, MessageCircle, User, LifeBuoy } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { format, parseISO } from "date-fns";
import { cn } from "@/lib/utils";

const Suporte = () => {
  const { messages, isLoading, sendMessage } = useUserChat();
  const [text, setText] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    if (!text.trim()) return;
    try {
      await sendMessage.mutateAsync(text);
      setText("");
    } catch (err) {}
  };

  return (
    <DashboardLayout>
      <div className="flex flex-col h-[calc(100vh-64px)] bg-slate-50 dark:bg-slate-950">
        <header className="p-6 border-b bg-white dark:bg-slate-900 flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-blue-600 flex items-center justify-center text-white shadow-lg">
                <LifeBuoy className="w-6 h-6" />
            </div>
            <div>
                <h1 className="text-xl font-black uppercase tracking-tight">Atendimento Direto</h1>
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Fale diretamente com o Robson</p>
            </div>
        </header>

        <ScrollArea className="flex-1 p-6 sm:p-10">
            <div className="max-w-3xl mx-auto space-y-6">
                {isLoading ? (
                    <div className="flex justify-center p-20"><Loader2 className="animate-spin text-primary" /></div>
                ) : messages.length === 0 ? (
                    <div className="text-center space-y-4 py-20 opacity-30">
                        <MessageCircle className="w-16 h-16 mx-auto" />
                        <p className="font-bold uppercase text-xs tracking-widest">Inicie uma conversa abaixo.</p>
                    </div>
                ) : (
                    messages.map((msg) => (
                        <div key={msg.id} className={cn("flex flex-col max-w-[85%] sm:max-w-[70%]", msg.sender_role === 'user' ? "ml-auto items-end" : "items-start")}>
                            <div className={cn(
                                "p-4 rounded-2xl shadow-sm text-sm font-medium",
                                msg.sender_role === 'user' 
                                    ? "bg-blue-600 text-white rounded-tr-none" 
                                    : "bg-white dark:bg-slate-800 border dark:border-slate-700 text-foreground rounded-tl-none"
                            )}>
                                {msg.message}
                            </div>
                            <span className="text-[9px] font-bold text-muted-foreground mt-1 uppercase">
                                {msg.sender_role === 'user' ? 'Você' : 'Robson (Suporte)'} • {format(parseISO(msg.created_at), "HH:mm")}
                            </span>
                        </div>
                    ))
                )}
                <div ref={scrollRef} />
            </div>
        </ScrollArea>

        <div className="p-4 sm:p-6 bg-white dark:bg-slate-900 border-t">
            <div className="max-w-3xl mx-auto flex gap-3">
                <Input 
                    value={text} 
                    onChange={(e) => setText(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                    placeholder="Escreva sua dúvida ou mensagem..." 
                    className="rounded-xl h-12 bg-slate-50 dark:bg-slate-800 border-none"
                    disabled={sendMessage.isPending}
                />
                <Button onClick={handleSend} disabled={sendMessage.isPending || !text.trim()} className="rounded-xl bg-blue-600 hover:bg-blue-700 h-12 w-12 p-0 aspect-square">
                    {sendMessage.isPending ? <Loader2 className="animate-spin" /> : <Send className="w-5 h-5" />}
                </Button>
            </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Suporte;