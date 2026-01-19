"use client";

import { useParams } from "react-router-dom";
import { useRdoByToken, useApproveRdo, useRejectRdo } from "@/hooks/use-rdo";
import { Loader2, CheckCircle2, AlertTriangle, Cloud, Sun, Users, ImageIcon, FileDown, Check, X, MapPin, Calendar, Camera, ListChecks, ShieldCheck, Signature as SignatureIcon, Send } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import SignatureCanvas from 'react-signature-canvas';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
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
  const { data: rdo, isLoading, error, refetch } = useRdoByToken(token);
  const approveMutation = useApproveRdo();
  const rejectMutation = useRejectRdo();
  
  const sigPad = useRef<any>(null);
  const [isSigning, setIsSigning] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");
  const [showRejectForm, setShowRejectForm] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

  // Efeito para Atualização em Tempo Real (Evita Cache)
  useEffect(() => {
    if (!rdo?.id) return;

    console.log("[Realtime] Iniciando monitoramento do RDO:", rdo.id);
    const channel = supabase
      .channel(`public_rdo_${rdo.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'diarios_obra',
          filter: `id=eq.${rdo.id}`
        },
        () => {
          console.log("[Realtime] Mudança detectada, atualizando dados...");
          refetch();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [rdo?.id, refetch]);

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

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <div className="max-w-6xl mx-auto w-full flex-grow flex flex-col md:flex-row md:gap-8 md:p-8 pb-32">
        
        {/* LADO ESQUERDO: RESUMO */}
        <aside className="w-full md:w-[350px] bg-white md:bg-transparent p-6 md:p-0 md:sticky md:top-8 h-fit border-b md:border-none">
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
                </div>
            </div>
        </aside>

        {/* LADO DIREITO: CONTEÚDO */}
        <main className="flex-1 p-4 md:p-8 bg-white md:rounded-[2.5rem] md:shadow-2xl space-y-10">
          
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
            </div>
          </section>

          {/* Atividades */}
          <section className="space-y-6">
            <div className="flex items-center gap-2 mb-2">
                <ListChecks className="w-5 h-5 text-primary" />
                <h3 className="text-sm font-black uppercase tracking-widest text-slate-800">Serviços Executados</h3>
            </div>
            <div className="space-y-3">
                {rdo.rdo_atividades_detalhe?.map((atv, i) => (
                    <div key={i} className="flex justify-between items-center p-4 bg-slate-50/50 rounded-2xl border">
                        <p className="text-sm font-black text-slate-800 uppercase tracking-tight">{atv.descricao_servico}</p>
                        <Badge variant={atv.avanco_percentual === 100 ? "default" : "outline"} className="text-[10px] font-black h-6 rounded-lg px-3">
                            {atv.avanco_percentual}%
                        </Badge>
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
                        "border-4 border-dashed rounded-[2rem] bg-slate-50 overflow-hidden relative w-full max-w-[450px] aspect-[16/6] transition-all",
                        isSigning && "ring-8 ring-primary/10 border-primary"
                    )}
                >
                    <SignatureCanvas
                        ref={sigPad}
                        penColor='#066abc'
                        canvasProps={{ className: 'sigCanvas w-full h-full cursor-crosshair' }}
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
                            className="absolute top-4 right-4 p-2 rounded-full bg-white shadow-xl text-destructive"
                        >
                            <X className="h-4 w-4" />
                        </button>
                    )}
                </div>
            </div>
          </section>
        </main>
      </div>

      {/* NOVO STICKY FOOTER ELEGANTE */}
      <footer className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t shadow-[0_-4px_20px_rgba(0,0,0,0.05)] z-40">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
            
            {!showRejectForm ? (
                <>
                    <div className="hidden md:block">
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Status do Documento</p>
                        <p className="text-sm font-black text-slate-700">AGUARDANDO VALIDAÇÃO</p>
                    </div>

                    <div className="flex items-center gap-4 w-full md:w-auto">
                        <Button 
                            variant="ghost" 
                            onClick={() => setShowRejectForm(true)}
                            className="text-xs font-black text-slate-400 uppercase hover:text-red-500 hover:bg-red-50 rounded-xl h-12 flex-1 md:flex-none"
                        >
                            Solicitar Ajustes
                        </Button>
                        <Button 
                            onClick={handleApprove} 
                            disabled={isProcessing}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white font-black uppercase text-xs tracking-widest h-12 px-10 rounded-xl shadow-lg shadow-emerald-500/20 flex-1 md:flex-none"
                        >
                            {isProcessing ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Check className="h-4 w-4 mr-2" />}
                            Aprovar RDO
                        </Button>
                    </div>
                </>
            ) : (
                <div className="w-full flex flex-col md:flex-row gap-3 items-end animate-in slide-in-from-bottom-2">
                    <div className="w-full">
                        <Label className="text-[10px] font-black uppercase text-red-500 ml-2">Motivo da Correção</Label>
                        <Textarea 
                            placeholder="Descreva o que precisa ser ajustado no relatório..."
                            value={rejectionReason}
                            onChange={(e) => setRejectionReason(e.target.value)}
                            className="bg-red-50/30 border-red-100 rounded-xl min-h-[50px] font-medium text-sm mt-1"
                            autoFocus
                        />
                    </div>
                    <div className="flex gap-2 w-full md:w-auto">
                        <Button variant="outline" onClick={() => setShowRejectForm(false)} className="h-12 rounded-xl px-6 font-bold">Cancelar</Button>
                        <Button 
                            variant="destructive" 
                            onClick={handleReject} 
                            disabled={isProcessing}
                            className="h-12 rounded-xl px-8 font-black uppercase text-[10px] tracking-widest"
                        >
                            {isProcessing ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Send className="h-4 w-4 mr-2" />}
                            Enviar
                        </Button>
                    </div>
                </div>
            )}
        </div>
      </footer>
    </div>
  );
};

export default PublicRdoApproval;