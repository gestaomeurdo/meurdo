import { Link, useLocation } from "react-router-dom";
import { navItems } from "@/config/navigation";
import { cn } from "@/lib/utils";
import { useAuth } from "@/integrations/supabase/auth-provider";
import { Skeleton } from "@/components/ui/skeleton";
import { useProfile } from "@/hooks/use-profile";

interface SidebarProps {
  isMobile: boolean;
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
}

const Sidebar = ({ isMobile, isOpen, setIsOpen }: SidebarProps) => {
  const location = useLocation();
  const { user, isLoading: isAuthLoading } = useAuth();
  const { data: profile, isLoading: isProfileLoading } = useProfile();
  
  const userRole = profile?.role || "view_only";
  const isLoading = isAuthLoading || isProfileLoading;

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
        <div className="mb-6">
          <img src="https://i.ibb.co/7dmMx016/Gemini-Generated-Image-qkvwxnqkvwxnqkvw-upscayl-2x-upscayl-standard-4x.png" alt="Diário de Obra Logo" className="h-12 mx-auto" />
        </div>
        <nav className="flex-grow space-y-1">
          {filteredNavItems.map((item) => (
            <Link
              key={item.href}
              to={item.href}
              onClick={() => isMobile && setIsOpen(false)}
              className={cn(
                "flex items-center p-3 rounded-lg transition-colors",
                location.pathname === item.href
                  ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-md"
                  : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
              )}
            >
              <item.icon className="w-5 h-5 mr-3" />
              <span className="font-medium">{item.title}</span>
            </Link>
          ))}
        </nav>
        <div className="mt-auto pt-4 border-t border-sidebar-border">
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