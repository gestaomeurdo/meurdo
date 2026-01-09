import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Helper function to convert JSON data to CSV string
function jsonToCsv(data: any[]) {
  if (data.length === 0) return "";

  // Define headers explicitly for better control and Portuguese names
  const headers = [
    'Data', 
    'Categoria', 
    'Descricao', 
    'Valor_R$', 
    'Forma_Pagamento', 
    'Documento_URL', 
    'Lancado_Em'
  ];
  const csvRows = [];
  
  // Add headers
  csvRows.push(headers.join(';'));

  // Add data rows
  for (const row of data) {
    const values = [
      row.data_gasto,
      row.categorias_despesa?.nome || 'N/A',
      String(row.descricao).replace(/"/g, '""'), // Escape quotes in description
      (row.valor || 0).toFixed(2).replace('.', ','), // Format value to BR currency standard
      row.forma_pagamento,
      row.documento_url || '',
      row.criado_em,
    ];
    csvRows.push(values.join(';'));
  }

  return csvRows.join('\n');
}

serve(async (req) => {
  console.log("[export-financial-csv] Function started.");
  
  // Handle CORS preflight request
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const authHeader = req.headers.get('Authorization');
  if (!authHeader) {
    console.error("[export-financial-csv] Unauthorized: Missing Authorization header.");
    return new Response('Unauthorized', { status: 401, headers: corsHeaders });
  }

  try {
    const { obraId, startDate, endDate, categoryId, paymentMethod } = await req.json();

    if (!obraId) {
      console.error("[export-financial-csv] Missing obraId.");
      return new Response(JSON.stringify({ error: 'Missing obraId' }), {
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

    // Build the query
    let query = supabase
      .from('lancamentos_financeiros')
      .select(`
        data_gasto, 
        descricao, 
        valor, 
        forma_pagamento, 
        documento_url, 
        criado_em,
        categorias_despesa (nome)
      `)
      .eq('obra_id', obraId)
      .order('data_gasto', { ascending: true });

    if (startDate) {
      query = query.gte('data_gasto', startDate);
    }
    if (endDate) {
      query = query.lte('data_gasto', endDate);
    }
    if (categoryId) {
      query = query.eq('categoria_id', categoryId);
    }
    if (paymentMethod) {
      query = query.eq('forma_pagamento', paymentMethod);
    }

    // Fetch data
    const { data: entries, error } = await query;

    if (error) {
      console.error("[export-financial-csv] Supabase error:", error);
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    
    console.log(`[export-financial-csv] Fetched ${entries.length} entries.`);

    const csv = jsonToCsv(entries);
    
    const filename = `lancamentos_obra_${obraId}.csv`;

    return new Response(csv, {
      headers: {
        ...corsHeaders,
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
      status: 200,
    });

  } catch (error) {
    console.error("[export-financial-csv] Function error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});