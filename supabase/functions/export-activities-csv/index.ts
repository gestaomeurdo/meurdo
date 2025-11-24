import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Helper function to convert JSON data to CSV string
function jsonToCsv(data: any[]) {
  if (data.length === 0) return "";

  const headers = Object.keys(data[0]);
  const csvRows = [];
  
  // Add headers
  csvRows.push(headers.join(';'));

  // Add data rows
  for (const row of data) {
    const values = headers.map(header => {
      const value = row[header];
      // Handle null/undefined and escape quotes
      return (value === null || value === undefined) ? '' : String(value).replace(/"/g, '""');
    });
    csvRows.push(values.join(';'));
  }

  return csvRows.join('\n');
}

serve(async (req) => {
  // Handle CORS preflight request
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const authHeader = req.headers.get('Authorization');
  if (!authHeader) {
    return new Response('Unauthorized', { status: 401, headers: corsHeaders });
  }

  try {
    const { obraId, startDate, endDate } = await req.json();

    if (!obraId || !startDate || !endDate) {
      return new Response(JSON.stringify({ error: 'Missing obraId, startDate, or endDate' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Initialize Supabase client with the request's JWT
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: authHeader },
        },
      }
    );

    // Fetch activities data
    const { data: activities, error } = await supabase
      .from('atividades_obra')
      .select('data_atividade, descricao, status, pedagio, km_rodado, created_at')
      .eq('obra_id', obraId)
      .gte('data_atividade', startDate)
      .lte('data_atividade', endDate)
      .order('data_atividade', { ascending: true });

    if (error) {
      console.error("Supabase error:", error);
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Fetch KM Cost for calculation
    const { data: kmCostData } = await supabase
      .from('configuracoes_globais')
      .select('valor')
      .eq('chave', 'custo_km_rodado')
      .single();
      
    const kmCost = kmCostData?.valor ?? 1.50;

    // Process data for CSV
    const processedData = activities.map(activity => ({
      Data: activity.data_atividade,
      Descricao: activity.descricao,
      Status: activity.status,
      Pedagio_R$: activity.pedagio || 0,
      KM_Rodado: activity.km_rodado || 0,
      Custo_KM_R$: (activity.km_rodado || 0) * kmCost,
      Custo_Total_R$: (activity.pedagio || 0) + ((activity.km_rodado || 0) * kmCost),
      Criado_Em: activity.created_at,
    }));

    const csv = jsonToCsv(processedData);
    
    const filename = `relatorio_atividades_${startDate}_a_${endDate}.csv`;

    return new Response(csv, {
      headers: {
        ...corsHeaders,
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
      status: 200,
    });

  } catch (error) {
    console.error("Function error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});