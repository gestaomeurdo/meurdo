import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/integrations/supabase/auth-provider";

const BUCKET_NAME = 'project-docs';
const MAX_FILE_SIZE_MB = 10; // Aumentado para 10MB para maior flexibilidade
const FREE_STORAGE_LIMIT_BYTES = 20 * 1024 * 1024; // 20MB para usuários Free

export interface DocumentFile {
  id?: string;
  name: string;
  path: string;
  uploaded_at: string;
  size: number;
  publicUrl: string;
  folder?: string;
}

export interface StorageMetrics {
  totalSize: number;
  limit: number;
  isPro: boolean;
  canUpload: boolean;
}

const fetchStorageMetrics = async (userId: string, isPro: boolean): Promise<StorageMetrics> => {
  const limit = isPro ? 1000 * 1024 * 1024 : FREE_STORAGE_LIMIT_BYTES;

  // Busca o total de bytes usados na tabela de documentos
  const { data, error } = await supabase
    .from('project_documents')
    .select('size')
    .eq('user_id', userId);

  if (error) {
    console.error("[StorageMetrics] Error calculating size:", error);
    return { totalSize: 0, limit, isPro, canUpload: true };
  }

  const totalSize = data.reduce((sum, doc) => sum + (Number(doc.size) || 0), 0);
  
  return {
    totalSize,
    limit,
    isPro,
    canUpload: isPro || totalSize < limit,
  };
};

const fetchDocuments = async (obraId: string): Promise<DocumentFile[]> => {
  // BUSCA DO BANCO DE DADOS (Mais rápido e confiável)
  const { data, error } = await supabase
    .from('project_documents')
    .select('*')
    .eq('obra_id', obraId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error("[fetchDocuments] Error querying table:", error);
    throw new Error(error.message);
  }

  return data.map(doc => ({
    id: doc.id,
    name: doc.name,
    path: doc.path,
    uploaded_at: doc.created_at,
    size: Number(doc.size) || 0,
    publicUrl: doc.url,
    folder: doc.folder
  }));
};

export const useDocuments = (obraId: string) => {
  const { user } = useAuth();
  const userId = user?.id;

  return useQuery<DocumentFile[], Error>({
    queryKey: ['documents', obraId],
    queryFn: () => fetchDocuments(obraId),
    enabled: !!obraId && !!userId,
    staleTime: 1000 * 60 * 2, // 2 minutos
  });
};

export const useStorageMetrics = () => {
  const { user, isPro } = useAuth();
  const userId = user?.id;

  return useQuery<StorageMetrics, Error>({
    queryKey: ['storageMetrics', userId, isPro],
    queryFn: () => fetchStorageMetrics(userId!, isPro),
    enabled: !!userId,
    staleTime: 1000 * 60 * 5,
  });
};

interface UploadInput {
  obraId: string;
  folder: string;
  file: File;
}

export const useUploadDocument = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  
  return useMutation<DocumentFile, Error, UploadInput>({
    mutationFn: async ({ obraId, folder, file }) => {
      if (!user) throw new Error("Usuário não autenticado.");
      
      // Validação de tamanho
      if (file.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
        throw new Error(`O arquivo excede o limite de ${MAX_FILE_SIZE_MB}MB.`);
      }

      const fileExt = file.name.split('.').pop();
      const safeFileName = `${Math.random().toString(36).substring(2, 15)}.${fileExt}`;
      const filePath = `${user.id}/${obraId}/${folder}/${safeFileName}`;

      // PASSO 1: Upload para o Storage
      const { error: uploadError } = await supabase.storage
        .from(BUCKET_NAME)
        .upload(filePath, file);

      if (uploadError) {
        console.error("[UploadDocument] Storage error:", uploadError);
        throw new Error(`Falha no upload: ${uploadError.message}`);
      }

      // Obter URL pública
      const { data: { publicUrl } } = supabase.storage
        .from(BUCKET_NAME)
        .getPublicUrl(filePath);

      // PASSO 2: Salvar Registro no Banco de Dados
      const { data: dbData, error: dbError } = await supabase
        .from('project_documents')
        .insert({
          obra_id: obraId,
          user_id: user.id,
          name: file.name,
          url: publicUrl,
          path: filePath,
          type: fileExt,
          folder: folder,
          size: file.size
        })
        .select()
        .single();

      if (dbError) {
        // Rollback: se falhar o banco, remove do storage para não deixar lixo
        await supabase.storage.from(BUCKET_NAME).remove([filePath]);
        throw new Error(`Erro ao registrar documento no banco: ${dbError.message}`);
      }
        
      return {
        id: dbData.id,
        name: dbData.name,
        path: dbData.path,
        uploaded_at: dbData.created_at,
        size: Number(dbData.size),
        publicUrl: dbData.url,
      };
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['documents', variables.obraId] });
      queryClient.invalidateQueries({ queryKey: ['storageMetrics'] });
    },
  });
};

export const useDeleteDocument = () => {
  const queryClient = useQueryClient();
  
  return useMutation<void, Error, { path: string, obraId: string }>({
    mutationFn: async ({ path }) => {
      // 1. Deletar do Storage
      const { error: storageError } = await supabase.storage.from(BUCKET_NAME).remove([path]);
      if (storageError) throw storageError;

      // 2. Deletar do Banco (O vínculo está no path)
      const { error: dbError } = await supabase
        .from('project_documents')
        .delete()
        .eq('path', path);

      if (dbError) throw dbError;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['documents', variables.obraId] });
      queryClient.invalidateQueries({ queryKey: ['storageMetrics'] });
    },
  });
};