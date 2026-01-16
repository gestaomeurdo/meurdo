import React, { useRef, useState } from 'react';
import SignatureCanvas from 'react-signature-canvas';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, CheckCircle, X, Upload } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { showError, showSuccess } from '@/utils/toast';
import { cn } from '@/lib/utils';

interface RdoSignaturePadProps {
  diarioId: string;
  obraId: string;
  signatureType: 'responsible' | 'client';
  currentSignatureUrl: string | null;
  onSignatureSave: (url: string) => void;
}

const RdoSignaturePad = ({ diarioId, obraId, signatureType, currentSignatureUrl, onSignatureSave }: RdoSignaturePadProps) => {
  const sigPad = useRef<any>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isDrawing, setIsDrawing] = useState(false);

  const clearSignature = () => {
    sigPad.current?.clear();
    setIsDrawing(false);
  };

  const handleSave = async () => {
    if (sigPad.current?.isEmpty()) {
      showError("A área de assinatura está vazia.");
      return;
    }

    setIsUploading(true);
    
    try {
      const base64Data = sigPad.current.toDataURL('image/png');
      const blob = await (await fetch(base64Data)).blob();
      
      // Use a timestamp if the RDO doesn't have an ID yet
      const idPart = diarioId === 'new' ? `temp-${Date.now()}` : diarioId;
      const fileName = `${signatureType}-${idPart}-${Math.random().toString(36).substring(7)}.png`;
      const filePath = `signatures/${obraId}/${fileName}`;

      // 1. Upload to Supabase Storage (using the bucket we know works)
      const { error: uploadError } = await supabase.storage
        .from('documentos_financeiros')
        .upload(filePath, blob, {
          cacheControl: '3600',
          upsert: false,
          contentType: 'image/png',
        });

      if (uploadError) throw uploadError;

      // 2. Get Public URL
      const { data: publicUrlData } = supabase.storage
        .from('documentos_financeiros')
        .getPublicUrl(filePath);
      
      onSignatureSave(publicUrlData.publicUrl);
      showSuccess("Assinatura capturada!");

    } catch (error) {
      showError("Erro ao salvar assinatura. Verifique se o bucket 'documentos_financeiros' existe.");
      console.error("Signature upload error:", error);
    } finally {
      setIsUploading(false);
    }
  };

  const title = signatureType === 'responsible' ? 'Assinatura do Responsável' : 'Assinatura do Cliente/Fiscal';

  if (currentSignatureUrl) {
    return (
      <Card className="border-green-500/50 bg-green-50/5">
        <CardHeader className="p-3 flex flex-row items-center justify-between">
          <CardTitle className="text-sm font-semibold text-green-600 flex items-center">
            <CheckCircle className="w-4 h-4 mr-2" /> {title}
          </CardTitle>
          <Button variant="ghost" size="sm" onClick={() => onSignatureSave('')} className="h-7 text-xs">Trocar</Button>
        </CardHeader>
        <CardContent className="p-3 pt-0">
          <img src={currentSignatureUrl} alt={`${title} saved`} className="w-full h-auto border rounded-md bg-white max-h-[100px] object-contain" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn("transition-all border-dashed", isDrawing && "ring-2 ring-primary border-primary")}>
      <CardHeader className="p-3">
        <CardTitle className="text-sm font-semibold">{title}</CardTitle>
      </CardHeader>
      <CardContent className="p-3 pt-0 space-y-2">
        <div className="border rounded-md bg-white overflow-hidden">
          <SignatureCanvas
            ref={sigPad}
            penColor='black'
            canvasProps={{ 
                width: 350, 
                height: 120, 
                className: 'sigCanvas w-full cursor-crosshair' 
            }}
            onBegin={() => setIsDrawing(true)}
          />
        </div>
        <div className="flex gap-2">
          <Button type="button" variant="outline" size="sm" onClick={clearSignature} disabled={isUploading} className="flex-1">
            <X className="w-4 h-4 mr-2" /> Limpar
          </Button>
          <Button type="button" size="sm" onClick={handleSave} disabled={isUploading} className="flex-1">
            {isUploading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Upload className="w-4 h-4 mr-2" />}
            Confirmar
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default RdoSignaturePad;