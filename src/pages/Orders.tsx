import React, { useState, useEffect, useRef } from "react";
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
import { OrderForm } from "@/components/OrderForm"; // Importa il nuovo OrderForm
import { format } from "date-fns";
import { PencilIcon, Trash2Icon, SearchIcon, DownloadIcon, ArrowUpDown, PlusCircle } from "lucide-react";
import { showSuccess, showError } from "@/utils/toast";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { useIsMobile } from "@/hooks/use-mobile";
import ExportButtons from "@/components/ExportButtons"; // Riutilizza ExportButtons
import { useAuth } from "@/contexts/SessionContext";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import OrderSearchFilters from "@/components/OrderSearchFilters"; // Creeremo questo componente
import OrderCardMobile from "@/components/OrderCardMobile"; // Importa OrderCardMobile

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
  agents: { name: string } | null; // Per il join
}

type SortColumn = "order_number" | "order_date" | "customer_name" | "reseller_name" | "agents.name" | "created_at" | "updated_at";
type SortDirection = "asc" | "desc";

const Orders = () => {
  const { canEdit, loading: authLoading } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isSearchDialogOpen, setIsSearchDialogOpen] = useState(false);
  const [isExportDialogOpen, setIsExportDialogOpen] = useState(false);
  const [editingOrder, setEditingOrder] = useState<Order | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [startDate, setStartDate] = useState<Date | undefined>(undefined);
  const [endDate, setEndDate] = useState<Date | undefined>(undefined);
  const isMobile = useIsMobile();

  // Stati per la paginazione
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [totalCount, setTotalCount] = useState(0);

  // Stati per l'ordinamento
  const [sortColumn, setSortColumn] = useState<SortColumn>("order_date");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");

  const tableRef = useRef<HTMLDivElement>(null);

  const fetchOrders = async () => {
    setLoading(true);
    let query = supabase.from("orders").select("*, agents(name)", { count: "exact" });

    if (searchTerm) {
      query = query.ilike("order_number", `%${searchTerm}%`);
    }
    if (startDate) {
      query = query.gte("order_date", format(startDate, "yyyy-MM-dd"));
    }
    if (endDate) {
      query = query.lte("order_date", format(endDate, "yyyy-MM-dd"));
    }

    query = query.order(sortColumn, { ascending: sortDirection === "asc" });

    const from = (currentPage - 1) * itemsPerPage;
    const to = from + itemsPerPage - 1;
    query = query.range(from, to);

    const { data, error, count } = await query;

    if (error) {
      showError(`Errore nel caricamento degli ordini: ${error.message}`);
    } else {
      setOrders(data || []);
      setTotalCount(count || 0);
    }
    setLoading(false);
  };

  const handleSort = (column: SortColumn) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortColumn(column);
      setSortDirection("asc");
    }
    setCurrentPage(1);
  };

  const handleDelete = async (id: string) => {
    if (!canEdit) {
      showError("Non hai i permessi per eliminare gli ordini.");
      return;
    }
    const { error } = await supabase.from("orders").delete().eq("id", id);
    if (error) {
      showError(`Errore durante l'eliminazione dell'ordine: ${error.message}`);
    } else {
      showSuccess("Ordine eliminato con successo!");
      fetchOrders();
    }
  };

  const handleEdit = (order: Order) => {
    if (!canEdit) {
      showError("Non hai i permessi per modificare gli ordini.");
      return;
    }
    setEditingOrder(order);
    setIsFormOpen(true);
  };

  const handleFormSuccess = () => {
    setIsFormOpen(false);
    setEditingOrder(null);
    fetchOrders();
  };

  const handleFormCancel = () => {
    setIsFormOpen(false);
    setEditingOrder(null);
  };

  const handleApplyFilters = () => {
    setCurrentPage(1);
    fetchOrders();
    setIsSearchDialogOpen(false);
  };

  const handleResetFilters = () => {
    setSearchTerm("");
    setStartDate(undefined);
    setEndDate(undefined);
    setCurrentPage(1);
    fetchOrders();
  };

  const handleItemsPerPageChange = (value: string) => {
    setItemsPerPage(Number(value));
    setCurrentPage(1);
  };

  useEffect(() => {
    if (!authLoading) {
      fetchOrders();
    }
  }, [authLoading, currentPage, sortColumn, sortDirection, itemsPerPage]);

  const totalPages = Math.ceil(totalCount / itemsPerPage);

  if (loading || authLoading) {
    return <div className="text-center p-4 bg-background text-foreground">Caricamento ordini...</div>;
  }

  return (
    <div className="container mx-auto p-4 sm:p-6 lg:p-8">
      <Card className="w-full">
        <CardHeader className="flex flex-col items-start space-y-4 pb-4">
          <CardTitle className="text-2xl sm:text-3xl font-bold">Gestione Ordini</CardTitle>
          <div className="flex flex-col sm:flex-row justify-between items-center w-full gap-2">
            {canEdit && (
              <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
                <DialogTrigger asChild>
                  <Button onClick={() => setEditingOrder(null)} className="w-full sm:w-auto">
                    <PlusCircle className="mr-2 h-4 w-4" /> Aggiungi Ordine
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[425px]">
                  <DialogHeader>
                    <DialogTitle>{editingOrder ? "Modifica Ordine" : "Aggiungi Nuovo Ordine"}</DialogTitle>
                  </DialogHeader>
                  <OrderForm
                    initialData={editingOrder ? {
                      ...editingOrder,
                      order_date: new Date(editingOrder.order_date),
                    } : undefined}
                    onSuccess={handleFormSuccess}
                    onCancel={handleFormCancel}
                  />
                </DialogContent>
              </Dialog>
            )}
            <div className="flex flex-wrap gap-2 justify-center sm:justify-end w-full sm:w-auto">
              <Dialog open={isSearchDialogOpen} onOpenChange={setIsSearchDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="icon" className="shrink-0">
                    <SearchIcon className="h-4 w-4" />
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[425px]">
                  <DialogHeader>
                    <DialogTitle>Filtra Ordini</DialogTitle>
                  </DialogHeader>
                  <OrderSearchFilters
                    searchTerm={searchTerm}
                    setSearchTerm={setSearchTerm}
                    startDate={startDate}
                    setStartDate={setStartDate}
                    endDate={endDate}
                    setEndDate={setEndDate}
                    onApplyFilters={handleApplyFilters}
                    onResetFilters={handleResetFilters}
                  />
                </DialogContent>
              </Dialog>

              <Dialog open={isExportDialogOpen} onOpenChange={setIsExportDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="icon" className="shrink-0">
                    <DownloadIcon className="h-4 w-4" />
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[425px]">
                  <DialogHeader>
                    <DialogTitle>Esporta Dati</DialogTitle>
                  </DialogHeader>
                  <div className="p-4 flex flex-col sm:flex-row gap-4 justify-center">
                    <ExportButtons data={orders} tableRef={tableRef} isMobile={isMobile} />
                  </div>
                </DialogContent>
              </Dialog>

              <div className="flex items-center space-x-2">
                <span className="text-sm text-muted-foreground">Mostra:</span>
                <Select onValueChange={handleItemsPerPageChange} defaultValue={itemsPerPage.toString()}>
                  <SelectTrigger className="w-[80px]">
                    <SelectValue placeholder="10" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="10">10</SelectItem>
                    <SelectItem value="25">25</SelectItem>
                    <SelectItem value="50">50</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {orders.length === 0 && !loading ? (
            <p className="text-center text-muted-foreground py-8">Nessun ordine trovato con i filtri attuali.</p>
          ) : (
            <>
              {isMobile ? (
                <div className="space-y-3">
                  {orders.map((order) => (
                    <OrderCardMobile
                      key={order.id}
                      order={order}
                      onEdit={handleEdit}
                      onDelete={handleDelete}
                    />
                  ))}
                </div>
              ) : (
                <div className="overflow-x-auto rounded-md border" ref={tableRef}>
                  <Table className="min-w-full">
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[150px] px-2 sm:px-4 cursor-pointer" onClick={() => handleSort("order_number")}>
                          <div className="flex items-center">
                            N. Ordine
                            {sortColumn === "order_number" && (
                              <ArrowUpDown className={`ml-2 h-4 w-4 ${sortDirection === "desc" ? "rotate-180" : ""}`} />
                            )}
                          </div>
                        </TableHead>
                        <TableHead className="px-2 sm:px-4 cursor-pointer" onClick={() => handleSort("order_date")}>
                          <div className="flex items-center">
                            Data Ordine
                            {sortColumn === "order_date" && (
                              <ArrowUpDown className={`ml-2 h-4 w-4 ${sortDirection === "desc" ? "rotate-180" : ""}`} />
                            )}
                          </div>
                        </TableHead>
                        <TableHead className="px-2 sm:px-4 cursor-pointer" onClick={() => handleSort("customer_name")}>
                          <div className="flex items-center">
                            Cliente
                            {sortColumn === "customer_name" && (
                              <ArrowUpDown className={`ml-2 h-4 w-4 ${sortDirection === "desc" ? "rotate-180" : ""}`} />
                            )}
                          </div>
                        </TableHead>
                        <TableHead className="px-2 sm:px-4 cursor-pointer" onClick={() => handleSort("reseller_name")}>
                          <div className="flex items-center">
                            Rivenditore
                            {sortColumn === "reseller_name" && (
                              <ArrowUpDown className={`ml-2 h-4 w-4 ${sortDirection === "desc" ? "rotate-180" : ""}`} />
                            )}
                          </div>
                        </TableHead>
                        <TableHead className="px-2 sm:px-4 cursor-pointer" onClick={() => handleSort("agents.name")}>
                          <div className="flex items-center">
                            Agente
                            {sortColumn === "agents.name" && (
                              <ArrowUpDown className={`ml-2 h-4 w-4 ${sortDirection === "desc" ? "rotate-180" : ""}`} />
                            )}
                          </div>
                        </TableHead>
                        {canEdit && <TableHead className="text-right px-2 sm:px-4">Azioni</TableHead>}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {orders.map((order) => (
                        <TableRow key={order.id}>
                          <TableCell className="font-medium px-2 sm:px-4">{order.order_number}</TableCell>
                          <TableCell className="px-2 sm:px-4">{format(new Date(order.order_date), "dd/MM/yyyy")}</TableCell>
                          <TableCell className="px-2 sm:px-4">{order.customer_name || "N/D"}</TableCell> {/* Gestisce il valore nullo */}
                          <TableCell className="px-2 sm:px-4">{order.reseller_name}</TableCell>
                          <TableCell className="px-2 sm:px-4">{order.agents?.name || "N/D"}</TableCell>
                          {canEdit && (
                            <TableCell className="text-right flex justify-end space-x-2 px-2 sm:px-4">
                              <Button variant="outline" size="icon" onClick={() => handleEdit(order)}>
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
                                    <AlertDialogAction onClick={() => handleDelete(order.id)}>Elimina</AlertDialogAction>
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
              {totalPages > 1 && (
                <Pagination className="mt-4">
                  <PaginationContent>
                    <PaginationItem>
                      <PaginationPrevious
                        href="#"
                        onClick={(e) => {
                          e.preventDefault();
                          setCurrentPage((prev) => Math.max(1, prev - 1));
                        }}
                        className={currentPage === 1 ? "pointer-events-none opacity-50" : ""}
                      />
                    </PaginationItem>
                    {[...Array(totalPages)].map((_, index) => (
                      <PaginationItem key={index}>
                        <PaginationLink
                          href="#"
                          isActive={currentPage === index + 1}
                          onClick={(e) => {
                            e.preventDefault();
                            setCurrentPage(index + 1);
                          }}
                        >
                          {index + 1}
                        </PaginationLink>
                      </PaginationItem>
                    ))}
                    <PaginationItem>
                      <PaginationNext
                        href="#"
                        onClick={(e) => {
                          e.preventDefault();
                          setCurrentPage((prev) => Math.min(totalPages, prev + 1));
                        }}
                        className={currentPage === totalPages ? "pointer-events-none opacity-50" : ""}
                      />
                    </PaginationItem>
                  </PaginationContent>
                </Pagination>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Orders;