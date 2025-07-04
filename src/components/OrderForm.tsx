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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { showSuccess, showError } from "@/utils/toast";
import { useAuth } from "@/contexts/SessionContext";

const formSchema = z.object({
  order_number: z.string().min(1, "Il numero d'ordine è richiesto."),
  order_date: z.date({ required_error: "La data dell'ordine è richiesta." }),
  customer_name: z.string().nullable().optional(),
  customer_number: z.string().nullable().optional(),
  reseller_name: z.string().min(1, "Il nome del rivenditore è richiesto."),
  agent_id: z.string().nullable().optional(),
});

type OrderFormValues = z.infer<typeof formSchema>;

interface OrderFormProps {
  initialData?: OrderFormValues & { id: string };
  onSuccess?: () => void;
  onCancel?: () => void;
}

interface Agent {
  id: string;
  name: string;
}

export function OrderForm({ initialData, onSuccess, onCancel }: OrderFormProps) {
  const { canEdit } = useAuth();
  const [agents, setAgents] = useState<Agent[]>([]);

  const form = useForm<OrderFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: initialData || {
      order_number: "",
      order_date: new Date(),
      customer_name: null,
      customer_number: null,
      reseller_name: "",
      agent_id: null,
    },
  });

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

  const onSubmit = async (values: OrderFormValues) => {
    if (!canEdit) {
      showError("Non hai i permessi per modificare gli ordini.");
      return;
    }

    const dataToSave = {
      ...values,
      order_date: format(values.order_date, "yyyy-MM-dd"),
      agent_id: values.agent_id === "none" ? null : values.agent_id,
    };

    let error = null;
    if (initialData) {
      // Ensure order_number is not updated if it's part of the update payload
      const { order_number, ...updatePayload } = dataToSave;
      const { error: updateError } = await supabase
        .from("orders")
        .update(updatePayload) // Only update allowed fields
        .eq("id", initialData.id);
      error = updateError;
    } else {
      const { error: insertError } = await supabase
        .from("orders")
        .insert(dataToSave);
      error = insertError;
    }

    if (error) {
      showError(`Errore durante il salvataggio dell'ordine: ${error.message}`);
    } else {
      showSuccess(initialData ? "Ordine aggiornato con successo!" : "Ordine aggiunto con successo!");
      form.reset();
      onSuccess?.();
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="order_number"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Numero Ordine</FormLabel>
              <FormControl>
                <Input placeholder="Numero dell'ordine" {...field} disabled={true} /> {/* Reso non modificabile */}
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="order_date"
          render={({ field }) => (
            <FormItem className="flex flex-col">
              <FormLabel>Data Ordine</FormLabel>
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
        {/* Campo Tipo Ordine rimosso */}
        <FormField
          control={form.control}
          name="customer_name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nome Cliente</FormLabel>
              <FormControl>
                <Input placeholder="Nome del cliente" {...field} value={field.value || ""} disabled={!canEdit} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="customer_number"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Numero Cliente</FormLabel>
              <FormControl>
                <Input placeholder="Numero del cliente" {...field} value={field.value || ""} disabled={!canEdit} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
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
        {/* Campo Codice Rivenditore rimosso */}
        {/* Campo Nome Progetto rimosso */}
        {/* Campo Designer rimosso */}
        <FormField
          control={form.control}
          name="agent_id"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Agente Assegnato</FormLabel>
              <Select
                onValueChange={(value) => field.onChange(value === "none" ? null : value)}
                defaultValue={field.value || "none"}
                disabled={!canEdit}
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
          {canEdit && (
            <Button type="submit">
              {initialData ? "Aggiorna Ordine" : "Aggiungi Ordine"}
            </Button>
          )}
        </div>
      </form>
    </Form>
  );
}