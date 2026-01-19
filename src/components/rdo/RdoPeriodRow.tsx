"use client";

import { useFormContext, useWatch } from "react-hook-form";
import { FormField, FormItem } from "@/components/ui/form";
import { Switch } from "@/components/ui/switch";
import { Sun, Cloud, CloudRain, CloudLightning, CheckCircle2, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

const WEATHER_OPTIONS = [
  { value: "Sol", icon: Sun },
  { value: "Nublado", icon: Cloud },
  { value: "Chuva Leve", icon: CloudRain },
  { value: "Chuva Forte", icon: CloudLightning },
];

interface RdoPeriodRowProps {
  label: string;
  enabledName: string;
  climaName: string;
  statusName: string;
  isApproved: boolean;
}

const RdoPeriodRow = ({ label, enabledName, climaName, statusName, isApproved }: RdoPeriodRowProps) => {
  const { control, setValue } = useFormContext();
  const isEnabled = useWatch({ control, name: enabledName });
  const currentClima = useWatch({ control, name: climaName });
  const currentStatus = useWatch({ control, name: statusName });

  return (
    <div className={cn(
      "flex flex-col sm:flex-row sm:items-center justify-between py-4 border-b border-border last:border-0 transition-all",
      (!isEnabled || isApproved) && "opacity-40 grayscale pointer-events-none"
    )}>
      <div className="flex items-center justify-between sm:justify-start gap-4 mb-3 sm:mb-0 pointer-events-auto">
        <span className="text-sm font-bold text-foreground w-16">{label}</span>
        <FormField control={control} name={enabledName} render={({ field }) => (
          <Switch 
            checked={field.value} 
            onCheckedChange={field.onChange} 
            className="data-[state=checked]:bg-primary h-5 w-9"
            disabled={isApproved}
          />
        )} />
      </div>

      <div className="flex items-center justify-between sm:justify-end gap-2 sm:gap-6">
        <div className="flex gap-1.5 items-center bg-muted/30 p-1 rounded-xl">
          {WEATHER_OPTIONS.map((opt) => (
            <button 
              key={opt.value}
              type="button"
              onClick={() => setValue(climaName, opt.value, { shouldDirty: true })}
              className={cn(
                "w-8 h-8 flex items-center justify-center rounded-lg transition-all",
                currentClima === opt.value 
                  ? "bg-primary text-white shadow-sm scale-110" 
                  : "text-muted-foreground hover:bg-muted/60"
              )}
              disabled={isApproved}
            >
              <opt.icon className="w-4 h-4" />
            </button>
          ))}
        </div>

        <div className="w-[1px] h-6 bg-border hidden sm:block" />

        <div className="flex bg-muted/40 p-1 rounded-xl border border-border/50 min-w-[140px]">
          <button 
            type="button"
            onClick={() => setValue(statusName, "Operacional", { shouldDirty: true })}
            className={cn(
              "flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg font-black text-[9px] uppercase tracking-wider transition-all",
              currentStatus === "Operacional" ? "bg-green-600 text-white shadow-sm" : "text-muted-foreground hover:text-foreground"
            )}
            disabled={isApproved}
          >
            <CheckCircle2 className="w-3 h-3" /> Op.
          </button>
          <button 
            type="button"
            onClick={() => setValue(statusName, "Paralisado", { shouldDirty: true })}
            className={cn(
              "flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg font-black text-[9px] uppercase tracking-wider transition-all",
              currentStatus === "Paralisado" ? "bg-destructive text-white shadow-sm" : "text-muted-foreground hover:text-foreground"
            )}
            disabled={isApproved}
          >
            <AlertCircle className="w-3 h-3" /> Par.
          </button>
        </div>
      </div>
    </div>
  );
};

export default RdoPeriodRow;