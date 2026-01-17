import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import UpgradeButton from "./UpgradeButton";
import { AlertTriangle, CheckCircle2 } from "lucide-react";

interface LimitReachedModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const LimitReachedModal = ({ open, onOpenChange }: LimitReachedModalProps) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="mx-auto w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center mb-4">
            <AlertTriangle className="h-6 w-6 text-orange-600" />
          </div>
          <DialogTitle className="text-center text-xl">Limite de Obras Atingido</DialogTitle>
          <DialogDescription className="text-center pt-2">
            No plano gratuito você pode gerenciar apenas 1 obra por vez.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm">
              <CheckCircle2 className="h-4 w-4 text-green-500" />
              <span>Obras ilimitadas</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <CheckCircle2 className="h-4 w-4 text-green-500" />
              <span>Relatórios PDF personalizados</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <CheckCircle2 className="h-4 w-4 text-green-500" />
              <span>Suporte prioritário</span>
            </div>
          </div>
          <div className="pt-2">
            <UpgradeButton />
            <p className="text-center text-[10px] text-muted-foreground mt-2">
              Assinatura mensal de R$ 49,99. Cancele quando quiser.
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default LimitReachedModal;