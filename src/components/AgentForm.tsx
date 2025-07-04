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
import { supabase } from "@/integrations/supabase/client";
import { showSuccess, showError } from "@/utils/toast";
import { useAuth } from "@/contexts/SessionContext";

const formSchema = z.object({
  name: z.string().min(1, "Il nome dell'agente è richiesto."),
});

type AgentFormValues = z.infer<typeof formSchema>;

interface AgentFormProps {
  initialData?: { id: string; name: string };
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function AgentForm({ initialData, onSuccess, onCancel }: AgentFormProps) {
  const { isAdmin } = useAuth();
  const form = useForm<AgentFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: initialData || {
      name: "",
    },
  });

  const onSubmit = async (values: AgentFormValues) => {
    if (!isAdmin) {
      showError("Non hai i permessi per modificare gli agenti.");
      return;
    }

    let error = null;
    if (initialData) {
      // Update existing agent
      const { error: updateError } = await supabase
        .from("agents")
        .update({ name: values.name })
        .eq("id", initialData.id);
      error = updateError;
    } else {
      // Insert new agent
      const { error: insertError } = await supabase
        .from("agents")
        .insert({ name: values.name });
      error = insertError;
    }

    if (error) {
      showError(`Errore durante il salvataggio dell'agente: ${error.message}`);
    } else {
      showSuccess(initialData ? "Agente aggiornato con successo!" : "Agente aggiunto con successo!");
      form.reset();
      onSuccess?.();
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nome Agente</FormLabel>
              <FormControl>
                <Input placeholder="Nome dell'agente" {...field} disabled={!isAdmin} />
              </FormControl>
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
          {isAdmin && (
            <Button type="submit">
              {initialData ? "Aggiorna Agente" : "Aggiungi Agente"}
            </Button>
          )}
        </div>
      </form>
    </Form>
  );
}