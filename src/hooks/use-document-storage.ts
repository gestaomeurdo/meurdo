import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/integrations/supabase/auth-provider";

const BUCKET_NAME = 'project-docs';
const MAX_FILE_SIZE_MB = 2;
const FREE_STORAGE_LIMIT_BYTES = 10 * 1024 * 1024;

export interface DocumentFile {
  name: string;
  path: string;
  uploaded_at: string;
  size: number;
  publicUrl: string;
}

export interface StorageMetrics {
  totalSize: number;
  limit: number;
  isPro: boolean;
  canUpload: boolean;
}

const fetchStorageMetrics = async (userId: string, isPro: boolean): Promise<StorageMetrics> => {
  const limit = isPro ? 1000 * 1024 * 1024 : FREE_STORAGE_LIMIT_BYTES;

  const { data, error } = await supabase.storage.from(BUCKET_NAME).list(`${userId}/`, {
    limit: 1000,
    offset: 0,
    search: '',
  });

  if (error) {
    console.error("[StorageMetrics] Error listing files:", error);
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

const fetchDocuments = async (obraId: string, userId: string): Promise<DocumentFile[]> => {
  const folderPath = `${userId}/${obraId}/`;
  
  const { data, error } = await supabase.storage.from(BUCKET_NAME).list(folderPath, {
    limit: 100,
    offset: 0,
    search: '',
  });

  if (error) {
    console.error("[fetchDocuments] Error listing files:", error);
    if (error.message.includes("Bucket not found")) {
      return [];
    }
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
      if (file.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
        throw new Error(`O arquivo excede o limite de ${MAX_FILE_SIZE_MB}MB.`);
      }

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

export const useDeleteDocument = () => {
  const queryClient = useQueryClient();
  
  return useMutation<void, Error, { path: string, obraId: string }>({
    mutationFn: async ({ path }) => {
      const { error } = await supabase.storage.from(BUCKET_NAME).remove([path]);
      if (error) throw new Error(error.message);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['documents', variables.obraId] });
      queryClient.invalidateQueries({ queryKey: ['storageMetrics'] });
    },
  });
};