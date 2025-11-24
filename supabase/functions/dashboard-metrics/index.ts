import { serve } from "https://deno.land/std@0.190.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0'

// Define CORS headers directly in the function to avoid import issues.
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Create a Supabase client with the user's auth token
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    )

    // Get the user from the token
    const { data: { user } } = await supabaseClient.auth.getUser()
    if (!user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 401,
      })
    }

    // Create a service role client to bypass RLS for internal calculations
    const serviceClient = createClient(
        Deno.env.get('SUPABASE_URL') ?? '',
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // 1. Fetch all obras for the user
    const { data: obras, error: obrasError } = await serviceClient
      .from('obras')
      .select('id, nome, status, orcamento_inicial')
      .eq('user_id', user.id);

    if (obrasError) throw obrasError;

    if (!obras || obras.length === 0) {
      return new Response(JSON.stringify({
        activeObrasCount: 0,
        totalInitialBudget: 0,
        chartData: [],
      }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // 2. Fetch all financial entries for the user's obras
    const { data: entries, error: entriesError } = await serviceClient
      .from('lancamentos_financeiros')
      .select('obra_id, valor')
      .in('obra_id', obras.map(o => o.id));

    if (entriesError) throw entriesError;

    // 3. Process metrics on the server
    const activeObrasCount = obras.filter(obra => obra.status === 'ativa').length;
    const totalInitialBudget = obras.reduce((sum, obra) => sum + (obra.orcamento_inicial || 0), 0);

    const expensesByObra = entries.reduce((acc, entry) => {
      if (entry.obra_id) {
        acc[entry.obra_id] = (acc[entry.obra_id] || 0) + entry.valor;
      }
      return acc;
    }, {} as Record<string, number>);

    const chartData = obras.map(obra => ({
      name: obra.nome,
      Orçamento: obra.orcamento_inicial || 0,
      Gasto: expensesByObra[obra.id] || 0,
    }));

    const responseData = {
      activeObrasCount,
      totalInitialBudget,
      chartData,
    };

    // 4. Return the processed data
    return new Response(JSON.stringify(responseData), {
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