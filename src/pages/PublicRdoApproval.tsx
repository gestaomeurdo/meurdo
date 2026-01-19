"use client";

import { useParams } from "react-router-dom";
import { useRdoByToken, useApproveRdo, useRejectRdo } from "@/hooks/use-rdo";
import { 
  Loader2, CheckCircle2, AlertTriangle, Cloud, Sun, Users, ImageIcon, 
  FileDown, Check, X, MapPin, Calendar, Camera, ListChecks, ShieldCheck, 
  Signature as SignatureIcon, Send, Truck, HardHat, Info, Clock, AlertCircle, 
  Eye, CloudRain, CloudLightning, Package, User, Building, Briefcase, Smartphone, ClipboardCheck, ArrowUp
} from "lucide-react";
import { useState, useRef, useEffect, useMemo } from "react";
import SignatureCanvas from 'react-signature-canvas';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { showError, showSuccess } from "@/utils/toast";
import { generateRdoPdf } from "@/utils/rdo-pdf";
import confetti from "canvas-confetti";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

const LOGO_URL = "https://meurdo.com.br/wp-content/uploads/2026/01/Logo-MEU-RDO-scaled.png";

const PublicRdoApproval = () => {
  const { token } = useParams<{ token: string }>();
  const { data: rdo, isLoading, error, refetch } = useRdoByToken(token);
  const approveMutation = useApproveRdo();
  const rejectMutation = useRejectRdo();
  
  const sigPad = useRef<any>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [clientName, setClientName] = useState("");
  const [clientRole, setClientRole] = useState("");
  const [rejectionReason, setRejectionReason] = useState("");
  const [showRejectForm, setShowRejectForm] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [selectedPhoto, setSelectedPhoto] = useState<{url: string, desc: string} | null>(null);

  // Monitorar alterações em tempo real
  useEffect(() => {
    if (!rdo?.id) return;
    const channel = supabase
      .channel(`public_rdo_${rdo.id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'diarios_obra', filter: `id=eq.${rdo.id}` }, () => refetch())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [rdo?.id, refetch]);

  const isApproved = rdo?.status === 'approved';

  // Regra de Validez Jurídica: Nome + Cargo + Desenho
  const canApprove = useMemo(() => {
    return clientName.trim().length >= 3 && clientRole.trim().length >= 2 && isDrawing;
  }, [clientName, clientRole, isDrawing]);

  const handleApprove = async () => {
    if (sigPad.current?.isEmpty() || !canApprove) {
      showError("Por favor, preencha sua identificação e desenhe sua assinatura.");
      return;
    }
    setIsProcessing(true);
    try {
      const base64Data = sigPad.current.toDataURL('image/png');
      const blob = await (await fetch(base64Data)).blob();
      const filePath = `assinaturas_clientes/${rdo.obra_id}/${rdo.id}-${Date.now()}.png`;
      const { error: uploadError } = await supabase.storage.from('documentos_financeiros').upload(filePath, blob, { contentType: 'image/png' });
      if (uploadError) throw uploadError;
      const { data: publicUrlData } = supabase.storage.from('documentos_financeiros').getPublicUrl(filePath);
      
      const metadata = {
          signer_name: clientName,
          signer_role: clientRole,
          user_agent: window.navigator.userAgent,
          signed_at: new Date().toISOString(),
          screen_size: `${window.innerWidth}x${window.innerHeight}`
      };

      await approveMutation.mutateAsync({ 
          token: token!, 
          signatureUrl: publicUrlData.publicUrl,
          signerName: clientName,
          signerRole: clientRole,
          metadata
      });
      confetti({ particleCount: 150, spread: 70, origin: { y: 0.6 } });
      showSuccess("Relatório assinado com sucesso!");
    } catch (err: any) { showError(err.message || "Erro ao aprovar."); } finally { setIsProcessing(false); }
  };

  const handleReject = async () => {
    if (!rejectionReason.trim()) { showError("Informe o que precisa ser ajustado."); return; }
    setIsProcessing(true);
    try {
      await rejectMutation.mutateAsync({ token: token!, reason: rejectionReason });
      showSuccess("Solicitação de correção enviada ao engenheiro.");
      setShowRejectForm(false);
    } catch (err: any) { showError("Erro ao enviar."); } finally { setIsProcessing(false); }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-accent/5">
        <Loader2 className="h-10 w-10 animate-spin text-primary mb-4" />
        <p className="text-muted-foreground font-bold uppercase tracking-widest text-xs">Validando Relatório Digital...</p>
      </div>
    );
  }

  if (error || !rdo) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center bg-slate-50">
        <AlertTriangle className="h-12 w-12 text-destructive mb-4" />
        <h1 className="text-xl font-black uppercase tracking-tight">Relatório não encontrado</h1>
        <p className="text-muted-foreground mt-2">O link pode ter expirado ou o relatório foi removido.</p>
        <Button variant="outline" onClick={() => window.location.reload()} className="mt-6 font-bold uppercase text-xs rounded-xl">Tentar Novamente</Button>
      </div>
    );
  }

  const engineerName = rdo.profiles ? `${rdo.profiles.first_name || ''} ${rdo.profiles.last_name || ''}`.trim() : "Engenheiro Responsável";

  // RENDERIZAÇÃO DA TELA DE SUCESSO (STATE CHANGE)
  if (isApproved) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 font-sans text-center">
        <div className="max-w-md w-full space-y-8 animate-in fade-in zoom-in duration-500">
            <div className="bg-white p-12 rounded-[3.5rem] shadow-2xl border border-emerald-100 flex flex-col items-center relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-2 bg-emerald-500"></div>
                
                <div className="w-24 h-24 bg-emerald-100 rounded-full flex items-center justify-center mb-6 scale-110">
                    <CheckCircle2 className="w-12 h-12 text-emerald-600" />
                </div>
                
                <h1 className="text-3xl font-black text-slate-800 uppercase tracking-tight leading-tight">
                    RDO Aprovado com Sucesso!
                </h1>
                
                <p className="text-slate-500 font-medium mt-4 leading-relaxed">
                    O registro técnico foi validado e arquivado digitalmente em <span className="font-bold text-slate-700">{format(parseISO(rdo.approved_at!), "dd/MM/yyyy 'às' HH:mm")}</span>.
                </p>

                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 w-full mt-8">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">Protocolo de Autenticidade</p>
                    <p className="font-mono text-xs text-primary font-bold">{rdo.id.toUpperCase()}</p>
                </div>

                <div className="pt-10 w-full space-y-4">
                    <Button 
                        size="lg"
                        onClick={async () => {
                            setIsDownloading(true);
                            await generateRdoPdf(rdo, rdo.obras?.nome || "Obra", rdo.profiles as any, rdo.obras as any);
                            setIsDownloading(false);
                        }}
                        disabled={isDownloading}
                        className="w-full bg-[#066abc] hover:bg-[#066abc]/90 text-white rounded-2xl h-16 font-black uppercase text-xs tracking-widest shadow-xl shadow-blue-500/20"
                    >
                        {isDownloading ? <Loader2 className="w-5 h-5 mr-2 animate-spin" /> : <FileDown className="w-5 h-5 mr-2" />}
                        Baixar PDF Assinado
                    </Button>
                    
                    <button 
                        onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                        className="flex items-center justify-center gap-2 text-slate-400 font-bold uppercase text-[10px] tracking-widest hover:text-primary transition-colors w-full"
                    >
                        <ArrowUp className="w-3 h-3" /> Ver detalhes do relatório
                    </button>
                </div>
            </div>
            
            <img src={LOGO_URL} alt="Meu RDO" className="h-6 mx-auto opacity-30 object-contain grayscale" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8fafc] flex flex-col font-sans">
      
      {/* Lightbox para fotos */}
      {selectedPhoto && (
        <div className="fixed inset-0 z-[100] bg-black/95 flex flex-col items-center justify-center p-4 animate-in fade-in duration-300" onClick={() => setSelectedPhoto(null)}>
            <button className="absolute top-6 right-6 text-white bg-white/10 p-3 rounded-full hover:bg-white/20 transition-all"><X className="w-6 h-6" /></button>
            <div className="max-w-4xl w-full space-y-4" onClick={e => e.stopPropagation()}>
                <img src={selectedPhoto.url} alt="Zoom" className="w-full h-auto max-h-[80vh] object-contain rounded-2xl shadow-2xl border border-white/10" />
                <div className="bg-white/10 backdrop-blur-md p-4 rounded-xl text-center">
                    <p className="text-white font-bold uppercase tracking-widest text-xs">{selectedPhoto.desc}</p>
                </div>
            </div>
        </div>
      )}

      {/* HEADER STICKY */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b px-4 py-3 flex items-center justify-between shadow-sm">
        <img src={LOGO_URL} alt="Meu RDO" className="h-7 object-contain" />
        <div className="flex gap-2">
            <Button 
                variant="outline" 
                size="sm"
                onClick={async () => {
                    setIsDownloading(true);
                    await generateRdoPdf(rdo, rdo.obras?.nome || "Obra", rdo.profiles as any, rdo.obras as any);
                    setIsDownloading(false);
                }}
                className="rounded-xl font-bold uppercase text-[9px] tracking-widest h-9 border-slate-300"
            >
                {isDownloading ? <Loader2 className="w-3 h-3 mr-2 animate-spin" /> : <FileDown className="w-3 h-3 mr-2 text-primary" />}
                Baixar PDF
            </Button>
        </div>
      </header>

      <main className="max-w-5xl mx-auto w-full pb-32">
        
        {/* HERO IMERSIVO */}
        <section className="relative h-[350px] sm:h-[450px] w-full overflow-hidden flex items-end p-6 sm:p-12 mb-10 group">
            {rdo.obras?.foto_url ? (
                <img src={rdo.obras.foto_url} className="absolute inset-0 w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105" alt="Obra" />
            ) : (
                <div className="absolute inset-0 bg-gradient-to-br from-[#066abc] to-[#044a83]"></div>
            )}
            <div className="absolute inset-0 bg-black/60 backdrop-blur-[2px]"></div>
            <div className="relative z-10 w-full animate-in slide-in-from-bottom-8 duration-700">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-6">
                    <div className="space-y-4">
                        <Badge className={cn("uppercase font-black tracking-widest px-4 py-1.5 rounded-full text-[10px] border-none shadow-lg", 
                             rdo.status === 'pending' ? "bg-orange-500 text-white" : "bg-red-500 text-white")}>
                            {rdo.status === 'pending' ? 'Aguardando Conferência' : 'Correção Solicitada'}
                        </Badge>
                        <h1 className="text-4xl sm:text-6xl font-black uppercase text-white tracking-tighter leading-none drop-shadow-2xl">
                            {rdo.obras?.nome || "Diário de Obra"}
                        </h1>
                        <div className="space-y-2">
                            {rdo.obras?.dono_cliente && (
                                <p className="text-white/90 font-black text-xs sm:text-sm uppercase tracking-widest flex items-center">
                                    <Building className="w-4 h-4 mr-2 text-primary fill-primary" /> Contratante: {rdo.obras.dono_cliente}
                                </p>
                            )}
                            {rdo.obras?.endereco && (
                                <p className="text-white/70 font-bold text-xs sm:text-sm uppercase tracking-wider flex items-center">
                                    <MapPin className="w-4 h-4 mr-2" /> {rdo.obras.endereco}
                                </p>
                            )}
                        </div>
                    </div>
                    <div className="bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/20 text-white shrink-0 shadow-2xl">
                        <p className="text-[9px] font-black uppercase tracking-widest opacity-60 mb-1">Data do Diário</p>
                        <p className="text-xl font-black">{format(parseISO(rdo.data_rdo), "dd 'de' MMMM", { locale: ptBR })}</p>
                        <p className="text-[10px] font-bold opacity-80">{format(parseISO(rdo.data_rdo), "EEEE", { locale: ptBR }).toUpperCase()}</p>
                    </div>
                </div>
            </div>
        </section>

        <div className="px-4 sm:px-8 space-y-12">
            {/* KPI CARDS RESUMIDOS */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {[
                    { label: "Mão de Obra", val: rdo.rdo_mao_de_obra?.reduce((s, m) => s + m.quantidade, 0) || 0, icon: Users },
                    { label: "Atividades", val: rdo.rdo_atividades_detalhe?.length || 0, icon: ClipboardCheck },
                    { label: "Segurança", val: "Conforme", icon: ShieldCheck },
                    { label: "Equipamentos", val: rdo.rdo_equipamentos?.length || 0, icon: Truck },
                ].map((kpi, i) => (
                    <div key={i} className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-3">
                        <div className="bg-primary/5 p-2 rounded-xl"><kpi.icon className="w-5 h-5 text-primary" /></div>
                        <div>
                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">{kpi.label}</p>
                            <p className="text-lg font-black text-slate-800 leading-none">{kpi.val}</p>
                        </div>
                    </div>
                ))}
            </div>

            {/* SEÇÃO TÉCNICA: SERVIÇOS EXECUTADOS */}
            <section className="space-y-4">
                <h3 className="text-xs font-black uppercase tracking-[0.2em] text-slate-400 flex items-center gap-2">
                    <ListChecks className="w-4 h-4" /> Atividades Realizadas no Período
                </h3>
                <div className="space-y-4">
                    {rdo.rdo_atividades_detalhe?.map((atv, i) => (
                        <Card key={i} className="border-none shadow-sm rounded-3xl overflow-hidden bg-white hover:shadow-md transition-shadow">
                            <div className="p-6 flex flex-col md:flex-row md:items-center gap-6">
                                <div className="flex-1 space-y-3">
                                    <h4 className="text-lg font-black text-slate-800 uppercase tracking-tight">{atv.descricao_servico}</h4>
                                    {atv.observacao && <p className="text-xs text-muted-foreground font-medium bg-slate-50 p-2 rounded-lg border-l-4 border-slate-200 italic">"{atv.observacao}"</p>}
                                    <div className="space-y-1.5">
                                        <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest text-slate-400 px-1">
                                            <span>Avanço Reportado</span>
                                            <span className="text-primary font-black">{atv.avanco_percentual}%</span>
                                        </div>
                                        <Progress value={atv.avanco_percentual} className="h-2" />
                                    </div>
                                </div>
                                {atv.foto_anexo_url && (
                                    <div className="w-full md:w-32 h-20 rounded-2xl overflow-hidden cursor-zoom-in border shrink-0 group relative" onClick={() => setSelectedPhoto({ url: atv.foto_anexo_url!, desc: atv.descricao_servico })}>
                                        <img src={atv.foto_anexo_url} className="w-full h-full object-cover" alt="Evidência" />
                                        <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"><Eye className="text-white w-5 h-5" /></div>
                                    </div>
                                )}
                            </div>
                        </Card>
                    ))}
                </div>
            </section>

            {/* SEÇÃO SEGURANÇA E NOTAS */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                <div className="lg:col-span-4 space-y-4">
                    <h3 className="text-xs font-black uppercase tracking-[0.2em] text-slate-400 flex items-center gap-2">
                        <ShieldCheck className="w-4 h-4" /> Segurança (HSE)
                    </h3>
                    <Card className="border-none shadow-sm rounded-[2rem] overflow-hidden bg-white">
                        <div className="bg-emerald-600 px-6 py-3 flex items-center justify-between">
                            <span className="text-white font-black text-[10px] uppercase tracking-[0.15em]">Checklist NR</span>
                            <CheckCircle2 className="w-4 h-4 text-emerald-100" />
                        </div>
                        <CardContent className="p-6 space-y-4">
                            {[
                                { label: "Trabalho em Altura (NR-35)", val: rdo.safety_nr35 },
                                { label: "Uso de EPIs", val: rdo.safety_epi },
                                { label: "Limpeza de Obra", val: rdo.safety_cleaning },
                                { label: "DDS Realizado", val: rdo.safety_dds },
                            ].map((item, i) => (
                                <div key={i} className="flex items-center justify-between text-xs">
                                    <span className="font-bold text-slate-600 uppercase">{item.label}</span>
                                    {item.val ? <Check className="w-4 h-4 text-emerald-600" /> : <X className="w-4 h-4 text-slate-300" />}
                                </div>
                            ))}
                        </CardContent>
                    </Card>
                </div>
                <div className="lg:col-span-8 space-y-4">
                    <h3 className="text-xs font-black uppercase tracking-[0.2em] text-slate-400 flex items-center gap-2">
                        <AlertCircle className="w-4 h-4" /> Observações do Dia
                    </h3>
                    <Card className={cn("border-none shadow-sm rounded-[2rem] p-8 h-full bg-white flex flex-col", rdo.impedimentos_comentarios ? "ring-1 ring-red-100" : "")}>
                        {rdo.impedimentos_comentarios ? (
                            <div className="space-y-2">
                                <p className="text-[10px] font-black text-red-500 uppercase tracking-widest">Impedimentos Relatados:</p>
                                <p className="text-sm font-medium text-red-800 leading-relaxed bg-red-50 p-4 rounded-2xl border border-red-100">{rdo.impedimentos_comentarios}</p>
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center py-6 opacity-30 text-center flex-1">
                                <CheckCircle2 className="w-10 h-10 text-slate-400 mb-2" />
                                <p className="text-xs font-bold uppercase tracking-widest">Nenhuma ocorrência</p>
                            </div>
                        )}
                        {rdo.observacoes_gerais && (
                            <div className="mt-6 pt-6 border-t border-slate-100">
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Comentários Técnicos:</p>
                                <p className="text-sm font-medium text-slate-700 leading-relaxed">{rdo.observacoes_gerais}</p>
                            </div>
                        )}
                    </Card>
                </div>
            </div>

            {/* CARIMBO DO RESPONSÁVEL TÉCNICO */}
            <section className="pt-10 border-t-4 border-slate-100 space-y-4">
                <h3 className="text-xs font-black uppercase tracking-[0.2em] text-slate-400 flex items-center gap-2">
                    <SignatureIcon className="w-4 h-4" /> Emissão e Responsabilidade Técnica
                </h3>
                <Card className="border-none shadow-sm rounded-3xl bg-white border border-slate-100 overflow-hidden ring-1 ring-emerald-50">
                    <div className="p-6 flex flex-col sm:flex-row items-center justify-between gap-6">
                        <div className="flex items-center gap-4">
                            <Avatar className="h-16 w-16 border-2 border-white shadow-md">
                                <AvatarImage src={rdo.profiles?.avatar_url || ""} />
                                <AvatarFallback className="bg-primary/10 text-primary font-black"><User /></AvatarFallback>
                            </Avatar>
                            <div>
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Emitido e Validado por:</p>
                                <p className="text-xl font-black text-slate-800 uppercase leading-none">{engineerName}</p>
                                <p className="text-xs font-bold text-primary uppercase mt-1">Engenheiro / Responsável Técnico</p>
                            </div>
                        </div>
                        <div className="text-right flex flex-col items-center sm:items-end gap-2">
                            <Badge className="bg-emerald-600 hover:bg-emerald-600 px-4 py-1.5 rounded-full font-black uppercase text-[10px] tracking-widest shadow-lg shadow-emerald-500/20">
                            <CheckCircle2 className="w-3.5 h-3.5 mr-2" /> Assinado Digitalmente
                            </Badge>
                            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Protocolo: RDO-{rdo.id.substring(0,8).toUpperCase()}</p>
                        </div>
                    </div>
                </section>

                <section className="pt-20 border-t-4 border-slate-100 space-y-8 animate-in slide-in-from-bottom-4">
                    <div className="text-center space-y-2">
                        <div className="bg-primary/10 w-20 h-20 rounded-[2rem] flex items-center justify-center mx-auto mb-4">
                            <SignatureIcon className="w-10 h-10 text-primary" />
                        </div>
                        <h3 className="text-2xl sm:text-3xl font-black uppercase tracking-tight text-slate-800">Assinatura Digital do Cliente</h3>
                        <p className="text-sm text-muted-foreground font-medium max-w-sm mx-auto">Preencha sua identificação para habilitar o painel de assinatura.</p>
                    </div>

                    <div className="max-w-[500px] mx-auto space-y-6">
                        <div className="grid grid-cols-1 gap-4">
                            <div className="space-y-2">
                                <Label className="text-[10px] font-black uppercase text-slate-400 ml-2 tracking-widest">Seu Nome Completo</Label>
                                <Input 
                                    placeholder="Ex: João da Silva" 
                                    value={clientName} 
                                    onChange={(e) => setClientName(e.target.value)}
                                    className="h-12 rounded-xl bg-white border-slate-200 focus:ring-primary shadow-sm"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-[10px] font-black uppercase text-slate-400 ml-2 tracking-widest">Seu Cargo ou Vínculo</Label>
                                <Input 
                                    placeholder="Ex: Proprietário, Engenheiro Fiscal..." 
                                    value={clientRole} 
                                    onChange={(e) => setClientRole(e.target.value)}
                                    className="h-12 rounded-xl bg-white border-slate-200 focus:ring-primary shadow-sm"
                                />
                            </div>
                        </div>

                        <div className={cn(
                            "border-4 border-dashed rounded-[2.5rem] bg-white overflow-hidden relative aspect-[16/7] transition-all shadow-inner",
                            isDrawing ? "ring-8 ring-primary/5 border-primary" : "border-slate-200 opacity-60"
                        )}>
                            <SignatureCanvas 
                                ref={sigPad} 
                                penColor='#066abc' 
                                canvasProps={{ className: 'sigCanvas w-full h-full cursor-crosshair' }} 
                                onBegin={() => setIsDrawing(true)} 
                            />
                            {!isDrawing && (
                                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none opacity-40">
                                    <Smartphone className="w-8 h-8 mb-2 text-slate-400" />
                                    <span className="text-[9px] font-black uppercase tracking-[0.4em] mb-1">Área de Assinatura</span>
                                    <span className="text-xs font-medium">Toque ou use o mouse</span>
                                </div>
                            )}
                            {isDrawing && (
                                <button 
                                    onClick={() => { sigPad.current.clear(); setIsDrawing(false); }} 
                                    className="absolute top-4 right-4 p-2.5 rounded-full bg-slate-100 text-destructive hover:bg-red-50 transition-colors shadow-lg"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            )}
                        </div>

                        <p className="text-[10px] text-center text-muted-foreground uppercase font-black tracking-widest leading-relaxed">
                            Ao assinar, você valida legalmente os dados deste relatório<br/>através do protocolo digital Meu RDO.
                        </p>
                    </div>
                </section>
        </div>
      </main>

      {/* RODAPÉ DE AÇÕES FIXO */}
      <footer className="fixed bottom-0 left-0 right-0 p-4 bg-white/95 backdrop-blur-md border-t shadow-[0_-4px_30px_rgba(0,0,0,0.05)] z-[60]">
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
            {!showRejectForm ? (
                <>
                    <div className="hidden md:flex items-center gap-3">
                        <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center"><Clock className="w-5 h-5 text-slate-400" /></div>
                        <div>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none">Status do Processo</p>
                            <p className="text-sm font-black text-slate-700 uppercase tracking-tight">Aguardando sua Validação</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-4 w-full md:w-auto">
                        <button 
                            onClick={() => setShowRejectForm(true)} 
                            className="text-[10px] font-black text-slate-400 uppercase hover:text-red-500 rounded-xl h-12 flex-1 md:flex-none transition-colors"
                        >
                            Solicitar Ajustes
                        </button>
                        <Button 
                            onClick={handleApprove} 
                            disabled={isProcessing || !canApprove} 
                            className={cn(
                                "font-black uppercase text-xs tracking-widest h-12 px-10 rounded-xl flex-1 md:flex-none shadow-lg transition-all",
                                canApprove ? "bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-500/30 scale-105" : "bg-slate-200 text-slate-400 cursor-not-allowed shadow-none"
                            )}
                        >
                            {isProcessing ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <CheckCircle2 className="h-4 w-4 mr-2" />} 
                            Aprovar e Assinar
                        </Button>
                    </div>
                </>
            ) : (
                <div className="w-full flex flex-col md:flex-row gap-3 items-end animate-in slide-in-from-bottom-2">
                    <div className="w-full">
                        <Label className="text-[10px] font-black uppercase text-red-500 ml-2">Descreva os ajustes necessários</Label>
                        <Textarea 
                            placeholder="Ex: Corrigir a metragem do reboco ou a quantidade de serventes..." 
                            value={rejectionReason} 
                            onChange={(e) => setRejectionReason(e.target.value)} 
                            className="bg-red-50/30 border-red-100 rounded-xl min-h-[60px] font-medium text-sm mt-1 focus:ring-red-500" 
                            autoFocus 
                        />
                    </div>
                    <div className="flex gap-2 w-full md:w-auto">
                        <Button variant="outline" onClick={() => setShowRejectForm(false)} className="h-12 rounded-xl px-6 font-bold">Cancelar</Button>
                        <Button variant="destructive" onClick={handleReject} disabled={isProcessing} className="h-12 rounded-xl px-8 font-black uppercase text-xs shadow-lg shadow-red-500/20">Enviar Solicitação</Button>
                    </div>
                </div>
            )}
        </div>
      </footer>
    </div>
  );
};

export default PublicRdoApproval;