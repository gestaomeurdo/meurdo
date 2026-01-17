import { Menu, LogOut, Bell, UserCircle, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/integrations/supabase/auth-provider";
import { useIsMobile } from "@/hooks/use-mobile";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useProfile } from "@/hooks/use-profile";
import { Link } from "react-router-dom";
import { Badge } from "@/components/ui/badge";

const ICON_URL = "https://meurdo.com.br/wp-content/uploads/2026/01/Icone.png";

interface HeaderProps {
  setSidebarOpen: (isOpen: boolean) => void;
}

const Header = ({ setSidebarOpen }: HeaderProps) => {
  const { signOut, user } = useAuth();
  const { data: profile, isLoading: isLoadingProfile } = useProfile();
  const isMobile = useIsMobile();

  const userName = profile?.first_name || user?.email?.split('@')[0] || "Usuário";
  const isPro = profile?.subscription_status === 'active';

  return (
    <header className="sticky top-0 z-20 flex items-center justify-between h-16 px-4 bg-background/80 backdrop-blur-md border-b shadow-sm">
      <div className="flex items-center">
        {isMobile && (
          <Button variant="ghost" size="icon" onClick={() => setSidebarOpen(true)} className="mr-3">
            <Menu className="h-6 w-6 text-primary" />
          </Button>
        )}
        {!isMobile && (
          <div className="flex items-center gap-2">
            <img src={ICON_URL} alt="Ícone" className="h-6 object-contain" />
            <span className="text-xs font-bold text-muted-foreground uppercase tracking-[0.2em]">Painel de Gestão</span>
          </div>
        )}
        {isMobile && (
          <img src={ICON_URL} alt="MEU RDO" className="h-8 object-contain" />
        )}
      </div>
      <div className="flex items-center space-x-3">
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5 text-muted-foreground" />
          <span className="absolute top-2 right-2 w-2 h-2 bg-primary rounded-full border-2 border-background"></span>
        </Button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="flex items-center space-x-2 pl-2 rounded-full hover:bg-accent">
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center border border-primary/20">
                <User className="h-4 w-4 text-primary" />
              </div>
              <span className="hidden sm:inline text-sm font-bold">{userName}</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel className="font-bold">Minha Conta</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild className="cursor-pointer">
              <Link to="/profile" className="flex items-center">
                <UserCircle className="h-4 w-4 mr-2" />
                Ver Perfil
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => signOut()} className="text-destructive cursor-pointer">
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