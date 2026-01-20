import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { CheckCircle2, FileText, LifeBuoy, HardDrive } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

const ProFeaturesCard = () => {
  const navigate = useNavigate();

  return (
    <Card className="bg-primary/5 border-primary/20 rounded-[2rem] overflow-hidden">
      <CardHeader>
        <CardTitle className="text-xl text-primary font-black uppercase tracking-tight">Benefícios PRO</CardTitle>
        <CardDescription className="font-medium">Seu acesso inclui os seguintes recursos:</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <ul className="space-y-3">
          <li className="flex items-center gap-3 text-sm">
            <CheckCircle2 className="h-5 w-5 text-green-500 shrink-0" />
            <span className="font-bold">Obras Ilimitadas</span>
          </li>
          <li className="flex items-center gap-3 text-sm">
            <FileText className="h-5 w-5 text-green-500 shrink-0" />
            <span className="font-bold">Relatórios Whitelabel</span>
          </li>
          <li className="flex items-center gap-3 text-sm">
            <HardDrive className="h-5 w-5 text-green-500 shrink-0" />
            <span className="font-bold">Armazenamento 1GB</span>
          </li>
        </ul>
        <div className="pt-4 border-t border-primary/10">
          <Button
            onClick={() => navigate('/suporte')}
            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold h-12 rounded-xl shadow-lg"
          >
            <LifeBuoy className="w-5 h-5 mr-2" />
            Suporte Prioritário
          </Button>
          <p className="text-[10px] font-bold text-muted-foreground mt-2 text-center uppercase tracking-widest">
            Fale diretamente com nossa equipe técnica.
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

export default ProFeaturesCard;