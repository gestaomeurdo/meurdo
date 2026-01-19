import { Menu, LogOut, Bell, UserCircle, User, AlertCircle, CheckCircle, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/integrations/supabase/auth-provider";
import { useIsMobile } from "@/hooks/use-mobile";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useProfile } from "@/hooks/use-profile";
import { Link } from "react-router-dom";
import { useRdoAlerts } from "@/hooks/use-rdo-alerts";
import { cn } from "@/lib/utils";

const ICON_URL = "https://meurdo.com.br/wp-content/uploads/2026/01/Icone.png";
const ADMIN_EMAIL = 'robsonalixandree@gmail.com';

interface HeaderProps {
  setSidebarOpen: (isOpen: boolean) => void;
}

const Header = ({ setSidebarOpen }: HeaderProps) => {
  const { signOut, user } = useAuth();
  const { data: profile } = useProfile();
  const { data: alerts } = useRdoAlerts();
  const isMobile = useIsMobile();

  const userName = profile?.first_name || user?.email?.split('@')[0] || "Usuário";
  const alertCount = alerts?.length || 0;
  const isAdmin = user?.email === ADMIN_EMAIL;

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
            <span className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em]">Painel de Gestão</span>
          </div>
        )}
        {isMobile && (
          <img src={ICON_URL} alt="MEU RDO" className="h-8 object-contain" />
        )}
      </div>
      <div className="flex items-center space-x-3">
        
        {/* SINO DE NOTIFICAÇÕES FUNCIONAL */}
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="relative h-10 w-10 rounded-xl hover:bg-accent">
                    <Bell className={cn("h-5 w-5", alertCount > 0 ? "text-red-500 animate-pulse" : "text-muted-foreground")} />
                    {alertCount > 0 && (
                        <span className="absolute top-2 right-2 w-4 h-4 bg-red-600 text-white text-[10px] font-black flex items-center justify-center rounded-full border-2 border-background">
                            {alertCount}
                        </span>
                    )}
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-80 rounded-2xl shadow-xl p-2">
                <DropdownMenuLabel className="text-xs font-black uppercase tracking-widest text-muted-foreground py-3 px-4">
                    Notificações ({alertCount})
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                {alertCount > 0 ? (
                    <div className="max-h-[300px] overflow-y-auto">
                        {alerts?.map(alert => (
                            <DropdownMenuItem key={alert.id} asChild className="p-4 cursor-pointer focus:bg-red-50 rounded-xl mb-1 border border-transparent focus:border-red-100">
                                <Link to="/gestao-rdo" state={{ obraId: alert.obra_id }} className="flex items-start gap-3">
                                    <div className="bg-red-100 p-2 rounded-lg mt-0.5">
                                        <AlertCircle className="w-4 h-4 text-red-600" />
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-xs font-bold leading-tight">Correção em {alert.obra_nome}</p>
                                        <p className="text-[10px] text-muted-foreground line-clamp-2 italic">"{alert.rejection_reason}"</p>
                                    </div>
                                </Link>
                            </DropdownMenuItem>
                        ))}
                    </div>
                ) : (
                    <div className="py-8 text-center text-muted-foreground">
                        <CheckCircle className="w-8 h-8 mx-auto mb-2 opacity-20" />
                        <p className="text-xs font-medium uppercase tracking-widest">Tudo em dia!</p>
                    </div>
                )}
            </DropdownMenuContent>
        </DropdownMenu>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="flex items-center space-x-2 pl-2 pr-1 rounded-full hover:bg-accent h-10">
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center border border-primary/20">
                <User className="h-4 w-4 text-primary" />
              </div>
              <span className="hidden sm:inline text-sm font-bold pr-2">{userName}</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56 rounded-xl shadow-xl">
            <DropdownMenuLabel className="font-bold">Minha Conta</DropdownMenuLabel>
            <DropdownMenuSeparator />
            
            {/* BOTÃO EXCLUSIVO PARA O ROBSON */}
            {isAdmin && (
              <>
                <DropdownMenuItem asChild className="cursor-pointer text-purple-600 focus:text-purple-700 focus:bg-purple-50">
                  <Link to="/admin/tickets" className="flex items-center py-2 font-bold">
                    <ShieldCheck className="h-4 w-4 mr-2" />
                    Backoffice Suporte
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
              </>
            )}

            <DropdownMenuItem asChild className="cursor-pointer">
              <Link to="/profile" className="flex items-center py-2">
                <UserCircle className="h-4 w-4 mr-2" />
                Ver Perfil
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={() => signOut()} className="text-destructive cursor-pointer py-2">
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