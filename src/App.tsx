import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import ErrorBoundary from "@/components/ErrorBoundary";
import Index from "./pages/Index";  
import NotFound from "./pages/NotFound";
import { Portal } from "./pages/Portal";
import { PlanSetup } from "./pages/PlanSetup";
import { ArchitecturePage } from "./pages/Architecture";
import { OnlinePresenceProvider } from "@/components/OnlinePresenceProvider";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: (failureCount, error) => {
        // Log query failures for debugging
        console.error('Query failed:', error);
        return failureCount < 3;
      },
      staleTime: 5 * 60 * 1000, // 5 minutes
    },
    mutations: {
      retry: (failureCount, error) => {
        console.error('Mutation failed:', error);
        return failureCount < 2;
      },
    },
  },
});

const App = () => (
  <ErrorBoundary>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <OnlinePresenceProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/setup/:plan" element={<PlanSetup />} />
              <Route path="/portal" element={<Portal />} />
              <Route path="/architecture" element={<ArchitecturePage />} />
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </OnlinePresenceProvider>
      </TooltipProvider>
    </QueryClientProvider>
  </ErrorBoundary>
);

export default App;
