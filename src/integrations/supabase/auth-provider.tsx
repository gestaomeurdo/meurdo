import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { Session, User } from "@supabase/supabase-js";
import { supabase } from "./client";
import { useNavigate, useLocation } from "react-router-dom";
import { Profile, fetchProfile } from "@/hooks/use-profile";
import { Loader2 } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";

interface AuthContextType {
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  isLoading: boolean;
  isPro: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const PRO_CACHE_KEY = 'meurdo_is_pro_v1';

export const SessionContextProvider = ({ children }: { children: ReactNode }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isPro, setIsPro] = useState<boolean>(() => {
    return localStorage.getItem(PRO_CACHE_KEY) === 'true';
  });
  
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();

  const updateProStatus = (p: Profile | null) => {
    const status = p?.subscription_status === 'active' || p?.plan_type === 'pro';
    setIsPro(status);
    localStorage.setItem(PRO_CACHE_KEY, status ? 'true' : 'false');
  };

  const signOut = async () => {
    try {
      await supabase.auth.signOut();
      setSession(null);
      setUser(null);
      setProfile(null);
      setIsPro(false);
      localStorage.removeItem(PRO_CACHE_KEY);
      queryClient.clear();
      navigate("/login", { replace: true });
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const { data: { session: initialSession } } = await supabase.auth.getSession();
        
        setSession(initialSession);
        const currentUser = initialSession?.user ?? null;
        setUser(currentUser);

        if (currentUser) {
          const userProfile = await fetchProfile(currentUser.id);
          setProfile(userProfile);
          updateProStatus(userProfile);
        }
      } catch (err) {
        console.error("Auth init error:", err);
      } finally {
        setIsLoading(false);
      }

      const { data: authListener } = supabase.auth.onAuthStateChange(
        async (event, currentSession) => {
          setSession(currentSession);
          const currentUser = currentSession?.user ?? null;
          setUser(currentUser);

          if (currentUser) {
            const userProfile = await fetchProfile(currentUser.id);
            setProfile(userProfile);
            updateProStatus(userProfile);
          } else {
            setProfile(null);
            updateProStatus(null);
          }

          const isPublicRoute = location.pathname.startsWith('/rdo/share/');

          if (event === 'SIGNED_IN') {
            if (!window.location.href.includes('type=recovery') && !isPublicRoute) {
                navigate("/dashboard", { replace: true });
            }
          } else if (event === 'SIGNED_OUT' && !isPublicRoute) {
            navigate("/login", { replace: true });
          } else if (event === 'PASSWORD_RECOVERY') {
            navigate("/update-password", { replace: true });
          }
        }
      );

      return authListener;
    };

    const listenerPromise = initializeAuth();

    return () => {
      listenerPromise.then(res => res?.subscription.unsubscribe());
    };
  }, [navigate, queryClient, location.pathname]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
        <p className="text-xs font-black uppercase tracking-[0.2em] text-muted-foreground animate-pulse">
            Sincronizando Sessão
        </p>
      </div>
    );
  }

  return (
    <AuthContext.Provider value={{ session, user, profile, isLoading, isPro, signOut }}>
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