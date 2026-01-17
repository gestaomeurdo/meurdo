"use client";

import React, { useRef, useState } from 'react';
import SignatureCanvas from 'react-signature-canvas';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, CheckCircle, X, Upload, Eraser } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { showError, showSuccess } from '@/utils/toast';
import { cn } from '@/lib/utils';

interface RdoSignaturePadProps {
  diarioId: string;
  obraId: string;
  currentSignatureUrl: string | null;
  onSignatureSave: (url: string) => void;
  disabled?: boolean;
}

const RdoSignaturePad = ({ diarioId, obraId, currentSignatureUrl, onSignatureSave, disabled }: RdoSignaturePadProps) => {
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
      const response = await fetch(base64Data);
      const blob = await response.blob();
      
      const fileName = `sig-${obraId}-${diarioId || 'new'}-${Date.now()}.png`;
      const filePath = `assinaturas/${obraId}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('documentos_financeiros')
        .upload(filePath, blob, {
          cacheControl: '3600',
          upsert: true,
          contentType: 'image/png',
        });

      if (uploadError) throw uploadError;

      const { data: publicUrlData } = supabase.storage
        .from('documentos_financeiros')
        .getPublicUrl(filePath);
      
      onSignatureSave(publicUrlData.publicUrl);
      showSuccess("Assinatura coletada com sucesso!");

    } catch (error: any) {
      console.error("Signature upload error:", error);
      showError(`Erro ao salvar: ${error.message}`);
    } finally {
      setIsUploading(false);
    }
  };

  if (currentSignatureUrl) {
    return (
      <Card className="border-green-500/50 bg-green-50/5">
        <CardHeader className="p-4 flex flex-row items-center justify-between">
          <CardTitle className="text-sm font-bold text-green-700 flex items-center">
            <CheckCircle className="w-4 h-4 mr-2" /> ASSINATURA REGISTRADA
          </CardTitle>
          <Button variant="ghost" size="sm" onClick={() => onSignatureSave('')} className="h-7 text-xs" disabled={disabled}>Trocar</Button>
        </CardHeader>
        <CardContent className="p-4 pt-0">
          <div className="bg-white border rounded-xl p-2 flex items-center justify-center">
            <img src={currentSignatureUrl} alt="Assinatura registrada" className="max-h-[100px] object-contain" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn("transition-all border-dashed overflow-hidden", isDrawing && "ring-2 ring-[#066abc] border-[#066abc]")}>
      <CardHeader className="p-4 bg-muted/30">
        <CardTitle className="text-sm font-bold uppercase tracking-tight">Desenhe sua Assinatura</CardTitle>
      </CardHeader>
      <CardContent className="p-4 space-y-4">
        <div className="border-2 border-dashed rounded-xl bg-white overflow-hidden relative">
          <SignatureCanvas
            ref={sigPad}
            penColor='black'
            canvasProps={{ 
                width: 500, 
                height: 150, 
                className: 'sigCanvas w-full cursor-crosshair' 
            }}
            onBegin={() => setIsDrawing(true)}
          />
          {!isDrawing && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none text-muted-foreground/30 text-xs font-bold uppercase tracking-widest">
                Assine aqui com o dedo ou mouse
            </div>
          )}
        </div>
        
        <div className="flex gap-2">
          <Button 
            type="button" 
            variant="outline" 
            size="sm" 
            onClick={clearSignature} 
            disabled={isUploading || disabled} 
            className="flex-1 rounded-xl"
          >
            <Eraser className="w-4 h-4 mr-2" /> Limpar
          </Button>
          <Button 
            type="button" 
            size="sm" 
            onClick={handleSave} 
            disabled={isUploading || disabled} 
            className="flex-1 bg-[#066abc] hover:bg-[#066abc]/90 text-white rounded-xl"
          >
            {isUploading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <CheckCircle className="w-4 h-4 mr-2" />}
            Confirmar
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default RdoSignaturePad;