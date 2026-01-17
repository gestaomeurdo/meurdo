"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { STRIPE_PRICE_ID } from "@/config/stripe";
import { Loader2, Zap } from "lucide-react";
import { showError } from "@/utils/toast";

const UpgradeButton = () => {
  const [isLoading, setIsLoading] = useState(false);

  const handleUpgrade = async () => {
    setIsLoading(true);
    try {
      console.log("[Upgrade] Iniciando checkout para o preço:", STRIPE_PRICE_ID);
      const { data, error } = await supabase.functions.invoke('create-checkout-session', {
        body: {
          priceId: STRIPE_PRICE_ID,
          successUrl: `${window.location.origin}/dashboard?session_id={CHECKOUT_SESSION_ID}`,
          cancelUrl: `${window.location.origin}/obras`,
        },
      });

      if (error) {
        console.error("[Upgrade] Erro na Edge Function:", error);
        throw error;
      }

      if (data?.url) {
        window.location.href = data.url;
      } else {
        throw new Error("URL de checkout não retornada pela função.");
      }
    } catch (error: any) {
      console.error("Upgrade error details:", error);
      // Se for um erro de função, extrai a mensagem se possível
      const message = error.context?.message || error.message || "Erro desconhecido";
      showError(`Erro ao iniciar o pagamento: ${message}. Verifique as chaves da Stripe.`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button
      onClick={handleUpgrade}
      disabled={isLoading}
      className="bg-orange-500 hover:bg-orange-600 text-white font-bold w-full"
    >
      {isLoading ? (
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
      ) : (
        <Zap className="mr-2 h-4 w-4 fill-current" />
      )}
      ASSINAR PLANO PRO
    </Button>
  );
};

export default UpgradeButton;