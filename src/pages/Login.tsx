import { Auth } from '@supabase/auth-ui-react';
import { ThemeSupa } from '@supabase/auth-ui-shared';
import { supabase } from '@/integrations/supabase/client';
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { showSuccess, showError } from '@/utils/toast';

const Login = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN') {
        showSuccess('Accesso effettuato con successo!');
        navigate('/');
      }
      if (event === 'SIGNED_OUT') {
        showSuccess('Disconnessione effettuata.');
        navigate('/login');
      }
      if (event === 'USER_UPDATED') {
        // Potrebbe essere utile per aggiornare lo stato dell'utente se il profilo cambia
      }
      if (session?.user && event === 'INITIAL_SESSION') {
        // Se c'è già una sessione all'avvio, reindirizza
        navigate('/');
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md p-8 bg-white rounded-lg shadow-md">
        <h2 className="text-2xl font-bold text-center mb-6 text-gray-800">Accedi o Registrati</h2>
        <Auth
          supabaseClient={supabase}
          providers={[]} // Puoi aggiungere provider come 'google', 'github' qui
          appearance={{
            theme: ThemeSupa,
            variables: {
              default: {
                colors: {
                  brand: 'hsl(var(--primary))',
                  brandAccent: 'hsl(var(--primary-foreground))',
                },
              },
            },
          }}
          // Rimosso theme="light" per consentire al tema di adattarsi
          localization={{
            variables: {
              sign_in: {
                email_label: 'Indirizzo Email',
                password_label: 'Password',
                email_input_placeholder: 'La tua email',
                password_input_placeholder: 'La tua password',
                button_label: 'Accedi',
                social_provider_text: 'Accedi con {{provider}}',
                link_text: 'Hai già un account? Accedi',
              },
              sign_up: {
                email_label: 'Indirizzo Email',
                password_label: 'Crea una Password',
                email_input_placeholder: 'La tua email',
                password_input_placeholder: 'Crea una password',
                button_label: 'Registrati',
                social_provider_text: 'Registrati con {{provider}}',
                link_text: 'Non hai un account? Registrati',
              },
              forgotten_password: {
                email_label: 'Indirizzo Email',
                password_reset_button_label: 'Invia istruzioni per il reset',
                link_text: 'Hai dimenticato la password?',
                email_input_placeholder: 'La tua email',
              },
              update_password: {
                password_label: 'Nuova Password',
                password_input_placeholder: 'La tua nuova password',
                button_label: 'Aggiorna Password',
              },
              magic_link: {
                email_input_placeholder: 'La tua email',
                button_label: 'Invia Magic Link',
                link_text: 'Invia un magic link',
              },
              verify_otp: {
                email_input_placeholder: 'La tua email',
                phone_input_placeholder: 'Il tuo numero di telefono',
                token_input_placeholder: 'Il tuo codice OTP',
                button_label: 'Verifica OTP',
                link_text: 'Hai ricevuto un codice OTP?',
              },
            },
          }}
        />
      </div>
    </div>
  );
};

export default Login;