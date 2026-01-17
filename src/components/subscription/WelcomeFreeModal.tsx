import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ShieldCheck, Zap, Construction, FileText, CheckCircle2 } from "lucide-react";
import { useState, useEffect } from "react";
import UpgradeButton from "./UpgradeButton";

const WelcomeFreeModal = () => {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const hasSeenWelcome = localStorage.getItem('meurdo_welcome_free_v1');
    if (!hasSeenWelcome) {
      setOpen(true);
    }
  }, []);

  const handleClose = () => {
    localStorage.setItem('meurdo_welcome_free_v1', 'true');
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-[500px] rounded-3xl border-none shadow-2xl overflow-hidden p-0">
        <div className="bg-[#066abc] p-8 text-white text-center relative">
          <div className="absolute top-0 right-0 p-4 opacity-10">
            <Construction className="w-32 h-32 rotate-12" />
          </div>
          <div className="bg-white/20 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 backdrop-blur-sm">
            <ShieldCheck className="w-10 h-10 text-white" />
          </div>
          <h2 className="text-2xl font-black uppercase tracking-tight">Bem-vindo ao Meu RDO!</h2>
          <p className="text-blue-100 font-medium mt-1">Você está iniciando no Plano Básico</p>
        </div>
        <div className="p-8 space-y-6">
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground font-medium text-center px-4">
              Profissionalize sua gestão de obras hoje mesmo. Veja o que você pode desbloquear:
            </p>
            <div className="grid grid-cols-1 gap-3">
              {[
                { icon: Construction, text: "Obras ativas ilimitadas" },
                { icon: FileText, text: "PDFs profissionais com a sua logo" },
                { icon: Zap, text: "Checklist de segurança e assinaturas" },
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-3 bg-accent/50 p-3 rounded-2xl">
                  <div className="bg-white p-1.5 rounded-lg shadow-sm">
                    <item.icon className="w-4 h-4 text-[#066abc]" />
                  </div>
                  <span className="text-sm font-bold text-foreground">{item.text}</span>
                  <CheckCircle2 className="w-4 h-4 text-green-500 ml-auto" />
                </div>
              ))}
            </div>
          </div>
          <div className="space-y-3">
            <UpgradeButton />
            <Button variant="ghost" onClick={handleClose} className="w-full text-muted-foreground font-bold hover:bg-transparent">
              Continuar com limitações
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default WelcomeFreeModal;