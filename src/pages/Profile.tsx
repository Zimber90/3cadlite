import React, { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/SessionContext";
import { showError } from "@/utils/toast";
import { UserForm } from "@/components/UserForm";
import { Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface UserProfile {
  id: string;
  first_name: string | null;
  last_name: string | null;
  role: 'admin' | 'viewer';
  agent_id: string | null; // Aggiunto agent_id
}

const Profile = () => {
  const { user, loading: authLoading } = useAuth();
  const [profileData, setProfileData] = useState<UserProfile | null>(null);
  const [loadingProfile, setLoadingProfile] = useState(true);

  const fetchProfile = async () => {
    if (!user) {
      setLoadingProfile(false);
      return;
    }
    setLoadingProfile(true);
    const { data, error } = await supabase
      .from('profiles')
      .select('id, first_name, last_name, role, agent_id') // Seleziona anche agent_id
      .eq('id', user.id)
      .single();

    if (error) {
      showError(`Errore nel caricamento del profilo: ${error.message}`);
      setProfileData(null);
    } else {
      setProfileData(data as UserProfile);
    }
    setLoadingProfile(false);
  };

  useEffect(() => {
    if (!authLoading && user) {
      fetchProfile();
    }
  }, [authLoading, user]);

  if (authLoading || loadingProfile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4 text-foreground">
        <Loader2 className="h-8 w-8 animate-spin mr-2" /> Caricamento profilo...
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4 text-foreground">
        Nessun utente loggato.
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 sm:p-6 lg:p-8">
      <h1 className="text-2xl sm:text-3xl font-bold text-center sm:text-left mb-6">Il Mio Profilo</h1>
      <Card className="max-w-md mx-auto">
        <CardHeader>
          <CardTitle>Modifica i tuoi dati</CardTitle>
        </CardHeader>
        <CardContent>
          {profileData ? (
            <UserForm
              initialData={profileData}
              onSuccess={fetchProfile} // Ricarica il profilo dopo un aggiornamento riuscito
              onCancel={() => {}} // Nessuna azione di annullamento specifica qui
            />
          ) : (
            <p className="text-muted-foreground">Impossibile caricare i dati del profilo.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Profile;