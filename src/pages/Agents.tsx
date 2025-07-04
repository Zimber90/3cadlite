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
import { AgentForm } from "@/components/AgentForm";
import { PencilIcon, Trash2Icon, PlusCircle } from "lucide-react";
import { showSuccess, showError } from "@/utils/toast";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { useAuth } from "@/contexts/SessionContext";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface Agent {
  id: string;
  name: string;
}

const Agents = () => {
  const { isAdmin, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingAgent, setEditingAgent] = useState<Agent | null>(null);

  const fetchAgents = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("agents")
      .select("id, name")
      .order("name", { ascending: true });

    if (error) {
      showError(`Errore nel caricamento degli agenti: ${error.message}`);
    } else {
      setAgents(data || []);
    }
    setLoading(false);
  };

  const handleEdit = (agent: Agent) => {
    setEditingAgent(agent);
    setIsFormOpen(true);
  };

  const handleFormSuccess = () => {
    setIsFormOpen(false);
    setEditingAgent(null);
    fetchAgents();
  };

  const handleFormCancel = () => {
    setIsFormOpen(false);
    setEditingAgent(null);
  };

  const handleDelete = async (id: string) => {
    if (!isAdmin) {
      showError("Non hai i permessi per eliminare gli agenti.");
      return;
    }
    const { error } = await supabase.from("agents").delete().eq("id", id);
    if (error) {
      showError(`Errore durante l'eliminazione dell'agente: ${error.message}`);
    } else {
      showSuccess("Agente eliminato con successo!");
      fetchAgents();
    }
  };

  useEffect(() => {
    if (!authLoading) {
      if (!isAdmin) {
        showError("Non hai i permessi per accedere a questa pagina.");
        navigate("/");
      } else {
        fetchAgents();
      }
    }
  }, [isAdmin, authLoading, navigate]);

  if (loading || authLoading) {
    return <div className="text-center p-4 bg-background text-foreground">Caricamento agenti...</div>;
  }

  if (!isAdmin) {
    return null;
  }

  return (
    <div className="container mx-auto p-4 sm:p-6 lg:p-8">
      <Card className="w-full">
        <CardHeader className="flex flex-col items-start space-y-4 pb-4">
          <CardTitle className="text-2xl sm:text-3xl font-bold">Gestione Agenti</CardTitle>
          {isAdmin && (
            <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
              <DialogTrigger asChild>
                <Button onClick={() => setEditingAgent(null)} className="w-full sm:w-auto">
                  <PlusCircle className="mr-2 h-4 w-4" /> Aggiungi Agente
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                  <DialogTitle>{editingAgent ? "Modifica Agente" : "Aggiungi Nuovo Agente"}</DialogTitle>
                </DialogHeader>
                <AgentForm
                  initialData={editingAgent || undefined}
                  onSuccess={handleFormSuccess}
                  onCancel={handleFormCancel}
                />
              </DialogContent>
            </Dialog>
          )}
        </CardHeader>
        <CardContent>
          {agents.length === 0 && !loading ? (
            <p className="text-center text-muted-foreground py-8">Nessun agente trovato.</p>
          ) : (
            <div className="overflow-x-auto rounded-md border">
              <Table className="min-w-full">
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[200px] px-2 sm:px-4">Nome Agente</TableHead>
                    {isAdmin && <TableHead className="text-right px-2 sm:px-4">Azioni</TableHead>}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {agents.map((agent) => (
                    <TableRow key={agent.id}>
                      <TableCell className="font-medium px-2 sm:px-4">{agent.name}</TableCell>
                      {isAdmin && (
                        <TableCell className="text-right flex justify-end space-x-2 px-2 sm:px-4">
                          <Button variant="outline" size="icon" onClick={() => handleEdit(agent)}>
                            <PencilIcon className="h-4 w-4" />
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="destructive" size="icon">
                                <Trash2Icon className="h-4 w-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Sei assolutamente sicuro?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Questa azione non può essere annullata. Verrà eliminato permanentemente l'agente e le attivazioni associate non avranno più un agente assegnato.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Annulla</AlertDialogCancel>
                                <AlertDialogAction onClick={() => handleDelete(agent.id)}>Elimina</AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </TableCell>
                      )}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Agents;