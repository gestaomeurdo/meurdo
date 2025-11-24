import { serve } from "https://deno.land/std@0.190.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-control-allow-headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { obraId } = await req.json()
    if (!obraId) {
      throw new Error("obraId is required.")
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    )

    const { data: { user } } = await supabaseClient.auth.getUser()
    if (!user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 401,
      })
    }
    
    const serviceClient = createClient(
        Deno.env.get('SUPABASE_URL') ?? '',
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Security Check: Verify user has access to this obra
    const { data: accessData, error: accessError } = await serviceClient
      .from('obra_user_access')
      .select('obra_id')
      .eq('user_id', user.id)
      .eq('obra_id', obraId)
      .maybeSingle();

    if (accessError) throw accessError;
    // Also check if the user is the creator
     const { data: obraOwner, error: ownerError } = await serviceClient
      .from('obras')
      .select('id')
      .eq('user_id', user.id)
      .eq('id', obraId)
      .maybeSingle();
    if(ownerError) throw ownerError;


    if (!accessData && !obraOwner) {
       return new Response(JSON.stringify({ error: 'Forbidden' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 403,
      })
    }

    // Fetch obra details and financial entries in parallel
    const [obraResult, entriesResult] = await Promise.all([
      serviceClient.from('obras').select('orcamento_inicial').eq('id', obraId).single(),
      serviceClient.from('lancamentos_financeiros').select('valor, data_gasto, categorias_despesa(nome)').eq('obra_id', obraId)
    ]);

    if (obraResult.error) throw obraResult.error;
    if (entriesResult.error) throw entriesResult.error;

    const obra = obraResult.data;
    const entries = entriesResult.data;

    // --- Perform Calculations ---
    const totalGasto = entries.reduce((sum, entry) => sum + entry.valor, 0);
    const orcamentoInicial = obra.orcamento_inicial || 0;
    
    // Category data for Pie Chart
    const categoryMap = entries.reduce((acc, entry) => {
      const categoryName = (entry.categorias_despesa as { nome: string })?.nome || 'Outros';
      acc[categoryName] = (acc[categoryName] || 0) + entry.valor;
      return acc;
    }, {} as Record<string, number>);
    const categoryData = Object.entries(categoryMap).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);

    // Monthly data for Line Chart
    const monthlyMap = entries.reduce((acc, entry) => {
      const monthKey = entry.data_gasto.substring(0, 7); // YYYY-MM
      acc[monthKey] = (acc[monthKey] || 0) + entry.valor;
      return acc;
    }, {} as Record<string, number>);
    const monthlyData = Object.entries(monthlyMap).map(([key, value]) => ({
      name: key, // Will be formatted on client
      Gasto: value,
    })).sort((a, b) => a.name.localeCompare(b.name));

    const responseData = {
      summary: {
        orcamentoInicial,
        totalGasto,
        saldoDisponivel: orcamentoInicial - totalGasto,
        percentualUsado: orcamentoInicial > 0 ? (totalGasto / orcamentoInicial) * 100 : 0,
      },
      charts: {
        categoryData,
        monthlyData,
      }
    };

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