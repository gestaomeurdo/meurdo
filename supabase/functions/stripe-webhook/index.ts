import { serve } from "https://deno.land/std@0.190.0/http/server.ts"
import Stripe from 'https://esm.sh/stripe@14.16.0'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0'

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') ?? '', {
  apiVersion: '2023-10-16',
  httpClient: Stripe.createFetchHttpClient(),
})

const cryptoProvider = Stripe.createSubtleCryptoProvider()

serve(async (req) => {
  const signature = req.headers.get('stripe-signature')

  if (!signature) {
    return new Response('No signature', { status: 400 })
  }

  try {
    const body = await req.text()
    const endpointSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET')
    
    let event
    try {
      event = await stripe.webhooks.constructEventAsync(
        body,
        signature,
        endpointSecret!,
        undefined,
        cryptoProvider
      )
    } catch (err) {
      console.error(`[stripe-webhook] Signature verification failed`, err.message)
      return new Response(`Webhook Error: ${err.message}`, { status: 400 })
    }

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    console.log(`[stripe-webhook] Event received: ${event.type}`)

    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object
        const userId = session.metadata?.supabase_user_id || session.subscription_data?.metadata?.supabase_user_id

        if (userId) {
          await supabaseAdmin
            .from('profiles')
            .update({ 
              subscription_status: 'active',
              plan_type: 'pro'
            })
            .eq('id', userId)
        }
        break
      }
      case 'customer.subscription.deleted': {
        const subscription = event.data.object
        const customerId = subscription.customer as string

        await supabaseAdmin
          .from('profiles')
          .update({ 
            subscription_status: 'free',
            plan_type: 'free'
          })
          .eq('stripe_customer_id', customerId)
        break
      }
      // Outros eventos como 'invoice.payment_failed' podem ser adicionados aqui
    }

    return new Response(JSON.stringify({ received: true }), { status: 200 })
  } catch (error) {
    console.error("[stripe-webhook] Error processing webhook", error)
    return new Response(JSON.stringify({ error: error.message }), { status: 500 })
  }
})