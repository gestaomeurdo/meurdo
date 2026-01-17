import { supabase } from "@/integrations/supabase/client";
import { parseCurrencyInput } from "./formatters";

export interface RawCargoEntry {
  Nome: string;
  Custo: string;
  Tipo?: string;
}

export async function importCargos(
  rawEntries: RawCargoEntry[],
  userId: string
): Promise<{ successCount: number, errorCount: number }> {
  if (!userId) throw new Error("Usuário não autenticado.");

  let successCount = 0;
  let errorCount = 0;
  const entriesToInsert = [];

  for (const entry of rawEntries) {
    try {
      const nome = entry.Nome?.trim();
      const rawCusto = entry.Custo?.toString().trim();

      // Mapeia o tipo, aceitando variações comuns
      let tipo: 'Próprio' | 'Empreiteiro' = 'Próprio';
      const rawTipo = entry.Tipo?.trim().toLowerCase();
      if (rawTipo === 'empreiteiro' || rawTipo === 'terceiro' || rawTipo === 'externo') {
        tipo = 'Empreiteiro';
      }

      if (!nome || !rawCusto) {
        errorCount++;
        continue;
      }

      const custo = parseCurrencyInput(rawCusto);
      entriesToInsert.push({
        user_id: userId,
        nome: nome,
        custo_diario: custo,
        tipo: tipo,
      });
    } catch (e) {
      console.error("[CargoImporter] Erro ao processar linha:", entry, e);
      errorCount++;
    }
  }

  if (entriesToInsert.length > 0) {
    const { error: insertError } = await supabase
      .from('cargos')
      .insert(entriesToInsert);

    if (insertError) {
      console.error("[CargoImporter] Erro no Supabase:", insertError);
      throw new Error(`Erro ao inserir no banco: ${insertError.message}`);
    }

    successCount = entriesToInsert.length;
  }

  return { successCount, errorCount };
}