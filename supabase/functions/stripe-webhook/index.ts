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

    if (event.type === 'checkout.session.completed') {
        const session = event.data.object
        
        // 1. Tenta pegar o ID do usuário de várias fontes
        let userId = session.client_reference_id || session.metadata?.supabase_user_id || session.subscription_data?.metadata?.supabase_user_id

        // 2. Se não achou ID, tenta pelo e-mail do cliente
        if (!userId && session.customer_details?.email) {
            console.log(`[stripe-webhook] User ID not found in metadata, searching by email: ${session.customer_details.email}`)
            const { data: { users }, error } = await supabaseAdmin.auth.admin.listUsers()
            const user = users?.find(u => u.email === session.customer_details.email)
            if (user) {
                userId = user.id
            }
        }

        if (userId) {
          console.log(`[stripe-webhook] Updating user ${userId} to PRO`)
          
          const { error } = await supabaseAdmin
            .from('profiles')
            .update({ 
              subscription_status: 'active',
              plan_type: 'pro',
              stripe_customer_id: session.customer as string
            })
            .eq('id', userId)
            
          if (error) {
            console.error(`[stripe-webhook] Failed to update profile: ${error.message}`)
            return new Response(JSON.stringify({ error: error.message }), { status: 500 })
          }
        } else {
            console.error('[stripe-webhook] User not identified for session', session.id)
            return new Response('User not identified', { status: 400 })
        }
    } else if (event.type === 'customer.subscription.deleted') {
        const subscription = event.data.object
        const customerId = subscription.customer as string

        console.log(`[stripe-webhook] Removing PRO from customer ${customerId}`)
        await supabaseAdmin
          .from('profiles')
          .update({ 
            subscription_status: 'free',
            plan_type: 'free'
          })
          .eq('stripe_customer_id', customerId)
    }

    return new Response(JSON.stringify({ received: true }), { status: 200 })
  } catch (error) {
    console.error("[stripe-webhook] Error processing webhook", error)
    return new Response(JSON.stringify({ error: error.message }), { status: 500 })
  }
})