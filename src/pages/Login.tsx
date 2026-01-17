import { Auth } from '@supabase/auth-ui-react';
import { ThemeSupa } from '@supabase/auth-ui-shared';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader } from '@/components/ui/card';

const LOGO_URL = "https://meurdo.com.br/wp-content/uploads/2026/01/Logo-MEU-RDO-scaled.png";

const Login = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-accent/30 p-4">
      <Card className="w-full max-w-md shadow-2xl border-t-4 border-t-primary rounded-2xl">
        <CardHeader className="items-center pb-2 pt-8">
          <img src={LOGO_URL} alt="MEU RDO" className="h-16 object-contain mb-4" />
          <p className="text-sm text-muted-foreground text-center px-4">
            Gestão de Diários de Obra inteligente e profissional.
          </p>
        </CardHeader>
        <CardContent className="pt-6">
          <Auth
            supabaseClient={supabase}
            providers={[]}
            appearance={{
              theme: ThemeSupa,
              variables: {
                default: {
                  colors: {
                    brand: 'hsl(var(--primary))',
                    brandAccent: 'hsl(var(--primary))',
                    inputBorderFocus: 'hsl(var(--primary))',
                    defaultButtonBackground: 'white',
                    defaultButtonBackgroundHover: 'hsl(var(--accent))',
                  },
                  radii: {
                    buttonRadius: '12px',
                    inputRadius: '12px',
                    containerRadius: '16px',
                  },
                },
              },
            }}
            theme="light"
            view="sign_in"
            onlyAllowIf={['sign_in', 'sign_up', 'forgotten_password']} 
            localization={{
              variables: {
                sign_in: {
                  email_label: 'Seu E-mail',
                  password_label: 'Sua Senha',
                  button_label: 'Entrar agora',
                  link_text: 'Não tem conta? Cadastre-se grátis',
                },
                sign_up: {
                  email_label: 'E-mail profissional',
                  password_label: 'Criar Senha',
                  button_label: 'Criar Minha Conta',
                  link_text: 'Já tem uma conta? Entrar',
                },
              },
            }}
          />
        </CardContent>
      </Card>
    </div>
  );
};

export default Login;