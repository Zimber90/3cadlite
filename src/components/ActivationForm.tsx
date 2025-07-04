import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";
import React, { useState, useEffect } from "react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { supabase } from "@/integrations/supabase/client";
import { showSuccess, showError } from "@/utils/toast";
import { useAuth } from "@/contexts/SessionContext";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"; // Importa Select

const formSchema = z.object({
  reseller_name: z.string().min(1, "Il nome del rivenditore è richiesto."),
  request_date: z.date({ required_error: "La data della richiesta è richiesta." }),
  link_sent_date: z.date().nullable().optional(),
  activation_date: z.date().nullable().optional(),
  agent_id: z.string().nullable().optional(), // Nuovo campo per l'ID dell'agente
});

type ActivationFormValues = z.infer<typeof formSchema>;

interface ActivationFormProps {
  initialData?: ActivationFormValues & { id: string };
  onSuccess?: () => void;
  onCancel?: () => void;
}

interface Agent {
  id: string;
  name: string;
}

export function ActivationForm({ initialData, onSuccess, onCancel }: ActivationFormProps) {
  const { canEdit } = useAuth();
  const [agents, setAgents] = useState<Agent[]>([]); // Stato per gli agenti
  const form = useForm<ActivationFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: initialData || {
      reseller_name: "",
      request_date: new Date(),
      link_sent_date: null,
      activation_date: null,
      agent_id: null, // Default a null
    },
  });

  // Stato per gestire l'opzione "Non ancora attivo"
  const [isNotYetActive, setIsNotYetActive] = useState(initialData?.activation_date === null);

  // Aggiorna il valore di activation_date nel form quando isNotYetActive cambia
  useEffect(() => {
    if (isNotYetActive) {
      form.setValue('activation_date', null);
    }
  }, [isNotYetActive, form]);

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

  const onSubmit = async (values: ActivationFormValues) => {
    if (!canEdit) {
      showError("Non hai i permessi per modificare le attivazioni.");
      return;
    }
    const dataToSave = {
      ...values,
      request_date: format(values.request_date, "yyyy-MM-dd"),
      link_sent_date: values.link_sent_date ? format(values.link_sent_date, "yyyy-MM-dd") : null,
      activation_date: isNotYetActive ? null : (values.activation_date ? format(values.activation_date, "yyyy-MM-dd") : null),
      agent_id: values.agent_id === "none" ? null : values.agent_id, // Converti "none" in null
    };

    let error = null;
    if (initialData) {
      // Update existing activation
      const { error: updateError } = await supabase
        .from("activations")
        .update(dataToSave)
        .eq("id", initialData.id);
      error = updateError;
    } else {
      // Insert new activation
      const { error: insertError } = await supabase
        .from("activations")
        .insert(dataToSave);
      error = insertError;
    }

    if (error) {
      showError(`Errore durante il salvataggio: ${error.message}`);
    } else {
      showSuccess(initialData ? "Attivazione aggiornata con successo!" : "Attivazione aggiunta con successo!");
      form.reset();
      setIsNotYetActive(true); // Reset dello switch dopo il successo
      onSuccess?.();
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="reseller_name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nome Rivenditore</FormLabel>
              <FormControl>
                <Input placeholder="Nome del rivenditore" {...field} disabled={!canEdit} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="agent_id"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Agente Assegnato</FormLabel>
              <Select
                onValueChange={(value) => field.onChange(value === "none" ? null : value)} // Converti "none" in null
                defaultValue={field.value || "none"} // Imposta "none" come default se il valore è null
                disabled={!canEdit}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleziona un agente" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="none">Nessun Agente</SelectItem> {/* Valore "none" */}
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
        <FormField
          control={form.control}
          name="request_date"
          render={({ field }) => (
            <FormItem className="flex flex-col">
              <FormLabel>Data Richiesta</FormLabel>
              <FormControl>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant={"outline"}
                      className={cn(
                        "w-full pl-3 text-left font-normal",
                        !field.value && "text-muted-foreground"
                      )}
                      disabled={!canEdit}
                    >
                      {/* Ensure this is always a single root element */}
                      <span className="flex items-center justify-between w-full">
                        <span className="flex-1">
                          {field.value && !isNaN(field.value.getTime()) ? (
                            format(field.value, "PPP")
                          ) : (
                            "Seleziona una data" // Changed to string literal
                          )}
                        </span>
                        <CalendarIcon className="h-4 w-4 opacity-50" />
                      </span>
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={field.value || undefined}
                      onSelect={canEdit ? field.onChange : undefined}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="link_sent_date"
          render={({ field }) => (
            <FormItem className="flex flex-col">
              <FormLabel>Data Invio Link</FormLabel>
              <FormControl>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant={"outline"}
                      className={cn(
                        "w-full pl-3 text-left font-normal",
                        !field.value && "text-muted-foreground"
                      )}
                      disabled={!canEdit}
                    >
                      {/* Ensure this is always a single root element */}
                      <span className="flex items-center justify-between w-full">
                        <span className="flex-1">
                          {field.value && !isNaN(field.value.getTime()) ? (
                            format(field.value, "PPP")
                          ) : (
                            "Seleziona una data" // Changed to string literal
                          )}
                        </span>
                        <CalendarIcon className="h-4 w-4 opacity-50" />
                      </span>
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={field.value || undefined}
                      onSelect={canEdit ? field.onChange : undefined}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="activation_date"
          render={({ field }) => (
            <FormItem className="flex flex-col">
              <FormLabel>Data Attivazione</FormLabel>
              <div className="flex items-center space-x-2 mb-2">
                <Switch
                  id="not-yet-active-switch"
                  checked={isNotYetActive}
                  onCheckedChange={(checked) => {
                    setIsNotYetActive(checked);
                    if (checked) {
                      form.setValue('activation_date', null);
                    }
                  }}
                  disabled={!canEdit}
                />
                <Label htmlFor="not-yet-active-switch">Non ancora attivo</Label>
              </div>
              {isNotYetActive ? (
                <div className="p-2 border rounded-md bg-gray-50 text-gray-500 text-center">
                  NON ANCORA ATTIVO
                </div>
              ) : (
                <FormControl>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant={"outline"}
                        className={cn(
                          "w-full pl-3 text-left font-normal",
                          !field.value && "text-muted-foreground"
                        )}
                        disabled={!canEdit}
                      >
                        {/* Ensure this is always a single root element */}
                        <span className="flex items-center justify-between w-full">
                          <span className="flex-1">
                            {field.value && !isNaN(field.value.getTime()) ? (
                              format(field.value, "PPP")
                            ) : (
                              "Seleziona una data" // Changed to string literal
                            )}
                          </span>
                          <CalendarIcon className="h-4 w-4 opacity-50" />
                        </span>
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={field.value || undefined}
                        onSelect={canEdit ? field.onChange : undefined}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </FormControl>
              )}
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
          {canEdit && (
            <Button type="submit">
              {initialData ? "Aggiorna Attivazione" : "Aggiungi Attivazione"}
            </Button>
          )}
        </div>
      </form>
    </Form>
  );
}