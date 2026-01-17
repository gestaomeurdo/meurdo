import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import UpgradeButton from "./UpgradeButton";
import { CheckCircle2, Zap, ShieldCheck, FileText, Construction, MousePointer2 } from "lucide-react";

interface UpgradeModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title?: string;
  description?: string;
}

const UpgradeModal = ({ open, onOpenChange, title, description }: UpgradeModalProps) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px] rounded-3xl border-none shadow-2xl">
        <DialogHeader className="space-y-4">
          <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
            <Zap className="h-8 w-8 text-primary fill-current" />
          </div>
          <DialogTitle className="text-center text-2xl font-black text-[#066abc] uppercase tracking-tight">
            {title || "Desbloqueie o Poder do Meu RDO PRO"}
          </DialogTitle>
          <DialogDescription className="text-center text-base font-medium">
            {description || "Sua gestão de obras em um nível profissional e sem limites."}
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 gap-4 py-6">
          {[
            { icon: Construction, title: "Obras Ilimitadas", desc: "Gerencie todos os seus projetos em um só lugar." },
            { icon: MousePointer2, title: "Assinatura Digital", desc: "Colete assinaturas direto no celular ou tablet." },
            { icon: ShieldCheck, title: "Checklist de Segurança", desc: "Conformidade total com NR-35, EPIs e DDS." },
            { icon: FileText, title: "PDF Sem Marca d'Água", desc: "Relatórios com a sua logo e visual limpo." },
          ].map((benefit, i) => (
            <div key={i} className="flex items-start gap-4 p-3 rounded-2xl hover:bg-accent/50 transition-colors">
              <div className="bg-primary/10 p-2 rounded-xl">
                <benefit.icon className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h4 className="font-bold text-sm leading-none mb-1">{benefit.title}</h4>
                <p className="text-xs text-muted-foreground">{benefit.desc}</p>
              </div>
              <CheckCircle2 className="h-4 w-4 text-green-500 ml-auto shrink-0 mt-1" />
            </div>
          ))}
        </div>

        <div className="space-y-4">
          <UpgradeButton />
          <p className="text-center text-[10px] text-muted-foreground uppercase font-black tracking-widest">
            R$ 49,90 / mês • Cancele quando quiser
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default UpgradeModal;