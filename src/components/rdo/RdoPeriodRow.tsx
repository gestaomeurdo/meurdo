"use client";

import { useFormContext, useWatch } from "react-hook-form";
import { FormField, FormItem } from "@/components/ui/form";
import { Switch } from "@/components/ui/switch";
import { Sun, Cloud, CloudRain, CloudLightning, CheckCircle2, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

const WEATHER_OPTIONS = [
  { value: "Sol", icon: Sun, label: "Limpo", color: "text-orange-500" },
  { value: "Nublado", icon: Cloud, label: "Nublado", color: "text-slate-400" },
  { value: "Chuva Leve", icon: CloudRain, label: "Chuva", color: "text-blue-400" },
  { value: "Chuva Forte", icon: CloudLightning, label: "Tempestade", color: "text-indigo-600" },
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
      "p-5 border rounded-2xl transition-all mb-3 flex flex-col gap-4",
      !isEnabled ? "bg-slate-50 border-slate-100 opacity-60" : "bg-white border-slate-200 shadow-sm",
      isApproved && "pointer-events-none"
    )}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
            <FormField control={control} name={enabledName} render={({ field }) => (
                <Switch 
                    checked={field.value} 
                    onCheckedChange={field.onChange} 
                    className="data-[state=checked]:bg-[#066abc]"
                />
            )} />
            <span className="text-xs font-black uppercase tracking-widest text-slate-800">{label}</span>
        </div>
        
        {isEnabled && (
            <div className="flex items-center gap-2">
                <span className={cn("text-[8px] font-black uppercase tracking-widest", currentStatus === 'Operacional' ? "text-emerald-600" : "text-red-500")}>
                    Status: {currentStatus}
                </span>
            </div>
        )}
      </div>

      {isEnabled && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 animate-in fade-in slide-in-from-top-2 duration-300">
              {/* Clima Selection */}
              <div className="flex gap-1.5 p-1 bg-slate-50 rounded-xl border">
                  {WEATHER_OPTIONS.map((opt) => (
                    <button 
                      key={opt.value}
                      type="button"
                      onClick={() => setValue(climaName, opt.value, { shouldDirty: true })}
                      className={cn(
                        "flex-1 flex flex-col items-center justify-center gap-1.5 py-2 rounded-lg transition-all",
                        currentClima === opt.value 
                          ? "bg-white shadow-md scale-105 border border-slate-200" 
                          : "opacity-40 grayscale hover:opacity-100 hover:grayscale-0"
                      )}
                    >
                      <opt.icon className={cn("w-5 h-5", currentClima === opt.value ? opt.color : "text-slate-400")} />
                      <span className="text-[7px] font-black uppercase tracking-tighter">{opt.label}</span>
                    </button>
                  ))}
              </div>

              {/* Status Selection */}
              <div className="flex gap-2 p-1 bg-slate-50 rounded-xl border">
                <button 
                    type="button"
                    onClick={() => setValue(statusName, "Operacional", { shouldDirty: true })}
                    className={cn(
                      "flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg font-black text-[9px] uppercase tracking-widest transition-all",
                      currentStatus === "Operacional" ? "bg-emerald-600 text-white shadow-lg" : "text-slate-400 hover:text-slate-600"
                    )}
                >
                    <CheckCircle2 className="w-3.5 h-3.5" /> Operacional
                </button>
                <button 
                    type="button"
                    onClick={() => setValue(statusName, "Paralisado", { shouldDirty: true })}
                    className={cn(
                      "flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg font-black text-[9px] uppercase tracking-widest transition-all",
                      currentStatus === "Paralisado" ? "bg-red-500 text-white shadow-lg" : "text-slate-400 hover:text-slate-600"
                    )}
                >
                    <AlertCircle className="w-3.5 h-3.5" /> Paralisado
                </button>
              </div>
          </div>
      )}
    </div>
  );
};

export default RdoPeriodRow;