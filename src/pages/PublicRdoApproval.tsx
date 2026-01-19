"use client";

import { useParams } from "react-router-dom";
import { useRdoByToken, useApproveRdo, useRejectRdo } from "@/hooks/use-rdo";
import { Loader2, CheckCircle2, AlertTriangle, Cloud, Sun, Users, ImageIcon, ChevronDown, Send, ArrowLeft, X } from "lucide-react";
import { useState, useRef } from "react";
import SignatureCanvas from 'react-signature-canvas';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { showError, showSuccess } from "@/utils/toast";
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

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-accent/5">
        <Loader2 className="h-10 w-10 animate-spin text-primary mb-4" />
        <p className="text-muted-foreground font-bold uppercase tracking-widest text-xs">Carregando Relatório...</p>
      </div>
    );
  }

  if (error || !rdo) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center">
        <AlertTriangle className="h-12 w-12 text-destructive mb-4" />
        <h1 className="text-xl font-black">Link Expirado ou Inválido</h1>
        <p className="text-muted-foreground mt-2">Este relatório não foi encontrado. Entre em contato com o engenheiro responsável.</p>
      </div>
    );
  }

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
        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mb-6">
            <CheckCircle2 className="h-12 w-12 text-green-600" />
        </div>
        <h1 className="text-2xl font-black text-green-800 uppercase tracking-tight">Relatório Aprovado!</h1>
        <p className="text-green-700 font-medium mt-2 max-w-xs">
          Obrigado! Sua assinatura foi registrada e o engenheiro já foi notificado.
        </p>
        <Badge className="mt-6 bg-green-600">Aprovado em {format(parseISO(rdo.approved_at!), "dd/MM/yy HH:mm")}</Badge>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-32">
      <div className="max-w-md mx-auto bg-white min-h-screen shadow-2xl relative">
        
        {/* Header */}
        <header className="p-6 text-center border-b space-y-4">
          <img src={LOGO_URL} alt="Meu RDO" className="h-10 mx-auto object-contain" />
          <div className="flex flex-col items-center gap-2">
            <Badge className={cn(
                "uppercase font-black tracking-widest px-4 py-1.5",
                rdo.status === 'pending' ? "bg-orange-500" : "bg-slate-400"
            )}>
                {rdo.status === 'pending' ? 'Aguardando sua Aprovação' : 'Em Revisão'}
            </Badge>
            <h1 className="text-lg font-black uppercase text-slate-800 tracking-tight">
                {rdo.obras?.nome}
            </h1>
            <p className="text-xs text-muted-foreground font-bold">
                Relatório de {format(parseISO(rdo.data_rdo), "dd 'de' MMMM", { locale: ptBR })}
            </p>
          </div>
        </header>

        <main className="p-4 space-y-6">
          
          {/* Summary Grid */}
          <div className="grid grid-cols-2 gap-3">
            <Card className="border-none shadow-sm bg-blue-50/50">
              <CardContent className="p-4 flex flex-col items-center text-center gap-1">
                <Sun className="h-6 w-6 text-orange-400" />
                <span className="text-[10px] font-black uppercase text-blue-800/40">Condição</span>
                <span className="text-xs font-bold text-blue-900">PRATICÁVEL</span>
              </CardContent>
            </Card>
            <Card className="border-none shadow-sm bg-green-50/50">
              <CardContent className="p-4 flex flex-col items-center text-center gap-1">
                <Users className="h-6 w-6 text-green-600" />
                <span className="text-[10px] font-black uppercase text-green-800/40">Efetivo</span>
                <span className="text-xs font-bold text-green-900">{totalWorkers} Colaboradores</span>
              </CardContent>
            </Card>
            <Card className="border-none shadow-sm bg-purple-50/50">
              <CardContent className="p-4 flex flex-col items-center text-center gap-1">
                <ImageIcon className="h-6 w-6 text-purple-600" />
                <span className="text-[10px] font-black uppercase text-purple-800/40">Fotos</span>
                <span className="text-xs font-bold text-purple-900">{photoCount} Evidências</span>
              </CardContent>
            </Card>
            <Card className="border-none shadow-sm bg-orange-50/50">
              <CardContent className="p-4 flex flex-col items-center text-center gap-1">
                <div className="w-full space-y-1">
                    <span className="text-[10px] font-black uppercase text-orange-800/40">Atividades</span>
                    <Progress value={(completedActivities/totalActivities)*100} className="h-1.5" />
                    <span className="text-[10px] font-bold text-orange-900">{completedActivities}/{totalActivities} Concluídas</span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Photo Gallery */}
          <div className="space-y-3">
            <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 ml-1">Galeria do Dia</h3>
            <div className="flex gap-3 overflow-x-auto pb-4 snap-x custom-scrollbar">
                {rdo.rdo_atividades_detalhe?.filter(a => a.foto_anexo_url).map((atv, i) => (
                    <div key={i} className="min-w-[280px] h-48 rounded-2xl overflow-hidden relative snap-center shadow-lg">
                        <img src={atv.foto_anexo_url!} alt="Foto" className="w-full h-full object-cover" />
                        <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/80 to-transparent">
                            <p className="text-white text-[10px] font-bold uppercase truncate">{atv.descricao_servico}</p>
                        </div>
                    </div>
                ))}
                {photoCount === 0 && (
                    <div className="w-full py-10 text-center border-2 border-dashed rounded-2xl text-muted-foreground/30">
                        <ImageIcon className="mx-auto mb-2" />
                        <p className="text-[10px] font-bold uppercase">Nenhuma foto anexada hoje</p>
                    </div>
                )}
            </div>
          </div>

          {/* Technical Details Accordion */}
          <Accordion type="single" collapsible className="w-full border rounded-2xl overflow-hidden bg-white shadow-sm">
            <AccordionItem value="details" className="border-none">
              <AccordionTrigger className="px-4 py-4 hover:no-underline hover:bg-slate-50 transition-colors group">
                <div className="flex items-center gap-2 text-slate-700">
                    <ChevronDown className="h-4 w-4 text-primary group-data-[state=open]:rotate-180 transition-transform" />
                    <span className="text-xs font-black uppercase tracking-wider">Ver Detalhes Técnicos</span>
                </div>
              </AccordionTrigger>
              <AccordionContent className="px-4 pb-4 space-y-6">
                
                {/* Services List */}
                <div className="space-y-3">
                    <h4 className="text-[10px] font-black uppercase text-primary tracking-widest">Serviços Executados</h4>
                    <div className="space-y-2">
                        {rdo.rdo_atividades_detalhe?.map((atv, i) => (
                            <div key={i} className="flex justify-between items-center p-3 bg-slate-50 rounded-xl border">
                                <div className="space-y-1">
                                    <p className="text-xs font-bold text-slate-800">{atv.descricao_servico}</p>
                                    {atv.observacao && <p className="text-[10px] text-muted-foreground italic">"{atv.observacao}"</p>}
                                </div>
                                <Badge variant={atv.avanco_percentual === 100 ? "default" : "outline"} className="text-[9px] font-black h-5">
                                    {atv.avanco_percentual}%
                                </Badge>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Team List */}
                <div className="space-y-3">
                    <h4 className="text-[10px] font-black uppercase text-primary tracking-widest">Equipe em Campo</h4>
                    <div className="flex flex-wrap gap-2">
                        {rdo.rdo_mao_de_obra?.map((m, i) => (
                            <Badge key={i} variant="secondary" className="bg-white border rounded-lg px-3 py-1 font-bold text-slate-600">
                                {m.quantidade}x {m.funcao}
                            </Badge>
                        ))}
                    </div>
                </div>

                {/* Occurrences */}
                {rdo.impedimentos_comentarios && (
                    <div className="p-4 bg-red-50 border border-red-100 rounded-xl space-y-2">
                        <div className="flex items-center gap-2 text-red-700">
                            <AlertTriangle className="h-4 w-4" />
                            <h4 className="text-[10px] font-black uppercase tracking-widest">Ocorrências / Impedimentos</h4>
                        </div>
                        <p className="text-xs text-red-900 leading-relaxed font-medium">
                            {rdo.impedimentos_comentarios}
                        </p>
                    </div>
                )}

              </AccordionContent>
            </AccordionItem>
          </Accordion>

          {/* Signature Area */}
          <section className="pt-6 space-y-4 border-t border-dashed mt-8">
            <div className="text-center">
                <h3 className="text-sm font-black uppercase tracking-tight text-slate-800">Assinatura do Cliente</h3>
                <p className="text-[10px] text-muted-foreground font-medium uppercase mt-1">Concordo com as informações registradas acima</p>
            </div>
            
            <div 
                className={cn(
                    "border-2 border-dashed rounded-3xl bg-slate-50 overflow-hidden relative h-32 transition-all",
                    isSigning && "ring-4 ring-primary/20 border-primary"
                )}
            >
                <SignatureCanvas
                    ref={sigPad}
                    penColor='#066abc'
                    canvasProps={{ 
                        width: 400, 
                        height: 128, 
                        className: 'sigCanvas w-full h-full cursor-crosshair' 
                    }}
                    onBegin={() => setIsSigning(true)}
                />
                {!isSigning && (
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none text-slate-300 font-black uppercase tracking-[0.2em] text-[10px]">
                        Toque para Assinar Aqui
                    </div>
                )}
                {isSigning && (
                    <button 
                        onClick={() => { sigPad.current.clear(); setIsSigning(false); }}
                        className="absolute top-2 right-2 p-2 rounded-full bg-white shadow-md text-destructive hover:bg-red-50"
                    >
                        <X className="h-4 w-4" />
                    </button>
                )}
            </div>
          </section>

        </main>

        {/* Action Bar Footer */}
        <footer className="fixed bottom-0 left-0 right-0 max-w-md mx-auto p-4 bg-white/80 backdrop-blur-md border-t shadow-[0_-10px_30px_rgba(0,0,0,0.05)] grid grid-cols-1 gap-3 z-20">
            {showRejectForm ? (
                <div className="space-y-3 animate-in slide-in-from-bottom-2">
                    <Textarea 
                        placeholder="Quais itens precisam de correção? (Ex: A quantidade de cimento está errada)"
                        value={rejectionReason}
                        onChange={(e) => setRejectionReason(e.target.value)}
                        className="bg-red-50 border-red-100 text-xs min-h-[80px]"
                        autoFocus
                    />
                    <div className="flex gap-2">
                        <Button variant="ghost" onClick={() => setShowRejectForm(false)} className="flex-1 font-bold text-slate-500">Cancelar</Button>
                        <Button 
                            variant="destructive" 
                            onClick={handleReject} 
                            disabled={isProcessing}
                            className="flex-1 font-black uppercase text-[10px] tracking-widest rounded-xl"
                        >
                            {isProcessing ? <Loader2 className="h-4 w-4 animate-spin" /> : "Enviar Correção"}
                        </Button>
                    </div>
                </div>
            ) : (
                <>
                    <Button 
                        size="lg" 
                        onClick={handleApprove} 
                        disabled={isProcessing}
                        className="bg-[#22c55e] hover:bg-[#16a34a] text-white font-black uppercase text-xs tracking-[0.1em] h-14 rounded-2xl shadow-xl shadow-green-500/20"
                    >
                        {isProcessing ? <Loader2 className="h-5 w-5 animate-spin mr-2" /> : "✅ APROVAR RELATÓRIO"}
                    </Button>
                    <button 
                        onClick={() => setShowRejectForm(true)}
                        className="text-[10px] font-black uppercase text-red-600 tracking-widest hover:underline py-2 opacity-60 hover:opacity-100 transition-opacity"
                    >
                        Solicitar Correção do Diário
                    </button>
                </>
            )}
        </footer>
      </div>
    </div>
  );
};

export default PublicRdoApproval;