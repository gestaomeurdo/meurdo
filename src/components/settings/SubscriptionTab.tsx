"use client";

import { useProfile, useStripeCustomerPortal } from "@/hooks/use-profile";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, Zap, CreditCard, ShieldCheck, ExternalLink, Loader2, Download, Receipt, Building2, HelpCircle, MessageSquare, Send, Paperclip } from "lucide-react";
import UpgradeButton from "../subscription/UpgradeButton";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useState } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { showError, showSuccess } from "@/utils/toast";

const SubscriptionTab = () => {
  const { data: profile, isLoading } = useProfile();
  const { mutate: openPortal, isPending: isOpeningPortal } = useStripeCustomerPortal();
  const [isYearly, setIsYearly] = useState(false);
  
  // Suporte State
  const [supportSubject, setSupportSubject] = useState("");
  const [supportMessage, setSupportMessage] = useState("");
  const [isSendingSupport, setIsSendingSupport] = useState(false);

  const handleSendSupport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supportSubject || !supportMessage) {
        showError("Preencha o assunto e a mensagem.");
        return;
    }

    setIsSendingSupport(true);
    try {
        const { error } = await supabase.functions.invoke('send-support-email', {
            body: {
                subject: supportSubject,
                message: supportMessage,
                plan: profile?.plan_type || 'free',
                browserInfo: window.navigator.userAgent
            }
        });

        if (error) throw error;

        showSuccess("Mensagem enviada! Nossa equipe responderá em breve.");
        setSupportMessage("");
        setSupportSubject("");
    } catch (err) {
        showError("Falha ao enviar ticket. Tente novamente.");
    } finally {
        setIsSendingSupport(false);
    }
  };

  if (isLoading) return <Skeleton className="h-[600px] w-full rounded-3xl" />;

  const isPro = profile?.subscription_status === 'active' || profile?.plan_type === 'pro';

  return (
    <div className="space-y-12 animate-in fade-in duration-700 pb-20">
      
      {/* 1. PRICING SECTION */}
      <section className="space-y-8">
          <div className="flex flex-col items-center text-center gap-4">
              <div className="flex items-center gap-4 bg-slate-100 dark:bg-slate-900 p-1.5 rounded-full border dark:border-slate-800 shadow-inner">
                  <span className={cn("text-xs font-bold px-4 transition-colors", !isYearly ? "text-primary" : "text-muted-foreground")}>Mensal</span>
                  <Switch checked={isYearly} onCheckedChange={setIsYearly} className="data-[state=checked]:bg-[#066abc]" />
                  <div className="flex items-center gap-2">
                    <span className={cn("text-xs font-bold px-4 transition-colors", isYearly ? "text-primary" : "text-muted-foreground")}>Anual</span>
                    {isYearly && <Badge className="bg-emerald-500 text-white border-none text-[8px] font-black uppercase tracking-tighter">Economize 20%</Badge>}
                  </div>
              </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-end">
              {/* PLANO FREE */}
              <Card className="bg-slate-900 border-slate-800 rounded-[2.5rem] shadow-sm flex flex-col p-2 h-full">
                  <CardHeader className="text-center pt-8">
                      <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 mb-2">Iniciante</p>
                      <CardTitle className="text-3xl font-black text-white">Gratuito</CardTitle>
                      <div className="pt-4"><span className="text-4xl font-black text-white">R$ 0</span><span className="text-slate-500 text-xs font-bold">/mês</span></div>
                  </CardHeader>
                  <CardContent className="flex-1 space-y-8 px-6 pb-8">
                      <ul className="space-y-4 pt-6 border-t border-slate-800">
                          {["1 Obra Ativa", "2 RDOs Mensais", "Suporte via Email", "Membros Ilimitados"].map(i => (
                              <li key={i} className="flex items-center gap-3 text-xs font-medium text-slate-400">
                                  <CheckCircle2 className="w-4 h-4 text-slate-600 shrink-0" /> {i}
                              </li>
                          ))}
                      </ul>
                      <Button variant="outline" disabled className="w-full h-12 rounded-2xl border-slate-700 text-slate-500 font-bold uppercase text-[10px] tracking-widest">
                          {!isPro ? "Plano Atual" : "Nível Base"}
                      </Button>
                  </CardContent>
              </Card>

              {/* PLANO PRO (DESTAQUE) */}
              <Card className="bg-slate-900 border-[#066abc]/50 ring-4 ring-[#066abc]/10 rounded-[3rem] shadow-2xl flex flex-col p-2 relative scale-105 z-10 h-full border-2">
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                      <Badge className="bg-[#066abc] text-white border-none px-6 py-1.5 rounded-full font-black text-[9px] uppercase tracking-widest shadow-xl">Mais Popular</Badge>
                  </div>
                  <CardHeader className="text-center pt-10">
                      <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#066abc] mb-2">Construtor Pro</p>
                      <CardTitle className="text-3xl font-black text-white">Profissional</CardTitle>
                      <div className="pt-4">
                          <span className="text-4xl font-black text-white">R$ {isYearly ? "39,90" : "49,90"}</span>
                          <span className="text-slate-500 text-xs font-bold">/mês</span>
                      </div>
                  </CardHeader>
                  <CardContent className="flex-1 space-y-8 px-6 pb-10">
                      <ul className="space-y-4 pt-6 border-t border-slate-800">
                          {["Obras Ilimitadas", "PDF sem marca d'água", "Sua Logo nos relatórios", "Assinatura Digital", "Dashboard Executivo", "Armazenamento 1GB"].map(i => (
                              <li key={i} className="flex items-center gap-3 text-sm font-bold text-white">
                                  <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" /> {i}
                              </li>
                          ))}
                      </ul>
                      {isPro ? (
                          <Button onClick={() => openPortal()} disabled={isOpeningPortal} className="w-full h-14 rounded-2xl bg-slate-800 hover:bg-slate-700 text-white font-black uppercase text-[10px] tracking-widest border-none">
                              {isOpeningPortal ? <Loader2 className="animate-spin h-4 w-4" /> : <CreditCard className="w-4 h-4 mr-2" />} Gerenciar Assinatura
                          </Button>
                      ) : (
                          <UpgradeButton />
                      )}
                  </CardContent>
              </Card>

              {/* PLANO ENTERPRISE */}
              <Card className="bg-slate-900 border-slate-800 rounded-[2.5rem] shadow-sm flex flex-col p-2 h-full">
                  <CardHeader className="text-center pt-8">
                      <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 mb-2">Grandes Contas</p>
                      <CardTitle className="text-3xl font-black text-white">Enterprise</CardTitle>
                      <div className="pt-4"><span className="text-2xl font-black text-white">Sob Consulta</span></div>
                  </CardHeader>
                  <CardContent className="flex-1 space-y-8 px-6 pb-8">
                      <ul className="space-y-4 pt-6 border-t border-slate-800">
                          {["White-label Total", "API de Integração", "SSO Autenticação", "Suporte 24/7 Dedicado", "Consultoria de Processos"].map(i => (
                              <li key={i} className="flex items-center gap-3 text-xs font-medium text-slate-400">
                                  <CheckCircle2 className="w-4 h-4 text-slate-600 shrink-0" /> {i}
                              </li>
                          ))}
                      </ul>
                      <Button variant="outline" className="w-full h-12 rounded-2xl border-slate-700 text-white hover:bg-slate-800 font-bold uppercase text-[10px] tracking-widest" onClick={() => setSupportSubject("Comercial / Enterprise")}>
                          Falar com Vendas
                      </Button>
                  </CardContent>
              </Card>
          </div>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 pt-10 border-t dark:border-slate-800">
          
          {/* 2. HISTÓRICO DE FATURAMENTO */}
          <section className="space-y-6">
              <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-slate-900 rounded-xl border border-slate-800"><Receipt className="w-5 h-5 text-primary" /></div>
                  <h3 className="text-lg font-black uppercase tracking-tight text-foreground">Faturas e Recibos</h3>
              </div>
              <div className="bg-slate-900 rounded-[2rem] border border-slate-800 overflow-hidden">
                  <Table>
                      <TableHeader className="bg-slate-950/50">
                          <TableRow className="border-slate-800">
                              <TableHead className="text-[9px] font-black uppercase tracking-widest py-4">Data</TableHead>
                              <TableHead className="text-[9px] font-black uppercase tracking-widest py-4">Valor</TableHead>
                              <TableHead className="text-[9px] font-black uppercase tracking-widest py-4">Status</TableHead>
                              <TableHead className="text-right text-[9px] font-black uppercase tracking-widest py-4">Recibo</TableHead>
                          </TableRow>
                      </TableHeader>
                      <TableBody>
                          {isPro ? (
                              <TableRow className="border-slate-800 hover:bg-slate-800/50">
                                  <TableCell className="text-xs font-bold text-slate-300">05/03/2024</TableCell>
                                  <TableCell className="text-xs font-bold text-slate-300">R$ 49,90</TableCell>
                                  <TableCell><Badge className="bg-emerald-500/10 text-emerald-500 border-none text-[8px] font-black uppercase">Pago</Badge></TableCell>
                                  <TableCell className="text-right">
                                      <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-500"><Download className="w-4 h-4" /></Button>
                                  </TableCell>
                              </TableRow>
                          ) : (
                            <TableRow>
                                <TableCell colSpan={4} className="text-center py-12 text-slate-500 text-xs font-bold uppercase tracking-widest">
                                    Nenhum faturamento registrado.
                                </TableCell>
                            </TableRow>
                          )}
                      </TableBody>
                  </Table>
              </div>
          </section>

          {/* 3. CENTRAL DE SUPORTE E FEEDBACK */}
          <section className="space-y-6">
              <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-slate-900 rounded-xl border border-slate-800"><HelpCircle className="w-5 h-5 text-primary" /></div>
                  <h3 className="text-lg font-black uppercase tracking-tight text-foreground">Ajuda & Suporte</h3>
              </div>
              <Card className="bg-slate-900 border-slate-800 rounded-[2rem] p-8 shadow-sm">
                  <form onSubmit={handleSendSupport} className="space-y-5">
                      <div className="space-y-2">
                          <Label className="text-[10px] font-black uppercase tracking-widest ml-2 text-slate-500">Qual o assunto?</Label>
                          <Select value={supportSubject} onValueChange={setSupportSubject}>
                              <SelectTrigger className="h-12 bg-slate-950 border-slate-800 rounded-2xl text-slate-200">
                                  <SelectValue placeholder="Selecione um tópico" />
                              </SelectTrigger>
                              <SelectContent className="bg-slate-900 border-slate-800">
                                  <SelectItem value="Dúvida Técnica">Dúvida Técnica</SelectItem>
                                  <SelectItem value="Sugestão de Recurso">Sugestão de Recurso</SelectItem>
                                  <SelectItem value="Reportar Bug">Reportar Bug / Falha</SelectItem>
                                  <SelectItem value="Financeiro">Financeiro / Pagamento</SelectItem>
                                  <SelectItem value="Elogio">Elogio / Feedback</SelectItem>
                              </SelectContent>
                          </Select>
                      </div>
                      
                      <div className="space-y-2">
                          <Label className="text-[10px] font-black uppercase tracking-widest ml-2 text-slate-500">Sua Mensagem</Label>
                          <Textarea 
                            value={supportMessage}
                            onChange={(e) => setSupportMessage(e.target.value)}
                            placeholder="Descreva detalhadamente como podemos ajudar você hoje..." 
                            rows={5} 
                            className="bg-slate-950 border-slate-800 rounded-2xl text-slate-200 resize-none p-4" 
                          />
                      </div>

                      <div className="flex flex-col sm:flex-row items-center gap-4 pt-2">
                          <Button 
                            type="submit" 
                            disabled={isSendingSupport}
                            className="w-full sm:w-auto h-12 px-10 rounded-2xl bg-[#066abc] hover:bg-[#066abc]/90 text-white font-black uppercase text-xs tracking-widest shadow-xl shadow-blue-500/10"
                          >
                              {isSendingSupport ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Send className="w-4 h-4 mr-2" />}
                              Enviar Mensagem
                          </Button>
                          <p className="text-[9px] font-bold text-slate-500 text-center sm:text-left">
                              Tempo médio de resposta: <span className="text-slate-300">2 horas</span>
                          </p>
                      </div>
                  </form>
              </Card>
          </section>

      </div>
    </div>
  );
};

export default SubscriptionTab;