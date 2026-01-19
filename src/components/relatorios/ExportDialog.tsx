import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { FileText, Download, Loader2, Zap, Rocket } from "lucide-react";
import { useState } from "react";
import { showError, showSuccess } from "@/utils/toast";
import { Obra } from "@/hooks/use-obras";
import { RdoReportMetrics } from '@/hooks/use-rdo-report-data';
import { DiarioObra } from '@/hooks/use-rdo';
import { useAuth } from '@/integrations/supabase/auth-provider';
import { generateExecutiveReportPdf } from '@/utils/rdo-pdf';

interface ExportDialogProps {
  obraNome: string;
  periodo: string;
  reportData: RdoReportMetrics | undefined;
  activities: DiarioObra[] | undefined;
  kmCost: number | undefined;
  isLoading: boolean;
  selectedObra: Obra | undefined;
  startDate?: string;
  endDate?: string;
}

const ExportDialog = ({ obraNome, periodo, reportData, isLoading, selectedObra, startDate, endDate }: ExportDialogProps) => {
  const [isExporting, setIsExporting] = useState(false);
  const [open, setOpen] = useState(false);
  const { profile } = useAuth();
  const isPro = profile?.subscription_status === 'active' || profile?.plan_type === 'pro';

  const handleExportPremium = async () => {
    if (!reportData || !selectedObra || !startDate || !endDate) {
      showError("Dados incompletos para exportação.");
      return;
    }

    setIsExporting(true);
    try {
      await generateExecutiveReportPdf(
          reportData,
          selectedObra,
          profile as any,
          startDate,
          endDate
      );
      showSuccess("Dashboard Executivo gerado!");
      setOpen(false);
    } catch (error) {
      showError("Erro ao gerar dashboard premium.");
    } finally {
      setIsExporting(false);
    }
  };

  const isDataReady = !!reportData && !!selectedObra;
  const isDisabled = isLoading || isExporting || !isDataReady;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button disabled={isDisabled} className="bg-primary hover:bg-primary/90 font-bold rounded-xl shadow-lg">
          {isLoading || isExporting ? (
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <Rocket className="w-4 h-4 mr-2" />
          )}
          {isLoading ? "Processando..." : "Gerar Dashboard Executivo"}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px] rounded-[2rem] border-none shadow-2xl overflow-hidden">
        <div className="bg-[#1e293b] p-8 text-white">
            <h2 className="text-2xl font-black uppercase tracking-tight flex items-center gap-2">
                <Rocket className="text-primary w-6 h-6" />
                Relatório Premium
            </h2>
            <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mt-2">Executive Performance Dashboard</p>
        </div>
        
        <div className="p-8 space-y-6">
            <div className="space-y-4">
                <div className="flex items-center gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-100">
                    <div className="bg-white p-3 rounded-xl shadow-sm"><FileText className="w-6 h-6 text-primary" /></div>
                    <div>
                        <h4 className="font-bold text-sm text-slate-800">Layout de Alta Performance</h4>
                        <p className="text-[10px] text-slate-500">Design moderno com KPIs, Timeline e Mosaico de fotos.</p>
                    </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                    <div className="bg-emerald-50/50 p-4 rounded-2xl border border-emerald-100 text-center">
                        <p className="text-[8px] font-black text-emerald-600 uppercase">Período</p>
                        <p className="text-xs font-bold text-emerald-900 truncate">{periodo}</p>
                    </div>
                    <div className="bg-blue-50/50 p-4 rounded-2xl border border-blue-100 text-center">
                        <p className="text-[8px] font-black text-blue-600 uppercase">Obra</p>
                        <p className="text-xs font-bold text-blue-900 truncate">{obraNome}</p>
                    </div>
                </div>
            </div>

            <div className="flex flex-col gap-3">
                <Button 
                    onClick={handleExportPremium} 
                    disabled={isExporting || !isDataReady}
                    className="h-14 rounded-2xl bg-[#066abc] hover:bg-[#066abc]/90 text-white font-black uppercase text-xs tracking-widest shadow-xl shadow-blue-500/20"
                >
                    {isExporting ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : <Download className="w-5 h-5 mr-2" />}
                    Baixar Relatório Premium
                </Button>
                <Button variant="ghost" onClick={() => setOpen(false)} className="text-slate-400 font-bold hover:bg-transparent">
                    Cancelar
                </Button>
            </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ExportDialog;