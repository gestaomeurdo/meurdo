import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { FileText, Download, Loader2, Rocket, Lock, Zap } from "lucide-react";
import { useState } from "react";
import { showError, showSuccess } from "@/utils/toast";
import { Obra } from "@/hooks/use-obras";
import { RdoReportMetrics } from '@/hooks/use-rdo-report-data';
import { useAuth } from '@/integrations/supabase/auth-provider';
import { generateExecutiveReportPdf } from '@/utils/rdo-pdf';
import UpgradeModal from '../subscription/UpgradeModal';

interface ExportDialogProps {
  obraNome: string;
  periodo: string;
  reportData: RdoReportMetrics | undefined;
  isLoading: boolean;
  selectedObra: Obra | undefined;
  startDate?: string;
  endDate?: string;
}

const ExportDialog = ({ obraNome, periodo, reportData, isLoading, selectedObra, startDate, endDate }: ExportDialogProps) => {
  const { isPro } = useAuth();
  const [isExporting, setIsExporting] = useState(false);
  const [open, setOpen] = useState(false);
  const [showUpgrade, setShowUpgrade] = useState(false);

  const handleExportPremium = async () => {
    if (!isPro) {
        setShowUpgrade(true);
        return;
    }
    if (!reportData || !selectedObra || !startDate || !endDate) return;

    setIsExporting(true);
    try {
      await generateExecutiveReportPdf(reportData, selectedObra, null, startDate, endDate);
      showSuccess("Relatório Gerado!");
      setOpen(false);
    } catch (error) {
      showError("Erro ao gerar PDF.");
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <>
        <UpgradeModal open={showUpgrade} onOpenChange={setShowUpgrade} title="Dashboard Executivo Mensal" description="Relatórios de performance com KPIs, gráficos de evolução e galeria fotográfica são exclusivos do Plano PRO." />
        
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button disabled={isLoading} className="bg-primary hover:bg-primary/90 font-bold rounded-xl shadow-lg relative overflow-hidden">
                {isLoading || isExporting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : (isPro ? <Rocket className="w-4 h-4 mr-2" /> : <Lock className="w-4 h-4 mr-2" />)}
                Gerar Dashboard Executivo
                {!isPro && <span className="absolute top-0 right-0 bg-orange-500 text-[8px] px-1 font-black">PRO</span>}
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px] rounded-[2rem] border-none shadow-2xl p-0 overflow-hidden">
                <div className="bg-[#1e293b] p-8 text-white">
                    <h2 className="text-2xl font-black uppercase tracking-tight flex items-center gap-2"><Rocket className="text-primary w-6 h-6" /> Relatório Executivo</h2>
                    <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mt-2">Executive Performance Dashboard</p>
                </div>
                <div className="p-8 space-y-6">
                    {!isPro && (
                        <div className="bg-orange-50 p-4 rounded-2xl border border-orange-100 flex items-center gap-3">
                            <Zap className="h-5 w-5 text-orange-600 fill-current" />
                            <p className="text-xs font-bold text-orange-800">Recurso Exclusivo do Plano Profissional.</p>
                        </div>
                    )}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 text-center"><p className="text-[8px] font-black text-slate-400 uppercase">Período</p><p className="text-xs font-bold truncate">{periodo}</p></div>
                        <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 text-center"><p className="text-[8px] font-black text-slate-400 uppercase">Obra</p><p className="text-xs font-bold truncate">{obraNome}</p></div>
                    </div>
                    <Button onClick={handleExportPremium} disabled={isExporting} className="w-full h-14 rounded-2xl bg-[#066abc] hover:bg-[#066abc]/90 text-white font-black uppercase text-xs tracking-widest shadow-xl">
                        {isExporting ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : (isPro ? <Download className="w-5 h-5 mr-2" /> : <Zap className="w-5 h-5 mr-2" />)}
                        {isPro ? "Baixar Relatório Premium" : "Fazer Upgrade Agora"}
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    </>
  );
};

export default ExportDialog;