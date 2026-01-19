"use client";

import { useFormContext, useWatch } from "react-hook-form";
import { FormField } from "@/components/ui/form";
import { Switch } from "@/components/ui/switch";
import { Sun, Cloud, CloudRain, CloudLightning, Check, AlertCircle } from "lucide-react";
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
      "flex flex-col sm:flex-row items-center justify-between py-4 px-4 sm:px-8 transition-all",
      !isEnabled && "opacity-30"
    )}>
      {/* Label + Switch */}
      <div className="flex items-center gap-6 w-full sm:w-48 shrink-0 mb-4 sm:mb-0">
        <span className="text-sm font-bold text-slate-500 w-16 uppercase tracking-tight">{label}</span>
        <FormField control={control} name={enabledName} render={({ field }) => (
          <Switch 
            checked={field.value} 
            onCheckedChange={field.onChange} 
            disabled={isApproved}
            className="data-[state=checked]:bg-[#066abc]"
          />
        )} />
      </div>

      <div className="flex flex-1 items-center justify-center sm:justify-end gap-2 sm:gap-6 w-full">
          {/* Weather Icons Group */}
          <div className="flex items-center gap-1 bg-slate-100/50 p-1 rounded-full border border-slate-100">
            {WEATHER_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                disabled={!isEnabled || isApproved}
                onClick={() => setValue(climaName, opt.value, { shouldDirty: true })}
                className={cn(
                  "w-10 h-8 flex items-center justify-center rounded-full transition-all",
                  currentClima === opt.value 
                    ? "bg-slate-400 text-white shadow-sm" 
                    : "text-slate-400 hover:text-slate-600"
                )}
              >
                <opt.icon className="w-5 h-5" />
              </button>
            ))}
          </div>

          <div className="hidden sm:block h-6 w-px bg-slate-200" />

          {/* Status Group */}
          <div className="flex items-center gap-2 bg-slate-100/50 p-1 rounded-full border border-slate-100">
            <button
              type="button"
              disabled={!isEnabled || isApproved}
              onClick={() => setValue(statusName, "Operacional", { shouldDirty: true })}
              className={cn(
                "flex items-center gap-1.5 px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest transition-all",
                currentStatus === "Operacional" 
                    ? "bg-slate-400 text-white shadow-sm" 
                    : "text-slate-400 hover:text-slate-600"
              )}
            >
              <Check className="w-3 h-3" /> OP.
            </button>
            <button
              type="button"
              disabled={!isEnabled || isApproved}
              onClick={() => setValue(statusName, "Paralisado", { shouldDirty: true })}
              className={cn(
                "flex items-center gap-1.5 px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest transition-all",
                currentStatus === "Paralisado" 
                    ? "bg-slate-400 text-white shadow-sm" 
                    : "text-slate-400 hover:text-slate-600"
              )}
            >
              <AlertCircle className="w-3 h-3" /> PAR.
            </button>
          </div>
      </div>
    </div>
  );
};

export default RdoPeriodRow;