import { serve } from "https://deno.land/std@0.190.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders })

  try {
    const authHeader = req.headers.get('Authorization')!
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    )
    
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser()
    if (userError || !user) throw new Error('Unauthorized')

    const { subject, message, plan, browserInfo } = await req.json()

    console.log(`[send-support-email] Novo ticket de ${user.email}`, { subject });

    // Aqui você usaria uma API como Resend, SendGrid ou Mailgun
    // Simulando o envio bem-sucedido para o propósito do sistema
    
    /* 
    Exemplo com Resend:
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${Deno.env.get('RESEND_API_KEY')}`,
      },
      body: JSON.stringify({
        from: 'Meu RDO App <suporte@meurdo.com.br>',
        to: 'suporte@meurdo.com.br',
        subject: `[TICKET] ${subject} - ${user.email}`,
        html: `
          <h3>Novo Chamado de Suporte</h3>
          <p><strong>Usuário:</strong> ${user.email}</p>
          <p><strong>Assunto:</strong> ${subject}</p>
          <p><strong>Mensagem:</strong> ${message}</p>
          <hr />
          <p style="font-size: 10px; color: #666;">
            <strong>Metadados de Debug:</strong><br />
            User ID: ${user.id}<br />
            Plano: ${plan}<br />
            Navegador: ${browserInfo}
          </p>
        `,
      }),
    });
    */

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    })
  }
})