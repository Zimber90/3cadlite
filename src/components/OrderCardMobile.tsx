import React from "react";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { PencilIcon, Trash2Icon } from "lucide-react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { useAuth } from "@/contexts/SessionContext";

interface Order {
  id: string;
  order_number: string;
  order_date: string;
  order_type: string | null;
  customer_name: string | null; // Reso nullable
  customer_number: string | null;
  reseller_name: string;
  reseller_code: string | null;
  project_name: string | null;
  designer: string | null;
  created_at: string;
  updated_at: string;
  agent_id: string | null;
  agents: { name: string } | null;
}

interface OrderCardMobileProps {
  order: Order;
  onEdit: (order: Order) => void;
  onDelete: (id: string) => void;
}

const OrderCardMobile: React.FC<OrderCardMobileProps> = ({ order, onEdit, onDelete }) => {
  const { canEdit } = useAuth();

  return (
    <div className="border rounded-md p-4 mb-3 bg-white shadow-sm">
      <div className="flex justify-between items-start mb-2">
        <h3 className="font-semibold text-lg text-gray-800">{order.order_number}</h3>
        {canEdit && (
          <div className="flex space-x-2">
            <Button variant="outline" size="icon" onClick={() => onEdit(order)}>
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
                    Questa azione non può essere annullata. Verrà eliminato permanentemente questo ordine dal database.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Annulla</AlertDialogCancel>
                  <AlertDialogAction onClick={() => onDelete(order.id)}>Elimina</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        )}
      </div>
      <div className="text-sm text-gray-600 space-y-1">
        <p><strong>Data Ordine:</strong> {format(new Date(order.order_date), "dd/MM/yyyy")}</p>
        <p><strong>Cliente:</strong> {order.customer_name || "N/D"}</p> {/* Gestisce il valore nullo */}
        <p><strong>Rivenditore:</strong> {order.reseller_name}</p>
        <p><strong>Agente:</strong> {order.agents?.name || "N/D"}</p>
      </div>
    </div>
  );
};

export default OrderCardMobile;