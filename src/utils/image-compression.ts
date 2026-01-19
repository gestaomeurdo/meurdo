import imageCompression from 'browser-image-compression';

export interface CompressionOptions {
  maxSizeMB: number;
  maxWidthOrHeight: number;
  useWebWorker: boolean;
  fileType?: string;
  initialQuality?: number;
}

const defaultOptions: CompressionOptions = {
  maxSizeMB: 0.8, // Max 800KB
  maxWidthOrHeight: 1920, // Max 1920px
  useWebWorker: true,
  fileType: 'image/webp', // Converte para WebP
  initialQuality: 0.8,
};

/**
 * Comprime uma imagem no navegador antes do upload.
 * Converte para WebP e redimensiona para economizar banda e storage.
 */
export const compressImage = async (file: File, options: Partial<CompressionOptions> = {}): Promise<File> => {
  // Se não for imagem, retorna o arquivo original
  if (!file.type.startsWith('image/')) {
    return file;
  }

  try {
    console.log(`[ImageCompression] Iniciando. Original: ${(file.size / 1024 / 1024).toFixed(2)} MB`);
    
    const compressedFile = await imageCompression(file, { ...defaultOptions, ...options });
    
    console.log(`[ImageCompression] Finalizado. Novo: ${(compressedFile.size / 1024 / 1024).toFixed(2)} MB`);
    
    // O browser-image-compression pode remover o nome original ou mudar a extensão
    // Vamos garantir que o nome do arquivo tenha a extensão correta (.webp)
    const newFileName = file.name.replace(/\.[^/.]+$/, "") + ".webp";
    
    return new File([compressedFile], newFileName, { type: compressedFile.type });
  } catch (error) {
    console.error("[ImageCompression] Erro ao comprimir:", error);
    // Em caso de erro, retorna o arquivo original (fail-safe)
    return file;
  }
};