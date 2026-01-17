import { DocumentFile, useDeleteDocument } from "@/hooks/use-document-storage";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { FileText, Download, Trash2, Eye, Loader2, AlertTriangle } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { showError, showSuccess } from "@/utils/toast";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { formatBytes } from "@/utils/file-utils";

interface DocumentListProps {
  documents: DocumentFile[];
  obraId: string;
  folder: string;
  isLoading: boolean;
}

const DocumentList = ({ documents, obraId, folder, isLoading }: DocumentListProps) => {
  const deleteMutation = useDeleteDocument();

  const handleDelete = async (path: string, name: string) => {
    try {
      await deleteMutation.mutateAsync({ path, obraId });
      showSuccess(`Documento '${name}' excluído.`);
    } catch (err) {
      showError(`Erro ao excluir documento: ${err instanceof Error ? err.message : "Erro desconhecido"}`);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  const folderDocuments = documents.filter(doc => doc.path.includes(`/${folder}/`));

  if (folderDocuments.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground border border-dashed rounded-lg bg-muted/50">
        <FileText className="w-10 h-10 mx-auto mb-3" />
        <p>Nenhum documento nesta pasta.</p>
      </div>
    );
  }

  return (
    <div className="rounded-md border overflow-hidden">
      <Table>
        <TableHeader className="bg-muted/50">
          <TableRow>
            <TableHead>Nome do Arquivo</TableHead>
            <TableHead className="w-[120px]">Tamanho</TableHead>
            <TableHead className="w-[150px]">Upload</TableHead>
            <TableHead className="text-right w-[120px]">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {folderDocuments.map((doc) => (
            <TableRow key={doc.path}>
              <TableCell className="font-medium flex items-center gap-2">
                <FileText className="w-4 h-4 text-primary" />
                {doc.name}
              </TableCell>
              <TableCell className="text-sm text-muted-foreground">
                {formatBytes(doc.size)}
              </TableCell>
              <TableCell className="text-sm text-muted-foreground">
                {format(new Date(doc.uploaded_at), 'dd/MM/yyyy', { locale: ptBR })}
              </TableCell>
              <TableCell className="text-right space-x-1">
                <Button
                  variant="ghost"
                  size="icon"
                  asChild
                  title="Visualizar"
                >
                  <a href={doc.publicUrl} target="_blank" rel="noopener noreferrer">
                    <Eye className="w-4 h-4" />
                  </a>
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  asChild
                  title="Download"
                >
                  <a href={doc.publicUrl} download={doc.name}>
                    <Download className="w-4 h-4" />
                  </a>
                </Button>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-destructive hover:bg-destructive/10"
                      title="Excluir"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
                      <AlertDialogDescription>
                        Tem certeza que deseja excluir o arquivo "{doc.name}"?
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancelar</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() => handleDelete(doc.path, doc.name)}
                        className="bg-destructive hover:bg-destructive/90"
                      >
                        Excluir
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

export default DocumentList;