
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ThemeProvider } from "next-themes";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import Privacy from "./pages/Privacy";
import CookiePolicy from "./pages/CookiePolicy";
import Auth from "./pages/Auth";
import Settings from "./pages/Settings";
import Conversions from "./pages/Conversions";
import CookieConsentBanner from "./components/CookieConsent";
import { LanguageProvider } from "./hooks/useLanguage";
import { useAuth } from "@/hooks/useAuth";

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuth();
  
  if (loading) {
    return <div>Loading...</div>;
  }
  
  if (!user) {
    return <Navigate to="/auth" replace />;
  }
  
  return <>{children}</>;
};

const App = () => (
  <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
    <LanguageProvider>
      <QueryClientProvider client={new QueryClient()}>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/auth" element={<Auth />} />
              <Route path="/settings" element={<Settings />} />
              <Route 
                path="/conversions" 
                element={
                  <ProtectedRoute>
                    <Conversions />
                  </ProtectedRoute>
                } 
              />
              <Route path="/privacy" element={<Privacy />} />
              <Route path="/cookie-policy" element={<CookiePolicy />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
          <CookieConsentBanner />
        </TooltipProvider>
      </QueryClientProvider>
    </LanguageProvider>
  </ThemeProvider>
);

export default App;
