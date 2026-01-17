import React from "react";
import { Link, useLocation } from "react-router-dom";
import { navItems } from "@/config/navigation";
import { cn } from "@/lib/utils";
import { useAuth } from "@/integrations/supabase/auth-provider";
import { Skeleton } from "@/components/ui/skeleton";
import { useProfile } from "@/hooks/use-profile";
import { useTheme } from "next-themes";
import { Sun, Moon } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";

const LOGO_URL = "https://meurdo.com.br/wp-content/uploads/2026/01/Logo-MEU-RDO-scaled.png";

interface SidebarProps {
  isMobile: boolean;
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
}

const Sidebar = ({ isMobile, isOpen, setIsOpen }: SidebarProps) => {
  const location = useLocation();
  const { user, isLoading: isAuthLoading } = useAuth();
  const { data: profile, isLoading: isProfileLoading } = useProfile();
  const { theme, setTheme } = useTheme();

  const userRole = profile?.role || "view_only";
  const isLoading = isAuthLoading || isProfileLoading;
  const isPro = profile?.subscription_status === 'active';

  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };

  if (isLoading) {
    return (
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-30 w-64 bg-sidebar transition-transform duration-300 ease-in-out border-r",
          isMobile && !isOpen && "-translate-x-full",
          !isMobile && "translate-x-0"
        )}
      >
        <div className="p-4 space-y-4">
          <Skeleton className="h-10 w-3/4 mb-6" />
          <Skeleton className="h-8 w-full" />
          <Skeleton className="h-8 w-full" />
          <Skeleton className="h-8 w-full" />
        </div>
      </aside>
    );
  }

  const filteredNavItems = navItems.filter(item => item.roles.includes(userRole));

  return (
    <aside
      className={cn(
        "fixed inset-y-0 left-0 z-30 w-64 bg-sidebar transition-transform duration-300 ease-in-out border-r",
        isMobile && !isOpen && "-translate-x-full",
        !isMobile && "translate-x-0"
      )}
    >
      <div className="p-4 h-full flex flex-col">
        <div className="mb-8 flex flex-col items-start gap-2">
          <Link to="/dashboard" onClick={() => isMobile && setIsOpen(false)}>
            <img src={LOGO_URL} alt="MEU RDO" className="h-10 object-contain" />
          </Link>
          {isPro && (
            <Badge className="bg-primary hover:bg-primary/90 text-white font-bold text-[10px]">
              MEMBRO PRO
            </Badge>
          )}
        </div>
        <nav className="flex-grow">
          {filteredNavItems.map((item) => (
            <React.Fragment key={item.href}>
              <Link
                to={item.href}
                onClick={() => isMobile && setIsOpen(false)}
                className={cn(
                  "flex items-center p-3 rounded-xl transition-all mt-1 font-medium",
                  location.pathname === item.href
                    ? "bg-primary text-white shadow-lg shadow-primary/20 scale-[1.02]"
                    : "text-muted-foreground hover:bg-accent hover:text-primary"
                )}
              >
                <item.icon className="w-5 h-5 mr-3" />
                <span>{item.title}</span>
              </Link>
              {(item.href === '/financeiro' || item.href === '/documentacao') && (
                <div className="py-2 px-3">
                  <hr className="border-sidebar-border" />
                </div>
              )}
            </React.Fragment>
          ))}
        </nav>
        <div className="mt-auto pt-4 border-t border-sidebar-border space-y-4">
          <div className="flex items-center justify-between px-2">
            <div className="flex items-center space-x-2">
              {theme === 'dark' ? <Moon className="w-4 h-4 text-muted-foreground" /> : <Sun className="w-4 h-4 text-muted-foreground" />}
              <Label htmlFor="dark-mode-toggle" className="text-xs text-muted-foreground cursor-pointer">
                Modo Escuro
              </Label>
            </div>
            <Switch
              id="dark-mode-toggle"
              checked={theme === 'dark'}
              onCheckedChange={toggleTheme}
            />
          </div>
          <div className="px-2 py-3 bg-accent/50 rounded-xl">
            <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider mb-1">
              Logado como
            </p>
            <p className="text-xs font-semibold truncate">{user?.email}</p>
          </div>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;