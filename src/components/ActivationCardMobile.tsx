import React from "react";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { PencilIcon, Trash2Icon } from "lucide-react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { useAuth } from "@/contexts/SessionContext"; // Importa useAuth

interface Activation {
  id: string;
  reseller_name: string;
  request_date: string;
  link_sent_date: string | null;
  activation_date: string | null;
  created_at: string;
  updated_at: string;
}

interface ActivationCardMobileProps {
  activation: Activation;
  onEdit: (activation: Activation) => void;
  onDelete: (id: string) => void;
}

const ActivationCardMobile: React.FC<ActivationCardMobileProps> = ({ activation, onEdit, onDelete }) => {
  const { canEdit } = useAuth(); // Usa useAuth

  return (
    <div className="border rounded-md p-4 mb-3 bg-white shadow-sm">
      <div className="flex justify-between items-start mb-2">
        <h3 className="font-semibold text-lg text-gray-800">{activation.reseller_name}</h3>
        {canEdit && ( // Mostra i pulsanti solo se l'utente può modificare
          <div className="flex space-x-2">
            <Button variant="outline" size="icon" onClick={() => onEdit(activation)}>
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
                    Questa azione non può essere annullata. Verrà eliminata permanentemente questa attivazione dal database.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Annulla</AlertDialogCancel>
                  <AlertDialogAction onClick={() => onDelete(activation.id)}>Elimina</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        )}
      </div>
      <div className="text-sm text-gray-600 space-y-1">
        <p><strong>Richiesta:</strong> {format(new Date(activation.request_date), "dd/MM/yyyy")}</p>
        <p><strong>Link Inviato:</strong> {activation.link_sent_date ? format(new Date(activation.link_sent_date), "dd/MM/yyyy") : "N/D"}</p>
        <p><strong>Attivazione:</strong> {activation.activation_date ? format(new Date(activation.activation_date), "dd/MM/yyyy") : "N/D"}</p>
      </div>
    </div>
  );
};

export default ActivationCardMobile;