"use client";

import { useProfile, useStripeCustomerPortal } from "@/hooks/use-profile";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, Zap, CreditCard, ShieldCheck, ExternalLink, Loader2, Download, Receipt, HelpCircle, Send, MessageSquare, AlertCircle, Lock } from "lucide-react";
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
                userId: profile?.id
            }
        });

        if (error) throw error;
        showSuccess("Mensagem enviada! Nossa equipe responderá em breve.");
        setSupportMessage("");
        setSupportSubject("");
    } catch (err) {
        showError("Falha ao enviar ticket.");
    } finally {
        setIsSendingSupport(false);
    }
  };

  if (isLoading) return <Skeleton className="h-[600px] w-full rounded-3xl" />;

  const isPro = profile?.subscription_status === 'active' || profile?.plan_type === 'pro';

  return (
    <div className="space-y-12 animate-in fade-in duration-700 pb-20">
      
      {/* 1. SEÇÃO DE PREÇOS */}
      <section className="space-y-10">
          <div className="flex flex-col items-center text-center gap-6">
              <div className="space-y-2">
                <h2 className="text-2xl font-black uppercase tracking-tight">Escolha seu Nível de Gestão</h2>
                <p className="text-muted-foreground text-sm font-medium">Planos simplificados para engenheiros de alta performance.</p>
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
              {/* PLANO STARTER */}
              <Card className="bg-card border-slate-200 dark:bg-slate-900 dark:border-slate-800 rounded-[2.5rem] shadow-sm flex flex-col p-2 h-full transition-all">
                  <CardHeader className="text-center pt-10">
                      <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 mb-2">Starter</p>
                      <CardTitle className="text-3xl font-black">Gratuito</CardTitle>
                      <div className="pt-6"><span className="text-4xl font-black">R$ 0</span></div>
                  </CardHeader>
                  <CardContent className="flex-1 space-y-8 px-8 pb-10">
                      <ul className="space-y-4 pt-6 border-t dark:border-slate-800">
                          <li className="flex items-center gap-3 text-xs font-bold text-muted-foreground"><CheckCircle2 className="w-4 h-4 text-slate-300" /> 1 Obra Ativa</li>
                          <li className="flex items-center gap-3 text-xs font-bold text-muted-foreground"><CheckCircle2 className="w-4 h-4 text-slate-300" /> PDF com Marca d'água</li>
                          <li className="flex items-center gap-3 text-xs font-bold text-muted-foreground"><CheckCircle2 className="w-4 h-4 text-slate-300" /> Até 5 fotos por RDO</li>
                          <li className="flex items-center gap-3 text-xs font-bold text-muted-foreground opacity-50"><Lock className="w-4 h-4" /> Sem Relatório Executivo</li>
                      </ul>
                      <Button variant="outline" disabled className="w-full h-14 rounded-2xl border-slate-200 dark:border-slate-700 text-slate-400 font-black uppercase text-[10px] tracking-widest">
                          {!isPro ? "Seu Plano Atual" : "Nível Base"}
                      </Button>
                  </CardContent>
              </Card>

              {/* PLANO PROFISSIONAL */}
              <Card className={cn(
                  "bg-card border-2 dark:bg-slate-900 rounded-[3rem] shadow-2xl flex flex-col p-2 relative h-full transition-all",
                  isPro ? "border-emerald-500 ring-8 ring-emerald-500/5" : "border-[#066abc] ring-8 ring-[#066abc]/5 scale-105 z-10"
              )}>
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                      <Badge className={cn("text-white border-none px-6 py-1.5 rounded-full font-black text-[9px] uppercase tracking-widest shadow-xl", isPro ? "bg-emerald-500" : "bg-[#066abc]")}>
                          {isPro ? "Plano Ativo" : "Recomendado"}
                      </Badge>
                  </div>
                  <CardHeader className="text-center pt-12">
                      <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#066abc] mb-2">Profissional</p>
                      <CardTitle className="text-3xl font-black">Ilimitado</CardTitle>
                      <div className="pt-6 flex flex-col items-center">
                          <div className="flex items-baseline gap-2">
                              <span className="text-5xl font-black">R$ {isYearly ? "85" : "100"}</span>
                              <span className="text-slate-500 text-xs font-bold">/mês</span>
                          </div>
                          {isYearly && <p className="text-[10px] font-black text-emerald-600 uppercase mt-2">Faturado R$ 1.020 anualmente</p>}
                      </div>
                  </CardHeader>
                  <CardContent className="flex-1 space-y-8 px-8 pb-12">
                      <ul className="space-y-4 pt-6 border-t dark:border-slate-800">
                          <li className="flex items-center gap-3 text-sm font-black"><CheckCircle2 className="w-5 h-5 text-emerald-500" /> Obras & RDOs Ilimitados</li>
                          <li className="flex items-center gap-3 text-sm font-black"><CheckCircle2 className="w-5 h-5 text-emerald-500" /> PDF Whitelabel (Sua Logo)</li>
                          <li className="flex items-center gap-3 text-sm font-black"><CheckCircle2 className="w-5 h-5 text-emerald-500" /> Relatório Executivo Mensal</li>
                          <li className="flex items-center gap-3 text-sm font-black"><CheckCircle2 className="w-5 h-5 text-emerald-500" /> Links de Aprovação Digital</li>
                      </ul>
                      {isPro ? (
                          <Button onClick={() => openPortal()} disabled={isOpeningPortal} className="w-full h-16 rounded-2xl bg-[#066abc] hover:bg-[#066abc]/90 text-white font-black uppercase text-xs tracking-widest shadow-xl">
                              {isOpeningPortal ? <Loader2 className="animate-spin h-5 w-5" /> : <ExternalLink className="w-5 h-5 mr-2" />} Gerenciar Assinatura
                          </Button>
                      ) : (
                          <div className="h-16"><UpgradeButton /></div>
                      )}
                  </CardContent>
              </Card>
          </div>
      </section>

      {/* 2. SUPORTE */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-12 pt-16 border-t dark:border-slate-800">
          <div className="space-y-6">
              <div className="flex items-center gap-3 px-2">
                  <div className="p-2.5 bg-primary/10 rounded-xl border border-primary/20"><HelpCircle className="w-5 h-5 text-primary" /></div>
                  <h3 className="text-lg font-black uppercase tracking-tight">Ajuda e Suporte</h3>
              </div>
              <Card className="bg-card dark:bg-slate-900 border dark:border-slate-800 rounded-[2.5rem] p-8 shadow-sm">
                  <form onSubmit={handleSendSupport} className="space-y-6">
                      <div className="space-y-2">
                          <Label className="text-[10px] font-black uppercase tracking-widest ml-2">Assunto</Label>
                          <Select value={supportSubject} onValueChange={setSupportSubject}>
                              <SelectTrigger className="h-12 bg-white dark:bg-slate-950 rounded-2xl">
                                  <SelectValue placeholder="Selecione um tópico" />
                              </SelectTrigger>
                              <SelectContent>
                                  <SelectItem value="Dúvida Técnica">Dúvida Técnica</SelectItem>
                                  <SelectItem value="Erro/Bug">Reportar Bug</SelectItem>
                                  <SelectItem value="Financeiro">Financeiro</SelectItem>
                                  <SelectItem value="Melhoria">Sugestão de Recurso</SelectItem>
                              </SelectContent>
                          </Select>
                      </div>
                      <div className="space-y-2">
                          <Label className="text-[10px] font-black uppercase tracking-widest ml-2">Mensagem</Label>
                          <Textarea 
                            value={supportMessage}
                            onChange={(e) => setSupportMessage(e.target.value)}
                            placeholder="Descreva detalhadamente seu problema..." 
                            rows={5} 
                            className="bg-white dark:bg-slate-950 rounded-2xl resize-none" 
                          />
                      </div>
                      <Button type="submit" disabled={isSendingSupport} className="w-full h-14 rounded-2xl bg-[#066abc] font-black uppercase text-xs tracking-widest">
                          {isSendingSupport ? <Loader2 className="animate-spin mr-2" /> : <Send className="w-4 h-4 mr-2" />} Enviar Chamado
                      </Button>
                  </form>
              </Card>
          </div>
          
          <div className="space-y-6">
            <div className="flex items-center gap-3 px-2">
                <div className="p-2.5 bg-emerald-500/10 rounded-xl border border-emerald-500/20"><ShieldCheck className="w-5 h-5 text-emerald-600" /></div>
                <h3 className="text-lg font-black uppercase tracking-tight">Segurança dos Dados</h3>
            </div>
            <Card className="bg-slate-50 dark:bg-slate-800/50 border-none rounded-[2.5rem] p-8">
                <p className="text-sm text-muted-foreground leading-relaxed">
                    Seus dados são criptografados e armazenados em servidores seguros. O faturamento é processado pela <strong>Stripe</strong>, garantindo total conformidade com padrões internacionais de segurança bancária.
                </p>
                <div className="mt-8 flex items-center gap-6 opacity-30 grayscale">
                    <img src="https://upload.wikimedia.org/wikipedia/commons/b/ba/Stripe_Logo%2C_revised_2016.svg" className="h-6" alt="Stripe" />
                    <div className="h-4 w-px bg-slate-300" />
                    <span className="text-[10px] font-black uppercase tracking-widest">PCI Compliance</span>
                </div>
            </Card>
          </div>
      </section>
    </div>
  );
};

export default SubscriptionTab;