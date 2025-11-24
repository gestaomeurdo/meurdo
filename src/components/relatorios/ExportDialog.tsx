import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { FileText, Download } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";

interface ExportDialogProps {
  obraNome: string;
  periodo: string;
}

const ExportDialog = ({ obraNome, periodo }: ExportDialogProps) => {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button>
          <FileText className="w-4 h-4 mr-2" />
          Exportar Relatório
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Exportar Relatório</DialogTitle>
          <DialogDescription>
            Exporte o relatório de {obraNome} para o período de {periodo}.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4">
          <Tabs defaultValue="pdf">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="pdf">PDF</TabsTrigger>
              <TabsTrigger value="csv">CSV</TabsTrigger>
            </TabsList>
            <TabsContent value="pdf" className="mt-4">
              <div className="border rounded-lg p-4 h-64 bg-muted/50 flex flex-col items-center justify-center">
                <FileText className="w-16 h-16 text-muted-foreground mb-4" />
                <h3 className="font-semibold">Pré-visualização do PDF</h3>
                <p className="text-sm text-muted-foreground">Capa com logo, período e KPIs.</p>
              </div>
            </TabsContent>
            <TabsContent value="csv" className="mt-4">
              <div className="border rounded-lg p-4 h-64 bg-muted/50 flex flex-col items-center justify-center">
                <p className="text-sm text-center text-muted-foreground">
                  Os dados de lançamentos financeiros e atividades serão exportados em formato de planilha (CSV).
                </p>
              </div>
            </TabsContent>
          </Tabs>
          <div className="mt-6 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="filename">Nome do Arquivo</Label>
              <Input id="filename" defaultValue={`Relatorio_${obraNome.replace(/\s/g, '_')}_${periodo.replace(/\s/g, '')}`} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="recipients">Enviar para (emails separados por vírgula)</Label>
              <Input id="recipients" placeholder="email1@exemplo.com, email2@exemplo.com" />
            </div>
            <div className="flex items-center space-x-2 mt-4">
              <Switch id="schedule" />
              <Label htmlFor="schedule">Agendar relatório mensal</Label>
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button type="button" variant="secondary">Cancelar</Button>
          <Button type="submit">
            <Download className="w-4 h-4 mr-2" />
            Gerar e Enviar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ExportDialog;