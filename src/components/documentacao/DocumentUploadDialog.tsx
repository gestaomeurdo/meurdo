import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Plus, Loader2, Upload, Folder, FileText, CheckCircle } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState } from "react";
import { useUploadDocument } from "@/hooks/use-document-storage";
import { showError, showSuccess } from "@/utils/toast";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface DocumentUploadDialogProps {
  obraId: string;
  trigger: React.ReactNode;
}

const FOLDERS = [
  { value: 'Projetos', label: 'Projetos (Plantas, Desenhos)' },
  { value: 'Jurídico', label: 'Jurídico / Alvarás' },
  { value: 'Contratos', label: 'Contratos (Clientes, Fornecedores)' },
  { value: 'Comprovantes', label: 'Comprovantes / Notas Fiscais' },
  { value: 'Outros', label: 'Outros Documentos' },
];

const DocumentUploadDialog = ({ obraId, trigger }: DocumentUploadDialogProps) => {
  const [open, setOpen] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [folder, setFolder] = useState<string>(FOLDERS[0].value);
  const uploadMutation = useUploadDocument();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!file) {
      showError("Selecione um arquivo para upload.");
      return;
    }

    try {
      await uploadMutation.mutateAsync({
        obraId,
        folder,
        file,
      });
      showSuccess(`Documento '${file.name}' enviado para ${folder}.`);
      setOpen(false);
      setFile(null);
    } catch (error) {
      showError(`Falha no upload: ${error instanceof Error ? error.message : "Erro desconhecido"}`);
    }
  };

  const isLoading = uploadMutation.isPending;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Fazer Upload de Documento</DialogTitle>
          <DialogDescription>
            Selecione o arquivo e a pasta de destino na obra.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="document-file">Arquivo</Label>
            <Input
              id="document-file"
              type="file"
              onChange={handleFileChange}
              disabled={isLoading}
            />
            {file && (
              <p className="text-xs text-muted-foreground mt-1">
                Arquivo selecionado: {file.name}
              </p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="document-folder">Pasta de Destino</Label>
            <Select
              onValueChange={setFolder}
              defaultValue={folder}
              disabled={isLoading}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Selecione a pasta" />
              </SelectTrigger>
              <SelectContent>
                {FOLDERS.map(f => (
                  <SelectItem key={f.value} value={f.value}>
                    <div className="flex items-center gap-2">
                      <Folder className="w-4 h-4 text-muted-foreground" />
                      {f.label}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button
            variant="secondary"
            onClick={() => setOpen(false)}
            disabled={isLoading}
          >
            Cancelar
          </Button>
          <Button
            onClick={handleUpload}
            disabled={isLoading || !file}
          >
            {isLoading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Upload className="mr-2 h-4 w-4" />
            )}
            {isLoading ? "Enviando..." : "Upload"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default DocumentUploadDialog;