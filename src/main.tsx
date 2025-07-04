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

        // Funzione per mostrare il prompt di aggiornamento
        const showUpdatePrompt = () => {
          toast.info("È disponibile una nuova versione dell'app!", {
            action: {
              label: "Aggiorna",
              onClick: () => window.location.reload(true), // Ricarica forzando la cache
            },
            duration: Infinity, // Mostra la notifica finché l'utente non agisce
          });
        };

        // Controlla se c'è un Service Worker in attesa immediatamente dopo la registrazione
        if (registration.waiting) {
          console.log('Service Worker: Un nuovo worker è già in attesa.');
          showUpdatePrompt();
        }

        // Ascolta gli aggiornamenti
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          if (newWorker) {
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && registration.waiting) {
                // Il nuovo worker è installato e in attesa di attivazione
                console.log('Service Worker: Nuovo worker installato e in attesa.');
                showUpdatePrompt();
              }
            });
          }
        });

        // Ascolta il cambio del controller (quando un nuovo SW prende il controllo)
        // Questo è utile se l'utente naviga via e torna, o se il vecchio SW viene sostituito
        navigator.serviceWorker.addEventListener('controllerchange', () => {
          console.log('Service Worker: Controller cambiato. Ricaricamento pagina per assicurare l\'ultima versione.');
          // Non forziamo il ricaricamento qui, ci affidiamo all'azione dell'utente dal toast
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