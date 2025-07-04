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
  customer_name: string | null; // Reso nullable
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
    console.log("--- Starting XML Parsing ---");
    // Trim the XML string to remove any leading/trailing whitespace or invisible characters
    const trimmedXmlString = xmlString.trim();
    console.log("Trimmed XML string (first 500 chars):", trimmedXmlString.substring(0, 500) + "...");

    try {
      const parser = new DOMParser();
      const xmlDoc = parser.parseFromString(trimmedXmlString, "text/xml");

      // Check for parsing errors
      const errorNode = xmlDoc.querySelector("parsererror");
      if (errorNode) {
        showError("Errore durante il parsing del file XML. Assicurati che sia un XML valido.");
        console.error("XML Parsing Error Node:", errorNode.textContent);
        console.log("Full parsed document (if available):", xmlDoc.documentElement?.outerHTML);
        return null;
      }

      // Get the root element directly
      const rootElement = xmlDoc.documentElement;
      console.log("Parsed XML document root element nodeName:", rootElement?.nodeName);
      console.log("Parsed XML document root element outerHTML (first 500 chars):", rootElement?.outerHTML.substring(0, 500) + "...");

      // Check if the root element is indeed <ORDINE>
      if (!rootElement || rootElement.nodeName !== "ORDINE") {
        showError("Struttura XML non valida: L'elemento radice non è <ORDINE>.");
        console.error("Unexpected root element. Expected 'ORDINE', got:", rootElement ? rootElement.nodeName : "null");
        console.log("Root element outerHTML:", rootElement?.outerHTML);
        return null;
      }

      console.log("Found root element:", rootElement.nodeName);
      console.log("Root element outerHTML (first 500 chars):", rootElement.outerHTML.substring(0, 500) + "...");

      const orderElement = rootElement; // ORDINE is the root element

      const header = orderElement.querySelector("TESTA"); // Search for TESTA within ORDINE
      if (!header) {
        showError("Struttura XML non valida: Manca l'elemento <TESTA>.");
        console.error("Missing <TESTA> element within <ORDINE>.");
        return null;
      }
      console.log("Found <TESTA> element.");

      const getElementText = (parent: Element | null, selector: string): string | null => {
        const element = parent?.querySelector(selector);
        console.log(`Searching for ${selector} under ${parent?.nodeName || 'null'}. Found: ${element?.textContent || 'N/D'}`);
        return element?.textContent || null;
      };

      // *** CORREZIONE DELLA MAPPATURA ***
      // Il campo "Rivenditore" nell'app deve prendere il valore da <RIF>
      const resellerNameFromXml = getElementText(header, "RIF"); 
      // Il campo "Cliente" nell'app deve prendere il valore da <CLI_1>
      const customerNameFromXml = getElementText(header.querySelector("VAR"), "CLI_1"); 

      const orderNumber = getElementText(header, "NUMERO");
      const orderDate = getElementText(header, "DATA");
      const orderType = getElementText(header, "TIPO"); // Assuming TIPO is OrderType
      const customerNumber = getElementText(header, "CLIENTE"); // CLIENTE is direct child of TESTA

      // Not found in the provided snippet, setting to null for now
      const resellerCode = null;
      const projectName = null;
      const designer = null;

      // Date format in XML is "DD/MM/YYYY", but DB expects "YYYY-MM-DD"
      let formattedOrderDate = null;
      if (orderDate) {
        const parts = orderDate.split('/');
        if (parts.length === 3) {
          formattedOrderDate = `${parts[2]}-${parts[1]}-${parts[0]}`;
        } else {
          console.warn("OrderDate format unexpected:", orderDate);
        }
      }

      // resellerName è richiesto, customerName può essere null
      if (!orderNumber || !formattedOrderDate || !orderType || !resellerNameFromXml) {
        showError("Mancano dati essenziali nel file XML (Numero Ordine, Data, Tipo, Rivenditore).");
        console.error("Missing essential data:", { orderNumber, formattedOrderDate, orderType, customerNameFromXml, resellerNameFromXml });
        return null;
      }

      console.log("Successfully parsed order data:", {
        order_number: orderNumber,
        order_date: formattedOrderDate,
        order_type: orderType,
        customer_name: customerNameFromXml, // Assegna il valore da CLI_1 al campo customer_name
        customer_number: customerNumber,
        reseller_name: resellerNameFromXml, // Assegna il valore da RIF al campo reseller_name
        reseller_code: resellerCode,
        project_name: projectName,
        designer: designer,
      });

      return {
        order_number: orderNumber,
        order_date: formattedOrderDate,
        order_type: orderType,
        customer_name: customerNameFromXml,
        customer_number: customerNumber,
        reseller_name: resellerNameFromXml,
        reseller_code: resellerCode,
        project_name: projectName,
        designer: designer,
      };
    } catch (error: any) {
      showError(`Errore generico durante il parsing XML: ${error.message}`);
      console.error("Generic XML parsing error:", error);
      return null;
    } finally {
      console.log("--- Finished XML Parsing ---");
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