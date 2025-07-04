import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import Activations from "./pages/Activations";
import Login from "./pages/Login";
import Users from "./pages/Users";
import Profile from "./pages/Profile"; // Importa la nuova pagina Profile
import { SessionContextProvider, useAuth } from "./contexts/SessionContext";
import Layout from "./components/Layout";

const queryClient = new QueryClient();

// Componente per proteggere le rotte
const ProtectedRoute: React.FC<{ children: React.ReactNode; adminOnly?: boolean }> = ({ children, adminOnly = false }) => {
  const { session, loading, isAdmin } = useAuth();
  console.log("ProtectedRoute: loading =", loading, "session =", session, "isAdmin =", isAdmin, "adminOnly =", adminOnly);

  if (loading) {
    return <div className="text-center p-4">Caricamento...</div>;
  }

  if (!session) {
    console.log("ProtectedRoute: Nessuna sessione, reindirizzamento a /login");
    return <Navigate to="/login" replace />;
  }

  if (adminOnly && !isAdmin) {
    console.log("ProtectedRoute: Non è admin, reindirizzamento a /");
    return <Navigate to="/" replace />;
  }

  console.log("ProtectedRoute: Sessione trovata e permessi OK, rendering dei children.");
  return <Layout>{children}</Layout>; // Avvolgi i children con il Layout
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <SessionContextProvider>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/" element={<ProtectedRoute><Index /></ProtectedRoute>} />
            <Route path="/activations" element={<ProtectedRoute><Activations /></ProtectedRoute>} />
            <Route path="/users" element={<ProtectedRoute adminOnly={true}><Users /></ProtectedRoute>} />
            <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} /> {/* Nuova rotta per il profilo */}
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </SessionContextProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;