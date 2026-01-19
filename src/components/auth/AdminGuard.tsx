import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "@/integrations/supabase/auth-provider";
import { Loader2 } from "lucide-react";

const ADMIN_EMAIL = 'robsonalixandree@gmail.com';

const AdminGuard = () => {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-950">
            <Loader2 className="h-8 w-8 animate-spin text-purple-500" />
        </div>
    );
  }

  if (user?.email !== ADMIN_EMAIL) {
    return <Navigate to="/dashboard" replace />;
  }

  return <Outlet />;
};

export default AdminGuard;