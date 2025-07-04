import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";
import React, { useState, useEffect } from "react"; // Importa useState e useEffect

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
import { Switch } from "@/components/ui/switch"; // Importa Switch
import { Label } from "@/components/ui/label"; // Importa Label

const formSchema = z.object({
  reseller_name: z.string().min(1, "Il nome del rivenditore è richiesto."),
  request_date: z.date({ required_error: "La data della richiesta è richiesta." }),
  link_sent_date: z.date().nullable().optional(),
  activation_date: z.date().nullable().optional(),
});

type ActivationFormValues = z.infer<typeof formSchema>;

interface ActivationFormProps {
  initialData?: ActivationFormValues & { id: string };
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function ActivationForm({ initialData, onSuccess, onCancel }: ActivationFormProps) {
  const { canEdit } = useAuth();
  const form = useForm<ActivationFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: initialData || {
      reseller_name: "",
      request_date: new Date(),
      link_sent_date: null,
      activation_date: null,
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

  const onSubmit = async (values: ActivationFormValues) => {
    if (!canEdit) {
      showError("Non hai i permessi per modificare le attivazioni.");
      return;
    }
    const dataToSave = {
      ...values,
      request_date: format(values.request_date, "yyyy-MM-dd"),
      link_sent_date: values.link_sent_date ? format(values.link_sent_date, "yyyy-MM-dd") : null,
      // Se isNotYetActive è true, activation_date sarà null, altrimenti usa il valore del form
      activation_date: isNotYetActive ? null : (values.activation_date ? format(values.activation_date, "yyyy-MM-dd") : null),
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
          name="request_date"
          render={({ field }) => (
            <FormItem className="flex flex-col">
              <FormLabel>Data Richiesta</FormLabel>
              <Popover>
                <PopoverTrigger asChild>
                  <FormControl>
                    <Button
                      variant={"outline"}
                      className={cn(
                        "w-full pl-3 text-left font-normal",
                        !field.value && "text-muted-foreground"
                      )}
                      disabled={!canEdit}
                    >
                      {field.value ? (
                        format(field.value, "PPP")
                      ) : (
                        <span>Seleziona una data</span>
                      )}
                      <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                    </Button>
                  </FormControl>
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
              <Popover>
                <PopoverTrigger asChild>
                  <FormControl>
                    <Button
                      variant={"outline"}
                      className={cn(
                        "w-full pl-3 text-left font-normal",
                        !field.value && "text-muted-foreground"
                      )}
                      disabled={!canEdit}
                    >
                      {field.value ? (
                        format(field.value, "PPP")
                      ) : (
                        <span>Seleziona una data</span>
                      )}
                      <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                    </Button>
                  </FormControl>
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
                      form.setValue('activation_date', null); // Imposta a null se "Non ancora attivo"
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
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant={"outline"}
                        className={cn(
                          "w-full pl-3 text-left font-normal",
                          !field.value && "text-muted-foreground"
                        )}
                        disabled={!canEdit}
                      >
                        {field.value ? (
                          format(field.value, "PPP")
                        ) : (
                          <span>Seleziona una data</span>
                        )}
                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                      </Button>
                    </FormControl>
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