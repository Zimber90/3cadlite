import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { HomeIcon, UsersIcon, ListChecksIcon, LogOutIcon, MenuIcon, UserIcon, BriefcaseIcon, FileUpIcon, PackageIcon } from "lucide-react"; // Importa PackageIcon per gli ordini
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { ThemeToggle } from "@/components/ThemeToggle";
import { useAuth } from "@/contexts/SessionContext";
import { supabase } from "@/integrations/supabase/client";
import { showError, showSuccess } from "@/utils/toast";
import { useIsMobile } from "@/hooks/use-mobile";

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { isAdmin, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const isMobile = useIsMobile();

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      if (error.message === "Auth session missing!") {
        showSuccess('Disconnessione effettuata con successo!');
        navigate('/login');
      } else {
        showError(`Errore durante il logout: ${error.message}`);
      }
    } else {
      showSuccess('Disconnessione effettuata con successo!');
      navigate('/login');
    }
  };

  if (authLoading) {
    return <div className="min-h-screen flex items-center justify-center bg-background text-foreground">Caricamento...</div>;
  }

  const navLinks = (
    <>
      <Link to="/" className="w-full">
        <Button variant="ghost" className="w-full justify-start text-lg px-4 py-2">
          <HomeIcon className="mr-3 h-5 w-5" />
          Home
        </Button>
      </Link>
      <Link to="/activations" className="w-full">
        <Button variant="ghost" className="w-full justify-start text-lg px-4 py-2">
          <ListChecksIcon className="mr-3 h-5 w-5" />
          Attivazioni
        </Button>
      </Link>
      {isAdmin && (
        <>
          <Link to="/agents" className="w-full">
            <Button variant="ghost" className="w-full justify-start text-lg px-4 py-2">
              <BriefcaseIcon className="mr-3 h-5 w-5" />
              Agenti
            </Button>
          </Link>
          <Link to="/import-order" className="w-full">
            <Button variant="ghost" className="w-full justify-start text-lg px-4 py-2">
              <FileUpIcon className="mr-3 h-5 w-5" />
              Importa Ordine
            </Button>
          </Link>
          <Link to="/orders" className="w-full"> {/* Nuovo link per gli ordini */}
            <Button variant="ghost" className="w-full justify-start text-lg px-4 py-2">
              <PackageIcon className="mr-3 h-5 w-5" />
              Ordini
            </Button>
          </Link>
          <Link to="/users" className="w-full">
            <Button variant="ghost" className="w-full justify-start text-lg px-4 py-2">
              <UsersIcon className="mr-3 h-5 w-5" />
              Utenti
            </Button>
          </Link>
        </>
      )}
      <Link to="/profile" className="w-full">
        <Button variant="ghost" className="w-full justify-start text-lg px-4 py-2">
          <UserIcon className="mr-3 h-5 w-5" />
          Il Mio Profilo
        </Button>
      </Link>
    </>
  );

  return (
    <div className="flex min-h-screen bg-background text-foreground">
      {/* Sidebar per desktop */}
      {!isMobile && (
        <aside className="w-64 bg-sidebar text-sidebar-foreground border-r border-sidebar-border p-4 flex flex-col justify-between">
          <div>
            <h2 className="text-2xl font-bold mb-6 text-sidebar-primary-foreground">3cadliteDB</h2>
            <nav className="space-y-2">
              {navLinks}
            </nav>
          </div>
          <div className="space-y-2">
            <ThemeToggle />
            <Button variant="ghost" onClick={handleLogout} className="w-full justify-start text-lg px-4 py-2">
              <LogOutIcon className="mr-3 h-5 w-5" />
              Logout
            </Button>
          </div>
        </aside>
      )}

      {/* Contenuto principale */}
      <main className="flex-1 flex flex-col">
        {/* Header per mobile */}
        {isMobile && (
          <header className="flex items-center justify-between p-4 border-b bg-card">
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="outline" size="icon">
                  <MenuIcon className="h-6 w-6" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-64 bg-sidebar text-sidebar-foreground p-4 flex flex-col justify-between">
                <div>
                  <h2 className="text-2xl font-bold mb-6 text-sidebar-primary-foreground">3cadliteDB</h2>
                  <nav className="space-y-2">
                    {navLinks}
                  </nav>
                </div>
                <div className="space-y-2">
                  <ThemeToggle />
                  <Button variant="ghost" onClick={handleLogout} className="w-full justify-start text-lg px-4 py-2">
                    <LogOutIcon className="mr-3 h-5 w-5" />
                    Logout
                  </Button>
                </div>
              </SheetContent>
            </Sheet>
            <h1 className="text-xl font-bold">3cadliteDB</h1>
            <ThemeToggle />
          </header>
        )}
        <div className="flex-1 overflow-auto">
          {children}
        </div>
      </main>
    </div>
  );
};

export default Layout;