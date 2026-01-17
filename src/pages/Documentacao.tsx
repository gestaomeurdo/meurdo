import DashboardLayout from "@/components/layout/DashboardLayout";
import { useObras } from "@/hooks/use-obras";
import { useState, useEffect, useMemo } from "react";
import { Loader2, Folder, Upload, AlertTriangle, FileText, HardDrive, Share2, Zap } from "lucide-react";
import ObraSelector from "@/components/financeiro/ObraSelector";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import DocumentUploadDialog from "@/components/documentacao/DocumentUploadDialog";
import { useDocuments, useStorageMetrics } from "@/hooks/use-document-storage";
import DocumentList from "@/components/documentacao/DocumentList";
import StorageMetricsCard from "@/components/documentacao/StorageMetricsCard";
import UpgradeButton from "@/components/subscription/UpgradeButton";

const FOLDERS = [
  { value: 'Projetos', label: 'Projetos' },
  { value: 'Jurídico', label: 'Jurídico / Alvarás' },
  { value: 'Contratos', label: 'Contratos' },
  { value: 'Comprovantes', label: 'Comprovantes' },
  { value: 'Outros', label: 'Outros' },
];

const Documentacao = () => {
  const { data: obras, isLoading: isLoadingObras } = useObras();
  const [selectedObraId, setSelectedObraId] = useState<string | undefined>(undefined);
  const [activeTab, setActiveTab] = useState(FOLDERS[0].value);

  useEffect(() => {
    if (obras && obras.length > 0 && !selectedObraId) {
      setSelectedObraId(obras[0].id);
    }
  }, [obras, selectedObraId]);

  const isObraValid = selectedObraId && selectedObraId !== '00000000-0000-0000-0000-000000000000';

  const { data: documents, isLoading: isLoadingDocuments, error: documentsError } = useDocuments(selectedObraId || '');
  const { data: metrics, isLoading: isLoadingMetrics } = useStorageMetrics();

  const renderContent = () => {
    if (isLoadingObras) {
      return (
        <div className="flex justify-center items-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      );
    }

    if (!isObraValid) {
      return (
        <Card className="border-dashed py-20 text-center">
          <CardContent>
            <FileText className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">Selecione uma obra para gerenciar a documentação.</p>
          </CardContent>
        </Card>
      );
    }

    if (documentsError) {
      return (
        <Alert variant="destructive" className="mt-6">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Erro ao carregar documentos</AlertTitle>
          <AlertDescription>
            Não foi possível acessar o armazenamento. Detalhe: {documentsError.message}
          </AlertDescription>
        </Alert>
      );
    }

    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <Tabs defaultValue={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-5 h-12 bg-muted/50 p-1 rounded-xl mb-4">
                {FOLDERS.map(f => (
                  <TabsTrigger
                    key={f.value}
                    value={f.value}
                    className="rounded-lg data-[state=active]:shadow-sm text-xs sm:text-sm"
                  >
                    <Folder className="w-4 h-4 mr-1 hidden sm:inline" />
                    {f.label}
                  </TabsTrigger>
                ))}
              </TabsList>
              {FOLDERS.map(f => (
                <TabsContent key={f.value} value={f.value} className="pt-2">
                  <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                    <Folder className="w-5 h-5 text-primary" />
                    {f.label}
                  </h3>
                  <DocumentList
                    documents={documents || []}
                    obraId={selectedObraId!}
                    folder={f.value}
                    isLoading={isLoadingDocuments}
                  />
                </TabsContent>
              ))}
            </Tabs>
          </div>
          <div className="lg:col-span-1 space-y-6">
            <StorageMetricsCard metrics={metrics} isLoading={isLoadingMetrics} />
            {metrics?.isPro && (
              <Card className="border-l-4 border-l-green-500 shadow-clean">
                <CardContent className="p-4 flex items-center gap-3">
                  <Share2 className="h-6 w-6 text-green-600" />
                  <div className="space-y-1">
                    <h4 className="font-bold text-sm">Compartilhamento PRO</h4>
                    <p className="text-xs text-muted-foreground">
                      Compartilhe pastas inteiras com clientes e parceiros via link.
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}
            {!metrics?.isPro && (
              <Card className="border-dashed border-orange-500/50 bg-orange-50/10">
                <CardContent className="p-4 space-y-3">
                  <div className="flex items-center gap-2">
                    <Zap className="h-5 w-5 text-orange-600 fill-current" />
                    <h4 className="font-bold text-sm">Recurso PRO</h4>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    O compartilhamento de documentos e o armazenamento de 1GB são exclusivos do Plano PRO.
                  </p>
                  <UpgradeButton />
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <DashboardLayout>
      <div className="p-4 sm:p-6 space-y-6 animate-in fade-in duration-500">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b pb-6">
          <div className="space-y-1">
            <h1 className="text-3xl font-black tracking-tighter uppercase">Documentação da Obra</h1>
            <p className="text-sm text-muted-foreground font-medium">
              Organização e upload de contratos, projetos e comprovantes.
            </p>
          </div>
          <div className="flex flex-wrap gap-3 items-center">
            <div className="w-full sm:w-auto">
              <ObraSelector selectedObraId={selectedObraId} onSelectObra={setSelectedObraId} />
            </div>
            {isObraValid && (
              <DocumentUploadDialog
                obraId={selectedObraId!}
                trigger={
                  <Button
                    className="bg-[#066abc] hover:bg-[#066abc]/90 rounded-xl shadow-lg w-full sm:w-auto"
                    disabled={!metrics?.canUpload}
                  >
                    <Upload className="w-4 h-4 mr-2" />
                    Upload de Documento
                  </Button>
                }
              />
            )}
          </div>
        </div>
        {renderContent()}
      </div>
    </DashboardLayout>
  );
};

export default Documentacao;