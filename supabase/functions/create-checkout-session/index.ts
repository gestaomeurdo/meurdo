import { serve } from "https://deno.land/std@0.190.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0'
import Stripe from 'https://esm.sh/stripe@14.16.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  // 1. Log de Verificação da Chave Stripe
  console.log('[create-checkout-session] Stripe Key exists:', !!Deno.env.get('STRIPE_SECRET_KEY'));

  try {
    const { priceId, successUrl, cancelUrl } = await req.json()
    
    // Auth check
    const authHeader = req.headers.get('Authorization')!
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    )
    
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser()
    if (userError || !user) throw new Error('Unauthorized')

    const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') ?? '', {
      apiVersion: '2023-10-16',
      httpClient: Stripe.createFetchHttpClient(),
    })

    // Get or create customer
    const { data: profile } = await supabaseClient
      .from('profiles')
      .select('stripe_customer_id, first_name, last_name')
      .eq('id', user.id)
      .single()

    let customerId = profile?.stripe_customer_id

    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        metadata: { supabase_user_id: user.id },
        name: `${profile?.first_name ?? ''} ${profile?.last_name ?? ''}`.trim() || undefined,
      })
      customerId = customer.id
      
      await supabaseClient
        .from('profiles')
        .update({ stripe_customer_id: customerId })
        .eq('id', user.id)
    }

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      line_items: [{ price: priceId, quantity: 1 }],
      mode: 'subscription',
      success_url: successUrl,
      cancel_url: cancelUrl,
      subscription_data: {
        metadata: { supabase_user_id: user.id }
      }
    })

    console.log("[create-checkout-session] Session created", { sessionId: session.id });

    return new Response(JSON.stringify({ url: session.url }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })
  } catch (error) {
    // 2. Tratamento de Erro Explícito
    console.error("[create-checkout-session] Error processing request:", error.message);
    
    // Retorna a mensagem de erro explícita com status 500
    return new Response(JSON.stringify({ 
      error: error.message,
      detail: "Internal server error or invalid input."
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500, 
    })
  }
})