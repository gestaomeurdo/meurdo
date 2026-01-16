import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import { SessionContextProvider } from "./integrations/supabase/auth-provider";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Obras from "./pages/Obras";
import Financeiro from "./pages/Financeiro";
import Atividades from "./pages/Atividades";
import Materiais from "./pages/Materiais";
import MaoDeObra from "./pages/MaoDeObra";
import Documentacao from "./pages/Documentacao";
import Settings from "./pages/Settings";
import Relatorios from "./pages/Relatorios";
import GestaoRdo from "./pages/GestaoRdo";
import { ThemeProvider } from "./components/layout/ThemeProvider";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <SessionContextProvider>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/login" element={<Login />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/obras" element={<Obras />} />
              <Route path="/financeiro" element={<Financeiro />} />
              <Route path="/relatorios" element={<Relatorios />} />
              <Route path="/atividades" element={<Atividades />} />
              <Route path="/gestao-rdo" element={<GestaoRdo />} />
              <Route path="/materiais" element={<Materiais />} />
              <Route path="/mao-de-obra" element={<MaoDeObra />} />
              <Route path="/documentacao" element={<Documentacao />} />
              <Route path="/settings" element={<Settings />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </SessionContextProvider>
        </BrowserRouter>
      </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;