"use client";

import { useProfile, useStripeCustomerPortal } from "@/hooks/use-profile";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, Zap, CreditCard, ShieldCheck, ExternalLink, Loader2, Download, Receipt, HelpCircle, Send, MessageSquare, AlertCircle } from "lucide-react";
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
      <section className="space-y-10">
          <div className="flex flex-col items-center text-center gap-6">
              <div className="space-y-2">
                <h2 className="text-2xl font-black uppercase tracking-tight">Planos e Assinatura</h2>
                <p className="text-muted-foreground text-sm font-medium">Gerencie seu nível de acesso e faturamento.</p>
              </div>

              {!isPro && (
                <div className="flex items-center gap-4 bg-slate-100 dark:bg-slate-900 p-2 rounded-full border dark:border-slate-800 shadow-inner">
                    <span className={cn("text-xs font-black px-4 transition-colors uppercase tracking-widest", !isYearly ? "text-primary" : "text-muted-foreground")}>Mensal</span>
                    <Switch checked={isYearly} onCheckedChange={setIsYearly} className="data-[state=checked]:bg-[#066abc]" />
                    <div className="flex items-center gap-3 pr-2">
                        <span className={cn("text-xs font-black px-2 transition-colors uppercase tracking-widest", isYearly ? "text-primary" : "text-muted-foreground")}>Anual</span>
                        <Badge className="bg-emerald-500 text-white border-none text-[9px] font-black uppercase tracking-tighter px-3">Economize 15%</Badge>
                    </div>
                </div>
              )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto items-stretch">
              {/* PLANO FREE */}
              <Card className="bg-card border-slate-200 dark:bg-slate-900 dark:border-slate-800 rounded-[2.5rem] shadow-sm flex flex-col p-2 h-full transition-all hover:shadow-md">
                  <CardHeader className="text-center pt-10">
                      <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 mb-2">Starter</p>
                      <CardTitle className="text-3xl font-black">Gratuito</CardTitle>
                      <p className="text-xs text-muted-foreground font-medium mt-1">(Para Testes)</p>
                      <div className="pt-6"><span className="text-4xl font-black">R$ 0</span><span className="text-slate-500 text-xs font-bold">/mês</span></div>
                  </CardHeader>
                  <CardContent className="flex-1 space-y-8 px-8 pb-10">
                      <ul className="space-y-4 pt-6 border-t border-slate-100 dark:border-slate-800">
                          {["1 Obra Ativa", "RDOs Limitados", "Suporte via Email", "Marca d'água no PDF"].map(i => (
                              <li key={i} className="flex items-center gap-3 text-xs font-bold text-muted-foreground">
                                  <CheckCircle2 className="w-4 h-4 text-slate-300 shrink-0" /> {i}
                              </li>
                          ))}
                      </ul>
                      <Button variant="outline" disabled className="w-full h-14 rounded-2xl border-slate-200 dark:border-slate-700 text-slate-400 font-black uppercase text-[10px] tracking-widest">
                          {!isPro ? "Seu Plano Atual" : "Nível Base"}
                      </Button>
                  </CardContent>
              </Card>

              {/* PLANO PRO (DESTAQUE) */}
              <Card className={cn(
                  "bg-card border-2 dark:bg-slate-900 rounded-[3rem] shadow-2xl flex flex-col p-2 relative h-full transition-all",
                  isPro ? "border-emerald-500 ring-8 ring-emerald-500/5" : "border-[#066abc] ring-8 ring-[#066abc]/5 scale-105 z-10"
              )}>
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                      <Badge className={cn("text-white border-none px-6 py-1.5 rounded-full font-black text-[9px] uppercase tracking-widest shadow-xl", isPro ? "bg-emerald-500" : "bg-[#066abc] animate-bounce")}>
                          {isPro ? "Plano Ativo" : "Recomendado"}
                      </Badge>
                  </div>
                  <CardHeader className="text-center pt-12">
                      <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#066abc] mb-2">Profissional</p>
                      <CardTitle className="text-3xl font-black">Ilimitado</CardTitle>
                      
                      <div className="pt-6 flex flex-col items-center">
                          <div className="flex items-baseline gap-2">
                              {!isPro && isYearly && (
                                <span className="text-xl font-bold text-slate-400 line-through opacity-50">R$ 100</span>
                              )}
                              <span className="text-5xl font-black text-foreground">R$ {isPro ? "49,90" : (isYearly ? "85" : "100")}</span>
                              <span className="text-slate-500 text-xs font-bold">/mês</span>
                          </div>
                          {isYearly && !isPro && (
                              <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest mt-2 bg-emerald-50 dark:bg-emerald-950/30 px-3 py-1 rounded-full">
                                Faturado R$ 1.020 anualmente
                              </p>
                          )}
                      </div>
                  </CardHeader>
                  <CardContent className="flex-1 space-y-8 px-8 pb-12">
                      <ul className="space-y-4 pt-6 border-t border-slate-100 dark:border-slate-800">
                          {[
                            "Obras e RDOs Ilimitados", 
                            "PDF Profissional (Sem marca d'água)", 
                            "Logo da Empresa nos relatórios", 
                            "Suporte Prioritário", 
                            "Gestão de Equipe e Máquinas"
                          ].map(i => (
                              <li key={i} className="flex items-center gap-3 text-sm font-black">
                                  <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" /> {i}
                              </li>
                          ))}
                      </ul>
                      {isPro ? (
                          <div className="space-y-4">
                            <Button onClick={() => openPortal()} disabled={isOpeningPortal} className="w-full h-16 rounded-2xl bg-[#066abc] hover:bg-[#066abc]/90 text-white font-black uppercase text-xs tracking-widest border-none shadow-xl shadow-blue-500/20">
                                {isOpeningPortal ? <Loader2 className="animate-spin h-5 w-5" /> : <ExternalLink className="w-5 h-5 mr-2" />} 
                                Gerenciar Assinatura
                            </Button>
                            <p className="text-[10px] text-center text-muted-foreground uppercase font-bold px-4">
                                Clique para baixar recibos, alterar cartão ou voltar para o plano grátis.
                            </p>
                          </div>
                      ) : (
                          <div className="h-16">
                            <UpgradeButton />
                          </div>
                      )}
                  </CardContent>
              </Card>
          </div>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 pt-16 border-t dark:border-slate-800">
          
          {/* 2. HISTÓRICO DE FATURAMENTO */}
          <section className="space-y-6">
              <div className="flex items-center gap-3 px-2">
                  <div className="p-2.5 bg-primary/10 rounded-xl border border-primary/20"><Receipt className="w-5 h-5 text-primary" /></div>
                  <h3 className="text-lg font-black uppercase tracking-tight text-foreground">Faturas e Recibos</h3>
              </div>
              <div className="bg-card dark:bg-slate-900 rounded-[2rem] border dark:border-slate-800 overflow-hidden shadow-sm">
                  <Table>
                      <TableHeader className="bg-muted/50 dark:bg-slate-950/50">
                          <TableRow className="border-slate-100 dark:border-slate-800">
                              <TableHead className="text-[9px] font-black uppercase tracking-widest py-4 pl-6">Histórico de Cobrança</TableHead>
                              <TableHead className="text-right text-[9px] font-black uppercase tracking-widest py-4 pr-6">Ação</TableHead>
                          </TableRow>
                      </TableHeader>
                      <TableBody>
                          {isPro ? (
                              <TableRow className="border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50">
                                  <TableCell className="py-8 pl-6">
                                      <div className="flex items-center gap-3">
                                          <div className="w-10 h-10 bg-emerald-100 dark:bg-emerald-950/30 rounded-xl flex items-center justify-center">
                                              <ShieldCheck className="w-5 h-5 text-emerald-600" />
                                          </div>
                                          <div>
                                              <p className="text-xs font-black uppercase">Assinatura Ativa</p>
                                              <p className="text-[10px] text-muted-foreground">Faturas e recibos detalhados estão disponíveis no portal.</p>
                                          </div>
                                      </div>
                                  </TableCell>
                                  <TableCell className="text-right pr-6">
                                      <Button variant="outline" size="sm" onClick={() => openPortal()} disabled={isOpeningPortal} className="rounded-xl font-bold text-[10px] uppercase">
                                          Abrir Portal <ExternalLink className="w-3 h-3 ml-2" />
                                      </Button>
                                  </TableCell>
                              </TableRow>
                          ) : (
                            <TableRow>
                                <TableCell colSpan={2} className="text-center py-16 text-slate-400 text-[10px] font-black uppercase tracking-[0.2em]">
                                    <AlertCircle className="w-8 h-8 mx-auto mb-4 opacity-20" />
                                    Nenhuma fatura pendente.
                                </TableCell>
                            </TableRow>
                          )}
                      </TableBody>
                  </Table>
              </div>
          </section>

          {/* 3. CENTRAL DE SUPORTE E FEEDBACK */}
          <section className="space-y-6">
              <div className="flex items-center gap-3 px-2">
                  <div className="p-2.5 bg-primary/10 rounded-xl border border-primary/20"><HelpCircle className="w-5 h-5 text-primary" /></div>
                  <h3 className="text-lg font-black uppercase tracking-tight text-foreground">Ajuda & Suporte Técnico</h3>
              </div>
              <Card className="bg-card dark:bg-slate-900 border dark:border-slate-800 rounded-[2.5rem] p-8 shadow-sm">
                  <form onSubmit={handleSendSupport} className="space-y-6">
                      <div className="space-y-2">
                          <Label className="text-[10px] font-black uppercase tracking-widest ml-2 text-muted-foreground">Qual o assunto do chamado?</Label>
                          <Select value={supportSubject} onValueChange={setSupportSubject}>
                              <SelectTrigger className="h-12 bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 rounded-2xl focus:ring-primary/20 transition-all">
                                  <SelectValue placeholder="Selecione um tópico" />
                              </SelectTrigger>
                              <SelectContent className="dark:bg-slate-900 border-slate-800">
                                  <SelectItem value="Dúvida Técnica">Dúvida Técnica</SelectItem>
                                  <SelectItem value="Sugestão de Recurso">Sugestão de Recurso</SelectItem>
                                  <SelectItem value="Reportar Bug">Reportar Bug / Falha</SelectItem>
                                  <SelectItem value="Financeiro">Financeiro / Pagamento</SelectItem>
                                  <SelectItem value="Elogio">Elogio / Feedback</SelectItem>
                              </SelectContent>
                          </Select>
                      </div>
                      
                      <div className="space-y-2">
                          <Label className="text-[10px] font-black uppercase tracking-widest ml-2 text-muted-foreground">Sua Mensagem</Label>
                          <Textarea 
                            value={supportMessage}
                            onChange={(e) => setSupportMessage(e.target.value)}
                            placeholder="Descreva detalhadamente como podemos ajudar você hoje..." 
                            rows={5} 
                            className="bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 rounded-2xl resize-none p-5 focus:ring-primary/20 transition-all" 
                          />
                      </div>

                      <div className="flex flex-col sm:flex-row items-center justify-between gap-6 pt-2">
                          <Button 
                            type="submit" 
                            disabled={isSendingSupport}
                            className="w-full sm:w-auto h-14 px-12 rounded-2xl bg-[#066abc] hover:bg-[#066abc]/90 text-white font-black uppercase text-xs tracking-widest shadow-xl shadow-blue-500/10 transition-all active:scale-95"
                          >
                              {isSendingSupport ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : <Send className="w-5 h-5 mr-2" />}
                              Enviar Mensagem
                          </Button>
                          <div className="flex flex-col items-center sm:items-end">
                            <p className="text-[9px] font-black uppercase text-muted-foreground tracking-tighter">Resposta em até</p>
                            <p className="text-sm font-black text-primary">2 horas úteis</p>
                          </div>
                      </div>
                  </form>
              </Card>
          </section>

      </div>
    </div>
  );
};

export default SubscriptionTab;