import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/integrations/supabase/auth-provider";
import { Loader2 } from "lucide-react";

const Index = () => {
  const { session, isLoading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    // Wait until the session loading is complete
    if (!isLoading) {
      if (session) {
        // If there's a session, go to the dashboard
        navigate("/dashboard", { replace: true });
      } else {
        // If there's no session, go to the login page
        navigate("/login", { replace: true });
      }
    }
  }, [session, isLoading, navigate]);

  // Show a loading indicator while checking the session
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="flex flex-col items-center space-y-2">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-lg text-muted-foreground">Carregando...</p>
      </div>
    </div>
  );
};

export default Index;