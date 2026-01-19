"use client";

import { useParams } from "react-router-dom";
import { useRdoByToken, useApproveRdo, useRejectRdo } from "@/hooks/use-rdo";
import { 
  Loader2, CheckCircle2, AlertTriangle, Cloud, Sun, Users, ImageIcon, 
  FileDown, Check, X, MapPin, Calendar, Camera, ListChecks, ShieldCheck, 
  Signature as SignatureIcon, Send, Truck, HardHat, Info, Clock, AlertCircle, 
  Eye, CloudRain, CloudLightning, Package, User, Building, Briefcase
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
  const [isSigning, setIsSigning] = useState(false);
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

  const parsedClima = useMemo(() => {
    if (!rdo?.clima_condicoes) return [];
    const parts = rdo.clima_condicoes.split(', ');
    return parts.map((p, i) => {
        const label = i === 0 ? "Manhã" : i === 1 ? "Tarde" : "Noite";
        if (p.includes("N/T")) return { label, val: "N/T", status: "N/T" };
        const climaMatch = p.match(/:\s*([^(\n,]*)/);
        const statusMatch = p.match(/\((.*?)\)/);
        return { 
            label, 
            val: climaMatch ? climaMatch[1].trim() : "Sol", 
            status: statusMatch && statusMatch[1] === "Par" ? "Paralisado" : "Operacional" 
        };
    });
  }, [rdo?.clima_condicoes]);

  const canApprove = useMemo(() => {
    return clientName.trim().length >= 3 && clientRole.trim().length >= 2 && isSigning;
  }, [clientName, clientRole, isSigning]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-accent/5">
        <Loader2 className="h-10 w-10 animate-spin text-primary mb-4" />
        <p className="text-muted-foreground font-bold uppercase tracking-widest text-xs">Sincronizando Relatório Digital...</p>
      </div>
    );
  }

  if (error || !rdo) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center bg-slate-50">
        <AlertTriangle className="h-12 w-12 text-destructive mb-4" />
        <h1 className="text-xl font-black uppercase tracking-tight">Link Inválido ou Expirado</h1>
        <p className="text-muted-foreground mt-2">Este relatório pode ter sido removido ou o link está incorreto.</p>
        <Button variant="outline" onClick={() => window.location.reload()} className="mt-6 font-bold uppercase text-xs rounded-xl">Tentar Novamente</Button>
      </div>
    );
  }

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
          ip_captured: "via-server-audit"
      };

      await approveMutation.mutateAsync({ 
          token: token!, 
          signatureUrl: publicUrlData.publicUrl,
          signerName: clientName,
          signerRole: clientRole,
          metadata
      });
      confetti({ particleCount: 150, spread: 70, origin: { y: 0.6 } });
      showSuccess("Relatório aprovado com sucesso!");
    } catch (err: any) { showError(err.message || "Erro ao aprovar."); } finally { setIsProcessing(false); }
  };

  const handleReject = async () => {
    if (!rejectionReason.trim()) { showError("Informe o motivo."); return; }
    setIsProcessing(true);
    try {
      await rejectMutation.mutateAsync({ token: token!, reason: rejectionReason });
      showSuccess("Solicitação de correção enviada.");
      setShowRejectForm(false);
    } catch (err: any) { showError("Erro ao enviar."); } finally { setIsProcessing(false); }
  };

  const getWeatherIcon = (clima: string) => {
    if (clima.includes("Chuva Forte")) return <CloudLightning className="w-5 h-5 text-blue-800" />;
    if (clima.includes("Chuva")) return <CloudRain className="w-5 h-5 text-blue-500" />;
    if (clima.includes("Nublado")) return <Cloud className="w-5 h-5 text-slate-400" />;
    return <Sun className="w-5 h-5 text-orange-400" />;
  };

  const allPhotos = [
    ...(rdo.rdo_atividades_detalhe?.filter(a => a.foto_anexo_url).map(a => ({ url: a.foto_anexo_url!, desc: a.descricao_servico })) || []),
    ...(rdo.rdo_equipamentos?.filter(e => (e as any).foto_url).map(e => ({ url: (e as any).foto_url!, desc: `Máquina: ${e.equipamento}` })) || []),
    ...(rdo.safety_nr35_photo ? [{ url: rdo.safety_nr35_photo, desc: "Segurança: Trabalho em Altura" }] : []),
    ...(rdo.safety_epi_photo ? [{ url: rdo.safety_epi_photo, desc: "Segurança: Uso de EPIs" }] : []),
    ...(rdo.safety_cleaning_photo ? [{ url: rdo.safety_cleaning_photo, desc: "Segurança: Limpeza/Org." }] : []),
    ...(rdo.safety_dds_photo ? [{ url: rdo.safety_dds_photo, desc: "Segurança: DDS" }] : []),
  ];

  const engineerName = rdo.profiles ? `${rdo.profiles.first_name} ${rdo.profiles.last_name}` : (rdo.signer_name || "Engenheiro Responsável");

  return (
    <div className="min-h-screen bg-[#f8fafc] flex flex-col font-sans selection:bg-primary/10">
      
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

      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b px-4 py-3 flex items-center justify-between shadow-sm">
        <img src={LOGO_URL} alt="Meu RDO" className="h-7 object-contain" />
        <Button 
            variant="outline" 
            size="sm"
            onClick={async () => {
                setIsDownloading(true);
                await generateRdoPdf(rdo, rdo.obras?.nome || "Obra", null, rdo.obras as any);
                setIsDownloading(false);
            }}
            className="rounded-xl font-bold uppercase text-[9px] tracking-widest h-9 border-slate-300"
        >
            {isDownloading ? <Loader2 className="w-3 h-3 mr-2 animate-spin" /> : <FileDown className="w-3 h-3 mr-2 text-primary" />}
            Baixar PDF
        </Button>
      </header>

      <main className="max-w-5xl mx-auto w-full pb-32">
        
        {/* CABEÇALHO HERO IMERSIVO */}
        <section className="relative h-[300px] sm:h-[400px] w-full overflow-hidden flex items-end p-6 sm:p-12 mb-10 group">
            {rdo.obras?.foto_url ? (
                <img src={rdo.obras.foto_url} className="absolute inset-0 w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105" alt="Obra" />
            ) : (
                <div className="absolute inset-0 bg-gradient-to-br from-[#066abc] to-[#044a83]"></div>
            )}
            <div className="absolute inset-0 bg-black/60 backdrop-blur-[2px]"></div>
            <div className="relative z-10 w-full animate-in slide-in-from-bottom-8 duration-700">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-6">
                    <div className="space-y-4">
                        <Badge className={cn("uppercase font-black tracking-widest px-4 py-1.5 rounded-full text-[10px] border-none", 
                            rdo.status === 'approved' ? "bg-emerald-500 text-white" : 
                            rdo.status === 'pending' ? "bg-orange-500 text-white" : "bg-red-500 text-white")}>
                            {rdo.status === 'approved' ? '✓ Relatório Aprovado' : 
                             rdo.status === 'pending' ? 'Aguardando Sua Conferência' : 'Correção em Andamento'}
                        </Badge>
                        <h1 className="text-4xl sm:text-6xl font-black uppercase text-white tracking-tighter leading-none drop-shadow-2xl">
                            {rdo.obras?.nome}
                        </h1>
                        <div className="space-y-2">
                            <p className="text-white/90 font-black text-xs sm:text-sm uppercase tracking-widest flex items-center">
                                <Building className="w-4 h-4 mr-2 text-primary fill-primary" /> Cliente: {rdo.obras?.dono_cliente || "N/A"}
                            </p>
                            <p className="text-white/70 font-bold text-xs sm:text-sm uppercase tracking-wider flex items-center">
                                <MapPin className="w-4 h-4 mr-2" /> {rdo.obras?.endereco || "Endereço não informado"}
                            </p>
                        </div>
                    </div>
                    <div className="bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/20 text-white shrink-0">
                        <p className="text-[9px] font-black uppercase tracking-widest opacity-60 mb-1">Data do Diário</p>
                        <p className="text-xl font-black">{format(parseISO(rdo.data_rdo), "dd 'de' MMMM", { locale: ptBR })}</p>
                        <p className="text-[10px] font-bold opacity-80">{format(parseISO(rdo.data_rdo), "EEEE", { locale: ptBR }).toUpperCase()}</p>
                    </div>
                </div>
            </div>
        </section>

        <div className="px-4 sm:px-8 space-y-12">
            {/* BLOCO CLIMA */}
            <section className="space-y-4">
                <h3 className="text-xs font-black uppercase tracking-[0.2em] text-slate-400 flex items-center gap-2">
                    <Cloud className="w-4 h-4" /> Monitoramento Climático
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {parsedClima.map((item, i) => (
                        <Card key={i} className="border-none shadow-sm rounded-2xl overflow-hidden bg-white">
                            <CardHeader className="p-4 pb-0 flex flex-row items-center justify-between">
                                <span className="text-[10px] font-black uppercase text-slate-400">{item.label}</span>
                                {item.val !== "N/T" && getWeatherIcon(item.val)}
                            </CardHeader>
                            <CardContent className="p-4 pt-2">
                                {item.val === "N/T" ? (
                                    <p className="text-sm font-bold text-slate-300 italic uppercase">Sem Registro</p>
                                ) : (
                                    <div className="space-y-2">
                                        <p className="text-lg font-black text-slate-800 uppercase leading-none">{item.val}</p>
                                        <Badge variant={item.status === 'Operacional' ? 'secondary' : 'destructive'} className="text-[9px] font-black uppercase py-0.5 rounded-full">
                                            {item.status}
                                        </Badge>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </section>

            {/* BLOCO RECURSOS */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <section className="space-y-4">
                    <h3 className="text-xs font-black uppercase tracking-[0.2em] text-slate-400 flex items-center gap-2">
                        <Users className="w-4 h-4" /> Recursos Humanos
                    </h3>
                    <Card className="border-none shadow-sm rounded-[2rem] p-6 h-full bg-white">
                        <div className="space-y-3">
                            {rdo.rdo_mao_de_obra?.length ? rdo.rdo_mao_de_obra.map((m, i) => (
                                <div key={i} className="flex justify-between items-center p-3 bg-slate-50 rounded-xl">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center shadow-sm border border-slate-100">
                                            <HardHat className="w-4 h-4 text-primary" />
                                        </div>
                                        <span className="text-xs font-bold text-slate-700 uppercase">{m.funcao}</span>
                                    </div>
                                    <Badge variant="outline" className="font-black text-sm text-primary border-primary/20">{m.quantidade}</Badge>
                                </div>
                            )) : <p className="text-center py-10 text-slate-400 text-sm italic">Nenhum registro de equipe.</p>}
                        </div>
                    </Card>
                </section>

                <section className="space-y-4">
                    <h3 className="text-xs font-black uppercase tracking-[0.2em] text-slate-400 flex items-center gap-2">
                        <Truck className="w-4 h-4" /> Máquinas e Equipamentos
                    </h3>
                    <Card className="border-none shadow-sm rounded-[2rem] p-6 h-full bg-white">
                        <div className="space-y-3">
                            {rdo.rdo_equipamentos?.length ? rdo.rdo_equipamentos.map((e, i) => (
                                <div key={i} className="flex flex-col p-3 bg-slate-50 rounded-xl gap-2">
                                    <div className="flex justify-between items-center">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center shadow-sm border border-slate-100">
                                                <Truck className="w-4 h-4 text-primary" />
                                            </div>
                                            <span className="text-xs font-bold text-slate-700 uppercase">{e.equipamento}</span>
                                        </div>
                                        <div className="flex gap-2">
                                            <Badge variant="secondary" className="text-[10px] font-black">{e.horas_trabalhadas}h Trab.</Badge>
                                            {e.horas_paradas > 0 && <Badge variant="outline" className="text-[10px] font-black text-red-500 border-red-100">{e.horas_paradas}h Par.</Badge>}
                                        </div>
                                    </div>
                                </div>
                            )) : <p className="text-center py-10 text-slate-400 text-sm italic">Nenhum registro de maquinário.</p>}
                        </div>
                    </Card>
                </section>
            </div>

            {/* BLOCO PRODUÇÃO */}
            <section className="space-y-4">
                <h3 className="text-xs font-black uppercase tracking-[0.2em] text-slate-400 flex items-center gap-2">
                    <ListChecks className="w-4 h-4" /> Registro de Atividades
                </h3>
                <div className="space-y-4">
                    {rdo.rdo_atividades_detalhe?.map((atv, i) => (
                        <Card key={i} className="border-none shadow-sm rounded-3xl overflow-hidden bg-white">
                            <div className="p-6 flex flex-col md:flex-row md:items-center gap-6">
                                <div className="flex-1 space-y-3">
                                    <h4 className="text-lg font-black text-slate-800 uppercase tracking-tight">{atv.descricao_servico}</h4>
                                    {atv.observacao && <p className="text-xs text-muted-foreground font-medium bg-slate-50 p-2 rounded-lg border-l-4 border-slate-200">{atv.observacao}</p>}
                                    <div className="space-y-1.5">
                                        <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest text-slate-400 px-1">
                                            <span>Avanço Realizado</span>
                                            <span className="text-primary">{atv.avanco_percentual}%</span>
                                        </div>
                                        <Progress value={atv.avanco_percentual} className="h-2" />
                                    </div>
                                </div>
                                {atv.foto_anexo_url && (
                                    <div className="w-full md:w-32 h-20 rounded-2xl overflow-hidden cursor-zoom-in border shrink-0" onClick={() => setSelectedPhoto({ url: atv.foto_anexo_url!, desc: atv.descricao_servico })}>
                                        <img src={atv.foto_anexo_url} className="w-full h-full object-cover" alt="Evidência" />
                                    </div>
                                )}
                            </div>
                        </Card>
                    ))}
                </div>
            </section>

            {/* BLOCO CRÍTICO: SEGURANÇA E NOTAS */}
            <section className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                <div className="lg:col-span-4 space-y-4">
                    <h3 className="text-xs font-black uppercase tracking-[0.2em] text-slate-400 flex items-center gap-2">
                        <ShieldCheck className="w-4 h-4" /> Segurança (HSE)
                    </h3>
                    <Card className="border-none shadow-sm rounded-[2rem] overflow-hidden bg-white">
                        <div className="bg-emerald-600 px-6 py-3 flex items-center justify-between">
                            <span className="text-white font-black text-[10px] uppercase tracking-[0.15em]">Conformidade NR</span>
                            <CheckCircle2 className="w-4 h-4 text-emerald-100" />
                        </div>
                        <CardContent className="p-6 space-y-4">
                            {[
                                { label: "Trabalho em Altura", val: rdo.safety_nr35 },
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
                        <AlertCircle className="w-4 h-4" /> Impedimentos e Notas
                    </h3>
                    <Card className={cn("border-none shadow-sm rounded-[2rem] p-8 h-full bg-white", rdo.impedimentos_comentarios ? "ring-1 ring-red-100" : "")}>
                        {rdo.impedimentos_comentarios ? (
                            <p className="text-sm font-medium text-red-800 leading-relaxed bg-red-50 p-4 rounded-2xl border border-red-100">{rdo.impedimentos_comentarios}</p>
                        ) : (
                            <div className="flex flex-col items-center justify-center py-10 opacity-30 text-center">
                                <CheckCircle2 className="w-12 h-12 text-slate-400 mb-2" />
                                <p className="text-sm font-bold uppercase tracking-widest">Sem ocorrências</p>
                            </div>
                        )}
                        {rdo.observacoes_gerais && (
                            <div className="mt-8 pt-6 border-t border-slate-100">
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Observações Técnicas</p>
                                <p className="text-sm font-medium text-slate-700 leading-relaxed">{rdo.observacoes_gerais}</p>
                            </div>
                        )}
                    </Card>
                </div>
            </section>

            {/* GALERIA */}
            {allPhotos.length > 0 && (
                <section className="space-y-4">
                    <h3 className="text-xs font-black uppercase tracking-[0.2em] text-slate-400 flex items-center gap-2">
                        <Camera className="w-4 h-4" /> Galeria de Evidências Fotográficas
                    </h3>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                        {allPhotos.map((photo, i) => (
                            <div key={i} className="aspect-square rounded-[1.5rem] overflow-hidden cursor-zoom-in border shadow-sm bg-white" onClick={() => setSelectedPhoto(photo)}>
                                <img src={photo.url} className="w-full h-full object-cover" alt="Evidência" />
                            </div>
                        ))}
                    </div>
                </section>
            )}

            {/* CARIMBO DO RESPONSÁVEL TÉCNICO */}
            <section className="pt-10 border-t-4 border-slate-100 space-y-4">
                <h3 className="text-xs font-black uppercase tracking-[0.2em] text-slate-400 flex items-center gap-2">
                    <SignatureIcon className="w-4 h-4" /> Emissão e Responsabilidade Técnica
                </h3>
                <Card className="border-none shadow-sm rounded-3xl bg-white border border-slate-100 overflow-hidden">
                    <div className="p-6 flex flex-col sm:flex-row items-center justify-between gap-6">
                        <div className="flex items-center gap-4">
                            <Avatar className="h-16 w-16 border-2 border-white shadow-md">
                                <AvatarImage src={rdo.profiles?.avatar_url || ""} />
                                <AvatarFallback className="bg-primary/10 text-primary font-black"><User /></AvatarFallback>
                            </Avatar>
                            <div>
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Validado Tecnicamente por:</p>
                                <p className="text-xl font-black text-slate-800 uppercase leading-none">{engineerName}</p>
                                <p className="text-xs font-bold text-primary uppercase mt-1">Responsável Técnico / CREA</p>
                            </div>
                        </div>
                        <div className="text-right flex flex-col items-center sm:items-end gap-2">
                            <Badge className="bg-emerald-600 hover:bg-emerald-600 px-4 py-1.5 rounded-full font-black uppercase text-[10px] tracking-widest shadow-lg shadow-emerald-500/20">
                            <CheckCircle2 className="w-3.5 h-3.5 mr-2" /> Assinado Digitalmente
                            </Badge>
                            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Validado em: {format(parseISO(rdo.created_at), "dd/MM/yyyy HH:mm")}</p>
                        </div>
                    </div>
                </Card>
            </section>

            {/* PROTOCOLO DE ASSINATURA IDENTIFICADA */}
            <section className="pt-20 border-t-4 border-slate-100 space-y-8">
                <div className="text-center space-y-2">
                    <div className="bg-primary/10 w-20 h-20 rounded-[2rem] flex items-center justify-center mx-auto mb-4">
                        <SignatureIcon className="w-10 h-10 text-primary" />
                    </div>
                    <h3 className="text-2xl sm:text-3xl font-black uppercase tracking-tight text-slate-800">Protocolo de Assinatura do Cliente</h3>
                    <p className="text-sm text-muted-foreground font-medium max-w-sm mx-auto">Identifique-se e desenhe sua assinatura abaixo para validar juridicamente este recebimento.</p>
                </div>

                <div className="max-w-[500px] mx-auto space-y-6">
                    <div className="grid grid-cols-1 gap-4">
                        <div className="space-y-2">
                            <Label className="text-[10px] font-black uppercase text-slate-400 ml-2 tracking-widest">Nome Completo do Responsável</Label>
                            <Input 
                                placeholder="Quem está assinando este documento?" 
                                value={clientName} 
                                onChange={(e) => setClientName(e.target.value)}
                                className="h-12 rounded-xl bg-white border-slate-200"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label className="text-[10px] font-black uppercase text-slate-400 ml-2 tracking-widest">Cargo / Função / Vínculo</Label>
                            <Input 
                                placeholder="Ex: Proprietário, Engenheiro Fiscal, Arquiteta..." 
                                value={clientRole} 
                                onChange={(e) => setClientRole(e.target.value)}
                                className="h-12 rounded-xl bg-white border-slate-200"
                            />
                        </div>
                    </div>

                    <div className={cn(
                        "border-4 border-dashed rounded-[2.5rem] bg-white overflow-hidden relative aspect-[16/7] transition-all shadow-inner",
                        isSigning ? "ring-8 ring-primary/5 border-primary" : "border-slate-200"
                    )}>
                        <SignatureCanvas 
                            ref={sigPad} 
                            penColor='#066abc' 
                            canvasProps={{ className: 'sigCanvas w-full h-full cursor-crosshair' }} 
                            onBegin={() => setIsSigning(true)} 
                        />
                        {!isSigning && (
                            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none opacity-20">
                                <span className="text-[10px] font-black uppercase tracking-[0.4em] mb-2">Área de Assinatura</span>
                                <span className="text-xs font-medium">Toque ou use o mouse</span>
                            </div>
                        )}
                        {isSigning && (
                            <button 
                                onClick={() => { sigPad.current.clear(); setIsSigning(false); }} 
                                className="absolute top-4 right-4 p-2.5 rounded-full bg-slate-100 text-destructive hover:bg-red-50 transition-colors shadow-lg"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        )}
                    </div>

                    <p className="text-[10px] text-center text-muted-foreground uppercase font-black tracking-widest leading-relaxed">
                        Ao assinar, declaro estar ciente e de acordo com as atividades e recursos reportados neste diário de obra.
                    </p>
                </div>
            </section>
        </div>
      </main>

      <footer className="fixed bottom-0 left-0 right-0 p-4 bg-white/95 backdrop-blur-md border-t shadow-[0_-4px_30px_rgba(0,0,0,0.05)] z-[60]">
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
            {!showRejectForm ? (
                <>
                    <div className="hidden md:flex items-center gap-3">
                        <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center"><Clock className="w-5 h-5 text-slate-400" /></div>
                        <div>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none">Aguardando Aprovação</p>
                            <p className="text-sm font-black text-slate-700 uppercase tracking-tight">{rdo.status === 'approved' ? 'Relatório Concluído' : 'Conferência de Campo'}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-4 w-full md:w-auto">
                        <Button 
                            variant="ghost" 
                            onClick={() => setShowRejectForm(true)} 
                            className="text-[10px] font-black text-slate-400 uppercase hover:text-red-500 rounded-xl h-12 flex-1 md:flex-none"
                            disabled={rdo.status === 'approved'}
                        >
                            Solicitar Correção
                        </Button>
                        <Button 
                            onClick={handleApprove} 
                            disabled={isProcessing || !canApprove || rdo.status === 'approved'} 
                            className={cn(
                                "font-black uppercase text-xs tracking-widest h-12 px-10 rounded-xl flex-1 md:flex-none shadow-lg transition-all",
                                canApprove ? "bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-500/20" : "bg-slate-200 text-slate-400 cursor-not-allowed shadow-none"
                            )}
                        >
                            {isProcessing ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Check className="h-4 w-4 mr-2" />} 
                            Aprovar RDO
                        </Button>
                    </div>
                </>
            ) : (
                <div className="w-full flex flex-col md:flex-row gap-3 items-end animate-in slide-in-from-bottom-2">
                    <div className="w-full">
                        <Label className="text-[10px] font-black uppercase text-red-500 ml-2">Qual o motivo da reprovação?</Label>
                        <Textarea 
                            placeholder="Descreva detalhadamente o que precisa ser ajustado..." 
                            value={rejectionReason} 
                            onChange={(e) => setRejectionReason(e.target.value)} 
                            className="bg-red-50/30 border-red-100 rounded-xl min-h-[50px] font-medium text-sm mt-1 focus:ring-red-500" 
                            autoFocus 
                        />
                    </div>
                    <div className="flex gap-2 w-full md:w-auto">
                        <Button variant="outline" onClick={() => setShowRejectForm(false)} className="h-12 rounded-xl px-6 font-bold">Voltar</Button>
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