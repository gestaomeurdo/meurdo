import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "@/integrations/supabase/auth-provider";
import { Loader2 } from "lucide-react";

const ADMIN_EMAIL = 'robsonalixandree@gmail.com';

const AdminGuard = () => {
  const { user, isLoading } = useAuth();

  // 1. Enquanto carrega a sessão, trava a renderização em um spinner
  if (isLoading) {
    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-slate-950">
            <Loader2 className="h-10 w-10 animate-spin text-purple-500 mb-4" />
            <p className="text-purple-400 text-[10px] font-black uppercase tracking-[0.3em] animate-pulse">
                Verificando Credenciais Admin
            </p>
        </div>
    );
  }

  // 2. Se não estiver logado, manda direto para o Login
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // 3. Se estiver logado, mas NÃO for o Robson -> CHUTA de volta para o Dashboard
  if (user.email !== ADMIN_EMAIL) {
    console.error("Acesso negado: Tentativa de entrada não autorizada por", user.email);
    return <Navigate to="/dashboard" replace />;
  }

  // 4. Se for o Robson -> Libera o acesso às rotas filhas (Outlet)
  return <Outlet />;
};

export default AdminGuard;