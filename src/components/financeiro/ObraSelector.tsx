import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useObras, Obra } from "@/hooks/use-obras";
import { Loader2, Construction } from "lucide-react";

interface ObraSelectorProps {
  selectedObraId: string | undefined;
  onSelectObra: (obraId: string) => void;
}

const ObraSelector = ({ selectedObraId, onSelectObra }: ObraSelectorProps) => {
  const { data: obras, isLoading, error } = useObras();

  if (isLoading) {
    return (
      <div className="flex items-center space-x-2 text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" />
        <span>Carregando obras...</span>
      </div>
    );
  }

  if (error || !obras || obras.length === 0) {
    return (
      <div className="flex items-center space-x-2 text-sm text-destructive">
        <Construction className="h-4 w-4" />
        <span>Nenhuma obra encontrada.</span>
      </div>
    );
  }

  return (
    <Select 
      value={selectedObraId} 
      onValueChange={onSelectObra}
    >
      <SelectTrigger className="w-[300px]">
        <SelectValue placeholder="Selecione a Obra" />
      </SelectTrigger>
      <SelectContent>
        {obras.map((obra: Obra) => (
          <SelectItem key={obra.id} value={obra.id}>
            {obra.nome}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};

export default ObraSelector;