import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./globals.css";
import { ThemeProvider } from "./components/ThemeProvider.tsx";
import { toast } from "sonner"; // Importa toast da sonner

// Registra il Service Worker
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/service-worker.js')
      .then(registration => {
        console.log('Service Worker registered with scope:', registration.scope);

        // Aggiungi un listener per gli aggiornamenti del Service Worker
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          if (newWorker) {
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                // Nuovo Service Worker installato e pronto per l'attivazione
                // Notifica l'utente che è disponibile un aggiornamento
                console.log('New Service Worker installed. Prompting user to refresh...');
                toast.info("È disponibile una nuova versione dell'app!", {
                  action: {
                    label: "Aggiorna",
                    onClick: () => window.location.reload(true), // Ricarica forzando la cache
                  },
                  duration: Infinity, // Mostra la notifica finché l'utente non agisce
                });
              }
            });
          }
        });
      })
      .catch(error => {
        console.error('Service Worker registration failed:', error);
      });
  });
}

createRoot(document.getElementById("root")!).render(
  <ThemeProvider defaultTheme="system" attribute="class" enableSystem themes={["light", "dark", "system", "orange", "violet", "green"]}>
    <App />
  </ThemeProvider>
);