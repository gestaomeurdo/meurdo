import { serve } from "https://deno.land/std@0.190.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Tratamento de CORS para testes manuais (opcional para Webhook)
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const payload = await req.json()
    console.log("[delete-storage-cleanup] Evento recebido:", payload.type, payload.table)

    // Validar se é um evento de DELETE na tabela obras
    if (payload.type !== 'DELETE' || payload.table !== 'obras') {
      return new Response(JSON.stringify({ message: 'Ignored: Not a DELETE on obras' }), { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      })
    }

    const { old_record } = payload
    const obraId = old_record?.id
    const userId = old_record?.user_id
    const fotoUrl = old_record?.foto_url

    if (!obraId) {
      return new Response(JSON.stringify({ error: 'Missing obraId in old_record' }), { status: 400 })
    }

    console.log(`[delete-storage-cleanup] Iniciando limpeza para Obra: ${obraId} (User: ${userId})`)

    // Inicializar cliente Admin (Service Role)
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const deletionPromises = []

    // 1. Deletar Foto de Capa (Bucket: company_assets)
    if (fotoUrl) {
      try {
        // Extrair path relativo do URL público
        // Ex: .../company_assets/user_id/obras/file.jpg -> user_id/obras/file.jpg
        const urlObj = new URL(fotoUrl)
        const pathParts = urlObj.pathname.split('/company_assets/')
        if (pathParts.length > 1) {
          const relativePath = pathParts[1]
          console.log(`[delete-storage-cleanup] Removendo capa: ${relativePath}`)
          deletionPromises.push(
            supabaseAdmin.storage.from('company_assets').remove([relativePath])
          )
        }
      } catch (e) {
        console.error("Erro ao processar URL da foto:", e)
      }
    }

    // 2. Deletar Documentos da Obra (Bucket: documentos_obra)
    // Estrutura: {userId}/{obraId}/{folder}/*
    if (userId) {
        const docFolders = ['Projetos', 'Jurídico', 'Contratos', 'Comprovantes', 'Outros']
        
        for (const folder of docFolders) {
            const prefix = `${userId}/${obraId}/${folder}`
            const promise = (async () => {
                const { data: files } = await supabaseAdmin.storage
                    .from('documentos_obra')
                    .list(prefix, { limit: 200 })
                
                if (files && files.length > 0) {
                    const paths = files.map(f => `${prefix}/${f.name}`)
                    console.log(`[delete-storage-cleanup] Removendo ${paths.length} arquivos de ${folder}`)
                    await supabaseAdmin.storage.from('documentos_obra').remove(paths)
                }
            })()
            deletionPromises.push(promise)
        }
    }

    // 3. Deletar Arquivos Financeiros e RDO (Bucket: documentos_financeiros)
    // Estrutura: {category}/{obraId}/*
    const finCategories = [
        'assinaturas', 
        'rdo_atividades', 
        'rdo_safety', 
        'materiais', 
        'lancamentos'
    ]

    for (const category of finCategories) {
        const prefix = `${category}/${obraId}`
        const promise = (async () => {
            const { data: files } = await supabaseAdmin.storage
                .from('documentos_financeiros')
                .list(prefix, { limit: 200 }) // Limite seguro por lote
            
            if (files && files.length > 0) {
                const paths = files.map(f => `${prefix}/${f.name}`)
                console.log(`[delete-storage-cleanup] Removendo ${paths.length} arquivos de ${category}`)
                await supabaseAdmin.storage.from('documentos_financeiros').remove(paths)
            }
        })()
        deletionPromises.push(promise)
    }

    // Aguardar todas as operações
    await Promise.allSettled(deletionPromises)

    console.log("[delete-storage-cleanup] Limpeza concluída.")

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })

  } catch (error) {
    console.error("[delete-storage-cleanup] Erro fatal:", error)
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    })
  }
})