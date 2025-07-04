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
import { ActivationForm } from "@/components/ActivationForm";
import { format } from "date-fns";
import { PencilIcon, Trash2Icon, SearchIcon, DownloadIcon, ArrowUpDown, PlusCircle } from "lucide-react";
import { showSuccess, showError } from "@/utils/toast";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { useIsMobile } from "@/hooks/use-mobile";
import ActivationCardMobile from "@/components/ActivationCardMobile";
import ActivationSearchFilters from "@/components/ActivationSearchFilters";
import ExportButtons from "@/components/ExportButtons";
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

interface Activation {
  id: string;
  reseller_name: string;
  request_date: string;
  link_sent_date: string | null;
  activation_date: string | null;
  created_at: string;
  updated_at: string;
  agent_id: string | null; // Nuovo campo
  agents: { name: string } | null; // Per il join
}

type SortColumn = "reseller_name" | "request_date" | "link_sent_date" | "activation_date" | "created_at" | "updated_at" | "agents.name";
type SortDirection = "asc" | "desc";

const Activations = () => {
  const { canEdit, loading: authLoading } = useAuth();
  const [activations, setActivations] = useState<Activation[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isSearchDialogOpen, setIsSearchDialogOpen] = useState(false);
  const [isExportDialogOpen, setIsExportDialogOpen] = useState(false);
  const [editingActivation, setEditingActivation] = useState<Activation | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [startDate, setStartDate] = useState<Date | undefined>(undefined);
  const [endDate, setEndDate] = useState<Date | undefined>(undefined);
  const isMobile = useIsMobile();

  // Stati per la paginazione
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [totalCount, setTotalCount] = useState(0);

  // Stati per l'ordinamento
  const [sortColumn, setSortColumn] = useState<SortColumn>("request_date");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");

  const tableRef = useRef<HTMLDivElement>(null);

  const fetchActivations = async () => {
    setLoading(true);
    let query = supabase.from("activations").select("*, agents(name)", { count: "exact" }); // Seleziona anche il nome dell'agente

    if (searchTerm) {
      query = query.ilike("reseller_name", `%${searchTerm}%`);
    }
    if (startDate) {
      query = query.gte("request_date", format(startDate, "yyyy-MM-dd"));
    }
    if (endDate) {
      query = query.lte("request_date", format(endDate, "yyyy-MM-dd"));
    }

    // Applica ordinamento
    query = query.order(sortColumn, { ascending: sortDirection === "asc" });

    // Applica paginazione
    const from = (currentPage - 1) * itemsPerPage;
    const to = from + itemsPerPage - 1;
    query = query.range(from, to);

    const { data, error, count } = await query;

    if (error) {
      showError(`Errore nel caricamento delle attivazioni: ${error.message}`);
    } else {
      setActivations(data || []);
      setTotalCount(count || 0);
    }
    setLoading(false);
  };

  const handleSort = (column: SortColumn) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortColumn(column);
      setSortDirection("asc"); // Default to ascending when changing column
    }
    setCurrentPage(1); // Reset to first page on sort change
  };

  const handleDelete = async (id: string) => {
    if (!canEdit) {
      showError("Non hai i permessi per eliminare le attivazioni.");
      return;
    }
    const { error } = await supabase.from("activations").delete().eq("id", id);
    if (error) {
      showError(`Errore durante l'eliminazione: ${error.message}`);
    } else {
      showSuccess("Attivazione eliminata con successo!");
      fetchActivations();
    }
  };

  const handleEdit = (activation: Activation) => {
    if (!canEdit) {
      showError("Non hai i permessi per modificare le attivazioni.");
      return;
    }
    setEditingActivation(activation);
    setIsFormOpen(true);
  };

  const handleFormSuccess = () => {
    setIsFormOpen(false);
    setEditingActivation(null);
    fetchActivations();
  };

  const handleFormCancel = () => {
    setIsFormOpen(false);
    setEditingActivation(null);
  };

  const handleApplyFilters = () => {
    setCurrentPage(1); // Reset to first page on filter change
    fetchActivations(); // Trigger fetch with current filter states
    setIsSearchDialogOpen(false);
  };

  const handleResetFilters = () => {
    setSearchTerm("");
    setStartDate(undefined);
    setEndDate(undefined);
    setCurrentPage(1); // Reset to first page on filter reset
    fetchActivations(); // Trigger fetch with reset filter states
  };

  const handleItemsPerPageChange = (value: string) => {
    setItemsPerPage(Number(value));
    setCurrentPage(1); // Reset to first page when items per page changes
  };

  // Effect per il caricamento iniziale, paginazione e ordinamento
  // Questi triggerano fetchActivations immediatamente
  useEffect(() => {
    if (!authLoading) {
      fetchActivations();
    }
  }, [authLoading, currentPage, sortColumn, sortDirection, itemsPerPage]);

  const totalPages = Math.ceil(totalCount / itemsPerPage);

  if (loading || authLoading) {
    return <div className="text-center p-4 bg-background text-foreground">Caricamento attivazioni...</div>;
  }

  return (
    <div className="container mx-auto p-4 sm:p-6 lg:p-8">
      <Card className="w-full">
        <CardHeader className="flex flex-col items-start space-y-4 pb-4">
          <CardTitle className="text-2xl sm:text-3xl font-bold">Gestione Attivazioni 3cadlite</CardTitle>
          <div className="flex flex-col sm:flex-row justify-between items-center w-full gap-2">
            {canEdit && (
              <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
                <DialogTrigger asChild>
                  <Button onClick={() => setEditingActivation(null)} className="w-full sm:w-auto">
                    <PlusCircle className="mr-2 h-4 w-4" /> Aggiungi Attivazione
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[425px]">
                  <DialogHeader>
                    <DialogTitle>{editingActivation ? "Modifica Attivazione" : "Aggiungi Nuova Attivazione"}</DialogTitle>
                  </DialogHeader>
                  <ActivationForm
                    initialData={editingActivation ? {
                      ...editingActivation,
                      request_date: new Date(editingActivation.request_date),
                      link_sent_date: editingActivation.link_sent_date ? new Date(editingActivation.link_sent_date) : null,
                      activation_date: editingActivation.activation_date ? new Date(editingActivation.activation_date) : null,
                      agent_id: editingActivation.agent_id, // Passa l'ID dell'agente
                    } : undefined}
                    onSuccess={handleFormSuccess}
                    onCancel={handleFormCancel}
                  />
                </DialogContent>
              </Dialog>
            )}
            <div className="flex flex-wrap gap-2 justify-center sm:justify-end w-full sm:w-auto">
              {/* Dialog per i filtri di ricerca */}
              <Dialog open={isSearchDialogOpen} onOpenChange={setIsSearchDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="icon" className="shrink-0">
                    <SearchIcon className="h-4 w-4" />
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[425px]">
                  <DialogHeader>
                    <DialogTitle>Filtra Attivazioni</DialogTitle>
                  </DialogHeader>
                  <ActivationSearchFilters
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

              {/* Dialog per le opzioni di esportazione */}
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
                    <ExportButtons data={activations} tableRef={tableRef} isMobile={isMobile} />
                  </div>
                </DialogContent>
              </Dialog>

              {/* Selettore per elementi per pagina */}
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
          {activations.length === 0 && !loading ? (
            <p className="text-center text-muted-foreground py-8">Nessuna attivazione trovata con i filtri attuali.</p>
          ) : (
            <>
              {isMobile ? (
                <div className="space-y-3">
                  {activations.map((activation) => (
                    <ActivationCardMobile
                      key={activation.id}
                      activation={activation}
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
                        <TableHead className="w-[150px] px-2 sm:px-4 cursor-pointer" onClick={() => handleSort("reseller_name")}>
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
                        <TableHead className="px-2 sm:px-4 cursor-pointer" onClick={() => handleSort("request_date")}>
                          <div className="flex items-center">
                            Richiesta
                            {sortColumn === "request_date" && (
                              <ArrowUpDown className={`ml-2 h-4 w-4 ${sortDirection === "desc" ? "rotate-180" : ""}`} />
                            )}
                          </div>
                        </TableHead>
                        <TableHead className="px-2 sm:px-4 cursor-pointer" onClick={() => handleSort("link_sent_date")}>
                          <div className="flex items-center">
                            Link Inviato
                            {sortColumn === "link_sent_date" && (
                              <ArrowUpDown className={`ml-2 h-4 w-4 ${sortDirection === "desc" ? "rotate-180" : ""}`} />
                            )}
                          </div>
                        </TableHead>
                        <TableHead className="px-2 sm:px-4 cursor-pointer" onClick={() => handleSort("activation_date")}>
                          <div className="flex items-center">
                            Attivazione
                            {sortColumn === "activation_date" && (
                              <ArrowUpDown className={`ml-2 h-4 w-4 ${sortDirection === "desc" ? "rotate-180" : ""}`} />
                            )}
                          </div>
                        </TableHead>
                        {canEdit && <TableHead className="text-right px-2 sm:px-4">Azioni</TableHead>}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {activations.map((activation) => (
                        <TableRow key={activation.id}>
                          <TableCell className="font-medium px-2 sm:px-4">{activation.reseller_name}</TableCell>
                          <TableCell className="px-2 sm:px-4">{activation.agents?.name || "N/D"}</TableCell>
                          <TableCell className="px-2 sm:px-4">{format(new Date(activation.request_date), "dd/MM/yyyy")}</TableCell>
                          <TableCell className="px-2 sm:px-4">
                            {activation.link_sent_date
                              ? format(new Date(activation.link_sent_date), "dd/MM/yyyy")
                              : "N/D"}
                          </TableCell>
                          <TableCell className="px-2 sm:px-4">
                            {activation.activation_date
                              ? format(new Date(activation.activation_date), "dd/MM/yyyy")
                              : "N/D"}
                          </TableCell>
                          {canEdit && (
                            <TableCell className="text-right flex justify-end space-x-2 px-2 sm:px-4">
                              <Button variant="outline" size="icon" onClick={() => handleEdit(activation)}>
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
                                    <AlertDialogAction onClick={() => handleDelete(activation.id)}>Elimina</AlertDialogAction>
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

export default Activations;