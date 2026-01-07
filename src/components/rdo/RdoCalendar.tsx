import { useState } from "react";
import { Calendar as CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import RdoDialog from "./RdoDialog";

interface RdoCalendarProps {
  obraId: string;
}

const RdoCalendar = ({ obraId }: RdoCalendarProps) => {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const handleDateSelect = (date: Date | undefined) => {
    if (date) {
      setSelectedDate(date);
      setIsDialogOpen(true);
    }
  };

  return (
    <div className="flex flex-col sm:flex-row gap-3 items-center">
      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant={"outline"}
            className={cn(
              "w-full sm:w-[280px] justify-start text-left font-normal",
              !selectedDate && "text-muted-foreground"
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {selectedDate ? format(selectedDate, "PPP", { locale: ptBR }) : <span>Selecione a Data do RDO</span>}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0">
          <Calendar
            mode="single"
            selected={selectedDate}
            onSelect={handleDateSelect}
            initialFocus
          />
        </PopoverContent>
      </Popover>
      
      {/* RDO Dialog for the selected date */}
      {selectedDate && (
        <RdoDialog 
          obraId={obraId} 
          date={selectedDate} 
          trigger={
            <Button className="w-full sm:w-auto" disabled={!selectedDate}>
              <CalendarIcon className="w-4 h-4 mr-2" />
              {format(selectedDate, 'dd/MM/yyyy')}
            </Button>
          }
        />
      )}
    </div>
  );
};

export default RdoCalendar;