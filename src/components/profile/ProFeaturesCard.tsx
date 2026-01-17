import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { CheckCircle2, FileText, Headset, HardDrive } from "lucide-react";
import { Button } from "@/components/ui/button";

const ProFeaturesCard = () => {
  return (
    <Card className="bg-primary/5 border-primary/20">
      <CardHeader>
        <CardTitle className="text-xl text-primary">Benefícios do Plano PRO</CardTitle>
        <CardDescription>Seu acesso inclui os seguintes recursos premium:</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <ul className="space-y-3">
          <li className="flex items-center gap-3 text-sm">
            <CheckCircle2 className="h-5 w-5 text-green-500 shrink-0" />
            <span className="font-medium">Obras Ilimitadas:</span> Crie e gerencie quantas obras precisar.
          </li>
          <li className="flex items-center gap-3 text-sm">
            <FileText className="h-5 w-5 text-green-500 shrink-0" />
            <span className="font-medium">Relatórios Avançados:</span> Exportação de PDF com logotipo e dados completos.
          </li>
          <li className="flex items-center gap-3 text-sm">
            <HardDrive className="h-5 w-5 text-green-500 shrink-0" />
            <span className="font-medium">Armazenamento Extra:</span> Mais espaço para documentos e assinaturas.
          </li>
        </ul>
        
        <div className="pt-4 border-t border-primary/10">
          <Button 
            className="w-full bg-green-600 hover:bg-green-700 text-white"
            onClick={() => window.open('mailto:suporte@meurdo.com.br?subject=Suporte%20Prioritário%20PRO', '_blank')}
          >
            <Headset className="w-5 h-5 mr-2" />
            Suporte Prioritário
          </Button>
          <p className="text-xs text-muted-foreground mt-2 text-center">
            Clique para enviar um email direto à nossa equipe.
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

export default ProFeaturesCard;