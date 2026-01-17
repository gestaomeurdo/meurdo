import { Menu, LogOut, Bell, UserCircle, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/integrations/supabase/auth-provider";
import { useIsMobile } from "@/hooks/use-mobile";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useProfile } from "@/hooks/use-profile";
import { Link } from "react-router-dom";
import { Badge } from "@/components/ui/badge";

interface HeaderProps {
  setSidebarOpen: (isOpen: boolean) => void;
}

const Header = ({ setSidebarOpen }: HeaderProps) => {
  const { signOut, user } = useAuth();
  const { data: profile, isLoading: isLoadingProfile } = useProfile();
  const isMobile = useIsMobile();
  
  const userName = profile?.first_name || user?.email?.split('@')[0] || "Usuário";
  const isPro = profile?.subscription_status === 'active';
  const planLabel = isPro ? 'PRO' : 'FREE';

  return (
    <header className="sticky top-0 z-20 flex items-center justify-between h-16 px-4 bg-background border-b shadow-sm">
      <div className="flex items-center">
        {isMobile && (
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setSidebarOpen(true)}
            className="mr-2"
          >
            <Menu className="h-6 w-6" />
          </Button>
        )}
        <h1 className="text-xl font-semibold text-foreground flex items-center gap-2">
          MEU RDO
          {!isLoadingProfile && (
            <Badge variant={isPro ? "default" : "outline"} className="text-[10px] py-0.5 px-2">
              {planLabel}
            </Badge>
          )}
        </h1>
      </div>
      
      <div className="flex items-center space-x-2">
        <Button variant="ghost" size="icon" title="Notificações">
            <Bell className="h-5 w-5 text-muted-foreground" />
        </Button>
        
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="flex items-center space-x-2">
                    <UserCircle className="h-6 w-6 text-primary" />
                    <span className="hidden sm:inline text-sm font-medium">{userName}</span>
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
                <DropdownMenuLabel>Minha Conta</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                    <Link to="/profile" className="flex items-center">
                        <User className="h-4 w-4 mr-2" />
                        Ver Perfil
                    </Link>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => signOut()} className="text-destructive">
                    <LogOut className="h-4 w-4 mr-2" />
                    Sair
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
};

export default Header;