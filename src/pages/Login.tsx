import { useState } from 'react';
import { Auth } from '@supabase/auth-ui-react';
import { ThemeSupa } from '@supabase/auth-ui-shared';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader } from '@/components/ui/card';

const LOGO_URL = "https://meurdo.com.br/wp-content/uploads/2026/01/Logo-MEU-RDO-scaled.png";

const Login = () => {
  const [view, setView] = useState<'sign_in' | 'sign_up' | 'forgotten_password'>('sign_in');

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
        <CardContent className="pt-6 space-y-4">
          <Auth
            supabaseClient={supabase}
            view={view}
            onViewChange={(newView) => {
              if (newView === 'sign_in' || newView === 'sign_up' || newView === 'forgotten_password') {
                setView(newView as any);
              }
            }}
            providers={[]}
            appearance={{
              theme: ThemeSupa,
              variables: {
                default: {
                  colors: {
                    brand: 'hsl(var(--primary))',
                    brandAccent: 'hsl(var(--primary))',
                    inputBorderFocus: 'hsl(var(--primary))',
                    defaultButtonBackground: 'hsl(var(--primary))',
                    defaultButtonBackgroundHover: 'hsl(var(--primary))',
                    defaultButtonBorder: 'hsl(var(--primary))',
                    defaultButtonText: 'white',
                    anchorTextColor: 'hsl(var(--primary))',
                    anchorTextHoverColor: 'hsl(var(--primary))',
                  },
                  radii: {
                    buttonRadius: '0.75rem',
                    inputRadius: '0.75rem',
                    containerRadius: '1rem',
                  },
                },
              },
            }}
            theme="light"
            showLinks={false}
            localization={{
              variables: {
                sign_in: {
                  email_label: 'E-mail',
                  password_label: 'Senha',
                  button_label: 'Entrar',
                  loading_button_label: 'Entrando...',
                  email_input_placeholder: 'Seu e-mail',
                  password_input_placeholder: 'Sua senha',
                },
                sign_up: {
                  email_label: 'E-mail',
                  password_label: 'Crie uma Senha',
                  button_label: 'Criar Minha Conta',
                  loading_button_label: 'Criando conta...',
                  email_input_placeholder: 'E-mail profissional',
                  password_input_placeholder: 'Mínimo 6 caracteres',
                  confirmation_sent_label: 'Verifique seu e-mail para o link de confirmação!',
                },
                forgotten_password: {
                  email_label: 'E-mail',
                  button_label: 'Recuperar Senha',
                  loading_button_label: 'Enviando e-mail...',
                  email_input_placeholder: 'Seu e-mail cadastrado',
                  confirmation_sent_label: 'Instruções enviadas para seu e-mail!',
                },
              },
            }}
          />

          <div className="pt-4 border-t text-center space-y-3">
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