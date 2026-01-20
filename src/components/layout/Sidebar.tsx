import React from "react";
import { Link, useLocation } from "react-router-dom";
import { navItems } from "@/config/navigation";
import { cn } from "@/lib/utils";
import { useAuth } from "@/integrations/supabase/auth-provider";
import { Skeleton } from "@/components/ui/skeleton";
import { useProfile } from "@/hooks/use-profile";
import { useTheme } from "next-themes";
import { Sun, Moon, Zap } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useUnreadMessages } from "@/hooks/use-unread-messages";

const LOGO_URL = "https://meurdo.com.br/wp-content/uploads/2026/01/Logo-MEU-RDO-scaled.png";

interface SidebarProps {
  isMobile: boolean;
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
}

const Sidebar = ({ isMobile, isOpen, setIsOpen }: SidebarProps) => {
  const location = useLocation();
  const { isPro, user } = useAuth();
  const { data: profile, isLoading } = useProfile();
  const { theme, setTheme } = useTheme();
  const { unreadCount } = useUnreadMessages();

  const userRole = profile?.role || "obra_user";

  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };

  if (isLoading) {
    return (
      <aside className="fixed inset-y-0 left-0 z-50 w-64 bg-white dark:bg-slate-900 border-r p-4 space-y-4">
        <Skeleton className="h-10 w-3/4 mb-6" />
        <Skeleton className="h-8 w-full" />
        <Skeleton className="h-8 w-full" />
      </aside>
    );
  }

  const filteredNavItems = navItems.filter(item => item.roles.includes(userRole));

  return (
    <aside
      className={cn(
        "fixed inset-y-0 left-0 z-50 w-64 bg-white dark:bg-slate-900 transition-transform duration-300 ease-in-out border-r border-slate-200 dark:border-slate-800 shadow-xl",
        isMobile && !isOpen && "-translate-x-full",
        !isMobile && "translate-x-0"
      )}
    >
      <div className="p-6 h-full flex flex-col">
        <div className="mb-8 flex flex-col items-start gap-4">
          <Link to="/dashboard" onClick={() => isMobile && setIsOpen(false)}>
            <img src={LOGO_URL} alt="MEU RDO" className="h-10 object-contain" />
          </Link>
          
          <div className="flex items-center justify-between w-full bg-slate-50 dark:bg-slate-800/50 p-2 rounded-xl border dark:border-slate-700">
            <Badge className={cn("text-[9px] font-black tracking-widest border-none", isPro ? "bg-blue-600 text-white" : "bg-slate-200 text-slate-600 dark:bg-slate-700 dark:text-slate-400")}>
              {isPro ? "MEMBRO PRO" : "PLANO GRÁTIS"}
            </Badge>
            {!isPro && (
              <Link to="/settings" className="text-[9px] font-bold text-blue-600 hover:underline flex items-center">
                <Zap className="w-2.5 h-2.5 mr-1 fill-current" /> Upgrade
              </Link>
            )}
          </div>
        </div>

        <nav className="flex-grow space-y-1">
          {filteredNavItems.map((item) => {
            const isActive = location.pathname === item.href;
            const isSupport = item.href === "/suporte";
            
            return (
              <Link
                key={item.href}
                to={item.href}
                onClick={() => isMobile && setIsOpen(false)}
                className={cn(
                  "flex items-center p-3 rounded-xl transition-all font-bold text-sm group",
                  isActive
                    ? "bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400"
                    : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/50 hover:text-blue-600 dark:hover:text-blue-400"
                )}
              >
                <item.icon className={cn("w-5 h-5 mr-3 transition-colors", isActive ? "text-blue-600 dark:text-blue-400" : "text-slate-400 group-hover:text-blue-600")} />
                <span className="flex-1">{item.title}</span>
                
                {isSupport && unreadCount > 0 && (
                    <span className="bg-red-500 text-white text-[10px] font-black px-2 py-0.5 rounded-full animate-pulse shadow-lg shadow-red-500/20">
                        {unreadCount}
                    </span>
                )}
              </Link>
            );
          })}
        </nav>

        <div className="mt-auto pt-6 border-t border-slate-100 dark:border-slate-800 space-y-4">
          <div className="flex items-center justify-between px-2">
            <div className="flex items-center space-x-2 text-slate-500">
              {theme === 'dark' ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
              <Label htmlFor="dark-mode-toggle" className="text-[10px] font-black uppercase tracking-widest cursor-pointer">Modo Escuro</Label>
            </div>
            <Switch id="dark-mode-toggle" checked={theme === 'dark'} onCheckedChange={toggleTheme} className="data-[state=checked]:bg-blue-600" />
          </div>
          <div className="px-4 py-3 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border dark:border-slate-700">
            <p className="text-[9px] text-slate-400 uppercase font-black tracking-widest mb-1">Usuário</p>
            <p className="text-xs font-bold text-slate-700 dark:text-slate-200 truncate">{user?.email}</p>
          </div>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;