import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ErrorBoundary } from "./components/ErrorBoundary";
import Index from "./pages/Index";
import ConfirmBooking from "./pages/ConfirmBooking";
import Admin from "./pages/Admin";
import Auth from "./pages/Auth";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

// Get basename from Vite's BASE_URL for React Router
// Vite sets import.meta.env.BASE_URL to the base path configured in vite.config.ts
// For GitHub Pages: "/" for custom domain, "/repo-name/" for project pages
// BrowserRouter basename: undefined for root, or path without trailing slash for subdirectories
const getBasename = () => {
  const baseUrl = import.meta.env.BASE_URL;
  // Handle empty, "./", or "/" as root - return undefined for root paths
  if (!baseUrl || baseUrl === "./" || baseUrl === "/") {
    return undefined;
  }
  // Remove trailing slash for non-root paths (React Router requirement)
  return baseUrl.endsWith("/") ? baseUrl.slice(0, -1) : baseUrl;
};

const App = () => (
  <ErrorBoundary>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter basename={getBasename()}>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/confirm" element={<ConfirmBooking />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/admin" element={<Admin />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  </ErrorBoundary>
);

export default App;
