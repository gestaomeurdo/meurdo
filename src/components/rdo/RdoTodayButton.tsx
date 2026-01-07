import { Button } from "@/components/ui/button";
import { FileText } from "lucide-react";
import RdoDialog from "./RdoDialog";

interface RdoTodayButtonProps {
  obraId: string;
}

const RdoTodayButton = ({ obraId }: RdoTodayButtonProps) => {
  const today = new Date();

  return (
    <div className="fixed bottom-20 right-6 z-10">
      <RdoDialog 
        obraId={obraId} 
        date={today} 
        trigger={
          <Button size="lg" className="rounded-full shadow-lg bg-secondary hover:bg-secondary/80 text-secondary-foreground">
            <FileText className="w-6 h-6 mr-2" />
            RDO Hoje
          </Button>
        }
      />
    </div>
  );
};

export default RdoTodayButton;