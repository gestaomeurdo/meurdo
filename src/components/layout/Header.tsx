import { Menu, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/integrations/supabase/auth-provider";
import { useIsMobile } from "@/hooks/use-mobile";

interface HeaderProps {
  setSidebarOpen: (isOpen: boolean) => void;
}

const Header = ({ setSidebarOpen }: HeaderProps) => {
  const { signOut } = useAuth();
  const isMobile = useIsMobile();

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
        <h1 className="text-xl font-semibold text-primary">
          Gestão de Obras
        </h1>
      </div>
      
      <Button variant="ghost" onClick={signOut} className="flex items-center">
        <LogOut className="h-4 w-4 mr-2" />
        Sair
      </Button>
    </header>
  );
};

export default Header;