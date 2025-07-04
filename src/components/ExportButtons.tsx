import React from "react";
import { Button } from "@/components/ui/button";
import { FileSpreadsheetIcon } from "lucide-react";
import * as XLSX from "xlsx";
import { showSuccess, showError } from "@/utils/toast";
import { format } from "date-fns";

interface ExportButtonsProps {
  data: any[];
  tableRef: React.RefObject<HTMLDivElement>; // Ref to the div containing the table
  isMobile: boolean; // Nuova prop per indicare se è mobile
}

const ExportButtons: React.FC<ExportButtonsProps> = ({ data, tableRef, isMobile }) => {
  const exportToExcel = () => {
    if (data.length === 0) {
      showError("Nessun dato da esportare in Excel.");
      return;
    }
    try {
      const ws = XLSX.utils.json_to_sheet(data);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Attivazioni");
      XLSX.writeFile(wb, "attivazioni.xlsx");
      showSuccess("Dati esportati in Excel con successo!");
    } catch (error: any) {
      showError(`Errore durante l'esportazione in Excel: ${error.message}`);
    }
  };

  return (
    <div className="flex space-x-2">
      <Button variant="outline" onClick={exportToExcel}>
        <FileSpreadsheetIcon className="mr-2 h-4 w-4" />
        Esporta Excel
      </Button>
    </div>
  );
};

export default ExportButtons;