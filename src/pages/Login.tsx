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
                    // Ensure buttons use primary color
                    defaultButtonBackground: 'hsl(var(--primary))',
                    defaultButtonBackgroundHover: 'hsl(var(--primary-foreground))', // Use white for hover background
                    defaultButtonBorder: 'hsl(var(--primary))',
                    defaultButtonText: 'hsl(var(--primary-foreground))',
                    anchorTextColor: 'hsl(var(--primary))',
                    anchorTextHoverColor: 'hsl(var(--primary))',
                  },
                  radii: {
                    buttonRadius: '0.75rem', // Rounded-xl
                    inputRadius: '0.75rem', // Rounded-xl
                    containerRadius: '1rem', // Rounded-2xl
                  },
                },
              },
            }}
            theme="light"
            view="sign_in"
            onlyAllowIf={['sign_in', 'sign_up', 'forgotten_password']} 
            localization={{
              variables: {
                common: {
                  errors: {
                    'Invalid login credentials': 'E-mail ou senha inválidos',
                  },
                },
                sign_in: {
                  email_label: 'E-mail',
                  password_label: 'Senha',
                  button_label: 'Entrar',
                  link_text: 'Não tem uma conta? Cadastre-se',
                  forgotten_password_link_text: 'Esqueceu sua senha?',
                },
                sign_up: {
                  email_label: 'E-mail',
                  password_label: 'Senha',
                  button_label: 'Criar Conta',
                  link_text: 'Já tem uma conta? Entrar',
                },
                forgotten_password: {
                  email_label: 'E-mail',
                  button_label: 'Enviar instruções de recuperação',
                  link_text: 'Esqueceu sua senha?',
                },
                update_password: {
                  password_label: 'Nova Senha',
                  button_label: 'Atualizar Senha',
                },
                magic_link: {
                  email_label: 'E-mail',
                  button_label: 'Enviar Link Mágico',
                  link_text: 'Entrar com Link Mágico',
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