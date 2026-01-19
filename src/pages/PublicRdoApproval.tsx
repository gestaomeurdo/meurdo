"use client";

import { useParams } from "react-router-dom";
import { useRdoByToken, useApproveRdo, useRejectRdo } from "@/hooks/use-rdo";
import { Loader2, CheckCircle2, AlertTriangle, Cloud, Sun, Users, ImageIcon, ChevronDown, FileDown, Check, X, MapPin, Calendar, HardHat, Camera, ListChecks, ShieldCheck, Signature as SignatureIcon } from "lucide-react";
import { useState, useRef } from "react";
import SignatureCanvas from 'react-signature-canvas';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { showError, showSuccess } from "@/utils/toast";
import { generateRdoPdf } from "@/utils/rdo-pdf";
import confetti from "canvas-confetti";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";

const LOGO_URL = "https://meurdo.com.br/wp-content/uploads/2026/01/Logo-MEU-RDO-scaled.png";

const PublicRdoApproval = () => {
  const { token } = useParams<{ token: string }>();
  const { data: rdo, isLoading, error } = useRdoByToken(token);
  const approveMutation = useApproveRdo();
  const rejectMutation = useRejectRdo();
  
  const sigPad = useRef<any>(null);
  const [isSigning, setIsSigning] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");
  const [showRejectForm, setShowRejectForm] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-accent/5">
        <Loader2 className="h-10 w-10 animate-spin text-primary mb-4" />
        <p className="text-muted-foreground font-bold uppercase tracking-widest text-xs">Sincronizando Relatório...</p>
      </div>
    );
  }

  if (error || !rdo) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center bg-slate-50">
        <AlertTriangle className="h-12 w-12 text-destructive mb-4" />
        <h1 className="text-xl font-black uppercase tracking-tight">Link de Acesso Inválido</h1>
        <p className="text-muted-foreground mt-2 max-w-xs">O link expirou ou o relatório não existe mais. Contate o engenheiro responsável.</p>
        <Button variant="link" onClick={() => window.location.reload()} className="mt-6 font-bold uppercase text-xs">Tentar Novamente</Button>
      </div>
    );
  }

  const handleDownloadPdf = async () => {
    setIsDownloading(true);
    try {
        await generateRdoPdf(rdo, rdo.obras?.nome || "Obra", null, rdo.obras as any);
        showSuccess("Download iniciado!");
    } catch (err) {
        showError("Erro ao gerar PDF.");
    } finally {
        setIsDownloading(false);
    }
  };

  const handleApprove = async () => {
    if (sigPad.current?.isEmpty()) {
      showError("Por favor, assine no campo indicado para aprovar.");
      return;
    }

    setIsProcessing(true);
    try {
      const base64Data = sigPad.current.toDataURL('image/png');
      const response = await fetch(base64Data);
      const blob = await response.blob();
      
      const filePath = `assinaturas_clientes/${rdo.obra_id}/${rdo.id}-${Date.now()}.png`;

      const { error: uploadError } = await supabase.storage
        .from('documentos_financeiros')
        .upload(filePath, blob, { contentType: 'image/png' });

      if (uploadError) throw uploadError;

      const { data: publicUrlData } = supabase.storage
        .from('documentos_financeiros')
        .getPublicUrl(filePath);

      await approveMutation.mutateAsync({ 
        token: token!, 
        signatureUrl: publicUrlData.publicUrl 
      });

      confetti({
        particleCount: 150,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#066abc', '#22c55e', '#ffffff']
      });

      showSuccess("Relatório aprovado com sucesso!");
    } catch (err) {
      showError("Erro ao processar aprovação.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReject = async () => {
    if (!rejectionReason.trim()) {
      showError("Informe o motivo da solicitação de correção.");
      return;
    }
    setIsProcessing(true);
    try {
      await rejectMutation.mutateAsync({ token: token!, reason: rejectionReason });
      showSuccess("Solicitação de correção enviada.");
      setShowRejectForm(false);
    } catch (err) {
      showError("Erro ao enviar solicitação.");
    } finally {
      setIsProcessing(false);
    }
  };

  const totalActivities = rdo.rdo_atividades_detalhe?.length || 0;
  const completedActivities = rdo.rdo_atividades_detalhe?.filter(a => a.avanco_percentual === 100).length || 0;
  const totalWorkers = rdo.rdo_mao_de_obra?.reduce((sum, m) => sum + m.quantidade, 0) || 0;
  const photoCount = (rdo.rdo_atividades_detalhe?.filter(a => a.foto_anexo_url).length || 0) + 
                     (rdo.rdo_equipamentos?.filter(e => e.foto_url).length || 0);

  if (rdo.status === 'approved') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center bg-green-50/30">
        <div className="w-24 h-24 bg-green-100 rounded-[2.5rem] flex items-center justify-center mb-8 animate-bounce shadow-xl">
            <CheckCircle2 className="h-14 w-14 text-green-600" />
        </div>
        <h1 className="text-3xl font-black text-green-800 uppercase tracking-tight">Diário Aprovado!</h1>
        <p className="text-green-700 font-medium mt-3 max-w-sm">
          A assinatura digital foi registrada com sucesso. O engenheiro responsável já recebeu a notificação.
        </p>
        <div className="mt-10 flex flex-col items-center gap-4">
            <Badge className="bg-green-600 text-white px-6 py-2 rounded-full font-black tracking-widest text-[10px]">
                VALIDADO EM {format(parseISO(rdo.approved_at!), "dd/MM/yy 'ÀS' HH:mm")}
            </Badge>
            <Button variant="outline" onClick={handleDownloadPdf} className="rounded-xl font-bold uppercase text-xs">
                <FileDown className="w-4 h-4 mr-2" /> Baixar Cópia PDF
            </Button>
        </div>
      </div>
    );
  }

  const SidebarResumo = () => (
    <div className="space-y-6">
        <header className="text-center md:text-left space-y-4 mb-8">
          <img src={LOGO_URL} alt="Meu RDO" className="h-10 mx-auto md:mx-0 object-contain" />
          <div className="space-y-2">
            <Badge className={cn(
                "uppercase font-black tracking-widest px-4 py-1.5",
                rdo.status === 'pending' ? "bg-orange-500" : "bg-slate-400"
            )}>
                {rdo.status === 'pending' ? 'Aguardando sua Aprovação' : 'Solicitada Correção'}
            </Badge>
            <h1 className="text-2xl font-black uppercase text-slate-800 tracking-tight leading-none">
                {rdo.obras?.nome}
            </h1>
            <div className="flex flex-col gap-1 text-xs text-muted-foreground font-bold uppercase tracking-wider">
                <span className="flex items-center gap-2"><Calendar className="w-3 h-3" /> {format(parseISO(rdo.data_rdo), "dd 'de' MMMM, yyyy", { locale: ptBR })}</span>
                <span className="flex items-center gap-2"><MapPin className="w-3 h-3" /> Registro Oficial de Campo</span>
            </div>
          </div>
        </header>

        <div className="grid grid-cols-2 gap-3">
            <Card className="border-none shadow-sm bg-blue-50/50 rounded-2xl">
              <CardContent className="p-4 flex flex-col items-center text-center gap-1">
                <Sun className="h-6 w-6 text-orange-400" />
                <span className="text-[9px] font-black uppercase text-blue-800/40">Tempo</span>
                <span className="text-xs font-black text-blue-900">PRATICÁVEL</span>
              </CardContent>
            </Card>
            <Card className="border-none shadow-sm bg-green-50/50 rounded-2xl">
              <CardContent className="p-4 flex flex-col items-center text-center gap-1">
                <Users className="h-6 w-6 text-green-600" />
                <span className="text-[9px] font-black uppercase text-green-800/40">Efetivo</span>
                <span className="text-xs font-black text-green-900">{totalWorkers} Colaboradores</span>
              </CardContent>
            </Card>
            <Card className="border-none shadow-sm bg-purple-50/50 rounded-2xl">
              <CardContent className="p-4 flex flex-col items-center text-center gap-1">
                <ImageIcon className="h-6 w-6 text-purple-600" />
                <span className="text-[9px] font-black uppercase text-purple-800/40">Mídias</span>
                <span className="text-xs font-black text-purple-900">{photoCount} Evidências</span>
              </CardContent>
            </Card>
            <Card className="border-none shadow-sm bg-orange-50/50 rounded-2xl">
              <CardContent className="p-4 flex flex-col items-center text-center gap-1">
                <div className="w-full space-y-1 mt-1">
                    <span className="text-[9px] font-black uppercase text-orange-800/40">Progresso</span>
                    <Progress value={(completedActivities/totalActivities)*100} className="h-1.5" />
                    <span className="text-[10px] font-black text-orange-900">{completedActivities}/{totalActivities} Concl.</span>
                </div>
              </CardContent>
            </Card>
        </div>

        <Button 
            variant="outline" 
            onClick={handleDownloadPdf} 
            disabled={isDownloading}
            className="w-full h-14 rounded-2xl border-2 font-black uppercase text-xs tracking-widest hover:bg-slate-50"
        >
            {isDownloading ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : <FileDown className="w-5 h-5 mr-2" />}
            Download PDF Completo
        </Button>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col">
      <div className="max-w-6xl mx-auto w-full flex-grow flex flex-col md:flex-row md:gap-8 md:p-8">
        
        {/* LADO ESQUERDO: RESUMO (FIXO NO DESKTOP) */}
        <aside className="w-full md:w-[350px] bg-white md:bg-transparent p-6 md:p-0 md:sticky md:top-8 h-fit border-b md:border-none">
            <SidebarResumo />
        </aside>

        {/* LADO DIREITO: CONTEÚDO (SCROLLÁVEL) */}
        <main className="flex-1 p-4 md:p-8 bg-white md:rounded-[2.5rem] md:shadow-2xl space-y-10 md:mb-32">
          
          {/* Galeria de Fotos */}
          <section className="space-y-4">
            <div className="flex items-center gap-2 mb-2">
                <Camera className="w-5 h-5 text-primary" />
                <h3 className="text-sm font-black uppercase tracking-widest text-slate-800">Relatório Fotográfico</h3>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {rdo.rdo_atividades_detalhe?.filter(a => a.foto_anexo_url).map((atv, i) => (
                    <div key={i} className="group aspect-video rounded-3xl overflow-hidden relative shadow-lg">
                        <img src={atv.foto_anexo_url!} alt="Foto de Campo" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex items-end p-5">
                            <p className="text-white text-xs font-bold uppercase tracking-tight">{atv.descricao_servico}</p>
                        </div>
                    </div>
                ))}
                {photoCount === 0 && (
                    <div className="col-span-full py-16 text-center border-2 border-dashed rounded-3xl bg-slate-50">
                        <ImageIcon className="w-10 h-10 mx-auto mb-3 text-slate-200" />
                        <p className="text-xs font-bold uppercase text-slate-400">Nenhuma foto anexada hoje</p>
                    </div>
                )}
            </div>
          </section>

          {/* Atividades e Ocorrências */}
          <section className="space-y-6">
            <div className="flex items-center gap-2 mb-2">
                <ListChecks className="w-5 h-5 text-primary" />
                <h3 className="text-sm font-black uppercase tracking-widest text-slate-800">Serviços e Ocorrências</h3>
            </div>

            <div className="space-y-3">
                {rdo.rdo_atividades_detalhe?.map((atv, i) => (
                    <div key={i} className="flex justify-between items-center p-4 bg-slate-50/50 rounded-2xl border transition-colors hover:bg-white">
                        <div className="space-y-1">
                            <p className="text-sm font-black text-slate-800 uppercase tracking-tight">{atv.descricao_servico}</p>
                            {atv.observacao && <p className="text-xs text-muted-foreground italic font-medium">"{atv.observacao}"</p>}
                        </div>
                        <Badge variant={atv.avanco_percentual === 100 ? "default" : "outline"} className="text-[10px] font-black h-6 rounded-lg px-3">
                            {atv.avanco_percentual}%
                        </Badge>
                    </div>
                ))}
            </div>

            {rdo.impedimentos_comentarios && (
                <Card className="border-none bg-red-50 rounded-3xl shadow-inner-lg">
                    <CardContent className="p-6 space-y-3">
                        <div className="flex items-center gap-2 text-red-700">
                            <AlertTriangle className="h-5 w-5" />
                            <h4 className="text-xs font-black uppercase tracking-widest">Impedimentos Registrados</h4>
                        </div>
                        <p className="text-sm text-red-900 leading-relaxed font-medium">
                            {rdo.impedimentos_comentarios}
                        </p>
                    </CardContent>
                </Card>
            )}
          </section>

          {/* Checklist Segurança */}
          <section className="space-y-4">
              <div className="flex items-center gap-2 mb-2">
                  <ShieldCheck className="w-5 h-5 text-green-600" />
                  <h3 className="text-sm font-black uppercase tracking-widest text-slate-800">Conformidade e Segurança</h3>
              </div>
              <div className="grid grid-cols-2 gap-4">
                  {[
                      { l: "Uso de EPI", v: rdo.safety_epi },
                      { l: "Trabalho em Altura", v: rdo.safety_nr35 },
                      { l: "Limpeza/Organização", v: rdo.safety_cleaning },
                      { l: "Realização de DDS", v: rdo.safety_dds },
                  ].map((s, i) => (
                      <div key={i} className={cn(
                          "flex items-center gap-3 p-3 rounded-2xl border font-bold text-xs uppercase tracking-tight",
                          s.v ? "bg-green-50 border-green-200 text-green-700" : "bg-slate-50 border-slate-200 text-slate-400"
                      )}>
                          {s.v ? <CheckCircle2 className="w-4 h-4" /> : <X className="w-4 h-4" />}
                          {s.l}
                      </div>
                  ))}
              </div>
          </section>

          {/* Assinatura Digital */}
          <section className="pt-10 border-t-4 border-slate-100 space-y-6">
            <div className="text-center">
                <div className="bg-primary/10 w-12 h-12 rounded-2xl flex items-center justify-center mx-auto mb-3">
                    <SignatureIcon className="w-6 h-6 text-primary" />
                </div>
                <h3 className="text-lg font-black uppercase tracking-tight text-slate-800">Assinatura Digital do Cliente</h3>
                <p className="text-xs text-muted-foreground font-bold uppercase tracking-wider mt-1 px-8">Ao assinar, você declara estar ciente das informações acima.</p>
            </div>
            
            <div className="flex justify-center">
                <div 
                    className={cn(
                        "border-4 border-dashed rounded-[2.5rem] bg-slate-50 overflow-hidden relative w-full max-w-[450px] aspect-[16/6] transition-all",
                        isSigning && "ring-8 ring-primary/10 border-primary"
                    )}
                >
                    <SignatureCanvas
                        ref={sigPad}
                        penColor='#066abc'
                        canvasProps={{ 
                            className: 'sigCanvas w-full h-full cursor-crosshair' 
                        }}
                        onBegin={() => setIsSigning(true)}
                    />
                    {!isSigning && (
                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none text-slate-300 font-black uppercase tracking-[0.3em] text-[10px]">
                            Toque para Assinar
                        </div>
                    )}
                    {isSigning && (
                        <button 
                            onClick={() => { sigPad.current.clear(); setIsSigning(false); }}
                            className="absolute top-4 right-4 p-2 rounded-full bg-white shadow-xl text-destructive hover:bg-red-50 transition-transform active:scale-90"
                        >
                            <X className="h-5 w-5" />
                        </button>
                    )}
                </div>
            </div>
          </section>

        </main>
      </div>

      {/* Action Bar (Sticky no Mobile e Desktop) */}
      <footer className="fixed bottom-0 left-0 right-0 p-4 bg-white/90 backdrop-blur-xl border-t shadow-[0_-10px_40px_rgba(0,0,0,0.1)] z-30">
        <div className="max-w-md mx-auto grid grid-cols-1 gap-4">
            {showRejectForm ? (
                <div className="space-y-3 animate-in slide-in-from-bottom-2">
                    <Textarea 
                        placeholder="Descreva o que precisa ser corrigido..."
                        value={rejectionReason}
                        onChange={(e) => setRejectionReason(e.target.value)}
                        className="bg-red-50 border-red-100 rounded-2xl min-h-[100px] font-bold text-sm"
                        autoFocus
                    />
                    <div className="flex gap-2">
                        <Button variant="ghost" onClick={() => setShowRejectForm(false)} className="flex-1 font-bold rounded-xl h-12">Cancelar</Button>
                        <Button 
                            variant="destructive" 
                            onClick={handleReject} 
                            disabled={isProcessing}
                            className="flex-1 font-black uppercase text-xs tracking-widest rounded-xl h-12"
                        >
                            {isProcessing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4 mr-2" />}
                            Enviar Correção
                        </Button>
                    </div>
                </div>
            ) : (
                <>
                    <Button 
                        size="lg" 
                        onClick={handleApprove} 
                        disabled={isProcessing}
                        className="bg-[#22c55e] hover:bg-[#16a34a] text-white font-black uppercase text-sm tracking-[0.1em] h-16 rounded-[1.5rem] shadow-2xl shadow-green-500/30 transition-transform active:scale-95"
                    >
                        {isProcessing ? <Loader2 className="h-6 w-6 animate-spin mr-2" /> : <Check className="h-6 w-6 mr-2" />}
                        APROVAR E ASSINAR AGORA
                    </Button>
                    <button 
                        onClick={() => setShowRejectForm(true)}
                        className="text-[10px] font-black uppercase text-red-500 tracking-widest hover:underline py-2 opacity-60 hover:opacity-100 transition-opacity"
                    >
                        Solicitar Correção no Relatório
                    </button>
                </>
            )}
        </div>
      </footer>
    </div>
  );
};

export default PublicRdoApproval;