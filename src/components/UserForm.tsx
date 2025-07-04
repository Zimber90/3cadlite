import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { showSuccess, showError } from "@/utils/toast";
import { useAuth } from "@/contexts/SessionContext"; // Importa useAuth
import React, { useState, useEffect } from "react"; // Importa useState e useEffect

const formSchema = z.object({
  id: z.string(), // User ID from auth.users
  first_name: z.string().nullable().optional(),
  last_name: z.string().nullable().optional(),
  role: z.enum(["admin", "viewer"]),
  agent_id: z.string().nullable().optional(), // Nuovo campo per l'ID dell'agente
});

type UserFormValues = z.infer<typeof formSchema>;

interface UserFormProps {
  initialData: UserFormValues;
  onSuccess?: () => void;
  onCancel?: () => void;
}

interface Agent {
  id: string;
  name: string;
}

export function UserForm({ initialData, onSuccess, onCancel }: UserFormProps) {
  const { isAdmin, user: currentUser } = useAuth(); // Ottieni lo stato isAdmin e l'utente corrente
  const [agents, setAgents] = useState<Agent[]>([]); // Stato per gli agenti

  const form = useForm<UserFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: initialData,
  });

  // Carica gli agenti disponibili all'avvio del componente
  useEffect(() => {
    const fetchAgents = async () => {
      const { data, error } = await supabase
        .from("agents")
        .select("id, name")
        .order("name", { ascending: true });

      if (error) {
        showError(`Errore nel caricamento degli agenti: ${error.message}`);
      } else {
        setAgents(data || []);
      }
    };
    fetchAgents();
  }, []);

  const onSubmit = async (values: UserFormValues) => {
    const { id, ...updateData } = values;

    // Determina se l'utente corrente sta modificando il proprio profilo
    const isEditingOwnProfile = currentUser?.id === id;

    // Se non è admin e non sta modificando il proprio profilo, non permettere modifiche
    if (!isAdmin && !isEditingOwnProfile) {
      showError("Non hai i permessi per modificare questo profilo utente.");
      return;
    }

    // Se non è admin e sta modificando il proprio profilo, non permettere di cambiare ruolo o agente
    if (!isAdmin && isEditingOwnProfile) {
      if (updateData.role !== initialData.role || updateData.agent_id !== initialData.agent_id) {
        showError("Non hai i permessi per modificare il tuo ruolo o l'agente assegnato.");
        return;
      }
    }

    const dataToSave = {
      ...updateData,
      agent_id: updateData.agent_id === "none" ? null : updateData.agent_id, // Converti "none" in null
    };

    const { error } = await supabase
      .from("profiles")
      .update(dataToSave)
      .eq("id", id);

    if (error) {
      showError(`Errore durante l'aggiornamento del profilo: ${error.message}`);
    } else {
      showSuccess("Profilo utente aggiornato con successo!");
      onSuccess?.();
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="first_name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nome</FormLabel>
              <FormControl>
                <Input placeholder="Nome" {...field} value={field.value || ""} disabled={!isAdmin && currentUser?.id !== initialData.id} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="last_name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Cognome</FormLabel>
              <FormControl>
                <Input placeholder="Cognome" {...field} value={field.value || ""} disabled={!isAdmin && currentUser?.id !== initialData.id} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="role"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Ruolo</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value} disabled={!isAdmin}> {/* Disabilita se non è admin */}
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleziona un ruolo" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="viewer">Viewer</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="agent_id"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Agente Assegnato (a questo utente)</FormLabel>
              <Select
                onValueChange={(value) => field.onChange(value === "none" ? null : value)}
                defaultValue={field.value || "none"}
                disabled={!isAdmin} // Solo gli admin possono assegnare agenti ai profili
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleziona un agente" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="none">Nessun Agente</SelectItem>
                  {agents.map((agent) => (
                    <SelectItem key={agent.id} value={agent.id}>
                      {agent.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="flex justify-end space-x-2">
          {onCancel && (
            <Button type="button" variant="outline" onClick={onCancel}>
              Annulla
            </Button>
          )}
          <Button type="submit" disabled={!isAdmin && currentUser?.id !== initialData.id}>Aggiorna Profilo</Button>
        </div>
      </form>
    </Form>
  );
}