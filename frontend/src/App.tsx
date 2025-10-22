import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import Logs from "./pages/Logs";
import Incidents from "./pages/Incidents";
import Services from "./pages/Services";
import Deployments from "./pages/Deployments";
import AIAnalyzer from "./pages/AIAnalyzer";
import Settings from "./pages/Settings";
import Monitoring from "./pages/Monitoring";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/logs" element={<Logs />} />
          <Route path="/incidents" element={<Incidents />} />
          <Route path="/services" element={<Services />} />
          <Route path="/deployments" element={<Deployments />} />
          <Route path="/ai-analyzer" element={<AIAnalyzer />} />
          <Route path="/monitoring" element={<Monitoring />} />
          <Route path="/settings" element={<Settings />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
