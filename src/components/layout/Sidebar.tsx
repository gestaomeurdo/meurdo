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
import { Badge } from "@/components/ui/badge"; // Import Badge

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
      <aside className={cn(
        "fixed inset-y-0 left-0 z-30 w-64 bg-sidebar transition-transform duration-300 ease-in-out border-r",
        isMobile && !isOpen && "-translate-x-full",
        !isMobile && "translate-x-0"
      )}>
        <div className="p-4 space-y-4">
          <Skeleton className="h-8 w-3/4 mb-6" />
          <Skeleton className="h-8 w-full" />
          <Skeleton className="h-8 w-full" />
          <Skeleton className="h-8 w-full" />
        </div>
      </aside>
    );
  }

  const filteredNavItems = navItems.filter(item => 
    item.roles.includes(userRole)
  );

  return (
    <aside
      className={cn(
        "fixed inset-y-0 left-0 z-30 w-64 bg-sidebar transition-transform duration-300 ease-in-out border-r",
        isMobile && !isOpen && "-translate-x-full",
        !isMobile && "translate-x-0"
      )}
    >
      <div className="p-4 h-full flex flex-col">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-primary">MEU RDO</h1>
          {isPro && (
            <Badge className="bg-yellow-500 hover:bg-yellow-600 text-black font-bold">
              PRO
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
                  "flex items-center p-3 rounded-lg transition-colors mt-1",
                  location.pathname === item.href
                    ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-md"
                    : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                )}
              >
                <item.icon className="w-5 h-5 mr-3" />
                <span className="font-medium">{item.title}</span>
              </Link>
              {(item.href === '/financeiro' || item.href === '/documentacao') && (
                <div className="py-2">
                  <hr className="border-sidebar-border" />
                </div>
              )}
            </React.Fragment>
          ))}
        </nav>
        <div className="mt-auto pt-4 border-t border-sidebar-border space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              {theme === 'dark' ? <Moon className="w-5 h-5 text-sidebar-foreground" /> : <Sun className="w-5 h-5 text-sidebar-foreground" />}
              <Label htmlFor="dark-mode-toggle" className="text-sm text-sidebar-foreground">Modo Escuro</Label>
            </div>
            <Switch
              id="dark-mode-toggle"
              checked={theme === 'dark'}
              onCheckedChange={toggleTheme}
            />
          </div>
          <p className="text-sm text-sidebar-foreground/70 truncate">
            Usuário: {user?.email}
          </p>
          <p className="text-sm text-sidebar-foreground/70 capitalize">
            Função: {userRole.replace('_', ' ')}
          </p>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;