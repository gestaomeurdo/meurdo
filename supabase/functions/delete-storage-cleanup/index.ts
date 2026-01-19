import { serve } from "https://deno.land/std@0.190.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders })

  try {
    const payload = await req.json()
    if (payload.type !== 'DELETE' || payload.table !== 'obras') {
      return new Response(JSON.stringify({ message: 'Ignored' }), { headers: corsHeaders })
    }

    const { old_record } = payload
    const obraId = old_record?.id
    const userId = old_record?.user_id
    const fotoUrl = old_record?.foto_url

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const deletionPromises = []

    // 1. Capa da Obra
    if (fotoUrl && fotoUrl.includes('company_assets')) {
      const path = fotoUrl.split('/company_assets/')[1]
      deletionPromises.push(supabaseAdmin.storage.from('company_assets').remove([path]))
    }

    // 2. Documentos da Obra (Projetos, Contratos, etc)
    if (userId) {
        const docFolders = ['Projetos', 'Jurídico', 'Contratos', 'Comprovantes', 'Outros']
        for (const folder of docFolders) {
            const prefix = `${userId}/${obraId}/${folder}`
            deletionPromises.push((async () => {
                const { data: files } = await supabaseAdmin.storage.from('documentos_obra').list(prefix)
                if (files?.length) await supabaseAdmin.storage.from('documentos_obra').remove(files.map(f => `${prefix}/${f.name}`))
            })())
        }
    }

    // 3. RDO e Financeiro (Evidências, Assinaturas, Lançamentos)
    const finPrefixes = [`materiais/${obraId}`, `rdo_atividades/${obraId}`, `lancamentos/${obraId}`, `assinaturas/${obraId}`]
    for (const prefix of finPrefixes) {
        deletionPromises.push((async () => {
            const { data: files } = await supabaseAdmin.storage.from('documentos_financeiros').list(prefix)
            if (files?.length) await supabaseAdmin.storage.from('documentos_financeiros').remove(files.map(f => `${prefix}/${f.name}`))
        })())
    }

    await Promise.allSettled(deletionPromises)
    return new Response(JSON.stringify({ success: true }), { headers: corsHeaders })
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: corsHeaders })
  }
})