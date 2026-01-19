"use client";

import { useParams } from "react-router-dom";
import { useRdoByToken, useApproveRdo, useRejectRdo } from "@/hooks/use-rdo";
import { 
  Loader2, CheckCircle2, AlertTriangle, Cloud, Sun, Users, ImageIcon, 
  FileDown, Check, X, MapPin, Calendar, Camera, ListChecks, ShieldCheck, 
  Signature as SignatureIcon, Send, Truck, HardHat, Info, Clock, AlertCircle, 
  Eye, CloudRain, CloudLightning, Package, User, Building, Briefcase, Smartphone, ClipboardCheck, ArrowUp, TrendingUp
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

  useEffect(() => {
    if (!rdo?.id) return;
    const channel = supabase
      .channel(`public_rdo_${rdo.id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'diarios_obra', filter: `id=eq.${rdo.id}` }, () => refetch())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [rdo?.id, refetch]);

  const isApproved = rdo?.status === 'approved';
  const canApprove = useMemo(() => clientName.trim().length >= 3 && clientRole.trim().length >= 2 && isDrawing, [clientName, clientRole, isDrawing]);

  const handleApprove = async () => {
    setIsProcessing(true);
    try {
      const base64Data = sigPad.current.toDataURL('image/png');
      const blob = await (await fetch(base64Data)).blob();
      const filePath = `assinaturas_clientes/${rdo?.id}-${Date.now()}.png`;
      await supabase.storage.from('documentos_financeiros').upload(filePath, blob, { contentType: 'image/png' });
      const { data: publicUrlData } = supabase.storage.from('documentos_financeiros').getPublicUrl(filePath);
      
      await approveMutation.mutateAsync({ 
          token: token!, signatureUrl: publicUrlData.publicUrl,
          signerName: clientName, signerRole: clientRole,
          metadata: { signed_at: new Date().toISOString(), user_agent: window.navigator.userAgent }
      });
      confetti({ particleCount: 150, spread: 70 });
      showSuccess("Assinado!");
    } catch (err: any) { showError("Erro ao aprovar."); } finally { setIsProcessing(false); }
  };

  const handleReject = async () => {
    if (!rejectionReason.trim()) return;
    setIsProcessing(true);
    try {
      await rejectMutation.mutateAsync({ token: token!, reason: rejectionReason });
      showSuccess("Ajustes solicitados.");
      setShowRejectForm(false);
    } catch (err: any) { showError("Erro ao enviar."); } finally { setIsProcessing(false); }
  };

  if (isLoading) return <div className="min-h-screen flex flex-col items-center justify-center p-4"><Loader2 className="h-10 w-10 animate-spin text-primary mb-4" /><p className="text-muted-foreground font-black uppercase tracking-widest text-[10px]">Validando Acesso...</p></div>;
  if (error || !rdo) return <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center"><AlertTriangle className="h-12 w-12 text-destructive mb-4" /><h1 className="text-xl font-black uppercase">Relatório não encontrado</h1></div>;

  const engineerName = rdo.profiles ? `${rdo.profiles.first_name || ''} ${rdo.profiles.last_name || ''}`.trim() : "Responsável Técnico";

  return (
    <div className="min-h-screen bg-[#f8fafc] pb-40">
        {selectedPhoto && (
            <div className="fixed inset-0 z-[100] bg-black/95 flex flex-col items-center justify-center p-4 animate-in fade-in duration-300" onClick={() => setSelectedPhoto(null)}>
                <button className="absolute top-6 right-6 text-white bg-white/10 p-3 rounded-full"><X className="w-6 h-6" /></button>
                <img src={selectedPhoto.url} className="max-w-4xl w-full max-h-[80vh] object-contain rounded-2xl" alt="Zoom" />
            </div>
        )}

        <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b px-6 py-4 flex items-center justify-between shadow-sm">
            <img src={LOGO_URL} alt="Meu RDO" className="h-7 object-contain" />
            <Button variant="outline" size="sm" className="rounded-xl font-black uppercase text-[9px] tracking-widest h-9" onClick={async () => { setIsDownloading(true); await generateRdoPdf(rdo, rdo.obras?.nome || "Obra", rdo.profiles as any, rdo.obras as any); setIsDownloading(false); }}>
                {isDownloading ? <Loader2 className="w-3 h-3 mr-2 animate-spin" /> : <FileDown className="w-3 h-3 mr-2" />} PDF
            </Button>
        </header>

        <main className="max-w-5xl mx-auto w-full p-4 sm:p-8 space-y-12 animate-in fade-in duration-700">
            {/* HERO SECTION */}
            <section className="relative h-[300px] sm:h-[400px] rounded-[3rem] overflow-hidden flex items-end p-8 sm:p-12 shadow-2xl">
                {rdo.obras?.foto_url ? <img src={rdo.obras.foto_url} className="absolute inset-0 w-full h-full object-cover" /> : <div className="absolute inset-0 bg-[#066abc]" />}
                <div className="absolute inset-0 bg-black/50" />
                <div className="relative z-10 space-y-4 w-full">
                    <Badge className={cn("uppercase font-black tracking-widest text-[10px] border-none shadow-lg", isApproved ? "bg-emerald-500" : "bg-orange-500")}>
                        {isApproved ? 'Relatório Aprovado' : 'Aguardando Conferência'}
                    </Badge>
                    <h1 className="text-4xl sm:text-6xl font-black uppercase text-white tracking-tighter leading-none">{rdo.obras?.nome}</h1>
                    <div className="flex flex-wrap gap-4 text-white/80 font-bold uppercase text-[10px] tracking-widest">
                        <span className="flex items-center gap-2"><Calendar className="w-3.5 h-3.5" /> {format(parseISO(rdo.data_rdo), "dd 'de' MMMM, yyyy", { locale: ptBR })}</span>
                        <span className="flex items-center gap-2"><MapPin className="w-3.5 h-3.5" /> {rdo.obras?.endereco || "Local N/A"}</span>
                    </div>
                </div>
            </section>

            {/* SEGURANÇA E CLIMA (TOP CARDS) */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="rounded-[2rem] border-none shadow-sm bg-white overflow-hidden">
                    <div className="bg-emerald-600 p-4 flex items-center justify-between">
                        <span className="text-white font-black uppercase text-[10px] tracking-widest">Segurança</span>
                        <ShieldCheck className="w-5 h-5 text-white" />
                    </div>
                    <CardContent className="p-6 flex flex-col items-center justify-center gap-3">
                        <div className="w-12 h-12 bg-emerald-50 rounded-2xl flex items-center justify-center"><CheckCircle2 className="w-7 h-7 text-emerald-600" /></div>
                        <p className="text-sm font-black text-emerald-900 uppercase tracking-tight">Zero Acidentes</p>
                    </CardContent>
                </Card>
                <Card className="rounded-[2rem] border-none shadow-sm bg-white md:col-span-2">
                    <div className="p-4 border-b bg-slate-50 flex items-center justify-between">
                         <span className="text-slate-400 font-black uppercase text-[10px] tracking-widest">Matriz Climática do Dia</span>
                         <Cloud className="w-4 h-4 text-slate-300" />
                    </div>
                    <CardContent className="p-6 grid grid-cols-3 gap-2">
                        {rdo.clima_condicoes?.split(', ').map((c, i) => (
                            <div key={i} className="text-center space-y-1">
                                <p className="text-[8px] font-black text-slate-400 uppercase">{i === 0 ? 'Manhã' : i === 1 ? 'Tarde' : 'Noite'}</p>
                                <p className="text-xs font-bold text-slate-700">{c.includes('N/T') ? 'N/T' : c.split(': ')[1]?.split(' (')[0] || 'Sol'}</p>
                            </div>
                        ))}
                    </CardContent>
                </Card>
            </div>

            {/* SERVIÇOS EXECUTADOS */}
            <section className="space-y-4">
                <h3 className="text-xs font-black uppercase tracking-[0.2em] text-slate-400 flex items-center gap-2 px-2"><ListChecks className="w-4 h-4" /> Atividades Reportadas</h3>
                <div className="grid grid-cols-1 gap-4">
                    {rdo.rdo_atividades_detalhe?.map((atv, i) => (
                        <Card key={i} className="border-none shadow-sm rounded-3xl p-6 bg-white flex flex-col sm:flex-row items-center gap-6">
                            <div className="flex-1 space-y-4 w-full">
                                <h4 className="text-lg font-black text-slate-800 uppercase tracking-tight leading-tight">{atv.descricao_servico}</h4>
                                <div className="space-y-2">
                                    <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest text-slate-400">
                                        <span>Progresso Realizado</span>
                                        <span className="text-primary">{atv.avanco_percentual}%</span>
                                    </div>
                                    <Progress value={atv.avanco_percentual} className="h-2" />
                                </div>
                            </div>
                            {atv.foto_anexo_url && (
                                <div className="w-full sm:w-40 h-24 rounded-2xl overflow-hidden cursor-zoom-in group relative shrink-0" onClick={() => setSelectedPhoto({ url: atv.foto_anexo_url!, desc: atv.descricao_servico })}>
                                    <img src={atv.foto_anexo_url} className="w-full h-full object-cover" alt="Evidência" />
                                    <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"><Eye className="text-white w-6 h-6" /></div>
                                </div>
                            )}
                        </Card>
                    ))}
                </div>
            </section>

            {/* DETALHES DE RECURSOS (EQUIPE E MÁQUINAS) */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="space-y-4">
                    <h3 className="text-xs font-black uppercase tracking-[0.2em] text-slate-400 flex items-center gap-2"><Users className="w-4 h-4" /> Efetivo em Campo</h3>
                    <Card className="rounded-3xl border-none shadow-sm overflow-hidden bg-white">
                        <div className="p-6 space-y-3">
                            {rdo.rdo_mao_de_obra?.map((m, i) => (
                                <div key={i} className="flex justify-between items-center py-2 border-b border-slate-50 last:border-0">
                                    <span className="text-sm font-bold text-slate-700 uppercase">{m.funcao}</span>
                                    <Badge variant="secondary" className="font-black px-4 rounded-lg">{m.quantidade} {m.quantidade === 1 ? 'Pessoa' : 'Pessoas'}</Badge>
                                </div>
                            ))}
                        </div>
                    </Card>
                </div>
                <div className="space-y-4">
                    <h3 className="text-xs font-black uppercase tracking-[0.2em] text-slate-400 flex items-center gap-2"><Truck className="w-4 h-4" /> Máquinas & Equipamentos</h3>
                    <Card className="rounded-3xl border-none shadow-sm overflow-hidden bg-white">
                        <div className="p-6 space-y-3">
                            {rdo.rdo_equipamentos?.length ? rdo.rdo_equipamentos.map((e, i) => (
                                <div key={i} className="flex justify-between items-center py-2 border-b border-slate-50 last:border-0">
                                    <span className="text-sm font-bold text-slate-700 uppercase">{e.equipamento}</span>
                                    <div className="flex gap-2">
                                        <Badge className="bg-blue-50 text-blue-600 border-none font-black px-3">{e.horas_trabalhadas}h Trab.</Badge>
                                    </div>
                                </div>
                            )) : <div className="py-6 text-center text-slate-400 text-xs font-bold uppercase tracking-widest">Nenhum equipamento</div>}
                        </div>
                    </Card>
                </div>
            </div>

            {/* OBSERVAÇÕES */}
            {(rdo.impedimentos_comentarios || rdo.observacoes_gerais) && (
                <section className="space-y-4">
                    <h3 className="text-xs font-black uppercase tracking-[0.2em] text-slate-400">Relatório Técnico do Engenheiro</h3>
                    <Card className="rounded-[2.5rem] p-8 bg-[#066abc]/5 border-none shadow-inner">
                        {rdo.impedimentos_comentarios && (
                            <div className="mb-6">
                                <p className="text-[10px] font-black text-red-500 uppercase tracking-widest mb-2">Impedimentos:</p>
                                <p className="text-sm font-medium text-slate-700 italic">"{rdo.impedimentos_comentarios}"</p>
                            </div>
                        )}
                        {rdo.observacoes_gerais && (
                            <div className="pt-6 border-t border-slate-200/50">
                                <p className="text-[10px] font-black text-primary uppercase tracking-widest mb-2">Notas Gerais:</p>
                                <p className="text-sm font-medium text-slate-700">{rdo.observacoes_gerais}</p>
                            </div>
                        )}
                    </Card>
                </section>
            )}

            {/* RODAPÉ DE ASSINATURA */}
            {!isApproved && (
                <section className="pt-20 border-t-4 border-slate-100 space-y-8 animate-in slide-in-from-bottom-8">
                    <div className="text-center space-y-2">
                        <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6"><SignatureIcon className="w-10 h-10 text-primary" /></div>
                        <h3 className="text-3xl font-black uppercase tracking-tight text-slate-800">Assinatura Digital do Cliente</h3>
                        <p className="text-sm text-muted-foreground font-medium">Validar relatório e arquivar digitalmente.</p>
                    </div>

                    <div className="max-w-md mx-auto space-y-6">
                        <div className="grid grid-cols-1 gap-4">
                            <div className="space-y-1.5"><Label className="text-[10px] font-black uppercase tracking-widest ml-1 text-slate-400">Seu Nome</Label><Input placeholder="Ex: João Silva" value={clientName} onChange={e => setClientName(e.target.value)} className="h-12 rounded-2xl bg-white shadow-inner" /></div>
                            <div className="space-y-1.5"><Label className="text-[10px] font-black uppercase tracking-widest ml-1 text-slate-400">Seu Vínculo (Ex: Proprietário)</Label><Input placeholder="Cargo ou Função" value={clientRole} onChange={e => setClientRole(e.target.value)} className="h-12 rounded-2xl bg-white shadow-inner" /></div>
                        </div>

                        <div className={cn("border-4 border-dashed rounded-[3rem] bg-white aspect-[16/8] relative overflow-hidden transition-all", isDrawing ? "border-primary ring-8 ring-primary/5" : "border-slate-200 opacity-60")}>
                            <SignatureCanvas ref={sigPad} penColor='#066abc' canvasProps={{ className: 'sigCanvas w-full h-full' }} onBegin={() => setIsDrawing(true)} />
                            {!isDrawing && <div className="absolute inset-0 flex flex-col items-center justify-center opacity-40 pointer-events-none"><Smartphone className="w-10 h-10 mb-2 text-slate-400" /><p className="text-[9px] font-black uppercase tracking-[0.3em]">Assine Aqui</p></div>}
                            {isDrawing && <button onClick={() => { sigPad.current.clear(); setIsDrawing(false); }} className="absolute top-4 right-4 p-2 bg-slate-100 text-red-500 rounded-full hover:bg-red-50 shadow-md"><X className="w-5 h-5" /></button>}
                        </div>
                    </div>
                </section>
            )}
        </main>

        <footer className="fixed bottom-0 left-0 right-0 p-6 bg-white/95 backdrop-blur-md border-t shadow-2xl flex items-center justify-center z-[60]">
            <div className="max-w-5xl w-full flex flex-col md:flex-row items-center justify-between gap-6">
                {!showRejectForm ? (
                    <>
                        <div className="hidden md:flex items-center gap-4">
                            <Avatar className="h-12 w-12 border-2 border-primary/20"><AvatarImage src={rdo.profiles?.avatar_url || ""} /><AvatarFallback><User /></AvatarFallback></Avatar>
                            <div><p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Emitido por:</p><p className="text-sm font-black text-slate-800 uppercase tracking-tight">{engineerName}</p></div>
                        </div>
                        <div className="flex gap-4 w-full md:w-auto">
                            <button onClick={() => setShowRejectForm(true)} className="text-[10px] font-black text-slate-400 uppercase hover:text-red-500 flex-1 h-14">Ajustes</button>
                            <Button onClick={handleApprove} disabled={isProcessing || !canApprove} className={cn("h-14 px-12 rounded-[1.25rem] font-black uppercase text-xs tracking-widest flex-1 shadow-2xl transition-all", canApprove ? "bg-emerald-600 hover:bg-emerald-700 text-white scale-105" : "bg-slate-200 text-slate-400 shadow-none")}>
                                {isProcessing ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <CheckCircle2 className="w-4 h-4 mr-2" />} Aprovar RDO
                            </Button>
                        </div>
                    </>
                ) : (
                    <div className="w-full flex flex-col md:flex-row gap-4 items-end animate-in slide-in-from-bottom-2">
                        <div className="w-full"><Label className="text-[10px] font-black text-red-500 uppercase ml-2">Motivo da Correção</Label><Textarea placeholder="O que precisa ser corrigido?" value={rejectionReason} onChange={e => setRejectionReason(e.target.value)} className="mt-1 rounded-2xl bg-red-50/20 border-red-100" /></div>
                        <div className="flex gap-2 w-full md:w-auto"><Button variant="outline" onClick={() => setShowRejectForm(false)} className="h-14 rounded-2xl px-6">Cancelar</Button><Button variant="destructive" onClick={handleReject} className="h-14 rounded-2xl px-8 font-black uppercase text-[10px] tracking-widest">Enviar</Button></div>
                    </div>
                )}
            </div>
        </footer>
    </div>
  );
};

export default PublicRdoApproval;