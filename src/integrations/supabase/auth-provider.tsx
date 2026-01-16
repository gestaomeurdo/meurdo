import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { Session, User } from "@supabase/supabase-js";
import { supabase } from "./client";
import { useNavigate } from "react-router-dom";
import { showSuccess, showError } from "@/utils/toast";
import { Profile, fetchProfile } from "@/hooks/use-profile";
import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";

interface AuthContextType {
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  isLoading: boolean;
  error: string | null;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const SessionContextProvider = ({ children }: { children: ReactNode }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const initializeAuth = async () => {
      try {
        // Failsafe: Timeout de 10 segundos para não travar o app se o Supabase não responder
        const timeout = setTimeout(() => {
          if (isLoading) {
            setIsLoading(false);
            setError("O servidor demorou muito para responder. Tente recarregar.");
          }
        }, 10000);

        const { data: { session: initialSession }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) throw sessionError;

        setSession(initialSession);
        const currentUser = initialSession?.user ?? null;
        setUser(currentUser);

        if (currentUser) {
          const userProfile = await fetchProfile(currentUser.id);
          setProfile(userProfile);
        }
        
        clearTimeout(timeout);
      } catch (err: any) {
        console.error("Erro na inicialização da autenticação:", err);
        setError(err.message);
      } finally {
        setIsLoading(false);
      }

      const { data: authListener } = supabase.auth.onAuthStateChange(
        async (event, currentSession) => {
          try {
            setSession(currentSession);
            const currentUser = currentSession?.user ?? null;
            setUser(currentUser);

            if (currentUser) {
              const userProfile = await fetchProfile(currentUser.id);
              setProfile(userProfile);
            } else {
              setProfile(null);
            }

            if (event === 'SIGNED_IN') {
              showSuccess("Login realizado com sucesso!");
              navigate("/dashboard", { replace: true });
            } else if (event === 'SIGNED_OUT') {
              showSuccess("Sessão encerrada.");
              navigate("/login", { replace: true });
            }
          } catch (err: any) {
            console.error("Erro no AuthStateChange:", err);
            setError(err.message);
          } finally {
            setIsLoading(false);
          }
        }
      );

      return authListener;
    };

    const listenerPromise = initializeAuth();

    return () => {
      listenerPromise.then(res => res?.subscription.unsubscribe());
    };
  }, [navigate]);

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      showError("Erro ao sair: " + error.message);
    }
  };

  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background p-6">
        <div className="bg-destructive/10 p-6 rounded-xl border border-destructive/20 max-w-md w-full text-center space-y-4">
          <AlertTriangle className="h-12 w-12 text-destructive mx-auto" />
          <h2 className="text-xl font-bold text-destructive">Erro Crítico de Validação</h2>
          <p className="text-sm text-muted-foreground break-all bg-black/5 p-3 rounded font-mono">
            {error}
          </p>
          <Button onClick={() => window.location.reload()} className="w-full">
            Tentar Novamente
          </Button>
          <Button variant="ghost" onClick={signOut} className="w-full">
            Sair e Fazer Login Novamente
          </Button>
        </div>
      </div>
    );
  }

  return (
    <AuthContext.Provider value={{ session, user, profile, isLoading, error, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within a SessionContextProvider");
  }
  return context;
};