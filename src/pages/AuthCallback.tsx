import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Loader2 } from 'lucide-react';

const AuthCallback = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const handleAuthCallback = async () => {
      // O Supabase processa o hash/query automaticamente no background
      const { data, error } = await supabase.auth.getSession();

      if (error) {
        console.error("Erro no callback de auth:", error.message);
        navigate('/login?error=auth_callback_failed');
        return;
      }

      // Se for um fluxo de recuperação de senha, o Supabase emite o evento PASSWORD_RECOVERY
      // mas podemos forçar o redirecionamento aqui se detectarmos o tipo no hash
      const hash = window.location.hash;
      if (hash && hash.includes('type=recovery')) {
        navigate('/update-password');
      } else {
        navigate('/dashboard');
      }
    };

    handleAuthCallback();
  }, [navigate]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background">
      <div className="space-y-4 text-center">
        <Loader2 className="h-10 w-10 animate-spin text-primary mx-auto" />
        <p className="text-sm font-medium text-muted-foreground uppercase tracking-widest">
          Validando acesso...
        </p>
      </div>
    </div>
  );
};

export default AuthCallback;