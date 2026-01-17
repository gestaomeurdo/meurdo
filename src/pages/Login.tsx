import { Auth } from '@supabase/auth-ui-react';
import { ThemeSupa } from '@supabase/auth-ui-shared';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const Login = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="items-center">
          <h1 className="text-3xl font-bold text-primary">MEU RDO</h1>
          <CardTitle className="text-xl text-center pt-2 text-foreground">
            Acesse sua conta
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Auth
            supabaseClient={supabase}
            providers={[]}
            appearance={{
              theme: ThemeSupa,
              variables: {
                default: {
                  colors: {
                    brand: 'hsl(var(--primary))', // Blue
                    brandAccent: 'hsl(var(--primary-foreground))',
                    defaultButtonBackground: 'hsl(var(--secondary))',
                    defaultButtonBackgroundHover: 'hsl(var(--secondary-foreground))',
                    inputBackground: 'hsl(var(--background))',
                    inputBorder: 'hsl(var(--border))',
                    inputBorderHover: 'hsl(var(--primary))',
                    inputBorderFocus: 'hsl(var(--primary))',
                    inputText: 'hsl(var(--foreground))',
                  },
                },
              },
            }}
            theme="light" // Set theme explicitly to light
            view="sign_in"
            // Permitir sign_in, sign_up e forgotten_password
            onlyAllowIf={['sign_in', 'sign_up', 'forgotten_password']} 
            localization={{
              variables: {
                sign_in: {
                  email_label: 'Email',
                  password_label: 'Senha',
                  email_input_placeholder: 'Seu email',
                  password_input_placeholder: 'Sua senha',
                  button_label: 'Entrar',
                  social_provider_text: 'Ou entre com',
                  link_text: 'Não tem uma conta? Cadastre-se', // Adiciona o link de cadastro
                },
                sign_up: {
                  email_label: 'Email',
                  password_label: 'Criar Senha',
                  email_input_placeholder: 'Seu email',
                  password_input_placeholder: 'Sua senha segura',
                  button_label: 'Cadastrar',
                  link_text: 'Já tem uma conta? Faça login',
                },
                forgotten_password: {
                  link_text: 'Esqueceu sua senha?',
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