import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileUpIcon, Loader2 } from "lucide-react";
import { showSuccess, showError } from "@/utils/toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/SessionContext";

interface OrderData {
  order_number: string;
  order_date: string; // YYYY-MM-DD
  order_type: string;
  customer_name: string;
  customer_number: string | null;
  reseller_name: string;
  reseller_code: string | null;
  project_name: string | null;
  designer: string | null;
}

const ImportOrder = () => {
  const { isAdmin, loading: authLoading } = useAuth();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      setSelectedFile(event.target.files[0]);
    } else {
      setSelectedFile(null);
    }
  };

  const parseXml = (xmlString: string): OrderData | null => {
    try {
      console.log("Attempting to parse XML string (first 200 chars):", xmlString.substring(0, 200) + "...");
      const parser = new DOMParser();
      const xmlDoc = parser.parseFromString(xmlString, "text/xml");

      // Check for parsing errors
      const errorNode = xmlDoc.querySelector("parsererror");
      if (errorNode) {
        showError("Errore durante il parsing del file XML. Assicurati che sia un XML valido.");
        console.error("XML Parsing Error Node:", errorNode.textContent);
        return null;
      }

      // More robust check for successful XML parsing (e.g., if it was parsed as HTML)
      if (xmlDoc.documentElement.nodeName === "html" || xmlDoc.documentElement.nodeName === "HTML") {
        showError("Errore: Il file non è un XML valido o è stato interpretato come HTML.");
        console.error("XML Parsing resulted in HTML document:", xmlDoc.documentElement.outerHTML);
        return null;
      }

      console.log("Parsed XML document root element:", xmlDoc.documentElement.nodeName);
      console.log("Parsed XML document outerHTML (first 500 chars):", xmlDoc.documentElement.outerHTML.substring(0, 500) + "...");

      const orderElement = xmlDoc.querySelector("Order");
      if (!orderElement) {
        showError("Struttura XML non valida: Manca l'elemento <Order> radice.");
        console.error("Missing <Order> element.");
        return null;
      }
      console.log("Found <Order> element.");

      const header = orderElement.querySelector("Header"); // Search within Order element
      if (!header) {
        showError("Struttura XML non valida: Manca l'elemento <Header>.");
        console.error("Missing <Header> element within <Order>.");
        return null;
      }
      console.log("Found <Header> element.");

      const getElementText = (parent: Element | null, selector: string): string | null => {
        const element = parent?.querySelector(selector);
        return element?.textContent || null;
      };

      const orderNumber = getElementText(header, "OrderNumber");
      const orderDate = getElementText(header, "OrderDate");
      const orderType = getElementText(header, "OrderType");
      const customerName = getElementText(header.querySelector("Customer"), "CustomerName");
      const customerNumber = getElementText(header.querySelector("Customer"), "CustomerNumber");
      const resellerName = getElementText(header.querySelector("Reseller"), "ResellerName");
      const resellerCode = getElementText(header.querySelector("Reseller"), "ResellerCode");
      const projectName = getElementText(header.querySelector("ProjectInfo"), "ProjectName");
      const designer = getElementText(header.querySelector("ProjectInfo"), "Designer");

      if (!orderNumber || !orderDate || !orderType || !customerName || !resellerName) {
        showError("Mancano dati essenziali nel file XML (Numero Ordine, Data, Tipo, Cliente, Rivenditore).");
        console.error("Missing essential data:", { orderNumber, orderDate, orderType, customerName, resellerName });
        return null;
      }

      return {
        order_number: orderNumber,
        order_date: orderDate,
        order_type: orderType,
        customer_name: customerName,
        customer_number: customerNumber,
        reseller_name: resellerName,
        reseller_code: resellerCode,
        project_name: projectName,
        designer: designer,
      };
    } catch (error: any) {
      showError(`Errore generico durante il parsing XML: ${error.message}`);
      console.error("Generic XML parsing error:", error);
      return null;
    }
  };

  const handleUpload = async () => {
    if (!isAdmin) {
      showError("Non hai i permessi per importare gli ordini.");
      return;
    }
    if (!selectedFile) {
      showError("Seleziona un file XML da importare.");
      return;
    }

    setLoading(true);
    const reader = new FileReader();

    reader.onload = async (e) => {
      const xmlString = e.target?.result as string;
      const orderData = parseXml(xmlString);

      if (orderData) {
        try {
          const { error } = await supabase.from("orders").insert([orderData]);

          if (error) {
            if (error.code === '23505') { // Unique violation error code
              showError(`Errore: L'ordine con numero "${orderData.order_number}" esiste già.`);
            } else {
              showError(`Errore durante il salvataggio dell'ordine: ${error.message}`);
            }
          } else {
            showSuccess(`Ordine "${orderData.order_number}" importato con successo!`);
            setSelectedFile(null); // Clear selected file
          }
        } catch (dbError: any) {
          showError(`Errore di database: ${dbError.message}`);
        }
      }
      setLoading(false);
    };

    reader.onerror = () => {
      showError("Errore durante la lettura del file.");
      setLoading(false);
    };

    reader.readAsText(selectedFile);
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4 text-foreground">
        <Loader2 className="h-8 w-8 animate-spin mr-2" /> Caricamento...
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4 text-foreground">
        Non hai i permessi per accedere a questa pagina.
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 sm:p-6 lg:p-8">
      <Card className="w-full max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle className="text-2xl sm:text-3xl font-bold text-center">Importa Ordine da XML</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <p className="text-muted-foreground text-center">
            Carica un file XML esportato dal tuo programma 3cad per importare i dati dell'ordine.
          </p>
          <div className="flex flex-col items-center space-y-4">
            <Input
              id="xml-file-upload"
              type="file"
              accept=".xml"
              onChange={handleFileChange}
              className="max-w-sm"
            />
            {selectedFile && (
              <p className="text-sm text-muted-foreground">File selezionato: {selectedFile.name}</p>
            )}
            <Button
              onClick={handleUpload}
              disabled={!selectedFile || loading}
              className="w-full max-w-xs"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Caricamento...
                </>
              ) : (
                <>
                  <FileUpIcon className="mr-2 h-4 w-4" /> Importa Ordine
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ImportOrder;