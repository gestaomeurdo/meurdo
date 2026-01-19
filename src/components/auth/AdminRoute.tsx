import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "@/integrations/supabase/auth-provider";
import { Loader2 } from "lucide-react";

const ADMIN_EMAIL = 'robsonalixandree@gmail.com';

const AdminRoute = () => {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Verifica se o email corresponde ao do Robson
  if (user?.email !== ADMIN_EMAIL) {
    console.warn("Acesso negado: Tentativa de entrada no painel admin por", user?.email);
    return <Navigate to="/dashboard" replace />;
  }

  return <Outlet />;
};

export default AdminRoute;