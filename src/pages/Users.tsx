import React, { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { UserForm } from "@/components/UserForm";
import { PencilIcon, Trash2Icon } from "lucide-react";
import { showSuccess, showError } from "@/utils/toast";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { useAuth } from "@/contexts/SessionContext";
import { useNavigate } from "react-router-dom";

interface UserProfile {
  id: string;
  first_name: string | null;
  last_name: string | null;
  role: 'admin' | 'viewer';
}

const Users = () => {
  const { isAdmin, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<UserProfile | null>(null);

  const fetchUsers = async () => {
    setLoading(true);
    const { data: profilesData, error: profilesError } = await supabase
      .from("profiles")
      .select("id, first_name, last_name, role");

    if (profilesError) {
      showError(`Errore nel caricamento dei profili: ${profilesError.message}`);
      setLoading(false);
      return;
    }

    setUsers(profilesData as UserProfile[]);
    setLoading(false);
  };

  const handleEdit = (user: UserProfile) => {
    setEditingUser(user);
    setIsFormOpen(true);
  };

  const handleFormSuccess = () => {
    setIsFormOpen(false);
    setEditingUser(null);
    fetchUsers();
  };

  const handleFormCancel = () => {
    setIsFormOpen(false);
    setEditingUser(null);
  };

  const handleDelete = async (id: string) => {
    if (!isAdmin) {
      showError("Non hai i permessi per eliminare gli utenti.");
      return;
    }
    try {
      // Invoca la funzione Edge per eliminare l'utente
      const { data, error } = await supabase.functions.invoke('delete-user', {
        body: { userId: id },
      });

      if (error) {
        showError(`Errore durante l'eliminazione: ${error.message}`);
      } else if (data && data.error) {
        showError(`Errore durante l'eliminazione: ${data.error}`);
      } else {
        showSuccess("Utente eliminato con successo!");
        fetchUsers(); // Ricarica la lista degli utenti
      }
    } catch (error: any) {
      showError(`Errore di rete o sconosciuto durante l'eliminazione: ${error.message}`);
    }
  };

  useEffect(() => {
    if (!authLoading) {
      if (!isAdmin) {
        showError("Non hai i permessi per accedere a questa pagina.");
        navigate("/"); // Reindirizza se non è admin
      } else {
        fetchUsers();
      }
    }
  }, [isAdmin, authLoading, navigate]);

  if (loading || authLoading) {
    return <div className="text-center p-4 bg-background text-foreground">Caricamento utenti...</div>;
  }

  if (!isAdmin) {
    return null; // Non renderizzare nulla se non è admin e sta reindirizzando
  }

  return (
    <div className="container mx-auto p-4 sm:p-6 lg:p-8">
      <div className="flex flex-col sm:flex-row justify-between items-center mb-4 gap-4">
        <h1 className="text-2xl sm:text-3xl font-bold text-center sm:text-left">Gestione Utenti</h1>
        {/* I pulsanti Home, ThemeToggle e Logout sono ora nel Layout */}
      </div>

      {users.length === 0 && !loading ? (
        <p className="text-center text-muted-foreground">Nessun utente trovato.</p>
      ) : (
        <div className="overflow-x-auto rounded-md border">
          <Table className="min-w-full">
            <TableHeader>
              <TableRow>
                <TableHead className="w-[200px] px-2 sm:px-4">Nome</TableHead>
                <TableHead className="px-2 sm:px-4">Cognome</TableHead>
                <TableHead className="px-2 sm:px-4">Ruolo</TableHead>
                <TableHead className="text-right px-2 sm:px-4">Azioni</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((user) => (
                <TableRow key={user.id}>
                  <TableCell className="font-medium px-2 sm:px-4">{user.first_name || "N/D"}</TableCell>
                  <TableCell className="px-2 sm:px-4">{user.last_name || "N/D"}</TableCell>
                  <TableCell className="px-2 sm:px-4">{user.role}</TableCell>
                  <TableCell className="text-right flex justify-end space-x-2 px-2 sm:px-4">
                    <Button variant="outline" size="icon" onClick={() => handleEdit(user)}>
                      <PencilIcon className="h-4 w-4" />
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="destructive" size="icon" disabled={!isAdmin}> {/* Abilitato solo per admin */}
                          <Trash2Icon className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Sei assolutamente sicuro?</AlertDialogTitle>
                          <AlertDialogDescription>
                            Questa azione non può essere annullata. Verrà eliminato permanentemente l'utente e tutti i dati associati.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Annulla</AlertDialogCancel>
                          <AlertDialogAction onClick={() => handleDelete(user.id)}>Elimina</AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Modifica Utente</DialogTitle>
          </DialogHeader>
          {editingUser && (
            <UserForm
              initialData={editingUser}
              onSuccess={handleFormSuccess}
              onCancel={handleFormCancel}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Users;