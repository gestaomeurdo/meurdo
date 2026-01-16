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

    // We need a valid RDO ID to save the signature
    if (diarioId === 'new') {
        showError("Salve o RDO primeiro para anexar a assinatura.");
        return;
    }

    setIsUploading(true);
    const base64Data = sigPad.current.toDataURL('image/png');
    const blob = await (await fetch(base64Data)).blob();
    
    const fileName = `${signatureType}-${diarioId}-${Date.now()}.png`;
    const filePath = `signatures/${obraId}/${fileName}`;

    try {
      // 1. Upload to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('signatures')
        .upload(filePath, blob, {
          cacheControl: '3600',
          upsert: false,
          contentType: 'image/png',
        });

      if (uploadError) throw uploadError;

      // 2. Get Public URL
      const { data: publicUrlData } = supabase.storage
        .from('signatures')
        .getPublicUrl(filePath);
      
      onSignatureSave(publicUrlData.publicUrl);
      showSuccess("Assinatura salva com sucesso!");

    } catch (error) {
      showError("Erro ao salvar assinatura.");
      console.error("Signature upload error:", error);
    } finally {
      setIsUploading(false);
    }
  };

  const title = signatureType === 'responsible' ? 'Assinatura do Responsável' : 'Assinatura do Cliente/Fiscal';

  if (currentSignatureUrl) {
    return (
      <Card className="border-green-500/50">
        <CardHeader className="p-3 flex flex-row items-center justify-between">
          <CardTitle className="text-sm font-semibold text-green-600 flex items-center">
            <CheckCircle className="w-4 h-4 mr-2" /> {title}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-3 pt-0">
          <img src={currentSignatureUrl} alt={`${title} saved`} className="w-full h-auto border rounded-md bg-white" />
          <p className="text-xs text-muted-foreground mt-2">Assinatura registrada.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn("transition-all", isDrawing && "ring-2 ring-primary")}>
      <CardHeader className="p-3">
        <CardTitle className="text-sm font-semibold">{title}</CardTitle>
      </CardHeader>
      <CardContent className="p-3 pt-0 space-y-2">
        <div className="border border-dashed rounded-md bg-white">
          <SignatureCanvas
            ref={sigPad}
            penColor='black'
            canvasProps={{ width: 300, height: 150, className: 'sigCanvas w-full h-full' }}
            onBegin={() => setIsDrawing(true)}
            onEnd={() => setIsDrawing(false)}
          />
        </div>
        <div className="flex gap-2">
          <Button type="button" variant="outline" size="sm" onClick={clearSignature} disabled={isUploading}>
            <X className="w-4 h-4 mr-2" /> Limpar
          </Button>
          <Button type="button" size="sm" onClick={handleSave} disabled={isUploading || diarioId === 'new'}>
            {isUploading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Upload className="w-4 h-4 mr-2" />}
            {isUploading ? "Enviando..." : "Salvar Assinatura"}
          </Button>
        </div>
        {diarioId === 'new' && <p className="text-xs text-destructive mt-1">Salve o RDO primeiro para anexar a assinatura.</p>}
      </CardContent>
    </Card>
  );
};

export default RdoSignaturePad;