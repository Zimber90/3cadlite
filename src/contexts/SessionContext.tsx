import React, { createContext, useState, useEffect, useContext } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { showError } from '@/utils/toast';

interface Profile {
  id: string;
  first_name: string | null;
  last_name: string | null;
  role: 'admin' | 'viewer';
}

interface SessionContextType {
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  isAdmin: boolean;
  canEdit: boolean;
  loading: boolean;
}

const SessionContext = createContext<SessionContextType | undefined>(undefined);

export const SessionContextProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true); // Inizia come true

  useEffect(() => {
    console.log("SessionContext: useEffect avviato.");

    const fetchProfile = async (userId: string) => {
      console.log("SessionContext: Recupero profilo per ID utente:", userId);
      const { data, error } = await supabase
        .from('profiles')
        .select('id, first_name, last_name, role')
        .eq('id', userId)
        .single();

      if (error) {
        showError(`Errore nel caricamento del profilo: ${error.message}`);
        console.error("SessionContext: Errore nel recupero del profilo:", error);
        setProfile(null);
      } else {
        setProfile(data as Profile);
        console.log("SessionContext: Profilo recuperato:", data);
      }
    };

    const handleAuthStateChange = async (currentSession: Session | null) => {
      console.log("SessionContext: Stato di autenticazione cambiato. Sessione:", currentSession);
      setSession(currentSession);
      setUser(currentSession?.user || null);
      if (currentSession?.user) {
        await fetchProfile(currentSession.user.id);
      } else {
        setProfile(null);
        console.log("SessionContext: Nessun utente nella sessione, profilo cancellato.");
      }
      setLoading(false); // Imposta sempre loading a false dopo aver gestito lo stato di autenticazione
      console.log("SessionContext: Loading impostato a false.");
    };

    // Recupera la sessione iniziale
    const getInitialSession = async () => {
      console.log("SessionContext: Recupero sessione iniziale...");
      const { data: { session: initialSession }, error } = await supabase.auth.getSession();
      if (error) {
        showError(`Errore nel recupero della sessione iniziale: ${error.message}`);
        console.error("SessionContext: Errore nel recupero della sessione iniziale:", error);
        setLoading(false); // Assicurati che loading sia false anche in caso di errore iniziale
        return;
      }
      await handleAuthStateChange(initialSession);
    };

    getInitialSession();

    // Ascolta i cambiamenti successivi dello stato di autenticazione
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      console.log("SessionContext: Evento onAuthStateChange:", _event, "sessione:", session);
      handleAuthStateChange(session);
    });

    return () => {
      console.log("SessionContext: Pulizia useEffect. Annullamento sottoscrizione ai cambiamenti di autenticazione.");
      subscription.unsubscribe();
    };
  }, []); // Array di dipendenze vuoto significa che viene eseguito una sola volta al montaggio

  const isAdmin = profile?.role === 'admin';
  const canEdit = isAdmin;

  console.log("SessionContext: Render. Loading:", loading, "Sessione:", session, "Profilo:", profile);

  return (
    <SessionContext.Provider value={{ session, user, profile, isAdmin, canEdit, loading }}>
      {children}
    </SessionContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(SessionContext);
  if (context === undefined) {
    throw new Error('useAuth deve essere usato all\'interno di un SessionContextProvider');
  }
  return context;
};