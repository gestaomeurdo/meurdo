import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Plus, Loader2, Send } from "lucide-react";
import { useState } from "react";
import { useCreateTicket } from "@/hooks/use-support";
import { showError, showSuccess } from "@/utils/toast";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const CreateTicketDialog = () => {
  const [open, setOpen] = useState(false);
  const [subject, setSubject] = useState("");
  const [category, setCategory] = useState("");
  const [message, setMessage] = useState("");
  const createMutation = useCreateTicket();

  const handleCreate = async () => {
    if (!subject || !category || !message) {
      showError("Por favor, preencha todos os campos.");
      return;
    }

    try {
      const ticket = await createMutation.mutateAsync({ subject, category, message });
      showSuccess(`Chamado #${ticket.id.slice(0, 5)} criado com sucesso!`);
      setOpen(false);
      setSubject("");
      setCategory("");
      setMessage("");
    } catch (err) {
      showError("Erro ao abrir chamado.");
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="rounded-xl bg-[#066abc] hover:bg-[#066abc]/90 font-bold">
          <Plus className="w-4 h-4 mr-2" /> Novo Chamado
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px] rounded-3xl">
        <DialogHeader>
          <DialogTitle className="text-xl font-black uppercase tracking-tight">Abrir Chamado Técnico</DialogTitle>
          <DialogDescription>Descreva o problema ou dúvida para nossa equipe de suporte.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Categoria</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger className="rounded-xl bg-muted/30">
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Técnico">Problema Técnico</SelectItem>
                  <SelectItem value="Financeiro">Financeiro / Plano</SelectItem>
                  <SelectItem value="Sugestão">Sugestão de Recurso</SelectItem>
                  <SelectItem value="Dúvida">Dúvida Geral</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Assunto Curto</Label>
                <Input value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="Ex: Erro ao gerar PDF" className="rounded-xl bg-muted/30" />
            </div>
          </div>
          <div className="space-y-2">
            <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Descrição Detalhada</Label>
            <Textarea 
                value={message} 
                onChange={(e) => setMessage(e.target.value)} 
                placeholder="Explique o que aconteceu..." 
                rows={5} 
                className="rounded-2xl bg-muted/30 resize-none" 
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => setOpen(false)} className="rounded-xl">Cancelar</Button>
          <Button onClick={handleCreate} disabled={createMutation.isPending} className="rounded-xl bg-[#066abc] font-bold min-w-[140px]">
            {createMutation.isPending ? <Loader2 className="animate-spin mr-2" /> : <Send className="w-4 h-4 mr-2" />}
            Enviar Chamado
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default CreateTicketDialog;