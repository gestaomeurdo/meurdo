import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/integrations/supabase/auth-provider";
import { showError } from "@/utils/toast";

const BUCKET_NAME = 'documentos_obra';
const MAX_FILE_SIZE_MB = 2; // Limite por arquivo
const FREE_STORAGE_LIMIT_BYTES = 10 * 1024 * 1024; // 10MB para o plano free

export interface DocumentFile {
  name: string;
  path: string;
  uploaded_at: string;
  size: number; // in bytes
  publicUrl: string;
}

export interface StorageMetrics {
  totalSize: number; // Total size of user's files in bytes
  limit: number; // Limit in bytes
  isPro: boolean;
  canUpload: boolean;
}

// --- Utility to get file size in a bucket (approximation for RLS) ---
// NOTE: Supabase RLS prevents direct aggregation of file sizes across all user files easily.
// We will rely on listing files and summing their sizes, which is slow but necessary for RLS.
// For a real-world app, this metric should be calculated server-side (Edge Function/DB Trigger).
// For now, we will use a simplified approach by listing files in the user's folder.

const fetchStorageMetrics = async (userId: string, isPro: boolean): Promise<StorageMetrics> => {
  const limit = isPro ? 1000 * 1024 * 1024 : FREE_STORAGE_LIMIT_BYTES; // 1GB for Pro

  // List all files in the user's root folder to calculate total size
  const { data, error } = await supabase.storage.from(BUCKET_NAME).list(`${userId}/`, {
    limit: 1000, // Max files to list
    offset: 0,
    search: '',
  });

  if (error) {
    console.error("[StorageMetrics] Error listing files:", error);
    // If listing fails (e.g., bucket not found or RLS issue), assume 0 size but allow upload if Pro
    return { totalSize: 0, limit, isPro, canUpload: isPro || 0 < limit };
  }

  const totalSize = data.reduce((sum, file) => sum + (file.metadata?.size || 0), 0);
  
  return {
    totalSize,
    limit,
    isPro,
    canUpload: isPro || totalSize < limit,
  };
};

// --- Fetching Documents ---
const fetchDocuments = async (obraId: string, userId: string): Promise<DocumentFile[]> => {
  const folderPath = `${userId}/${obraId}/`;
  
  const { data, error } = await supabase.storage.from(BUCKET_NAME).list(folderPath, {
    limit: 100,
    offset: 0,
    search: '',
  });

  if (error) {
    console.error("[fetchDocuments] Error listing files:", error);
    throw new Error(error.message);
  }

  return data.map(file => {
    const publicUrlData = supabase.storage.from(BUCKET_NAME).getPublicUrl(`${folderPath}${file.name}`);
    return {
      name: file.name,
      path: `${folderPath}${file.name}`,
      uploaded_at: file.created_at,
      size: file.metadata?.size || 0,
      publicUrl: publicUrlData.publicUrl,
    };
  });
};

export const useDocuments = (obraId: string) => {
  const { user } = useAuth();
  const userId = user?.id;

  return useQuery<DocumentFile[], Error>({
    queryKey: ['documents', obraId, userId],
    queryFn: () => fetchDocuments(obraId, userId!),
    enabled: !!obraId && !!userId,
    staleTime: 1000 * 60 * 5,
  });
};

export const useStorageMetrics = () => {
  const { user, profile } = useAuth();
  const userId = user?.id;
  const isPro = profile?.subscription_status === 'active';

  return useQuery<StorageMetrics, Error>({
    queryKey: ['storageMetrics', userId, isPro],
    queryFn: () => fetchStorageMetrics(userId!, isPro),
    enabled: !!userId,
    staleTime: 1000 * 60 * 5,
  });
};

// --- Upload Mutation ---
interface UploadInput {
  obraId: string;
  folder: string; // e.g., 'Projetos', 'Contratos'
  file: File;
}

export const useUploadDocument = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  
  return useMutation<DocumentFile, Error, UploadInput>({
    mutationFn: async ({ obraId, folder, file }) => {
      if (!user) throw new Error("Usuário não autenticado.");
      if (file.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
        throw new Error(`O arquivo excede o limite de ${MAX_FILE_SIZE_MB}MB.`);
      }

      const fileExt = file.name.split('.').pop();
      const safeFileName = file.name.replace(/[^a-zA-Z0-9.]/g, '_');
      const filePath = `${user.id}/${obraId}/${folder}/${Date.now()}-${safeFileName}`;

      const { error: uploadError } = await supabase.storage
        .from(BUCKET_NAME)
        .upload(filePath, file);

      if (uploadError) {
        console.error("[UploadDocument] Supabase upload error:", uploadError);
        throw new Error(`Falha no upload: ${uploadError.message}`);
      }

      const { data: publicUrlData } = supabase.storage
        .from(BUCKET_NAME)
        .getPublicUrl(filePath);
        
      // NOTE: We don't have the file size immediately after upload via the client API, 
      // but we can return the path and rely on query invalidation to fetch the full data.
      return {
        name: safeFileName,
        path: filePath,
        uploaded_at: new Date().toISOString(),
        size: file.size,
        publicUrl: publicUrlData.publicUrl,
      };
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['documents', variables.obraId] });
      queryClient.invalidateQueries({ queryKey: ['storageMetrics'] });
    },
  });
};

// --- Delete Mutation ---
export const useDeleteDocument = () => {
  const queryClient = useQueryClient();
  
  return useMutation<void, Error, { path: string, obraId: string }>({
    mutationFn: async ({ path }) => {
      // The path should be relative to the bucket root, e.g., 'user_id/obra_id/folder/file.ext'
      const { error } = await supabase.storage.from(BUCKET_NAME).remove([path]);
      if (error) throw new Error(error.message);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['documents', variables.obraId] });
      queryClient.invalidateQueries({ queryKey: ['storageMetrics'] });
    },
  });
};