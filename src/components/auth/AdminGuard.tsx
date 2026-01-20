import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "@/integrations/supabase/auth-provider";
import { Loader2 } from "lucide-react";

const ADMIN_EMAIL = 'robsonalixandree@gmail.com';

const AdminGuard = () => {
  const { user, profile, isLoading } = useAuth();

  if (isLoading) {
    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-slate-950">
            <Loader2 className="h-10 w-10 animate-spin text-blue-500 mb-4" />
            <p className="text-blue-400 text-[10px] font-black uppercase tracking-[0.3em] animate-pulse">
                Autenticando Nível de Acesso
            </p>
        </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Verifica se o email é o do Robson OU se a role no perfil é administrator
  const isAdmin = user.email === ADMIN_EMAIL || profile?.role === 'administrator';

  if (!isAdmin) {
    console.error("Acesso negado: Tentativa de entrada não autorizada por", user.email);
    return <Navigate to="/dashboard" replace />;
  }

  return <Outlet />;
};

export default AdminGuard;