import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { showSuccess, showError } from '@/utils/toast';
import { Loader2, Mail, Lock, User } from 'lucide-react';

const LOGO_URL = "https://meurdo.com.br/wp-content/uploads/2026/01/Logo-MEU-RDO-scaled.png";

const Login = () => {
  const [view, setView] = useState<'sign_in' | 'sign_up' | 'forgotten_password'>('sign_in');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [loading, setLoading] = useState(false);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (view === 'sign_in') {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      } else if (view === 'sign_up') {
        if (!fullName) {
          showError("O nome completo é obrigatório.");
          setLoading(false);
          return;
        }
        // Enviando full_name para o trigger handle_new_user processar no banco
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              full_name: fullName,
            },
            emailRedirectTo: `${window.location.origin}/auth/callback`,
          },
        });
        if (error) throw error;
        showSuccess("Cadastro realizado! Verifique seu e-mail para confirmar.");
      } else {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/auth/callback?type=recovery`,
        });
        if (error) throw error;
        showSuccess("Link de recuperação enviado para seu e-mail!");
      }
    } catch (error: any) {
      showError(error.message || "Ocorreu um erro na autenticação.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-accent/30 p-4">
      <Card className="w-full max-w-md shadow-2xl border-t-4 border-t-primary rounded-2xl">
        <CardHeader className="items-center pb-2 pt-8">
          <img src={LOGO_URL} alt="MEU RDO" className="h-16 object-contain mb-4" />
          <p className="text-sm text-muted-foreground text-center px-4 font-medium">
            {view === 'sign_in' 
              ? 'Gestão de Diários de Obra inteligente e profissional.' 
              : view === 'sign_up' 
                ? 'Comece agora a profissionalizar seus diários de obra.'
                : 'Recupere o acesso à sua conta.'}
          </p>
        </CardHeader>
        <CardContent className="pt-6">
          <form onSubmit={handleAuth} className="space-y-4">
            {view === 'sign_up' && (
              <div className="space-y-2">
                <Label htmlFor="fullName">Nome Completo</Label>
                <div className="relative">
                  <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="fullName"
                    placeholder="Seu nome e sobrenome"
                    className="pl-9 rounded-xl h-11"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    required
                  />
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="email">E-mail</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  placeholder="seu@email.com"
                  className="pl-9 rounded-xl h-11"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
            </div>

            {view !== 'forgotten_password' && (
              <div className="space-y-2">
                <Label htmlFor="password">
                  {view === 'sign_up' ? 'Crie uma Senha' : 'Senha'}
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="password"
                    type="password"
                    placeholder="Mínimo 6 caracteres"
                    className="pl-9 rounded-xl h-11"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>
              </div>
            )}

            <Button 
              type="submit" 
              className="w-full h-11 rounded-xl bg-primary hover:bg-primary/90 font-bold"
              disabled={loading}
            >
              {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              {view === 'sign_in' ? 'Entrar' : view === 'sign_up' ? 'Criar Minha Conta' : 'Recuperar Senha'}
            </Button>
          </form>

          <div className="pt-6 mt-6 border-t text-center space-y-3">
            {view === 'sign_in' ? (
              <p className="text-sm text-muted-foreground">
                Não tem uma conta?{' '}
                <button
                  onClick={() => setView('sign_up')}
                  className="text-primary font-bold hover:underline"
                >
                  Cadastre-se aqui
                </button>
              </p>
            ) : (
              <p className="text-sm text-muted-foreground">
                Já possui conta?{' '}
                <button
                  onClick={() => setView('sign_in')}
                  className="text-primary font-bold hover:underline"
                >
                  Clique para entrar
                </button>
              </p>
            )}
            
            {view === 'sign_in' && (
              <button
                onClick={() => setView('forgotten_password')}
                className="block w-full text-xs text-muted-foreground hover:underline"
              >
                Esqueceu sua senha?
              </button>
            )}

            {view === 'forgotten_password' && (
              <button
                onClick={() => setView('sign_in')}
                className="text-primary font-bold hover:underline text-sm"
              >
                Voltar para o login
              </button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Login;