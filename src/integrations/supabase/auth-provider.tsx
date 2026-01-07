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

interface AuthContextType {
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  isLoading: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const SessionContextProvider = ({ children }: { children: ReactNode }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    // Função para carregar a sessão inicial e configurar o listener
    const initializeAuth = async () => {
      try {
        // Busca a sessão atual imediatamente
        const { data: { session: initialSession } } = await supabase.auth.getSession();
        
        setSession(initialSession);
        const currentUser = initialSession?.user ?? null;
        setUser(currentUser);

        if (currentUser) {
          const userProfile = await fetchProfile(currentUser.id);
          setProfile(userProfile);
        }
      } catch (error) {
        console.error("Erro na inicialização da autenticação:", error);
      } finally {
        setIsLoading(false);
      }

      // Configura o listener para mudanças futuras (login/logout)
      const { data: authListener } = supabase.auth.onAuthStateChange(
        async (event, currentSession) => {
          setSession(currentSession);
          const currentUser = currentSession?.user ?? null;
          setUser(currentUser);

          if (currentUser) {
            const userProfile = await fetchProfile(currentUser.id);
            setProfile(userProfile);
          } else {
            setProfile(null);
          }
          
          setIsLoading(false);

          if (event === 'SIGNED_IN') {
            showSuccess("Login realizado com sucesso!");
            navigate("/dashboard", { replace: true });
          } else if (event === 'SIGNED_OUT') {
            showSuccess("Sessão encerrada.");
            navigate("/login", { replace: true });
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

  return (
    <AuthContext.Provider value={{ session, user, profile, isLoading, signOut }}>
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